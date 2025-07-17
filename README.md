# Galaxy Simulation - Svelte + Three.js

An interactive 3D galaxy simulation built with Svelte and Three.js, featuring realistic spiral galaxy visualization with thousands of stars, smooth camera controls, and real-time customization options.

## Features

- 3D spiral galaxy with realistic star distribution
- Interactive camera controls (orbit, zoom, pan)
- Real-time galaxy customization
- Smooth animations with differential rotation
- Responsive design for desktop and tablet
- WebGL-accelerated rendering

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   └── GalaxyViewer.svelte     # Main 3D viewer component
│   ├── galaxy/                     # Galaxy simulation logic
│   │   ├── GalaxyEngine.ts         # Core galaxy generation
│   │   ├── StarField.ts            # Star positioning algorithms
│   │   └── CameraController.ts     # Camera interaction handling
│   └── types/
│       └── galaxy.ts               # TypeScript interfaces
└── routes/
    └── +page.svelte                # Main application page
```

## Dependencies

- **Svelte 5** - Reactive UI framework
- **Three.js** - 3D graphics library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server

## Development

Install dependencies:
```bash
npm install
```

Start development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

## Implementation Status

✅ Task 1: Project structure and dependencies setup
✅ Task 2: Three.js scene infrastructure
✅ Task 3: Galaxy generation algorithms
✅ Task 4: Galaxy animation and rotation
✅ Task 5: Svelte UI components
✅ Task 6: Visual enhancements and effects
✅ Task 7: Responsive design and device optimization
✅ Task 8: Error handling and fallbacks
✅ Task 9: Test suite
✅ Task 10: Performance optimizations and polish

See `.kiro/specs/svelte-galaxy-simulation/tasks.md` for detailed implementation plan.

## Live Demo

Check out the live demo on GitHub Pages: [Svelte Galaxy Simulation] (https://github.com/ts2gamer22/Galaxy-Simulator)

## Deployment

This project is set up to automatically deploy to GitHub Pages when changes are pushed to the main branch. The deployment is handled by GitHub Actions.