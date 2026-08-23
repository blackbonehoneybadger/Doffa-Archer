import { calculateTapReward, getRunEntryCost } from "../core/economy.js";
import { ProfileStore } from "../core/profile-store.js";
import { DEFAULT_TOUR_ID } from "../config/game-config.js";
import { TOURS } from "../game/content.js";
import {
  EQUIPMENT_SLOTS,
  EQUIPMENT_SLOT_LABELS,
  MAX_INVENTORY_ITEMS,
  formatEquipmentEffects,
  getEquipmentDefinition,
  getEquippedItem,
  getRarityDefinition,
} from "../game/equipment.js";
import { DoffaGame } from "../game/game.js";
import { renderHeroPortrait } from "../game/hero-sprites.js";
import {
  DEFAULT_HERO_ID,
  getHeroDefinition,
  getUnlockedHeroes,
} from "../game/heroes.js";
import { getHeroXpRequirement } from "../game/progression.js";

function requiredElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element #${id}`);
  }
  return element;
}

export function resolveAvailableTour(tourId, tours = TOURS) {
  const availableTours = Array.isArray(tours) ? tours : [];
  const requestedTour = availableTours.find((tour) => tour?.id === tourId);
  if (requestedTour?.unlocked) {
    return requestedTour;
  }

  const defaultTour = availableTours.find((tour) => tour?.id === DEFAULT_TOUR_ID);
  if (defaultTour?.unlocked) {
    return defaultTour;
  }
  return availableTours.find((tour) => tour?.unlocked) ?? null;
}

export function isRunModeActive(mode) {
  return mode === "running"
    || mode === "choice"
    || mode === "exit"
    || mode === "dying";
}

function formatTourRoute(tour) {
  const guardianCount = tour.rooms.filter((room) => room.elite).length;
  return `${tour.rooms.length} CHAMBERS // ${guardianCount} GUARDIANS // 1 BOSS`;
}

