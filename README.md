# DevUtils

A modern, beautiful collection of developer tools for developers.

## 🚀 Quick Start

### Local Development

```bash
# Switch to Node.js 22
nvm use 22

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For more details, see the [Setup Guide](./docs/SETUP.md).

## ✨ Features

- 🎨 **6 Beautiful Themes** - Light, Dark, Orange, Purple, Blue, Green
- 📱 **PWA Support** - Install as an app, works offline
- 🍎 **Apple Design** - Glassmorphism, rounded components, smooth animations
- 🧭 **Intuitive Navigation** - Collapsible sidebar with smooth animations
- 🔐 **Authentication** - Google OAuth authentication
- 📝 **Notes Management** - Organize notes with groups, tabs, and database persistence
- 🔧 **API Testing** - Test APIs with configurable environments and variables
- 👥 **User Management** - Role-based access control (Admin/User)
- 🔔 **Notifications** - Real-time notifications with read/unread states
- 💬 **Feedback System** - User feedback with admin management
- 🎯 **Landing Page** - Beautiful landing page with animations and testimonials

## 📚 Documentation

- [Setup Guide](./docs/SETUP.md) - Detailed installation instructions
- [Contributing](./docs/CONTRIBUTING.md) - How to contribute
- [Architecture](./docs/ARCHITECTURE.md) - Technical overview
- [Icons Setup](./docs/ICONS.md) - PWA icon requirements

## 🛠️ Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - UI components
- **PWA** - Offline support
- **MongoDB** - Database
- **NextAuth.js** - Authentication
- **Framer Motion** - Animations

## 📁 Project Structure

```
DevUtils/
├── app/              # Next.js pages and routes
│   ├── (auth)/      # Authentication pages
│   ├── admin/       # Admin pages
│   ├── api/         # API routes
│   ├── notes/       # Notes feature
│   └── feedback/    # Feedback page
├── components/       # React components
│   ├── layout/      # Sidebar, Navbar, Footer
│   ├── landing/     # Landing page components
│   └── ui/          # Reusable UI components
├── lib/             # Utilities and configurations
│   ├── models/      # MongoDB models
│   └── auth.ts      # Authentication config
├── public/          # Static assets
└── docs/            # Documentation
```

## 🎯 Current Status

✅ Project setup complete
✅ Theme system implemented
✅ Sidebar navigation
✅ Sign-in page with Google OAuth
✅ PWA configuration
✅ Documentation
✅ Notes feature with database persistence
✅ API testing tools
✅ User management with role-based access control
✅ Notifications system with read/unread states
✅ Feedback system for users
✅ Landing page with animations
✅ Admin notification management

## 📝 Notes

- Make sure to use Node.js 20 or higher (`nvm use 20`)
- PWA icons need to be added (see [ICONS.md](./docs/ICONS.md))
- Service worker is configured for offline support
- Environment variables are required - see [Setup Guide](./docs/SETUP.md) for details

## 🤝 Contributing

See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

## 📄 License

[Add your license here]
