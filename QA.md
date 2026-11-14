# Shadow Ops quality and validation

Dynamic cooperative missions are developed on `feature/dynamic-coop-missions`, based on Maple Row Safehouse and the merged Party Mode work. This feature is proposed through a pull request; it is not merged automatically.

## Gameplay audit

The previous mission let any role collect both loose keys and finish with Hacker plus any different-role helper. Scout scanning and Decoy noise did not gate victory. The previous route test froze all guards and used duplicate roles, so it did not prove live cooperative completion.

The replacement configuration fixes the participating actors, unique roles, map anchors and objective graph at deployment. Credentials require the Assassin's actual captain takedown; electronic ALPHA requires Hacker interaction. Selected Scout and Decoy objectives are mandatory dependencies of security, vault and extraction. Source events record contributors, including terminal support and both checkpoint participants. Legacy key/security flags alone cannot bypass these gates.

Only mission metadata and procedural objective markers were added to the Safehouse. Walls, props, spawns, patrol routes and fixed whole-level framing are retained. Scout's Garage network discovery and Decoy's Living Room sentry/relay sit along the infiltration route rather than requiring separate remote errands. Existing licenses and third-party assets are unchanged by this feature.

## Automated validation

Run with Node.js 22+:

```bash
npm ci
npm run test:run
npm run lint
npm run build
npm run assets:audit
```

**Final local result:** 136 tests passed across 13 suites, including four complete live-simulation victories. `npm ci`, coverage tests, lint, production build and the asset audit passed. After the final phone-prompt wording adjustment, its focused 26-test suite, lint and production build passed again.

Socket tests bind ephemeral loopback ports. Coverage reports are generated under `coverage/` and remain untracked.

- Composition cases cover both valid Trio variants, Duo, Full Squad, missing roles, duplicate roles and duplicate participant identities. Server tests independently enforce deployment rules; hosts/displays do not count as players.
- Unit tests cover frozen deterministic configurations, conditional anchors, role/range/line-of-sight/cooldown checks, genuine Scout scans, guarded checkpoint prerequisites and real AI investigation/path movement. Stuns, remote noise, forged legacy flags and a window flag alone cannot replace a Decoy lure.
- Real WebSocket tests cover common configuration/progress snapshots, legitimate Hacker input, refresh/reconnect preservation, role binding, read-only displays, unknown objective packets, session token rotation, authorization, stale inputs, and room limits. Unit/network fixtures that position actors are isolated from the end-to-end route proof.
- `tests/integration/missionRoute.integration.test.js` exercises **all four supported compositions from spawn through winning extraction** using only movement, Interact, Ability and real revive inputs at 30Hz. Its navigation agents never teleport actors, disable guards/hazards, grant objectives, change cooldowns, or assign victory. All six guards retain live patrol/investigation/chase behavior. Every configured objective must complete and every participant must extract alive. Decoy variants additionally assert observed sentry travel and both contributors.
- Existing menu, controller, camera, collision, map reachability/patrol, gameplay, server and CI regression tests remain included.

## Balance and current main integration

The feature retains main's 10-second normal Assassin stun and 12-second cooldown. The captain's first credential takedown provides a 20-second infiltration opening; subsequent stuns remain normal. A valid checkpoint noise lasts 12 seconds and opens a 10-second relay opportunity only after actual sentry movement/clearance; chase, stun and expired noise close it. Normal noise remains 5 seconds with a 16-second cooldown.

Main's latest unlimited mission time, elapsed-time results, 3-points/second quiet-tick alert recovery and phone/UI improvements are preserved; alert recovery is not stacked with another system. Alert lockdown and the 20-second capture/revive requirement still apply. Four live completion paths remain the acceptance proof; unlimited duration does not bypass role gates or all-player extraction.

## Browser smoke evidence

Browser smoke testing uses the actual local frontend and authoritative backend with a slot-free Party host and four independent player tabs. Verified QR invitation/room setup, four unique roles, Ready cancellation on role change, duplicate-Scout/missing-Decoy deployment rejection, valid Full Squad deployment, synchronized objective states and Scout-specific controller prompts. Switched a player from Controller Mode to full phone gameplay with the same actor. Screenshots are in `docs/screenshots/`. Confirmed a real Scout button press starts the authoritative cooldown while a pulse outside the recon zone leaves discovery incomplete. Refresh preserved the same Scout session and cooldown; controller-to-Canvas-to-controller switching kept its role. The browser remained at 1280×720 when a viewport override was requested, so this run makes no small-viewport verification claim.

This is a browser smoke test, not a manual full-heist victory. Complete victories are established by the live simulation tests above. Physical phones, QR camera scanning, Wi-Fi reachability, iOS Safari/Android Chrome behavior, hardware multitouch and haptics remain unverified. Native packages were not built. Inherited npm dependency advisories were not addressed by unrelated dependency upgrades.

## Physical-device check before judging

1. Connect laptop and four phones to the same unrestricted Wi-Fi/hotspot; run `npm run lan:host` and allow TCP 5173/8787.
2. Scan the QR on iOS/Android. Confirm nickname, role, room code and correct laptop endpoint. Verify every supported team composition and duplicate-role rejection.
3. Hold movement while pressing Interact/Ability; release, rotate, background and change views. Confirm no stuck inputs.
4. Complete captain credentials and ALPHA. Scout pulses from the Garage zone when selected. Decoy uses the Living Room noise zone, moves clear, and calls out the relay window for Hacker/Assassin.
5. Hacker presses Interact at TERMINAL while a teammate stays on SUPPORT PAD. Complete vault, Diamond and whole-team extraction; test capture/revive and a dropped Diamond recovery.
6. Refresh/reconnect within 30 seconds, test a read-only display and then host-only return to lobby/rematch.
