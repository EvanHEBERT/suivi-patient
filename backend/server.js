// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn("⚠️ GEMINI_API_KEY manquante. L'IA est désactivée.");
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

    if (!genAI) {
      return res.status(503).json({ error: "Service IA indisponible (Clé manquante)" });
    }

    // Configuration du modèle Gemini Flash (rapide et multimodal)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Tu es un traducteur médical expert.
      1. Transcris l'audio fourni (qui est en français).
      2. Traduis cette transcription en "${targetLang}".
      Réponds UNIQUEMENT avec ce JSON : { "frenchText": "...", "translatedText": "..." }
    `;

    const audioPart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const result = await model.generateContent([prompt, audioPart]);
    const response = await result.response;
    const { frenchText, translatedText } = JSON.parse(response.text());

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

    if (!genAI) {
      return res.json({ text: "", questions: [], checklist: [] });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const systemPrompt = `
      Tu es un assistant IA expert pour un technicien de support technique.
      Ton périmètre est STRICTEMENT restreint au support technique d'équipements médicaux et au suivi patient.
      Si le texte analysé ne concerne pas ce domaine, renvoie des listes vides.
      
      Analyse l'audio fourni.
      Tâche :
      1. Transcris l'audio (clé "text").
      2. Suggère 3 questions pertinentes que le technicien devrait poser maintenant (clé "questions").
      3. Suggère des actions pour la checklist de dépannage (clé "checklist").
      
      Réponds UNIQUEMENT au format JSON :
      {
        "text": "Transcription de l'audio...",
        "questions": ["question 1", "question 2", "question 3"],
        "checklist": [
          { "label": "Action suggérée 1", "done": false },
          { "label": "Action suggérée 2", "done": false }
        ]
      }
    `;

    const audioPart = {
      inlineData: {
        data: req.file.buffer.toString("base64"),
        mimeType: req.file.mimetype,
      },
    };

    const result = await model.generateContent([systemPrompt, audioPart]);
    const analysis = JSON.parse(result.response.text());

    res.json({
      text: analysis.text || "",
      questions: analysis.questions || [],
      checklist: analysis.checklist || [],
    });
  } catch (err) {
    console.error("❌ Erreur Analyse IA:", err);
    let errorMessage = "Erreur analyse IA";
    // Gestion simplifiée des erreurs Gemini
    if (err.message && err.message.includes("API key")) {
      errorMessage = "Clé API Gemini invalide.";
    } 
    res.status(500).json({ error: errorMessage });
  }
});

// =============================
// 4) ROUTE QUESTION IA (TEXTE)
// =============================
app.post("/api/ask-ai", async (req, res) => {
  try {
    const { text } = req.body;
    if (!genAI) return res.json({ reply: "IA non configurée." });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
      Tu es un assistant expert pour technicien médical. 
      Ton domaine est STRICTEMENT limité au support technique d'équipements médicaux et au suivi patient. 
      Si la question est hors sujet, refuse poliment. Réponds de façon concise.
      Question: ${text}
    `;

    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() });
  } catch (err) {
    console.error("❌ Erreur Gemini:", err);
    let errorMessage = err.message || "Erreur interne IA";
    // On renvoie le message d'erreur précis pour aider au débogage
    res.status(500).json({ error: errorMessage });
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
