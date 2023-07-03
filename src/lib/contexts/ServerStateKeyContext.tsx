import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

const serverStateKeyContext = createContext<object | undefined>(undefined);

export interface ServerStateKeyProviderProps {
  value: object;
  children: ReactNode;
}

export function useServerStateKeyContext() {
  return useContext(serverStateKeyContext);
}

export function ServerStateKeyProvider({ value, children }: ServerStateKeyProviderProps) {
  return <serverStateKeyContext.Provider value={value}>{children}</serverStateKeyContext.Provider>;
}
