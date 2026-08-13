import en from "./en";
import ar from "./ar";

export type Locale = "en" | "ar";

export const translations = { en, ar };

export function getTranslation(locale: Locale) {
  return translations[locale] ?? translations.en;
}

export { en, ar };
