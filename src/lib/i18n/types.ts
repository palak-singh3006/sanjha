export const locales = ["en", "hi", "kn", "te", "ta", "mr", "pa"] as const;
export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  kn: "ಕನ್ನಡ",
  te: "తెలుగు",
  ta: "தமிழ்",
  mr: "मराठी",
  pa: "ਪੰਜਾਬੀ",
};

export type Dict = Record<string, string>;
