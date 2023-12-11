import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = (() => {
  if (typeof window !== 'undefined') return setupWorker(...handlers);
})();
