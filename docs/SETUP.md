# DevUtils - Setup Guide

## Prerequisites

- Node.js 20.x or higher
- npm or yarn package manager
- nvm (Node Version Manager) - recommended
- MongoDB (local or cloud instance)

## Installation

### 1. Switch to Node.js 20 or Higher

```bash
nvm use 20
```

If you don't have Node.js 20 installed:
```bash
nvm install 20
nvm use 20
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root with the following:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/devutils

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET

# Google OAuth (required for Google sign-in)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
```

Replace the placeholder values with:
- **MONGODB_URI**: Your MongoDB connection string (defaults to `mongodb://localhost:27017/devutils` if not provided)
- **NEXTAUTH_SECRET**: A random secret string for NextAuth (generate with: `openssl rand -base64 32`)
- **Google OAuth credentials**: Get these from Google Cloud Console. See [GOOGLE_OAUTH_SETUP.md](../GOOGLE_OAUTH_SETUP.md) for detailed instructions.

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
DevUtils/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes group
│   │   └── sign-in/       # Sign-in page
│   ├── admin/             # Admin pages
│   │   ├── users/         # User management
│   │   └── notifications/ # Notification management & feedbacks
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication APIs
│   │   ├── feedback/      # Feedback API
│   │   ├── notifications/ # Notifications APIs
│   │   ├── notes/         # Notes APIs
│   │   └── api-configs/   # API testing APIs
│   ├── notes/             # Notes feature
│   ├── api/               # API testing page
│   ├── feedback/          # User feedback page
│   ├── profile/           # User profile
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/
│   ├── landing/           # Landing page components
│   ├── layout/            # Layout components (Sidebar, Navbar, Footer, Notifications)
│   ├── notes/             # Notes feature components
│   ├── providers/         # Context providers (Theme, Auth, Sidebar)
│   └── ui/                # Reusable UI components (shadcn/ui)
├── lib/
│   ├── models/            # MongoDB models (User, Note, Notification, etc.)
│   ├── auth.ts            # NextAuth configuration
│   ├── mongodb.ts         # MongoDB connection
│   ├── theme-config.ts    # Theme configuration
│   └── utils.ts           # Utility functions
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── logo.png           # Primary brand logo and icon
└── docs/                  # Documentation
```

## Technologies Used

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - UI component library (Radix UI primitives)
- **next-themes** - Theme management
- **NextAuth.js** - Authentication (Google OAuth)
- **MongoDB** - Database with Mongoose ODM
- **Framer Motion** - Animations
- **lucide-react** - Icon library
- **sonner** - Toast notifications
- **PWA Support** - Offline functionality and app installation

## Environment Setup

Create a `.env.local` file in the project root with the following placeholders:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/devutils

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=YOUR_NEXTAUTH_SECRET

# Google OAuth (required for Google sign-in)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
```

Replace the placeholder values with:
- **MONGODB_URI**: Your MongoDB connection string (defaults to `mongodb://localhost:27017/devutils` if not provided)
- **NEXTAUTH_SECRET**: A random secret string for NextAuth (generate with: `openssl rand -base64 32`)
- **Google OAuth credentials**: Get these from Google Cloud Console. The public client ID controls whether the Google sign-in button is enabled in the UI.

## Building for Production

```bash
npm run build
npm start
```

## Features

### Authentication
- Google OAuth sign-in
- Session-based authentication with NextAuth.js
- Protected routes for authenticated users

### Notes Management
- Create, edit, and delete notes
- Organize notes into groups and tabs
- Markdown support
- Search and filter functionality
- Persistent storage in MongoDB

### API Testing
- Configure and test APIs
- Multiple environments support
- Headers and parameters configuration
- Request history

### User Management (Admin Only)
- View all users
- Manage user roles (Admin/User)
- Suspend/activate users
- Delete users

### Notifications
- Real-time notifications
- Read/unread states
- Click to navigate to related pages
- 12 notification limit per user (no limit for admins)

### Feedback System
- Users can submit feedback
- Admin can view all feedbacks in accordion format
- Feedbacks create notifications for admins

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

