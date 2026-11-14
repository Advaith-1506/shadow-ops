# Shadow Ops

**Enter unseen. Leave together.** Shadow Ops is a cooperative multiplayer stealth game built for a **Theta Tau hackathon**. Assemble a team of **2–4 operatives**, combine four distinct abilities, infiltrate **Maple Row Safehouse**, recover the Diamond, and extract everyone before the facility locks down.

## The demo: Party Mode

One laptop becomes the shared mission screen. Up to four players scan its QR code and use their phones as controllers—no installation, accounts, webcam access, or Internet QR service required. The host screen uses **zero player slots**. A separate authorized display can mirror the same mission on another monitor.

A player can switch between **Controller Mode** and **Play on This Phone** during the mission while keeping their identity, role, and player slot. Desktop keyboard players and phone players can cooperate in the same room. Local keyboard co-op supports two, three or four players; the menu defaults to four.

## Start the game

Install **Node.js 22+** and npm, then:

```bash
git clone https://github.com/Advaith-1506/shadow-ops.git
cd shadow-ops
npm ci
npm run lan:host
```

Open **http://localhost:5173** on the laptop. The helper starts the frontend on **5173** and the authoritative WebSocket server on **8787**, and prints available LAN website addresses. No `.env` file is needed. If 5173 is already occupied, stop the other frontend first; the port is fixed so invites stay correct.

## Party Mode walkthrough

1. Connect the laptop and phones to the **same Wi-Fi or hotspot**.
2. On the laptop run `npm run lan:host`, open the website, and select **Host Game → Create Party Room**.
3. Check the **advertised laptop address**. The app prefers an ordinary LAN interface and offers detected addresses plus a manual correction field. A detected interface is a candidate, not proof that another device can reach it.
4. Show the large **QR code**, six-character room code, and full connection URL on the shared screen.
5. Each phone scans the QR with its normal camera app, opens the website, enters a nickname, chooses a role, and joins. The WebSocket endpoint derives automatically from the scanned hostname; phones do not connect to their own localhost.
6. Each player taps **Ready Up**. Choose a valid team: Duo = Hacker + Assassin; Trio = those two plus Scout OR Decoy; Full Squad = all four unique roles. Role changes reset Ready. The host and shared displays use no player slots.
7. The laptop host selects **Deploy Squad**. Move with the phone joystick, use **Interact**, and activate **Ability**. The laptop shows the entire Maple Row Safehouse and shared mission state.
8. The host can open **Shared Display** in another tab/window for an authorized, read-only view. That link has display-only access, never host privileges. Keep the host tab for lobby/start controls.
9. After success or failure, the host selects **Return to Lobby / Play Again**. The same connected players and roles remain; everyone readies again.

For a laptop keyboard player hosting instead, expand **Host and play with this keyboard instead**. That mode occupies one player slot, leaving room for three phone players.

## Full mobile gameplay

Select **Play on This Phone** in the lobby or **View Game on Phone** on the controller. The phone displays the fixed whole-level view, touch controls, alert/time/objective HUD, role cooldowns, and capture status. Use **Phone Controller** to return to the gamepad screen. Switching views clears active controls and uses the same socket and server-side actor.

Portrait remains usable; landscape provides a wider gamepad layout. Touch surfaces use pointer capture, independent pointers for movement/interact/ability, safe-area padding, and optional haptics where supported. Controller Mode skips Canvas rendering and receives UI updates at a reduced rate. Input is bounded to roughly 30 updates/second with idle heartbeats; stale input expires server-side after 250ms.

## Every selected role matters

The server generates a deterministic mission from the actual player roster and Maple Row's existing interaction anchors. That configuration, participant identities and role assignments remain fixed until the match ends. Hosts and read-only displays do not count as operatives.

| Team | Required roles | Mission variant |
| --- | --- | --- |
| Two | Hacker + Assassin | Operation Duo: credential, electronic key, cooperative terminal, vault, Diamond, extraction |
| Three | Hacker + Assassin + Scout | Operation Trio · Recon: also discover the hidden control network |
| Three | Hacker + Assassin + Decoy | Operation Trio · Distraction: also lure the sentry and release its relay |
| Four | Hacker + Assassin + Scout + Decoy | Operation Full Squad: every role objective is mandatory |

Duplicate roles and other combinations cannot deploy. The lobby explains missing roles, and the server independently validates the roster.

