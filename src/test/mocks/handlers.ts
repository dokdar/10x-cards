import { http, HttpResponse } from 'msw';

// Przykładowe handlery dla MSW
export const handlers = [
  // Przykład mockowania odpowiedzi API
  http.get('/api/flashcards', () => {
    return HttpResponse.json([
      { id: '1', question: 'Przykładowe pytanie 1', answer: 'Przykładowa odpowiedź 1' },
      { id: '2', question: 'Przykładowe pytanie 2', answer: 'Przykładowa odpowiedź 2' },
    ]);
  }),
];