'use client';

import { useDatabaseContext } from 'daxus';
import type { NotifyDatabaseContext } from 'daxus/dist/model/types.js';
import { InfiniteAccessor } from 'daxus/dist/model/index.js';
import { useState, type ReactNode, useEffect, useRef } from 'react';
import { useServerInsertedHTML } from 'next/navigation.js';

interface Props {
  children: ReactNode;
}

function isServer() {
  return typeof window === 'undefined';
}

function isUndefined(value: unknown): value is undefined {
  return typeof value === 'undefined';
}

export function StreamHydration({ children }: Props) {
  const database = useDatabaseContext();
  const [trackedCtx] = useState(() => new Set<NotifyDatabaseContext>());
  if (!database) throw new Error('Should be wrapped with a database provider!');

  // server stuff
  if (isServer()) {
    database.subscribe(ctx => {
      trackedCtx.add(ctx);
    });
  }

  const countRef = useRef(0);
  useServerInsertedHTML(() => {
    const ctxs: NotifyDatabaseContext[] = [];
    trackedCtx.forEach(ctx => {
      ctxs.push(ctx);
    });
    trackedCtx.clear();

    if (!ctxs.length) return null;

    const serializedCtxs = ctxs.map(ctx => JSON.stringify(ctx)).join(',');

    countRef.current++;
    return (
      <script
        key={countRef.current}
        dangerouslySetInnerHTML={{
          __html: `
        window['__daxus'] = window['__daxus'] ?? [];
        window['__daxus'].push(${serializedCtxs})
      `,
        }}
      />
    );
  });
  // server stuff

  // client stuff
  useEffect(() => {
    const win = window as any;
    const ctxs: NotifyDatabaseContext[] = win['__daxus'] ?? [];

    const onPush = (...ctxs: NotifyDatabaseContext[]) => {
      ctxs.forEach(ctx => {
        const model = database.getModel(ctx.modelName);
        if (isUndefined(ctx.creatorName) || isUndefined(ctx.data)) return;
        const creator = model?.getCreator(ctx.creatorName);
        if (!creator) return;
        creator.mutate(draft => {
          const accessor = creator(ctx.arg);
          if (accessor instanceof InfiniteAccessor) {
            if (isUndefined(ctx.pageIndex) || isUndefined(ctx.pageSize)) return;
            creator.syncState(draft, ctx as any);
            return;
          }

          creator.syncState(draft, ctx as any);
        });
      });
    };

    onPush(...ctxs);

    win['__daxus'] = {
      push: onPush,
    };

    return () => {
      win['__daxus'] = [];
    };
  }, [database]);
  // client stuff

  return <>{children}</>;
}