| Role | Mandatory contribution | Ability / cooldown |
| --- | --- | --- |
| **Assassin** | Stun the marked Garage security captain to recover BRAVO credentials. Ordinary key pickup cannot substitute. | Silent Takedown: actual guard within 62px and clear sight; stun 10s (captain's first credential takedown: 20s), cooldown 12s |
| **Hacker** | Interact with electronic ALPHA in the Kitchen, then operate the protected terminal after the team's role objectives. | System Override: camera within 100px suppressed 10s or side door within 65px unlocked; cooldown 16s. Use **Interact** for keys and terminals. |
| **Scout**, when selected | Pulse from the marked Garage recon zone to discover the hidden control node and unlock terminal authorization. This is an actual prerequisite. | Recon Pulse: zone radius 58px AND hidden node within 120px; discovery persists, hazard reveal lasts 6s; cooldown 18s |
| **Decoy**, when selected | Place noise in the marked Living Room zone after credential/key/recon objectives. The sentry must actually investigate and move clear; Hacker or Assassin then interacts at the checkpoint relay. | Noise Maker: nearby guards within 260px pathfind to noise; 5s normally, 12s for a valid checkpoint attempt; cooldown 16s |

Scout and Decoy objective markers appear only in missions containing those roles. Hidden-node discovery is never granted by ordinary Interact. The existing hazard scan, camera override, side-door hack and general-purpose distractions remain useful throughout the heist.

## Mission and teamwork

1. Infiltrate through the Garage. Assassin neutralizes the marked captain for BRAVO; Hacker activates ALPHA in the Kitchen. If Scout is selected, scan the Garage network from its marked zone. These initial tasks can happen concurrently.
2. With Decoy selected, complete those access objectives first. Decoy uses Ability at the Living Room noise zone and **moves away**. The intended sentry must use real investigation/pathfinding, travel at least 28px and clear the relay by 95px. During the visible **10-second opportunity**, Hacker or Assassin presses **Interact at the relay**. A chase or stun cancels the opportunity; let the patrol settle and retry after cooldown. Both teammates receive contribution credit.
3. Go to Security: **Hacker stands at TERMINAL and presses Interact. A different teammate stands on SUPPORT PAD and stays there.** All required role objectives must be complete. The helper does not interact with the terminal. Successful cooperation permanently disables cameras and lasers.
4. Interact with the vault lock in the Living Room. Enter the vault and recover the Diamond.
5. Bring **every fixed mission participant, alive, and the Diamond** to the front-yard extraction van. Carrying or depositing it counts; leaving someone behind never does.

Objectives show their required role, locked/available/in-progress/complete state and prerequisites. Shared displays and phone controllers show the same authoritative progress, short team notifications and role-specific next steps. Completion records include the operative, event and terminal/checkpoint helpers.

The Safehouse's existing walls, solid furniture, spawns, fixed whole-level camera and patrol routes are preserved. The new network node and relay are procedural markers on reachable floor along the infiltration route.

Guards still patrol, investigate, chase and capture; noise never overrides an active chase. Hold Interact near a captured teammate to revive them before the **20-second custody timer** expires. At **100% alert**, the mission fails. Following the team's latest main-branch update, **there is no mission deadline**; results use elapsed time. Takedowns provide a 10s opening (20s on the captain's first credential takedown). Main's alert recovery is retained: **3 points/second on ticks with no detection/contact alarm increase**. Cooldowns and patrol geometry remain intact.

## Controls and sessions

| Mode               | Move             | Interact / revive | Ability        |
| ------------------ | ---------------- | ----------------- | -------------- |
| Phone              | Virtual joystick | Interact button   | Ability button |
| Desktop LAN player | WASD or arrows   | E / Enter / Space | Q              |
| Local P1: Hacker   | WASD             | E                 | Q              |
| Local P2: Assassin | Arrows           | Enter / Space     | `/`            |

Escape pauses local play only. Network matches are governed by the server. Blur, hidden pages, cancellation, disconnect and view changes release active controls. Short taps are latched until the next input tick.

Accidental refresh/disconnect reserves a player's slot for **30 seconds** and freezes an active mission until the player returns. Private reconnect credentials rotate on successful resume and live in **sessionStorage** for the active browsing session; they never appear in player QR invites or broadcasts. Active duplicate tabs cannot take over a player's socket. Explicit **Leave** releases membership and fails an active mission; it is separate from refresh. A missing player exceeding the grace period fails the operation. Closing the host explicitly closes its Party Mode room.

## Networking and deliberate security

The game uses **React, Vite, Canvas 2D, Node.js and ws** with one **30Hz authoritative simulation per room**. Clients submit normalized button actions; the server owns movement, collisions, guard AI, cooldowns, role authorization, objective prerequisites, capture/revive, scoring and victory/defeat. Shared displays and mobile/desktop players receive the same authoritative snapshots.

