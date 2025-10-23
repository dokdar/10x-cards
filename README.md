# 10xCards by DB

**10xCards** is a web application designed to streamline the process of creating educational flashcards using artificial intelligence. The application enables users to generate high-quality flashcards from provided text and then integrates them with a ready-made spaced repetition algorithm. The MVP goal is to minimize the time and effort needed to create learning materials.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Application Architecture](#application-architecture)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

### Frontend

- **Astro** - Framework for building static sites with islands of interactivity
- **React** - Library for building user interfaces
- **TypeScript** - Typed JavaScript for better code quality
- **Tailwind CSS** - Utility-first CSS framework with responsive design utilities
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

- **Github Actions** - CI/CD automation
- **DigitalOcean** - Application hosting

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

#### Responsive Design & Mobile Navigation

- Fully responsive design for desktop, tablet, and mobile devices
- Mobile-first bottom navigation with auth-aware items (guest: Home, Log In; auth: Home, Generate, Review, Profile)
- Adaptive header that hides on mobile when bottom navigation is active
- Touch-friendly interface optimized for mobile interactions

### 🚧 In Progress

#### Flashcard Dashboard

- Display all user flashcards
- Pagination and text search
- Basic CRUD operations on flashcards

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

#### 4. **Dashboard** (`/dashboard`) - _in progress_

- **Goal:** Manage saved flashcards
- **Key Information:** Flashcard list, search, pagination
- **Components:** `FlashcardList`, `SearchBar`, `Pagination`

#### 5. **Profile** (`/profile`)

- **Goal:** User profile management
- **Key Information:** User account details and settings
- **Components:** `ProfileView`

#### Mobile Navigation

- **Bottom Navigation Bar:** Responsive navigation component that appears on mobile devices
- **Navigation Items (authenticated):** Home (`/`), Generate (`/generate`), Review (`/review`), Profile (`/profile`)
- **Navigation Items (guest):** Home (`/`), Log In (`/login`)
- **Adaptive Behavior:** Automatically shows/hides based on screen size and user authentication status

## Getting Started Locally

To run a local copy of the application, follow the steps below.

### Prerequisites

- **Node.js** (version 18 or newer)
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
   Navigate to [http://localhost:4321](http://localhost:4321) in your browser.

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
- **Full flashcard CRUD** - currently in implementation phase
- **Dashboard with pagination and search** - currently in implementation phase

## Project Status

The project is currently in the **MVP development phase**.

### Implementation Progress

- ✅ **Authentication** - fully implemented
- ✅ **AI Generator** - fully implemented
- ✅ **Review View** - fully implemented
- ✅ **E2E Tests** - comprehensive coverage of main flows
- ✅ **Unit Tests** - coverage of components and services
- 🚧 **Flashcard Dashboard** - in progress
- 🚧 **Spaced Repetition Algorithm** - planned
- 🚧 **API endpoints** - partially implemented

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
