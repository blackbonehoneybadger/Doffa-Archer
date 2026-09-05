const VOICE_LANGUAGE = Object.freeze({
  ru: "ru-RU", en: "en-US", es: "es-ES", "pt-BR": "pt-BR",
  de: "de-DE", fr: "fr-FR", it: "it-IT", tr: "tr-TR", ar: "ar-SA",
  "zh-Hans": "zh-CN", ja: "ja-JP", ko: "ko-KR",
});

export const COMBAT_VOICE_LINES = Object.freeze({
  ru: Object.freeze({ hurt: ["Держусь!", "Это всё?"], death: ["Я ещё вернусь…"], meleeFinisher: ["Лежать!", "Слишком близко!"], rangedFinisher: ["Точно в цель!", "Готов!"], heavy: ["Вот это удар!", "Получи!"], bossVictory: ["Тур окончен."], roomClear: ["Комната чиста."], levelUp: ["Я стал сильнее."] }),
  en: Object.freeze({ hurt: ["Still standing!", "Is that all?"], death: ["I will return…"], meleeFinisher: ["Stay down!", "Too close!"], rangedFinisher: ["Clean shot!", "Target down!"], heavy: ["Feel that!", "Crushed!"], bossVictory: ["Tour complete."], roomClear: ["Room clear."], levelUp: ["Stronger now."] }),
  es: Object.freeze({ hurt: ["¡Sigo en pie!", "¿Eso es todo?"], death: ["Volveré…"], meleeFinisher: ["¡Al suelo!", "¡Demasiado cerca!"], rangedFinisher: ["¡Tiro limpio!", "¡Objetivo caído!"], heavy: ["¡Siente eso!"], bossVictory: ["Gira completada."], roomClear: ["Sala despejada."], levelUp: ["Ahora soy más fuerte."] }),
  "pt-BR": Object.freeze({ hurt: ["Ainda de pé!", "É só isso?"], death: ["Eu voltarei…"], meleeFinisher: ["No chão!", "Perto demais!"], rangedFinisher: ["Tiro certeiro!", "Alvo abatido!"], heavy: ["Sinta isso!"], bossVictory: ["Turnê concluída."], roomClear: ["Sala limpa."], levelUp: ["Mais forte agora."] }),
  de: Object.freeze({ hurt: ["Ich stehe noch!", "War das alles?"], death: ["Ich komme zurück…"], meleeFinisher: ["Bleib liegen!", "Zu nah!"], rangedFinisher: ["Sauberer Treffer!", "Ziel erledigt!"], heavy: ["Spür das!"], bossVictory: ["Tour geschafft."], roomClear: ["Raum gesichert."], levelUp: ["Jetzt bin ich stärker."] }),
  fr: Object.freeze({ hurt: ["Toujours debout !", "C'est tout ?"], death: ["Je reviendrai…"], meleeFinisher: ["Reste à terre !", "Trop près !"], rangedFinisher: ["Tir parfait !", "Cible abattue !"], heavy: ["Prends ça !"], bossVictory: ["Tour terminé."], roomClear: ["Salle nettoyée."], levelUp: ["Je suis plus fort."] }),
  it: Object.freeze({ hurt: ["Sono ancora in piedi!", "Tutto qui?"], death: ["Tornerò…"], meleeFinisher: ["Resta a terra!", "Troppo vicino!"], rangedFinisher: ["Colpo pulito!", "Bersaglio abbattuto!"], heavy: ["Prendi questo!"], bossVictory: ["Tour completato."], roomClear: ["Stanza libera."], levelUp: ["Ora sono più forte."] }),
  tr: Object.freeze({ hurt: ["Hâlâ ayaktayım!", "Hepsi bu mu?"], death: ["Geri döneceğim…"], meleeFinisher: ["Yerde kal!", "Fazla yakındın!"], rangedFinisher: ["Temiz atış!", "Hedef düştü!"], heavy: ["Bunu hisset!"], bossVictory: ["Tur tamamlandı."], roomClear: ["Oda temiz."], levelUp: ["Artık daha güçlüyüm."] }),
  ar: Object.freeze({ hurt: ["ما زلت صامدًا!", "أهذا كل شيء؟"], death: ["سأعود…"], meleeFinisher: ["ابقَ أرضًا!", "اقتربت كثيرًا!"], rangedFinisher: ["إصابة دقيقة!", "سقط الهدف!"], heavy: ["تذوق هذه!"], bossVictory: ["اكتملت الجولة."], roomClear: ["الغرفة آمنة."], levelUp: ["أصبحت أقوى."] }),
  "zh-Hans": Object.freeze({ hurt: ["我还能打！", "就这点本事？"], death: ["我会回来的……"], meleeFinisher: ["倒下！", "离得太近了！"], rangedFinisher: ["精准命中！", "目标击倒！"], heavy: ["接招！"], bossVictory: ["巡回完成。"], roomClear: ["房间清空。"], levelUp: ["我更强了。"] }),
  ja: Object.freeze({ hurt: ["まだ立てる！", "それだけか？"], death: ["必ず戻る……"], meleeFinisher: ["倒れてろ！", "近すぎたな！"], rangedFinisher: ["命中！", "標的撃破！"], heavy: ["くらえ！"], bossVictory: ["ツアー完了。"], roomClear: ["部屋を制圧した。"], levelUp: ["さらに強くなった。"] }),
  ko: Object.freeze({ hurt: ["아직 버틴다!", "이게 전부냐?"], death: ["다시 돌아온다…"], meleeFinisher: ["쓰러져 있어!", "너무 가까웠다!"], rangedFinisher: ["정확한 사격!", "목표 제거!"], heavy: ["받아라!"], bossVictory: ["투어 완료."], roomClear: ["방 정리 완료."], levelUp: ["더 강해졌다."] }),
});

