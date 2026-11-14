# Shadow Ops quality and validation

Validation date: November 14, 2026. Party Mode work stays on `feature/mobile-party-multiplayer` and is proposed through a pull request; it is not merged automatically.

## Baselines

- Before the Party Mode upgrade: **45 tests passed** across six suites; production frontend built successfully.
- Integrated concurrent `main` changes adding four-player local keyboard co-op. The menu defaults to four local players and supports choosing two or three; P3/P4 controls are preserved and local P4 uses the new Decoy role.
- Baseline lint could not load its configuration because a JavaScript flat config was named `eslint.config.json`. The feature branch renames it to `eslint.config.js` and adds the lint command to CI.
- Original import provenance, asset review and mandatory notices are retained in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [LICENSE](LICENSE). Branding changes do not rewrite published history.

## Automated Party Mode checks

The expanded suite has **83 tests** across nine suites, preserving every existing test. It covers:

- Party host uses no player slot; four named players can select four roles and join one room; a fifth is rejected.
- Authorized shared display receives the same state; unauthorized display credentials and movement/ability/role/ready/start/reset actions are rejected.
- Ordinary phone joins never receive Party host permissions; duplicates of permitted roles remain usable.
- Player and host refresh recovery, reserved lobby slots, private token rotation, active duplicate-tab rejection, reconnect freeze/resume and expiry.
- Strict action schemas, malicious coordinates/identity/state/outcome payloads, malformed nicknames/room codes, rate limiting, and authoritative movement from original regression tests.
- LAN interface ordering, invite construction, localhost/invalid-address rejection, new/legacy join parsing and endpoint derivation from the phone's hostname.
- Joystick displacement limits, original boolean movement model, independent movement/interact/ability pointers, release/cancellation, blur/visibility/unmount cleanup, short taps, bounded input updates and idle heartbeats.
- Decoy creates one cooldown-limited server-side noise, guards pathfind toward it, expiry restores patrol, and an active chase keeps priority.
- Existing Assassin/Hacker/Scout abilities, wall/range restrictions, mission sequence, Hacker + different-role support requirement, vault/artifact prerequisites, capture/revival, and full-team extraction/victory.
- Session storage recovery, mode preference persistence and storage-unavailable fallback.

Commands:

```bash
npm run test:run
npm run lint
npm run build
```

Socket tests require ephemeral loopback ports. Tests simulate multiple clients on one machine; this is not proof of physical Wi-Fi behavior.

The main-menu launch also has server-rendered regression coverage for the default and selected local-player count. ESLint checks undefined variables in game components.

## Browser smoke test performed

Used the actual frontend and backend with **one slot-free host, one separately authorized shared display, and four player browser clients**:

- Created a Party room; observed a locally generated QR, reachable LAN URL, room code, interface controls and all four empty slots.
- Opened the advertised `/join/ROOM` URL; the player endpoint correctly used the laptop's hostname instead of localhost. Entered four nicknames and selected Hacker, Assassin, Scout and Decoy.
- Refreshed a player in the lobby and observed the same nickname, role and player slot restored.
- Readied all four clients, observed the host's roster and enabled deployment, and started a synchronized mission.
- Observed the entire world on the shared display, with guards, objective markers and role-colored names; phones used the dedicated controller.
- Activated Decoy with a touch-style pointer hold and observed the authoritative cooldown and measured contribution. Found and fixed a dropped short-tap edge; a subsequent quick click correctly activated the ability.
- Switched a live player from controller to game Canvas and back without a new join or actor. Phone/keyboard movement, joystick release, capture timer, alarm, synchronized defeat, host-only return to lobby and subsequent rematch were exercised.
- Tested controller/join layouts at **390×844**, **412×915**, and **844×390**, plus desktop-size hidden clients. Actual browser viewport inspection confirmed the intended dimensions; screenshots were inspected using the browser screenshot API.
- Checked host/controller browser error logs: no errors during the final check. Temporary viewport overrides were reset and extra test clients closed.

This is a gameplay smoke test, not a full manual victory run. The complete cooperative terminal-to-extraction sequence is verified by automated simulation tests, including Hacker + Decoy terminal cooperation. Physical multi-touch, iOS Safari/Android Chrome engines, haptic motors and scanning the QR with an actual phone camera were **not** available.

## Physical phone checklist before judging

