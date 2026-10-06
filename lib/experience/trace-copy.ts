import type { Locale } from "@/design-system/i18n/locale";

const COPY: Record<string, { en: string; es: string }> = {
  "ask.served": { en: "answered from shelves the librarian knows", es: "respondida con estantes que conoce el bibliotecario" },
  "ask.rerouted": { en: "refused: a shelf the librarian never catalogued", es: "rechazada: un estante que el bibliotecario nunca catalogó" },
  "ask.lost": { en: "wrong answer", es: "respuesta equivocada" },
};
export function traceCopy(locale: Locale, key: string) { return COPY[key]?.[locale] ?? key; }
