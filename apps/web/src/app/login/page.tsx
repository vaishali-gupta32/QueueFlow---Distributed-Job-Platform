'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Zap, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.success && res.data.token) {
        localStorage.setItem('queueflow_token', res.data.token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slateDark p-4">
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl shadow-2xl border border-gray-800">
        <div className="flex items-center gap-3 justify-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">QueueFlow</h1>
        </div>

        <h2 className="text-center text-sm text-gray-400 mb-8">Sign in to your job queue engine</h2>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-gray-900/80 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-gray-900/80 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Seeded Demo Accounts */}
        <div className="mt-8 pt-6 border-t border-gray-800/80">
          <p className="text-[11px] uppercase font-mono text-gray-500 text-center mb-3">Quick Seeded Login</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => fillDemo('admin@queueflow.io')}
              type="button"
              className="px-3 py-2 rounded-lg bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/50 text-purple-300 text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin User
            </button>
            <button
              onClick={() => fillDemo('user@queueflow.io')}
              type="button"
              className="px-3 py-2 rounded-lg bg-blue-950/40 hover:bg-blue-900/40 border border-blue-800/50 text-blue-300 text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Standard User
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-400 hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
