import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';

const serverStateKeyContext = createContext<object | undefined>(undefined);

export interface ServerStateKeyProviderProps {
  children: ReactNode;
  value: object;
}

export function useServerStateKeyContext() {
  return useContext(serverStateKeyContext);
}

export function ServerStateKeyProvider({ children, value }: ServerStateKeyProviderProps) {
  return <serverStateKeyContext.Provider value={value}>{children}</serverStateKeyContext.Provider>;
}
