# Shadow Ops resource audit

Audit date: November 14, 2026. Baseline: `1ee69d1` (merged Party Mode main). This is a resource cleanup and presentation replacement; no gameplay, networking, player slots, collision geometry or Git history was rewritten.

## Findings and changes

Reviewed **181 files** across the two imported game packs, `Background_images/`, Android resources and iOS asset catalogs. The per-file inventory in [asset-audit.json](asset-audit.json) records each original path, baseline byte size/SHA-256, disposition, reason, and direct runtime consumer where applicable. Baseline hashes describe the pre-cleanup files, not the modified subset manifest.

| Disposition                                  | Files | Action                                                                            |
| -------------------------------------------- | ----: | --------------------------------------------------------------------------------- |
| Runtime sprites/animation metadata retained  |    34 | 32 PNGs and 2 metadata files; keep existing renderer/frame contracts              |
| Native resources retained conservatively     |    42 | Preserve platform catalogs, density/orientation variants and configuration        |
| Original notice/documentation files retained |     3 | Preserve original pack/font READMEs as provenance                                 |
| Resource inventory retained and pruned       |     1 | Remove stale entries from the upstream asset manifest                             |
| Unused resources removed                     |    98 | Remove unreferenced legacy images, font/atlas resources and an unused sprite load |
| Imported images replaced                     |     3 | Replace used pause/win/loss artwork with original CSS panels/backgrounds          |

**Scoped file content:** 7,361,335 → 474,852 bytes, a reduction of **6,886,483 bytes (93.55%)**, including the smaller subset manifest. This measures tracked resource-file content, not total repository size or download savings: published Git history still contains deleted files, and most unused images were already excluded from Vite output. The audit documents added in this change are outside that resource-size comparison.

### Removed as unused

- Both `Background_images/` PNGs: neither is referenced after the tactical menu/lobby redesign. The now-empty directory disappears naturally.
- Old museum logos, menu/lobby/instructions/HUD button images and screen panels, ambient/parallax/vignette/alarm effects, bitmap-font files, unused tile/prop atlases, preview sheets and duplicate van/vent/item/player/guard/camera sprites.
- Unused interact/hurt/crate-push animations, open-case and emitter-off variants: no current renderer path requests these files.
- `guard_turn_strip.png`: the loader allocated an image but the renderer never consumed `S.guardTurn` or `ANIM.guard.turnFps`. Remove those unused exports/imports together with the image. The separate idle/walk/alert animations remain intact.

No runtime filename lookup, glob, CSS URL or manifest-driven loader consumes the removed resources. The source asset manifest is documentation, not a runtime loader; it is pruned to prevent promises of files no longer shipped. Original metadata/pack documentation may describe the former full pack; those descriptions are provenance, not a claim that all original files remain.

### Replaced with original Shadow Ops artwork

| Imported image                                 | Replacement                                                                           | Contract preserved                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `museum_break_final_assets/pause/panel.png`    | `.ops-pause-panel`: navy gradient, cyan border and green tactical accent              | Resume/quit, Escape behavior, readable panel geometry     |
| `museum_break_final_assets/result/win_bg.png`  | `.ops-debrief-success` and `.ops-debrief-grid`: dark tactical grid with green glow    | Existing success screen, score, stats and rematch actions |
| `museum_break_final_assets/result/loss_bg.png` | `.ops-debrief-failure` and shared grid: charcoal/navy with restrained rose alert glow | Existing failure reason, score, stats and rematch actions |

The replacement artwork is code-native CSS authored for Shadow Ops in `src/index.css`; it does not recolor or claim authorship of imported raster art and adds no font, image download or QR service. The source components drop the three raster imports. All mission/result calculations and button callbacks remain unchanged.

## Retained resources and replacement opportunities

All retained gameplay PNGs are imported by `src/lib/game/spriteAssets.js` and used by `renderer.js`. Full paths and consumer modules are in the JSON inventory.

| Resource group                                         | Current use                                                                                    | Safe originality improvement                                                                                                                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Player idle/walk strips and shadow                     | Operatives; the two existing sprite sets are distinguished further by role-colored rings/names | Highest visual-impact next step: four original role silhouettes. Preserve horizontal 32×32 frame strips, 8 frames, alpha, pivot and idle/walk timing; add visual QA for all four roles before swapping |
| Guard idle/walk/alert strips                           | Patrol, investigation, chase and alert animation                                               | Original facility-security uniforms; preserve 32×32 cells, 8 idle/walk and 6 alert frames. Detection/pathfinding must remain independent of artwork                                                    |
| Floor/wall/door tiles                                  | Facility ground, cover and open/closed doors                                                   | Original navy facility tiles and electronic doors. Match existing image aspect ratios, draw bounds and visual collision edges; do not alter map solids                                                 |
| Cameras, laser core/emitters                           | Detection/hacked-state feedback and hazards                                                    | Original device housings and cyan/rose threat indicators with distinct disabled states. Preserve 24×24 camera cells, beam anchors and readable threat contrast                                         |
| Crown, cases, crates, switches, vents, pressure plates | Objectives and environment/puzzle drawing                                                      | Original operation-marked props and Crown container; preserve dimensions/anchors and active/inactive readability                                                                                       |
| Small/heavy artifact strips                            | General/legacy renderer branches; the Crown mission filters these out of its active state      | Retain for compatibility with existing engine behavior/tests. Remove only with an explicit retirement of those branches, or replace if additional missions use them                                    |
| Extraction van                                         | Shared extraction landmark                                                                     | Original tactical extraction vehicle; preserve draw bounds and unchanged server-side extraction radius                                                                                                 |
| Native launcher icons and splashes                     | Android resource variants and iOS catalogs/launch storyboard                                   | Original Shadow Ops icon/splash set. Validate adaptive/round/density/orientation catalogs and both native builds first; not replaced in this pass                                                      |

Native resources are not declared unused solely because JavaScript does not import them. Android uses resource names/qualifiers and iOS uses catalog filenames/storyboards. Some inherited vector/configuration variants may be redundant, but native builds were unavailable; they remain explicitly conservative candidates rather than being deleted without verification. No claim of physical-device or native-release validation is made.

## Method and checks

1. Fetch latest main and confirm both teams' player additions and P3/P4 inputs are already integrated, with no merge conflicts.
2. Inventory files and baseline hashes before deletion.
3. Search runtime imports, CSS URLs, dynamic loading, sprite-cache properties and renderer consumers. Treat conditional renderer branches as used.
4. Inspect Android manifest/adaptive icons/resource variants and iOS image catalogs/launch storyboard separately from web imports.
5. Remove proven-unused files; replace only isolated presentation images; prune inventory entries; preserve required copyright/permission notices.
6. Run:

```bash
npm run assets:audit
npm run test:run
npm run lint
npm run build
```

`assets:audit` checks the recorded removed/retained files, direct source imports, manifest targets and loaded sprite consumers. It is a reference-integrity guard, not a generic whole-program reachability proof or native build substitute. Any future rendering path that consumes sprites through a different cache variable should extend this check.

## Attribution and history

[LICENSE](../LICENSE) is unchanged. [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) records the retained imported code/sprites and native resources and explains removal of unused resources. Original pack/font READMEs remain. The original full bundle is recoverable from the baseline commit and upstream revision recorded in the notices; no history was rewritten and no file was touched solely to replace GitHub's last-commit label.
