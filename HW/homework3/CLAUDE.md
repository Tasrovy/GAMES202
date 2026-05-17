# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GAMES202 Homework 3 — a real-time rendering engine implementing **Screen Space Reflection (SSR)** with deferred shading, shadow mapping, and G-buffer passes. Built on raw WebGL 1.0 (no framework), using Three.js only for loaders/camera/controls.

## Architecture

The renderer uses a **multi-pass pipeline**, each pass rendering meshes with a specific material:

1. **Shadow pass** — renders depth from light's perspective into `light.entity.fbo` using `ShadowMaterial`
2. **Buffer (G-buffer) pass** — renders into `camera.fbo` (5 MRTs: diffuse, depth, normal, shadow, world position) using `GBufferMaterial`
3. **Camera pass** — final shading using `SSRMaterial`, reads from the G-buffer textures and performs ray-marched SSR in the fragment shader

```
WebGLRenderer.render()
  ├── Light mesh visualization (EmissiveMaterial)
  ├── Shadow pass → shadowMeshes[] → ShadowMaterial → light.fbo
  ├── Buffer pass  → bufferMeshes[] → GBufferMaterial → camera.fbo
  └── Camera pass  → meshes[] → SSRMaterial → screen
```

## Key Files

| File | Role |
|---|---|
| `src/engine.js` | Entry point — init WebGL, camera, lights, scene, main loop |
| `src/renderers/WebGLRenderer.js` | Orchestrates the render passes |
| `src/renderers/MeshRender.js` | Binds geometry, uniforms, and draws a single mesh |
| `src/materials/Material.js` | Base material — defines uniforms, compiles Shader |
| `src/materials/ShadowMaterial.js` | Shadow depth pass |
| `src/materials/GBufferMaterial.js` | G-buffer (5 MRTs: diffuse, depth, normal, shadow, position) |
| `src/materials/SSRMaterial.js` | SSR final pass — reads G-buffer, does ray-marched reflections |
| `src/shaders/ssrShader/ssrFragment.glsl` | Core SSR — hemisphere sampling, ray marching, indirect lighting |
| `src/textures/FBO.js` | Framebuffer object with 5 color attachments + depth renderbuffer |
| `src/lights/DirectionalLight.js` | Directional light with orthographic shadow projection |
| `src/loads/loadGLTF.js` | Loads glTF meshes and wires up all 3 material passes |

## Running

No build step. Serve the project directory with any HTTP server:

```bash
# Python
python -m http.server 8000

# Node (npx)
npx serve .
```

Then open `http://localhost:8000` in a browser. The active scene is toggled in `engine.js` — switch comments between Cube and Cave camera/light config blocks.

## Debug UI

A `dat.GUI` panel appears with directional light direction controls (`x`, `y`, `z` sliders).

## Development Notes

- WebGL 1.0 with `OES_texture_float` and `WEBGL_draw_buffers` extensions
- All rendering uses `gl-matrix-min.js` for matrix math (no Three.js scene graph involvement in rendering)
- Three.js is used only for: `PerspectiveCamera`, `OrbitControls`, `FileLoader`, `GLTFLoader`, `MTLLoader`, `OBJLoader`
- Shader files (`.glsl`) are loaded asynchronously at runtime via `THREE.FileLoader`
- The G-buffer uses 5 `RGBA/FLOAT` color attachments; the shadow map uses 1 `RGBA/FLOAT` attachment
- SSR parameters at top of `ssrFragment.glsl`: `MAX_STRIDE` (150), `STRIDE` (0.05), `THICKNESS` (0.1), `SAMPLE_NUM` (5)
- `PointLight` class exists but is incomplete/unused
- No test infrastructure exists
