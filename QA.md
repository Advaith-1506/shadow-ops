# Shadow Ops validation record

Date: November 14, 2026.

Original source: `https://github.com/NandhuRajRK/MuseumBridge`, revision `16fabb198c95b264fa6709f72fc3a221dfbc7d09`.

## Baseline before customization

- `npm ci`: installed the original locked dependency tree.
- `npm run test:run`: all 19 original tests passed.
- `npm run build`: passed.
- Started original Vite frontend and WebSocket backend. Launched a local game in the browser and observed its canvas, timer, HUD, sprites, and controls.

## Shadow Ops

- `npm run test:run`: **45 tests passed** across six suites, including original regressions, mission tests, and real WebSocket integration tests.
- Room creation, joins, full/started/unknown room rejection, duplicate membership, role selection, ready-up, host-only start, and role composition.
- Strict schemas, forged identity/speed/state/win messages, malformed JSON, action spam, authoritative movement, and identical snapshots across two clients.
- Private reconnect token isolation/rotation, invalid-token rejection, mission freeze, successful resume, and timeout loss.
- Both access keys, role-dependent cooperative security terminal, vault prerequisites, line-of-sight interaction restrictions, artifact pickup, all-player extraction, carried-artifact score, cooldowns, scanning, camera suppression, stuns, revival, and time/alert losses.
- Original guard AI, collision and gameplay regression tests remain included.
- Production frontend build passes.
- Two browser clients: host room creation, second-client joining via room URL, roster display, role display, synchronized ready-up, host deployment, synchronized gameplay timer/state, keyboard movement, guard patrol/detection/capture, and synchronized game-over screen. No browser console errors during the final browser check.
- Responsive menu/lobby/game observed at narrow and desktop viewport sizes. Touch ACT and ability controls render. Actual touch hardware was not available.

## Dependency audit

Applied `npm audit fix` without `--force` to update compatible dependency versions, including the WebSocket server dependency. After patches, `npm audit --omit=dev` reports **2 moderate advisories** (React Router packages), with zero high/critical production advisories. The full dependency tree still reports advisories requiring major upgrades, particularly Electron/installer and test tooling, plus React Router. These were not force-upgraded during gameplay customization. Inspect the current tree with `npm audit` and `npm audit --omit=dev`; counts may change as advisories evolve. This is a trusted-LAN hackathon build, not a hardened Internet service or validated native release.

## Not verified

- Two separate physical laptops over Wi-Fi, firewall configuration, router client isolation, or VPN routing.
- Full manual objective-to-extraction mission completion in the browser. Automated tests exercise the complete mission sequence and the simulation's final victory check.
- Native Electron installers, Android/iOS builds, real touch devices, or webcam gestures.
- Internet/TLS hosting, load testing, or resilience against a malicious server operator.

No credentials, `.env` files, dependencies, generated coverage, web build output, or release installers are tracked. The original MIT license and copyright notice are preserved.
