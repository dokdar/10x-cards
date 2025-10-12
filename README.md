# 10xCards

10xCards is a web application designed to streamline the creation of educational flashcards using Artificial Intelligence. It allows users to generate high-quality flashcards from provided text and integrates them with a spaced repetition algorithm to make learning more efficient and accessible.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

| Category      | Technology                                                              |
|---------------|-------------------------------------------------------------------------|
| **Frontend**  | Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/UI              |
| **Backend**   | Supabase (PostgreSQL, BaaS, Authentication)                             |
| **AI**        | OpenRouter.ai (Access to OpenAI, Anthropic, Google models)              |
| **CI/CD & Hosting** | GitHub Actions, DigitalOcean (Docker)                               |

## Getting Started Locally

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js `22.14.0`
- npm (Node Package Manager)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/10x-cards.git
    cd 10x-cards
    ```

2.  **Set the Node.js version:**
    If you are using `nvm` (Node Version Manager), run the following command to use the correct Node.js version:
    ```sh
    nvm use
    ```

3.  **Install NPM packages:**
    ```sh
    npm install
    ```

4.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the necessary environment variables for Supabase and OpenRouter.
    ```env
    # .env
    # Supabase Configuration
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_anon_key
    
    # OpenRouter API Configuration
    OPENROUTER_API_KEY=your_openrouter_api_key
    OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
    
    # AI Generation Settings (optional)
    AI_GENERATION_TIMEOUT=60000
    AI_MAX_RETRIES=3
    ```

5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

## Available Scripts

In the project directory, you can run the following commands:

| Script       | Description                                  |
|--------------|----------------------------------------------|
| `npm run dev`    | Runs the app in development mode.            |
| `npm run build`  | Builds the app for production.               |
| `npm run preview`| Previews the production build locally.       |
| `npm run lint`   | Lints the codebase using ESLint.             |
| `npm run lint:fix`| Fixes linting errors automatically.          |
| `npm run format` | Formats the code using Prettier.             |

## Project Scope

### In Scope (MVP)

-   **User Authentication:** Secure user registration and login via email and password.
-   **AI Flashcard Generation:** Generate flashcards from user-provided text (1,000-10,000 characters).
-   **Manual CRUD:** Manually create, read, update, and delete flashcards.
-   **Flashcard Management:** View all flashcards with simple pagination and text-based search.
-   **Spaced Repetition:** Integration with an open-source library for spaced repetition.
-   **Platform:** The application will be available as a web version only.

### Out of Scope (Post-MVP)

-   Advanced spaced repetition algorithms (e.g., custom SuperMemo-style implementation).
-   Importing files (PDF, DOCX, etc.).
-   Social features like sharing flashcard decks.
-   Integrations with external educational platforms.
-   Mobile applications (iOS, Android).
-   Monetization and subscription systems.
-   Third-party authentication providers (Google, Facebook, etc.).

## Project Status

The project is currently in the **MVP development phase**.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
