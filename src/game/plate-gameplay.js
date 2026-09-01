import { VIEWPORT } from "../config/game-config.js";
import { getRoomArt } from "./room-art.js";

export const PLATE_PLAY_BOUNDS = Object.freeze({
  left: 36,
  right: 684,
  top: 210,
  bottom: 1210,
});

export function getRoomArtForDefinition(roomDefinition, roomNumber) {
  if (!roomDefinition) {
    return null;
  }
  return getRoomArt(roomDefinition.environment ?? "ash", {
    roomId: roomDefinition.id,
    roomNumber,
    artVariant: roomDefinition.artVariant,
  });
}

export function roomHasAuthoredPlate(roomDefinition, roomNumber) {
  return Boolean(getRoomArtForDefinition(roomDefinition, roomNumber)?.sprite);
}

export function resolvePlayBounds(usesPlateGameplay = false) {
  return usesPlateGameplay ? PLATE_PLAY_BOUNDS : VIEWPORT.arena;
}
