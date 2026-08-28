using System;
using System.Collections.Generic;
using UnityEngine;

namespace Doffa.Gameplay
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(CharacterController))]
    [RequireComponent(typeof(PrototypeCombatantHealth))]
    public sealed class PrototypeEnemyAgent : MonoBehaviour
    {
        private static readonly List<PrototypeEnemyAgent> Active = new();

        private enum EnemyState
        {
            Chase,
            Windup,
            Recovery,
            Defeated,
        }

        [Header("Target")]
        [SerializeField] private Transform player;
        [SerializeField] private PrototypeCombatantHealth playerHealth;

        [Header("Movement")]
        [SerializeField, Min(0.1f)] private float movementSpeed = 2.65f;
        [SerializeField, Min(0f)] private float stoppingDistance = 1.55f;
        [SerializeField, Min(30f)] private float turnSpeedDegrees = 540f;
        [SerializeField, Min(0.1f)] private float obstacleProbeDistance = 1.25f;
        [SerializeField, Range(10f, 80f)] private float avoidanceAngle = 42f;

        [Header("Attack")]
        [SerializeField, Min(0.1f)] private float attackRange = 1.85f;
        [SerializeField, Min(0.05f)] private float windupDuration = 0.72f;
        [SerializeField, Min(0.05f)] private float recoveryDuration = 0.85f;
        [SerializeField, Min(1f)] private float attackDamage = 24f;
        [SerializeField] private Renderer telegraphRenderer;

        private CharacterController _controller;
        private PrototypeCombatantHealth _health;
        private EnemyState _state;
        private float _stateEndsAt;
        private Vector3 _lockedAttackPoint;
        private Vector3 _baseScale;

        public event Action<PrototypeEnemyAgent> Defeated;

        public static IReadOnlyList<PrototypeEnemyAgent> ActiveInstances => Active;
        public bool IsAlive => _health != null && _health.IsAlive;
        public Vector3 AimPoint => transform.position + Vector3.up * 0.85f;

        private void Awake()
        {
            _controller = GetComponent<CharacterController>();
            _health = GetComponent<PrototypeCombatantHealth>();
            _health.Died += OnDied;
            _baseScale = transform.localScale;
            SetTelegraph(false);
        }

        private void OnDestroy()
        {
            if (_health != null)
            {
                _health.Died -= OnDied;
            }
        }

        private void OnEnable()
        {
            if (!Active.Contains(this))
            {
                Active.Add(this);
            }
        }

        private void OnDisable()
        {
            Active.Remove(this);
        }

        private void Update()
        {
            if (_state == EnemyState.Defeated || player == null || playerHealth == null || !playerHealth.IsAlive)
            {
                return;
            }

            switch (_state)
            {
                case EnemyState.Windup:
                    FaceDirection(_lockedAttackPoint - transform.position);
                    if (Time.time >= _stateEndsAt)
                    {
                        ResolveAttack();
                    }
                    break;
                case EnemyState.Recovery:
                    if (Time.time >= _stateEndsAt)
                    {
                        _state = EnemyState.Chase;
                    }
                    break;
                default:
                    ChaseOrAttack();
                    break;
            }
        }

        public void Configure(Transform target, PrototypeCombatantHealth targetHealth)
        {
            player = target;
            playerHealth = targetHealth;
        }

        public bool ApplyDamage(float amount)
        {
            if (_health == null || !_health.ApplyDamage(amount))
            {
                return false;
            }

            if (_state != EnemyState.Defeated)
            {
                transform.localScale = _baseScale * 1.08f;
            }
            return true;
        }

        private void LateUpdate()
        {
            if (_state != EnemyState.Defeated)
            {
                transform.localScale = Vector3.Lerp(transform.localScale, _baseScale, 12f * Time.deltaTime);
            }
        }

        private void ChaseOrAttack()
        {
            var offset = player.position - transform.position;
            offset.y = 0f;
            var distance = offset.magnitude;
            if (distance <= attackRange)
            {
                BeginWindup();
                return;
            }

            if (distance <= stoppingDistance || distance <= Mathf.Epsilon)
            {
                return;
            }

            var desiredDirection = offset / distance;
            var movementDirection = SelectSteeringDirection(desiredDirection);
            FaceDirection(movementDirection);
            _controller.SimpleMove(movementDirection * movementSpeed);
        }

        private Vector3 SelectSteeringDirection(Vector3 desiredDirection)
        {
            if (!IsBlocked(desiredDirection))
            {
                return desiredDirection;
            }

            var left = Quaternion.Euler(0f, -avoidanceAngle, 0f) * desiredDirection;
            var right = Quaternion.Euler(0f, avoidanceAngle, 0f) * desiredDirection;
            var leftBlocked = IsBlocked(left);
            var rightBlocked = IsBlocked(right);

            if (!leftBlocked && rightBlocked)
            {
                return left;
            }

            if (!rightBlocked && leftBlocked)
            {
                return right;
            }

            var targetLocal = transform.InverseTransformPoint(player.position);
            return targetLocal.x < 0f ? left : right;
        }

        private bool IsBlocked(Vector3 direction)
        {
            var origin = transform.position + Vector3.up * Mathf.Max(0.35f, _controller.radius);
            return Physics.SphereCast(
                origin,
                _controller.radius * 0.72f,
                direction,
                out var hit,
                obstacleProbeDistance,
                ~0,
                QueryTriggerInteraction.Ignore
            ) && hit.transform != player && !hit.transform.IsChildOf(transform);
        }

        private void BeginWindup()
        {
            _state = EnemyState.Windup;
            _stateEndsAt = Time.time + windupDuration;
            _lockedAttackPoint = player.position;
            SetTelegraph(true);
        }

        private void ResolveAttack()
        {
            SetTelegraph(false);
            var offset = player.position - transform.position;
            offset.y = 0f;
            if (offset.sqrMagnitude <= attackRange * attackRange * 1.15f && HasLineOfSightToPlayer())
            {
                playerHealth.ApplyDamage(attackDamage);
            }

            _state = EnemyState.Recovery;
            _stateEndsAt = Time.time + recoveryDuration;
        }

        private bool HasLineOfSightToPlayer()
        {
            var targetPoint = player.position + Vector3.up;
            var direction = targetPoint - (transform.position + Vector3.up * 0.85f);
            var origin = transform.position + Vector3.up * 0.85f + direction.normalized * (_controller.radius + 0.08f);
            if (!Physics.Linecast(origin, targetPoint, out var hit, ~0, QueryTriggerInteraction.Ignore))
            {
                return true;
            }

            return hit.transform == player || hit.transform.IsChildOf(player);
        }

        private void OnDied(PrototypeCombatantHealth ignored)
        {
            _state = EnemyState.Defeated;
            SetTelegraph(false);
            if (_controller != null)
            {
                _controller.enabled = false;
            }

            transform.localScale = new Vector3(_baseScale.x * 1.1f, _baseScale.y * 0.22f, _baseScale.z * 1.1f);
            Defeated?.Invoke(this);
        }

        private void FaceDirection(Vector3 direction)
        {
            direction.y = 0f;
            if (direction.sqrMagnitude <= 0.001f)
            {
                return;
            }

            var targetRotation = Quaternion.LookRotation(direction.normalized, Vector3.up);
            transform.rotation = Quaternion.RotateTowards(
                transform.rotation,
                targetRotation,
                turnSpeedDegrees * Time.deltaTime
            );
        }

        private void SetTelegraph(bool visible)
        {
            if (telegraphRenderer != null)
            {
                telegraphRenderer.enabled = visible;
            }
        }
    }
}
