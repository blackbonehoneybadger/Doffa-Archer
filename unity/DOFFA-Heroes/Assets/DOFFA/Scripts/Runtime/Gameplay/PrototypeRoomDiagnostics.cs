using System.Collections.Generic;
using UnityEngine;

namespace Doffa.Gameplay
{
    [DisallowMultipleComponent]
    public sealed class PrototypeRoomDiagnostics : MonoBehaviour
    {
        [SerializeField] private Transform player;
        [SerializeField] private PrototypeEnemyAgent[] enemies;
        [SerializeField] private Vector3 playableCenter = Vector3.zero;
        [SerializeField] private Vector3 playableExtents = new(5.7f, 4f, 9.7f);
        [SerializeField, Min(0.1f)] private float sampleInterval = 0.5f;
        [SerializeField, Min(1f)] private float stuckWarningSeconds = 5f;

        private readonly Dictionary<PrototypeEnemyAgent, Vector3> _lastEnemyPositions = new();
        private readonly Dictionary<PrototypeEnemyAgent, float> _enemyStillSeconds = new();
        private float _nextSampleAt;

        private void Start()
        {
            enemies ??= System.Array.Empty<PrototypeEnemyAgent>();
            foreach (var enemy in enemies)
            {
                if (enemy == null)
                {
                    continue;
                }

                _lastEnemyPositions[enemy] = enemy.transform.position;
                _enemyStillSeconds[enemy] = 0f;
            }
        }

        private void Update()
        {
            if (Time.unscaledTime < _nextSampleAt)
            {
                return;
            }

            _nextSampleAt = Time.unscaledTime + sampleInterval;
            ValidateTransform(player, "player");
            ValidateBounds();
            ValidateEnemies();
        }

        private void ValidateBounds()
        {
            if (player == null)
            {
                return;
            }

            var delta = player.position - playableCenter;
            ValidateBounds(player, "player", delta);
        }

        private void ValidateEnemies()
        {
            foreach (var enemy in enemies)
            {
                if (enemy == null || !enemy.IsAlive)
                {
                    continue;
                }

                ValidateTransform(enemy.transform, enemy.name);
                ValidateBounds(enemy.transform, enemy.name, enemy.transform.position - playableCenter);
                var previous = _lastEnemyPositions[enemy];
                var moved = Vector3.Distance(previous, enemy.transform.position);
                _lastEnemyPositions[enemy] = enemy.transform.position;

                var playerDistance = player == null ? 0f : Vector3.Distance(player.position, enemy.transform.position);
                if (moved < 0.025f && playerDistance > 2.25f)
                {
                    _enemyStillSeconds[enemy] += sampleInterval;
                    if (_enemyStillSeconds[enemy] >= stuckWarningSeconds)
                    {
                        Debug.LogWarning($"DOFFA prototype steering check: {enemy.name} may be stuck.", enemy);
                        _enemyStillSeconds[enemy] = 0f;
                    }
                }
                else
                {
                    _enemyStillSeconds[enemy] = 0f;
                }
            }
        }

        private void ValidateBounds(Transform value, string label, Vector3 delta)
        {
            if (Mathf.Abs(delta.x) <= playableExtents.x + 0.5f &&
                Mathf.Abs(delta.y) <= playableExtents.y + 0.5f &&
                Mathf.Abs(delta.z) <= playableExtents.z + 0.5f)
            {
                return;
            }

            Debug.LogError($"DOFFA prototype {label} escaped playable bounds at {value.position}.", value);
            if (label == "player")
            {
                enabled = false;
            }
        }

        private static void ValidateTransform(Transform value, string label)
        {
            if (value == null)
            {
                Debug.LogError($"DOFFA prototype diagnostic is missing {label} transform.");
                return;
            }

            var position = value.position;
            if (!IsFinite(position.x) || !IsFinite(position.y) || !IsFinite(position.z))
            {
                Debug.LogError($"DOFFA prototype {label} has a non-finite position.", value);
            }
        }

        private static bool IsFinite(float value)
        {
            return !float.IsNaN(value) && !float.IsInfinity(value);
        }
    }
}
