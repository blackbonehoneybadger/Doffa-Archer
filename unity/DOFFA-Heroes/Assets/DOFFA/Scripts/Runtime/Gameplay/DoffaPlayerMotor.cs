using UnityEngine;
using UnityEngine.InputSystem;

namespace Doffa.Gameplay
{
    [DisallowMultipleComponent]
    [RequireComponent(typeof(CharacterController))]
    public sealed class DoffaPlayerMotor : MonoBehaviour
    {
        private static readonly int SpeedHash = Animator.StringToHash("Speed");
        private static readonly int MoveXHash = Animator.StringToHash("MoveX");
        private static readonly int MoveZHash = Animator.StringToHash("MoveZ");
        private static readonly int GroundedHash = Animator.StringToHash("Grounded");

        [Header("Movement")]
        [SerializeField, Min(0.1f)] private float maximumSpeed = 5.4f;
        [SerializeField, Min(0.1f)] private float acceleration = 28f;
        [SerializeField, Min(0.1f)] private float deceleration = 36f;
        [SerializeField, Min(1f)] private float turnSpeedDegrees = 900f;
        [SerializeField, Min(0f)] private float gravity = 24f;
        [SerializeField, Range(0f, 0.5f)] private float inputDeadZone = 0.08f;

        [Header("Animation")]
        [SerializeField] private Animator animator;

        private CharacterController _controller;
        private InputAction _moveAction;
        private Vector2 _uiMove;
        private Vector3 _planarVelocity;
        private float _verticalVelocity;

        public Vector3 PlanarVelocity => _planarVelocity;
        public float NormalizedSpeed => maximumSpeed <= 0f ? 0f : Mathf.Clamp01(_planarVelocity.magnitude / maximumSpeed);
        public bool IsMoving => NormalizedSpeed > 0.04f;

        private void Awake()
        {
            _controller = GetComponent<CharacterController>();
            if (animator == null)
            {
                animator = GetComponentInChildren<Animator>();
            }
            _moveAction = CreateMoveAction();
        }

        private void OnEnable()
        {
            _moveAction?.Enable();
        }

        private void OnDisable()
        {
            _moveAction?.Disable();
            _uiMove = Vector2.zero;
        }

        private void OnDestroy()
        {
            _moveAction?.Dispose();
        }

        private void Update()
        {
            var input = ReadMovement();
            var desiredDirection = new Vector3(input.x, 0f, input.y);
            var desiredVelocity = desiredDirection * maximumSpeed;
            var rate = desiredDirection.sqrMagnitude > 0f ? acceleration : deceleration;
            _planarVelocity = Vector3.MoveTowards(_planarVelocity, desiredVelocity, rate * Time.deltaTime);

            if (_controller.isGrounded && _verticalVelocity < 0f)
            {
                _verticalVelocity = -2f;
            }
            else
            {
                _verticalVelocity -= gravity * Time.deltaTime;
            }

            var displacement = _planarVelocity + Vector3.up * _verticalVelocity;
            _controller.Move(displacement * Time.deltaTime);

            if (desiredDirection.sqrMagnitude > 0.001f)
            {
                var targetRotation = Quaternion.LookRotation(desiredDirection, Vector3.up);
                transform.rotation = Quaternion.RotateTowards(
                    transform.rotation,
                    targetRotation,
                    turnSpeedDegrees * Time.deltaTime
                );
            }

            UpdateAnimator(input);
        }

        public void SetUiMovement(Vector2 value)
        {
            _uiMove = Vector2.ClampMagnitude(value, 1f);
        }

        public void FaceWorldDirection(Vector3 direction)
        {
            direction.y = 0f;
            if (direction.sqrMagnitude <= 0.001f)
            {
                return;
            }

            transform.rotation = Quaternion.LookRotation(direction.normalized, Vector3.up);
        }

        private Vector2 ReadMovement()
        {
            var hardware = _moveAction?.ReadValue<Vector2>() ?? Vector2.zero;
            var combined = Vector2.ClampMagnitude(hardware + _uiMove, 1f);
            return combined.sqrMagnitude < inputDeadZone * inputDeadZone ? Vector2.zero : combined;
        }

        private void UpdateAnimator(Vector2 input)
        {
            if (animator == null || animator.runtimeAnimatorController == null)
            {
                return;
            }

            animator.applyRootMotion = false;
            animator.SetFloat(SpeedHash, NormalizedSpeed, 0.08f, Time.deltaTime);
            animator.SetFloat(MoveXHash, input.x, 0.06f, Time.deltaTime);
            animator.SetFloat(MoveZHash, input.y, 0.06f, Time.deltaTime);
            animator.SetBool(GroundedHash, _controller.isGrounded);
        }

        private static InputAction CreateMoveAction()
        {
            var action = new InputAction("Move", InputActionType.Value, expectedControlType: "Vector2");

            action.AddCompositeBinding("2DVector")
                .With("Up", "<Keyboard>/w")
                .With("Down", "<Keyboard>/s")
                .With("Left", "<Keyboard>/a")
                .With("Right", "<Keyboard>/d");

            action.AddCompositeBinding("2DVector")
                .With("Up", "<Keyboard>/upArrow")
                .With("Down", "<Keyboard>/downArrow")
                .With("Left", "<Keyboard>/leftArrow")
                .With("Right", "<Keyboard>/rightArrow");

            action.AddBinding("<Gamepad>/leftStick");
            return action;
        }
    }
}
