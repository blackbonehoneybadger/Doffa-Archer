using System;
using Doffa.Gameplay;
using Doffa.Presentation;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem.UI;
using UnityEngine.Rendering;
using UnityEngine.UI;

namespace Doffa.Editor
{
    public static class PrototypeRoomBuilder
    {
        private const string SceneDirectory = "Assets/DOFFA/Scenes";
        private const string ScenePath = SceneDirectory + "/Room_Prototype_01.unity";
        private const string MaterialDirectory = "Assets/DOFFA/Materials/Prototype";

        [MenuItem("DOFFA/Prototype/Build Room Prototype 01")]
        public static void Build()
        {
            ConfigureProjectDefaults();
            EnsureRenderPipelineReady();
            EnsureFolder("Assets", "DOFFA");
            EnsureFolder("Assets/DOFFA", "Scenes");
            EnsureFolder("Assets/DOFFA", "Materials");
            EnsureFolder("Assets/DOFFA/Materials", "Prototype");

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);

            var floorMaterial = GetOrCreateMaterial("Floor", new Color(0.08f, 0.095f, 0.10f));
            var wallMaterial = GetOrCreateMaterial("Wall", new Color(0.16f, 0.17f, 0.18f));
            var obstacleMaterial = GetOrCreateMaterial("Obstacle", new Color(0.30f, 0.18f, 0.08f));
            var playerMaterial = GetOrCreateMaterial("Player", new Color(0.82f, 0.43f, 0.08f));
            var enemyMaterial = GetOrCreateMaterial("Enemy", new Color(0.55f, 0.07f, 0.055f));
            var doorMaterial = GetOrCreateMaterial("Door", new Color(0.72f, 0.34f, 0.055f));
            var telegraphMaterial = GetOrCreateMaterial("EnemyTelegraph", new Color(0.95f, 0.05f, 0.025f), true);

            var environment = new GameObject("Environment").transform;
            CreatePrimitive("Floor", PrimitiveType.Cube, environment, new Vector3(0f, -0.25f, 0f), new Vector3(12f, 0.5f, 20f), floorMaterial);
            CreateBoundary(environment, wallMaterial);
            CreateObstacles(environment, obstacleMaterial);

            var player = CreatePlayer(playerMaterial);
            var playerHealth = player.GetComponent<PrototypeCombatantHealth>();
            var enemies = CreateEnemies(enemyMaterial, telegraphMaterial, player.transform, playerHealth);
            var door = CreateDoor(environment, doorMaterial);
            var exitTrigger = CreateExitTrigger(player.transform);
            CreateCamera(player.transform);
            CreateLighting();
            CreateVirtualStick(player.GetComponent<DoffaPlayerMotor>());
            CreateRoomController(player, playerHealth, enemies, door, exitTrigger);
            CreateDiagnostics(player.transform, enemies);
            new GameObject("PrototypePerformance").AddComponent<PrototypeRuntimePerformance>();

            EditorSceneManager.MarkSceneDirty(scene);
            EditorSceneManager.SaveScene(scene, ScenePath);
            EnsureSceneInBuildSettings(ScenePath);
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh();
            Selection.activeGameObject = player;
            Debug.Log($"Built DOFFA prototype scene at {ScenePath}.");
        }

        private static GameObject CreatePlayer(Material material)
        {
            var player = new GameObject("Player_Prototype");
            player.transform.position = new Vector3(0f, 0f, -6.5f);

            var controller = player.AddComponent<CharacterController>();
            controller.height = 2f;
            controller.radius = 0.42f;
            controller.center = Vector3.up;
            controller.stepOffset = 0.28f;
            controller.skinWidth = 0.045f;

            player.AddComponent<DoffaPlayerMotor>();
            var health = player.AddComponent<PrototypeCombatantHealth>();
            var attack = player.AddComponent<PrototypeAutoAttack>();

            var serializedHealth = new SerializedObject(health);
            serializedHealth.FindProperty("maximumHealth").floatValue = 250f;
            serializedHealth.ApplyModifiedPropertiesWithoutUndo();

            var body = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            body.name = "TemporaryBody_REPLACE_WITH_HONEY_BADGER";
            body.transform.SetParent(player.transform, false);
            body.transform.localPosition = Vector3.up;
            Object.DestroyImmediate(body.GetComponent<Collider>());
            body.GetComponent<Renderer>().sharedMaterial = material;

            var strikeObject = new GameObject("PrototypeStrike");
            strikeObject.transform.SetParent(player.transform, false);
            var line = strikeObject.AddComponent<LineRenderer>();
            line.positionCount = 2;
            line.startWidth = 0.08f;
            line.endWidth = 0.015f;
            line.sharedMaterial = GetOrCreateMaterial("Strike", new Color(1f, 0.72f, 0.18f), true);
            line.shadowCastingMode = ShadowCastingMode.Off;
            line.receiveShadows = false;

            var serializedAttack = new SerializedObject(attack);
            serializedAttack.FindProperty("strikeLine").objectReferenceValue = line;
            serializedAttack.ApplyModifiedPropertiesWithoutUndo();
            return player;
        }

