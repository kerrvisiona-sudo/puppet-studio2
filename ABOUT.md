Now I have a comprehensive understanding of the codebase. Let me provide a thorough summary. 

---  
Codebase Exploration Summary: Puppet Studio      

1. Project Type and Purpose

Type: TypeScript/React web application for 3D scene visualization and simulation  

Purpose: This is a CAD-like workspace application called "Puppet Simula" (or "Puppet Studio") designed for:        
- 3D scene editing and visualization using Three.js         
- Human body pose/puppet simulation with ragdoll physics    
- Room/space planning with object placements (planogram)    
- Real-time WebSocket bridge communication for scene synchronization   
- Camera detection overlays and monitoring camera simulation
- Part of a larger "care simulator" system (likely for healthcare or assisted living monitoring)        

Framework/Libraries:       
- React with TypeScript    
- Vite as the build tool   
- @react-three/fiber (React Three Fiber - React bindings for Three.js) 
- @react-three/drei (helpers for React Three Fiber)         
- @react-three/cannon (physics with Cannon.js)   
- Zustand for state management        
- WebSocket (ws) for real-time communication     

---  
2. Directory Structure and Organization          

puppet-studio/  
├── src/    # Main TypeScript/React source code  
│   ├── main.tsx       # Application entry point 
│   ├── App.tsx        # Root component          
│   ├── styles.css     # Main stylesheet (~54KB) 
│   ├── createConfig.ts# Ragdoll body configuration         
│   ├── poseControls.ts# Pose control types and limits      
│   ├── app/# Application-level state 
│   │   └── state/         
│   │       └── poseStore.ts      # Zustand store (~1040 lines)        
│   ├── core/          # Core business logic     
│   │   ├── app-commanding/       # Command bus and capabilities       
│   │   ├── bridge-runtime/       # WebSocket bridge communication     
│   │   ├── config/    # Runtime configuration   
│   │   ├── engine/    # Engine capabilities     
│   │   ├── observability/        # Event logging
│   │   ├── scene-domain/         # Scene engine and commands          
│   │   └── workspace-shell/      # Workspace shell bridge  
│   ├── features/      # Feature modules (Feature-Sliced Design)       
│   │   ├── bridge/    # Bridge communication UI/hooks      
│   │   ├── camera/    # Camera subspace map     
│   │   ├── planogram/ # Planogram mini map      
│   │   ├── pose/      # Pose control panel      
│   │   ├── scene/     # 3D scene rendering      
│   │   ├── terminal/  # Event terminal          
│   │   └── workspace/ # Main workspace layout   
│   ├── planogram/     # Planogram domain logic  
│   │   ├── types.ts   # Asset/placement types   
│   │   ├── catalog.ts # Asset catalog
│   │   ├── layout.ts  # Layout utilities        
│   │   ├── normalization.ts      # Data normalization      
│   │   └── sync.ts    # Scene sync (~19KB)      
│   └── shared/        # Shared utilities        
│       ├── shortcuts/ # Keyboard shortcuts      
│       └── ui/        # Shared UI components    
├── lib/    # Python libraries        
│   ├── analytics/     # Python analytics hub    
│   │   ├── hub.py     # SpecialistSubscriber base class    
│   │   ├── parsing.py # Message parsing         
│   │   └── test_hub.py# pytest tests 
│   └── geometry/      # Geometry utilities      
│       └── src/simula_geometry/      
│└── cuboid_lift.py    # 2.5D lifting utilities  
├── index.html         # HTML entry point        
├── package.json       # NPM configuration       
├── vite.config.ts     # Vite configuration      
├── tsconfig.json      # TypeScript configuration
└── CLAUDE.md          # (Empty) AI assistant instructions  

---  
3. Build System and Package Management

Package Manager: npm (with package-lock.json)    

Build Tool: Vite with React plugin    

npm scripts:    
- dev: Run Vite dev server 
- build: TypeScript build + Vite production build
- preview: Preview production build   
- test:scene: Run scene tests using esbuild      
- bridge: Run WebSocket bridge server (Node.js)  
- bridge:monitor: Run bridge monitor  
- mock:lift-listener: Python mock client for lift listening 
- mock:bed-sequence: Python mock client for bed sequence simulation    
- check:architecture: Architecture validation script (referenced but not found)   

Key Dependencies:          
- @react-three/fiber, @react-three/drei, @react-three/cannon: 3D rendering and physics       
- three: Three.js core     
- zustand: State management
- ws: WebSocket client/server         
- react, react-dom: React framework   

Python Environment: Uses uv package manager for Python mock clients    

