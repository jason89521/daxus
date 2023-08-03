'use client';

import { db } from '@/database';
import { DatabaseProvider, ServerStateKeyProvider } from 'daxus';
import type { ReactNode } from 'react';

export default function Provider({ children }: { children: ReactNode }) {
  return (
    <DatabaseProvider database={db}>
      <ServerStateKeyProvider value={{}}>{children}</ServerStateKeyProvider>
    </DatabaseProvider>
  );
}
