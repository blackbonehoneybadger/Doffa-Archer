using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Doffa.Gameplay;
using Doffa.Presentation;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

namespace Doffa.Editor
{
    /// <summary>
    /// Deterministic editor-only acceptance gate for Room_Prototype_01.
    /// Invoke from CI with:
    /// -batchmode -quit -projectPath ... -executeMethod Doffa.Editor.PrototypeRoomSmokeValidator.ValidateForBatch
    /// </summary>
    public static class PrototypeRoomSmokeValidator
    {
        private const string ApprovedUnityVersion = "6000.3.22f1";
        private const string ProjectSettingsPath = "ProjectSettings/ProjectSettings.asset";
        private const string RenderingSettingsDirectory = "Assets/DOFFA/Settings/Rendering";
        private const string RendererDataPath = RenderingSettingsDirectory + "/DOFFA_UniversalRenderer.asset";
        private const string PipelineAssetPath = RenderingSettingsDirectory + "/DOFFA_UniversalRenderPipeline.asset";
        private const string SmokeArtifactDirectory = "Artifacts/UnitySmoke";
        private const string ValidationMarkerName = "validation.json";
        private const int ExpectedEnemyCount = 3;

        [Serializable]
        private sealed class ValidationMarker
        {
            public bool success;
            public string version;
            public string scene;
            public string error;
        }

        [MenuItem("DOFFA/Prototype/Build and Validate Room Prototype 01")]
        public static void BuildAndValidateFromMenu()
        {
            BuildAndValidate();
        }

        /// <summary>
        /// CI entry point. It exits explicitly so a validation failure cannot be
        /// reported as a successful workflow step.
        /// </summary>
        public static void ValidateForBatch()
        {
            Exception failure = null;
            try
            {
                PrepareSmokeArtifactDirectory();
                BuildAndValidate();
            }
            catch (Exception exception)
            {
                failure = exception;
                Debug.LogError($"DOFFA UNITY SMOKE FAILED: {exception.Message}");
                Debug.LogException(exception);
            }

            try
            {
                SaveGeneratedArtifacts();
            }
            catch (Exception exception)
            {
                failure ??= exception;
                Debug.LogError($"DOFFA UNITY SMOKE FAILED while saving generated assets: {exception.Message}");
                Debug.LogException(exception);
            }

            try
            {
                WriteValidationMarker(failure);
            }
            catch (Exception exception)
            {
                failure ??= exception;
                Debug.LogError($"DOFFA UNITY SMOKE FAILED while writing validation marker: {exception.Message}");
                Debug.LogException(exception);
            }

            if (Application.isBatchMode)
            {
                var exitCode = failure == null ? 0 : 1;
                Debug.Log($"DOFFA UNITY SMOKE EXIT CODE: {exitCode}");
                EditorApplication.Exit(exitCode);
                return;
            }

            if (failure != null)
            {
                throw new InvalidOperationException("DOFFA Unity smoke validation failed.", failure);
            }
        }

        public static void BuildAndValidate()
        {
            EnsureRenderPipelineForSmoke();
            SaveGeneratedArtifacts();
            ThrowIfInvalid("project prerequisites", ValidateProjectPrerequisites());

            PrototypeRoomBuilder.Build();
            SaveGeneratedArtifacts();

            var scene = EditorSceneManager.OpenScene(
                PrototypeRoomBuilder.PrototypeScenePath,
                OpenSceneMode.Single
            );
            ThrowIfInvalid("generated Room_Prototype_01", ValidateScene(scene));
            SaveGeneratedArtifacts();

            Debug.Log(
                $"DOFFA UNITY SMOKE PASSED: {PrototypeRoomBuilder.PrototypeScenePath} " +
                "was generated, saved, added to Build Settings, and validated."
            );
        }

