import test from "node:test";
import assert from "node:assert/strict";

import { isRunModeActive, resolveAvailableTour } from "../src/ui/app.js";

const defaultTour = Object.freeze({ id: "hollow-roastery", unlocked: true });
const rootfallTour = Object.freeze({ id: "rootfall-jungle", unlocked: true });

test("tour selection resolves an unlocked saved tour from the actual catalog", () => {
  assert.equal(
    resolveAvailableTour("rootfall-jungle", [defaultTour, rootfallTour]),
    rootfallTour,
  );
});

test("tour selection falls back when saved content is missing or locked", () => {
  assert.equal(resolveAvailableTour("rootfall-jungle", [defaultTour]), defaultTour);
  assert.equal(
    resolveAvailableTour("rootfall-jungle", [
      defaultTour,
      { id: "rootfall-jungle", unlocked: false },
    ]),
    defaultTour,
  );
});

test("tour selection uses the first unlocked catalog entry when the default is absent", () => {
  assert.equal(resolveAvailableTour("missing", [rootfallTour]), rootfallTour);
  assert.equal(resolveAvailableTour("missing", []), null);
});

test("PWA updates treat only live run modes as unsafe reload points", () => {
  for (const mode of ["running", "choice", "exit", "dying"]) {
    assert.equal(isRunModeActive(mode), true, `${mode} must defer an update`);
  }
  for (const mode of ["idle", "result", undefined]) {
    assert.equal(isRunModeActive(mode), false, `${mode} may apply an update`);
  }
});