        private static PrototypeEnemyAgent[] CreateEnemies(
            Material bodyMaterial,
            Material telegraphMaterial,
            Transform player,
            PrototypeCombatantHealth playerHealth)
        {
            var positions = new[]
            {
                new Vector3(-2.4f, 0f, -1.4f),
                new Vector3(2.4f, 0f, 2.5f),
                new Vector3(0f, 0f, 6.4f),
            };
            var enemies = new PrototypeEnemyAgent[positions.Length];

            for (var index = 0; index < positions.Length; index += 1)
            {
                var root = new GameObject($"Enemy_Prototype_{index + 1:00}");
                root.transform.position = positions[index];

                var controller = root.AddComponent<CharacterController>();
                controller.height = 1.7f;
                controller.radius = 0.46f;
                controller.center = Vector3.up * 0.85f;
                controller.stepOffset = 0.24f;
                controller.skinWidth = 0.045f;

                var health = root.AddComponent<PrototypeCombatantHealth>();
                var serializedHealth = new SerializedObject(health);
                serializedHealth.FindProperty("maximumHealth").floatValue = 100f;
                serializedHealth.ApplyModifiedPropertiesWithoutUndo();

                var body = GameObject.CreatePrimitive(PrimitiveType.Capsule);
                body.name = "TemporaryEnemyBody_REPLACE_WITH_PRODUCTION_MODEL";
                body.transform.SetParent(root.transform, false);
                body.transform.localPosition = Vector3.up * 0.85f;
                body.transform.localScale = new Vector3(0.82f, 0.85f, 0.82f);
                Object.DestroyImmediate(body.GetComponent<Collider>());
                body.GetComponent<Renderer>().sharedMaterial = bodyMaterial;

                var telegraph = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
                telegraph.name = "AttackTelegraph";
                telegraph.transform.SetParent(root.transform, false);
                telegraph.transform.localPosition = Vector3.up * 0.025f;
                telegraph.transform.localScale = new Vector3(2.15f, 0.025f, 2.15f);
                Object.DestroyImmediate(telegraph.GetComponent<Collider>());
                var telegraphRenderer = telegraph.GetComponent<Renderer>();
                telegraphRenderer.sharedMaterial = telegraphMaterial;
                telegraphRenderer.enabled = false;

                var agent = root.AddComponent<PrototypeEnemyAgent>();
                agent.Configure(player, playerHealth);
                var serializedAgent = new SerializedObject(agent);
                serializedAgent.FindProperty("telegraphRenderer").objectReferenceValue = telegraphRenderer;
                serializedAgent.FindProperty("movementSpeed").floatValue = 2.35f + index * 0.2f;
                serializedAgent.FindProperty("attackDamage").floatValue = 20f + index * 3f;
                serializedAgent.ApplyModifiedPropertiesWithoutUndo();
                enemies[index] = agent;
            }

            return enemies;
        }

        private static void CreateBoundary(Transform parent, Material material)
        {
            CreatePrimitive("Wall_Left", PrimitiveType.Cube, parent, new Vector3(-6.25f, 1.25f, 0f), new Vector3(0.5f, 3f, 20.5f), material);
            CreatePrimitive("Wall_Right", PrimitiveType.Cube, parent, new Vector3(6.25f, 1.25f, 0f), new Vector3(0.5f, 3f, 20.5f), material);
            CreatePrimitive("Wall_Bottom", PrimitiveType.Cube, parent, new Vector3(0f, 1.25f, -10.25f), new Vector3(12.5f, 3f, 0.5f), material);
            CreatePrimitive("Wall_Top_Left", PrimitiveType.Cube, parent, new Vector3(-3.75f, 1.25f, 10.25f), new Vector3(5f, 3f, 0.5f), material);
            CreatePrimitive("Wall_Top_Right", PrimitiveType.Cube, parent, new Vector3(3.75f, 1.25f, 10.25f), new Vector3(5f, 3f, 0.5f), material);
        }

