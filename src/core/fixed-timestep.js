export const FIXED_STEP_SECONDS = 1 / 60;
export const MAX_CATCH_UP_SECONDS = 0.25;
export const MAX_STEPS_PER_FRAME = 15;

export function consumeFixedSteps(
  accumulator,
  elapsedSeconds,
  runStep,
  shouldContinue = () => true,
) {
  if (!Number.isFinite(accumulator) || accumulator < 0) {
    throw new RangeError("accumulator must be a non-negative finite number");
  }
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) {
    throw new RangeError("elapsedSeconds must be a non-negative finite number");
  }
  if (typeof runStep !== "function" || typeof shouldContinue !== "function") {
    throw new TypeError("runStep and shouldContinue must be functions");
  }

  let remaining = Math.min(accumulator + elapsedSeconds, MAX_CATCH_UP_SECONDS);
  let steps = 0;

  while (
    remaining >= FIXED_STEP_SECONDS &&
    steps < MAX_STEPS_PER_FRAME &&
    shouldContinue()
  ) {
    runStep(FIXED_STEP_SECONDS);
    remaining -= FIXED_STEP_SECONDS;
    steps += 1;
  }

  return {
    accumulator: remaining,
    steps,
  };
}
