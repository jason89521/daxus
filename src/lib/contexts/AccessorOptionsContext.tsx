import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { createContext } from 'react';
import { defaultOptions } from '../constants';
import type { AccessorOptions } from '../hooks/types';

export const accessorOptionsContext = createContext(defaultOptions);

export interface AccessorOptionsProviderProps {
  value: AccessorOptions;
  children: ReactNode;
}

export function AccessorOptionsProvider({ value, children }: AccessorOptionsProviderProps) {
  const options = useMemo(() => {
    return { ...defaultOptions, ...value };
  }, [value]);

  return (
    <accessorOptionsContext.Provider value={options}>{children}</accessorOptionsContext.Provider>
  );
}