export const HERO_VOICE_PROFILES = Object.freeze({
  "honey-badger": Object.freeze({ rate: 0.92, pitch: 0.64, volume: 0.78, voiceIndex: 0 }),
  hadida: Object.freeze({ rate: 0.84, pitch: 0.52, volume: 0.84, voiceIndex: 1 }),
  boya: Object.freeze({ rate: 0.98, pitch: 0.76, volume: 0.8, voiceIndex: 2 }),
  "mr-kroo": Object.freeze({ rate: 0.9, pitch: 0.68, volume: 0.76, voiceIndex: 3 }),
  pata: Object.freeze({ rate: 1.04, pitch: 0.86, volume: 0.75, voiceIndex: 4 }),
});

const DEFAULT_PROFILE = Object.freeze({ rate: 0.94, pitch: 0.72, volume: 0.76, voiceIndex: 0 });
const URGENT_EVENTS = new Set(["death", "bossVictory"]);

export const HERO_VOICE_LINES_RU = Object.freeze({
  "honey-badger": {
    hurt: ["Корни держат.", "Не остановишь."], death: ["Корни… глубже."],
    meleeFinisher: ["Сталь сказала всё."], rangedFinisher: ["Тише падай."],
    heavy: ["Один точный удар."], bossVictory: ["Оболочка пала. Ты следующий."],
    roomClear: ["Здесь больше не шепчут."], levelUp: ["Глубже корни. Крепче сталь."],
  },
  "mr-kroo": {
    hurt: ["Плохие манеры.", "Поправка на ветер."], death: ["Не последний… выстрел."],
    meleeFinisher: ["Непростительная близость."], rangedFinisher: ["С дистанцией всё верно."],
    heavy: ["Счёт закрыт."], bossVictory: ["Новый костюм тебя не спас."],
    roomClear: ["Можно пройти. Осторожно."], levelUp: ["Точность — дело привычки."],
  },
  boya: {
    hurt: ["Эй, аккуратнее с золотом!", "Теперь моя очередь."], death: ["Молот… не отдавайте."],
    meleeFinisher: ["Вот и весь ремонт!"], rangedFinisher: ["Золотой аргумент."],
    heavy: ["Капитальная переделка!"], bossVictory: ["И эту махину разобрали!"],
    roomClear: ["Кто заказывал капитальный?"], levelUp: ["Ещё один довод потяжелее."],
  },
  pata: {
    hurt: ["Пережарили.", "Давление держу."], death: ["Смену… не закрывайте."],
    meleeFinisher: ["Добавка за счёт заведения."], rangedFinisher: ["Давление в норме."],
    heavy: ["Плотная экстракция."], bossVictory: ["Мистер T, ваш заказ остыл."],
    roomClear: ["Рабочее место чистое."], levelUp: ["Настроим помол потоньше."],
  },
  hadida: {
    hurt: ["Пепел стряхнул.", "Ну и горечь."], death: ["Огонёк… побереги."],
    meleeFinisher: ["Без лишнего дыма."], rangedFinisher: ["Бычок маленький. Проблемы большие."],
    heavy: ["Бита без сдачи."], bossVictory: ["Опять ты. Опять мимо."],
    roomClear: ["Проветрить бы здесь."], levelUp: ["Ещё тлеет."],
  },
});

