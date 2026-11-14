# Shared keys and Hacker security rebalance

This follow-up uses `feature/shared-keys-security-objectives`, based on PR #6 because it was still open at implementation time. Unlimited mission time, actual Assassin takedown and Decoy investigation gates are preserved.

Exactly two shared Interact pickups now contribute team key progress independently of captain takedown. Hacker must actually open the Garage pantry door and disable the Living Room camera network through separate System Override events. Both persist and gate progression. Scout completes recon with one valid Garage zone pulse, with no additional item or repeated-scan requirement.

New focused tests cover pickup permissions for all four roles, exactly two unique keys, duplicate prevention, unauthorized security actions, persistent camera suppression, actual door collision/passability and prerequisite enforcement. The four input-driven live mission routes and WebSocket synchronization/reconnect fixtures are updated for shared inventory and separate electronic objectives. They keep real guards, hazards and authoritative button actions.

Validation commands: `npm run test:run`, `npm run lint`, `npm run build`, `npm run assets:audit`. Physical phones/LAN and native builds remain unverified. Existing screenshots under docs/screenshots record PR #6's earlier UI, not this rebalance.

Final local validation: **147 tests passed across 14 suites**, including complete live missions for all four compositions, with guards/hazards active and all role gates enforced. Lint, production build and asset audit passed. The explicit WebSocket forged-key cases also passed.


## UI 3 verification

See [UI 3 validation and screenshots](docs/UI_3.md). The full suite passes 156 tests, including all four live composition wins with BRAVO relocated to clear floor in the Study. Browser verification covered four real connected roles, QR and clipboard values, readiness/composition gating, deployment, reconnect, read-only display, controller/game view, actual mission failure and host replay. Success presentation uses an actual winning simulation snapshot. Responsive portrait and landscape frames scroll without horizontal overflow. Physical phone/LAN-device verification remains outstanding.
