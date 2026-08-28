using System;
using System.Collections.Generic;
using System.Linq;
using Doffa.Content;
using UnityEditor;
using UnityEngine;

namespace Doffa.Editor
{
    public static class ProductionContentValidator
    {
        private const int RequiredHeroCount = 5;
        private const int RequiredTourCount = 5;

        [MenuItem("DOFFA/Validate Production Content")]
        public static void ValidateFromMenu()
        {
            var errors = Validate();
            if (errors.Count == 0)
            {
                Debug.Log("DOFFA production content passed: 5 heroes, 5 tours, 250 unique room definitions.");
                return;
            }

            foreach (var error in errors)
            {
                Debug.LogError(error);
            }

            throw new InvalidOperationException($"DOFFA production validation failed with {errors.Count} error(s).");
        }

        public static List<string> Validate()
        {
            var errors = new List<string>();
            var heroes = LoadAssets<HeroIdentityDefinition>();
            var tours = LoadAssets<TourDefinition>();

            if (heroes.Length != RequiredHeroCount)
            {
                errors.Add($"Expected {RequiredHeroCount} hero identity assets, found {heroes.Length}.");
            }

            var duplicateHeroIds = heroes.GroupBy(hero => hero.Id).Where(group => group.Count() > 1);
            errors.AddRange(duplicateHeroIds.Select(group => $"Duplicate hero identity: {group.Key}."));

            foreach (var hero in heroes.Where(hero => !hero.IsProductionReady))
            {
                errors.Add($"Hero {hero.name} has not passed identity, top-down, motion, prefab, reference, or tattoo approval.");
            }

            if (tours.Length != RequiredTourCount)
            {
                errors.Add($"Expected {RequiredTourCount} tours, found {tours.Length}.");
            }

            ValidateUnique(tours, tour => tour.StableId, "tour stable ID", errors);
            ValidateUnique(tours, tour => tour.UniqueThemeId, "tour visual theme", errors);
            ValidateUnique(tours, tour => tour.UniqueEnemyFamilyId, "tour enemy family", errors);

            foreach (var tour in tours)
            {
                ValidateTour(tour, errors);
            }

            return errors;
        }

        private static void ValidateTour(TourDefinition tour, ICollection<string> errors)
        {
            var rooms = tour.Rooms.Where(room => room != null).ToArray();
            if (rooms.Length != TourDefinition.RequiredRoomCount)
            {
                errors.Add($"Tour {tour.name} must contain exactly 50 rooms; found {rooms.Length}.");
                return;
            }

            var expectedNumbers = Enumerable.Range(1, TourDefinition.RequiredRoomCount).ToArray();
            var actualNumbers = rooms.Select(room => room.Number).OrderBy(number => number).ToArray();
            if (!expectedNumbers.SequenceEqual(actualNumbers))
            {
                errors.Add($"Tour {tour.name} must contain room numbers 1 through 50 exactly once.");
            }

            ValidateUnique(rooms, room => room.StableId, $"room stable ID in {tour.name}", errors);
            ValidateUnique(rooms, room => room.LayoutId, $"room layout ID in {tour.name}", errors);

            ValidateMilestone(tour, rooms, 10, RoomKind.Guardian, errors);
            ValidateMilestone(tour, rooms, 20, RoomKind.Guardian, errors);
            ValidateMilestone(tour, rooms, 30, RoomKind.Guardian, errors);
            ValidateMilestone(tour, rooms, 40, RoomKind.Guardian, errors);
            ValidateMilestone(tour, rooms, 50, RoomKind.Boss, errors);
        }

        private static void ValidateMilestone(
            TourDefinition tour,
            IEnumerable<RoomDefinition> rooms,
            int number,
            RoomKind expectedKind,
            ICollection<string> errors)
        {
            var room = rooms.SingleOrDefault(candidate => candidate.Number == number);
            if (room == null || room.Kind != expectedKind)
            {
                errors.Add($"Tour {tour.name} room {number} must be {expectedKind}.");
            }
        }

        private static void ValidateUnique<T>(
            IEnumerable<T> values,
            Func<T, string> selector,
            string label,
            ICollection<string> errors)
        {
            var keys = values.Select(selector).ToArray();
            if (keys.Any(string.IsNullOrWhiteSpace))
            {
                errors.Add($"Every {label} must be non-empty.");
            }

            foreach (var duplicate in keys.Where(key => !string.IsNullOrWhiteSpace(key)).GroupBy(key => key).Where(group => group.Count() > 1))
            {
                errors.Add($"Duplicate {label}: {duplicate.Key}.");
            }
        }

        private static T[] LoadAssets<T>() where T : UnityEngine.Object
        {
            return AssetDatabase.FindAssets($"t:{typeof(T).Name}")
                .Select(AssetDatabase.GUIDToAssetPath)
                .Select(AssetDatabase.LoadAssetAtPath<T>)
                .Where(asset => asset != null)
                .ToArray();
        }
    }
}