        private static void CreateObstacles(Transform parent, Material material)
        {
            CreatePrimitive("Obstacle_LeftPipe", PrimitiveType.Cylinder, parent, new Vector3(-3.3f, 0.85f, 1.2f), new Vector3(1.45f, 0.85f, 1.45f), material);
            CreatePrimitive("Obstacle_RightPipe", PrimitiveType.Cylinder, parent, new Vector3(3.3f, 0.85f, -1.0f), new Vector3(1.45f, 0.85f, 1.45f), material);
            CreatePrimitive("Obstacle_CenterLow", PrimitiveType.Cube, parent, new Vector3(0f, 0.65f, 3.8f), new Vector3(3.3f, 1.3f, 0.75f), material);
            CreatePrimitive("Obstacle_LowerLeft", PrimitiveType.Cube, parent, new Vector3(-3.4f, 0.65f, -4.4f), new Vector3(2.2f, 1.3f, 0.75f), material);
        }

        private static PrototypeExitDoor CreateDoor(Transform parent, Material material)
        {
            var root = new GameObject("ExitDoor");
            root.transform.SetParent(parent, false);
            root.transform.localPosition = new Vector3(0f, 0f, 10f);

            var panel = CreatePrimitive("MovingPanel", PrimitiveType.Cube, root.transform, new Vector3(0f, 1.5f, 0f), new Vector3(2.5f, 3f, 0.45f), material);
            var body = panel.AddComponent<Rigidbody>();
            body.isKinematic = true;
            body.useGravity = false;
            var door = root.AddComponent<PrototypeExitDoor>();
            var serializedDoor = new SerializedObject(door);
            serializedDoor.FindProperty("movingPanel").objectReferenceValue = panel.transform;
            serializedDoor.ApplyModifiedPropertiesWithoutUndo();
            return door;
        }

        private static PrototypeExitTrigger CreateExitTrigger(Transform player)
        {
            var triggerObject = new GameObject("RoomExitTrigger");
            triggerObject.transform.position = new Vector3(0f, 1f, 10.9f);
            var collider = triggerObject.AddComponent<BoxCollider>();
            collider.size = new Vector3(2.35f, 2f, 1.1f);
            collider.isTrigger = true;
            var trigger = triggerObject.AddComponent<PrototypeExitTrigger>();
            trigger.Configure(player);
            return trigger;
        }

        private static void CreateCamera(Transform target)
        {
            var cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            cameraObject.transform.position = target.position + new Vector3(0f, 13.5f, -10.5f);

            var camera = cameraObject.AddComponent<Camera>();
            camera.orthographic = true;
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.018f, 0.02f, 0.024f);
            camera.nearClipPlane = 0.1f;
            camera.farClipPlane = 80f;

