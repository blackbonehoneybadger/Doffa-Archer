import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import {
  HIGGSFIELD_CLIP_SPECS,
  HIGGSFIELD_RUNTIME_DIRECTIONS,
  assembleHiggsfieldMultiframePages,
  validateHiggsfieldMultiframeManifest,
} from "../scripts/build-higgsfield-multiframe-pages.mjs";
import { validateImageFile } from "../scripts/validate-images.mjs";

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(
    result.status,
    0,
    result.stderr?.trim() || result.error?.message || `${command} failed`,
  );
  return result.stdout.trim();
}

function createManifest() {
  const frames = [];
  for (const [clip, definition] of Object.entries(HIGGSFIELD_CLIP_SPECS)) {
    for (const direction of HIGGSFIELD_RUNTIME_DIRECTIONS) {
      for (let frame = 0; frame < definition.frameCount; frame += 1) {
        frames.push({
          clip,
          direction,
          frame,
          source: `frames/${clip}/${direction}/${String(frame).padStart(3, "0")}.png`,
          jobId: `fixture-${clip}-${direction}-${frame}`,
        });
      }
    }
  }
  return {
    version: 1,
    enemyId: "fixture-creature",
    frame: { width: 288, height: 336 },
    directions: [...HIGGSFIELD_RUNTIME_DIRECTIONS],
    clips: {
      idle: { frameCount: 4, fps: 4, loop: true },
      move: { frameCount: 6, fps: 10, loop: true },
      attack: {
        frameCount: 6,
        fps: 15,
        loop: false,
        lockDirection: true,
      },
    },
    quality: {
      provider: "higgsfield",
      model: "seedream_v4_5",
      tier: "high",
      allowFallback: false,
      allowMirroring: false,
      allowRotation: false,
      allowUpscaling: false,
      losslessOutput: true,
    },
    chroma: {
      keyColor: "#00ff00",
      tolerancePercent: 4,
      minimumMarginPercent: 8,
    },
    normalization: {
      paddingPixels: 8,
      alignment: "bottom",
    },
    frames,
  };
}

function createFixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "doffa-higgsfield-test-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const manifest = createManifest();
  const sourceMaster = join(directory, "source-master.png");
  run("convert", [
    "-size",
    "640x720",
    "xc:#00ff00",
    "-fill",
    "#402016",
    "-draw",
    "rectangle 160,144 480,648",
    // This enclosed patch deliberately matches the external key color. A
    // safe border-connected extraction must preserve it as opaque subject art.
    "-fill",
    "#00ff00",
    "-draw",
    "rectangle 270,300 370,450",
    `PNG32:${sourceMaster}`,
  ]);
  for (const entry of manifest.frames) {
    const destination = join(directory, entry.source);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(sourceMaster, destination);
  }
  const manifestPath = join(directory, "manifest.json");
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return { directory, manifest, manifestPath };
}

