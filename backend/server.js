import { useRef, useState } from "react";

export default function App() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [recording, setRecording] = useState(false);
  const [frenchText, setFrenchText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("en");
  const [loading, setLoading] = useState(false);

  async function startRecording() {
    setFrenchText("");
    setTranslatedText("");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });

    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("audio", blob, "audio.webm");
      formData.append("targetLang", targetLang);

      setLoading(true);

      try {
        const res = await fetch("/api/transcribe-translate", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        setFrenchText(data.frenchText || "");
        setTranslatedText(data.translatedText || "");
      } catch (err) {
        console.error(err);
        alert("Erreur : impossible d'appeler le serveur.");
      } finally {
        setLoading(false);
      }
    };

    mediaRecorder.start();
    setRecording(true);
  }

  function stopRecording() {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 30, maxWidth: 900 }}>
      <h1>Reconnaissance vocale + Traduction (DEG)</h1>

      <div style={{ marginBottom: 15 }}>
        <label>Langue du patient : </label>
        <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="pt">Português</option>
          <option value="ar">اَلْعَرَبِيَّةُ</option>
          <option value="tr">Türkçe</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        {!recording ? (
          <button onClick={startRecording} style={{ padding: 10 }}>
            🎤 Démarrer enregistrement
          </button>
        ) : (
          <button onClick={stopRecording} style={{ padding: 10 }}>
            ⏹️ Stop
          </button>
        )}
      </div>

      {loading && <p>⏳ Transcription + traduction en cours...</p>}

      <div style={{ marginTop: 25 }}>
        <h3>Texte reconnu (FR)</h3>
        <div style={{ background: "#eee", padding: 15, borderRadius: 10 }}>
          {frenchText || "—"}
        </div>
      </div>

      <div style={{ marginTop: 25 }}>
        <h3>Traduction</h3>
        <div style={{ background: "#e7f0ff", padding: 15, borderRadius: 10 }}>
          {translatedText || "—"}
        </div>
      </div>
    </div>
  );
}