            var rig = cameraObject.AddComponent<DoffaIsometricCameraRig>();
            rig.Configure(target, new Vector2(-2.2f, -5.8f), new Vector2(2.2f, 5.8f));
            cameraObject.AddComponent<AudioListener>();
        }

        private static void CreateVirtualStick(DoffaPlayerMotor motor)
        {
            var canvasObject = new GameObject("PrototypeMobileControls");
            var canvas = canvasObject.AddComponent<Canvas>();
            canvas.renderMode = RenderMode.ScreenSpaceOverlay;
            canvas.sortingOrder = 20;
            var scaler = canvasObject.AddComponent<CanvasScaler>();
            scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
            scaler.referenceResolution = new Vector2(1080f, 1920f);
            scaler.matchWidthOrHeight = 0.5f;
            canvasObject.AddComponent<GraphicRaycaster>();

            var safeAreaObject = new GameObject("SafeArea", typeof(RectTransform), typeof(DoffaSafeArea));
            safeAreaObject.transform.SetParent(canvasObject.transform, false);
            var safeAreaRect = (RectTransform)safeAreaObject.transform;
            safeAreaRect.anchorMin = Vector2.zero;
            safeAreaRect.anchorMax = Vector2.one;
            safeAreaRect.offsetMin = Vector2.zero;
            safeAreaRect.offsetMax = Vector2.zero;

            var stickObject = new GameObject("MovementStick", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
            stickObject.transform.SetParent(safeAreaObject.transform, false);
            var stickRect = (RectTransform)stickObject.transform;
            stickRect.anchorMin = Vector2.zero;
            stickRect.anchorMax = Vector2.zero;
            stickRect.pivot = new Vector2(0.5f, 0.5f);
            stickRect.anchoredPosition = new Vector2(170f, 190f);
            stickRect.sizeDelta = new Vector2(230f, 230f);
            var background = stickObject.GetComponent<Image>();
            background.color = new Color(0.04f, 0.045f, 0.05f, 0.72f);
            background.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Knob.psd");

            var handleObject = new GameObject("Handle", typeof(RectTransform), typeof(CanvasRenderer), typeof(Image));
            handleObject.transform.SetParent(stickObject.transform, false);
            var handleRect = (RectTransform)handleObject.transform;
            handleRect.anchorMin = new Vector2(0.5f, 0.5f);
            handleRect.anchorMax = new Vector2(0.5f, 0.5f);
            handleRect.pivot = new Vector2(0.5f, 0.5f);
            handleRect.sizeDelta = new Vector2(94f, 94f);
            var handleImage = handleObject.GetComponent<Image>();
            handleImage.color = new Color(0.95f, 0.55f, 0.16f, 0.9f);
            handleImage.sprite = AssetDatabase.GetBuiltinExtraResource<Sprite>("UI/Skin/Knob.psd");

            var stick = stickObject.AddComponent<DoffaVirtualStick>();
            var serializedStick = new SerializedObject(stick);
            serializedStick.FindProperty("motor").objectReferenceValue = motor;
            serializedStick.FindProperty("handle").objectReferenceValue = handleRect;
            serializedStick.FindProperty("radius").floatValue = 96f;
            serializedStick.ApplyModifiedPropertiesWithoutUndo();

            var eventSystem = new GameObject("EventSystem", typeof(EventSystem), typeof(InputSystemUIInputModule));
            eventSystem.transform.SetParent(canvasObject.transform, false);
        }

        private static void CreateRoomController(
            GameObject player,
            PrototypeCombatantHealth playerHealth,
            PrototypeEnemyAgent[] enemies,
            PrototypeExitDoor door,
            PrototypeExitTrigger exitTrigger)
        {
            var roomObject = new GameObject("RoomRuntime");
            var room = roomObject.AddComponent<PrototypeRoomController>();
            var serializedRoom = new SerializedObject(room);
            serializedRoom.FindProperty("playerMotor").objectReferenceValue = player.GetComponent<DoffaPlayerMotor>();
            serializedRoom.FindProperty("playerHealth").objectReferenceValue = playerHealth;
            serializedRoom.FindProperty("exitDoor").objectReferenceValue = door;
            serializedRoom.FindProperty("exitTrigger").objectReferenceValue = exitTrigger;
            var enemiesProperty = serializedRoom.FindProperty("enemies");
            enemiesProperty.arraySize = enemies.Length;
            for (var index = 0; index < enemies.Length; index += 1)
            {
                enemiesProperty.GetArrayElementAtIndex(index).objectReferenceValue = enemies[index];
            }
            serializedRoom.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateDiagnostics(Transform player, PrototypeEnemyAgent[] enemies)
        {
            var diagnosticsObject = new GameObject("PrototypeDiagnostics");
            var diagnostics = diagnosticsObject.AddComponent<PrototypeRoomDiagnostics>();
            var serializedDiagnostics = new SerializedObject(diagnostics);
            serializedDiagnostics.FindProperty("player").objectReferenceValue = player;
            var enemiesProperty = serializedDiagnostics.FindProperty("enemies");
            enemiesProperty.arraySize = enemies.Length;
            for (var index = 0; index < enemies.Length; index += 1)
            {
                enemiesProperty.GetArrayElementAtIndex(index).objectReferenceValue = enemies[index];
            }
            serializedDiagnostics.ApplyModifiedPropertiesWithoutUndo();
        }

        private static void CreateLighting()
        {
            var keyObject = new GameObject("KeyLight");
            keyObject.transform.rotation = Quaternion.Euler(52f, -28f, 0f);
            var key = keyObject.AddComponent<Light>();
            key.type = LightType.Directional;
            key.intensity = 1.35f;
            key.color = new Color(1f, 0.62f, 0.34f);
            key.shadows = LightShadows.Soft;

            var fillObject = new GameObject("FillLight");
            fillObject.transform.position = new Vector3(0f, 5.5f, 2f);
            var fill = fillObject.AddComponent<Light>();
            fill.type = LightType.Point;
            fill.range = 15f;
            fill.intensity = 2.4f;
            fill.color = new Color(0.16f, 0.32f, 0.62f);
            fill.shadows = LightShadows.None;
        }

        private static GameObject CreatePrimitive(
            string name,
            PrimitiveType primitiveType,
            Transform parent,
            Vector3 position,
            Vector3 scale,
            Material material)
        {
            var instance = GameObject.CreatePrimitive(primitiveType);
            instance.name = name;
            if (parent != null)
            {
                instance.transform.SetParent(parent, false);
                instance.transform.localPosition = position;
            }
            else
            {
                instance.transform.position = position;
            }

            instance.transform.localScale = scale;
            instance.GetComponent<Renderer>().sharedMaterial = material;
            return instance;
        }

        private static Material GetOrCreateMaterial(string name, Color color, bool emissive = false)
        {
            var path = $"{MaterialDirectory}/{name}.mat";
            var material = AssetDatabase.LoadAssetAtPath<Material>(path);
            if (material != null)
            {
                return material;
            }

            var shader = Shader.Find("Universal Render Pipeline/Lit");
            if (shader == null)
            {
                throw new InvalidOperationException(
                    "DOFFA prototype requires the Universal Render Pipeline/Lit shader. Resolve URP and assign a URP Asset before building the room."
                );
            }
            material = new Material(shader)
            {
                name = name,
                color = color,
            };
            if (emissive && material.HasProperty("_EmissionColor"))
            {
                material.EnableKeyword("_EMISSION");
                material.SetColor("_EmissionColor", color * 2.2f);
            }

            AssetDatabase.CreateAsset(material, path);
            return material;
        }

        private static void EnsureFolder(string parent, string child)
        {
            var path = $"{parent}/{child}";
            if (!AssetDatabase.IsValidFolder(path))
            {
                AssetDatabase.CreateFolder(parent, child);
            }
        }

        private static void EnsureSceneInBuildSettings(string scenePath)
        {
            var scenes = new System.Collections.Generic.List<EditorBuildSettingsScene>(EditorBuildSettings.scenes);
            var existingIndex = scenes.FindIndex(scene => scene.path == scenePath);
            if (existingIndex >= 0)
            {
                if (!scenes[existingIndex].enabled)
                {
                    scenes[existingIndex] = new EditorBuildSettingsScene(scenePath, true);
                    EditorBuildSettings.scenes = scenes.ToArray();
                }
                return;
            }

            scenes.Insert(0, new EditorBuildSettingsScene(scenePath, true));
            EditorBuildSettings.scenes = scenes.ToArray();
        }

        private static void ConfigureProjectDefaults()
        {
            PlayerSettings.companyName = "DOFFA Games";
            PlayerSettings.productName = "DOFFA Heroes";
            PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
            PlayerSettings.colorSpace = ColorSpace.Linear;
            PlayerSettings.runInBackground = false;

            var projectSettings = AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/ProjectSettings.asset");
            if (projectSettings.Length > 0)
            {
                var serializedSettings = new SerializedObject(projectSettings[0]);
                var activeInputHandler = serializedSettings.FindProperty("activeInputHandler");
                if (activeInputHandler != null && activeInputHandler.intValue != 1)
                {
                    activeInputHandler.intValue = 1;
                    serializedSettings.ApplyModifiedPropertiesWithoutUndo();
                    Debug.Log("DOFFA set Active Input Handling to Input System Package. Unity may request one editor restart.");
                }
            }
        }

        private static void EnsureRenderPipelineReady()
        {
            if (GraphicsSettings.currentRenderPipeline == null)
            {
                throw new InvalidOperationException(
                    "DOFFA prototype requires an assigned URP Asset in Project Settings > Graphics or the active Quality level."
                );
            }
        }
    }
}