function digest(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

test("production manifest requires exact 128-frame directional clip coverage", () => {
  const manifest = createManifest();
  assert.equal(manifest.frames.length, 128);
  assert.deepEqual(
    validateHiggsfieldMultiframeManifest(manifest, {
      manifestDirectory: tmpdir(),
    }),
    [],
  );

  const missing = structuredClone(manifest);
  missing.frames.pop();
  const missingErrors = validateHiggsfieldMultiframeManifest(missing, {
    manifestDirectory: tmpdir(),
  });
  assert.ok(missingErrors.some((error) => error.includes("exactly 128")));
  assert.ok(missingErrors.some((error) => error.includes("missing source frame")));

  const reused = structuredClone(manifest);
  reused.frames[1].source = reused.frames[0].source;
  const reusedErrors = validateHiggsfieldMultiframeManifest(reused, {
    manifestDirectory: tmpdir(),
  });
  assert.ok(reusedErrors.some((error) => error.includes("reuses another source path")));

  const downgraded = structuredClone(manifest);
  downgraded.quality.tier = "basic";
  downgraded.quality.allowFallback = true;
  downgraded.quality.model = "nano_banana_2_lite";
  const qualityErrors = validateHiggsfieldMultiframeManifest(downgraded, {
    manifestDirectory: tmpdir(),
  });
  assert.ok(qualityErrors.some((error) => error.includes("high, max, or 4k")));
  assert.ok(qualityErrors.some((error) => error.includes("allowFallback must be false")));
  assert.ok(qualityErrors.some((error) => error.includes("explicitly rejected")));

  const missingProvenance = structuredClone(manifest);
  delete missingProvenance.frames[0].jobId;
  const provenanceErrors = validateHiggsfieldMultiframeManifest(missingProvenance, {
    manifestDirectory: tmpdir(),
  });
  assert.ok(provenanceErrors.some((error) => error.includes("source Higgsfield job")));
});

test("assembler emits deterministic lossless A/B pages at exact dimensions", (t) => {
  const fixture = createFixture(t);
  const firstDirectory = join(fixture.directory, "first-output");
  const secondDirectory = join(fixture.directory, "second-output");
  const first = assembleHiggsfieldMultiframePages({
    manifest: fixture.manifest,
    manifestPath: fixture.manifestPath,
    outputDirectory: firstDirectory,
  });
  const second = assembleHiggsfieldMultiframePages({
    manifest: fixture.manifest,
    manifestPath: fixture.manifestPath,
    outputDirectory: secondDirectory,
  });

  assert.equal(first.sourceFrameCount, 128);
  assert.equal(first.outputs.length, 6);
  assert.deepEqual(
    first.outputs.map(({ clip, page, width, height, channels, depth }) => ({
      clip,
      page,
      width,
      height,
      channels,
      depth,
    })),
    [
      { clip: "idle", page: "a", width: 1152, height: 1344, channels: "srgba", depth: 8 },
      { clip: "idle", page: "b", width: 1152, height: 1344, channels: "srgba", depth: 8 },
      { clip: "move", page: "a", width: 1152, height: 2016, channels: "srgba", depth: 8 },
      { clip: "move", page: "b", width: 1152, height: 2016, channels: "srgba", depth: 8 },
      { clip: "attack", page: "a", width: 1152, height: 2016, channels: "srgba", depth: 8 },
      { clip: "attack", page: "b", width: 1152, height: 2016, channels: "srgba", depth: 8 },
    ],
  );

  for (let index = 0; index < first.outputs.length; index += 1) {
    const firstOutput = first.outputs[index];
    const secondOutput = second.outputs[index];
    assert.deepEqual(
      validateImageFile(firstOutput.path),
      {
        format: "png",
        width: firstOutput.width,
        height: firstOutput.height,
      },
    );
    assert.equal(digest(firstOutput.path), digest(secondOutput.path));
  }

  const idlePage = first.outputs.find(
    (output) => output.clip === "idle" && output.page === "a",
  ).path;
  const transparentCorner = run("convert", [
    idlePage,
    "-format",
    "%[pixel:p{0,0}]",
    "info:",
  ]);
  const retainedInteriorChroma = run("convert", [
    idlePage,
    "-format",
    "%[pixel:p{144,170}]",
    "info:",
  ]);
  assert.match(transparentCorner, /srgba\([^,]+,[^,]+,[^,]+,0\)/);
  assert.match(retainedInteriorChroma, /srgba\(0,255,0,1\)/);
});

test("assembler deep-decodes every registered source before publishing", (t) => {
  const fixture = createFixture(t);
  const firstSource = join(fixture.directory, fixture.manifest.frames[0].source);
  writeFileSync(firstSource, readFileSync(firstSource).subarray(0, 64));

  assert.throws(
    () => assembleHiggsfieldMultiframePages({
      manifest: fixture.manifest,
      manifestPath: fixture.manifestPath,
      outputDirectory: join(fixture.directory, "broken-output"),
    }),
    /truncated|incomplete|cannot be inflated|invalid CRC/,
  );
});
