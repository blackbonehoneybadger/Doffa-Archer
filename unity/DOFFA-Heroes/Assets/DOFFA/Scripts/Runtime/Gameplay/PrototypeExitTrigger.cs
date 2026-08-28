using System;
using UnityEngine;

namespace Doffa.Gameplay
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(Collider))]
    public sealed class PrototypeExitTrigger : MonoBehaviour
    {
        [SerializeField] private Transform player;
        [SerializeField] private bool isUnlocked;

        public event Action PlayerExited;

        public void Configure(Transform playerTransform)
        {
            player = playerTransform;
        }

        public void SetUnlocked(bool value)
        {
            isUnlocked = value;
        }

        private void OnTriggerEnter(Collider other)
        {
            if (!isUnlocked || player == null)
            {
                return;
            }

            var entering = other.transform;
            if (entering == player || entering.IsChildOf(player) || player.IsChildOf(entering))
            {
                isUnlocked = false;
                PlayerExited?.Invoke();
            }
        }
    }
}
