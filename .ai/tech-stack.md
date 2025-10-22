Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testy - Kompleksowe rozwiązania testowe:

- Testy jednostkowe i integracyjne: Vitest - nowoczesny, szybki framework doskonale integrujący się z ekosystemem Vite/Astro
- Testowanie komponentów React: React Testing Library - do testowania komponentów w sposób, w jaki używają ich użytkownicy
- Testy End-to-End (E2E): Playwright - zaawansowane narzędzie do automatyzacji przeglądarek, umożliwiające pisanie stabilnych i szybkich testów E2E
- Mockowanie API: MSW (Mock Service Worker) - przechwytywanie żądań HTTP na poziomie sieci
- Testy dostępności: Axe-core - do automatycznych testów dostępności w testach jednostkowych i E2E
- Pokrycie kodu: @vitest/coverage-v8 do generowania raportów pokrycia testów

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD
- DigitalOcean do hostowania aplikacji za pośrednictwem obrazu docker
