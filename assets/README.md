# Neon Nexus art assets

The lobby is drawn in code today. Every illustrated piece has a **slot name**. When a PNG with that name is listed in
`manifest.json`, the game swaps it in place of the code-drawn version, with **no code changes**. Anything you don't
supply keeps its code-drawn fallback, so you can replace the art one piece at a time.

## Workflow

1. Open `art-templates.html` in a browser (serve the folder, e.g. `npx serve .`). It builds the lobby and shows every
   slot at its exact pixel size with a **Download PNG** button. Paint over it, or start fresh at the same size.
2. Save your PNG (transparent background where the piece has one) as `assets/<slot-name>.png` at the **same pixel size**
   as the template (different aspect ratios will stretch).
3. Add it to `assets/manifest.json`:
   ```json
   { "version": 2, "files": { "carpet": "carpet.png", "back-wall": "back-wall.png" } }
   ```
   Bump `version` whenever you replace a file so browsers refetch it.
4. Reload the game. On `art-templates.html` the card turns **PAINTED**.

## Slot names

| Slot | What it is | Notes |
| --- | --- | --- |
| `character-<name>` | One character's pose sheet (17 designs: `hero`, `juniper`, `cass`, …) | 624 × 640 grid of 104 × 160 cells (6 columns); any exact multiple works (the template shows 936 × 960 or 1248 × 1280 for characters the game renders sharper). Rows: front poses, then side, then back. Keep the cell order and the feet baseline ~6 px above each cell bottom. |
| `cabinet-<game>` | Side-profile cabinet sprite (20 games) | 160 × 224, faces right; the east column mirrors it automatically. |
| `marquee-<game>` | Sign above each cabinet (20 games) | 384 × 192. |
| `plant-0` … `plant-3` | Monstera, fiddle-leaf, snake plant, flowering bush | 128 × 192. |
| `table-0` … `table-2` | Top-down dining tables | 240 × 240. |
| `poker-0` … `poker-2` | Bar-top video poker units | 120 × 130. |
| `host-stand`, `welcome-desk`, `prize-counter`, `bar-stool`, `sconce`, `lucky-wheel`, `jukebox-front` | Furniture and props | Sizes shown on the template page. |
| `back-wall`, `wall-side`, `wall-cap`, `garland`, `gallery-facade`, `gallery-floor` | Architecture | Wide banners; `wall-side` and `wall-cap` tile along the wall. |
| `floor-parquet`, `carpet` | Floor | `floor-parquet` must tile seamlessly; `carpet` is one unique 768 × 1536 overlay (see the template for where cabinets and the central runner sit). |
| `counter-front`, `bar-top`, `back-bar`, `air-hockey`/`tabletop-*`, `pool`/`tabletop-*`, `poster-0` … `poster-7`, `welcome-mat` | Bar and decorations | Sizes shown on the template page. |

## Performance budget

Keep each file as small as you can: use optimised PNG (or run through `pngquant`). The lobby currently uses roughly
85 MB of texture memory on phones; replacing a piece with a much larger bitmap raises that. Prefer the template's pixel
size, and avoid files over ~1 MB.

## Not replaceable yet

The prize collection wall repaints itself as you win prizes, so it is drawn in code only. Character *poses* are fixed by
the sheet layout above.