        public static List<string> ValidateProjectPrerequisites()
        {
            var errors = new List<string>();

            if (!string.Equals(Application.unityVersion, ApprovedUnityVersion, StringComparison.Ordinal))
            {
                errors.Add($"Expected Unity {ApprovedUnityVersion}, running {Application.unityVersion}.");
            }

            var pipeline = GraphicsSettings.currentRenderPipeline;
            if (pipeline == null)
            {
                errors.Add("No active Render Pipeline Asset. Assign a URP Asset in Graphics or Quality settings.");
            }
            else if (!IsUniversalRenderPipelineAsset(pipeline.GetType()))
            {
                errors.Add($"Active Render Pipeline Asset must be URP; found {pipeline.GetType().FullName}.");
            }

            if (Shader.Find("Universal Render Pipeline/Lit") == null)
            {
                errors.Add("Universal Render Pipeline/Lit shader is unavailable; resolve the URP package first.");
            }

            if (!string.Equals(typeof(InputAction).Assembly.GetName().Name, "Unity.InputSystem", StringComparison.Ordinal))
            {
                errors.Add("Unity Input System assembly is unavailable.");
            }

            return errors;
        }

        private static void EnsureRenderPipelineForSmoke()
        {
            var currentPipeline = GraphicsSettings.currentRenderPipeline;
            if (currentPipeline != null)
            {
                if (!IsUniversalRenderPipelineAsset(currentPipeline.GetType()))
                {
                    throw new InvalidOperationException(
                        $"Active Render Pipeline Asset must be URP; found {currentPipeline.GetType().FullName}."
                    );
                }
                return;
            }

            EnsureFolder("Assets", "DOFFA");
            EnsureFolder("Assets/DOFFA", "Settings");
            EnsureFolder("Assets/DOFFA/Settings", "Rendering");

            var rendererData = AssetDatabase.LoadAssetAtPath<UniversalRendererData>(RendererDataPath);
            var rendererDataWasMissing = rendererData == null;
            if (rendererData == null)
            {
                rendererData = ScriptableObject.CreateInstance<UniversalRendererData>();
                rendererData.name = "DOFFA Universal Renderer";
                AssetDatabase.CreateAsset(rendererData, RendererDataPath);
            }

            var pipelineAsset = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(PipelineAssetPath);
            if (pipelineAsset != null && rendererDataWasMissing)
            {
                AssetDatabase.DeleteAsset(PipelineAssetPath);
                pipelineAsset = null;
            }
            if (pipelineAsset == null)
            {
                pipelineAsset = UniversalRenderPipelineAsset.Create(rendererData);
                pipelineAsset.name = "DOFFA Universal Render Pipeline";
                AssetDatabase.CreateAsset(pipelineAsset, PipelineAssetPath);
            }

            GraphicsSettings.defaultRenderPipeline = pipelineAsset;
            QualitySettings.renderPipeline = pipelineAsset;
            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);

            Debug.Log(
                $"DOFFA created and assigned URP smoke settings at {PipelineAssetPath} " +
                $"with renderer {RendererDataPath}."
            );
        }

