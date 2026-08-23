'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('queueflow_token');
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slateDark">
      <div className="flex items-center gap-3 text-blue-400 font-mono text-sm">
        <span className="h-3 w-3 rounded-full bg-blue-500 animate-ping"></span>
        Loading QueueFlow Platform...
      </div>
    </div>
  );
}
