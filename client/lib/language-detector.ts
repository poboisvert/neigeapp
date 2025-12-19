/**
 * Detects language from Accept-Language header, matching the behavior of
 * i18next-browser-languagedetector's "navigator" option.
 *
 * The browser's navigator.language corresponds to the first/preferred language
 * in the Accept-Language header, which is what this function returns.
 */
export function detectLanguageFromHeaders(headers: Headers): string {
  const acceptLanguage = headers.get("accept-language");
  const supportedLngs = ["en", "fr"];
  const fallbackLng = "en";

  if (!acceptLanguage) {
    return fallbackLng;
  }

  // Parse Accept-Language header
  // Format: "fr-CA,fr;q=0.9,en;q=0.8" or "en-US,en;q=0.9,fr;q=0.8"
  const languages = acceptLanguage
    .split(",")
    .map((lang) => {
      const [code, q = "q=1"] = lang.trim().split(";");
      // Extract base language code (e.g., 'fr' from 'fr-CA')
      const baseCode = code.split("-")[0].toLowerCase();
      const quality = parseFloat(q.replace("q=", ""));
      return { code: baseCode, quality };
    })
    // Sort by quality (highest first) - this matches browser's preference order
    .sort((a, b) => b.quality - a.quality);

  // Get the first/preferred language (matches navigator.language behavior)
  const preferredLang = languages[0]?.code;

  // Check if preferred language is supported
  if (preferredLang && supportedLngs.includes(preferredLang)) {
    return preferredLang;
  }

  // If preferred language is not supported, check other languages in order
  for (const lang of languages) {
    if (supportedLngs.includes(lang.code)) {
      return lang.code;
    }
  }

  // Default to fallback language
  return fallbackLng;
}
