import React from 'react';
import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QueueFlow — Distributed Job Processing & Notification Platform',
  description: 'Production-grade distributed asynchronous job queue platform powered by BullMQ, Express, and Redis.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slateDark text-gray-100 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
