using UnityEngine;

namespace Doffa.Presentation
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(Camera))]
    public sealed class DoffaIsometricCameraRig : MonoBehaviour
    {
        [SerializeField] private Transform followTarget;
        [SerializeField] private Vector3 worldOffset = new(0f, 13.5f, -10.5f);
        [SerializeField, Range(35f, 70f)] private float pitch = 52f;
        [SerializeField, Range(-180f, 180f)] private float yaw = 0f;
        [SerializeField, Min(1f)] private float orthographicSize = 8.75f;
        [SerializeField, Min(0f)] private float positionSharpness = 14f;
        [SerializeField] private Vector2 minimumFollowXZ = new(-2.2f, -5.8f);
        [SerializeField] private Vector2 maximumFollowXZ = new(2.2f, 5.8f);
        [SerializeField, Min(0.1f)] private float arenaHalfWidth = 6f;

        private Camera _camera;

        public void Configure(Transform target, Vector2 minimumXZ, Vector2 maximumXZ)
        {
            followTarget = target;
            minimumFollowXZ = Vector2.Min(minimumXZ, maximumXZ);
            maximumFollowXZ = Vector2.Max(minimumXZ, maximumXZ);
        }

        private void Awake()
        {
            _camera = GetComponent<Camera>();
            _camera.orthographic = true;
            _camera.orthographicSize = orthographicSize;
            transform.rotation = Quaternion.Euler(pitch, yaw, 0f);
        }

        private void LateUpdate()
        {
            if (followTarget == null)
            {
                return;
            }

            var clampedFollow = followTarget.position;
            var visibleHalfWidth = _camera.orthographicSize * Mathf.Max(0.01f, _camera.aspect);
            var aspectAllowedX = Mathf.Max(0f, arenaHalfWidth - visibleHalfWidth);
            var effectiveMinimumX = Mathf.Max(minimumFollowXZ.x, -aspectAllowedX);
            var effectiveMaximumX = Mathf.Min(maximumFollowXZ.x, aspectAllowedX);
            clampedFollow.x = effectiveMinimumX <= effectiveMaximumX
                ? Mathf.Clamp(clampedFollow.x, effectiveMinimumX, effectiveMaximumX)
                : 0f;
            clampedFollow.z = Mathf.Clamp(clampedFollow.z, minimumFollowXZ.y, maximumFollowXZ.y);
            var targetPosition = clampedFollow + worldOffset;
            var blend = 1f - Mathf.Exp(-positionSharpness * Time.unscaledDeltaTime);
            transform.position = Vector3.Lerp(transform.position, targetPosition, blend);
        }

#if UNITY_EDITOR
        private void OnValidate()
        {
            var attachedCamera = GetComponent<Camera>();
            attachedCamera.orthographic = true;
            attachedCamera.orthographicSize = orthographicSize;
            transform.rotation = Quaternion.Euler(pitch, yaw, 0f);
        }
#endif
    }
}
