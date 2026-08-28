using System;
using UnityEngine;

namespace Doffa.Content
{
    public enum RoomKind
    {
        Combat,
        Guardian,
        Recovery,
        Event,
        Gauntlet,
        Boss
    }

    [Serializable]
    public sealed class RoomDefinition
    {
        [SerializeField, Range(1, 50)] private int number = 1;
        [SerializeField] private string stableId;
        [SerializeField] private RoomKind kind;
        [SerializeField] private string districtId;
        [SerializeField] private string layoutId;
        [SerializeField] private int visualSeed;
        [SerializeField] private GameObject roomPrefab;
        [SerializeField] private GameObject encounterPrefab;

        public int Number => number;
        public string StableId => stableId;
        public RoomKind Kind => kind;
        public string DistrictId => districtId;
        public string LayoutId => layoutId;
        public int VisualSeed => visualSeed;
        public GameObject RoomPrefab => roomPrefab;
        public GameObject EncounterPrefab => encounterPrefab;
    }
}
