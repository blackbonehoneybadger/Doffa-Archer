# DOFFA Heroes — Unity CI gate

Этот gate закрывает машинную часть первого импорта Unity и серой контрольной комнаты. Он не заменяет ручной Play Mode и проверку на настоящем Android.

## Что запускается

Workflow `.github/workflows/unity-prototype-smoke.yml` работает только для доверенной ветки `codex/unity-production-foundation` или вручную после появления файла в default branch. Он использует Unity `6000.3.22f1`, импортирует проект, компилирует Editor/Runtime assemblies и вызывает:

```text
Doffa.Editor.PrototypeRoomSmokeValidator.ValidateForBatch
```

Validator на чистом checkout:

1. Создаёт и назначает URP Asset и Universal Renderer Data, если pipeline ещё не настроен.
2. Фиксирует портретную ориентацию, Linear color space и новый Input System.
3. Генерирует и сохраняет `Room_Prototype_01.unity`, материалы и Build Settings.
4. Проверяет героя, трёх врагов, камеру, мобильный стик, препятствия, дверь, выход, освещение и обязательные serialized references.
5. Пишет `Artifacts/UnitySmoke/validation.json` и завершает Unity кодом `0` только при полном успехе.

Отдельный shell-шаг требует существование marker, сцены и URP Asset. Поэтому тихий выход Unity без вызова build method не может дать зелёный результат.

## Лицензия

Значения добавляются владельцем репозитория в **Settings → Secrets and variables → Actions**. Их нельзя отправлять в чат или коммитить.

- Unity Personal: `UNITY_LICENSE`, `UNITY_EMAIL`, `UNITY_PASSWORD`.
- Unity Pro: `UNITY_SERIAL`, `UNITY_EMAIL`, `UNITY_PASSWORD`.
- Floating license: `UNITY_LICENSING_SERVER`.

Если локального Unity Hub пока нет, доверенная ветка содержит одноразовый workflow
`.github/workflows/unity-license-request.yml`. Он запускает тот же закреплённый образ Unity без сети,
создаёт только файл запроса `Unity_6000.3.22f1.alf` и хранит artifact один день. Workflow не принимает
пароли и не получает доступ к repository secrets. Полученный `.alf` всё равно должен быть обменян на
`.ulf` через официальный портал Unity ID; после настройки `UNITY_LICENSE` bootstrap workflow следует удалить.

Workflow не запускается из `pull_request_target` и получает только `contents: read`. Все внешние GitHub Actions закреплены полными commit SHA, а GameCI editor image — OCI digest.

## Артефакты успешного запуска

- `Artifacts/UnitySmoke/validation.json`;
- `Assets/DOFFA/Scenes/Room_Prototype_01.unity`;
- `Assets/DOFFA/Materials/Prototype`;
- `Assets/DOFFA/Settings/Rendering`;
- `Packages/packages-lock.json`;
- сгенерированные `ProjectSettings`.

После первого зелёного запуска эти Unity-generated файлы надо забрать из artifact, открыть тем же Editor, визуально проверить и закоммитить отдельным изменением.

Локально тот же validator запускается командой `npm run check:unity`. Если Unity `6000.3.22f1` не установлен или переменная `UNITY_EDITOR` не указывает на него, команда специально завершается с кодом `2`: это означает «Editor отсутствует», а не успешную компиляцию.

## Что остаётся ручным

- десять минут Play Mode без Console errors и застреваний;
- портретные профили экрана и safe area;
- touch UX;
- Development/Release FPS и GC на среднем и слабом Android;
- внешний вид Honey Badger, лицо, борода, тело, катана и точность татуировок по утверждённому референсу.

Пока эти проверки не пройдены, этап 3 нельзя помечать завершённым.
