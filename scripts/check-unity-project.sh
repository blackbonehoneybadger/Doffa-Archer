#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
project_path="$repo_root/unity/DOFFA-Heroes"
unity_editor="${UNITY_EDITOR:-}"

if [[ -z "$unity_editor" ]]; then
  for candidate in Unity unity-editor unity; do
    if command -v "$candidate" >/dev/null 2>&1; then
      unity_editor="$(command -v "$candidate")"
      break
    fi
  done
fi

if [[ -z "$unity_editor" || ! -x "$unity_editor" ]]; then
  echo "Unity Editor was not found. Set UNITY_EDITOR to the Unity 6000.3.22f1 executable."
  exit 2
fi

"$unity_editor" \
  -batchmode \
  -nographics \
  -quit \
  -projectPath "$project_path" \
  -executeMethod Doffa.Editor.PrototypeRoomBuilder.Build \
  -logFile -