---  
4. Key Configuration Files 
┌─────────────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────────────┐       
│   File    │          Purpose│       
├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤       
│ /home/visiona/Work/care-simulator/puppet-studio/package.json     │ NPM configuration, scripts, dependencies         │       
├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤       
│ /home/visiona/Work/care-simulator/puppet-studio/tsconfig.json    │ TypeScript project references         │       
├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤       
│ /home/visiona/Work/care-simulator/puppet-studio/tsconfig.app.json│ App TypeScript config (ES2020, react-jsx)        │       
├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤       
│ /home/visiona/Work/care-simulator/puppet-studio/tsconfig.node.json          │ Node TypeScript config for Vite       │       
├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤       
│ /home/visiona/Work/care-simulator/puppet-studio/vite.config.ts   │ Vite config with manual chunk splitting          │       
├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤       
│ /home/visiona/Work/care-simulator/puppet-studio/index.html       │ HTML entry point│       
├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤       
│ /home/visiona/Work/care-simulator/puppet-studio/.gitignore       │ Git ignore (dist, models, node_modules, archive) │       
├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤       
│ /home/visiona/Work/care-simulator/puppet-studio/lib/geometry/pyproject.toml │ Python package config for simula-geometry        │       
├─────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────────────┤       
│ /home/visiona/Work/care-simulator/puppet-studio/CLAUDE.md        │ Empty AI assistant rules file         │       
└─────────────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────────────┘       
---  
5. Source Code Organization and Architecture     

Architecture Pattern: Feature-Sliced Design with Domain-Driven modules 

Key Architectural Components:         

1. State Management (src/app/state/poseStore.ts):
    - Central Zustand store managing all application state    
    - Bridge connection status, scene placements, poses, camera views    
    - Scene engine with undo/redo support          
    - Deferred scene synchronization    
2. Core Domain (src/core/):
    - scene-domain: Scene engine with command pattern, history, constraints         
    - bridge-runtime: WebSocket communication layer
    - engine: Capability system for features       
    - config: Runtime configuration from environment variables
3. Features (src/features/):          
    - Each feature follows hooks/model/ui structure
    - Lazy-loaded components for performance       
4. Planogram Domain (src/planogram/): 
    - 3D asset definitions and placements          
    - Room definitions       
    - Detection overlays and camera definitions    

Key Types (from src/planogram/types.ts):         
- Placement: Object placement in scene
- RoomDefinition: Room dimensions     
- MonitoringCameraDefinition: Camera configuration          
- DetectionBox2D: 2D detection boxes for camera overlays    

---  
6. Documentation

README.md: Not found in the project root         

CLAUDE.md: Empty file at /home/visiona/Work/care-simulator/puppet-studio/CLAUDE.md

Code Documentation:        
- Python files have docstrings (e.g., lib/analytics/hub.py) 
- TypeScript types are well-documented through type definitions        

---  
7. Testing Setup

JavaScript/TypeScript Tests:          
- Custom test script: npm run test:scene         
- Uses esbuild to bundle tests and run with Node.js         
- Tests directory referenced but not found in current checkout         

Python Tests:   
- Location: /home/visiona/Work/care-simulator/puppet-studio/lib/analytics/test_hub.py        
- Framework: pytest with pytest-asyncio          
- Tests for SpecialistSubscriber WebSocket communication    

---  
8. AI Assistant Rules      

Existing AI rules: None found         
- /home/visiona/Work/care-simulator/puppet-studio/.cursor/rules/: Does not exist  
- /home/visiona/Work/care-simulator/puppet-studio/.cursorrules: Does not exist    
- /home/visiona/Work/care-simulator/puppet-studio/.github/copilot-instructions.md: Does not exist       
- /home/visiona/Work/care-simulator/puppet-studio/CLAUDE.md: Empty file (0 bytes) 

---  
Important Files Summary    
┌─────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────┐    
│    Category     │  File Path   │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Entry Point     │ /home/visiona/Work/care-simulator/puppet-studio/src/main.tsx        │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Root Component  │ /home/visiona/Work/care-simulator/puppet-studio/src/App.tsx         │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ State Store     │ /home/visiona/Work/care-simulator/puppet-studio/src/app/state/poseStore.ts     │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Scene Engine    │ /home/visiona/Work/care-simulator/puppet-studio/src/core/scene-domain/sceneEngine.ts      │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Runtime Config  │ /home/visiona/Work/care-simulator/puppet-studio/src/core/config/runtimeConfig.ts          │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Main Page       │ /home/visiona/Work/care-simulator/puppet-studio/src/features/workspace/ui/pages/CadWorkspacePage.tsx │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Planogram Types │ /home/visiona/Work/care-simulator/puppet-studio/src/planogram/types.ts         │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Pose Controls   │ /home/visiona/Work/care-simulator/puppet-studio/src/poseControls.ts │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Ragdoll Config  │ /home/visiona/Work/care-simulator/puppet-studio/src/createConfig.ts │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Package Config  │ /home/visiona/Work/care-simulator/puppet-studio/package.json        │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Vite Config     │ /home/visiona/Work/care-simulator/puppet-studio/vite.config.ts      │    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Python Hub      │ /home/visiona/Work/care-simulator/puppet-studio/lib/analytics/hub.py│    
├─────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤    
│ Python Tests    │ /home/visiona/Work/care-simulator/puppet-studio/lib/analytics/test_hub.py      │    
└─────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────┘   