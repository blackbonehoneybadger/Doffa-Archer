using System;
using UnityEngine;

namespace Doffa.Gameplay
{
    [DisallowMultipleComponent]
    public sealed class PrototypeCombatantHealth : MonoBehaviour
    {
        [SerializeField, Min(1f)] private float maximumHealth = 250f;

        private float _currentHealth;

        public event Action<PrototypeCombatantHealth> Died;
        public event Action<PrototypeCombatantHealth> HealthChanged;

        public float CurrentHealth => _currentHealth;
        public float MaximumHealth => maximumHealth;
        public float NormalizedHealth => maximumHealth <= 0f ? 0f : Mathf.Clamp01(_currentHealth / maximumHealth);
        public bool IsAlive => _currentHealth > 0f;

        private void Awake()
        {
            RestoreFullHealth();
        }

        public bool ApplyDamage(float amount)
        {
            if (!IsAlive || float.IsNaN(amount) || float.IsInfinity(amount) || amount <= 0f)
            {
                return false;
            }

            _currentHealth = Mathf.Max(0f, _currentHealth - amount);
            HealthChanged?.Invoke(this);
            if (!IsAlive)
            {
                Died?.Invoke(this);
            }

            return true;
        }

        public void RestoreFullHealth()
        {
            _currentHealth = Mathf.Max(1f, maximumHealth);
            HealthChanged?.Invoke(this);
        }
    }
}
