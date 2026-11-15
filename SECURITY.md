# Shadow Ops security architecture

## Authoritative simulation

One Node.js/ws process runs each room's simulation at a fixed 30Hz. Clients submit booleans, never dt, coordinates, speed, scores or mission outcomes. Movement normalization, collisions, world bounds, role restrictions, interaction distance/line of sight, ability cooldowns, mission prerequisites, capture/revive, score and team extraction are server-owned. The browser hosting the party does not run a second simulation. Local keyboard co-op runs in the browser and has no anti-cheat boundary.

This protects an honest server against dishonest clients. It does **not** protect against a malicious server operator who can change the simulation, inspect tokens, stop the process or alter time. HTTP/ws LAN traffic is unencrypted.

## Three connection types

| Session    | Authority                                                                                                | Capacity                                     |
| ---------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Player     | Input for its bound actor; own role/ready changes in lobby; explicit leave                               | 2–4 players; one active socket per actor     |
| Party host | Create/manage room, start after all ready, return ended mission to lobby, authorize displays, close room | Uses zero player slots                       |
| Display    | Receive roster and snapshots; leave display session                                                      | Up to four extra displays; zero player slots |

Legacy desktop host-as-player remains supported: its currently authenticated player socket owns host permissions, and hosting consumes one player slot. When that host permanently leaves or its lobby reservation expires, host permission can pass to another player. Party host authority is never transferred to public phone or display sessions.

Display joins require a separate cryptographically random read-only capability issued privately to the authorized host. Its link places that capability in the URL fragment. It grants no movement, ability, role, ready, start or reset permissions. Anyone given the display link can view the room until it closes, so share it intentionally. It is not a player/host reconnect credential. At most four extra displays connect. Player QR invitations contain only a reachable website hostname and room code—never host, player or display credentials.

Room codes are discoverable convenience identifiers, **not authentication secrets**. They allow joining an open lobby, not taking over an existing actor or becoming Party Mode administrator. Multiple independent clients may join legitimately; the system does not offer account identity or prevent all Sybil behavior.

## Schemas, rate limits and anti-cheat

`validateMessage` rejects non-object/malformed JSON, unknown actions/fields, invalid types, malformed room codes/tokens, unknown roles and invalid nicknames. Nicknames are bounded to 20 characters, exclude control characters and angle brackets, and render through React/Canvas text. The server binds session kind, room and actor identity to the socket. Claimed player IDs and arbitrary state have no accepted schema.

- Maximum incoming payload: **2KiB**; oversized frames close through ws.
- Rate limit: **80 messages per one-second fixed window per socket**; excess closes with 1008.
- Room limit: **100**; player limit: **4**; extra-display limit: **4** per room.
- Stale inputs expire after **250ms**. Input packets do not advance simulation time.
- Outgoing snapshots are skipped when socket buffering exceeds 1MB.
- Only the authenticated host starts/resets; all players must be connected/ready with unique roles: Duo Hacker + Assassin; Trio adds Scout or Decoy; Full Squad requires all four. Role changes clear ready status.
- A display or slot-free host sending player actions is rejected. A client cannot declare victory, set score, bypass vault requirements or nominate a remote Decoy position. Decoy noise spawns at the authoritative player position and guards choose valid investigation behavior server-side; a live chase takes priority.

These controls mitigate ordinary action abuse, not distributed denial of service. There is no per-IP connection quota, Internet account service or fog-of-war enforcement. Full snapshots expose world/enemy information to modified clients.

## Refresh, reconnect and duplicate tabs

Player and Party host credentials use `crypto.randomBytes(32)` and rotate on every successful attach/resume. Credentials are returned only to their owning socket; rosters/snapshots exclude them. Only a disconnected socket with the current unexpired credential can resume. A token cannot displace an active socket, and replaying an old rotated token is rejected.

