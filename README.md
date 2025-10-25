# 10xCards

**10xCards** is a web application designed to streamline the process of creating educational flashcards using artificial intelligence. The application enables users to generate high-quality flashcards from provided text and then integrates them with a ready-made spaced repetition algorithm. The MVP goal is to minimize the time and effort needed to create learning materials.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Application Architecture](#application-architecture)
- [Getting Started Locally](#getting-started-locally)
- [Docker Support](#docker-support)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

### Frontend

- **Astro 5.13** - Framework for building static sites with islands of interactivity
- **React 19** - Library for building user interfaces
- **TypeScript 5** - Typed JavaScript for better code quality
- **Tailwind CSS 4** - Utility-first CSS framework with responsive design utilities
- **Shadcn/ui** - UI components built on Radix UI and Tailwind CSS
- **Lucide React** - Icon library for consistent iconography across desktop and mobile

### Backend

- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Supabase SDK** - JavaScript client for communicating with Supabase
- **Supabase Auth** - Authentication system

### AI

- **Openrouter.ai** - API for various AI models (GPT-4, Claude, Llama, etc.)

### Testing

- **Vitest** - Framework for unit and integration tests
- **React Testing Library** - Tools for testing React components
- **Playwright** - End-to-end testing framework
- **MSW (Mock Service Worker)** - API mocking in tests
- **Axe-core** - Accessibility testing
- **@vitest/coverage-v8** - Code coverage

### CI/CD and Hosting

- **Github Actions** - CI/CD automation with workflows for testing, linting, and deployment
- **Cloudflare Pages** - Primary application hosting with edge functions
- **Docker** - Containerization with multi-stage builds for alternative deployment options
- **GitHub Container Registry (GHCR)** - Docker image registry for container-based deployments

## Features

### ✅ Implemented

#### User Authentication

- Registration and login with email and password
- Password reset via email
- Form validation with error messages
- Secure user sessions

#### AI Flashcard Generator

- Generate flashcards from text (1000-10000 characters)
- Integration with OpenRouter.ai (GPT-4, Claude, Llama)
- Text length validation and error messages
- Loading indicators during generation

#### Flashcard Review Process

- Review generated flashcards before saving
- Edit questions and answers
- Accept or reject individual flashcards
- Save accepted flashcards to database

#### Responsive Design & Navigation

- Fully responsive design for desktop, tablet, and mobile devices
- **Desktop Navigation:** User dropdown menu in header with profile access and logout
- **Mobile Navigation:** Bottom navigation bar with auth-aware items (guest: Home, Log In; auth: Home, Generate, Review, Profile)
- Adaptive header that adjusts based on screen size and authentication status
- Touch-friendly interface optimized for mobile interactions

#### Flashcard CRUD API

- Complete REST API for flashcard management (GET, POST, PATCH, DELETE)
- List flashcards with pagination (default: 20 per page, max: 100)
- Full-text search across front and back of flashcards (case-insensitive)
- Bulk flashcard creation (single or batch operations)
- Comprehensive validation and error handling
- Row-level security (RLS) ensuring users can only access their own flashcards
- 211 comprehensive tests (33 schema validation + 17 service + 25 API integration + 20 E2E)

#### Generation Metrics Tracking

- **REST API for Generation Logs** (`PATCH /api/generations/{id}`)
- Securely tracks the results of a user's review session
- Records how many flashcards were:
  - Accepted without editing (`accepted_unedited_count`)
  - Accepted after editing (`accepted_edited_count`)
  - Rejected (`rejected_count`)
- **Data Integrity Validation:** Ensures sum of counts matches total generated flashcards
- **Row-Level Security:** Users can only update their own generation logs
- **Comprehensive Error Handling:** Standardized error responses with proper HTTP status codes
- **Custom Error Classes:** Type-safe error handling with `GenerationError`
- **Feature Flags Support:** Integrates with application-wide feature flag system
- **Full Test Coverage:** 9 tests (3 service unit tests + 6 API integration tests)

### 📋 Planned

#### Spaced Repetition Algorithm

- Integration with spaced repetition library
- Learning progress tracking
- Review schedule

## Application Architecture

### Directory Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── generator/      # AI generator components
│   ├── review/         # Review process components
│   ├── ui/             # UI components (shadcn/ui)
│   └── views/          # Main application views
├── pages/              # Astro pages
│   ├── api/            # API endpoints
│   └── *.astro         # Application pages
├── layouts/            # Astro layouts
├── lib/                # Libraries and utilities
│   ├── hooks/          # Custom React hooks
│   ├── services/       # Services (API, auth)
│   ├── utils/          # Helper functions
│   └── validation/     # Validation schemas
├── db/                 # Database configuration
├── middleware/         # Astro middleware
└── styles/             # Global styles
```

### Main Application Views

#### 1. **Authentication** (`/login`, `/register`)

- **Goal:** User authentication
- **Key Information:** Login/registration forms, validation
- **Components:** `LoginForm`, `RegisterForm`, `ResetPasswordForm`

#### 2. **AI Generator** (`/generate`)

- **Goal:** Generate flashcards using AI
- **Key Information:** Text input, AI model selection, generation progress
- **Components:** `AIGeneratorView`, `TextInput`, `ModelSelector`

#### 3. **Review** (`/review`, `/review/[id]`)

- **Goal:** Review and edit generated flashcards
- **Key Information:**
  - `/review` - Review session finder that checks sessionStorage for active generations
  - `/review/[id]` - Review specific generation with flashcard candidates, editor, acceptance actions
- **Components:** `ReviewView`, `CandidateList`, `CandidateCard`, `ReviewActions`

#### 4. **Profile** (`/profile`)

- **Goal:** User profile management
- **Key Information:** User account details and settings
- **Components:** `ProfileView`

#### Navigation

- **Desktop Navigation:** User dropdown menu in header with email display, profile link, and logout button
- **Mobile Bottom Navigation:** Responsive navigation bar that appears on mobile devices
- **Navigation Items (authenticated):** Home (`/`), Generate (`/generate`), Review (`/review`), Profile (`/profile`)
- **Navigation Items (guest):** Home (`/`), Log In (`/login`)
- **Adaptive Behavior:** Automatically adjusts based on screen size and user authentication status

## Getting Started Locally

To run a local copy of the application, follow the steps below.

### Prerequisites

- **Node.js** (version 24 or newer - see `.nvmrc`)
- **npm** or **yarn**
- **Supabase Account** - for database and authentication
- **OpenRouter API Key** - for AI flashcard generation

### Installation Steps

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd 10x-cards
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env` and fill in the required values:

   ```bash
   cp .env.example .env
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Docker Support

The application includes full Docker support with multi-stage builds optimized for production deployments.

### Docker Configuration

- **Dockerfile** - Multi-stage build with Alpine Linux base image
- **docker-compose.yml** - Complete setup for local development
- **.dockerignore** - Optimized build context
- **GitHub Actions Workflow** - Automated Docker builds and pushes to GHCR (template)

### Quick Start with Docker

#### Prerequisites

- **Docker** (version 20.10 or newer)
- **Docker Compose** (version 2.0 or newer)
- **.env file** - Copy `.env.example` to `.env` and configure

#### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd 10x-cards

# Create and configure .env file
cp .env.example .env
# Edit .env with your credentials

# Build and start the container
docker-compose up --build

# Or run in detached mode (background)
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

Access the application at: [http://localhost:8080](http://localhost:8080)

#### Using Docker CLI

```bash
# Build the image
docker build -t 10x-cards:latest .

# Run the container
docker run -d \
  --name 10x-cards-app \
  -p 8080:8080 \
  --env-file .env \
  10x-cards:latest

# View logs
docker logs -f 10x-cards-app

# Stop and remove
docker stop 10x-cards-app
docker rm 10x-cards-app
```

### Docker Configuration Details

#### Environment Variables

The Docker setup uses `PUBLIC_ENV_NAME` to control the application environment:

- `local` - Local development (default)
- `integration` - Integration/staging environment
- `prod` - Production environment

Configure in your `.env` file:
```bash
PUBLIC_ENV_NAME=local
```

Or override at build time:
```bash
docker-compose build --build-arg PUBLIC_ENV_NAME=prod
```

#### Image Details

- **Base Image:** Node.js 24 Alpine Linux
- **Build Type:** Multi-stage (builder + runtime)
- **Image Size:** Optimized with production dependencies only
- **Security:** Runs as non-root user
- **Health Check:** Built-in HTTP health monitoring
- **Port:** 8080 (configurable via environment)

### CI/CD with Docker

The repository includes a GitHub Actions workflow template (`.github/workflows/.master-docker.yml`) for automated Docker builds:

- Lint and test code
- Build Docker image
- Tag with commit SHA
- Push to GitHub Container Registry (GHCR)
- Ready for deployment to cloud platforms

**To enable the workflow:**
1. Rename `.master-docker.yml` to `master-docker.yml`
2. Configure GitHub repository secrets
3. Uncomment the trigger section

### Deployment Options

#### Option 1: Cloudflare Pages (Current Default)
- Serverless deployment
- Edge functions
- Automatic scaling
- Configured in `astro.config.mjs`

#### Option 2: Docker Container
- Flexible deployment to any container platform
- Self-hosted or cloud (AWS ECS, GCP Cloud Run, Azure Container Instances)
- Full control over infrastructure
- Horizontal scaling with orchestration (Kubernetes, Docker Swarm)

## Available Scripts

In the project directory, you can run the following commands:

| Script                  | Description                               |
| ----------------------- | ----------------------------------------- |
| `npm run dev`           | Runs the application in development mode. |
| `npm run build`         | Builds the application for production.    |
| `npm run preview`       | Preview production build locally.         |
| `npm run lint`          | Lints code using ESLint.                  |
| `npm run lint:fix`      | Automatically fixes linting errors.       |
| `npm run format`        | Formats code using Prettier.              |
| `npm run test`          | Runs unit and integration tests.          |
| `npm run test:e2e`      | Runs end-to-end tests with Playwright.    |
| `npm run test:coverage` | Generates test coverage report.           |

## Testing

The project implements a comprehensive testing strategy covering different levels of testing:

### Unit and Integration Tests

**Framework:** Vitest + React Testing Library  
**Location:** `src/components/**/__tests__/`  
**Coverage:** React components, hooks, services, utility functions

**Test examples:**

```bash
# Run all unit tests
npm run test

# Run tests with code coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### End-to-End (E2E) Tests

**Framework:** Playwright  
**Location:** `e2e/`  
**Coverage:** Main user flows, API integration

**Main test scenarios:**

- User registration and login
- AI flashcard generation
- Review and saving process
- **Flashcard CRUD operations** (create, read, update, delete)
- **Pagination and search functionality**
- **Bulk flashcard creation**
- **Error handling and validation**
- Navigation between views

**Execution examples:**

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in headed mode (with UI)
npm run test:e2e:headed

# Run specific test file
npx playwright test generate.spec.ts
```

### Test Configuration

- **API Mocking:** MSW (Mock Service Worker)
- **Accessibility Testing:** @axe-core/playwright
- **Code Coverage:** @vitest/coverage-v8
- **Test Setup:** `src/test/setup.ts`

## Project Scope

### In Scope (MVP) ✅

- **User Authentication:** Secure user registration and login via email and password
- **AI Flashcard Generation:** Generate flashcards from user-provided text (1000-10000 characters)
- **Review Process:** Review, edit and accept generated flashcards before saving
- **Flashcard Management:** Complete CRUD API with pagination, search, and bulk operations
- **Validation and UX:** Form validation, loading indicators, error messages
- **Platform:** Web application only

### Out of Scope (Post-MVP)

- **Advanced spaced repetition algorithms** (e.g., custom SuperMemo-style implementation)
- **File imports** (PDF, DOCX, etc.)
- **Social features** (sharing flashcard decks)
- **Educational platform integrations**
- **Mobile applications** (iOS, Android)
- **Monetization and subscription systems**
- **Third-party authentication providers** (Google, Facebook, etc.)
- **Flashcard collections/tags** - grouping flashcards into decks
- **Export/Import functionality** - sharing flashcard sets

## Project Status

The project is currently in the **MVP development phase**.

### Implementation Progress

- ✅ **Authentication** - fully implemented with secure sessions
- ✅ **AI Generator** - fully implemented with multiple AI models
- ✅ **Review View** - fully implemented with edit and accept/reject functionality
- ✅ **Desktop & Mobile Navigation** - fully implemented with responsive design
- ✅ **Profile View** - fully implemented with user settings
- ✅ **Flashcard CRUD API** - fully implemented with pagination, search, and bulk operations
- ✅ **Generation Metrics API** - fully implemented with validation and security
- ✅ **Comprehensive Testing** - 200+ tests covering unit, integration, and E2E scenarios
- 📋 **Flashcard Dashboard UI** - planned (API ready, UI in progress)
- 📋 **Spaced Repetition Algorithm** - planned

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
