import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const expectedReferences = new Map([
  ['boy-source.jpeg', 'f14249316cb7032622d8192d4043d2f3a448e3199dfe3ee3e11bf720147e0f8f'],
  ['hadida-source.jpeg', 'ef6bbf632c1a98dd9c84eb9341e1d2767778f823a695038b1b8031d424456a5b'],
  ['honey-badger-source.jpeg', '9817c40cbec86835c0471dd3a13a5b1837be180be70914b902d6dfcfcaa4bbbb'],
  ['mr-kroo-source.jpeg', '670ea6b216e0bff491b5b7a3bb5be7e56a192652486dd718c73f745d92e6f34c'],
  ['pata-source.jpeg', '18b1bca92df9198cdb4eef9ee97c63284494baa345874ed65a537d2b74a67dc5'],
]);

test('Unity production project is pinned to the approved LTS editor and packages', async () => {
  const projectVersion = await readFile('unity/DOFFA-Heroes/ProjectSettings/ProjectVersion.txt', 'utf8');
  const manifest = JSON.parse(await readFile('unity/DOFFA-Heroes/Packages/manifest.json', 'utf8'));

  assert.match(projectVersion, /m_EditorVersion: 6000\.3\.22f1/);
  assert.equal(manifest.dependencies['com.unity.inputsystem'], '1.16.0');
  assert.equal(manifest.dependencies['com.unity.render-pipelines.universal'], '17.3.0');
  assert.equal(manifest.dependencies['com.unity.ugui'], '2.0.0');
  assert.equal(manifest.dependencies['com.unity.modules.animation'], '1.0.0');
  assert.equal(manifest.dependencies['com.unity.modules.audio'], '1.0.0');
  assert.equal(manifest.dependencies['com.unity.modules.physics'], '1.0.0');
  assert.equal(manifest.dependencies['com.unity.modules.ui'], '1.0.0');
});

test('all five immutable hero source references retain their approved bytes', async () => {
  for (const [fileName, expectedHash] of expectedReferences) {
    const bytes = await readFile(`docs/references/characters/${fileName}`);
    const actualHash = createHash('sha256').update(bytes).digest('hex');
    assert.equal(actualHash, expectedHash, `${fileName} must not be regenerated or silently replaced`);
  }
});

test('Unity validators encode the five-tour, fifty-room production contract', async () => {
  const tourDefinition = await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Scripts/Runtime/Content/TourDefinition.cs',
    'utf8',
  );
  const validator = await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Editor/ProductionContentValidator.cs',
    'utf8',
  );

  assert.match(tourDefinition, /RequiredRoomCount = 50/);
  assert.match(validator, /RequiredHeroCount = 5/);
  assert.match(validator, /RequiredTourCount = 5/);
  assert.match(validator, /room 50 must be Boss|ValidateMilestone\(tour, rooms, 50, RoomKind\.Boss/);
});

