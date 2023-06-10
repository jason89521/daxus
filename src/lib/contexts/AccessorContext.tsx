import type { ReactNode } from 'react';
import { createContext } from 'react';
import { defaultOptions } from '../constants';
import type { RequiredFetchOptions } from '../hooks/types';

export const accessorOptionsContext = createContext(defaultOptions);

export interface AccessorOptionsProviderProps {
  value: RequiredFetchOptions;
  children: ReactNode;
}

export function AccessorOptionsProvider({ value, children }: AccessorOptionsProviderProps) {
  return (
    <accessorOptionsContext.Provider value={value}>{children}</accessorOptionsContext.Provider>
  );
}
