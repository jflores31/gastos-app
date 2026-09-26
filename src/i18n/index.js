import { BASE } from "./base.js";
import { UI } from "./ui.js";

// All texts of the app by language: the short shared ones (t.income, t.save…) plus the
// ones grouped by area (t.goalsTab.newGoal, t.common.delete…). Components get them as
// `t` from useSettings(); plain functions (e.g. helpers.js) take them with messagesFor().
export const MESSAGES = {
  es: { ...BASE.es, ...UI.es },
  en: { ...BASE.en, ...UI.en },
};

export const messagesFor = (lang) => MESSAGES[lang] ?? MESSAGES.es;
