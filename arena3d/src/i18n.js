const COPY = Object.freeze({
  en: Object.freeze({
    game: "DOFA ARENA",
    tourLine: "TOUR 02 · ROOTFALL JUNGLE",
    pause: "Pause",
    resume: "Resume",
    orbit: "Orbit camera",
    combatCamera: "Combat camera",
    back2d: "2D prototype",
    attack: "Attack",
    placeholderHead: "PLACEHOLDER HEAD · owner face scan pending",
    loot: "Local prototype loot. Not claimable. No wallet, mint, or $DOFA wiring.",
    antagonist: "KAPRIZORD waits past room 50.",
    site: "dofa.coffee",
    pausedTitle: "PAUSED",
    cleared: "ROOM CLEARED",
    defeated: "HONEY BADGER FELL",
    hint: "Left stick to move. Attack button to swing the katana.",
  }),
  ru: Object.freeze({
    game: "DOFA ARENA",
    tourLine: "ТУР 02 · ROOTFALL JUNGLE",
    pause: "Пауза",
    resume: "Продолжить",
    orbit: "Орбитальная камера",
    combatCamera: "Боевая камера",
    back2d: "2D прототип",
    attack: "Атака",
    placeholderHead: "ЗАГЛУШКА ГОЛОВЫ · скана лица владельца нет",
    loot: "Локальная добыча прототипа. Нельзя получить. Нет кошелька, минтинга и $DOFA.",
    antagonist: "KAPRIZORD ждёт после комнаты 50.",
    site: "dofa.coffee",
    pausedTitle: "ПАУЗА",
    cleared: "КОМНАТА ЗАЧИЩЕНА",
    defeated: "HONEY BADGER ПАЛ",
    hint: "Левый стик — движение. Кнопка атаки — удар катаной.",
  }),
});

export const SLICE_LOCALES = Object.freeze(["ru", "en"]);

export function normalizeSliceLocale(value) {
  const code = String(value ?? "").toLowerCase();
  if (code.startsWith("en")) {
    return "en";
  }
  return "ru";
}

export function sliceText(locale, key) {
  const resolved = normalizeSliceLocale(locale);
  return COPY[resolved][key] ?? COPY.en[key] ?? key;
}
