export const SUPPORTED_LOCALES = Object.freeze([
  ["ru", "Русский"], ["en", "English"], ["es", "Español"], ["pt-BR", "Português"],
  ["de", "Deutsch"], ["fr", "Français"], ["it", "Italiano"], ["tr", "Türkçe"],
  ["ar", "العربية"], ["zh-Hans", "简体中文"], ["ja", "日本語"], ["ko", "한국어"],
]);

const COPY = Object.freeze({
  en: { tagline: "THE ROAST DOES NOT FORGIVE.", lead: "Charge the golden bean. Choose your wager. Survive every chamber and defeat Caprizord.", tap: "TAP BEAN", beans: "BEANS", change: "CHANGE", wager: "TOUR WAGER", rule: "COMPLETE THE TOUR: ×2 · DEFEAT: WAGER BURNS", melee: "MELEE", ranged: "RANGED", move: "RIGHT SIDE: DRAG TO MOVE · LEFT SIDE: SWITCH WEAPON", heroes: "SELECT YOUR HERO", tours: "SELECT YOUR TOUR", enter: "ENTER", resume: "RESUME" },
  ru: { tagline: "ОБЖАРКА НЕ ПРОЩАЕТ.", lead: "Заряди золотое зерно. Выбери ставку. Пройди все комнаты и победи Капризорда.", tap: "ЖМИ НА ЗЕРНО", beans: "ЗЁРНА", change: "СМЕНИТЬ", wager: "СТАВКА НА ТУР", rule: "ПРОШЁЛ ТУР: ×2 · ПОРАЖЕНИЕ: СТАВКА СГОРАЕТ", melee: "БЛИЖНИЙ", ranged: "ДАЛЬНИЙ", move: "СПРАВА: ДВИЖЕНИЕ · СЛЕВА: СМЕНА ОРУЖИЯ", heroes: "ВЫБЕРИ ГЕРОЯ", tours: "ВЫБЕРИ ТУР", enter: "НАЧАТЬ", resume: "ПРОДОЛЖИТЬ" },
  es: { tagline: "EL TUESTE NO PERDONA.", lead: "Carga el grano dorado, elige tu apuesta y derrota a Caprizord.", tap: "TOCA EL GRANO", beans: "GRANOS", change: "CAMBIAR", wager: "APUESTA", rule: "COMPLETA: ×2 · DERROTA: PIERDES LA APUESTA", melee: "CUERPO A CUERPO", ranged: "DISTANCIA", move: "DERECHA: MOVER · IZQUIERDA: ARMA", heroes: "ELIGE HÉROE", tours: "ELIGE GIRA", enter: "ENTRAR", resume: "CONTINUAR" },
  "pt-BR": { tagline: "A TORRA NÃO PERDOA.", lead: "Carregue o grão dourado, escolha a aposta e derrote Caprizord.", tap: "TOQUE NO GRÃO", beans: "GRÃOS", change: "TROCAR", wager: "APOSTA", rule: "CONCLUA: ×2 · DERROTA: APOSTA PERDIDA", melee: "CORPO A CORPO", ranged: "DISTÂNCIA", move: "DIREITA: MOVER · ESQUERDA: ARMA", heroes: "ESCOLHA O HERÓI", tours: "ESCOLHA A TURNÊ", enter: "ENTRAR", resume: "CONTINUAR" },
  de: { tagline: "DIE RÖSTUNG VERGIBT NICHT.", lead: "Lade die goldene Bohne, wähle deinen Einsatz und besiege Caprizord.", tap: "BOHNE ANTIPPEN", beans: "BOHNEN", change: "WECHSELN", wager: "TOUR-EINSATZ", rule: "TOUR SCHAFFEN: ×2 · NIEDERLAGE: EINSATZ WEG", melee: "NAHKAMPF", ranged: "FERNKAMPF", move: "RECHTS: BEWEGEN · LINKS: WAFFE", heroes: "HELD WÄHLEN", tours: "TOUR WÄHLEN", enter: "STARTEN", resume: "FORTSETZEN" },
  fr: { tagline: "LA TORRÉFACTION NE PARDONNE PAS.", lead: "Chargez le grain doré, choisissez votre mise et battez Caprizord.", tap: "TOUCHER LE GRAIN", beans: "GRAINS", change: "CHANGER", wager: "MISE DU TOUR", rule: "TOUR TERMINÉ : ×2 · DÉFAITE : MISE PERDUE", melee: "MÊLÉE", ranged: "DISTANCE", move: "DROITE : BOUGER · GAUCHE : ARME", heroes: "CHOISISSEZ UN HÉROS", tours: "CHOISISSEZ UN TOUR", enter: "ENTRER", resume: "REPRENDRE" },
  it: { tagline: "LA TOSTATURA NON PERDONA.", lead: "Carica il chicco dorato, scegli la puntata e sconfiggi Caprizord.", tap: "TOCCA IL CHICCO", beans: "CHICCHI", change: "CAMBIA", wager: "PUNTATA", rule: "COMPLETA: ×2 · SCONFITTA: PUNTATA PERSA", melee: "MISCHIA", ranged: "DISTANZA", move: "DESTRA: MUOVI · SINISTRA: ARMA", heroes: "SCEGLI EROE", tours: "SCEGLI TOUR", enter: "ENTRA", resume: "CONTINUA" },
  tr: { tagline: "KAVURMA AFFETMEZ.", lead: "Altın çekirdeği yükle, bahsini seç ve Caprizord'u yen.", tap: "ÇEKİRDEĞE DOKUN", beans: "ÇEKİRDEK", change: "DEĞİŞTİR", wager: "TUR BAHİSİ", rule: "TURU BİTİR: ×2 · YENİLGİ: BAHİS YANAR", melee: "YAKIN", ranged: "UZAK", move: "SAĞ: HAREKET · SOL: SİLAH", heroes: "KAHRAMAN SEÇ", tours: "TUR SEÇ", enter: "GİR", resume: "DEVAM" },
  ar: { tagline: "التحميص لا يرحم.", lead: "اشحن الحبة الذهبية واختر الرهان واهزم كابريزورد.", tap: "اضغط الحبة", beans: "حبوب", change: "تغيير", wager: "رهان الجولة", rule: "إكمال الجولة: ×2 · الهزيمة: خسارة الرهان", melee: "قريب", ranged: "بعيد", move: "اليمين: حركة · اليسار: سلاح", heroes: "اختر بطلك", tours: "اختر الجولة", enter: "ابدأ", resume: "متابعة" },
  "zh-Hans": { tagline: "烘焙绝不宽恕。", lead: "为金色咖啡豆充能，选择赌注，击败卡普里佐德。", tap: "点击咖啡豆", beans: "咖啡豆", change: "更换", wager: "巡回赌注", rule: "通关：×2 · 失败：赌注清零", melee: "近战", ranged: "远程", move: "右侧：移动 · 左侧：换武器", heroes: "选择英雄", tours: "选择巡回", enter: "开始", resume: "继续" },
  ja: { tagline: "焙煎は容赦しない。", lead: "黄金の豆をチャージし、賭けを選び、カプリゾードを倒せ。", tap: "豆をタップ", beans: "豆", change: "変更", wager: "ツアーの賭け", rule: "クリア：×2 · 敗北：賭けは消滅", melee: "近接", ranged: "遠距離", move: "右：移動 · 左：武器切替", heroes: "ヒーローを選択", tours: "ツアーを選択", enter: "開始", resume: "続ける" },
  ko: { tagline: "로스팅은 용서하지 않는다.", lead: "황금 원두를 충전하고 판돈을 정해 카프리조드를 쓰러뜨리세요.", tap: "원두 탭", beans: "원두", change: "변경", wager: "투어 판돈", rule: "완주: ×2 · 패배: 판돈 소멸", melee: "근접", ranged: "원거리", move: "오른쪽: 이동 · 왼쪽: 무기", heroes: "영웅 선택", tours: "투어 선택", enter: "입장", resume: "계속" },
});

export function normalizeLocale(locale) {
  return SUPPORTED_LOCALES.some(([code]) => code === locale) ? locale : "ru";
}

export function translate(locale, key) {
  return COPY[normalizeLocale(locale)]?.[key] ?? COPY.en[key] ?? key;
}

export function applyLocale(locale, root = document) {
  const normalized = normalizeLocale(locale);
  root.documentElement.lang = normalized;
  root.documentElement.dir = normalized === "ar" ? "rtl" : "ltr";
  for (const element of root.querySelectorAll("[data-i18n]")) {
    element.textContent = translate(normalized, element.dataset.i18n);
  }
  return normalized;
}
