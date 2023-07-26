import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

const serverStateKeyContext = createContext<object>({});

export interface ServerStateKeyProviderProps {
  children: ReactNode;
}

export function useServerStateKeyContext() {
  return useContext(serverStateKeyContext);
}

export function ServerStateKeyProvider({ children }: ServerStateKeyProviderProps) {
  const value = useMemo(() => ({}), []);

  return <serverStateKeyContext.Provider value={value}>{children}</serverStateKeyContext.Provider>;
}
