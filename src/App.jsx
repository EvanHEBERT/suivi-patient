// App.jsx
import { useEffect, useMemo, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import logo from "./assets/logo.png";
import ContactPage from "./ContactPage.jsx";
import CallPage from "./CallPage.jsx";

export default function App() {
  const [lang, setLang] = useState(() => localStorage.getItem("lang") || "fr");

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage lang={lang} setLang={setLang} />} />
        <Route
          path="/contact"
          element={<ContactPage lang={lang} setLang={setLang} />}
        />
        <Route
          path="/call"
          element={<CallPage lang={lang} setLang={setLang} />}
        />
      </Routes>
    </Router>
  );
}

function HomePage({ lang, setLang }) {
  const t = useMemo(() => {
    const translations = {
      fr: {
        tagline: "Votre partenaire santé de confiance",
        heroTitle: "Bienvenue",
        heroSubtitle:
          "Nous nous engageons à fournir des soins de santé de qualité supérieure avec compassion et professionnalisme.",
        btnContact: "Contactez-nous",
        btnPatient: "Démarrer (Patient)",
        btnTech: "Démarrer (Technicien)",
        servicesTitle: "Nos Services",
        s1Title: "Soins de Qualité",
        s1Desc: "Des soins personnalisés adaptés à vos besoins",
        s2Title: "Protection Complète",
        s2Desc: "Une couverture santé complète pour vous et votre famille",
        s3Title: "Support Dédié",
        s3Desc: "Une équipe disponible 24/7 pour vous accompagner",
      },
      en: {
        tagline: "Your trusted health partner",
        heroTitle: "Welcome",
        heroSubtitle:
          "We are committed to delivering high-quality healthcare with compassion and professionalism.",
        btnContact: "Contact us",
        btnPatient: "Start (Patient)",
        btnTech: "Start (Technician)",
        servicesTitle: "Our Services",
        s1Title: "Quality Care",
        s1Desc: "Personalized care tailored to your needs",
        s2Title: "Full Protection",
        s2Desc: "Comprehensive health coverage for you and your family",
        s3Title: "Dedicated Support",
        s3Desc: "A team available 24/7 to assist you",
      },
      es: {
        tagline: "Tu socio de salud de confianza",
        heroTitle: "Bienvenido",
        heroSubtitle:
          "Nos comprometemos a ofrecer atención médica de alta calidad con compasión y profesionalismo.",
        btnContact: "Contáctanos",
        btnPatient: "Empezar (Paciente)",
        btnTech: "Empezar (Técnico)",
        servicesTitle: "Nuestros Servicios",
        s1Title: "Atención de Calidad",
        s1Desc: "Atención personalizada adaptada a tus necesidades",
        s2Title: "Protección Completa",
        s2Desc: "Cobertura médica completa para ti y tu familia",
        s3Title: "Soporte Dedicado",
        s3Desc: "Un equipo disponible 24/7 para ayudarte",
      },
      pt: {
        tagline: "Seu parceiro de saúde de confiança",
        heroTitle: "Bem-vindo",
        heroSubtitle:
          "Estamos comprometidos em fornecer cuidados de saúde de alta qualidade com compaixão e profissionalismo.",
        btnContact: "Fale conosco",
        btnPatient: "Começar (Paciente)",
        btnTech: "Começar (Técnico)",
        servicesTitle: "Nossos Serviços",
        s1Title: "Cuidados de Qualidade",
        s1Desc: "Cuidados personalizados adaptados às suas necessidades",
        s2Title: "Proteção Completa",
        s2Desc: "Cobertura de saúde completa para você e sua família",
        s3Title: "Suporte Dedicado",
        s3Desc: "Uma equipe disponível 24/7 para te acompanhar",
      },
      ar: {
        tagline: "شريكك الصحي الموثوق",
        heroTitle: "مرحباً بك",
        heroSubtitle:
          "نلتزم بتقديم رعاية صحية عالية الجودة بكل تعاطف واحترافية.",
        btnContact: "تواصل معنا",
        btnPatient: "بدء (مريض)",
        btnTech: "بدء (فني)",
        servicesTitle: "خدماتنا",
        s1Title: "رعاية عالية الجودة",
        s1Desc: "رعاية مخصصة تناسب احتياجاتك",
        s2Title: "حماية شاملة",
        s2Desc: "تغطية صحية كاملة لك ولعائلتك",
        s3Title: "دعم مخصص",
        s3Desc: "فريق متاح 24/7 لمساعدتك",
      },
      tr: {
        tagline: "Güvenilir sağlık ortağınız",
        heroTitle: "Hoş geldiniz",
        heroSubtitle:
          "Şefkat ve profesyonellikle yüksek kaliteli sağlık hizmeti sunmayı taahhüt ediyoruz.",
        btnContact: "Bize ulaşın",
        btnPatient: "Başlat (Hasta)",
        btnTech: "Başlat (Teknisyen)",
        servicesTitle: "Hizmetlerimiz",
        s1Title: "Kaliteli Bakım",
        s1Desc: "İhtiyaçlarınıza göre kişiselleştirilmiş bakım",
        s2Title: "Tam Koruma",
        s2Desc: "Siz ve aileniz için kapsamlı sağlık güvencesi",
        s3Title: "Özel Destek",
        s3Desc: "Size yardımcı olmak için 7/24 ekip",
      },
    };

    return translations[lang] || translations.fr;
  }, [lang]);

  const isRTL = lang === "ar";
  const textDir = isRTL ? "rtl" : "ltr";

  const container = {
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
    paddingLeft: "clamp(16px, 4vw, 80px)",
    paddingRight: "clamp(16px, 4vw, 80px)",
    boxSizing: "border-box",
  };

  const cardStyle = {
    minHeight: 220,
    borderRadius: 18,
    padding: 22,
    boxShadow: "0px 10px 24px rgba(15, 23, 42, 0.06)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    wordBreak: "break-word",
    background: "white",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        overflowX: "hidden",
        background: "linear-gradient(180deg, #f6fbff 0%, #ffffff 55%)",
        fontFamily: "Arial",
        color: "#0f172a",
      }}
    >
      {/* NAVBAR */}
      <div
        style={{
          height: 78,
          background: "white",
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            ...container,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Logo + Tagline */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logo} alt="Logo" style={{ height: 44 }} />
            <div style={{ fontSize: 14, color: "#1e9771" }}>{t.tagline}</div>
          </div>

          {/* Sélecteur de langue */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              borderRadius: 14,
              padding: "10px 12px",
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
      </div>

      {/* HERO */}
      <div
        style={{
          minHeight: 520,
          height: "calc(100vh - 78px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 10,
        }}
      >
        <div
          style={{
            ...container,
            maxWidth: 900,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 18,
          }}
        >
          {/* IMPORTANT : plus de minHeight débile */}
          <h1
            style={{
              fontSize: "clamp(42px, 6vw, 64px)",
              fontWeight: 800,
              color: "#0284c7",
              margin: 0,
              lineHeight: 1.1,
              direction: textDir,
              textAlign: "center",
              paddingTop: 6,
            }}
          >
            {t.heroTitle}
          </h1>

          <p
            style={{
              fontSize: 20,
              maxWidth: 780,
              margin: "0 auto",
              lineHeight: 1.6,
              direction: textDir,
              textAlign: "center",
            }}
          >
            {t.heroSubtitle}
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {/* Bouton Patient */}
            <Link to="/call" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "none",
                  background: "#0284c7",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.btnPatient}
              </button>
            </Link>

            {/* Bouton Technicien */}
            <Link to="/call?role=tech" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "1px solid #0f172a",
                  background: "#0f172a",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.btnTech}
              </button>
            </Link>

            {/* Bouton Contact */}
            <Link to="/contact" style={{ textDecoration: 'none' }}>
              <button
                style={{
                  padding: "12px 24px",
                  borderRadius: 12,
                  border: "1px solid #0284c7",
                  background: "white",
                  color: "#0284c7",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t.btnContact}
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div style={{ padding: "60px 0"                                 }}>
        <div style={container}>
          <h2
            style={{
              textAlign: "center",
              fontSize: 46,
              color: "#0284c7",
              marginBottom: 40,
              direction: textDir,
            }}
          >
            {t.servicesTitle}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 22,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div key={i} style={cardStyle}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    direction: textDir,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {t[`s${i}Title`]}
                </div>
                <div
                  style={{
                    direction: textDir,
                    textAlign: isRTL ? "right" : "left",
                  }}
                >
                  {t[`s${i}Desc`]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