The browser stores reconnect metadata in **sessionStorage** so refresh can restore the actor, role and mode. It is scoped to the active browsing session and origin, not localStorage. Client metadata is ignored after 30 minutes; server authorization is stricter: the disconnected session is resumable for **30 seconds** only. Blocking sessionStorage degrades refresh recovery but live in-memory reconnect remains possible. Explicit leave clears the saved session and differs from pagehide/accidental disconnect. Duplicate tabs cannot control the same active actor. Possession of a valid private credential remains the security boundary.

WebSocket ping/pong heartbeats detect half-open connections (up to roughly 10 seconds); stale movement still stops after 250ms. During a missing player's 30-second grace, the entire active mission freezes, input is zeroed and the actor is reserved. Exceeding grace or explicitly leaving fails the mission rather than relaxing full-team extraction. Lobby reservations also survive refresh for 30 seconds and then expire. The Party host can reconnect independently without reserving an actor. Closing a Party host explicitly closes its room. A server restart loses all in-memory rooms and sessions.

Controller input releases on blur, hidden pages, pointer cancellation, disconnect, unmount and view changes; the server timeout is a second line of defense. Changing controller/full-game views uses the same connection and actor, without resending a join.

## Trusted-LAN deployment limitations

Default HTTP/ws does not encrypt tokens or game state. A network observer or malicious same-origin script may steal credentials; sessionStorage is not protection against XSS. Do not expose these development servers to the Internet. Untrusted networks require HTTPS/WSS, suitable origin allowlists, authentication, per-IP connection limits, firewall/proxy rules, monitoring and a dependency review. The QR endpoint derives from the scanned hostname; LAN candidates can be manually corrected because interface detection cannot prove cross-device reachability.

Private credentials are not deliberately logged. Do not add raw message logging. Display fragments may remain in browser history; they grant read access until room closure. The public player QR has no such capability. Packaged native builds, public/TLS deployment and physical-device behavior require their own validation. Inherited dependency advisories remain documented in [QA.md](QA.md).

## Verification and reporting

Run `npm run test:run`. Tests exercise actual WebSocket host, display and four-player connections, unauthorized actions, token isolation/rotation, duplicate-controller rejection, refresh/lobby reservation, authoritative state consistency, Decoy behavior and existing mission/ability restrictions. Unit tests cover normalized multitouch input, release safety, short taps, invite construction and session storage. See [QA.md](QA.md) for browser evidence and the manual device checklist.

Report issues in this repository without active credentials or private data. Required upstream and dependency acknowledgments remain in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [LICENSE](LICENSE).

## Dynamic mission authority

The server calls the shared deterministic mission generator at deployment. Its deeply frozen configuration fixes map anchors, participants, role ownership, objective conditions and dependency edges for the match. Mutable objective progress comes only from simulation events, and the same configuration/progress is broadcast to players and authorized displays. Reconnection resumes the existing actor and mission; it cannot regenerate objectives or change a role mid-match.

Assassin credentials require a real, in-range, line-of-sight captain takedown and available cooldown. Both shared keys accept any assigned operative through range/LOS-validated Interact, with idempotent pickup and no client inventory writes. The assigned Hacker must separately open the designated electronic door and override the designated camera network using in-range System Override; completion follows actual persistent door/network state changes. The protected terminal still requires Hacker. Scout discovery requires the assigned Scout's fresh pulse, proximity to the recon zone and the hidden node's detection radius. A Decoy checkpoint requires noise placed at the authoritative actor position in the active zone, prerequisite completion, the intended guard's actual investigation/path movement and clearance, and a separate Hacker/Assassin relay interaction during the window. Stuns and chases cannot substitute for investigation. The terminal additionally requires a live different-role helper on the support pad. Vault/extraction recheck the fixed roster and all required role contributions.

Objective records include status, prerequisites, visibility, completion condition, timestamp and contributors. There is no accepted `objective_complete`, discovery, guard-state, mission-config or win packet. Full snapshots still expose world/config information to modified clients: hidden presentation is not cryptographic fog of war. Knowing a hidden node location does not satisfy the server's Scout event requirement.
