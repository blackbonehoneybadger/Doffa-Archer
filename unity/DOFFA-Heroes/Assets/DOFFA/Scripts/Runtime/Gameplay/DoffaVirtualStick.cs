using UnityEngine;
using UnityEngine.EventSystems;

namespace Doffa.Gameplay
{
    [DisallowMultipleComponent]
    public sealed class DoffaVirtualStick : MonoBehaviour, IPointerDownHandler, IDragHandler, IPointerUpHandler
    {
        [SerializeField] private DoffaPlayerMotor motor;
        [SerializeField] private RectTransform handle;
        [SerializeField, Min(20f)] private float radius = 96f;

        private RectTransform _rectTransform;

        private void Awake()
        {
            _rectTransform = (RectTransform)transform;
        }

        public void OnPointerDown(PointerEventData eventData)
        {
            OnDrag(eventData);
        }

        public void OnDrag(PointerEventData eventData)
        {
            if (motor == null || !RectTransformUtility.ScreenPointToLocalPointInRectangle(
                    _rectTransform,
                    eventData.position,
                    eventData.pressEventCamera,
                    out var localPoint))
            {
                return;
            }

            var value = Vector2.ClampMagnitude(localPoint / radius, 1f);
            motor.SetUiMovement(value);
            if (handle != null)
            {
                handle.anchoredPosition = value * radius;
            }
        }

        public void OnPointerUp(PointerEventData eventData)
        {
            if (motor != null)
            {
                motor.SetUiMovement(Vector2.zero);
            }
            if (handle != null)
            {
                handle.anchoredPosition = Vector2.zero;
            }
        }
    }
}
