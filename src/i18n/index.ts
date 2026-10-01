import { BASE } from "./base";
import { UI } from "./ui";

// All texts of the app by language: the short shared ones (t.income, t.save…) plus the
// ones grouped by area (t.goalsTab.newGoal, t.common.delete…). Components get them as
// `t` from useSettings(); plain functions (e.g. insights.ts) take them with messagesFor().
export const MESSAGES = {
  es: { ...BASE.es, ...UI.es },
  en: { ...BASE.en, ...UI.en },
};

export type Lang = keyof typeof MESSAGES;
export type Messages = (typeof MESSAGES)["es"];

// Unknown languages (an old value in localStorage) fall back to Spanish.
export const messagesFor = (lang: string): Messages => MESSAGES[lang as Lang] ?? MESSAGES.es;
