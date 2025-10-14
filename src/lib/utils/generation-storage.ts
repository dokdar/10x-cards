import type { GenerationResponse } from '@/types';

const STORAGE_PREFIX = 'generation_';

/**
 * Helper functions for managing generation data in sessionStorage
 */
export const generationStorage = {
  /**
   * Save generation data to sessionStorage
   */
  save(generationId: string, data: GenerationResponse): void {
    try {
      const key = `${STORAGE_PREFIX}${generationId}`;
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save generation data:', error);
    }
  },

  /**
   * Load generation data from sessionStorage
   */
  load(generationId: string): GenerationResponse | null {
    try {
      const key = `${STORAGE_PREFIX}${generationId}`;
      const storedData = sessionStorage.getItem(key);
      
      if (!storedData) {
        return null;
      }

      return JSON.parse(storedData) as GenerationResponse;
    } catch (error) {
      console.error('Failed to load generation data:', error);
      return null;
    }
  },

  /**
   * Remove generation data from sessionStorage
   */
  remove(generationId: string): void {
    try {
      const key = `${STORAGE_PREFIX}${generationId}`;
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove generation data:', error);
    }
  },

  /**
   * Clear all generation data from sessionStorage
   */
  clear(): void {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach((key) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear generation data:', error);
    }
  },
};