        public static List<string> ValidateScene(Scene scene)
        {
            var errors = new List<string>();
            if (!scene.IsValid() || !scene.isLoaded)
            {
                errors.Add("Generated scene is invalid or not loaded.");
                return errors;
            }

            if (!string.Equals(scene.path, PrototypeRoomBuilder.PrototypeScenePath, StringComparison.Ordinal))
            {
                errors.Add($"Expected scene path {PrototypeRoomBuilder.PrototypeScenePath}; found {scene.path}.");
            }

            if (AssetDatabase.LoadAssetAtPath<SceneAsset>(PrototypeRoomBuilder.PrototypeScenePath) == null)
            {
                errors.Add("Generated scene asset was not saved to disk.");
            }

            ValidateBuildSettings(errors);
            ValidateProjectDefaults(errors);

            var roots = scene.GetRootGameObjects();
            ValidateMissingScripts(roots, errors);

            var environment = RequireRoot(roots, "Environment", errors);
            if (environment != null)
            {
                RequireDescendant<Collider>(environment, "Floor", errors);
                RequireDescendant<Collider>(environment, "Wall_Left", errors);
                RequireDescendant<Collider>(environment, "Wall_Right", errors);
                RequireDescendant<Collider>(environment, "Wall_Bottom", errors);
                var exitDoor = RequireDescendant<PrototypeExitDoor>(environment, "ExitDoor", errors);
                if (exitDoor != null)
                {
                    ValidateObjectReference(new SerializedObject(exitDoor), "movingPanel", "ExitDoor", errors);
                }

                var obstacleCount = environment
                    .GetComponentsInChildren<Transform>(true)
                    .Count(transform => transform.name.StartsWith("Obstacle_", StringComparison.Ordinal));
                if (obstacleCount < 4)
                {
                    errors.Add($"Environment must contain at least four obstacle objects; found {obstacleCount}.");
                }
            }

            var player = RequireRoot(roots, "Player_Prototype", errors);
            var playerMotor = RequireComponent<DoffaPlayerMotor>(player, "Player_Prototype", errors);
            var playerHealth = RequireComponent<PrototypeCombatantHealth>(player, "Player_Prototype", errors);
            RequireComponent<CharacterController>(player, "Player_Prototype", errors);
            var playerAttack = RequireComponent<PrototypeAutoAttack>(player, "Player_Prototype", errors);
            if (playerAttack != null)
            {
                ValidateObjectReference(new SerializedObject(playerAttack), "strikeLine", "Player_Prototype", errors);
            }

            var enemies = roots
                .SelectMany(root => root.GetComponentsInChildren<PrototypeEnemyAgent>(true))
                .ToArray();
            if (enemies.Length != ExpectedEnemyCount)
            {
                errors.Add($"Expected {ExpectedEnemyCount} PrototypeEnemyAgent objects; found {enemies.Length}.");
            }
            foreach (var enemy in enemies)
            {
                RequireComponent<CharacterController>(enemy.gameObject, enemy.name, errors);
                RequireComponent<PrototypeCombatantHealth>(enemy.gameObject, enemy.name, errors);
                ValidateObjectReference(new SerializedObject(enemy), "player", enemy.name, errors);
                ValidateObjectReference(new SerializedObject(enemy), "playerHealth", enemy.name, errors);
                ValidateObjectReference(new SerializedObject(enemy), "telegraphRenderer", enemy.name, errors);
            }
            for (var index = 1; index <= ExpectedEnemyCount; index += 1)
            {
                var enemyName = $"Enemy_Prototype_{index:00}";
                RequireComponent<PrototypeEnemyAgent>(RequireRoot(roots, enemyName, errors), enemyName, errors);
            }

            var cameraObject = RequireRoot(roots, "Main Camera", errors);
            var camera = RequireComponent<Camera>(cameraObject, "Main Camera", errors);
            var cameraRig = RequireComponent<DoffaIsometricCameraRig>(cameraObject, "Main Camera", errors);
            RequireComponent<AudioListener>(cameraObject, "Main Camera", errors);
            if (cameraRig != null)
            {
                ValidateObjectReference(new SerializedObject(cameraRig), "followTarget", "Main Camera", errors);
            }
            if (camera != null && !camera.orthographic)
            {
                errors.Add("Main Camera must be orthographic.");
            }
            if (cameraObject != null && !cameraObject.CompareTag("MainCamera"))
            {
                errors.Add("Main Camera must use the MainCamera tag.");
            }

            var controls = RequireRoot(roots, "PrototypeMobileControls", errors);
            RequireComponent<Canvas>(controls, "PrototypeMobileControls", errors);
            RequireComponent<CanvasScaler>(controls, "PrototypeMobileControls", errors);
            RequireComponent<GraphicRaycaster>(controls, "PrototypeMobileControls", errors);
            if (controls != null)
            {
                RequireDescendant<DoffaSafeArea>(controls, "SafeArea", errors);
                var stick = RequireDescendant<DoffaVirtualStick>(controls, "MovementStick", errors);
                RequireDescendant<EventSystem>(controls, "EventSystem", errors);
                RequireDescendant<InputSystemUIInputModule>(controls, "EventSystem", errors);
                if (stick != null)
                {
                    ValidateObjectReference(new SerializedObject(stick), "motor", "MovementStick", errors);
                    ValidateObjectReference(new SerializedObject(stick), "handle", "MovementStick", errors);
                }
            }

            var roomObject = RequireRoot(roots, "RoomRuntime", errors);
            var room = RequireComponent<PrototypeRoomController>(roomObject, "RoomRuntime", errors);
            if (room != null)
            {
                var serializedRoom = new SerializedObject(room);
                ValidateObjectReference(serializedRoom, "playerMotor", "RoomRuntime", errors);
                ValidateObjectReference(serializedRoom, "playerHealth", "RoomRuntime", errors);
                ValidateObjectReference(serializedRoom, "exitDoor", "RoomRuntime", errors);
                ValidateObjectReference(serializedRoom, "exitTrigger", "RoomRuntime", errors);
                ValidateObjectArray(serializedRoom, "enemies", ExpectedEnemyCount, "RoomRuntime", errors);
            }

            var exitTriggerObject = RequireRoot(roots, "RoomExitTrigger", errors);
            var exitCollider = RequireComponent<BoxCollider>(exitTriggerObject, "RoomExitTrigger", errors);
            var exitTrigger = RequireComponent<PrototypeExitTrigger>(exitTriggerObject, "RoomExitTrigger", errors);
            if (exitCollider != null && !exitCollider.isTrigger)
            {
                errors.Add("RoomExitTrigger BoxCollider must be a trigger.");
            }
            if (exitTrigger != null)
            {
                ValidateObjectReference(new SerializedObject(exitTrigger), "player", "RoomExitTrigger", errors);
            }

            var diagnostics = RequireComponent<PrototypeRoomDiagnostics>(
                RequireRoot(roots, "PrototypeDiagnostics", errors),
                "PrototypeDiagnostics",
                errors
            );
            if (diagnostics != null)
            {
                var serializedDiagnostics = new SerializedObject(diagnostics);
                ValidateObjectReference(serializedDiagnostics, "player", "PrototypeDiagnostics", errors);
                ValidateObjectArray(
                    serializedDiagnostics,
                    "enemies",
                    ExpectedEnemyCount,
                    "PrototypeDiagnostics",
                    errors
                );
            }
            RequireComponent<PrototypeRuntimePerformance>(
                RequireRoot(roots, "PrototypePerformance", errors),
                "PrototypePerformance",
                errors
            );
            RequireComponent<Light>(RequireRoot(roots, "KeyLight", errors), "KeyLight", errors);
            RequireComponent<Light>(RequireRoot(roots, "FillLight", errors), "FillLight", errors);

            if (playerMotor == null || playerHealth == null)
            {
                errors.Add("Player runtime references cannot be validated because required components are missing.");
            }

            ValidateGeneratedMaterials(errors);

            return errors;
        }

