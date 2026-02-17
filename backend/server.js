import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// IMPORTANT : autoriser ton frontend (ex: vite = 5173, react = 3000)
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * ============================
 * 1) ROUTE ROLE (celle qui manquait)
 * ============================
 *
 * Frontend appelle :
 * GET /api/sessions/:sessionId/me?token=xxxx
 */
app.get("/api/sessions/:sessionId/me", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const token = req.query.token;

    // ---- MVP simple (pas sécurisé) ----
    // token = "TECH" => technicien
    // token = "PATIENT" => patient

    if (!token) {
      return res.status(401).json({ error: "Missing token" });
    }

    let role = null;

    if (token === "TECH") role = "tech";
    if (token === "PATIENT") role = "patient";

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

/**
 * ============================
 * 2) TA ROUTE TRANSCRIPTION + TRADUCTION
 * ============================
 */
app.post(
  "/api/transcribe-translate",
  upload.single("audio"),
  async (req, res) => {
    try {
      const targetLang = req.body.targetLang || "en";

      if (!req.file) {
        return res.status(400).json({ error: "Aucun fichier audio reçu" });
      }

      // 1) Transcription (Whisper)
      const transcription = await client.audio.transcriptions.create({
        file: new File([req.file.buffer], "audio.webm", {
          type: req.file.mimetype,
        }),
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
  }
);

app.listen(3001, () =>
  console.log("Backend running on http://localhost:3001")
);
