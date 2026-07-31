# Wood Cut Optimizer

A mobile app that helps carpenters and woodworkers get the most out of every
sheet of material. You list the pieces you need to cut and the sheets you
have available, and the app works out the most efficient way to lay them
out — how many sheets you'll actually need, where each piece goes, and how
much material gets wasted.

Built with React Native, Expo, and TypeScript.

## The problem

Cutting sheet goods (plywood, MDF, particle board, etc.) by eye or by
guesswork almost always wastes material. Figuring out the optimal layout by
hand — accounting for the blade's kerf, piece rotation, and multiple sheet
sizes — gets tedious fast once you have more than a handful of pieces. Wood
Cut Optimizer automates that calculation and shows you a clear, to-scale
diagram of exactly where to cut.

## Features

- **Cut list & material list** — add the pieces you need (width, height,
  quantity, optional name) and the sheets you have on hand, with inline
  editing and deletion.
- **Automatic layout optimization** — a 2D bin-packing algorithm decides how
  many sheets are needed and exactly where every piece goes.
- **Kerf-aware** — select the saw blade thickness (1–5mm) and the algorithm
  accounts for material lost on every cut.
- **Rotation support** — pieces are rotated automatically to fit better,
  unless you mark a piece as grain-sensitive (`allowRotation: false`).
- **Visual, to-scale cutting diagrams** — each sheet is rendered as an SVG
  layout with:
  - A consistent color per piece type across every sheet, plus a legend, so
    the same piece is always easy to spot.
  - Reference grid lines for scale.
  - Tap-to-inspect details (exact position, area, rotation) for any piece.
  - A full-screen zoomable view for closer inspection.
- **Waste tracking** — per-sheet and overall waste percentage, color-coded
  (green/amber/red) so you can see at a glance which sheets were cut
  efficiently.
- **Warnings** — flags any piece that doesn't fit on any available material
  before you even run the optimization.

## How it works

1. **Enter your cuts** — the pieces you need, with width, height, and
   quantity (e.g. "4 shelves, 600×300mm").
2. **Enter your materials** — the sheets you have available, with their
   size and how many of each you own.
3. **Set the kerf** — the width your saw blade removes per cut (default
   3mm).
4. **Tap "Optimizar Cortes"** — the app:
   - Sorts all the pieces from largest to smallest area (First Fit
     Decreasing).
   - Places each piece into the best-fitting free space on an already-open
     sheet using a **Best Area Fit** heuristic — the placement that leaves
     the least amount of unusable leftover space — trying both orientations
     when rotation is allowed.
   - Opens a new sheet only when no existing one has room for a piece.
   - Splits each used space with a **guillotine cut** (straight edge-to-edge
     cuts only, like a real panel saw) and merges adjacent leftover spaces
     back together so they stay usable for future pieces instead of getting
     fragmented.
5. **Review the results** — how many sheets you need, the cutting diagram
   for each one, and the total waste percentage.

## Tech stack

- **React Native + Expo + TypeScript**
- **react-native-svg** — renders the to-scale cutting diagrams
- **expo-linear-gradient** — UI gradients
- **@expo/vector-icons** — iconography
- Custom bin-packing algorithm (no external packing library) — see
  [`src/algorithm/packing.ts`](./src/algorithm/packing.ts)

## Project structure

```
wood-cut-optimizer/
├── App.tsx                          # App entry point
├── app.json                         # Expo config (icons, bundle IDs, EAS project)
├── eas.json                         # EAS Build profiles
├── src/
│   ├── algorithm/
│   │   └── packing.ts               # Core bin-packing / optimization logic
│   ├── components/
│   │   ├── InputSection.tsx         # Cut & material list management
│   │   └── CuttingVisualization.tsx # SVG cutting diagrams
│   ├── screens/
│   │   └── HomeScreen.tsx           # Main screen — ties everything together
│   ├── theme/
│   │   └── theme.ts                 # Design tokens (colors, spacing, typography)
│   └── utils/
│       └── pieceColor.ts            # Deterministic color assignment per piece type
```

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** (iOS/Android) to run it on your phone, or
press `w` to open it in a browser.

## Building an installable app

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) to
generate installable binaries.

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview   # generates a shareable .apk
```

See `eas.json` for the available build profiles (`development`, `preview`,
`production`).

## Roadmap

- [ ] PDF export of cutting plans
- [ ] Save/reload past projects
- [ ] Publish to Google Play and the App Store

## Author

Built by [Benjamín Kravchuk](https://github.com/Benjakr04).