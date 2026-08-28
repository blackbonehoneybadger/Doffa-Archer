using System.Collections.Generic;
using UnityEngine;

namespace Doffa.Content
{
    [CreateAssetMenu(menuName = "DOFFA/Content/Tour", fileName = "Tour_")]
    public sealed class TourDefinition : ScriptableObject
    {
        public const int RequiredRoomCount = 50;

        [SerializeField] private string stableId;
        [SerializeField] private string localizedNameKey;
        [SerializeField] private string uniqueThemeId;
        [SerializeField] private string uniqueEnemyFamilyId;
        [SerializeField] private RoomDefinition[] rooms = new RoomDefinition[RequiredRoomCount];

        public string StableId => stableId;
        public string LocalizedNameKey => localizedNameKey;
        public string UniqueThemeId => uniqueThemeId;
        public string UniqueEnemyFamilyId => uniqueEnemyFamilyId;
        public IReadOnlyList<RoomDefinition> Rooms => rooms;
    }
}
