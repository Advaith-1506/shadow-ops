# Shadow Ops

A cooperative stealth operation for **2–4 players**, customized for a **Theta Tau hackathon** from [NandhuRajRK/MuseumBridge](https://github.com/NandhuRajRK/MuseumBridge). Inspired by the top-down stealth of Hunter Assassin: infiltrate a guarded facility, recover the Crown Jewel, and extract the entire team.

## Run locally

Use **Node.js 22+** and npm. From a fresh clone:

```bash
git clone https://github.com/Advaith-1506/shadow-ops.git
cd shadow-ops
npm ci
npm run lan:host
```

Open **http://localhost:5173**. The helper starts Vite on port 5173 and the WebSocket game server on port 8787. The terminal prints the server's available LAN address. No environment file or account is required to play.

Choose **Local Co-op** for two players on one keyboard, or **Assemble Squad** for network play. Local play uses the same mission and simulation with a Hacker and Assassin.

## LAN multiplayer

1. Connect all laptops to the same Wi-Fi network. On the hosting laptop run `npm run lan:host`.
2. Other laptops open `http://HOST_LAN_IP:5173` in a browser. Substitute the hosting laptop's Wi-Fi IPv4 address; do not use `localhost` on joining devices. If a VPN address is printed, use the Wi-Fi address instead.
3. In **Assemble Squad**, use `ws://HOST_LAN_IP:8787` as the server address. Hosting via localhost is also supported. The default address uses the website's hostname.
4. Host creates a room and shares its six-character code or invite URL. Other players join using that code.
5. Each player chooses **Assassin**, **Hacker**, or **Scout**, then selects **Ready Up**. Changing roles revokes ready status.
6. The host selects **Deploy Squad** after everyone is ready. A Hacker and at least one different role are required. Four-player teams can duplicate roles.

The room finder lists rooms **on the entered server**, not all computers on the network. The invite link uses the entered server hostname: if the host used localhost, replace localhost with its Wi-Fi address before sharing. Allow inbound TCP ports **5173 and 8787** in the host firewall. Guest-network/client isolation can prevent connections.

Both servers bind to all interfaces. Use a trusted LAN; this is not an Internet hosting configuration. The frontend alone does not run network matches. For production frontend verification:

```bash
npm run build
npm run preview -- --port 5173
# In a second terminal:
npm run lan:server
```

## Mission

1. Infiltrate through the south courtyard and lobby.
2. Collect **ALPHA** in Gallery A and **BRAVO** in Gallery B. Any role can collect either key; collection is shared.
3. A **Hacker** interacts with the blue lobby security terminal while a teammate with a **different role** stands on the purple support pad. Both keys must already be collected. This permanently disables cameras and lasers.
4. Interact with the vault lock at its north entrance to open the vault.
5. Collect the **Crown Jewel** inside.
6. Bring **every player and the artifact** to the extraction van in the south courtyard. Carrying the artifact or depositing it at the van satisfies the artifact requirement.

The HUD shows mission progress, the alert meter, remaining time, role cooldowns, extraction status, and an overview map. Keys are green, terminal blue, vault gold, players purple, and extraction white. Cover blocks enemy vision. Detection and laser contact increase alert. Guards can capture players; hold interact nearby to revive them before their 20-second custody timer expires. A ten-minute deadline or 100% alert causes lockdown.

## Roles and controls

| Role     | Ability                                                                               | Duration                             | Cooldown   |
| -------- | ------------------------------------------------------------------------------------- | ------------------------------------ | ---------- |
| Assassin | Incapacitate a guard within 62 world pixels, with clear line of sight                 | 5 seconds                            | 12 seconds |
| Hacker   | Disable a camera within 100 pixels, or unlock a designated side door within 65 pixels | Camera: 10 seconds; door: persistent | 16 seconds |
| Scout    | Highlight nearby guards, cameras, and active laser origins within 360 pixels          | 6 seconds                            | 18 seconds |

Abilities share a per-player cooldown; a Hacker can affect a nearby camera and side door in the same activation. Failed out-of-range activations consume no cooldown. Main terminal interactions use **E**, not the ability key. The vault cannot be bypassed by a Hacker ability.

| Mode               | Movement           | Interact / revive  | Ability |
| ------------------ | ------------------ | ------------------ | ------- |
| LAN: each player   | WASD or arrow keys | E, Enter, or Space | Q       |
| Local P1: Hacker   | WASD               | E                  | Q       |
| Local P2: Assassin | Arrows             | Enter or Space     | `/`     |

Touch devices have a joystick, ACT, and Q button. **Escape** pauses local play only. LAN simulation continues while tabs are unfocused; stale movement inputs expire after 250ms. A lost connection freezes the entire mission for a **30-second reconnect window**. Automatic reconnection works while the page remains open. Reloading loses the in-memory private reconnect token. A teammate leaving deliberately, or exceeding the reconnect window, fails the operation. Restart from the menu to create a new room.

## Architecture and retained systems

- **React 18 + Vite 6**: menu, lobby, briefing, results, and runtime hooks.
- **Canvas 2D**: existing tile and sprite assets, camera, world renderer, tactical HUD.
- **Custom simulation**: original top-down movement, collision resolution, guard patrol/chase AI, line-of-sight cones, cameras, lasers, pressure plates, doors, revive/custody, and map geometry.
- **Pathfinding**: existing A\* guard navigation.
- **Node.js + ws**: existing WebSocket transport, upgraded from host input replay to a **server-authoritative fixed 30Hz simulation**. Clients send buttons and receive complete state snapshots. Guards, abilities, mission state, players, and final scores come from one simulation, avoiding replay drift.
- **Vitest**: original regression suites plus mission and actual socket integration tests.
- **Electron / Capacitor**: inherited desktop and mobile scaffolding. Electron uses the shared room server. Installers and native mobile builds are not validated in this customization.

Key modules:

| Path                                          | Responsibility                                                    |
| --------------------------------------------- | ----------------------------------------------------------------- |
| `src/lib/game/mission.js`                     | Role rules, shared objectives, interactions and cooldowns         |
| `src/lib/game/gameLoop.js`                    | Original simulation orchestration and win/loss checks             |
| `src/lib/game/playerLogic.js`, `collision.js` | Server-owned speed and collision resolution                       |
| `src/lib/game/entityLogic.js`, `guardNav.js`  | Guard AI, camera/laser detection, pathfinding                     |
| `src/lib/game/mapData.js`                     | Original facility geometry and map entities                       |
| `src/lib/game/input.js`                       | Keyboard/touch input and future input-provider adapter            |
| `src/hooks/useLanMultiplayer.js`              | Lobby protocol and private in-memory reconnection                 |
| `src/hooks/useGameRuntime.js`                 | Rendering and local/server runtime routing                        |
| `server/roomServer.js`                        | Validated room/session protocol, server simulation, rate limiting |
| `server/lan-server.js`                        | LAN server entry point                                            |

## Deliberate security measure

The authoritative server accepts only strict, validated input and lobby messages. It rejects client-supplied coordinates, speed, scores, player IDs, mission state, frame replays, and victory declarations. It enforces role restrictions, interaction distance and line of sight, objective prerequisites, cooldowns, connected ready rosters, host-only starts, room capacity, and one membership per socket. Input spam cannot advance simulation time. Each socket is limited to 80 messages/second and a 2KiB payload; room count is bounded. Private cryptographic 256-bit session tokens rotate on reconnection and never appear in roster/state broadcasts.

See [SECURITY.md](SECURITY.md) for the trust boundary, threat model, and limitations. The server operator controls the simulation; this does **not** protect against a malicious host.

## Validation

```bash
npm run test:run   # Original + mission + real WebSocket tests, with coverage
npm run build     # Production frontend
```

Socket tests need permission to bind ephemeral loopback ports. The suite covers room creation/joining/capacity, duplicate joins, roles/ready/start permissions, movement limits, mission progression, role cooperation, collision/interaction restrictions, cooldowns, win/loss, guard behavior, malformed/forged actions, spam limits, snapshot synchronization, token privacy, and reconnection. Two browser clients were also exercised for lobby, ready-up, deployment, movement, guard capture, and synchronized loss. Full manual mission completion and two-physical-laptop LAN testing remain unverified. See [QA.md](QA.md).

## Future OpenCV / MediaPipe input

Keyboard input is processed in `src/lib/game/input.js`. A future optional webcam bridge can register a provider returning boolean actions:

```js
import { registerInputProvider } from "./src/lib/game/input.js";
const removeProvider = registerInputProvider("webcam", () => ({
  up: false,
  down: false,
  left: false,
  right: false,
  interact: false,
  ability: false,
}));
// Later: removeProvider();
```

Providers merge with existing keyboard and touch input. They cannot provide coordinates, scores, or mission state; LAN actions still pass server validation. No camera access, OpenCV runtime, or MediaPipe dependency is required or requested today.

## Attribution and license

Based on **MuseumBridge / Museum Break** by **NandhuRajRK and Museum Break Contributors**: https://github.com/NandhuRajRK/MuseumBridge. Original imported revision: `16fabb1` (see `QA.md` for the full source revision). The original **MIT License** and `Copyright (c) 2026 Museum Break Contributors` remain unchanged in [LICENSE](LICENSE). Original game code, map, sprite packs, and asset documentation are retained under the upstream distribution; no new third-party art was added. Shadow Ops customization is distributed under the same MIT license.

The new repository has a clean import commit followed by customization commits. `origin` targets Shadow Ops. The original repository is retained as `upstream` with its push URL disabled.
