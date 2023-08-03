'use client';

import { Inter } from 'next/font/google';
import Provider from './Provider';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { worker } from '@/mocks/browser';

worker?.start();

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider>
          <nav style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <Link href="/">Home</Link>
            <Link href="/forumId_1">Forum1</Link>
            <Link href="/forumId_2">Forum2</Link>
            <Link href="/forumId_3">Forum3</Link>
          </nav>
          {children}
        </Provider>
      </body>
    </html>
  );
}
