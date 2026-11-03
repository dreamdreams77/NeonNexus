# Neon Nexus: hand-drawn art brief

Hi! I'm after hand-drawn illustrations for a small game called Neon Nexus. It's an arcade-resort lobby with 20 playable
cabinets, a bar and kitchen, a prize gallery and a cast of regulars. Every piece is currently drawn by code as a
placeholder. The game swaps each piece for a PNG with no programming, so you only need to deliver images.

## The look
- Hand-drawn, storybook warmth. Visible ink outlines, soft cel shading, gentle texture. It should look made by a person.
- Warm, slightly dusky palette: plum, cream, coral, mint, gold. Neon glow only as accents.
- One consistent perspective and light source across every piece (soft light from above and slightly in front).
- Dry, friendly personality: quirky regulars, slightly worn furniture, plants that have clearly seen things.

## What's in the zip
`templates/` has one PNG per slot (96 total) at the exact pixel size the game uses, with the current code-drawn
placeholder on it. Paint over it or start fresh at the same size. `slot-sizes.csv` lists every slot and its size.

## Priority order
1. **Characters (17 designs)**: pose sheets, 6 columns of cells (104 x 160 px per cell at 1x). Front poses first, then
   side, then back. Feet sit about 6 px above the bottom of each cell. The four regulars matter most: Ace (prize hunter,
   dramatic), Moxie (rhythm fan, laid back), Juniper (earnest, always carrying a map), Laryn (pool shark, quiet).
   Files: `character-<name>.png`.
2. **Cabinets (20)**: side profile, facing right, 160 x 224, transparent background. `cabinet-<game>.png`.
3. **Marquee signs (20)**: 384 x 192. `marquee-<game>.png`.
4. **Room and furniture**: back wall, side wall, wall cap, garland, parquet floor (must tile seamlessly), carpet
   (768 x 1536, one unique piece), bar top, back bar, counter front, bar stool, dining tables (top-down), plants,
   poker units, prize counter, lucky wheel, jukebox front, sconce, posters.

## Technical rules
- PNG, transparent background wherever the piece is not a wall or floor.
- Exact pixel size from the template, or a whole-number multiple of it (2x is fine and sharper). A different aspect
  ratio will stretch.
- Name each file exactly as the slot (for example `cabinet-skeeball.png`). Do not change cell order, the feet baseline
  or the tiling rule.
- Keep each file under about 1 MB (optimised PNG or `pngquant`). The game runs on phones.

## Delivery and rights
- Send PNGs in a zip or shared folder, plus layered source files if you are happy to share them.
- Please confirm rights: licensed for use in the game, with credit to you in the credits.
- Rough quote per batch and a timeline for the first batch. I suggest cabinets or characters first so we can check the
  style early.

[Your name and contact] / [Budget and licence terms]