export function bootstrapApp() {
  const elements = {
    home: requiredElement("home-screen"),
    game: requiredElement("game-screen"),
    canvas: requiredElement("game-canvas"),
    controlHint: requiredElement("control-hint"),
    beans: requiredElement("top-beans"),
    bestRoom: requiredElement("best-room"),
    bossWins: requiredElement("boss-wins"),
    lifetimeBeans: requiredElement("lifetime-beans"),
    selectedHeroCard: requiredElement("selected-hero-card"),
    selectedHeroPortrait: requiredElement("selected-hero-portrait"),
    selectedHeroArt: requiredElement("selected-hero-art"),
    selectedHeroMark: requiredElement("selected-hero-mark"),
    selectedHeroRole: requiredElement("selected-hero-role"),
    selectedHeroName: requiredElement("selected-hero-name"),
    selectedHeroWeapon: requiredElement("selected-hero-weapon"),
    selectedHeroLevel: requiredElement("selected-hero-level"),
    selectedHeroXp: requiredElement("selected-hero-xp"),
    selectedHeroXpBar: requiredElement("selected-hero-xp-bar"),
    selectedHeroVitality: requiredElement("selected-hero-vitality"),
    selectedHeroPower: requiredElement("selected-hero-power"),
    selectedHeroSpeed: requiredElement("selected-hero-speed"),
    changeHero: requiredElement("change-hero"),
    heroOverlay: requiredElement("hero-overlay"),
    heroGrid: requiredElement("hero-grid"),
    closeHeroSelect: requiredElement("close-hero-select"),
    loadoutSlots: requiredElement("loadout-slots"),
    openInventory: requiredElement("open-inventory"),
    equipmentOverlay: requiredElement("equipment-overlay"),
    closeInventory: requiredElement("close-inventory"),
    inventoryGrid: requiredElement("inventory-grid"),
    inventoryCount: requiredElement("inventory-count"),
    selectedTourCode: requiredElement("selected-tour-code"),
    selectedTourName: requiredElement("selected-tour-name"),
    selectedTourDistrict: requiredElement("selected-tour-district"),
    selectedTourRoute: requiredElement("selected-tour-route"),
    changeTour: requiredElement("change-tour"),
    tourOverlay: requiredElement("tour-overlay"),
    tourGrid: requiredElement("tour-grid"),
    closeTourSelect: requiredElement("close-tour-select"),
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
    hudWave: requiredElement("hud-wave"),
    hudWaveCountdown: requiredElement("hud-wave-countdown"),
    hudWaveFill: requiredElement("hud-wave-fill"),
    hudRunLevel: requiredElement("hud-run-level"),
    hudRunXpText: requiredElement("hud-run-xp-text"),
    hudRunXp: requiredElement("hud-run-xp"),
    abilityOverlay: requiredElement("ability-overlay"),
    abilityKicker: requiredElement("ability-kicker"),
    abilityDescription: requiredElement("ability-description"),
    abilityChoices: requiredElement("ability-choices"),
    resultOverlay: requiredElement("result-overlay"),
    resultKicker: requiredElement("result-kicker"),
    resultTitle: requiredElement("result-title"),
    resultRoom: requiredElement("result-room"),
    resultTour: requiredElement("result-tour"),
    resultHero: requiredElement("result-hero"),
    resultRunLevel: requiredElement("result-run-level"),
    resultBeans: requiredElement("result-beans"),
    resultXp: requiredElement("result-xp"),
    resultLevel: requiredElement("result-level"),
    resultDrop: requiredElement("result-drop"),
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
  const savedRun = profileStore.profile.activeRun;
  let selectedHero = getHeroDefinition(savedRun?.heroId ?? profileStore.profile.selectedHeroId)
    ?? getHeroDefinition(DEFAULT_HERO_ID);
  let selectedTour = resolveAvailableTour(savedRun?.tourId ?? profileStore.profile.selectedTourId);
  if (!selectedTour || !selectedHero) {
    throw new Error("Missing default game content");
  }
  let deferredInstallPrompt = null;
  let burstTimer = 0;
  let flushDeferredServiceWorkerUpdate = () => {};

  const openInventory = () => {
    renderInventory(profileStore.profile);
    elements.heroOverlay.hidden = true;
    elements.tourOverlay.hidden = true;
    elements.equipmentOverlay.hidden = false;
  };

  const renderLoadout = (profile) => {
    elements.loadoutSlots.replaceChildren();
    for (const slot of EQUIPMENT_SLOTS) {
      const item = getEquippedItem(profile.inventory, profile.loadout, slot);
      const definition = getEquipmentDefinition(item?.itemId);
      const rarity = getRarityDefinition(item?.rarity);
      const button = document.createElement("button");
      button.className = "loadout-slot";
      button.type = "button";
      button.style.setProperty("--rarity-color", rarity?.color ?? "#a9927b");
      button.setAttribute("aria-label", `Manage ${EQUIPMENT_SLOT_LABELS[slot].toLowerCase()} slot`);

      const label = document.createElement("span");
      label.textContent = EQUIPMENT_SLOT_LABELS[slot];
      const name = document.createElement("strong");
      name.textContent = definition?.name ?? "EMPTY";
      const meta = document.createElement("small");
      meta.textContent = item && rarity ? `${rarity.name} // LV.${item.level}` : "NO ITEM";
      button.append(label, name, meta);
      button.addEventListener("click", openInventory);
      elements.loadoutSlots.append(button);
    }
  };

  const renderInventory = (profile) => {
    const equippedIds = new Set(Object.values(profile.loadout));
    elements.inventoryCount.textContent = `${profile.inventory.length} / ${MAX_INVENTORY_ITEMS}`;
    elements.inventoryGrid.replaceChildren();

    for (const item of profile.inventory) {
      const definition = getEquipmentDefinition(item.itemId);
      const rarity = getRarityDefinition(item.rarity);
      if (!definition || !rarity) {
        continue;
      }

      const isEquipped = equippedIds.has(item.instanceId);
      const button = document.createElement("button");
      button.className = "inventory-item";
      button.classList.toggle("is-equipped", isEquipped);
      button.type = "button";
      button.style.setProperty("--rarity-color", rarity.color);
      button.setAttribute("aria-pressed", String(isEquipped));

      const slot = document.createElement("span");
      slot.className = "inventory-item-slot";
      slot.textContent = EQUIPMENT_SLOT_LABELS[definition.slot];
      const state = document.createElement("b");
      state.textContent = isEquipped ? "ACTIVE" : "EQUIP";
      slot.append(state);

      const name = document.createElement("strong");
      name.textContent = definition.name;
      const meta = document.createElement("small");
      meta.textContent = `${rarity.name} // LEVEL ${item.level}`;
      const effects = document.createElement("em");
      effects.textContent = formatEquipmentEffects(item);
      const description = document.createElement("p");
      description.textContent = definition.description;

      button.append(slot, name, meta, effects, description);
      button.addEventListener("click", () => {
        profileStore.update((draft) => {
          draft.loadout[definition.slot] = item.instanceId;
        });
        renderProfile(profileStore.profile);
      });
      elements.inventoryGrid.append(button);
    }
  };

  const renderProfile = (profile) => {
    const tourProgress = profile.tourProgress[selectedTour.id] ?? {
      bestRoom: 0,
      bossesDefeated: 0,
    };
    const heroProgress = profile.heroProgress[selectedHero.id] ?? { level: 1, xp: 0 };
    const xpRequirement = getHeroXpRequirement(heroProgress.level);
    elements.beans.textContent = profile.beans.toLocaleString("en-US");
    elements.bestRoom.textContent = `${Math.min(tourProgress.bestRoom, selectedTour.rooms.length)} / ${selectedTour.rooms.length}`;
    elements.bossWins.textContent = tourProgress.bossesDefeated.toLocaleString("en-US");
    elements.lifetimeBeans.textContent = profile.lifetimeBeans.toLocaleString("en-US");
    elements.selectedHeroLevel.textContent = String(heroProgress.level);
    elements.selectedHeroXp.textContent = xpRequirement > 0
      ? `${heroProgress.xp} / ${xpRequirement} XP`
      : "MAX LEVEL";
    elements.selectedHeroXpBar.style.width = xpRequirement > 0
      ? `${Math.min(100, (heroProgress.xp / xpRequirement) * 100)}%`
      : "100%";
    renderLoadout(profile);
    renderInventory(profile);
    const checkpoint = profile.activeRun;
    elements.startRunLabel.textContent = checkpoint
      ? `RESUME ${selectedTour.code} // ROOM ${checkpoint.room}`
      : `ENTER ${selectedTour.code}`;
    elements.entryCost.textContent = checkpoint ? "PAID" : String(getRunEntryCost());
    elements.changeHero.disabled = Boolean(checkpoint);
    elements.changeTour.disabled = Boolean(checkpoint);
    elements.openInventory.disabled = Boolean(checkpoint);
  };

  const renderSelectedTour = () => {
    elements.selectedTourCode.textContent = selectedTour.code;
    elements.selectedTourName.textContent = selectedTour.name;
    elements.selectedTourDistrict.textContent = selectedTour.district;
    elements.selectedTourRoute.textContent = formatTourRoute(selectedTour);
    const checkpoint = profileStore.profile.activeRun;
    elements.startRunLabel.textContent = checkpoint
      ? `RESUME ${selectedTour.code} // ROOM ${checkpoint.room}`
      : `ENTER ${selectedTour.code}`;
  };

  const selectTour = (tour) => {
    if (!tour?.unlocked) {
      return;
    }
    selectedTour = tour;
    profileStore.update((draft) => {
      draft.selectedTourId = tour.id;
    });
    renderSelectedTour();
    renderProfile(profileStore.profile);
    renderTourGrid();
    elements.homeNotice.textContent = "";
    elements.tourOverlay.hidden = true;
  };

  const renderTourGrid = () => {
    elements.tourGrid.replaceChildren();
    for (const tour of TOURS) {
      const progress = profileStore.profile.tourProgress[tour.id] ?? {
        bestRoom: 0,
        bossesDefeated: 0,
      };
      const isSelected = tour.id === selectedTour.id;
      const button = document.createElement("button");
      button.className = "tour-option";
      button.classList.toggle("is-selected", isSelected);
      button.classList.toggle("is-locked", !tour.unlocked);
      button.type = "button";
      button.disabled = !tour.unlocked;
      button.setAttribute("aria-pressed", String(isSelected));

      const head = document.createElement("span");
      head.className = "tour-option-head";
      const code = document.createElement("b");
      code.textContent = tour.code;
      const state = document.createElement("em");
      state.textContent = !tour.unlocked ? "LOCKED" : isSelected ? "ACTIVE" : "AVAILABLE";
      head.append(code, state);

      const name = document.createElement("strong");
      name.textContent = tour.name;
      const district = document.createElement("small");
      district.textContent = tour.district;
      const route = document.createElement("span");
      route.className = "tour-option-route";
      route.textContent = formatTourRoute(tour);
      const record = document.createElement("span");
      record.className = "tour-option-record";
      record.textContent = `BEST ${Math.min(progress.bestRoom, tour.rooms.length)} / ${tour.rooms.length} // BOSSES ${progress.bossesDefeated}`;

      button.append(head, name, district, route, record);
      if (tour.unlocked) {
        button.addEventListener("click", () => selectTour(tour));
      }
      elements.tourGrid.append(button);
    }
  };

  const renderSelectedHero = () => {
    const accent = selectedHero.palette.accent;
    elements.selectedHeroCard.style.setProperty("--hero-accent", accent);
    elements.selectedHeroPortrait.style.setProperty("--hero-accent", accent);
    elements.selectedHeroPortrait.dataset.hero = selectedHero.id;
    elements.selectedHeroPortrait.classList.remove("has-art");
    elements.selectedHeroArt.hidden = true;
    renderHeroPortrait(elements.selectedHeroArt, selectedHero)
      .then((rendered) => {
        if (elements.selectedHeroArt.dataset.heroRequest !== selectedHero.id) {
          return;
        }
        elements.selectedHeroArt.hidden = !rendered;
        elements.selectedHeroPortrait.classList.toggle("has-art", rendered);
      })
      .catch(() => {
        elements.selectedHeroArt.hidden = true;
      });
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
    renderProfile(profileStore.profile);
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
      const art = document.createElement("canvas");
      art.className = "hero-art";
      art.hidden = true;
      const mark = document.createElement("span");
      mark.textContent = hero.monogram;
      const placeholder = document.createElement("small");
      placeholder.textContent = hero.art ? "LOADING ART" : "ART PLACEHOLDER";
      portrait.append(art, mark, placeholder);
      renderHeroPortrait(art, hero)
        .then((rendered) => {
          art.hidden = !rendered;
          portrait.classList.toggle("has-art", rendered);
        })
        .catch(() => {
          art.hidden = true;
        });

      const copy = document.createElement("span");
      copy.className = "hero-option-copy";
      const role = document.createElement("span");
      role.textContent = hero.role;
      const name = document.createElement("strong");
      name.textContent = hero.name;
      const weapon = document.createElement("small");
      weapon.textContent = hero.weapon;
      const progress = profileStore.profile.heroProgress[hero.id] ?? { level: 1, xp: 0 };
      const level = document.createElement("b");
      level.className = "hero-option-level";
      level.textContent = `LEVEL ${progress.level} // ${progress.xp} XP`;
      const description = document.createElement("p");
      description.textContent = hero.description;
      copy.append(role, name, weapon, level, description);

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
    elements.tourOverlay.hidden = true;
    elements.equipmentOverlay.hidden = true;
    elements.homeNotice.textContent = "";
    renderProfile(profileStore.profile);
    flushDeferredServiceWorkerUpdate();
  };

  const game = new DoffaGame({
    canvas: elements.canvas,
    profileStore,
    onProfile: renderProfile,
    onHud({
      room,
      totalRooms,
      tourCode,
      roomName,
      roomType,
      wave,
      totalWaves,
      waveCountdown,
      exitOpen,
      heroName,
      heroLevel,
      runLevel,
      runXp,
      runXpToNext,
      weaponName,
      hp,
      maxHp,
    }) {
      elements.hudTour.textContent = tourCode;
      elements.hudRoom.textContent = `${room} / ${totalRooms}`;
      elements.hudRoomName.textContent = roomName;
      elements.hudHeroLabel.textContent = `${heroName} L${heroLevel} // ${weaponName}`;
      elements.hudHealthText.textContent = `${hp} / ${maxHp}`;
      elements.hudHealth.style.width = `${Math.max(0, (hp / maxHp) * 100)}%`;
      const safeRoom = roomType === "rest" || roomType === "event";
      elements.hudWave.textContent = roomType === "rest"
        ? "RECOVERY STATION"
        : roomType === "event" ? "FIELD CONTRACT" : `WAVE ${wave} / ${totalWaves}`;
      elements.hudWaveCountdown.textContent = exitOpen
        ? "EXIT OPEN"
        : roomType === "event"
          ? "SELECT UPGRADE"
          : roomType === "rest"
            ? "SYSTEM STABLE"
            : waveCountdown === null ? "FIGHT" : `NEXT ${Math.max(1, Math.ceil(waveCountdown))}S`;
      const completedWaves = exitOpen
        ? totalWaves
        : waveCountdown === null ? Math.max(0, wave - 1) : wave;
      const waveProgress = safeRoom || totalWaves <= 0
        ? 100
        : Math.min(100, (completedWaves / totalWaves) * 100);
      elements.hudWaveFill.style.width = `${waveProgress}%`;
      elements.hudRunLevel.textContent = String(runLevel);
      elements.hudRunXpText.textContent = runXpToNext > 0
        ? `${runXp} / ${runXpToNext} XP`
        : "MAX LEVEL";
      elements.hudRunXp.style.width = runXpToNext > 0
        ? `${Math.min(100, (runXp / runXpToNext) * 100)}%`
        : "100%";
      elements.controlHint.textContent = exitOpen
        ? roomType === "rest"
          ? "RECOVERY COMPLETE · MOVE INTO THE OPEN DOOR"
          : roomType === "event"
            ? "CONTRACT ACCEPTED · MOVE INTO THE OPEN DOOR"
            : "ROOM CLEARED · MOVE INTO THE OPEN DOOR"
        : roomType === "event"
          ? "SELECT ONE FIELD UPGRADE"
          : waveCountdown === null
            ? "DRAG TO MOVE · RELEASE TO FIRE"
            : `NEXT WAVE IN ${Math.max(1, Math.ceil(waveCountdown))}`;
    },
    onAbilityChoice(choices, context = {}) {
      const levelChoice = context.source === "level";
      const eventChoice = context.source === "event";
      elements.abilityKicker.textContent = eventChoice
        ? selectedTour.id === "rootfall-jungle" ? "ROOTFALL COVENANT" : "BROKER'S FIELD CONTRACT"
        : levelChoice ? `POWER LEVEL ${context.runLevel}` : `${selectedTour.code} INITIATION`;
      elements.abilityDescription.textContent = eventChoice
        ? "The room offers one free field upgrade. Choose, then leave through the upper door."
        : context.pendingChoices > 0
          ? `${context.pendingChoices + 1} upgrades earned. Choose them one at a time.`
          : levelChoice ? "Level secured. Choose one upgrade." : "One upgrade. No undo.";
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
            elements.abilityOverlay.hidden = game.mode !== "choice";
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
        ? result.tour.id === "rootfall-jungle" ? "THE ROOT TYRANT FELL." : "THE ROASTER FELL."
        : "THE CHAMBER WON.";
      elements.resultRoom.textContent = String(result.roomsCleared);
      elements.resultTour.textContent = result.tour.code;
      elements.resultHero.textContent = result.hero.name;
      elements.resultRunLevel.textContent = `LEVEL ${result.runLevel}`;
      elements.resultBeans.textContent = `+${result.beanReward}`;
      elements.resultXp.textContent = `+${result.xpReward} XP`;
      elements.resultLevel.textContent = result.levelsGained > 0
        ? `LEVEL ${result.heroLevelBefore} → ${result.heroLevelAfter}`
        : `LEVEL ${result.heroLevelAfter}`;
      const dropDefinition = getEquipmentDefinition(result.equipmentDrop?.itemId);
      const dropRarity = getRarityDefinition(result.equipmentDrop?.rarity);
      elements.resultDrop.textContent = dropDefinition && dropRarity
        ? `${dropRarity.name} // ${dropDefinition.name}`
        : result.inventoryFull ? "ARMORY FULL" : "NONE";
      elements.resultReceipt.textContent = result.receipt.id.slice(0, 12).toUpperCase();
      elements.resultOverlay.hidden = false;
    },
  });

  elements.entryCost.textContent = profileStore.profile.activeRun ? "PAID" : String(getRunEntryCost());
  renderSelectedTour();
  renderTourGrid();
  renderSelectedHero();
  renderHeroGrid();
  renderProfile(profileStore.profile);
  if (profileStore.profile.activeRun) {
    elements.homeNotice.textContent = "SAFE CHECKPOINT FOUND. RESUME WITHOUT ANOTHER ENTRY CHARGE.";
  }
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
    const resuming = Boolean(profileStore.profile.activeRun);
    const result = resuming
      ? game.resumeRun()
      : game.beginRun(selectedTour.id, selectedHero.id);
    if (!result.ok) {
      if (result.reason === "no-checkpoint" || result.reason === "invalid-checkpoint") {
        elements.homeNotice.textContent = "THE SAVED RUN COULD NOT BE RESTORED. START A NEW RUN.";
        renderProfile(profileStore.profile);
        return;
      }
      if (result.reason === "tour-unavailable") {
        elements.homeNotice.textContent = "THIS TOUR IS NOT AVAILABLE IN THIS BUILD.";
        return;
      }
      if (result.reason === "hero-unavailable") {
        elements.homeNotice.textContent = "THIS HERO IS NOT AVAILABLE IN THIS BUILD.";
        return;
      }
      if (result.reason === "run-in-progress") {
        elements.homeNotice.textContent = "A SAVED RUN IS ALREADY ACTIVE. RESUME IT FIRST.";
        return;
      }
      elements.homeNotice.textContent = `CHARGE ${result.missingBeans} MORE BEANS.`;
      return;
    }

    selectedTour = result.tour ?? selectedTour;
    selectedHero = result.hero ?? selectedHero;
    renderSelectedTour();
    renderSelectedHero();
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
    elements.tourOverlay.hidden = true;
    elements.equipmentOverlay.hidden = true;
    elements.heroOverlay.hidden = false;
  });

  elements.closeHeroSelect.addEventListener("click", () => {
    elements.heroOverlay.hidden = true;
  });

  elements.changeTour.addEventListener("click", () => {
    renderTourGrid();
    elements.heroOverlay.hidden = true;
    elements.equipmentOverlay.hidden = true;
    elements.tourOverlay.hidden = false;
  });

  elements.closeTourSelect.addEventListener("click", () => {
    elements.tourOverlay.hidden = true;
  });

  elements.openInventory.addEventListener("click", openInventory);

  elements.closeInventory.addEventListener("click", () => {
    elements.equipmentOverlay.hidden = true;
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

  registerServiceWorker(elements, () => isRunModeActive(game.mode))
    .then((updateControl) => {
      flushDeferredServiceWorkerUpdate = updateControl.flush;
      flushDeferredServiceWorkerUpdate();
    })
    .catch(() => {
      // A failed update check must not prevent offline gameplay.
    });
}

async function registerServiceWorker(elements, isRunActive) {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) {
    return { flush() {} };
  }

  const registration = await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
  const updateMessage = elements.updateBanner.querySelector("span");
  let waitingWorker = null;
  let activationRequested = false;
  let reloadDeferred = false;
  let refreshing = false;

  const setUpdateMessage = (message) => {
    if (updateMessage) {
      updateMessage.textContent = message;
    }
  };

  const activateWaitingWorker = () => {
    if (!waitingWorker) {
      return;
    }
    if (isRunActive()) {
      activationRequested = true;
      setUpdateMessage("Update queued. Finish this run, then return home.");
      elements.applyUpdate.textContent = "UPDATE QUEUED";
      elements.applyUpdate.disabled = true;
      return;
    }

    activationRequested = false;
    setUpdateMessage("Applying the new build…");
    elements.applyUpdate.textContent = "UPDATING";
    elements.applyUpdate.disabled = true;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  const flush = () => {
    if (isRunActive()) {
      return;
    }
    if (reloadDeferred) {
      reloadDeferred = false;
      refreshing = true;
      window.location.reload();
      return;
    }
    if (activationRequested) {
      activateWaitingWorker();
    }
  };

  const showUpdate = (worker) => {
    if (!worker || !navigator.serviceWorker.controller) {
      return;
    }
    waitingWorker = worker;
    elements.updateBanner.hidden = false;
    setUpdateMessage("A new build is ready.");
    elements.applyUpdate.textContent = "UPDATE NOW";
    elements.applyUpdate.disabled = false;
    elements.applyUpdate.onclick = activateWaitingWorker;
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

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) {
      return;
    }
    if (isRunActive()) {
      reloadDeferred = true;
      elements.updateBanner.hidden = false;
      setUpdateMessage("Update installed. Finish this run, then return home.");
      elements.applyUpdate.textContent = "RESTART QUEUED";
      elements.applyUpdate.disabled = true;
      return;
    }
    refreshing = true;
    window.location.reload();
  });

  window.setInterval(() => registration.update(), 30 * 60 * 1_000);
  return { flush };
}
