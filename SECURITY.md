# Shadow Ops security design

## Authority and threat model

For LAN matches, the Node.js WebSocket server runs the original game simulation at a fixed 30Hz. The browser hosting the lobby is a normal client with permission to start the match; it cannot submit simulation state. Local keyboard co-op runs in the browser and provides no anti-cheat boundary. Electron uses the same shared server implementation as the CLI.

The deliberate security measure is server-side action validation. It protects an honest server against clients attempting to move too fast, impersonate other players, bypass objectives/cooldowns, assign scores, or declare victory. It does **not** protect against an operator modifying the server or inspecting its memory. A malicious host controls the authoritative simulation.

## Input and simulation validation

`server/roomServer.js::validateMessage` implements explicit runtime schemas and an action allowlist. Non-object JSON, malformed JSON, unknown actions/fields, invalid roles, wrong boolean types, malformed room codes/tokens, and unexpected identity or state fields are rejected. Frames, positions, speed, scores, and mission-complete messages have no accepted schema. The WebSocket maximum payload is 2KiB. Oversized frames are closed by ws.

The server associates the socket with its room and player and verifies that the currently registered socket owns that membership. Clients never select an acting player ID. One socket cannot create/join multiple rooms. Full/started/unknown rooms are rejected. Only the room host starts, with 2–4 connected ready players, a Hacker, and a different role. Role changes clear ready status.

Only directional booleans, interaction, and ability buttons reach simulation. The server supplies dt=1/30; input packets do not cause extra ticks. Movement speed, diagonal normalization, collision, and world bounds are computed in `playerLogic.js`. Inputs expire after 250ms without refresh. Ability cooldowns and distances, role restrictions, line-of-sight checks against walls, key prerequisites, the cooperative terminal requirement, vault lock, and all-player extraction are evaluated by the simulation. Final scores and win/loss screens derive exclusively from server state.

Each socket is limited to 80 messages in a one-second fixed window. Excess traffic receives an error and closes with 1008. WebSocket buffering is bounded before sending snapshots; slow consumers skip outgoing frames. At most 100 rooms exist. These limits mitigate ordinary action spam, not distributed denial of service. There is no per-IP connection limit, account authentication, or public matchmaking service.

## Reconnection and identity

Initial join and successful resume return a private 32-byte cryptographic token (Node crypto.randomBytes). It is sent only to that player's socket and stored in browser memory. Public roster and simulation objects never contain tokens. Disconnected members retain their place for 30 seconds; their input clears immediately and the mission freezes. Only a disconnected session with its matching unexpired token can resume, and each success rotates the token. An active socket cannot be displaced by a token replay. Invalid, expired, or unknown tokens are rejected. Page reloads do not preserve the token. A disconnect exceeding the grace period, or an explicit leave, fails an active mission rather than relaxing extraction requirements.

Room codes are cryptographically random convenience identifiers, **not passwords**. Rooms are discoverable on the server. Anyone on the network who learns the room code can join an open lobby. A player can create multiple independent clients; the protocol prevents duplicate membership on one socket, not Sybil identities across sockets.

## Transport and deployment limitations

Development LAN traffic uses plain HTTP and ws. A network observer can read state and session tokens; do not use this configuration on an untrusted network or expose it to the Internet. For Internet hosting, add HTTPS/WSS, allowed-origin checks, firewall/proxy rules, per-IP connection limits, authentication, persistent monitoring, and a dependency/security review. Snapshot delivery reveals the full map and enemy state to clients, so modified clients can render extra information. This is not fog-of-war enforcement.

The host can stop the process, alter time/state, or inspect private tokens. Reconnection does not survive a server restart; state is in memory. Tokens are never committed to disk or included in logs by this implementation. Avoid adding raw message logging.

Inherited dependencies include older desktop/mobile tooling. npm audit reports known advisories in the inherited tree; see QA.md. Automated tests cover gameplay validation, not the security of all upstream packages. Electron/mobile release packaging and Internet deployment require separate verification.

## Verification and reporting

Run `npm run test:run`. `tests/integration/rooms.test.js` uses actual WebSocket clients for identity, schemas, state forgery, room restrictions, rate limiting, movement, token isolation, and reconnect tests. `tests/unit/mission.test.js` covers range/line-of-sight, prerequisites, cooldowns, role cooperation, and extraction. Report issues through this repository's GitHub issues without including active tokens or private credentials.
