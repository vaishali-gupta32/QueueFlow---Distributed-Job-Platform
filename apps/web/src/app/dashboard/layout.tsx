'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/auth/me');
        if (res.success && res.data) {
          setUser(res.data);
        }
      } catch (err) {
        localStorage.removeItem('queueflow_token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slateDark">
        <div className="flex items-center gap-3 text-blue-400 font-mono text-sm">
          <span className="h-3 w-3 rounded-full bg-blue-500 animate-ping"></span>
          Authenticating Session...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slateDark">
      <Sidebar userRole={user?.role} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
