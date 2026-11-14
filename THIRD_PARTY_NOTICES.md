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

The upstream repository distributed these assets with its MIT license:

| Material                                                                                    | Location                       | Notices retained                                              |
| ------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------- |
| Top-down tiles, characters, cameras, hazards, and interface sprites                         | `topdown_stealth_sprite_pack/` | Original pack README and font README                          |
| Animated game sprites, atlases, effects, interface backgrounds, and bitmap-font placeholder | `museum_break_final_assets/`   | Original pack README, manifests, atlas and animation metadata |
| Original raster screen backgrounds                                                          | `Background_images/`           | Original files and upstream repository notice                 |
| Native application icons and splash graphics                                                | `android/` and `ios/`          | Original files and upstream repository notice                 |

The two pack READMEs describe generated prototype/original assets; no additional asset-specific license or credit requirement was found in those bundled text/metadata files. This records the terms supplied by the upstream distribution, not an independent verification of every asset's creation history. We retain the source notices and do not relabel those imported graphics as independently created team artwork. Unused legacy logos and filenames remain as source/provenance artifacts and are not Shadow Ops branding.

No external font binary was added. The frontend uses system font fallbacks; it no longer downloads a Google Fonts stylesheet. The pack's recommendations of third-party font names are not bundled font licenses or claims that those fonts are included.

## npm dependencies

Dependencies remain subject to their respective licenses, provided in installed package metadata and license files. Examples reviewed for this version include React, Vite, ws, qrcode, and pathfinding (MIT), and lucide-react (ISC). The lockfile records the dependency tree. A dependency license is not replaced by this project's MIT notice. Preserve applicable dependency notices when redistributing built or native packages; this file is not an exhaustive bundled-software license inventory.

QR codes are generated locally using **qrcode**; no third-party QR website receives room invitations. No additional third-party artwork was introduced for the Party Mode interface.

## Published history

The initial import commit remains in Git history. Future commits describe the features or maintenance work they actually perform; history is not rewritten to hide provenance. GitHub shows the latest commit affecting each individual file, so an unchanged imported file may continue to show an older import message until a real change touches it.