1. Connect laptop and four physical phones to the same unrestricted Wi-Fi/hotspot. Start `npm run lan:host`; confirm laptop Wi-Fi address and inbound TCP 5173/8787.
2. Create Party Mode; scan the QR on iOS Safari and Android Chrome. Confirm room code/endpoint prefill, readable roles, nicknames and all four slots.
3. Try all four roles, then a duplicate role. Check ready cancellation on role changes and host-only deployment.
4. Hold movement while pressing Interact and Ability with other fingers. Release each independently. Drag outside controls, cancel a touch, rotate, lock the phone and switch tabs. Confirm no stuck movement.
5. Trigger Decoy away from the team; watch a nearby patrol investigate and then resume. Confirm a chasing guard ignores the distraction. Test Assassin stun, Hacker device suppression and Scout pulse.
6. Switch Controller ↔ Play on This Phone during play; verify no extra actor, stable name/role, own-character camera and overview.
7. Refresh during lobby and mission; return within 30 seconds. Test a duplicated tab, a phone disconnection, expiry, host refresh, and a separate read-only display.
8. Complete both keys, Hacker + different-role support interaction, vault, artifact and all-player extraction. Verify notifications, support occupancy, role cooldowns and capture/revive feedback.
9. Return to lobby and replay with the same squad. Test full/closed/invalid room messages and manual URL/code fallback. Confirm copy-link and haptics support/fallback on target phones.
10. Rehearse on the actual judging network. If campus Wi-Fi isolates clients, use a hotspot with device-to-device connectivity.

Web production builds use root-relative assets for nested join/display URLs; native packaging selects a separate relative-assets build mode to preserve file-based loading.

## Branding and attribution review

- GitHub About text matches the requested Shadow Ops description.
- README leads with Shadow Ops, Theta Tau, four-player cooperation, networking, security and phone controllers. Redundant upstream references were moved out of promotional sections.
- Package description/repository metadata, web title, main menu, Electron title, Capacitor name and Android/iOS display names use Shadow Ops.
- Native application identifiers and inherited asset paths remain stable for compatibility; provenance headers and imported asset documentation remain intact.
- `LICENSE` is byte-for-byte unchanged. The notices file records the upstream source/revision, copyright, original asset-pack descriptions, retained metadata and reviewed dependency license examples.
- No credentials, `.env` files, dependency directories, coverage, web build output or release installers are tracked. Future commits describe actual changes; no force-push/history rewrite is used.

## Limitations

- Four physical phones over Wi-Fi, real QR scanning, hardware multi-touch/haptics, mobile browser engines and firewall/router behavior remain unverified.
- Full manual mission completion remains unverified; automated mission progression/victory tests pass.
- Clipboard write may be unavailable on insecure HTTP; the selectable URL is the fallback. Haptic feedback is optional and unsupported on some browsers.
- Automatic LAN selection is a ranked candidate and may need correction for VPNs, virtual interfaces, hotspots or isolated networks.
- No interpolation/prediction/rollback was added. Canvas clients render server snapshots; latency and full-world legibility on large displays should be checked on judging hardware. Controller mode does not draw the world.
- Native Electron installers and Android/iOS packages are inherited scaffolding and were not built or device-tested. Native names were updated without migrating bundle identifiers.
- HTTP/ws is unencrypted; this is a trusted-LAN project. No protection against a malicious host, Internet DoS or client-side extra world visualization is claimed.
- Existing dependency advisories remain: the previous compatible patch pass left two moderate production React Router advisories and additional inherited development/native-tooling advisories. No unrelated major framework migration was attempted. Run `npm audit` for current results.

## Resource cleanup validation

The audit starts from merged main `1ee69d1`, already containing both teams' player additions. A fresh fetch/merge reported no conflicts; P3/P4 local controls remain intact. The pre-cleanup baseline passed all 83 tests and the production build.

Removed 98 unused files and replaced three used pause/result raster assets with original CSS artwork. Retained 34 runtime resources/metadata, three original pack documents, a pruned subset manifest and 42 native resources/configurations. See `docs/ASSET_AUDIT.md` and `docs/asset-audit.json` for per-file evidence and accurate size accounting. Required notices and LICENSE remain intact. New artwork changes presentation only; native graphics and gameplay sprite/frame contracts are unchanged.

Validation commands: `npm run assets:audit`, `npm run test:run`, `npm run lint`, `npm run build`. Native packaging and physical phones remain outside this resource-cleanup verification. UI preview fixtures used for pause/win/loss inspection are presentation samples, not a claim of manual mission completion.

Browser checks after cleanup: inspected pause/success/failure CSS previews, launched four-player local gameplay with retained sprites, and exercised live pause/resume. Browser error logs were empty. Temporary visual fixtures were removed before commit. These checks do not claim a full manual mission victory or native-device validation.
