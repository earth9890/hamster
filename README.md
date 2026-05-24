# Hamster Chat

A premium random 1-to-1 video chat platform built with modern web technologies.

## Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** (dark theme)
- **Framer Motion** (animations)
- **Socket.IO Client**
- **Zustand** (state management)

### Backend
- **Node.js + Express**
- **TypeScript**
- **Socket.IO** (WebRTC signaling)
- **Redis** (matchmaking queues)
- **PostgreSQL** (sessions, reports, bans)

### Infrastructure
- **Docker Compose** (local development)
- **AWS/GCP/Azure** (production)

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (optional, for containerized development)

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development environment:

**Option A: Using Docker (Recommended)**
```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
npm run docker:up

# View logs
npm run docker:logs

# Stop services
npm run docker:down
```

**Option B: Local Development**
```bash
# Start backend
cd apps/backend
npm run dev

# Start frontend (in another terminal)
cd apps/frontend
npm run dev
```

4. Open your browser:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api
- Health check: http://localhost:3001/api/health

## Project Structure

```
hamster/
├── apps/
│   ├── frontend/          # Next.js frontend
│   ├── backend/           # Express + Socket.IO backend
│   └── shared/            # Shared TypeScript types
├── docker/                # Docker configurations
├── package.json           # Root package.json
└── turbo.json            # Turborepo config
```

## Development

### Commands

```bash
# Development
npm run dev              # Start all services in development mode
npm run build            # Build all packages
npm run lint             # Lint all packages

# Docker
npm run docker:up        # Start Docker containers
npm run docker:down      # Stop Docker containers
npm run docker:logs      # View Docker logs

# Utility
npm run clean            # Clean build artifacts
npm run format           # Format code with Prettier
```

## Configuration

### Environment Variables

See `.env.example` for all available environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | - |
| `TURN_SERVER_URL` | TURN server URL | (optional) |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:3000` |

### TURN/STUN Servers

For development, free Google STUN servers are included. For production:

1. **Twilio Network Traversal**: [twilio.com](https://www.twilio.com/stun-turn)
2. **Xirsys**: [xirsys.com](https://www.xirsys.com)
3. **Self-hosted coturn**: [github.com/coturn/coturn](https://github.com/coturn/coturn)

## Features

- ✅ Real-time video chat via WebRTC
- ✅ Random matching with Redis queues
- ✅ Country & language filters
- ✅ Text chat alongside video
- ✅ Privacy-first (no accounts, no recording)
- ✅ Premium dark UI with animations
- 🚧 Reporting & moderation (in progress)
- 🚧 Mobile app support (planned)

## License

MIT

---

Built with ❤️ using modern web technologies.
