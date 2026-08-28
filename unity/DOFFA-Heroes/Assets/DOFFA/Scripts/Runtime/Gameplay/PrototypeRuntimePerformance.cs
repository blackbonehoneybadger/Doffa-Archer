using UnityEngine;

namespace Doffa.Gameplay
{
    [DisallowMultipleComponent]
    public sealed class PrototypeRuntimePerformance : MonoBehaviour
    {
        [SerializeField, Range(30, 120)] private int targetFrameRate = 60;
        [SerializeField, Min(2f)] private float reportInterval = 10f;
        [SerializeField, Min(1f)] private float warningThresholdFps = 29f;

        private float _windowStartedAt;
        private int _renderedFrames;

        private void Awake()
        {
            QualitySettings.vSyncCount = 0;
            Application.targetFrameRate = targetFrameRate;
            _windowStartedAt = Time.realtimeSinceStartup;
        }

        private void Update()
        {
            _renderedFrames += 1;
            var elapsed = Time.realtimeSinceStartup - _windowStartedAt;
            if (elapsed < reportInterval)
            {
                return;
            }

            var averageFps = elapsed <= 0f ? 0f : _renderedFrames / elapsed;
            if (averageFps < warningThresholdFps)
            {
                Debug.LogWarning($"DOFFA prototype performance window averaged {averageFps:F1} FPS.");
            }
            else
            {
                Debug.Log($"DOFFA prototype performance window averaged {averageFps:F1} FPS.");
            }

            _renderedFrames = 0;
            _windowStartedAt = Time.realtimeSinceStartup;
        }
    }
}
