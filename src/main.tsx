import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { IntlProvider } from "react-intl";
import App from "./App.tsx";

import messagesEn from "./locales/en.json";
import messagesSr from "./locales/sr.json";

const messages = {
  en: messagesEn,
  sr: messagesSr,
};

const getSavedLocale = () => {
  const saved = localStorage.getItem("locale");
  if (saved === "en" || saved === "sr") return saved;

  const browserLang = navigator.language.split(/[-_]/)[0];
  return browserLang === "en" || browserLang === "sr" ? browserLang : "sr";
};
function Root() {
  const [locale, setLocale] = useState(getSavedLocale());

  return (
    <StrictMode>
      <IntlProvider
        messages={messages[locale as keyof typeof messages]}
        locale={locale}
        defaultLocale="sr"
      >
        <BrowserRouter>
          <App setLocale={setLocale} />
        </BrowserRouter>
      </IntlProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
