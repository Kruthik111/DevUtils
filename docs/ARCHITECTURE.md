# DevUtils - Architecture Overview

## Design Principles

### Apple Design System

The application follows Apple's design language:

- **Glassmorphism**: Transparent backgrounds with backdrop blur
- **Rounded Components**: Extensive use of rounded corners (xl, 2xl, 3xl)
- **Subtle Shadows**: Layered shadows for depth
- **Smooth Animations**: 200ms transitions with easing
- **Minimal UI**: Clean, focused interface

### Component Hierarchy

```
RootLayout
├── ThemeProvider (Theme management)
├── Navbar (Top navigation with theme selector)
├── Sidebar (Right-side navigation)
└── Main Content (Page-specific content)
```

## Theme System

### Implementation

Themes are implemented using:
- `next-themes` for theme management
- CSS custom properties for theme variables
- `data-theme` attribute on HTML element

### Available Themes

1. **Light** - Default light theme
2. **Dark** - Dark mode
3. **Orange** - Warm orange theme
4. **Purple** - Purple accent theme
5. **Blue** - Blue accent theme
6. **Green** - Green accent theme

### Adding Themes

Themes are defined in:
- `lib/theme-config.ts` - Theme configuration object
- `app/globals.css` - CSS variable definitions

## PWA Support

### Service Worker

- Located at `public/sw.js`
- Implements cache-first strategy
- Caches main routes for offline access

### Manifest

- Located at `public/manifest.json`
- Defines app metadata
- Enables installation as standalone app

## State Management

### Current Approach

- **Local State**: React hooks (`useState`, `useEffect`)
- **Persistence**: `localStorage` (for notes, todos, etc.)
- **Theme**: `next-themes` context

### Future Considerations

As the app grows, consider:
- **Zustand** - For global state management
- **React Query** - For server state (when backend is added)
- **Context API** - For feature-specific state

## Routing Structure

```
/                    → Redirects to /sign-in
/sign-in            → Authentication page
/notes              → Notes feature (with tabs)
/test-tool          → Test tool (blank for now)
/handle-server      → Server health monitoring
/db-check           → Repetitive DB check
/extension          → Extension download
```

## Component Organization

### `/components/ui`

Reusable UI primitives built on Radix UI:
- `tooltip.tsx` - Tooltip component
- Future: button, input, dialog, etc.

### `/components/layout`

Layout components:
- `sidebar.tsx` - Right-side navigation
- `navbar.tsx` - Top navigation bar

### `/components/features`

Feature-specific components (to be added):
- `notes/` - Notes-related components
- `test-tool/` - Test tool components
- etc.

### `/components/providers`

Context providers:
- `theme-provider.tsx` - Theme context wrapper

## Data Storage

### LocalStorage Structure (Planned)

```typescript
{
  "devutils-notes": {
    tabs: [
      {
        id: "work",
        name: "Work",
        notes: [
          {
            id: "note-1",
            type: "text" | "link" | "todo",
            content: "...",
            copyMode: "passive" | "active",
            completed: boolean // for todos
          }
        ]
      }
    ]
  },
  "devutils-settings": {
    theme: "light",
    // other settings
  }
}
```

## Future Backend Integration

### Planned Structure

When backend is integrated:

1. **API Routes**: Next.js API routes in `app/api/`
2. **Authentication**: Google OAuth integration
3. **Database**: User data, notes sync
4. **Real-time**: WebSocket for server health updates

### Migration Path

- Keep `localStorage` as fallback
- Add sync functionality
- Progressive enhancement approach

## Performance Considerations

### Current Optimizations

- Next.js automatic code splitting
- Image optimization (when images are added)
- Font optimization (Geist fonts)

### Future Optimizations

- Lazy loading for feature components
- Virtual scrolling for long lists
- Service worker caching strategies
- Bundle size monitoring

## Accessibility

### Current Implementation

- Semantic HTML
- Keyboard navigation support
- ARIA labels (to be added)

### Future Improvements

- Screen reader optimization
- Focus management
- Color contrast validation
- Keyboard shortcuts

## Security

### Current

- No sensitive data handling yet

### Future

- JWT token storage (secure)
- API authentication
- Input sanitization
- XSS prevention

