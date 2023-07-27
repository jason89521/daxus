'use client';

import {
  ServerStateKeyProvider,
  useSuspenseAccessor,
  createDatabase,
  DatabaseProvider,
} from 'daxus';
import { StreamHydration } from 'daxus-next';
import { Suspense } from 'react';

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return '';
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}
const baseUrl = getBaseUrl();

const db = createDatabase();

const model = db.createAutoModel({ name: 'test' });

const getData = model.defineNormalAccessor({
  name: 'getData',
  async fetchData(wait: number) {
    const path = `/api/wait?wait=${wait}`;
    const url = baseUrl + path;

    const data: string = await (await fetch(url, { cache: 'no-store' })).json();
    return data;
  },
});

function MyComponent({ wait }: { wait: number }) {
  const { data } = useSuspenseAccessor(getData(wait));

  return <div>result: {data}</div>;
}

export default function Home() {
  return (
    <ServerStateKeyProvider value={{}}>
      <DatabaseProvider database={db}>
        <StreamHydration>
          <Suspense fallback={<div>waiting 100...</div>}>
            <MyComponent wait={100} />
          </Suspense>
          <Suspense fallback={<div>waiting 200...</div>}>
            <MyComponent wait={200} />
          </Suspense>
          <Suspense fallback={<div>waiting 300...</div>}>
            <MyComponent wait={300} />
          </Suspense>
          <Suspense fallback={<div>waiting 400...</div>}>
            <MyComponent wait={400} />
          </Suspense>
          <Suspense fallback={<div>waiting 500...</div>}>
            <MyComponent wait={500} />
          </Suspense>
          <Suspense fallback={<div>waiting 600...</div>}>
            <MyComponent wait={600} />
          </Suspense>
          <Suspense fallback={<div>waiting 700...</div>}>
            <MyComponent wait={700} />
          </Suspense>

          <fieldset>
            <legend>
              combined <code>Suspense</code> container
            </legend>
            <Suspense
              fallback={
                <>
                  <div>waiting 800</div>
                  <div>waiting 900</div>
                  <div>waiting 1000</div>
                </>
              }
            >
              <MyComponent wait={800} />
              <MyComponent wait={900} />
              <MyComponent wait={1000} />
            </Suspense>
          </fieldset>
        </StreamHydration>
      </DatabaseProvider>
    </ServerStateKeyProvider>
  );
}