        private static void ValidateActiveInputHandler(ICollection<string> errors)
        {
            var projectSettings = AssetDatabase.LoadAllAssetsAtPath(ProjectSettingsPath);
            if (projectSettings.Length == 0)
            {
                errors.Add($"Cannot load {ProjectSettingsPath} to verify Active Input Handling.");
                return;
            }

            var serializedSettings = new SerializedObject(projectSettings[0]);
            var activeInputHandler = serializedSettings.FindProperty("activeInputHandler");
            if (activeInputHandler == null)
            {
                errors.Add("ProjectSettings has no activeInputHandler property.");
                return;
            }

            if (activeInputHandler.intValue != 1 && activeInputHandler.intValue != 2)
            {
                errors.Add(
                    $"Active Input Handling must include the Input System Package (1 or 2); " +
                    $"found {activeInputHandler.intValue}."
                );
            }
        }

        private static void ValidateBuildSettings(ICollection<string> errors)
        {
            var matchingScene = EditorBuildSettings.scenes.FirstOrDefault(
                scene => string.Equals(scene.path, PrototypeRoomBuilder.PrototypeScenePath, StringComparison.Ordinal)
            );
            if (matchingScene == null)
            {
                errors.Add("Room_Prototype_01 is missing from Build Settings.");
            }
            else if (!matchingScene.enabled)
            {
                errors.Add("Room_Prototype_01 is disabled in Build Settings.");
            }
        }

        private static void ValidateProjectDefaults(ICollection<string> errors)
        {
            ValidateActiveInputHandler(errors);

            if (!string.Equals(PlayerSettings.companyName, "DOFFA Games", StringComparison.Ordinal))
            {
                errors.Add($"Company name must be DOFFA Games; found {PlayerSettings.companyName}.");
            }
            if (!string.Equals(PlayerSettings.productName, "DOFFA Heroes", StringComparison.Ordinal))
            {
                errors.Add($"Product name must be DOFFA Heroes; found {PlayerSettings.productName}.");
            }
            if (PlayerSettings.defaultInterfaceOrientation != UIOrientation.Portrait)
            {
                errors.Add("Default interface orientation must be Portrait.");
            }
            if (PlayerSettings.colorSpace != ColorSpace.Linear)
            {
                errors.Add("Project color space must be Linear.");
            }
            if (PlayerSettings.runInBackground)
            {
                errors.Add("Run In Background must be disabled for the mobile prototype.");
            }
        }

