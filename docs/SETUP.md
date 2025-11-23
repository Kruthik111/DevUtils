# DevUtils - Setup Guide

## Prerequisites

- Node.js 22.x or higher
- npm or yarn package manager
- nvm (Node Version Manager) - recommended

## Installation

### 1. Switch to Node.js 22

```bash
nvm use 22
```

If you don't have Node.js 22 installed:
```bash
nvm install 22
nvm use 22
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
notelt/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes group
│   │   └── sign-in/       # Sign-in page
│   ├── notes/             # Notes feature
│   ├── test-tool/         # Test tool feature
│   ├── handle-server/     # Server health monitoring
│   ├── db-check/          # Repetitive DB check
│   ├── extension/         # Extension download
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── features/          # Feature-specific components
│   ├── layout/           # Layout components (Sidebar, Navbar)
│   ├── providers/        # Context providers (Theme)
│   └── ui/               # Reusable UI components
├── lib/
│   ├── theme-config.ts   # Theme configuration
│   └── utils.ts          # Utility functions
├── public/
│   ├── manifest.json     # PWA manifest
│   └── sw.js            # Service worker
└── docs/                # Documentation
```

## Technologies Used

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - UI component library (Radix UI primitives)
- **next-themes** - Theme management
- **lucide-react** - Icon library
- **PWA Support** - Offline functionality and app installation

## Environment Setup

Currently, no environment variables are required. Future backend integration may require:
- API endpoints
- Authentication keys
- Database connection strings

## Building for Production

```bash
npm run build
npm start
```

## PWA Installation

The app can be installed as a Progressive Web App (PWA):

1. Open the app in a supported browser (Chrome, Edge, Safari)
2. Look for the install prompt or use browser menu
3. Click "Install" to add to home screen/desktop

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers with PWA support

