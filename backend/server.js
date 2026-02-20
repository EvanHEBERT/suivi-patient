// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// -----------------------------
// CORS
// -----------------------------
app.use(
  cors({
    // ⚠️ EN PROD : Remplacez "*" par votre URL frontend pour la sécurité
    // Pour le débogage, on autorise tout le monde :
    origin: "*",
    credentials: true,
  })
);

app.use(express.json());

// -----------------------------
// Socket.io (Signaling)
// -----------------------------
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  let currentRoomId = null;
  console.log("✅ New client connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    currentRoomId = roomId;
    // ⚠️ CRITIQUE : On s'assure que l'émetteur ne reçoit PAS son propre message
    socket.broadcast.to(roomId).emit("user-connected", socket.id);
  });

  socket.on("offer", (payload) => {
    socket.to(payload.roomId).emit("offer", payload.offer);
  });

  socket.on("answer", (payload) => {
    socket.to(payload.roomId).emit("answer", payload.answer);
  });

  socket.on("ice-candidate", (payload) => {
    socket.to(payload.roomId).emit("ice-candidate", payload.candidate);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
    if (currentRoomId) {
      socket.to(currentRoomId).emit("user-disconnected", socket.id);
    }
  });
});

// -----------------------------
// Multer pour upload audio
// -----------------------------
const upload = multer({ storage: multer.memoryStorage() });

// -----------------------------
// Client OpenAI
// -----------------------------
let client;
if (process.env.OPENAI_API_KEY) {
  client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
  console.warn("⚠️ OPENAI_API_KEY manquante. L'IA est désactivée.");
}

// =============================
// 0) ROUTE RACINE (Health Check)
// =============================
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// =============================
// 1) ROUTE ROLE
// =============================
app.get("/api/sessions/:sessionId/me", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const token = req.query.token;

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    let role = null;
    if (token.toUpperCase() === "TECH") role = "tech";
    if (token.toUpperCase() === "PATIENT") role = "patient";

    if (!role) {
      return res.status(403).json({ error: "Invalid token" });
    }

    return res.json({
      sessionId,
      role,
      userName: role === "tech" ? "Technicien" : "Patient",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// =============================
// 2) ROUTE TRANSCRIPTION + TRADUCTION
// =============================
app.post("/api/transcribe-translate", upload.single("audio"), async (req, res) => {
  try {
    const targetLang = req.body.targetLang || "en";

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier audio reçu" });
    }

    if (!client) {
      return res.status(503).json({ error: "Service IA indisponible (Clé manquante)" });
    }

    // 1) Transcription (Whisper)
    const transcription = await client.audio.transcriptions.create({
      file: new Blob([req.file.buffer], { type: req.file.mimetype }), // Node 18+ / Vite
      model: "whisper-1",
      language: "fr",
    });

    const frenchText = transcription.text;

    // 2) Traduction (LLM)
    const translation = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu es un traducteur médical. Traduction courte, claire, fidèle, sans inventer.",
        },
        {
          role: "user",
          content: `Traduis en ${targetLang} : ${frenchText}`,
        },
      ],
    });

    const translatedText = translation.choices[0].message.content;

    res.json({
      frenchText,
      translatedText,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
});

// =============================
// 3) ROUTE ANALYSE CONVERSATION (IA)
// =============================
app.post("/api/analyze-conversation", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier audio" });
    }

    if (!client) {
      return res.json({ text: "", questions: [], checklist: [] });
    }

    // 1. Transcription
    const transcription = await client.audio.transcriptions.create({
      file: new Blob([req.file.buffer], { type: req.file.mimetype }),
      model: "whisper-1",
      language: "fr",
    });

    const text = transcription.text;
    
    // Si pas assez de texte, on ignore
    if (!text || text.length < 5) {
      return res.json({ text: "", questions: [], checklist: [] });
    }

    // 2. Analyse LLM pour extraire questions et checklist
    const systemPrompt = `
      Tu es un assistant IA expert pour un technicien de support technique.
      Ton périmètre est STRICTEMENT restreint au support technique d'équipements médicaux et au suivi patient.
      Si le texte analysé ne concerne pas ce domaine, renvoie des listes vides.
      
      Analyse ce fragment de conversation.
      Tâche :
      1. Suggère 3 questions pertinentes que le technicien devrait poser maintenant pour avancer le diagnostic.
      2. Suggère des actions pour la checklist de dépannage (si pertinent).
      
      Réponds UNIQUEMENT au format JSON :
      {
        "questions": ["question 1", "question 2", "question 3"],
        "checklist": [
          { "label": "Action suggérée 1", "done": false },
          { "label": "Action suggérée 2", "done": false }
        ]
      }
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Transcription: "${text}"` },
      ],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    res.json({
      text,
      questions: analysis.questions || [],
      checklist: analysis.checklist || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur analyse IA" });
  }
});

// =============================
// 4) ROUTE QUESTION IA (TEXTE)
// =============================
app.post("/api/ask-ai", async (req, res) => {
  try {
    const { text } = req.body;
    if (!client) return res.json({ reply: "IA non configurée." });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Tu es un assistant expert pour technicien médical. Ton domaine est STRICTEMENT limité au support technique d'équipements médicaux et au suivi patient. Si la question est hors sujet, refuse poliment. Réponds de façon concise."
        },
        { role: "user", content: text }
      ]
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("❌ Erreur OpenAI:", err);
    // On renvoie le message d'erreur précis pour aider au débogage
    res.status(500).json({ error: err.message || "Erreur interne IA" });
  }
});

// -----------------------------
// Lancement du serveur
// -----------------------------
const PORT = process.env.PORT || 3001;
 
httpServer.listen(PORT, () => {
  // Ce log sera visible dans les logs de Render au démarrage
  console.log(`✅ Backend server listening on port ${PORT}`);
});
