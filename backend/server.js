// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import MistralClient from "@mistralai/mistralai";

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
// Client Mistral
// -----------------------------
let mistral;
if (process.env.MISTRAL_API_KEY) {
  mistral = new MistralClient(process.env.MISTRAL_API_KEY);
} else {
  console.warn("⚠️ MISTRAL_API_KEY manquante. L'IA est désactivée.");
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

    if (!mistral) {
      return res.status(503).json({ error: "Service IA non configuré (clé API manquante)." });
    }

    // 1. Transcription de l'audio avec l'API Mistral (via fetch car non inclus dans le client)
    const formData = new FormData();
    formData.append('file', new Blob([req.file.buffer]), req.file.originalname);
    formData.append('model', 'whisper-large'); // Modèle de transcription de Mistral

    const transcriptionResponse = await fetch("https://api.mistral.ai/v1/audio/transcriptions", {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` },
        body: formData,
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`Erreur API Transcription Mistral: ${transcriptionResponse.statusText}`);
    }
    const transcriptionResult = await transcriptionResponse.json();
    const frenchText = transcriptionResult.text;

    // 2. Traduction du texte avec l'API Chat
    const translatePrompt = `Tu es un traducteur médical expert. Traduis le texte suivant en "${targetLang}". Réponds UNIQUEMENT avec le texte traduit.`;
    const chatResponse = await mistral.chat({
        model: 'mistral-large-latest',
        messages: [
            { role: 'system', content: translatePrompt },
            { role: 'user', content: frenchText }
        ],
    });
    const translatedText = chatResponse.choices[0].message.content;

    res.json({
      frenchText,
      translatedText,
    });
  } catch (err) {
    console.error("❌ Erreur IA (Mistral):", err);
    let errorMessage = "Erreur interne du service IA.";
    if (err.status === 401) {
        errorMessage = "Clé API Mistral invalide ou manquante.";
    }
    res.status(err.status || 500).json({ error: errorMessage, details: err.message });
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

    if (!mistral) {
      return res.status(503).json({ error: "Service IA non configuré (clé API manquante)." });
    }

    // 1. Transcription de l'audio
    const formData = new FormData();
    formData.append('file', new Blob([req.file.buffer]), 'audio.webm');
    formData.append('model', 'whisper-large');

    const transcriptionResponse = await fetch("https://api.mistral.ai/v1/audio/transcriptions", {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` },
        body: formData,
    });

    if (!transcriptionResponse.ok) {
      throw new Error(`Erreur API Transcription Mistral: ${transcriptionResponse.statusText}`);
    }
    const transcriptionResult = await transcriptionResponse.json();
    const transcribedText = transcriptionResult.text;

    // 2. Analyse du texte transcrit pour générer questions et checklist
    const systemPrompt = `Tu es un assistant IA expert pour un technicien de support technique. Ton périmètre est STRICTEMENT restreint au support technique d'équipements médicaux et au suivi patient. Si le texte analysé ne concerne pas ce domaine, renvoie des listes vides. Analyse le texte de l'utilisateur. Tâche : Suggère 3 questions pertinentes que le technicien devrait poser maintenant (clé "questions"). Suggère des actions pour la checklist de dépannage (clé "checklist"). Réponds UNIQUEMENT au format JSON avec la structure suivante, sans texte additionnel: { "questions": ["question 1", "question 2", "question 3"], "checklist": [ { "label": "Action suggérée 1", "done": false }, { "label": "Action suggérée 2", "done": false } ] }`;

    const analysisResponse = await mistral.chat({
        model: 'mistral-large-latest',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcribedText }
        ],
        response_format: { type: 'json_object' }
    });

    const analysis = JSON.parse(analysisResponse.choices[0].message.content);

    res.json({
      text: transcribedText,
      questions: analysis.questions || [],
      checklist: analysis.checklist || [],
    });
  } catch (err) {
    console.error("❌ Erreur IA (Mistral):", err);
    const status = err.status || 500;
    let errorMessage = "Erreur interne du service IA.";
    if (status === 401) {
        errorMessage = "Clé API Mistral invalide ou manquante.";
    } else if (status === 429) {
        errorMessage = "Trop de requêtes envoyées à l'API Mistral. Veuillez patienter.";
    } else if (err.message.includes("Erreur API Transcription Mistral")) {
        errorMessage = "Erreur lors de la transcription audio avec Mistral.";
    }
    res.status(status).json({ error: errorMessage, details: err.message });
  }
});

// =============================
// 4) ROUTE QUESTION IA (TEXTE)
// =============================
app.post("/api/ask-ai", async (req, res) => {
  try {
    const { text } = req.body;
    if (!mistral) {
      return res.status(503).json({ error: "Service IA non configuré (clé API manquante)." });
    }

    const prompt = `
      Tu es un assistant expert pour technicien médical. 
      Ton domaine est STRICTEMENT limité au support technique d'équipements médicaux et au suivi patient. 
      Si la question est hors sujet, refuse poliment. Réponds de façon concise.
    `;

    const chatResponse = await mistral.chat({
        model: 'mistral-large-latest',
        messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: text }
        ]
    });

    res.json({ reply: chatResponse.choices[0].message.content });
  } catch (err) {
    console.error("❌ Erreur IA (Mistral):", err);
    let errorMessage = "Erreur interne du service IA.";
    if (err.status === 401) {
        errorMessage = "Clé API Mistral invalide ou manquante.";
    }
    res.status(err.status || 500).json({ error: errorMessage, details: err.message });
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