test('prototype room builder wires movement, collision, bounded camera, combat, touch, and exit', async () => {
  const motor = await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Scripts/Runtime/Gameplay/DoffaPlayerMotor.cs',
    'utf8',
  );
  const builder = await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Editor/PrototypeRoomBuilder.cs',
    'utf8',
  );

  assert.match(motor, /RequireComponent\(typeof\(CharacterController\)\)/);
  assert.match(motor, /Quaternion\.RotateTowards/);
  assert.match(motor, /animator\.SetFloat\(SpeedHash, NormalizedSpeed/);
  assert.match(motor, /animator\.applyRootMotion = false/);
  assert.match(builder, /Room_Prototype_01\.unity/);
  assert.match(builder, /player\.transform\.position = new Vector3\(0f, 0f, -6\.5f\)/);
  assert.match(builder, /CreateBoundary\(environment/);
  assert.match(builder, /CreateObstacles\(environment/);
  assert.match(builder, /CreateEnemies\(enemyMaterial, telegraphMaterial/);
  assert.match(builder, /rig\.Configure\(target, new Vector2\(-2\.2f, -5\.8f\)/);
  assert.match(builder, /AddComponent<PrototypeExitDoor>/);
  assert.match(builder, /AddComponent<DoffaVirtualStick>/);
  assert.match(builder, /typeof\(InputSystemUIInputModule\)/);
  assert.match(builder, /typeof\(DoffaSafeArea\)/);
  assert.match(builder, /EnsureSceneInBuildSettings\(ScenePath\)/);
});

test('gray-room combat has telegraphed enemies, incoming damage, clearance, restart, and diagnostics', async () => {
  const enemy = await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Scripts/Runtime/Gameplay/PrototypeEnemyAgent.cs',
    'utf8',
  );
  const health = await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Scripts/Runtime/Gameplay/PrototypeCombatantHealth.cs',
    'utf8',
  );
  const room = await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Scripts/Runtime/Gameplay/PrototypeRoomController.cs',
    'utf8',
  );
  const exit = await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Scripts/Runtime/Gameplay/PrototypeExitTrigger.cs',
    'utf8',
  );
  const diagnostics = await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Scripts/Runtime/Gameplay/PrototypeRoomDiagnostics.cs',
    'utf8',
  );
  const performance = await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Scripts/Runtime/Gameplay/PrototypeRuntimePerformance.cs',
    'utf8',
  );
  const acceptance = await readFile('docs/UNITY_PROTOTYPE_ROOM_ACCEPTANCE_RU.md', 'utf8');

  assert.match(enemy, /EnemyState\.Windup/);
  assert.match(enemy, /SelectSteeringDirection/);
  assert.match(enemy, /playerHealth\.ApplyDamage\(attackDamage\)/);
  assert.match(enemy, /SetTelegraph\(true\)/);
  assert.match(enemy, /HasLineOfSightToPlayer/);
  assert.doesNotMatch(await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Scripts/Runtime/Gameplay/PrototypeAutoAttack.cs',
    'utf8',
  ), /FindObjectsByType/);
  assert.match(health, /public event Action<PrototypeCombatantHealth> Died/);
  assert.match(room, /RemainingEnemies == 0/);
  assert.match(room, /exitDoor\.SetOpen\(true\)/);
  assert.match(room, /SceneManager\.LoadScene/);
  assert.match(exit, /PlayerExited\?\.Invoke/);
  assert.match(diagnostics, /may be stuck/);
  assert.match(performance, /Application\.targetFrameRate = targetFrameRate/);
  assert.match(acceptance, /Десятиминутный smoke test/);
});

test('Unity batch smoke gate bootstraps URP and requires a durable success marker', async () => {
  const validator = await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Editor/PrototypeRoomSmokeValidator.cs',
    'utf8',
  );
  const editorAssembly = JSON.parse(await readFile(
    'unity/DOFFA-Heroes/Assets/DOFFA/Editor/DOFFA.Editor.asmdef',
    'utf8',
  ));
  const localCheck = await readFile('scripts/check-unity-project.sh', 'utf8');

  assert.match(validator, /ValidateForBatch/);
  assert.match(validator, /UniversalRenderPipelineAsset\.Create\(rendererData\)/);
  assert.match(validator, /GraphicsSettings\.defaultRenderPipeline = pipelineAsset/);
  assert.match(validator, /QualitySettings\.renderPipeline = pipelineAsset/);
  assert.match(validator, /Artifacts\/UnitySmoke/);
  assert.match(validator, /validation\.json/);
  assert.match(validator, /EditorApplication\.Exit\(exitCode\)/);
  assert.ok(editorAssembly.references.includes('Unity.RenderPipelines.Core.Runtime'));
  assert.ok(editorAssembly.references.includes('Unity.RenderPipelines.Universal.Runtime'));
  assert.match(localCheck, /PrototypeRoomSmokeValidator\.ValidateForBatch/);
});

test('trusted-branch Unity workflow pins actions, editor image, and validation method', async () => {
  const workflow = await readFile('.github/workflows/unity-prototype-smoke.yml', 'utf8');

  assert.match(workflow, /codex\/unity-production-foundation/);
  assert.match(workflow, /game-ci\/unity-builder@d829bfc901f2347c8fe18898f06712b66916ef42/);
  assert.match(workflow, /ubuntu-6000\.3\.22f1-base-3\.2\.2@sha256:da211182d3f22ef70bc521d858b1da932197e843ffce303d99736fe251d12364/);
  assert.match(workflow, /buildMethod: Doffa\.Editor\.PrototypeRoomSmokeValidator\.ValidateForBatch/);
  assert.match(workflow, /Require successful Unity validation marker/);
  assert.match(workflow, /UNITY_LICENSE/);
  assert.match(workflow, /UNITY_SERIAL/);
  assert.doesNotMatch(workflow, /pull_request_target/);
});
