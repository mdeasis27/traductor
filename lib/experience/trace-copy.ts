import type { Locale } from "@/design-system/i18n/locale";

const COPY: Record<string, { en: string; es: string }> = {
  "batch.1": { en: "questions 1 to 5 looked up", es: "preguntas 1 a 5 buscadas" },
  "batch.2": { en: "questions 6 to 10 looked up", es: "preguntas 6 a 10 buscadas" },
};
export function traceCopy(locale: Locale, key: string) { return COPY[key]?.[locale] ?? key; }
