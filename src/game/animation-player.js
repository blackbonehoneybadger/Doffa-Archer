export const DIRECTIONAL_ANIMATION_LAYOUT_VERSION = 1;

const MAX_ATLAS_COLUMNS = 32;
const MAX_ATLAS_ROWS = 256;
const MAX_CLIP_FRAMES = 64;
const MAX_CLIP_FPS = 60;
const SAFE_PAGE_SPRITE = /^\/assets\/(?:heroes|enemies)\/[a-z0-9-]+\.png$/;

function safeClock(value) {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function isPositiveInteger(value, maximum) {
  return Number.isInteger(value) && value > 0 && value <= maximum;
}

function validatePageGeometry(page, label, errors) {
  if (!page || typeof page !== "object" || Array.isArray(page)) {
    errors.push(`${label} must be an object`);
    return;
  }
  if (!isPositiveInteger(page.columns, MAX_ATLAS_COLUMNS)) {
    errors.push(`${label} columns must be a bounded positive integer`);
  }
  if (!isPositiveInteger(page.rows, MAX_ATLAS_ROWS)) {
    errors.push(`${label} rows must be a bounded positive integer`);
  }
  if (
    !Array.isArray(page.directions)
    || page.directions.length === 0
    || new Set(page.directions).size !== page.directions.length
    || page.directions.some((direction) => typeof direction !== "string" || !direction)
  ) {
    errors.push(`${label} directions must be unique non-empty strings`);
  } else if (Number.isInteger(page.columns) && page.directions.length > page.columns) {
    errors.push(`${label} has more directions than columns`);
  }
  if (
    page.sprite !== undefined
    && (typeof page.sprite !== "string" || !SAFE_PAGE_SPRITE.test(page.sprite))
  ) {
    errors.push(`${label} sprite must be a safe local PNG path`);
  }
}

function resolveAnimationPage(atlas, clip, direction) {
  if (atlas.pages && Array.isArray(clip.pages)) {
    for (const pageId of clip.pages) {
      const page = atlas.pages[pageId];
      const directionIndex = page?.directions?.indexOf(direction) ?? -1;
      if (directionIndex >= 0) {
        return { pageId, page, directionIndex };
      }
    }
    return null;
  }
  const directionIndex = atlas.directions?.indexOf(direction) ?? -1;
  return directionIndex >= 0
    ? { pageId: null, page: atlas, directionIndex }
    : null;
}

export function validateDirectionalAnimationAtlas(atlas, options = {}) {
  const errors = [];
  if (!atlas || typeof atlas !== "object") {
    return ["animation atlas must be an object"];
  }
  if (atlas.version !== DIRECTIONAL_ANIMATION_LAYOUT_VERSION) {
    errors.push("animation atlas uses an unsupported layout version");
  }
  const directions = atlas.directions;
  if (
    !Array.isArray(directions)
    || directions.length === 0
    || new Set(directions).size !== directions.length
    || directions.some((direction) => typeof direction !== "string" || !direction)
  ) {
    errors.push("animation atlas directions must be unique non-empty strings");
  } else {
    const requiredDirections = options.directions ?? [];
    for (const direction of requiredDirections) {
      if (!directions.includes(direction)) {
        errors.push(`animation atlas is missing direction ${direction}`);
      }
    }
  }

  const paged = atlas.pages && typeof atlas.pages === "object" && !Array.isArray(atlas.pages);
  if (paged) {
    const pageEntries = Object.entries(atlas.pages);
    if (pageEntries.length === 0) {
      errors.push("animation atlas pages must not be empty");
    }
    for (const [pageId, page] of pageEntries) {
      if (!pageId) {
        errors.push("animation page id must not be empty");
      }
      validatePageGeometry(page, `animation page ${pageId}`, errors);
      if (!page?.sprite) {
        errors.push(`animation page ${pageId} must define a sprite`);
      }
      for (const direction of page?.directions ?? []) {
        if (Array.isArray(directions) && !directions.includes(direction)) {
          errors.push(`animation page ${pageId} uses unknown direction ${direction}`);
        }
      }
    }
  } else {
    validatePageGeometry(atlas, "animation atlas", errors);
  }

  const clips = atlas.clips;
  if (!clips || typeof clips !== "object" || Array.isArray(clips)) {
    errors.push("animation atlas clips must be an object");
    return errors;
  }

  const clipEntries = Object.entries(clips);
  if (clipEntries.length === 0) {
    errors.push("animation atlas must define at least one clip");
  }
  for (const [state, clip] of clipEntries) {
    if (!state || !clip || typeof clip !== "object" || Array.isArray(clip)) {
      errors.push(`animation clip ${state || "<empty>"} must be an object`);
      continue;
    }
    if (!Number.isInteger(clip.startRow) || clip.startRow < 0) {
      errors.push(`animation clip ${state} has an invalid start row`);
    }
    if (!isPositiveInteger(clip.frameCount, MAX_CLIP_FRAMES)) {
      errors.push(`animation clip ${state} has an invalid frame count`);
    }
    if (!Number.isFinite(clip.fps) || clip.fps <= 0 || clip.fps > MAX_CLIP_FPS) {
      errors.push(`animation clip ${state} has an invalid fps`);
    }
    if (typeof clip.loop !== "boolean") {
      errors.push(`animation clip ${state} must declare loop as a boolean`);
    }
    if (clip.lockDirection !== undefined && typeof clip.lockDirection !== "boolean") {
      errors.push(`animation clip ${state} has an invalid direction lock`);
    }
    if (paged) {
      if (
        !Array.isArray(clip.pages)
        || clip.pages.length === 0
        || new Set(clip.pages).size !== clip.pages.length
      ) {
        errors.push(`animation clip ${state} must declare unique physical pages`);
      } else {
        const directionCounts = new Map((directions ?? []).map((direction) => [direction, 0]));
        for (const pageId of clip.pages) {
          const page = atlas.pages[pageId];
          if (!page) {
            errors.push(`animation clip ${state} references unknown page ${pageId}`);
            continue;
          }
          if (
            Number.isInteger(clip.startRow)
            && isPositiveInteger(clip.frameCount, MAX_CLIP_FRAMES)
            && Number.isInteger(page.rows)
            && clip.startRow + clip.frameCount > page.rows
          ) {
            errors.push(`animation clip ${state} exceeds page ${pageId} rows`);
          }
          for (const direction of page.directions ?? []) {
            directionCounts.set(direction, (directionCounts.get(direction) ?? 0) + 1);
          }
        }
        for (const [direction, count] of directionCounts) {
          if (count !== 1) {
            errors.push(`animation clip ${state} must cover direction ${direction} exactly once`);
          }
        }
      }
    } else if (
      Number.isInteger(atlas.rows)
      && Number.isInteger(clip.startRow)
      && isPositiveInteger(clip.frameCount, MAX_CLIP_FRAMES)
      && clip.startRow + clip.frameCount > atlas.rows
    ) {
      errors.push(`animation clip ${state} exceeds the atlas rows`);
    }
  }

  for (const state of options.states ?? []) {
    if (!clips[state]) {
      errors.push(`animation atlas is missing clip ${state}`);
    }
  }
  return errors;
}

export function freezeDirectionalAnimationAtlas(atlas) {
  if (!atlas || typeof atlas !== "object") {
    return null;
  }
  return Object.freeze({
    ...atlas,
    directions: Object.freeze([...(atlas.directions ?? [])]),
    pages: atlas.pages
      ? Object.freeze(
        Object.fromEntries(
          Object.entries(atlas.pages).map(([pageId, page]) => [
            pageId,
            Object.freeze({
              ...page,
              directions: Object.freeze([...(page.directions ?? [])]),
            }),
          ]),
        ),
      )
      : undefined,
    clips: Object.freeze(
      Object.fromEntries(
        Object.entries(atlas.clips ?? {}).map(([state, clip]) => [
          state,
          Object.freeze({
            ...clip,
            pages: clip.pages ? Object.freeze([...clip.pages]) : undefined,
          }),
        ]),
      ),
    ),
  });
}

export function restartAnimationTimeline(subject, state, direction = null) {
  if (!subject || typeof state !== "string" || !state) {
    return subject;
  }
  subject.animationState = state;
  subject.animationStateClock = 0;
  subject.animationStateDirection = typeof direction === "string" && direction
    ? direction
    : null;
  return subject;
}

export function advanceAnimationTimeline(subject, state, delta, direction = null) {
  if (!subject || typeof state !== "string" || !state) {
    return subject;
  }
  if (!Number.isFinite(delta) || delta < 0) {
    return subject;
  }
  if (subject.animationState !== state) {
    return restartAnimationTimeline(subject, state, direction);
  }
  subject.animationStateClock = safeClock(subject.animationStateClock) + delta;
  return subject;
}

export function getDirectionalAnimationFrame(subject, state, direction, atlas) {
  if (!atlas || atlas.version !== DIRECTIONAL_ANIMATION_LAYOUT_VERSION) {
    return null;
  }
  const clip = atlas.clips[state];
  const selectedDirection = clip?.lockDirection
    && subject?.animationState === state
    && typeof subject.animationStateDirection === "string"
    ? subject.animationStateDirection
    : direction;
  const resolvedPage = clip
    ? resolveAnimationPage(atlas, clip, selectedDirection)
    : null;
  if (
    !clip
    || !resolvedPage
    || !isPositiveInteger(resolvedPage.page?.columns, MAX_ATLAS_COLUMNS)
    || !isPositiveInteger(resolvedPage.page?.rows, MAX_ATLAS_ROWS)
    || !Number.isInteger(clip.startRow)
    || clip.startRow < 0
    || !isPositiveInteger(clip.frameCount, MAX_CLIP_FRAMES)
    || !Number.isFinite(clip.fps)
    || clip.fps <= 0
  ) {
    return null;
  }

  const clock = subject?.animationState === state
    ? safeClock(subject.animationStateClock)
    : 0;
  const rawSequenceIndex = Math.floor(clock * clip.fps);
  const sequenceIndex = clip.loop
    ? rawSequenceIndex % clip.frameCount
    : Math.min(clip.frameCount - 1, rawSequenceIndex);
  const row = clip.startRow + sequenceIndex;
  if (row >= resolvedPage.page.rows) {
    return null;
  }
  const column = resolvedPage.directionIndex;

  return Object.freeze({
    state,
    direction: selectedDirection,
    index: row * resolvedPage.page.columns + column,
    column,
    row,
    columns: resolvedPage.page.columns,
    rows: resolvedPage.page.rows,
    ...(resolvedPage.pageId !== null ? { page: resolvedPage.pageId } : {}),
    sequenceIndex,
    frameCount: clip.frameCount,
    fps: clip.fps,
    loop: clip.loop,
    completed: !clip.loop && rawSequenceIndex >= clip.frameCount,
  });
}

export function getDirectionalAnimationSourceRect(frame, width, height) {
  if (
    !frame
    || !isPositiveInteger(frame.columns, MAX_ATLAS_COLUMNS)
    || !isPositiveInteger(frame.rows, MAX_ATLAS_ROWS)
    || !Number.isInteger(frame.column)
    || frame.column < 0
    || frame.column >= frame.columns
    || !Number.isInteger(frame.row)
    || frame.row < 0
    || frame.row >= frame.rows
    || !Number.isFinite(width)
    || width <= 0
    || !Number.isFinite(height)
    || height <= 0
  ) {
    return null;
  }
  const cellWidth = width / frame.columns;
  const cellHeight = height / frame.rows;
  return Object.freeze({
    x: frame.column * cellWidth,
    y: frame.row * cellHeight,
    width: cellWidth,
    height: cellHeight,
  });
}
