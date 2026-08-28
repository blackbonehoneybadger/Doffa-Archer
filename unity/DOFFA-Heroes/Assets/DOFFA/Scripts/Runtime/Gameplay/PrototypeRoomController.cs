using System.Collections;
using System.Linq;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Doffa.Gameplay
{
    [DisallowMultipleComponent]
    public sealed class PrototypeRoomController : MonoBehaviour
    {
        private enum RoomState
        {
            Active,
            Cleared,
            Completed,
            Defeated,
        }

        [SerializeField] private DoffaPlayerMotor playerMotor;
        [SerializeField] private PrototypeCombatantHealth playerHealth;
        [SerializeField] private PrototypeEnemyAgent[] enemies;
        [SerializeField] private PrototypeExitDoor exitDoor;
        [SerializeField] private PrototypeExitTrigger exitTrigger;
        [SerializeField, Min(0.1f)] private float defeatRestartDelay = 1.6f;
        [SerializeField] private bool restartAfterDefeat = true;

        private RoomState _state;

        public int RemainingEnemies => enemies?.Count(enemy => enemy != null && enemy.IsAlive) ?? 0;
        public bool IsCleared => _state == RoomState.Cleared || _state == RoomState.Completed;

        private void Awake()
        {
            enemies ??= System.Array.Empty<PrototypeEnemyAgent>();
            _state = RoomState.Active;
            if (exitDoor != null)
            {
                exitDoor.SetOpen(false);
            }
            if (exitTrigger != null)
            {
                exitTrigger.SetUnlocked(false);
            }
        }

        private void OnEnable()
        {
            if (playerHealth != null)
            {
                playerHealth.Died += OnPlayerDied;
            }

            foreach (var enemy in enemies.Where(enemy => enemy != null))
            {
                enemy.Defeated += OnEnemyDefeated;
            }

            if (exitTrigger != null)
            {
                exitTrigger.PlayerExited += OnPlayerExited;
            }
        }

        private void Start()
        {
            if (RemainingEnemies == 0)
            {
                CompleteCombat();
            }
        }

        private void OnDisable()
        {
            if (playerHealth != null)
            {
                playerHealth.Died -= OnPlayerDied;
            }

            foreach (var enemy in enemies.Where(enemy => enemy != null))
            {
                enemy.Defeated -= OnEnemyDefeated;
            }

            if (exitTrigger != null)
            {
                exitTrigger.PlayerExited -= OnPlayerExited;
            }
        }

        private void OnEnemyDefeated(PrototypeEnemyAgent ignored)
        {
            if (_state == RoomState.Active && RemainingEnemies == 0)
            {
                CompleteCombat();
            }
        }

        private void CompleteCombat()
        {
            _state = RoomState.Cleared;
            if (exitDoor != null)
            {
                exitDoor.SetOpen(true);
            }
            if (exitTrigger != null)
            {
                exitTrigger.SetUnlocked(true);
            }
            Debug.Log("DOFFA prototype combat cleared. Exit through the opened north door.");
        }

        private void OnPlayerExited()
        {
            if (_state != RoomState.Cleared)
            {
                return;
            }

            _state = RoomState.Completed;
            if (playerMotor != null)
            {
                playerMotor.enabled = false;
            }

            Debug.Log("DOFFA Room_Prototype_01 completed: movement, combat, clearance, and exit loop passed.");
        }

        private void OnPlayerDied(PrototypeCombatantHealth ignored)
        {
            if (_state == RoomState.Completed || _state == RoomState.Defeated)
            {
                return;
            }

            _state = RoomState.Defeated;
            if (playerMotor != null)
            {
                playerMotor.enabled = false;
            }

            Debug.LogWarning("DOFFA prototype player defeated.");
            if (restartAfterDefeat)
            {
                StartCoroutine(RestartAfterDelay());
            }
        }

        private IEnumerator RestartAfterDelay()
        {
            yield return new WaitForSeconds(defeatRestartDelay);
            var activeScene = SceneManager.GetActiveScene();
            if (activeScene.buildIndex >= 0 && activeScene.buildIndex < SceneManager.sceneCountInBuildSettings)
            {
                SceneManager.LoadScene(activeScene.buildIndex);
            }
            else if (SceneManager.sceneCountInBuildSettings > 0)
            {
                SceneManager.LoadScene(0);
            }
            else
            {
                Debug.LogError("DOFFA prototype cannot restart because Build Settings contains no scenes.");
            }
        }
    }
}
