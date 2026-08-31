import { getRoomArt } from "./room-art.js";

export const ROOM_ASSET_LOOKAHEAD = 1;

function emptyWindow() {
  return {
    rooms: [],
    combatRoom: null,
    enemyIds: new Set(),
    destructibleTypes: new Set(),
    roomSprites: new Set(),
  };
}

export function getRoomAssetWindow(
  tour,
  roomNumber,
  {
    lookahead = ROOM_ASSET_LOOKAHEAD,
    combatRoomOffset = 0,
  } = {},
) {
  if (
    !Array.isArray(tour?.rooms)
    || !Number.isInteger(roomNumber)
    || roomNumber < 1
    || !Number.isInteger(lookahead)
    || lookahead < 0
    || !Number.isInteger(combatRoomOffset)
    || combatRoomOffset < 0
    || combatRoomOffset > lookahead
  ) {
    return emptyWindow();
  }

  const rooms = tour.rooms.slice(roomNumber - 1, roomNumber + lookahead);
  const enemyIds = new Set();
  const destructibleTypes = new Set();
  const roomSprites = new Set();

  const combatRoom = rooms[combatRoomOffset];
  for (const enemyId of combatRoom?.enemies ?? []) {
    enemyIds.add(enemyId);
  }
  const destructibleRooms = combatRoomOffset > 0
    ? rooms.slice(0, combatRoomOffset + 1)
    : [combatRoom];
  for (const room of destructibleRooms) {
    for (const destructible of room?.destructibles ?? []) {
      if (destructible?.type) {
        destructibleTypes.add(destructible.type);
      }
    }
  }

  for (let offset = 0; offset < rooms.length; offset += 1) {
    const room = rooms[offset];
    const art = getRoomArt(room?.environment, {
      roomId: room?.id,
      roomNumber: roomNumber + offset,
      artVariant: room?.artVariant,
    });
    if (art?.sprite) {
      roomSprites.add(art.sprite);
    }
  }

  return { rooms, combatRoom: combatRoom ?? null, enemyIds, destructibleTypes, roomSprites };
}
