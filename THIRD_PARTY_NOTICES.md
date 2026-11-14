# Third-party notices

Shadow Ops includes imported open-source code and assets alongside the team's cooperative mission, security, role, mobile controller, and interface work. It does not claim independent authorship of all imported material.

## Upstream game code and bundled assets

- Source: **MuseumBridge / Museum Break**, maintained by **NandhuRajRK / Museum Break Contributors**.
- Repository: https://github.com/NandhuRajRK/MuseumBridge
- Imported revision: `16fabb198c95b264fa6709f72fc3a221dfbc7d09`.
- License: **MIT**, retained verbatim in [LICENSE](LICENSE).
- Original notice: **Copyright (c) 2026 Museum Break Contributors**.

The retained engine modules, map geometry, collision, guard AI/pathfinding integration, original rendering systems, native scaffolding, and imported UI components derive from that distribution. Original provenance headers remain where present. The MIT copyright notice, permission notice, and disclaimer must accompany copies or substantial portions of that code.

## Asset review

The upstream repository distributed the imported assets under its MIT notice. After the resource audit, the retained subset is:

| Material                                                                                  | Location                       | Notices retained                                                |
| ----------------------------------------------------------------------------------------- | ------------------------------ | --------------------------------------------------------------- |
| Used tiles, doors, plates, vent, shadow and extraction vehicle                            | `topdown_stealth_sprite_pack/` | Original pack README and font README                            |
| Used character/guard animation strips, props, camera/laser sprites and animation metadata | `museum_break_final_assets/`   | Original pack README, subset manifest and player/guard metadata |
| Native icons, splashes, platform variants and configuration                               | `android/` and `ios/`          | Original resources and upstream repository notice               |

The pack READMEs describe generated prototype/original assets; no separate asset-specific license or credit requirement was found in their bundled text/metadata. This records the upstream distribution's terms, not an independent verification of every asset's creation history. Imported graphics are not relabeled as independent team artwork.

Unused backgrounds, logos, atlas/font files, button states, duplicate sprites and unconsumed animations were removed. The original full bundle remains in published history. The three used pause/win/loss images were replaced with original Shadow Ops CSS gradients, borders and grid artwork; remaining imported sprites and required notices are retained. See [the resource audit](docs/ASSET_AUDIT.md) and [per-file inventory](docs/asset-audit.json) for exact dispositions, references and baseline hashes. The subset manifest intentionally lists only files still shipped; original pack/font READMEs describe the historical full pack.

No external font binary was added. The frontend uses system fallbacks rather than a Google Fonts download. Original font recommendations in pack documentation are not a claim that those font files are included. Native graphics remain conservative replacement candidates until platform builds can be validated.

## npm dependencies

Dependencies remain subject to their respective licenses, provided in installed package metadata and license files. Examples reviewed for this version include React, Vite, ws, qrcode, and pathfinding (MIT), and lucide-react (ISC). The lockfile records the dependency tree. A dependency license is not replaced by this project's MIT notice. Preserve applicable dependency notices when redistributing built or native packages; this file is not an exhaustive bundled-software license inventory.

QR codes are generated locally using **qrcode**; no third-party QR website receives room invitations. No additional third-party artwork was introduced for the Party Mode interface.

## Published history

The initial import commit remains in Git history. Future commits describe the features or maintenance work they actually perform; history is not rewritten to hide provenance. GitHub shows the latest commit affecting each individual file, so an unchanged imported file may continue to show an older import message until a real change touches it.
