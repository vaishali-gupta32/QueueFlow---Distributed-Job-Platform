'use client';

import React from 'react';
import { LogOut, User, Shield, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<Props> = ({ user, onLogout }) => {
  const router = useRouter();

  const handleLogout = () => {
    if (onLogout) onLogout();
    localStorage.removeItem('queueflow_token');
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-gray-800 glass-panel px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-gray-300">QueueFlow Control Plane</h2>
        <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-mono">Cluster: dev-01</span>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-white">{user.name}</p>
              <p className="text-[10px] text-gray-400 font-mono">{user.email}</p>
            </div>

            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
              user.role === 'ADMIN' ? 'bg-purple-900/60 text-purple-300 border border-purple-700' : 'bg-gray-800 text-gray-300'
            }`}>
              {user.role}
            </span>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/login')}
              className="text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded-md hover:bg-gray-800"
            >
              Log In
            </button>
            <button
              onClick={() => router.push('/register')}
              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md font-medium shadow-md shadow-blue-500/20"
            >
              Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
