import { useState, useEffect } from "react";
import logo from "./assets/logo.png";

export default function ContactPage({ langProp = "fr" }) {
  const [lang, setLang] = useState(langProp);

  // Mettre à jour si langProp change depuis la page principale
  useEffect(() => {
    setLang(langProp);
  }, [langProp]);

  const translations = {
    fr: {
      tagline: "Votre partenaire santé de confiance",
      title: "Contactez-nous",
      phone: "Téléphone",
      fax: "Fax",
      email: "E-mail",
      address: "Adresse",
      website: "Site web",
    },
    en: {
      tagline: "Your trusted health partner",
      title: "Contact us",
      phone: "Phone",
      fax: "Fax",
      email: "E-mail",
      address: "Address",
      website: "Website",
    },
    es: {
      tagline: "Tu socio de salud de confianza",
      title: "Contáctanos",
      phone: "Teléfono",
      fax: "Fax",
      email: "Correo electrónico",
      address: "Dirección",
      website: "Sitio web",
    },
    pt: {
      tagline: "Seu parceiro de saúde de confiança",
      title: "Fale conosco",
      phone: "Telefone",
      fax: "Fax",
      email: "E-mail",
      address: "Endereço",
      website: "Site",
    },
    ar: {
      tagline: "شريكك الصحي الموثوق",
      title: "تواصل معنا",
      phone: "هاتف",
      fax: "فاكس",
      email: "البريد الإلكتروني",
      address: "العنوان",
      website: "الموقع الإلكتروني",
    },
    tr: {
      tagline: "Güvenilir sağlık ortağınız",
      title: "Bize ulaşın",
      phone: "Telefon",
      fax: "Faks",
      email: "E-posta",
      address: "Adres",
      website: "Web sitesi",
    },
  };

  const t = translations[lang];

  const container = {
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
    paddingLeft: "clamp(16px, 4vw, 80px)",
    paddingRight: "clamp(16px, 4vw, 80px)",
    boxSizing: "border-box",
  };

  const rowStyle = {
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  };

  const labelStyle = {
    color: "#0284c7", // bleu pour le label
    fontWeight: 600,
    marginRight: 6,
  };

  const valueStyle = {
    color: "#0f172a", // noir pour la valeur
    fontWeight: 400,
  };

  return (
    <div style={{ minHeight: "100vh", fontFamily: "Arial", background: "#f6fbff" }}>
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

      {/* CONTENU DE LA PAGE CONTACT */}
      <div style={{ ...container, paddingTop: 40, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 36, color: "#0284c7", marginBottom: 30, textAlign: "center" }}>
          {t.title}
        </h1>

        <div style={rowStyle}>
          <span style={labelStyle}>{t.phone}:</span>
          <span style={valueStyle}>01 47 90 76 40</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>{t.fax}:</span>
          <span style={valueStyle}>01 47 90 76 48</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>{t.email}:</span>
          <span style={valueStyle}>administratif@asvsante.fr</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>{t.address}:</span>
          <span style={valueStyle}>125 avenue Louis Roche - 92230 GENNEVILLIERS</span>
        </div>

        <div style={rowStyle}>
          <span style={labelStyle}>{t.website}:</span>
          <span style={valueStyle}>www.asvsante.fr</span>
        </div>
      </div>
    </div>
  );
}
