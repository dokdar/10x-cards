# Analiza rozwiązań hostingowych dla aplikacji 10x-cards

Data analizy: 2025-10-24

## 1. Analiza głównego frameworka

**Astro 5** to główny framework aplikacji. Jest to nowoczesny meta-framework JavaScript z architekturą "wysp" (islands architecture), który domyślnie generuje w pełni statyczne strony HTML z minimalnym JavaScript. Model operacyjny Astro jest **hybrydowy**:

- **Static Site Generation (SSG)**: Generowanie stron w czasie buildu
- **Server-Side Rendering (SSR)**: Renderowanie na żądanie po stronie serwera
- **Hybridowy**: Możliwość mieszania obu podejść w jednej aplikacji

**Kluczowa implikacja:** W zależności od wybranego trybu, aplikacja może wymagać tylko statycznego hostingu (SSG) lub pełnego środowiska Node.js runtime (SSR). Obecność Dockera w projekcie sugeruje planowanie trybu SSR lub hybrydowego.

## 2. Rekomendowane usługi hostingowe

### 2.1 Vercel
Platforma deployment zoptymalizowana pod Next.js i Astro, oferuje automatyczne buildy z Git, serverless functions, edge runtime i globalne CDN.

### 2.2 Netlify
Konkurent Vercela z podobnymi funkcjami, oficjalny adapter Astro, świetna integracja z Git, serverless functions i edge functions.

### 2.3 Cloudflare Pages
Platforma JAMstack od Cloudflare, wykorzystująca ich globalną sieć CDN i Workers do edge computing, bardzo szybka i tania.

## 3. Alternatywne platformy

### 3.1 Fly.io
Globalna platforma do deploymentu kontenerów Docker z edge computing, uruchamiająca aplikacje blisko użytkowników na całym świecie. Doskonałe wsparcie dla aplikacji Node.js w kontenerach.

### 3.2 Railway
Nowoczesne PaaS z automatyczną detekcją Dockerfile, prostym CI/CD, bazami danych out-of-the-box i przejrzystym pricingiem. Idealne dla startupów przechodzących z hobby do komercyjnego produktu.

## 4. Krytyka rozwiązań

### 4.1 Vercel

**Wady:**
- **a) Wdrażanie:** Minimalnie złożone - wymaga dodania adaptera `@astrojs/vercel` i konfiguracji, ale proces jest bardzo dobrze udokumentowany
- **b) Kompatybilność:** Doskonała, ale vendor lock-in - używanie Vercel Functions zamiast standardowych API routes może utrudnić migrację
- **c) Środowiska:** Brak problemów - automatyczne preview dla PR-ów, ale każdy preview zużywa bandwidth z limitu
- **d) Subskrypcja:**
  - **KRYTYCZNE:** Plan Hobby (darmowy) zabrania użytku komercyjnego - nawet jedna reklama dyskwalifikuje projekt
  - Plan Pro ($20/miesiąc) jest obowiązkowy od dnia 1 dla produktu komercyjnego
  - Bandwidth może być drogi przy skalowaniu ($40/1TB ponad limit)
  - Brak elastyczności cenowej między hobby a Pro

**Zalety:**
- Najlepsza developer experience na rynku
- Doskonała dokumentacja i community support
- Automatyczne optymalizacje performance

### 4.2 Netlify

**Wady:**
- **a) Wdrażanie:** Podobna złożoność do Vercela, ale mniej intuicyjna dokumentacja adaptera
- **b) Kompatybilność:** Dobra, ale Netlify Functions mają zimne starty (cold starts) - może wpłynąć na UX
- **c) Środowiska:** Solidne, ale branch deploys zużywają build minutes
- **d) Subskrypcja:**
  - Plan Starter (darmowy) teoretycznie pozwala na komercyjne użycie, ale 300 build minutes może być za mało przy aktywnym rozwoju
  - Limity serverless functions (125k requests/miesiąc w Pro) mogą być problemem
  - Background functions (długie) są drogie

**Zalety:**
- Bardziej liberalny free tier w kontekście komercyjnego użycia
- Dobre narzędzia do A/B testingu i split testing

### 4.3 Cloudflare Pages

**Wady:**
- **a) Wdrażanie:** Wymaga zrozumienia ograniczeń Cloudflare Workers runtime - nie pełny Node.js
- **b) Kompatybilność:**
  - **POWAŻNE:** Cloudflare Workers nie mają dostępu do file system, ograniczone Node.js APIs
  - Niektóre biblioteki Node.js mogą nie działać (np. pewne ORM-y, biblioteki do przetwarzania obrazów)
  - Supabase JS powinien działać, ale warto przetestować
- **c) Środowiska:** Podstawowe - brak tak zaawansowanych narzędzi jak u konkurencji
- **d) Subskrypcja:**
  - CPU time limits na Free (10ms per request) i Pro (50ms) mogą być problemem dla złożonych operacji
  - Brak tradycyjnych serverless functions - tylko Workers

**Zalety:**
- Unlimited bandwidth na free tier - ogromna przewaga finansowa
- Najszybsze CDN na świecie
- Bardzo tanie skalowanie

### 4.4 Fly.io

**Wady:**
- **a) Wdrażanie:**
  - Wymaga CLI i ręcznej konfiguracji `fly.toml`
  - Trzeba rozumieć koncepty VM, regions, scaling
  - Brak automatycznego CI/CD - trzeba integrować z GitHub Actions samodzielnie
