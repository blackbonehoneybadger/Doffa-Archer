/** DOFA ARENA 3D shell copy — RU + EN only for this spike. */

export const SUPPORTED = Object.freeze(["ru", "en"]);

const COPY = Object.freeze({
  en: {
    brand: "DOFA ARENA",
    tourLine: "TOUR 02 · ROOTFALL JUNGLE",
    roomCounter: "08 / 50",
    heroName: "HONEY BADGER",
    weaponName: "KATANA",
    paused: "PAUSED",
    pauseHint: "True-3D Babylon.js spike · 2D prototype remains at home.",
    resume: "RESUME",
    orbit: "ORBIT PROOF (DEPTH)",
    orbitLive: "ORBIT PROOF · drag to rotate · real depth",
    orbitExit: "EXIT ORBIT",
    back2d: "BACK TO 2D PROTOTYPE",
    headNote: "PLACEHOLDER HEAD · face scan not invented · STRONG ROOTS locked",
  },
  ru: {
    brand: "DOFA ARENA",
    tourLine: "ТУР 02 · ROOTFALL JUNGLE",
    roomCounter: "08 / 50",
    heroName: "HONEY BADGER",
    weaponName: "КАТАНА",
    paused: "ПАУЗА",
    pauseHint: "Настоящий 3D Babylon.js spike · 2D-прототип остаётся на главной.",
    resume: "ПРОДОЛЖИТЬ",
    orbit: "ОРБИТА (ДОКАЗАТЬ ГЛУБИНУ)",
    orbitLive: "ОРБИТА · тяни для поворота · реальная глубина",
    orbitExit: "ВЫЙТИ ИЗ ОРБИТЫ",
    back2d: "К 2D-ПРОТОТИПУ",
    headNote: "ЗАГЛУШКА ГОЛОВЫ · лицо не выдумано · STRONG ROOTS зафиксированы",
  },
});

export function normalizeLocale(value) {
  if (value === "en" || value === "ru") return value;
  return "ru";
}

export function translate(locale, key) {
  const lang = normalizeLocale(locale);
  return COPY[lang][key] ?? COPY.en[key] ?? key;
}

export function applyI18n(root, locale) {
  const lang = normalizeLocale(locale);
  for (const node of root.querySelectorAll("[data-i18n]")) {
    const key = node.getAttribute("data-i18n");
    node.textContent = translate(lang, key);
  }
  root.lang = lang;
  return lang;
}

/** Canon hard-stops for new 3D UI strings. */
export const FORBIDDEN_PUBLIC_NAMES = Object.freeze([
  "DOFFA Heroes",
  "Doffa-Archer",
  "KAPRIZARD",
  "Caprizord",
  "$DOFFA",
]);
