# Contributing to DevUtils

Thank you for your interest in contributing to DevUtils! This document provides guidelines and information for contributors.

## Getting Started

1. **Fork the repository** (if applicable)
2. **Clone your fork** or the main repository
3. **Switch to Node.js 22**:
   ```bash
   nvm use 22
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start the development server**:
   ```bash
   npm run dev
   ```

## Code Style Guidelines

### Component Structure

- Use functional components with TypeScript
- Follow the existing component organization:
  - `components/ui/` - Reusable UI primitives
  - `components/layout/` - Layout components
  - `components/features/` - Feature-specific components
  - `components/providers/` - Context providers

### Naming Conventions

- **Files**: Use kebab-case (e.g., `theme-provider.tsx`)
- **Components**: Use PascalCase (e.g., `ThemeProvider`)
- **Functions/Variables**: Use camelCase (e.g., `handleClick`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_ITEMS`)

### TypeScript

- Always define types for props and function parameters
- Use interfaces for object shapes
- Avoid `any` type - use `unknown` if type is truly unknown

### Styling

- Use Tailwind CSS utility classes
- Follow Apple design system principles:
  - Glassmorphism (backdrop-blur, transparency)
  - Rounded corners (rounded-xl, rounded-2xl, rounded-3xl)
  - Subtle shadows (shadow-lg, shadow-xl)
  - Smooth transitions (transition-all duration-200)
- Use the `cn()` utility for conditional classes

### Example Component

```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export function Button({ label, onClick, variant = "primary" }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-xl transition-all duration-200",
        variant === "primary" && "bg-primary text-background",
        variant === "secondary" && "bg-secondary text-secondary-foreground"
      )}
    >
      {label}
    </button>
  );
}
```

## Project Architecture

### Theme System

Themes are managed through `next-themes` and configured in `lib/theme-config.ts`. To add a new theme:

1. Add theme name to `Theme` type
2. Add theme to `themes` array
3. Add theme configuration to `themeConfig` object
4. Add CSS variables in `app/globals.css`

### State Management

- Use React hooks (`useState`, `useEffect`) for local state
- Use `localStorage` for persistence (as specified)
- Future: Consider Zustand or Context API for global state

### Routing

- Use Next.js App Router
- Route groups: `(auth)` for authentication routes
- Dynamic routes: Use `[param]` syntax when needed

## Feature Development

### Adding a New Feature

1. Create a new route in `app/[feature-name]/page.tsx`
2. Add navigation item in `components/layout/sidebar.tsx`
3. Create feature-specific components in `components/features/[feature-name]/`
4. Update documentation if needed

### Notes Feature (Future)

- Notes will be grouped by tabs (like browser tabs)
- Each note can be:
  - Text/command (with copy functionality)
  - Link (with redirect)
  - Todo item (with checkbox)
- All data stored in `localStorage`
- Support for passive/active copy modes

## Testing

Currently, manual testing is expected. Future additions:
- Unit tests with Jest/Vitest
- Component tests with React Testing Library
- E2E tests with Playwright

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the code style
3. Test your changes thoroughly
4. Update documentation if needed
5. Submit a pull request with a clear description

## Questions?

If you have questions or need clarification, please:
- Check existing documentation
- Review similar code in the codebase
- Ask in discussions/issues

## License

[Add license information here]