        private static void ValidateGeneratedMaterials(ICollection<string> errors)
        {
            var materialNames = new[]
            {
                "Floor",
                "Wall",
                "Obstacle",
                "Player",
                "Enemy",
                "Door",
                "EnemyTelegraph",
                "Strike",
            };

            foreach (var materialName in materialNames)
            {
                var path = $"{PrototypeRoomBuilder.PrototypeMaterialDirectory}/{materialName}.mat";
                var material = AssetDatabase.LoadAssetAtPath<Material>(path);
                if (material == null)
                {
                    errors.Add($"Missing generated prototype material: {path}.");
                }
                else if (material.shader == null ||
                         !string.Equals(
                             material.shader.name,
                             "Universal Render Pipeline/Lit",
                             StringComparison.Ordinal))
                {
                    errors.Add($"Generated material {path} must use Universal Render Pipeline/Lit.");
                }
            }
        }

        private static bool IsUniversalRenderPipelineAsset(Type pipelineType)
        {
            while (pipelineType != null)
            {
                if (string.Equals(
                        pipelineType.FullName,
                        "UnityEngine.Rendering.Universal.UniversalRenderPipelineAsset",
                        StringComparison.Ordinal))
                {
                    return true;
                }
                pipelineType = pipelineType.BaseType;
            }
            return false;
        }

        private static void EnsureFolder(string parent, string child)
        {
            var path = $"{parent}/{child}";
            if (!AssetDatabase.IsValidFolder(path))
            {
                AssetDatabase.CreateFolder(parent, child);
            }
        }

        private static GameObject RequireRoot(
            IEnumerable<GameObject> roots,
            string name,
            ICollection<string> errors)
        {
            var matches = roots.Where(root => string.Equals(root.name, name, StringComparison.Ordinal)).ToArray();
            if (matches.Length == 1)
            {
                return matches[0];
            }

            errors.Add(matches.Length == 0
                ? $"Missing required root object: {name}."
                : $"Required root object {name} appears {matches.Length} times.");
            return matches.FirstOrDefault();
        }

        private static T RequireComponent<T>(
            GameObject gameObject,
            string label,
            ICollection<string> errors) where T : Component
        {
            if (gameObject == null)
            {
                return null;
            }

            var component = gameObject.GetComponent<T>();
            if (component == null)
            {
                errors.Add($"{label} is missing {typeof(T).Name}.");
            }
            return component;
        }

        private static T RequireDescendant<T>(
            GameObject parent,
            string name,
            ICollection<string> errors) where T : Component
        {
            var matches = parent
                .GetComponentsInChildren<Transform>(true)
                .Where(transform => string.Equals(transform.name, name, StringComparison.Ordinal))
                .ToArray();
            if (matches.Length != 1)
            {
                errors.Add(matches.Length == 0
                    ? $"{parent.name} is missing required child {name}."
                    : $"{parent.name} contains {matches.Length} children named {name}.");
                return matches.FirstOrDefault()?.GetComponent<T>();
            }

            var component = matches[0].GetComponent<T>();
            if (component == null)
            {
                errors.Add($"{parent.name}/{name} is missing {typeof(T).Name}.");
            }
            return component;
        }

        private static void ValidateObjectReference(
            SerializedObject owner,
            string propertyName,
            string label,
            ICollection<string> errors)
        {
            var property = owner.FindProperty(propertyName);
            if (property == null)
            {
                errors.Add($"{label} has no serialized property {propertyName}.");
            }
            else if (property.objectReferenceValue == null)
            {
                errors.Add($"{label}.{propertyName} is not assigned.");
            }
        }

