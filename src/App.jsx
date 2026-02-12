import { useMemo, useState } from "react";
import { Link } from "react-router-dom"; // Navigation
import logo from "./assets/logo.png";

export default function App() {
  const [lang, setLang] = useState("fr");

  const t = useMemo(() => {
    const translations = {
      fr: {
        langName: "Français",
        tagline: "Votre partenaire santé de confiance",
        heroTitle: "Bienvenue",
        heroSubtitle:
          "Nous nous engageons à fournir des soins de santé de qualité supérieure avec compassion et professionnalisme.",
        btnStart: "Commencer",
        btnContact: "Contactez-nous",
        servicesTitle: "Nos Services",
        s1Title: "Soins de Qualité",
        s1Desc: "Des soins personnalisés adaptés à vos besoins",
        s2Title: "Protection Complète",
        s2Desc: "Une couverture santé complète pour vous et votre famille",
        s3Title: "Support Dédié",
        s3Desc: "Une équipe disponible 24/7 pour vous accompagner",
      },
      en: {
        langName: "English",
        tagline: "Your trusted health partner",
        heroTitle: "Welcome",
        heroSubtitle:
          "We are committed to delivering high-quality healthcare with compassion and professionalism.",
        btnStart: "Get started",
        btnContact: "Contact us",
        servicesTitle: "Our Services",
        s1Title: "Quality Care",
        s1Desc: "Personalized care tailored to your needs",
        s2Title: "Full Protection",
        s2Desc: "Comprehensive health coverage for you and your family",
        s3Title: "Dedicated Support",
        s3Desc: "A team available 24/7 to assist you",
      },
      es: {
        langName: "Español",
        tagline: "Tu socio de salud de confianza",
        heroTitle: "Bienvenido",
        heroSubtitle:
          "Nos comprometemos a ofrecer atención médica de alta calidad con compasión y profesionalismo.",
        btnStart: "Comenzar",
        btnContact: "Contáctanos",
        servicesTitle: "Nuestros Servicios",
        s1Title: "Atención de Calidad",
        s1Desc: "Atención personalizada adaptada a tus necesidades",
        s2Title: "Protección Completa",
        s2Desc: "Cobertura médica completa para ti y tu familia",
        s3Title: "Soporte Dedicado",
        s3Desc: "Un equipo disponible 24/7 para ayudarte",
      },
      pt: {
        langName: "Português",
        tagline: "Seu parceiro de saúde de confiança",
        heroTitle: "Bem-vindo",
        heroSubtitle:
          "Estamos comprometidos em fornecer cuidados de saúde de alta qualidade com compaixão e profissionalismo.",
        btnStart: "Começar",
        btnContact: "Fale conosco",
        servicesTitle: "Nossos Serviços",
        s1Title: "Cuidados de Qualidade",
        s1Desc: "Cuidados personalizados adaptados às suas necessidades",
        s2Title: "Proteção Completa",
        s2Desc: "Cobertura de saúde completa para você e sua família",
        s3Title: "Suporte Dedicado",
        s3Desc: "Uma equipe disponível 24/7 para te acompanhar",
      },
      ar: {
        langName: "العربية",
        tagline: "شريكك الصحي الموثوق",
        heroTitle: "مرحباً بك",
        heroSubtitle:
          "نلتزم بتقديم رعاية صحية عالية الجودة بكل تعاطف واحترافية.",
        btnStart: "ابدأ",
        btnContact: "تواصل معنا",
        servicesTitle: "خدماتنا",
        s1Title: "رعاية عالية الجودة",
        s1Desc: "رعاية مخصصة تناسب احتياجاتك",
        s2Title: "حماية شاملة",
        s2Desc: "تغطية صحية كاملة لك ولعائلتك",
        s3Title: "دعم مخصص",
        s3Desc: "فريق متاح 24/7 لمساعدتك",
      },
      tr: {
        langName: "Türkçe",
        tagline: "Güvenilir sağlık ortağınız",
        heroTitle: "Hoş geldiniz",
        heroSubtitle:
          "Şefkat ve profesyonellikle yüksek kaliteli sağlık hizmeti sunmayı taahhüt ediyoruz.",
        btnStart: "Başla",
        btnContact: "Bize ulaşın",
        servicesTitle: "Hizmetlerimiz",
        s1Title: "Kaliteli Bakım",
        s1Desc: "İhtiyaçlarınıza göre kişiselleştirilmiş bakım",
        s2Title: "Tam Koruma",
        s2Desc: "Siz ve aileniz için kapsamlı sağlık güvencesi",
        s3Title: "Özel Destek",
        s3Desc: "Size yardımcı olmak için 7/24 ekip",
      },
    };
    return translations[lang];
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
          }}
        >
          {/* Logo + Tagline */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: -10 }}>
            <img src={logo} alt="Logo" style={{ height: 44 }} />
            <div style={{ fontSize: 14, color: "#16a34a" }}>{t.tagline}</div>
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
              }}
            >
              <option value="fr">Français🇫🇷</option>
              <option value="en">English🇬🇧</option>
              <option value="es">Español🇪🇸</option>
              <option value="pt">Português🇵🇹</option>
              <option value="ar">العربية🇩🇿🇲🇦🇹🇳</option>
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
          <h1
            style={{
              fontSize: "clamp(44px, 7vw, 68px)",
              fontWeight: 800,
              minHeight: 90,
              color: "#0284c7",
              margin: 0,
              lineHeight: 1.15,
              direction: textDir,
              textAlign: "center",
            }}
          >
            {t.heroTitle}
          </h1>

          <p
            style={{
              fontSize: 20,
              maxWidth: 780,
              minHeight: 80,
              margin: "0 auto",
              lineHeight: 1.6,
              direction: textDir,
              textAlign: "center",
            }}
          >
            {t.heroSubtitle}
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <button style={{ padding: "12px 24px", borderRadius: 12 }}>{t.btnStart}</button>

            {/* Lien vers ContactPage avec texte traduit */}
            <Link to="/contact">
              <button style={{ padding: "12px 24px", borderRadius: 12 }}>{t.btnContact}</button>
            </Link>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div style={{ padding: "60px 0" }}>
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