Player, host-management and read-only display connections have distinct permissions. Public room codes identify rooms; they do not grant administrative rights. Display access requires a separate host-issued read-only capability. Strict message schemas, 2KiB message limits, rate limits, room/player/display caps, distance checks and rotating 256-bit credentials reject malformed messages, forged identity/coordinates/speed/score, and victory manipulation.

Default **HTTP/ws LAN traffic is unencrypted**. The server operator controls the simulation; protections do not defend against a malicious host. This is a trusted-LAN demo, not hardened Internet hosting. See [SECURITY.md](SECURITY.md).

## LAN troubleshooting

- Use `http://LAPTOP_WIFI_IP:5173/join/ROOMCODE`, not localhost, on phones. After scanning, no manual WebSocket entry is necessary.
- A manual code still needs the laptop website/server. It does not discover every laptop on Wi-Fi.
- Correct the advertised interface if a VPN or virtual adapter is selected. Disable a conflicting VPN for the demo if appropriate for your setup.
- Allow inbound **TCP 5173 and 8787** through the laptop firewall. Keep both processes running.
- Campus/guest networks can isolate clients. Put the laptop and all phones on the same personal/travel hotspot instead; confirm device-to-device access is allowed. The laptop must be reachable from the phones.
- Scanning a QR uses the phone's normal camera app; the website requests no camera permission. Clipboard/haptics depend on browser support; the visible URL is always a fallback.
- An expired/full room or unavailable host produces an error. Return to the join screen and use a fresh host invitation.

Manual process startup and production frontend checks:

```bash
npm run dev           # frontend, port 5173
npm run lan:server    # separate terminal, port 8787
npm run build
npm run preview -- --port 5173  # use alongside lan:server
```

## Architecture and development

| Module                                        | Responsibility                                                                          |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| `server/roomServer.js`                        | Rooms, host/display/player permissions, rotating sessions, rate limits, 30Hz simulation |
| `server/lanAddresses.js`                      | LAN interface candidates and preference                                                 |
| `src/lib/game/levels/safehouse.js`            | Maple Row Safehouse geometry, rooms, spawns and mission placements                      |
| `src/lib/game/mapData.js`                     | Active level adapter used by simulation and rendering                                   |
| `src/lib/game/mission.js`, `roles.js`         | Role abilities, mission rules, progress and measured contributions                      |
| `src/lib/game/entityLogic.js`, `guardNav.js`  | Guard patrol/chase/investigation, camera and laser behavior                             |
| `src/lib/game/playerLogic.js`, `collision.js` | Authoritative movement and collisions                                                   |
| `src/hooks/useLanMultiplayer.js`              | Session recovery, lobby protocol, input pump, view switching                            |
| `src/hooks/useGameRuntime.js`                 | Local simulation, fixed whole-level camera and rendering                                |
| `src/lib/party/`                              | Invite validation, session storage and independent multitouch input model               |
| `src/components/game/`                        | Party QR lobby, role cards, dedicated controller, HUD overlays and results              |

```bash
npm run test:run
npm run lint
npm run assets:audit
npm run build
```

Tests include the original regressions plus QR/endpoint validation, controller input/release, four-player capacity, unique/duplicate roles, Decoy pathfinding, full mission progression, private player/host resume, unauthorized display actions, and shared snapshot consistency. CI runs tests, lint and build. See [QA.md](QA.md) for evidence, limitations and the physical-phone checklist.

Web builds use root-relative assets so `/join/ROOM` and `/display/ROOM` work on refresh. `npm run build:native` retains relative assets for file-based native packaging; desktop/mobile packaging scripts select that mode.

Electron and Capacitor scaffolding remains in the repository with Shadow Ops display names. Desktop packaging uses the shared server, but native releases are not validated in this upgrade. Party Mode phone joining requires a reachable web frontend, even when an Electron process hosts the socket server.

## Future gesture controls

`src/lib/game/input.js` provides `registerInputProvider(name, provider)` for optional boolean movement/interact/ability events. Keyboard and touch remain available, and all LAN actions still pass server validation. No OpenCV, MediaPipe or webcam permission is required today.

## Resource inventory and original artwork

Unused imported resources have been removed, and the pause and result screens use original CSS tactical artwork. Used gameplay sprites and required native resources remain intact. [ASSET_AUDIT.md](docs/ASSET_AUDIT.md) documents every disposition, retained-resource replacement opportunities and size measurements; `npm run assets:audit` checks import/manifest integrity. Required upstream notices remain below.

## License and notices

Distributed under the **MIT License**. Required copyright notices are preserved in [LICENSE](LICENSE); imported code, assets and dependency acknowledgments are documented in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Published history is retained. GitHub may show an older commit beside files that have not changed since that commit; cosmetic history rewrites are not used to hide provenance.
