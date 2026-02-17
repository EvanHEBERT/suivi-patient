// ContactPage.jsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import logo from "./assets/logo.png";

export default function ContactPage({ lang, setLang }) {
  const translations = useMemo(() => {
    return {
      fr: {
        tagline: "Votre partenaire santé de confiance",
        contactTitle: "Contactez-nous",
        phone: "Téléphone",
        fax: "Fax",
        email: "E-mail",
        postalAddress: "Adresse postale",
        website: "Site internet",
        back: "Retour",
      },
      en: {
        tagline: "Your trusted health partner",
        contactTitle: "Contact us",
        phone: "Phone",
        fax: "Fax",
        email: "Email",
        postalAddress: "Postal Address",
        website: "Website",
        back: "Back",
      },
      es: {
        tagline: "Tu socio de salud de confianza",
        contactTitle: "Contáctanos",
        phone: "Teléfono",
        fax: "Fax",
        email: "Correo electrónico",
        postalAddress: "Dirección postal",
        website: "Sitio web",
        back: "Volver",
      },
      pt: {
        tagline: "Seu parceiro de saúde de confiança",
        contactTitle: "Fale conosco",
        phone: "Telefone",
        fax: "Fax",
        email: "E-mail",
        postalAddress: "Endereço postal",
        website: "Website",
        back: "Voltar",
      },
      ar: {
        tagline: "شريكك الصحي الموثوق",
        contactTitle: "تواصل معنا",
        phone: "هاتف",
        fax: "فاكس",
        email: "البريد الإلكتروني",
        postalAddress: "العنوان البريدي",
        website: "الموقع الإلكتروني",
        back: "رجوع",
      },
      tr: {
        tagline: "Güvenilir sağlık ortağınız",
        contactTitle: "Bize ulaşın",
        phone: "Telefon",
        fax: "Faks",
        email: "E-posta",
        postalAddress: "Posta adresi",
        website: "Web sitesi",
        back: "Geri",
      },
    };
  }, []);

  const t = translations[lang] || translations.fr;

  const isRTL = lang === "ar";
  const textDir = isRTL ? "rtl" : "ltr";

  const companyData = {
    phone: "01 47 90 76 40",
    fax: "01 47 90 76 48",
    email: "administratif@asvsante.fr",
    postalAddress: "125 avenue Louis Roche - 92230 GENNEVILLIERS",
    website: "www.asvsante.fr",
  };

  const container = {
    width: "100%",
    maxWidth: 1280,
    margin: "0 auto",
    paddingLeft: "clamp(16px, 4vw, 80px)",
    paddingRight: "clamp(16px, 4vw, 80px)",
    boxSizing: "border-box",
  };

  const labelStyle = {
    fontSize: 16,
    fontWeight: 800,
    color: "#0284c7",
    marginBottom: 6,
    textAlign: "center",
    direction: textDir,
  };

  const valueStyle = {
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 22,
    textAlign: "center",
    direction: textDir,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: "Arial",
        background: "#f6fbff",
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
            flexWrap: "wrap",
          }}
        >
          {/* Logo + Tagline */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={logo} alt="Logo" style={{ height: 44 }} />
            <span style={{ fontSize: 14, color: "#1e9771" }}>{t.tagline}</span>
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
              padding: "6px 10px",
            }}
          >
            🌐
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                fontWeight: 700,
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

      {/* CONTENT */}
      <div style={{ ...container, paddingTop: 60, paddingBottom: 60 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <Link to="/" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "10px 18px",
                borderRadius: 12,
                border: "1px solid #0284c7",
                background: "white",
                color: "#0284c7",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ← {t.back}
            </button>
          </Link>
        </div>

        <h1
          style={{
            fontSize: 36,
            color: "#0284c7",
            marginBottom: 40,
            textAlign: "center",
            direction: textDir,
          }}
        >
          {t.contactTitle}
        </h1>

        <div>
          {Object.keys(companyData).map((key) => (
            <div key={key}>
              <div style={labelStyle}>{t[key]}</div>
              <div style={valueStyle}>{companyData[key]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
