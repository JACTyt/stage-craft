# StageCraft

> A browser-based location builder for tabletop RPGs — compose modular scenes, toggle between tactical battle-map and illustrated-scene skins, and export print-ready PNG/JPG maps.

## Overview

SceneForge lets a DM assemble any location — a tavern, a dungeon room, a forest clearing, a battle grid — from a library of modular, drag-and-place elements, then export it as a high-resolution image for use at the table or in a VTT.

The core design idea: **scene data and visual style are decoupled.** A location is authored once as a scene graph (layers of element references + transforms). Two "skins" — Tactical Grid and Illustrated Scene — resolve that same data into different visual treatments without touching the underlying layout. Switching skins is a config change, not a rebuild.

## Features

- **Modular element system** — terrain, walls/structures, furniture, nature, lighting/FX, tokens, and text, all placed on a canvas via drag-and-drop
- **Two base skins**
  - *Tactical grid* — square/hex grid, snap-to-grid placement, flat top-down icons, fog-of-war reveal layer, token HP/initiative markers
  - *Illustrated scene* — freeform placement, painterly/textured sprites, ambient lighting overlay, parchment-style framing
- **Layered canvas** — terrain, objects, fog/lighting, and grid/tokens as independent layers, each toggleable and independently exportable
- **PNG/JPG export** — high-resolution export via Konva's stage rendering, with layer-visibility control (e.g. export a "player view" without GM-only notes or hidden fog areas)
- **Data-driven asset registry** — new furniture, terrain, or props are added as registry entries + art, no code changes required
- **(Planned) Save & share** — persist scenes locally, then via backend save/load and share-by-link

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Canvas rendering | react-konva / Konva.js |
| State management | Zustand |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Persistence (MVP) | IndexedDB / localStorage |
| Persistence (later) | Next.js API routes + Postgres or similar, for save/share-by-link |
| Assets (MVP) | CC0 top-down/isometric packs, custom upload slot in the registry |

## Architecture

### Scene graph

A location is stored as plain JSON, independent of any rendering skin:

```ts
interface Scene {
  id: string;
  name: string;
  activeSkin: 'tactical' | 'illustrated';
  gridSize: number;
  layers: Layer[];
  elements: ElementInstance[];
}

interface ElementInstance {
  id: string;
  registryId: string;   // reference into the Element Registry
  layerId: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  zIndex: number;
}
```

### Element registry

Elements are defined once, with per-skin art, so the same instance renders differently depending on the active skin:

```ts
interface RegistryEntry {
  id: string;
  category: 'terrain' | 'wall' | 'furniture' | 'nature' | 'fx' | 'token' | 'text';
  tags: string[];
  assetsBySkin: {
    tactical: string;      // asset path/URL
    illustrated: string;
  };
  defaultSize: { width: number; height: number };
  flags?: { snappable?: boolean; castsShadow?: boolean; blocksLight?: boolean };
}
```

An instance stores only a `registryId` + transform — never duplicated art data. This keeps scenes small, fast to save/load, and fully reskinnable.

### Render pipeline

```
Scene graph (JSON) + Element registry (skin-aware)
        │
        ▼
   react-konva <Stage>
   ├─ Terrain layer
   ├─ Objects layer
   ├─ Fog / lighting layer
   └─ Grid / tokens layer
        │
        ▼
  stage.toDataURL() → PNG / JPG
```

## Project structure

```
/app
  /editor              main canvas page
  /api/scenes           save / load / share routes (planned)
/components
  Canvas/
    Stage.tsx            wraps react-konva Stage + Layers
    ElementRenderer.tsx   resolves registry entry + active skin → <Image>
    Toolbar.tsx
    LayerPanel.tsx
    Inspector.tsx         transform controls for the selected element
/lib
  elementRegistry.ts     data-driven asset catalog
  sceneStore.ts           Zustand store: layers, elements, activeSkin
  export.ts               toDataURL helpers, layer-visibility-aware export
/types
  scene.ts                Scene, Layer, ElementInstance, RegistryEntry interfaces
```

## Getting started

```bash
git clone <repo-url>
cd sceneforge
npm install
npm run dev
```

Open [http://localhost:3000/editor](http://localhost:3000/editor).

## Roadmap

- [ ] Core canvas: place, move, rotate, delete elements
- [ ] Two skins with ~15 assets per category
- [ ] PNG export
- [ ] Grid snap + tactical mode (tokens, fog-of-war reveal)
- [ ] Local save/load (IndexedDB)
- [ ] Backend save + share-by-link
- [ ] Lighting/shadow layer
- [ ] Print-ready, grid-locked export sizing
- [ ] Custom asset upload

## Technical decisions

**Why decouple scene data from skin rendering?**
So the same authored location can render as either a tactical battle map or an illustrated scene without duplicating layout data. Adding a new skin or asset pack is a config addition, not a code change — this was the central architectural bet of the project.

**Why Konva / react-konva over SVG or plain Canvas2D?**
Raster export (`toDataURL`) is native and trivial, Konva's `Layer` concept maps directly onto the app's terrain/objects/fog/grid separation, and react-konva lets the scene graph drive rendering declaratively rather than through imperative canvas calls.

**Why Next.js over a plain React SPA?**
File-based routing and API routes make the save/share-by-link feature a natural extension rather than a separate backend service, and deployment to Vercel is effectively zero-config.

**Why store element instances as references + transforms instead of full copies?**
Keeps scene JSON small, keeps save/load fast, and is what makes reskinning possible without re-authoring — an instance doesn't know what it looks like, only where it is.

## License

MIT (or your preference)
