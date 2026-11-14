# Museum Break Final Asset Pack

Generated original asset pack for a top-down stealth/museum-heist game.

Includes:
- Screen backgrounds and overlays
- Tile and prop atlases with JSON rect maps
- Player, guard, camera, loot, crate, and security animation strips
- HUD/menu/lobby/instructions/pause/result UI assets
- `assets_manifest.json` with frame size, frame count, fps, and pivots

Notes:
- PNGs are lossless RGBA/sRGB-compatible.
- Sprite sheets are exported as horizontal strips.
- Sprite graphics are pixel-art style and should be rendered with nearest-neighbor filtering.
- Large screen backgrounds may be rendered with bilinear filtering if desired.
- No `.ttf` font file is included. A generated bitmap-font placeholder exists at `ui/font_bitmap.png` with metadata at `ui/font_bitmap.fnt`.
