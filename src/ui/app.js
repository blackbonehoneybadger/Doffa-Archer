import { calculateTapReward, getRunEntryCost } from "../core/economy.js";
import { ProfileStore } from "../core/profile-store.js";
import { DEFAULT_TOUR_ID, getTourDefinition } from "../game/content.js";
import { DoffaGame } from "../game/game.js";

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
    hudHealth: requiredElement("hud-health"),
    hudHealthText: requiredElement("hud-health-text"),
    abilityOverlay: requiredElement("ability-overlay"),
    abilityChoices: requiredElement("ability-choices"),
    resultOverlay: requiredElement("result-overlay"),
    resultKicker: requiredElement("result-kicker"),
    resultTitle: requiredElement("result-title"),
    resultRoom: requiredElement("result-room"),
    resultTour: requiredElement("result-tour"),
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
  const selectedTour = getTourDefinition(DEFAULT_TOUR_ID);
  if (!selectedTour) {
    throw new Error(`Missing default tour ${DEFAULT_TOUR_ID}`);
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

  const showHome = () => {
    elements.home.hidden = false;
    elements.game.hidden = true;
    elements.abilityOverlay.hidden = true;
    elements.resultOverlay.hidden = true;
    elements.confirmOverlay.hidden = true;
    elements.homeNotice.textContent = "";
    renderProfile(profileStore.profile);
  };

  const game = new DoffaGame({
    canvas: elements.canvas,
    profileStore,
    onProfile: renderProfile,
    onHud({ room, totalRooms, tourCode, roomName, hp, maxHp }) {
      elements.hudTour.textContent = tourCode;
      elements.hudRoom.textContent = `${room} / ${totalRooms}`;
      elements.hudRoomName.textContent = roomName;
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
      elements.resultBeans.textContent = `+${result.beanReward}`;
      elements.resultReceipt.textContent = result.receipt.id.slice(0, 12).toUpperCase();
      elements.resultOverlay.hidden = false;
    },
  });

  elements.entryCost.textContent = String(getRunEntryCost());
  renderSelectedTour();
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
    const result = game.beginRun(selectedTour.id);
    if (!result.ok) {
      if (result.reason === "tour-unavailable") {
        elements.homeNotice.textContent = "THIS TOUR IS NOT AVAILABLE IN THIS BUILD.";
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
