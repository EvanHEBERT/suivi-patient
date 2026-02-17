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
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

// -----------------------------
// Socket.io (Signaling)
// -----------------------------
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    // Notifier les autres
    socket.to(roomId).emit("user-connected", socket.id);
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
});

// -----------------------------
// Multer pour upload audio
// -----------------------------
const upload = multer({ storage: multer.memoryStorage() });

// -----------------------------
// Client OpenAI
// -----------------------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    // 1) Transcription (Whisper)
    const transcription = await client.audio.transcriptions.create({
      file: new Blob([req.file.buffer], { type: req.file.mimetype }), // Node 18+ / Vite
      model: "gpt-4o-mini-transcribe",
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

// -----------------------------
// Lancement du serveur
// -----------------------------
const PORT = process.env.PORT || 3001;

if (!process.env.VERCEL) {
  httpServer.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

export default app;
