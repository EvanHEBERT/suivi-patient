// server.js
import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

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

// -----------------------------
// Lancement du serveur
// -----------------------------
const PORT = process.env.PORT || 3001;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

export default app;