- **b) Kompatybilność:** Pełna, ale wymaga prawidłowej konfiguracji Dockerfile
- **c) Środowiska:**
  - **PROBLEMATYCZNE:** Każde środowisko to osobna aplikacja = osobny koszt
  - Trzeba ręcznie zarządzać zmiennymi środowiskowymi per app
  - Brak automatycznych PR previews
- **d) Subskrypcja:**
  - Free tier: 3 VMs shared-cpu-1x (256MB) - może być za mało dla SSR z React
  - Pricing może być nieprzewidywalny przy wzroście trafficu
  - Płacisz za running time VMs nawet bez trafficu (chyba że autostop)

**Zalety:**
- Pełna kontrola nad środowiskiem
- Globalny edge deployment (aplikacje blisko użytkowników)
- Brak vendor lock-in dzięki Docker

### 4.5 Railway

**Wady:**
- **a) Wdrażanie:** Najprostsza z platform kontenerowych, ale mniej "magiczna" niż Vercel/Netlify
- **b) Kompatybilność:** Pełna, wykrywa Dockerfile automatycznie
- **c) Środowiska:**
  - Każde środowisko to osobny koszt (jak Fly.io)
  - PR environments są płatne
- **d) Subskrypcja:**
  - **KRYTYCZNE:** Free tier daje tylko $5 usage/miesiąc - to ~100-150h małej usługi
  - Dla hobby project z niskim trafficem może starczyć, ale development + staging + production = 3x koszt
  - Developer plan ($5/miesiąc) to tylko $5 dodatkowego kredytu - łatwo przekroczyć przy testowaniu
  - Pay-as-you-go może być drogie: ~$15-30/miesiąc za małą produkcyjną app

**Zalety:**
- Najlepsza UX z platform kontenerowych
- Może hostować całego Supabase (PostgreSQL + wszystko) w tym samym miejscu
- Przejrzyste kalkulatory kosztów

## 5. Oceny platform

| Platforma | Ocena | Uzasadnienie |
|-----------|-------|--------------|
| **Railway** | **8.5/10** | Optymalny wybór dla tego projektu. Najlepsza kombinacja prostoty użycia i elastyczności. Free tier ($5/miesiąc) wystarczy na początkowe testy, a stopniowy wzrost kosztów ($10-30/miesiąc) jest przewidywalny i akceptowalny. Pełne wsparcie Docker eliminuje ryzyko przyszłych migracji. Możliwość hostowania całej infrastruktury (włącznie z self-hosted Supabase) w jednym miejscu. Idealny dla przejścia hobby→startup. |
| **Vercel** | **8/10** | Najlepsza developer experience i wsparcie dla Astro, ale wymóg $20/miesiąc od pierwszego dnia monetyzacji jest problematyczny dla projektu bootstrapped. Doskonały wybór jeśli budżet $240/rok nie jest problemem. Brak drogi stopniowego wzrostu - skok 0→$20 jest duży. |
| **Netlify** | **7.5/10** | Dobra alternatywa dla Vercela z bardziej elastycznym free tierem. Można testować komercyjny produkt przed płaceniem. Jednak limity build minutes (300/miesiąc) mogą być frustrujące przy aktywnym rozwoju - każdy push do staging i production zużywa minuty. |
| **Fly.io** | **7/10** | Solidny wybór dla projektów wymagających globalnego edge deployment i pełnej kontroli. Free tier może starczyć na początek (3x256MB VMs). Wymaga więcej DevOps knowledge - trzeba samodzielnie skonfigurować CI/CD z GitHub Actions. Pricing może być nieprzewidywalny. Dobry dla zespołów z doświadczeniem w infrastrukturze. |
| **Cloudflare Pages** | **6.5/10** | Fenomenalne unlimited bandwidth na free tier, ale znaczące ryzyko związane z ograniczeniami Cloudflare Workers runtime. Dla pure SSG byłby 9/10, ale dla SSR z React + potencjalne złożone operacje (AI calls processing) - CPU limits (10-50ms) i brak pełnego Node.js mogą być blokerem. Testowanie obowiązkowe przed wyborem. |

## 6. Rekomendacja końcowa

**Railway** jest najlepszym wyborem dla tego projektu ze względu na:

1. **Stopniowe skalowanie kosztów** - od $0 przez $5 do $10-30/miesiąc w miarę wzrostu, bez nagłych skoków
2. **Eliminacja ryzyka migracji** - Docker już gotowy, pełna kompatybilność
3. **Optymalna złożoność** - prostsza niż Fly.io, bardziej elastyczna niż Vercel
4. **Możliwość consolidacji** - w przyszłości można przenieść także Supabase (self-hosted) do Railway, obniżając koszty
5. **Przejrzystość kosztów** - łatwe przewidywanie wydatków przy wzroście

### Plan wdrożenia

- **Faza 1 (hobby):** Railway free tier ($5 usage) - wystarczy na development i testy
- **Faza 2 (soft launch):** Railway Developer ($5/m + usage) - pierwsi użytkownicy, ~$10-15/m total
- **Faza 3 (komercyjna):** Railway pay-as-you-go - przewidywalne $20-50/m w zależności od trafficu

## 7. Następne kroki

1. Utworzyć konto na Railway
2. Przetestować deployment aplikacji Docker na Railway
3. Skonfigurować CI/CD z GitHub Actions
4. Skonfigurować zmienne środowiskowe (Supabase, Openrouter API keys)
5. Przetestować performance i cold starts
6. Skonfigurować custom domain
7. Monitoring i alerty kosztów
