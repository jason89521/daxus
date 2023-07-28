import type { ReactNode } from 'react';
import { createContext, useContext } from 'react';
import type { Database } from '../model/createDatabase.js';

export const DatabaseContext = createContext<Database | undefined>(undefined);

export function useDatabaseContext() {
  return useContext(DatabaseContext);
}

export function DatabaseProvider({
  database,
  children,
}: {
  database: Database;
  children: ReactNode;
}) {
  return <DatabaseContext.Provider value={database}>{children}</DatabaseContext.Provider>;
}
