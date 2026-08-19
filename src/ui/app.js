import { calculateTapReward, getRunEntryCost } from "../core/economy.js";
import { ProfileStore } from "../core/profile-store.js";
import { DEFAULT_TOUR_ID, getTourDefinition } from "../game/content.js";
import { DoffaGame } from "../game/game.js";
import {
  DEFAULT_HERO_ID,
  getHeroDefinition,
  getUnlockedHeroes,
} from "../game/heroes.js";

function requiredElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element #${id}`);
  }
  return element;
}

export function bootstrapApp() {
  const elements = {
    home: requiredElement("home-screen"),
    game: requiredElement("game-screen"),
    canvas: requiredElement("game-canvas"),
    beans: requiredElement("top-beans"),
    bestRoom: requiredElement("best-room"),
    bossWins: requiredElement("boss-wins"),
    lifetimeBeans: requiredElement("lifetime-beans"),
    selectedHeroCard: requiredElement("selected-hero-card"),
    selectedHeroPortrait: requiredElement("selected-hero-portrait"),
    selectedHeroMark: requiredElement("selected-hero-mark"),
    selectedHeroRole: requiredElement("selected-hero-role"),
    selectedHeroName: requiredElement("selected-hero-name"),
    selectedHeroWeapon: requiredElement("selected-hero-weapon"),
    selectedHeroVitality: requiredElement("selected-hero-vitality"),
    selectedHeroPower: requiredElement("selected-hero-power"),
    selectedHeroSpeed: requiredElement("selected-hero-speed"),
    changeHero: requiredElement("change-hero"),
    heroOverlay: requiredElement("hero-overlay"),
    heroGrid: requiredElement("hero-grid"),
    closeHeroSelect: requiredElement("close-hero-select"),
    selectedTourCode: requiredElement("selected-tour-code"),
    selectedTourName: requiredElement("selected-tour-name"),
    selectedTourDistrict: requiredElement("selected-tour-district"),
    selectedTourRoute: requiredElement("selected-tour-route"),
    tapButton: requiredElement("tap-button"),
    tapBurst: requiredElement("tap-burst"),
    startRun: requiredElement("start-run"),
    startRunLabel: requiredElement("start-run-label"),
    entryCost: requiredElement("entry-cost"),
    homeNotice: requiredElement("home-notice"),
    abortRun: requiredElement("abort-run"),
    hudRoom: requiredElement("hud-room"),
    hudTour: requiredElement("hud-tour"),
    hudRoomName: requiredElement("hud-room-name"),
    hudHeroLabel: requiredElement("hud-hero-label"),
    hudHealth: requiredElement("hud-health"),
    hudHealthText: requiredElement("hud-health-text"),
    abilityOverlay: requiredElement("ability-overlay"),
    abilityChoices: requiredElement("ability-choices"),
    resultOverlay: requiredElement("result-overlay"),
    resultKicker: requiredElement("result-kicker"),
    resultTitle: requiredElement("result-title"),
    resultRoom: requiredElement("result-room"),
    resultTour: requiredElement("result-tour"),
    resultHero: requiredElement("result-hero"),
    resultBeans: requiredElement("result-beans"),
    resultReceipt: requiredElement("result-receipt"),
    returnHome: requiredElement("return-home"),
    confirmOverlay: requiredElement("confirm-overlay"),
    continueRun: requiredElement("continue-run"),
    confirmAbort: requiredElement("confirm-abort"),
    updateBanner: requiredElement("update-banner"),
    applyUpdate: requiredElement("apply-update"),
    installApp: requiredElement("install-app"),
  };

  const profileStore = new ProfileStore();
  let selectedHero = getHeroDefinition(profileStore.profile.selectedHeroId)
    ?? getHeroDefinition(DEFAULT_HERO_ID);
  const selectedTour = getTourDefinition(DEFAULT_TOUR_ID);
  if (!selectedTour || !selectedHero) {
    throw new Error("Missing default game content");
  }
  let deferredInstallPrompt = null;
  let burstTimer = 0;

  const renderProfile = (profile) => {
    const tourProgress = profile.tourProgress[selectedTour.id] ?? {
      bestRoom: 0,
      bossesDefeated: 0,
    };
    elements.beans.textContent = profile.beans.toLocaleString("en-US");
    elements.bestRoom.textContent = `${Math.min(tourProgress.bestRoom, selectedTour.rooms.length)} / ${selectedTour.rooms.length}`;
    elements.bossWins.textContent = tourProgress.bossesDefeated.toLocaleString("en-US");
    elements.lifetimeBeans.textContent = profile.lifetimeBeans.toLocaleString("en-US");
  };

  const renderSelectedTour = () => {
    elements.selectedTourCode.textContent = selectedTour.code;
    elements.selectedTourName.textContent = selectedTour.name;
    elements.selectedTourDistrict.textContent = selectedTour.district;
    elements.selectedTourRoute.textContent = `${selectedTour.rooms.length} CHAMBERS // 1 BOSS`;
    elements.startRunLabel.textContent = `ENTER ${selectedTour.code}`;
  };

  const renderSelectedHero = () => {
    const accent = selectedHero.palette.accent;
    elements.selectedHeroCard.style.setProperty("--hero-accent", accent);
    elements.selectedHeroPortrait.style.setProperty("--hero-accent", accent);
    elements.selectedHeroPortrait.dataset.hero = selectedHero.id;
    elements.selectedHeroMark.textContent = selectedHero.monogram;
    elements.selectedHeroRole.textContent = selectedHero.role;
    elements.selectedHeroName.textContent = selectedHero.name;
    elements.selectedHeroWeapon.textContent = selectedHero.weapon;
    elements.selectedHeroVitality.style.setProperty("--rating", selectedHero.ratings.vitality);
    elements.selectedHeroPower.style.setProperty("--rating", selectedHero.ratings.power);
    elements.selectedHeroSpeed.style.setProperty("--rating", selectedHero.ratings.speed);
  };

  const selectHero = (hero) => {
    selectedHero = hero;
    profileStore.update((draft) => {
      draft.selectedHeroId = hero.id;
    });
    renderSelectedHero();
    renderHeroGrid();
    elements.heroOverlay.hidden = true;
  };

  const renderHeroGrid = () => {
    elements.heroGrid.replaceChildren();
    for (const hero of getUnlockedHeroes()) {
      const button = document.createElement("button");
      button.className = "hero-option";
      button.classList.toggle("is-selected", hero.id === selectedHero.id);
      button.type = "button";
      button.setAttribute("aria-pressed", String(hero.id === selectedHero.id));
      button.style.setProperty("--hero-accent", hero.palette.accent);

      const portrait = document.createElement("span");
      portrait.className = "hero-portrait";
      portrait.dataset.hero = hero.id;
      portrait.style.setProperty("--hero-accent", hero.palette.accent);
      portrait.setAttribute("aria-hidden", "true");
      const mark = document.createElement("span");
      mark.textContent = hero.monogram;
      const placeholder = document.createElement("small");
      placeholder.textContent = "ART PLACEHOLDER";
      portrait.append(mark, placeholder);

      const copy = document.createElement("span");
      copy.className = "hero-option-copy";
      const role = document.createElement("span");
      role.textContent = hero.role;
      const name = document.createElement("strong");
      name.textContent = hero.name;
      const weapon = document.createElement("small");
      weapon.textContent = hero.weapon;
      const description = document.createElement("p");
      description.textContent = hero.description;
      copy.append(role, name, weapon, description);

      button.append(portrait, copy);
      button.addEventListener("click", () => selectHero(hero));
      elements.heroGrid.append(button);
    }
  };

  const showHome = () => {
    elements.home.hidden = false;
    elements.game.hidden = true;
    elements.abilityOverlay.hidden = true;
    elements.resultOverlay.hidden = true;
    elements.confirmOverlay.hidden = true;
    elements.heroOverlay.hidden = true;
    elements.homeNotice.textContent = "";
    renderProfile(profileStore.profile);
  };

  const game = new DoffaGame({
    canvas: elements.canvas,
    profileStore,
    onProfile: renderProfile,
    onHud({ room, totalRooms, tourCode, roomName, heroName, weaponName, hp, maxHp }) {
      elements.hudTour.textContent = tourCode;
      elements.hudRoom.textContent = `${room} / ${totalRooms}`;
      elements.hudRoomName.textContent = roomName;
      elements.hudHeroLabel.textContent = `${heroName} // ${weaponName}`;
      elements.hudHealthText.textContent = `${hp} / ${maxHp}`;
      elements.hudHealth.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
    },
    onAbilityChoice(choices) {
      elements.abilityChoices.replaceChildren();
      for (const ability of choices) {
        const button = document.createElement("button");
        button.className = "ability-card";
        button.type = "button";

        const icon = document.createElement("span");
        icon.className = "ability-icon";
        const glyph = document.createElement("span");
        glyph.textContent = ability.glyph;
        icon.append(glyph);

        const name = document.createElement("strong");
        name.textContent = ability.name;
        const description = document.createElement("small");
        description.textContent = ability.description;
        button.append(icon, name, description);
        button.addEventListener("click", () => {
          if (game.chooseAbility(ability.id)) {
            elements.abilityOverlay.hidden = true;
          }
        });
        elements.abilityChoices.append(button);
      }
      elements.abilityOverlay.hidden = false;
    },
    onRunEnd(result) {
      elements.abilityOverlay.hidden = true;
      elements.confirmOverlay.hidden = true;
      elements.resultKicker.textContent = result.bossDefeated ? "TOUR CLEARED" : "RUN CLOSED";
      elements.resultTitle.textContent = result.bossDefeated
        ? "THE ROASTER FELL."
        : "THE CHAMBER WON.";
      elements.resultRoom.textContent = String(result.roomsCleared);
      elements.resultTour.textContent = result.tour.code;
      elements.resultHero.textContent = result.hero.name;
      elements.resultBeans.textContent = `+${result.beanReward}`;
      elements.resultReceipt.textContent = result.receipt.id.slice(0, 12).toUpperCase();
      elements.resultOverlay.hidden = false;
    },
  });

  elements.entryCost.textContent = String(getRunEntryCost());
  renderSelectedTour();
  renderSelectedHero();
  renderHeroGrid();
  renderProfile(profileStore.profile);
  game.startLoop();

  elements.tapButton.addEventListener("click", () => {
    const reward = calculateTapReward();
    profileStore.update((draft) => {
      draft.beans += reward;
      draft.lifetimeBeans += reward;
    });
    renderProfile(profileStore.profile);

    elements.tapButton.classList.add("is-tapped");
    elements.tapBurst.classList.remove("show");
    void elements.tapBurst.offsetWidth;
    elements.tapBurst.classList.add("show");
    window.clearTimeout(burstTimer);
    burstTimer = window.setTimeout(() => elements.tapButton.classList.remove("is-tapped"), 110);
  });

  elements.startRun.addEventListener("click", () => {
    const result = game.beginRun(selectedTour.id, selectedHero.id);
    if (!result.ok) {
      if (result.reason === "tour-unavailable") {
        elements.homeNotice.textContent = "THIS TOUR IS NOT AVAILABLE IN THIS BUILD.";
        return;
      }
      if (result.reason === "hero-unavailable") {
        elements.homeNotice.textContent = "THIS HERO IS NOT AVAILABLE IN THIS BUILD.";
        return;
      }
      elements.homeNotice.textContent = `CHARGE ${result.missingBeans} MORE BEANS.`;
      return;
    }

    elements.home.hidden = true;
    elements.game.hidden = false;
    elements.homeNotice.textContent = "";
  });

  elements.abortRun.addEventListener("click", () => {
    game.setPaused(true);
    elements.confirmOverlay.hidden = false;
  });

  elements.changeHero.addEventListener("click", () => {
    renderHeroGrid();
    elements.heroOverlay.hidden = false;
  });

  elements.closeHeroSelect.addEventListener("click", () => {
    elements.heroOverlay.hidden = true;
  });

  elements.continueRun.addEventListener("click", () => {
    elements.confirmOverlay.hidden = true;
    game.setPaused(false);
  });

  elements.confirmAbort.addEventListener("click", () => {
    elements.confirmOverlay.hidden = true;
    game.abortRun();
  });

  elements.returnHome.addEventListener("click", showHome);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    elements.installApp.hidden = false;
  });

  elements.installApp.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    elements.installApp.hidden = true;
  });

  registerServiceWorker(elements).catch(() => {
    // A failed update check must not prevent offline gameplay.
  });
}

async function registerServiceWorker(elements) {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) {
    return;
  }

  const registration = await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });

  const showUpdate = (worker) => {
    if (!worker || !navigator.serviceWorker.controller) {
      return;
    }
    elements.updateBanner.hidden = false;
    elements.applyUpdate.onclick = () => worker.postMessage({ type: "SKIP_WAITING" });
  };

  if (registration.waiting) {
    showUpdate(registration.waiting);
  }

  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed") {
        showUpdate(worker);
      }
    });
  });

  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  window.setInterval(() => registration.update(), 30 * 60 * 1_000);
}
