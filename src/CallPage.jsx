import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "./assets/logo.png";

export default function CallPage({ lang, setLang }) {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timeoutRef = useRef(null);
  const pageRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [isHovered, setIsHovered] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const translations = {
    fr: {
      tagline: "Votre partenaire santé de confiance",
      title: "Appel vidéo",
      hangup: "Raccrocher",
      cameraOn: "Caméra ON",
      cameraOff: "Caméra OFF",
      micOn: "Micro ON",
      micOff: "Micro OFF",
      fullscreenOn: "Plein écran",
      fullscreenOff: "Quitter Plein Écran",
    },
    en: {
      tagline: "Your trusted health partner",
      title: "Video call",
      hangup: "Hang up",
      cameraOn: "Camera ON",
      cameraOff: "Camera OFF",
      micOn: "Mic ON",
      micOff: "Mic OFF",
      fullscreenOn: "Fullscreen",
      fullscreenOff: "Exit Fullscreen",
    },
    es: {
      tagline: "Tu socio de salud de confianza",
      title: "Videollamada",
      hangup: "Colgar",
      cameraOn: "Cámara ON",
      cameraOff: "Cámara OFF",
      micOn: "Micrófono ON",
      micOff: "Micrófono OFF",
      fullscreenOn: "Pantalla Completa",
      fullscreenOff: "Salir de Pantalla Completa",
    },
    pt: {
      tagline: "Seu parceiro de saúde de confiança",
      title: "Chamada de vídeo",
      hangup: "Desligar",
      cameraOn: "Câmera ON",
      cameraOff: "Câmera OFF",
      micOn: "Micro ON",
      micOff: "Micro OFF",
      fullscreenOn: "Tela Cheia",
      fullscreenOff: "Sair da Tela Cheia",
    },
    ar: {
      tagline: "شريكك الصحي الموثوق",
      title: "مكالمة فيديو",
      hangup: "إنهاء المكالمة",
      cameraOn: "الكاميرا تعمل",
      cameraOff: "الكاميرا متوقفة",
      micOn: "الميكروفون يعمل",
      micOff: "الميكروفون متوقف",
      fullscreenOn: "ملء الشاشة",
      fullscreenOff: "الخروج من ملء الشاشة",
    },
    tr: {
      tagline: "Güvenilir sağlık ortağınız",
      title: "Görüntülü arama",
      hangup: "Kapat",
      cameraOn: "Kamera ON",
      cameraOff: "Kamera OFF",
      micOn: "Mikrofon ON",
      micOff: "Mikrofon OFF",
      fullscreenOn: "Tam Ekran",
      fullscreenOff: "Tam Ekrandan Çık",
    },
  };

  const t = translations[lang] || translations.fr;
  const isRTL = lang === "ar";
  const textDir = isRTL ? "rtl" : "ltr";

  function stopStreamFully() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setMicOn(false);
  }

  async function startCameraAndMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // caméra frontale
        audio: true, // micro
      });

      streamRef.current = stream;

      // Video
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Etat des tracks
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      setCameraOn(!!videoTrack);
      setMicOn(!!audioTrack);
    } catch (err) {
      console.error(err);

      setCameraOn(false);
      setMicOn(false);
    }
  }

  async function toggleCamera() {
    if (!streamRef.current) {
      startCameraAndMic();
      return;
    }

    if (cameraOn) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop(); // Éteint réellement la caméra (lumière OFF)
        streamRef.current.removeTrack(videoTrack);
      }
      setCameraOn(false);
    } else {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        streamRef.current.addTrack(newVideoTrack);
        setCameraOn(true);

        // Si le micro est coupé, le stream était vide/inactif. On force la mise à jour de la vidéo.
        if (!micOn && videoRef.current) {
          videoRef.current.srcObject = streamRef.current;
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  async function toggleMic() {
    if (!streamRef.current) return;

    if (micOn) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.stop(); // Arrête le matériel micro
        streamRef.current.removeTrack(audioTrack);
      }
      setMicOn(false);
    } else {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const newAudioTrack = newStream.getAudioTracks()[0];
        streamRef.current.addTrack(newAudioTrack);
        setMicOn(true);
      } catch (err) {
        console.error(err);
      }
    }
  }

  function hangUp() {
    stopStreamFully();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    navigate("/");
  }

  useEffect(() => {
    startCameraAndMic();
    return () => stopStreamFully();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function handleMouseMove() {
    setIsHovered(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 2000);
  }

  function toggleFullscreen() {
    if (!pageRef.current) return;

    if (!document.fullscreenElement) {
      pageRef.current.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  return (
    <div
      ref={pageRef}
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        background: "black",
        fontFamily: "Arial",
        overflow: "hidden",
        cursor: isHovered ? "default" : "none",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsHovered(false);
      }}
    >
      {/* VIDEO PLEIN ÉCRAN (ARRIÈRE-PLAN) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)",
          zIndex: 0,
        }}
      />

      {/* INTERFACE SUPERPOSÉE (VISIBLE AU SURVOL) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
          pointerEvents: isHovered ? "auto" : "none",
          background: isHovered ? "rgba(0,0,0,0.3)" : "transparent",
        }}
      >
        {/* NAVBAR (HAUT) */}
        <div
          style={{
            padding: "16px 24px",
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src={logo} alt="Logo" style={{ height: 40 }} />
            <div style={{ fontSize: 14, color: "#1e9771" }}>
              {t.tagline}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(255,255,255,0.5)",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: "8px 12px",
            }}
          >
            🌐
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontWeight: 600,
                color: "#0f172a",
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="fr">Français🇫🇷</option>
              <option value="en">English🇬🇧</option>
              <option value="es">Español🇪🇸</option>
              <option value="pt">Português🇵🇹</option>
              <option value="ar">العربية🇲🇦🇹🇳🇩🇿</option>
              <option value="tr">Türkçe🇹🇷</option>
            </select>
          </div>
        </div>

        {/* BOUTONS (BAS) */}
        <div
          style={{
            padding: "40px",
            display: "flex",
            justifyContent: "center",
            gap: 16,
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
          }}
        >
            {/* Caméra */}
            <button
              onClick={toggleCamera}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                background: cameraOn ? "#22c55e" : "#334155",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
                minWidth: 160,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {cameraOn ? t.cameraOn : t.cameraOff}
            </button>

            {/* Micro */}
            <button
              onClick={toggleMic}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                background: micOn ? "#3b82f6" : "#334155",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
                minWidth: 160,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {micOn ? t.micOn : t.micOff}
            </button>

            {/* Plein écran */}
            <button
              onClick={toggleFullscreen}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                background: "#8b5cf6",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
              title={isFullscreen ? t.fullscreenOff : t.fullscreenOn}
            >
              {isFullscreen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>

            {/* Raccrocher */}
            <button
              onClick={hangUp}
              style={{
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                background: "#ef4444",
                color: "white",
                fontWeight: 900,
                cursor: "pointer",
                minWidth: 160,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {t.hangup}
            </button>
        </div>
      </div>
    </div>
  );
}