        private static void ValidateObjectArray(
            SerializedObject owner,
            string propertyName,
            int expectedCount,
            string label,
            ICollection<string> errors)
        {
            var property = owner.FindProperty(propertyName);
            if (property == null || !property.isArray)
            {
                errors.Add($"{label} has no serialized array {propertyName}.");
                return;
            }
            if (property.arraySize != expectedCount)
            {
                errors.Add($"{label}.{propertyName} must contain {expectedCount} references; found {property.arraySize}.");
            }
            for (var index = 0; index < property.arraySize; index += 1)
            {
                if (property.GetArrayElementAtIndex(index).objectReferenceValue == null)
                {
                    errors.Add($"{label}.{propertyName}[{index}] is not assigned.");
                }
            }
        }

        private static void ValidateMissingScripts(
            IEnumerable<GameObject> roots,
            ICollection<string> errors)
        {
            foreach (var transform in roots.SelectMany(root => root.GetComponentsInChildren<Transform>(true)))
            {
                if (transform.GetComponents<Component>().Any(component => component == null))
                {
                    errors.Add($"{GetHierarchyPath(transform)} contains a missing script reference.");
                }
            }
        }

        private static string GetHierarchyPath(Transform transform)
        {
            var names = new Stack<string>();
            while (transform != null)
            {
                names.Push(transform.name);
                transform = transform.parent;
            }
            return string.Join("/", names);
        }

        private static void ThrowIfInvalid(string label, IReadOnlyCollection<string> errors)
        {
            if (errors.Count == 0)
            {
                return;
            }

            throw new InvalidOperationException(
                $"DOFFA validation failed for {label} with {errors.Count} error(s):\n- " +
                string.Join("\n- ", errors)
            );
        }

        private static void SaveGeneratedArtifacts()
        {
            var activeScene = SceneManager.GetActiveScene();
            if (activeScene.IsValid() &&
                activeScene.isDirty &&
                string.Equals(activeScene.path, PrototypeRoomBuilder.PrototypeScenePath, StringComparison.Ordinal))
            {
                EditorSceneManager.SaveScene(activeScene);
            }

            AssetDatabase.SaveAssets();
            AssetDatabase.Refresh(ImportAssetOptions.ForceSynchronousImport);

            var projectRoot = Directory.GetParent(Application.dataPath)?.FullName;
            if (string.IsNullOrWhiteSpace(projectRoot))
            {
                throw new DirectoryNotFoundException($"Cannot resolve Unity project root from {Application.dataPath}.");
            }

            var absoluteScenePath = Path.GetFullPath(
                Path.Combine(projectRoot, PrototypeRoomBuilder.PrototypeScenePath)
            );
            if (AssetDatabase.LoadAssetAtPath<SceneAsset>(PrototypeRoomBuilder.PrototypeScenePath) != null &&
                !File.Exists(absoluteScenePath))
            {
                throw new IOException($"Unity imported the scene, but the artifact is missing at {absoluteScenePath}.");
            }
        }

        private static void PrepareSmokeArtifactDirectory()
        {
            var directory = GetSmokeArtifactDirectory();
            if (Directory.Exists(directory))
            {
                Directory.Delete(directory, true);
            }
            Directory.CreateDirectory(directory);
        }

        private static void WriteValidationMarker(Exception failure)
        {
            var directory = GetSmokeArtifactDirectory();
            Directory.CreateDirectory(directory);
            var markerPath = Path.Combine(directory, ValidationMarkerName);
            var marker = new ValidationMarker
            {
                success = failure == null,
                version = Application.unityVersion,
                scene = PrototypeRoomBuilder.PrototypeScenePath,
                error = failure?.ToString() ?? string.Empty,
            };
            File.WriteAllText(markerPath, JsonUtility.ToJson(marker, true));
            Debug.Log($"DOFFA UNITY SMOKE MARKER: {markerPath}");
        }

        private static string GetSmokeArtifactDirectory()
        {
            var projectRoot = Directory.GetParent(Application.dataPath)?.FullName;
            if (string.IsNullOrWhiteSpace(projectRoot))
            {
                throw new DirectoryNotFoundException($"Cannot resolve Unity project root from {Application.dataPath}.");
            }
            return Path.GetFullPath(Path.Combine(projectRoot, SmokeArtifactDirectory));
        }
    }
}
