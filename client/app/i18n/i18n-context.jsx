"use client";
//https://github.com/alibaba/react-intl-universal
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import React, { useMemo, useContext } from "react";
import {
  I18nextProvider as Provider,
  initReactI18next,
  I18nContext,
} from "react-i18next";

import { getOptions } from "./settings";

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend((language, namespace) =>
      import(`./locales/${language}/${namespace}.json`)
    )
  )
  .init({
    ...getOptions(),
    detection: {
      caches: ["cookie"],
    },
  });

export function I18nProvider({ children, language }) {
  useMemo(() => {
    i18next.changeLanguage(language);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Provider i18n={i18next}>{children}</Provider>;
}

export const MyContext = () => useContext(I18nContext);