export function getCombatVoiceLine(event, { locale = "ru", sequence = 0, heroId } = {}) {
  const lines = (locale === "ru" ? HERO_VOICE_LINES_RU[heroId]?.[event] : null)
    ?? COMBAT_VOICE_LINES[locale]?.[event];
  if (!Array.isArray(lines) || lines.length === 0) return null;
  const safeSequence = Number.isInteger(sequence) && sequence >= 0 ? sequence : 0;
  return lines[safeSequence % lines.length];
}

export class CombatVoice {
  constructor({
    locale = () => "ru",
    heroId = () => "honey-badger",
    cooldownMs = 2_800,
    now = () => Date.now(),
    synthesis = globalThis.speechSynthesis,
    Utterance = globalThis.SpeechSynthesisUtterance,
  } = {}) {
    this.locale = locale;
    this.heroId = heroId;
    this.cooldownMs = cooldownMs;
    this.now = now;
    this.synthesis = synthesis;
    this.Utterance = Utterance;
    this.lastAt = Number.NEGATIVE_INFINITY;
    this.sequence = 0;
    this.muted = false;
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (this.muted) {
      try {
        this.synthesis?.cancel?.();
      } catch {
        // Browser speech support is optional and must never stop gameplay.
      }
    }
  }

  play(event, details = {}) {
    if (this.muted) return false;
    const now = this.now();
    const urgent = URGENT_EVENTS.has(event);
    if (!urgent && now - this.lastAt < this.cooldownMs) return false;
    let requestedLocale = "ru";
    try {
      requestedLocale = this.locale();
    } catch {
      requestedLocale = "ru";
    }
    const locale = Object.hasOwn(COMBAT_VOICE_LINES, requestedLocale) ? requestedLocale : "ru";
    let requestedHeroId = details.heroId;
    if (!requestedHeroId) {
      try {
        requestedHeroId = this.heroId();
      } catch {
        requestedHeroId = null;
      }
    }
    const line = getCombatVoiceLine(event, { locale, sequence: this.sequence, heroId: requestedHeroId });
    if (!line || !this.synthesis || typeof this.Utterance !== "function") return false;
    const voiceProfile = HERO_VOICE_PROFILES[requestedHeroId] ?? DEFAULT_PROFILE;
    const utterance = new this.Utterance(line);
    utterance.lang = VOICE_LANGUAGE[locale] ?? "ru-RU";
    utterance.rate = voiceProfile.rate;
    utterance.pitch = voiceProfile.pitch;
    utterance.volume = voiceProfile.volume;
    try {
      const voices = this.synthesis.getVoices?.().filter((voice) => (
        String(voice.lang ?? "").toLowerCase().startsWith(utterance.lang.slice(0, 2).toLowerCase())
      )) ?? [];
      if (voices.length > 0) utterance.voice = voices[voiceProfile.voiceIndex % voices.length];
      if (urgent) this.synthesis.cancel?.();
      this.synthesis.speak(utterance);
    } catch {
      return false;
    }
    this.sequence += 1;
    this.lastAt = now;
    return true;
  }
}
