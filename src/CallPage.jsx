import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import logo from "./assets/logo.png";
import { io } from "socket.io-client";

// v2.1 - Force Update for TURN (4G Fix)
export default function CallPage({ lang, setLang }) {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();

  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const aiIntervalRef = useRef(null);

  const videoZoneRef = useRef(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [isHovered, setIsHovered] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aiActive, setAiActive] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [facingMode, setFacingMode] = useState("user"); // 'user' or 'environment'
  const [isPipHovered, setIsPipHovered] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]); // Pour afficher les logs à l'écran
  
  // --- Chat IA ---
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [aiInput, setAiInput] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // --- Draggable PiP ---
  const [linkCopied, setLinkCopied] = useState(false);
  const [pipPosition, setPipPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---- ROLE via URL (Lecture directe, plus fiable) ----
  const isTech = searchParams.get("role") === "tech";

  // --- IA DEMO STATES (mode technicien) ---
  const [transcript, setTranscript] = useState([
    { who: "Patient", text: "Bonjour, j’ai un souci avec mon appareil..." },
    { who: "Technicien", text: "D’accord, depuis quand avez-vous le problème ?" },
  ]);

  const [suggestedQuestions, setSuggestedQuestions] = useState([
    "Quel est le modèle exact de l’appareil ?",
    "Le problème est-il constant ou intermittent ?",
    "Un message d’erreur apparaît-il ?",
    "Avez-vous déjà essayé de redémarrer complètement ?",
  ]);

  const [checklist, setChecklist] = useState([
    { label: "Vérifier alimentation / batterie", done: false },
    { label: "Redémarrage complet effectué", done: false },
    { label: "Test de connexion réseau", done: false },
    { label: "Vérifier câbles / accessoires", done: false },
  ]);

  const translations = {
    fr: {
      tagline: "Votre partenaire santé de confiance",
      hangup: "Raccrocher",
      cameraOn: "Caméra ON",
      cameraOff: "Caméra OFF",
      micOn: "Micro ON",
      micOff: "Micro OFF",
      switchCamera: "Changer de caméra",
      fullscreenOn: "Plein écran",
      copyLink: "Copier lien patient",
      linkCopied: "Lien copié !",
      fullscreenOff: "Quitter Plein Écran",
      techMode: "Mode technicien",
      aiPanel: "Assistant IA",
      transcription: "Transcription (démo)",
      questions: "Questions suggérées",
      checklist: "Checklist dépannage",
      loading: "Chargement…",
      roleError: "Impossible de récupérer votre rôle pour cette session.",
      startAI: "Activer l'IA",
      stopAI: "Arrêter l'IA",
      listening: "Analyse en cours...",
    },
    en: {
      tagline: "Your trusted health partner",
      hangup: "Hang up",
      cameraOn: "Camera ON",
      cameraOff: "Camera OFF",
      micOn: "Mic ON",
      micOff: "Mic OFF",
      switchCamera: "Switch camera",
      fullscreenOn: "Fullscreen",
      copyLink: "Copy patient link",
      linkCopied: "Link copied!",
      fullscreenOff: "Exit Fullscreen",
      techMode: "Technician Mode",
      aiPanel: "AI Assistant",
      transcription: "Transcription (demo)",
      questions: "Suggested Questions",
      checklist: "Troubleshooting Checklist",
      loading: "Loading...",
      roleError: "Unable to retrieve your role for this session.",
      startAI: "Start AI",
      stopAI: "Stop AI",
      listening: "Listening...",
    },
    es: {
      tagline: "Tu socio de salud de confianza",
      hangup: "Colgar",
      cameraOn: "Cámara ON",
      cameraOff: "Cámara OFF",
      micOn: "Micrófono ON",
      micOff: "Micrófono OFF",
      switchCamera: "Cambiar cámara",
      fullscreenOn: "Pantalla completa",
      copyLink: "Copiar enlace paciente",
      linkCopied: "¡Enlace copiado!",
      fullscreenOff: "Salir de pantalla completa",
      techMode: "Modo Técnico",
      aiPanel: "Asistente IA",
      transcription: "Transcripción (demo)",
      questions: "Preguntas sugeridas",
      checklist: "Lista de verificación",
      loading: "Cargando...",
      roleError: "No se pudo recuperar su rol para esta sesión.",
      startAI: "Activar IA",
      stopAI: "Detener IA",
      listening: "Escuchando...",
    },
    pt: {
      tagline: "Seu parceiro de saúde de confiança",
      hangup: "Desligar",
      cameraOn: "Câmera ON",
      cameraOff: "Câmera OFF",
      micOn: "Microfone ON",
      micOff: "Microfone OFF",
      switchCamera: "Mudar câmera",
      fullscreenOn: "Tela cheia",
      copyLink: "Copiar link do paciente",
      linkCopied: "Link copiado!",
      fullscreenOff: "Sair da tela cheia",
      techMode: "Modo Técnico",
      aiPanel: "Assistente IA",
      transcription: "Transcrição (demo)",
      questions: "Perguntas sugeridas",
      checklist: "Lista de verificação",
      loading: "Carregando...",
      roleError: "Não foi possível recuperar sua função para esta sessão.",
      startAI: "Ativar IA",
      stopAI: "Parar IA",
      listening: "Ouvindo...",
    },
    ar: {
      tagline: "شريكك الصحي الموثوق",
      hangup: "إنهاء المكالمة",
      cameraOn: "كاميرا مشغلة",
      cameraOff: "كاميرا مطفأة",
      micOn: "ميكروفون مشغل",
      micOff: "ميكروفون مطفأ",
      switchCamera: "تبديل الكاميرا",
      fullscreenOn: "ملء الشاشة",
      copyLink: "نسخ رابط المريض",
      linkCopied: "تم نسخ الرابط!",
      fullscreenOff: "خروج من ملء الشاشة",
      techMode: "وضع الفني",
      aiPanel: "مساعد الذكاء الاصطناعي",
      transcription: "نسخ (تجريبي)",
      questions: "أسئلة مقترحة",
      checklist: "قائمة التحقق",
      loading: "جار التحميل...",
      roleError: "تعذر استرداد دورك لهذه الجلسة.",
      startAI: "تفعيل الذكاء الاصطناعي",
      stopAI: "إيقاف الذكاء الاصطناعي",
      listening: "جاري الاستماع...",
    },
    tr: {
      tagline: "Güvenilir sağlık ortağınız",
      hangup: "Kapat",
      cameraOn: "Kamera AÇIK",
      cameraOff: "Kamera KAPALI",
      micOn: "Mikrofon AÇIK",
      micOff: "Mikrofon KAPALI",
      switchCamera: "Kamerayı değiştir",
      fullscreenOn: "Tam Ekran",
      copyLink: "Hasta bağlantısını kopyala",
      linkCopied: "Bağlantı kopyalandı!",
      fullscreenOff: "Tam Ekrandan Çık",
      techMode: "Teknisyen Modu",
      aiPanel: "YZ Asistanı",
      transcription: "Transkripsiyon (demo)",
      questions: "Önerilen Sorular",
      checklist: "Sorun Giderme Listesi",
      loading: "Yükleniyor...",
      roleError: "Bu oturum için rolünüz alınamadı.",
      startAI: "YZ'yi Başlat",
      stopAI: "YZ'yi Durdur",
      listening: "Dinleniyor...",
    },
  };

  const t = translations[lang] || translations.fr;
  const isRTL = lang === "ar";
  const textDir = isRTL ? "rtl" : "ltr";

  // Helper pour afficher les logs à l'écran
  const addLog = (msg) => {
    setDebugLogs((prev) => [...prev.slice(-8), msg]); // Garde les 8 derniers messages
  };

  // ===============================
  // 2) Gestion caméra/micro
  // ===============================
  function stopStreamFully() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setMicOn(false);
  }

  async function startCameraAndMic() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
        audio: true,
      });

      streamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play();
      }

      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      setCameraOn(!!videoTrack);
      setMicOn(!!audioTrack);
      return stream;
    } catch (err) {
      console.error(err);
      setCameraOn(false);
      setMicOn(false);
      return null;
    }
  }

  async function toggleCamera() {
    if (!streamRef.current) { // Should not happen, but as a fallback
      await startCameraAndMic();
      return;
    }

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      // This is the standard and most efficient way to mute/unmute video.
      // It sends black frames instead of stopping the track, avoiding freezes and renegotiation.
      videoTrack.enabled = !videoTrack.enabled;
      setCameraOn(videoTrack.enabled);
    }
  }

  async function toggleMic() {
    if (!streamRef.current) return;

    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMicOn(audioTrack.enabled);
    }
  }

  async function switchCamera() {
    if (!streamRef.current || !isMobile) return;

    const newFacingMode = facingMode === "user" ? "environment" : "user";

    // Stop the current video track to release the camera
    const oldVideoTrack = streamRef.current.getVideoTracks()[0];
    if (oldVideoTrack) {
      oldVideoTrack.stop();
      streamRef.current.removeTrack(oldVideoTrack);
    }

    try {
      // Get a new stream with the new facing mode
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      // Add the new track to our main stream
      streamRef.current.addTrack(newVideoTrack);

      // Also update the track being sent to the other peer
      if (peerRef.current) {
        const sender = peerRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      // If the video element isn't showing the stream, set it.
      if (localVideoRef.current.srcObject !== streamRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }

      // Update the state
      setFacingMode(newFacingMode);
      setCameraOn(true); // Ensure camera is marked as on
    } catch (err) {
      console.error("Error switching camera:", err);
      // If it fails, turn the camera off in the UI
      setCameraOn(false);
    }
  }

  function hangUp() {
    stopStreamFully();
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    navigate("/");
  }

  // --- AI Chat Function ---
  const sendToAI = async (e) => {
    e?.preventDefault();
    if (!aiInput.trim()) return;

    const userMsg = { sender: "user", text: aiInput };
    setAiChatMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setIsAiLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "https://suivi-patient.onrender.com";
      const res = await fetch(`${API_URL}/api/ask-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userMsg.text }),
      });
      const data = await res.json();
      setAiChatMessages((prev) => [...prev, { sender: "ai", text: data.reply || "Erreur IA" }]);
    } catch (err) {
      console.error(err);
      setAiChatMessages((prev) => [...prev, { sender: "ai", text: "Erreur de connexion." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // ===============================
  // 1b) Setup Call (Media + WebRTC + Signaling)
  // ===============================
  useEffect(() => {
    let isMounted = true;
    let localStream = null;
    const iceCandidatesQueue = [];
    
    // Initialisation avec un serveur STUN de secours, sera écrasé par l'API Metered
    let iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

    const createPeerConnection = () => {
      if (peerRef.current) return peerRef.current;

      const pc = new RTCPeerConnection({
        iceServers: iceServers,
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Log pour vérifier si on utilise bien le relais (TURN)
          if (event.candidate.candidate && event.candidate.candidate.includes("relay")) {
            console.log("✅ Candidat RELAY (TURN) trouvé ! La connexion 4G est possible.");
            addLog("✅ RELAY TURN TROUVÉ");
          }
          
          if (socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            candidate: event.candidate,
            roomId: sessionId,
          });
          }
        }
      };

      // AJOUT : Log spécifique pour les erreurs de serveur ICE (STUN/TURN)
      pc.onicecandidateerror = (event) => {
        const err = `❌ ICE ERR: ${event.errorCode} ${event.errorText}`;
        console.error(err);
        addLog(err);
      };

      // Log pour déboguer la connexion (très utile pour voir si ça bloque)
      pc.oniceconnectionstatechange = () => {
        const state = `📡 ICE State: ${pc.iceConnectionState}`;
        console.log(state);
        addLog(state);
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          addLog("❌ ÉCHEC P2P: Réseau trop strict");
          addLog("👉 Essayez de désactiver le WiFi (ou la 4G)");
        }
      };

      // Log pour déboguer la collecte des candidats
      pc.onicegatheringstatechange = () => {
        console.log("📡 Gathering:", pc.iceGatheringState);
        addLog(`📡 Gathering: ${pc.iceGatheringState}`);
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      if (localStream) {
        localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      }

      peerRef.current = pc;
      return pc;
    };

    const processIceQueue = async () => {
      if (!peerRef.current) return;
      while (iceCandidatesQueue.length > 0) {
        const candidate = iceCandidatesQueue.shift();
        try {
          await peerRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.error("Error adding queued ice candidate", e);
        }
      }
    };

    async function setupCall() {
      // 1. Récupération dynamique des identifiants TURN (Metered)
      try {
        const response = await fetch("https://suivi-patient.metered.live/api/v1/turn/credentials?apiKey=bbf51b50a0809c792c55dea1160707c73121");
        const servers = await response.json();
        iceServers = servers;
        console.log("✅ TURN credentials fetched from Metered");
        addLog("✅ TURN Credentials Fetched");
      } catch (err) {
        console.error("❌ Error fetching TURN credentials:", err);
        addLog("⚠️ TURN Fetch Failed");
      }

      const stream = await startCameraAndMic();
      if (!isMounted) return; // Component unmounted
      localStream = stream;

      if (!localStream || !sessionId) {
        console.error("Could not start call: missing local stream or session ID.");
        return;
      }

      // Si on est en local, on tente localhost:3001 par défaut, sinon l'URL Vercel (qui ne marchera pas pour la vidéo mais pour le reste)
      // ⚠️ IMPORTANT : Si vous êtes sur Render, remplacez l'URL ci-dessous par celle de Render si la variable d'env ne marche pas
      // Pour le développement local sur plusieurs appareils (ex: PC + téléphone), utilisez l'IP de votre machine.
      // Sur Mac: Préférences Système > Réseau. Sur Windows: `ipconfig` dans le terminal.
      const defaultUrl = "https://suivi-patient.onrender.com"; // ✅ URL du backend sur Render
      
      const API_URL = import.meta.env.VITE_API_URL || defaultUrl; // VITE_API_URL aura la priorité si défini
      
      const socket = io(API_URL);
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log("🟢 Connecté au serveur de signalisation");
        addLog("🟢 Socket Connecté");
        setSocketConnected(true);
        socket.emit("join-room", sessionId);
      });

      socket.on("disconnect", () => {
        console.log("🔴 Déconnecté du serveur");
        addLog("🔴 Socket Déconnecté");
        setSocketConnected(false);
      });

      socket.on("user-connected", () => {
        console.log("👋 Un autre utilisateur a rejoint la salle !");
        const pc = createPeerConnection();
        pc.createOffer()
          .then(offer => pc.setLocalDescription(offer))
          .then(() => {
            socket.emit("offer", { offer: pc.localDescription, roomId: sessionId });
          })
          .catch(e => console.error("Error creating offer:", e));
      });

      socket.on("offer", async (offer) => {
        console.log("📩 Offre reçue");
        addLog("📩 Offre reçue");
        try {
          const pc = createPeerConnection();
          await pc.setRemoteDescription(offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { answer: pc.localDescription, roomId: sessionId });
          await processIceQueue();
        } catch (e) {
          console.error("❌ Erreur lors de la gestion de l'offre:", e);
          addLog("❌ Erreur Offre");
        }
      });

      socket.on("answer", async (answer) => {
        console.log("📩 Réponse reçue");
        addLog("📩 Réponse reçue");
        try {
          if (peerRef.current) {
            await peerRef.current.setRemoteDescription(answer);
            await processIceQueue();
          }
        } catch (e) {
          console.error("❌ Erreur lors de la gestion de la réponse:", e);
          addLog("❌ Erreur Réponse");
        }
      });

      socket.on("ice-candidate", async (candidate) => {
        if (peerRef.current && peerRef.current.remoteDescription) {
          try {
            await peerRef.current.addIceCandidate(candidate);
          } catch (e) {
            console.error("Error adding received ice candidate", e);
          }
        } else {
          iceCandidatesQueue.push(candidate);
        }
      });
    }

    setupCall();

    return () => {
      isMounted = false;
      stopStreamFully();
      if (socketRef.current) socketRef.current.disconnect();
      if (peerRef.current) peerRef.current.close();
    };
  }, [sessionId]);

  // ===============================
  // 2b) Logique IA (Enregistrement & Analyse)
  // ===============================
  useEffect(() => {
    // Nettoyage si on désactive ou quitte
    if (!aiActive || !isTech) {
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      return;
    }

    // Fonction pour démarrer une boucle d'enregistrement
    const startRecordingLoop = () => {
      // CIBLE : L'audio du patient (Remote) si disponible, sinon soi-même (Local) pour tester
      const targetStream = remoteVideoRef.current?.srcObject || streamRef.current;

      if (!targetStream || targetStream.getAudioTracks().length === 0) {
        console.log("IA: Pas de flux audio à analyser pour le moment.");
        return;
      }

      try {
        const recorder = new MediaRecorder(targetStream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            // Envoi au backend
            const formData = new FormData();
            formData.append("audio", e.data, "chunk.webm");

            try {
              const API_URL = import.meta.env.VITE_API_URL || "https://suivi-patient.onrender.com";
              const res = await fetch(`${API_URL}/api/analyze-conversation`, {
                method: "POST",
                body: formData,
              });
              const data = await res.json();

              if (data.text) {
                setTranscript((prev) => [...prev.slice(-4), { who: "IA (Entendu)", text: data.text }]);
              }
              if (data.questions && data.questions.length > 0) {
                setSuggestedQuestions(data.questions);
              }
              if (data.checklist && data.checklist.length > 0) {
                // On ajoute les nouvelles items de checklist sans doublons simples
                setChecklist((prev) => {
                  const newItems = data.checklist.filter(
                    (newItem) => !prev.some((p) => p.label === newItem.label)
                  );
                  return [...prev, ...newItems];
                });
              }
            } catch (err) {
              console.error("Erreur envoi audio IA", err);
            }
          }
        };

        // Astuce: On démarre et on arrête le recorder toutes les 5s pour forcer l'émission d'un blob valide avec header
        recorder.start();

        aiIntervalRef.current = setInterval(() => {
          if (recorder.state === "recording") {
            recorder.stop();
            // Petit délai pour laisser le stop finir avant de restart (optionnel mais plus sûr)
            setTimeout(() => {
              if (aiActive) recorder.start();
            }, 100);
          }
        }, 5000); // Analyse toutes les 5 secondes
      } catch (err) {
        console.error("Impossible de démarrer MediaRecorder", err);
      }
    };

    if (micOn) {
      startRecordingLoop();
    }

    return () => {
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
    };
  }, [aiActive, isTech, micOn]);

  // ===============================
  // 3) Fullscreen
  // ===============================
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  function toggleFullscreenVideoZone() {
    if (!videoZoneRef.current) return;

    if (!document.fullscreenElement) {
      videoZoneRef.current.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
    } else {
      document.exitFullscreen();
    }
  }

  function handleMouseMove() {
    setIsHovered(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 2000);
  }

  function toggleChecklistItem(index) {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, done: !item.done } : item))
    );
  }

  function copyLink() {
    const url = new URL(window.location.href);
    url.searchParams.set('role', 'patient'); // Force le rôle patient
    navigator.clipboard.writeText(url.toString()).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link: ', err);
    });
  }

  // ===============================
  // 4) Draggable PiP Handlers
  // ===============================
  const handleDragStart = (e) => {
    if (e.target !== localVideoRef.current) return;
    // On ne met pas e.preventDefault() ici pour la compatibilité avec les trackpads.

    const event = e.type === "touchstart" ? e.touches[0] : e;
    const pipEl = localVideoRef.current;
    const containerRect = videoZoneRef.current.getBoundingClientRect();

    let pos = pipPosition;
    // If it's the first drag, calculate position from DOM and set it in state
    if (!pos) {
      const pipRect = pipEl.getBoundingClientRect();
      pos = {
        top: pipRect.top - containerRect.top,
        left: pipRect.left - containerRect.left,
      };
      setPipPosition(pos);
    }

    dragInfoRef.current = {
      offsetX: event.clientX - (pos.left + containerRect.left),
      offsetY: event.clientY - (pos.top + containerRect.top),
    };

    setIsDragging(true);
  };

  const handleDragMove = useCallback((e) => {
    if (!dragInfoRef.current) return;
    e.preventDefault();

    const event = e.type === "touchmove" ? e.touches[0] : e;
    const containerRect = videoZoneRef.current.getBoundingClientRect();

    let newLeft = event.clientX - dragInfoRef.current.offsetX - containerRect.left;
    let newTop = event.clientY - dragInfoRef.current.offsetY - containerRect.top;

    // Boundary checks
    const pipRect = localVideoRef.current.getBoundingClientRect();
    if (newLeft < 0) newLeft = 0;
    if (newTop < 0) newTop = 0;
    if (newLeft + pipRect.width > containerRect.width) {
      newLeft = containerRect.width - pipRect.width;
    }
    if (newTop + pipRect.height > containerRect.height) {
      newTop = containerRect.height - pipRect.height;
    }

    setPipPosition({ top: newTop, left: newLeft });
  }, []); // Dependencies are not needed as refs are stable and state is read via closure

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragInfoRef.current = null;
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDragMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDragMove, { passive: false });
      window.addEventListener("touchend", handleDragEnd);
    }
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDragMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // ===============================
  // UI principale
  // ===============================
  return (
    <div
      dir={textDir}
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        background: "black",
        fontFamily: "Arial",
        overflow: "hidden",
        cursor: isHovered || isMobile ? "default" : "none",
        display: isTech ? "flex" : "block",
        flexDirection: isTech && isMobile ? "column" : "row",
      }}
      onMouseMove={handleMouseMove}
      onClick={handleMouseMove}
      onMouseLeave={() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsHovered(false);
      }}
    >
      {/* DEBUG LOGS OVERLAY (Affiché en bas à gauche) */}
      <div
        style={{
          position: "absolute",
          bottom: 100, // Au-dessus des boutons
          left: 10,
          zIndex: 9999,
          pointerEvents: "none",
          fontSize: "10px",
          fontFamily: "monospace",
          color: "#00ff00",
          background: "rgba(0,0,0,0.7)",
          padding: "5px",
          borderRadius: "4px",
          maxWidth: "200px",
        }}
      >
        {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
      </div>

      {/* ZONE VIDEO */}
      <div
        ref={videoZoneRef}
        style={{
          position: "relative",
          width: isTech && !isMobile ? "70%" : "100%",
          height: isTech && isMobile ? "50%" : "100%",
          overflow: "hidden",
          background: "#1c1c1c",
        }}
      >
        {/* Remote Video (WebRTC) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            background: '#1c1c1c'
          }}
        />

        {/* Local video (PiP) */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          onMouseEnter={() => !isMobile && setIsPipHovered(true)}
          onMouseLeave={() => !isMobile && setIsPipHovered(false)}
          style={{
            position: "absolute",
            ...(pipPosition
              ? {
                  top: `${pipPosition.top}px`,
                  left: `${pipPosition.left}px`,
                }
              : {
                  top: isMobile ? "calc(max(10px, env(safe-area-inset-top)) + 60px)" : "20px",
                  right: "20px",
                }),
            width: isMobile ? "clamp(100px, 25vw, 140px)" : "clamp(160px, 20vw, 240px)",
            borderRadius: "12px",
            border: "2px solid rgba(255,255,255,0.7)",
            boxShadow: "0 5px 15px rgba(0,0,0,0.4)",
            transform: `scaleX(-1) scale(${!isMobile && isPipHovered ? 1.05 : 1})`,
            zIndex: 20,
            opacity: cameraOn ? 1 : 0,
            transition: isDragging ? "none" : "opacity 0.3s, transform 0.2s ease-out",
            background: '#333',
            cursor: isDragging ? "grabbing" : "grab",
          }}
        />

        {/* Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            opacity: isHovered || isMobile ? 1 : 0,
            transition: "opacity 0.3s ease-in-out",
            pointerEvents: isHovered || isMobile ? "auto" : "none",
            background: isHovered || isMobile ? "rgba(0,0,0,0.3)" : "transparent",
          }}
        >
          {/* Navbar */}
          <div
            style={{
              padding: isMobile ? "10px 16px" : "16px 24px",
              paddingTop: isMobile ? "max(10px, env(safe-area-inset-top))" : "16px", // Gestion de l'encoche (Notch)
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "nowrap", // Empêche le passage à la ligne
              gap: 10,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, flexShrink: 1, minWidth: 0 }}>
              {/* Indicateur de connexion Socket */}
              <div
                title={socketConnected ? "Connecté au serveur" : "Déconnecté (Vérifiez le backend)"}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: socketConnected ? "#22c55e" : "#ef4444",
                  boxShadow: socketConnected ? "0 0 8px #22c55e" : "none",
                  flexShrink: 0
                }}
              />
              <img src={logo} alt="Logo" style={{ height: isMobile ? 32 : 40, flexShrink: 0 }} />
              <div style={{ 
                fontSize: isMobile ? 11 : 14,
                color: "#1e9771", 
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}>
                {t.tagline}
              </div>

              {isTech && (
                <div
                  style={{
                    marginLeft: isMobile ? 4 : 12,
                    padding: isMobile ? "4px 8px" : "6px 10px",
                    borderRadius: 999,
                    background: "#0f172a",
                    color: "white",
                    fontWeight: 900,
                    fontSize: isMobile ? 10 : 12,
                    whiteSpace: "nowrap",
                    flexShrink: 0
                  }}
                >
                  🛠️ {isMobile ? "Tech" : t.techMode}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 6 : 10,
                background: "rgba(255,255,255,0.5)",
                border: "1px solid #e5e7eb",
                borderRadius: 14,
                padding: isMobile ? "4px 8px" : "8px 12px",
                flexShrink: 0
              }}
            >
              <span style={{ fontSize: isMobile ? 16 : 20 }}>🌐</span>
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
                  fontSize: isMobile ? 12 : 14,
                  maxWidth: isMobile ? 80 : "auto"
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

          {/* Boutons bas */}
          <div
            style={{
              padding: isMobile ? "20px 10px" : "40px",
              paddingBottom: isMobile ? "max(20px, env(safe-area-inset-bottom))" : "40px", // Gestion de la barre du bas (iPhone)
              display: "flex",
              justifyContent: "center",
              gap: isMobile ? 8 : 16,
              flexWrap: "wrap",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            }}
          >
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
                minWidth: isMobile ? "auto" : 160,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {cameraOn ? t.cameraOn : t.cameraOff}
            </button>

            {isMobile && (
              <button
                onClick={switchCamera}
                style={{
                  padding: "12px",
                  borderRadius: 14,
                  border: "none",
                  background: "#475569",
                  color: "white",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
                title={t.switchCamera}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4" />
                  <path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" />
                </svg>
              </button>
            )}

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
                minWidth: isMobile ? "auto" : 160,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {micOn ? t.micOn : t.micOff}
            </button>

            {!isMobile && (
              <button
                onClick={toggleFullscreenVideoZone}
                style={{
                  padding: "12px",
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
                    strokeWidth="2.5"
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
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                )}
              </button>
            )}

            {isTech && (
              <button
                onClick={copyLink}
                style={{
                  padding: "12px 18px",
                  borderRadius: 14,
                  border: "1px solid #a78bfa",
                  background: linkCopied ? "#a78bfa" : "transparent",
                  color: "white",
                  fontWeight: 900,
                  cursor: "pointer",
                  minWidth: isMobile ? "auto" : 160,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  transition: "background 0.2s",
                }}
              >
                {linkCopied ? t.linkCopied : t.copyLink}
              </button>
            )}

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
                minWidth: isMobile ? "auto" : 160,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              {t.hangup}
            </button>

            {/* Bouton IA pour Technicien */}
            {isTech && (
              <button
                onClick={() => setAiActive(!aiActive)}
                style={{
                  padding: "12px 18px",
                  borderRadius: 14,
                  border: "none",
                  background: aiActive ? "#8b5cf6" : "#1e293b",
                  color: "white",
                  fontWeight: 900,
                  cursor: "pointer",
                  minWidth: isMobile ? "auto" : 160,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  border: aiActive ? "2px solid #c4b5fd" : "none"
                }}
              >
                {aiActive ? "✨ " + t.stopAI : "✨ " + t.startAI}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Panneau technicien */}
      {isTech && (
        <div
          style={{
            width: isMobile ? "100%" : "30%",
            height: isMobile ? "50%" : "100%",
            background: "rgba(15, 23, 42, 0.98)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
            borderTop: isMobile ? "1px solid rgba(255,255,255,0.08)" : "none",
          }}
        >
          {/* Header & Scrollable Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 18 }}>
              🤖 {t.aiPanel} 
              {aiActive && (
                <span style={{ fontSize: 12, color: "#4ade80", marginLeft: 10, animation: "pulse 1.5s infinite" }}>● {t.listening}</span>
              )}
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                🎧 {t.transcription}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {transcript.map((line, idx) => (
                  <div key={idx} style={{ fontSize: 13, lineHeight: 1.35 }}>
                    <span style={{ fontWeight: 900 }}>{line.who} :</span>{" "}
                    <span style={{ opacity: 0.9 }}>{line.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                ❓ {t.questions}
              </div>

              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {suggestedQuestions.map((q, idx) => (
                  <li key={idx} style={{ marginBottom: 8, opacity: 0.92 }}>
                    {q}
                  </li>
                ))}
              </ul>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                ✅ {t.checklist}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {checklist.map((item, idx) => (
                  <label
                    key={idx}
                    style={{
                      display: "flex",
                      gap: 10,
                      fontSize: 13,
                      alignItems: "center",
                      cursor: "pointer",
                      opacity: item.done ? 0.6 : 1,
                      textDecoration: item.done ? "line-through" : "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleChecklistItem(idx)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* AI Chat Section (Fixed at bottom) */}
          <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)" }}>
            <div style={{ fontWeight: 900, fontSize: 14, marginBottom: 8 }}>💬 Discussion IA</div>
            <div style={{ maxHeight: 150, overflowY: "auto", marginBottom: 8, display: "flex", flexDirection: "column", gap: 6 }}>
               {aiChatMessages.map((msg, i) => (
                 <div key={i} style={{ 
                   alignSelf: msg.sender === "user" ? "flex-end" : "flex-start", 
                   background: msg.sender === "user" ? "#3b82f6" : "#334155", 
                   padding: "6px 10px", 
                   borderRadius: 8, 
                   fontSize: 12,
                   maxWidth: "85%"
                 }}>
                   {msg.text}
                 </div>
               ))}
               {isAiLoading && <div style={{ fontSize: 11, fontStyle: "italic", opacity: 0.6 }}>L'IA réfléchit...</div>}
            </div>
            <form onSubmit={sendToAI} style={{ display: "flex", gap: 6 }}>
              <input 
                value={aiInput} 
                onChange={e => setAiInput(e.target.value)} 
                placeholder="Posez une question..." 
                style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "8px 10px", color: "white", fontSize: 13, outline: "none" }} 
              />
              <button type="submit" style={{ background: "#3b82f6", border: "none", borderRadius: 6, padding: "0 12px", color: "white", cursor: "pointer" }}>➤</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
