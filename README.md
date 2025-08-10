# 🧪 Minerva - Alchemy Recipe & Ingredient Manager

A full-stack web application for managing alchemy ingredients and recipes in the Minerva wordsmith game. Built with modern web technologies and organized as a monorepo for optimal development experience.

## 🏗️ Architecture

**Minerva** is a **monorepo** containing:

- **`packages/client/`** - Vue 3 frontend application
- **`packages/server/`** - Express.js backend API
- **Root workspace** - Shared configuration and build tools

### Tech Stack

- **Frontend**: Vue 3 + TypeScript + Vite + Pinia + Vue Router
- **Backend**: Node.js + Express.js + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **Package Manager**: pnpm (with workspace support)
- **Testing**: Vitest
- **Linting**: ESLint
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.11.0 or higher
- **pnpm** (recommended) or npm
- **Docker** and **Docker Compose** (for full-stack development)
- **PostgreSQL** (or use Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd minerva
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your database configuration
   # MINERVA_DATABASE_URL=postgresql://username:password@localhost:5432/minerva
   ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   pnpm --filter server prisma:generate

   # Run database migrations
   pnpm --filter server prisma:migrate
   ```

## 🛠️ Development

### Available Scripts

#### Root Workspace Commands
```bash
# Development with Docker (full-stack)
pnpm dev                    # Start all services with Docker Compose

# Individual package development
pnpm dev:client            # Start client dev server only
pnpm dev:server            # Start server dev server only

# Quality checks
pnpm test                  # Run all tests
pnpm lint                  # Run all linters
pnpm tsc                   # TypeScript compilation check
pnpm quality               # Run test + lint + tsc

# Build and cleanup
pnpm clean                 # Remove all build artifacts
pnpm build                 # Clean + install + build all packages
```

#### Package-Specific Commands
```bash
# Client package
cd packages/client
pnpm dev                   # Start Vite dev server (port 5173)
pnpm build                 # Build for production
pnpm test                  # Run client tests

# Server package
cd packages/server
pnpm dev                   # Start nodemon dev server (port 3000)
pnpm build                 # Build TypeScript
pnpm test                  # Run server tests

# Prisma commands (from server package)
pnpm prisma:generate       # Generate Prisma client
pnpm prisma:migrate        # Run database migrations
pnpm prisma:studio         # Open Prisma Studio
pnpm prisma:reset          # Reset database
```

### Development Workflow

1. **Start the development environment**
   ```bash
   pnpm dev
   ```
   This starts:
   - Client dev server on http://localhost:8080
   - Server dev server on http://localhost:3000
   - PostgreSQL database
   - Prisma service

2. **Make changes** to your code
   - Client changes auto-reload in the browser
   - Server changes auto-restart with nodemon

3. **Run quality checks**
   ```bash
   pnpm quality
   ```

4. **Build for production**
   ```bash
   pnpm build
   ```

## 🐳 Docker Development

### Development Environment
```bash
# Start all services
docker compose -f docker-compose.dev.yml up --build

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop services
docker compose -f docker-compose.dev.yml down
```

### Production Build
```bash
# Build production image
docker build -t minerva:latest .

# Run production container
docker run -p 3000:3000 -e MINERVA_DATABASE_URL=... minerva:latest
```

## 🧪 Testing

### Run All Tests
```bash
pnpm test
```

### Run Package-Specific Tests
```bash
# Client tests
cd packages/client && pnpm test

# Server tests
cd packages/server && pnpm test
```

### Test Coverage
```bash
# Client coverage
cd packages/client && pnpm test --coverage

# Server coverage
cd packages/server && pnpm test --coverage
```

## 📦 Build & Deployment

### Local Build
```bash
# Clean and build all packages
pnpm build

# Build output location
dist/
├── client/          # Client build artifacts
└── server/          # Server build artifacts
```

### Production Deployment
```bash
# Build production Docker image
docker build -t minerva:latest .

# Deploy with environment variables
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e MINERVA_DATABASE_URL=... \
  minerva:latest
```

## 🔧 Configuration

### TypeScript Configuration
- **Root**: `tsconfig.json` - Base configuration with project references
- **Build**: `tsconfig.build.json` - Build-specific configuration
- **Client**: `packages/client/tsconfig.json` - Vue-specific settings
- **Server**: `packages/server/tsconfig.json` - Node.js-specific settings

### ESLint Configuration
- **Root**: `eslint.config.mjs` - Monorepo-wide linting rules
- **Packages**: Use root ESLint installation via relative paths

### Package Management
- **pnpm-workspace.yaml** - Defines workspace packages
- **Root package.json** - Shared dev dependencies and scripts
- **Package package.json** - Package-specific dependencies and scripts

## 🚀 CI/CD Pipeline

The project uses **GitHub Actions** for continuous integration and deployment:

### Workflow Triggers
- **Push** to `main`, `master`, or `develop` branches
- **Pull Request** to `main` or `master` branches

### Pipeline Stages
1. **Quality Checks** (runs on every push/PR)
   - Install dependencies with pnpm caching
   - Generate Prisma client
   - Run tests, linting, and TypeScript checks
   - Build all packages

2. **Build & Deploy** (runs only on main/master)
   - Build Docker image with metadata
   - Push to Docker Hub with proper tagging
   - Use GitHub Actions cache for faster builds

### Docker Image Tags
- `devleo/minerva:latest` - Latest stable release
- `devleo/minerva:{{branch}}` - Branch-specific builds
- `devleo/minerva:{{sha}}` - Commit-specific builds

## 📁 Project Structure

```
minerva/
├── .github/workflows/          # CI/CD pipelines
├── packages/
│   ├── client/                 # Vue 3 frontend
│   │   ├── src/               # Source code
│   │   ├── types/             # Type definitions
│   │   ├── test/              # Client tests
│   │   └── package.json       # Client dependencies
│   └── server/                # Express.js backend
│       ├── src/               # Source code
│       ├── prisma/            # Database schema & migrations
│       ├── types/             # Type definitions
│       ├── test/              # Server tests
│       └── package.json       # Server dependencies
├── dist/                      # Build output (generated)
├── docker-compose.dev.yml     # Development environment
├── docker-compose.prod.yml    # Production environment
├── Dockerfile                 # Production Docker image
├── Dockerfile.dev             # Development Docker image
├── package.json               # Root workspace configuration
├── pnpm-workspace.yaml        # pnpm workspace definition
├── tsconfig.json              # Base TypeScript configuration
├── tsconfig.build.json        # Build TypeScript configuration
└── eslint.config.mjs          # ESLint configuration
```

## 🔍 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

#### TypeScript Errors
```bash
# Check TypeScript compilation
pnpm tsc

# Use build config for compilation
pnpm tsc --build tsconfig.build.json
```

#### Docker Issues
```bash
# Rebuild Docker images
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build
```

#### Database Connection Issues
```bash
# Check database status
docker compose -f docker-compose.dev.yml ps

# Reset database
pnpm --filter server prisma:reset
```

### Development Tips

1. **Use pnpm workspace commands** for cross-package operations
2. **Run quality checks** before committing: `pnpm quality`
3. **Use Docker Compose** for consistent development environment
4. **Check package.json scripts** for available commands
5. **Monitor build output** in `dist/` directory

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Run quality checks**: `pnpm quality`
5. **Submit a pull request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- [ ] Enhanced recipe management
- [ ] Ingredient inventory tracking
- [ ] Recipe sharing and collaboration
- [ ] Mobile-responsive design
- [ ] Advanced search and filtering
- [ ] Export/import functionality
- [ ] User authentication and profiles
- [ ] Recipe rating and reviews

---

**Happy brewing! 🧪✨**
