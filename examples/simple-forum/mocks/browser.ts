import { setupWorker } from 'msw';
import { handlers } from './handlers';

export const worker = (() => {
  if (typeof window !== 'undefined') return setupWorker(...handlers);
})();
