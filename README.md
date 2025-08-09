# Collin's Signatures

A modern web application for creating and customizing baseball signature designs with interactive 3D visualization and texture generation.

## Features

- **Interactive 3D Baseball Studio**: Design signatures on a realistic spinning baseball using Three.js
- **Real-time Signature Customization**: Adjust colors, styles, and positioning with live preview
- **Texture Export**: Export your signature designs as high-quality textures
- **Video Export**: Generate rotating baseball videos showcasing your signature
- **Project Management**: Save and load your signature projects
- **Gallery**: Browse and explore signature presets
- **Responsive Design**: Optimized for desktop and mobile devices

## Technology Stack

- **Frontend Framework**: React 19.1.1 with modern hooks
- **3D Graphics**: Three.js with @react-three/fiber and @react-three/drei
- **Animations**: Framer Motion for smooth transitions
- **Styling**: Tailwind CSS 4.1.11 with PostCSS
- **Routing**: React Router DOM 7.8.0
- **State Management**: Zustand for global state
- **Validation**: Zod for schema validation
- **Icons**: Lucide React
- **Backend**: Firebase for project storage and management
- **Build Tool**: Vite 7.1.0 for fast development and building

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd baseball-sigs
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm start` - Alternative start command using npx vite  
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/
│   └── AppShell.jsx          # Main application layout
├── components/
│   ├── gallery/
│   │   └── PresetPreview.jsx # Gallery preset components
│   ├── panel/
│   │   ├── SignaturePanel.jsx # Main control panel
│   │   ├── LabeledSlider.jsx  # Reusable slider component
│   │   ├── ExportTextureButton.jsx # Texture export functionality
│   │   └── VideoExportButton.jsx   # Video export functionality
│   ├── project/
│   │   ├── ProjectListDialog.jsx   # Project management dialogs
│   │   └── SaveProjectDialog.jsx
│   ├── three/
│   │   ├── SpinningBaseball.jsx    # 3D baseball component
│   │   └── Stage.jsx               # Three.js stage setup
│   └── ui/
│       ├── ThemeMenu.jsx           # Theme selection
│       └── Toolbar.jsx             # Main toolbar
├── hooks/
│   └── useBaseballTexture.js       # Custom texture generation hook
├── lib/
│   ├── drawBaseballTexture.js      # Canvas texture drawing utilities
│   ├── firebase.js                 # Firebase configuration
│   └── seededRandom.js             # Deterministic random generation
├── pages/
│   ├── Studio.jsx                  # Main signature studio page
│   ├── Gallery.jsx                 # Signature gallery page
│   └── About.jsx                   # About page
├── services/
│   └── projectService.js           # Project CRUD operations
└── store/
    └── sigStore.js                 # Zustand state management
```

## Firebase Setup

This application uses Firebase for project storage. To set up Firebase:

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Update the Firebase configuration in `src/lib/firebase.js`
4. Configure Firestore security rules in `firestore.rules`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## Development Notes

- The application uses modern React features including hooks and functional components
- Three.js integration provides smooth 3D rendering with hardware acceleration
- Tailwind CSS is configured with custom styling for the signature theme
- ESLint is configured with React-specific rules for code quality
- The build system uses Vite for fast hot-reload development

## License

This project is private and proprietary.

## Support

For questions or issues, please contact the development team.