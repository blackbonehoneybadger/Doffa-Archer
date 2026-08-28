using UnityEngine;

namespace Doffa.Gameplay
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(DoffaPlayerMotor))]
    [RequireComponent(typeof(PrototypeCombatantHealth))]
    public sealed class PrototypeAutoAttack : MonoBehaviour
    {
        [SerializeField, Min(0.1f)] private float range = 3.25f;
        [SerializeField, Min(0.1f)] private float attacksPerSecond = 1.6f;
        [SerializeField, Min(1f)] private float damage = 25f;
        [SerializeField] private LineRenderer strikeLine;

        private DoffaPlayerMotor _motor;
        private PrototypeCombatantHealth _health;
        private float _nextAttackAt;
        private float _hideStrikeAt;

        private void Awake()
        {
            _motor = GetComponent<DoffaPlayerMotor>();
            _health = GetComponent<PrototypeCombatantHealth>();
            if (strikeLine != null)
            {
                strikeLine.enabled = false;
            }
        }

        private void Update()
        {
            if (strikeLine != null && strikeLine.enabled && Time.time >= _hideStrikeAt)
            {
                strikeLine.enabled = false;
            }

            if (_health != null && !_health.IsAlive)
            {
                return;
            }

            if (_motor.IsMoving || Time.time < _nextAttackAt)
            {
                return;
            }

            var target = FindNearestTarget();
            if (target == null)
            {
                return;
            }

            var offset = target.transform.position - transform.position;
            _motor.FaceWorldDirection(offset);
            target.ApplyDamage(damage);
            _nextAttackAt = Time.time + 1f / attacksPerSecond;
            ShowStrike(target.AimPoint);
        }

        private PrototypeEnemyAgent FindNearestTarget()
        {
            var rangeSquared = range * range;
            PrototypeEnemyAgent nearest = null;
            var nearestDistance = rangeSquared;
            foreach (var target in PrototypeEnemyAgent.ActiveInstances)
            {
                if (target == null || !target.IsAlive)
                {
                    continue;
                }

                var distance = (target.transform.position - transform.position).sqrMagnitude;
                if (distance <= nearestDistance && HasLineOfSight(target))
                {
                    nearest = target;
                    nearestDistance = distance;
                }
            }

            return nearest;
        }

        private bool HasLineOfSight(PrototypeEnemyAgent target)
        {
            var targetPoint = target.AimPoint;
            var direction = targetPoint - (transform.position + Vector3.up * 1.1f);
            var origin = transform.position + Vector3.up * 1.1f + direction.normalized * 0.5f;
            if (!Physics.Linecast(origin, targetPoint, out var hit, ~0, QueryTriggerInteraction.Ignore))
            {
                return true;
            }

            return hit.transform == target.transform || hit.transform.IsChildOf(target.transform);
        }

        private void ShowStrike(Vector3 targetPosition)
        {
            if (strikeLine == null)
            {
                return;
            }

            strikeLine.SetPosition(0, transform.position + Vector3.up * 1.1f);
            strikeLine.SetPosition(1, targetPosition + Vector3.up * 0.8f);
            strikeLine.enabled = true;
            _hideStrikeAt = Time.time + 0.08f;
        }
    }
}
