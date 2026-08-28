using UnityEngine;

namespace Doffa.Content
{
    public enum HeroId
    {
        HoneyBadger,
        Boy,
        MrKroo,
        Hadida,
        Pata
    }

    [CreateAssetMenu(menuName = "DOFFA/Content/Hero Identity", fileName = "HeroIdentity_")]
    public sealed class HeroIdentityDefinition : ScriptableObject
    {
        [SerializeField] private HeroId id;
        [SerializeField] private string displayName;
        [SerializeField] private GameObject productionPrefab;
        [SerializeField] private Texture2D sourceReference;
        [SerializeField, TextArea] private string immutableFaceNotes;
        [SerializeField, TextArea] private string immutableBodyAndWardrobeNotes;
        [SerializeField, TextArea] private string immutableWeaponNotes;
        [SerializeField] private bool identityApproved;
        [SerializeField] private bool topDownApproved;
        [SerializeField] private bool motionApproved;
        [SerializeField] private bool visibleTattooCoverageApproved;

        public HeroId Id => id;
        public string DisplayName => displayName;
        public GameObject ProductionPrefab => productionPrefab;
        public Texture2D SourceReference => sourceReference;
        public bool IsProductionReady =>
            productionPrefab != null &&
            sourceReference != null &&
            identityApproved &&
            topDownApproved &&
            motionApproved &&
            (id != HeroId.HoneyBadger || visibleTattooCoverageApproved);
    }
}
