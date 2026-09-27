# Chibi Asset Update

- Existing roster only: no characters were added or renamed.
- 25 non-Cosmic character artworks were replaced with chibi assets generated from their existing simulator references.
- Cosmic Yui's existing chibi battle artwork and color variants were normalized to the same canvas.
- Main roster artwork uses a transparent 724 × 724 canvas with consistent padding/scale.
- Existing A0–A6 controls and combat data were retained.
- `assets/characters/chibi-style-manifest.json` records the asset-to-character mapping.

Verification: `npm test` passes 274/274 and `npm run build` completes successfully.
