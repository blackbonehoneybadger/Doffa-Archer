using UnityEngine;

namespace Doffa.Gameplay
{
    [DisallowMultipleComponent]
    public sealed class PrototypeExitDoor : MonoBehaviour
    {
        [SerializeField] private Transform movingPanel;
        [SerializeField] private Vector3 openOffset = new(0f, 3.2f, 0f);
        [SerializeField, Min(0.1f)] private float openSpeed = 4f;
        [SerializeField] private bool isOpen;

        private Vector3 _closedLocalPosition;
        private Collider[] _blockingColliders;

        private void Awake()
        {
            if (movingPanel == null)
            {
                movingPanel = transform;
            }
            _closedLocalPosition = movingPanel.localPosition;
            _blockingColliders = movingPanel.GetComponentsInChildren<Collider>();
        }

        private void Update()
        {
            var target = _closedLocalPosition + (isOpen ? openOffset : Vector3.zero);
            movingPanel.localPosition = Vector3.MoveTowards(
                movingPanel.localPosition,
                target,
                openSpeed * Time.deltaTime
            );

            var blocksPassage = !isOpen || Vector3.Distance(movingPanel.localPosition, target) > 0.08f;
            foreach (var blockingCollider in _blockingColliders)
            {
                blockingCollider.enabled = blocksPassage;
            }
        }

        public void SetOpen(bool value)
        {
            isOpen = value;
        }
    }
}
