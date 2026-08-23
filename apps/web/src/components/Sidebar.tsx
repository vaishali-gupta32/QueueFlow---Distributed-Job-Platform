'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ListTodo, Activity, Server, AlertOctagon, ShieldAlert, Zap } from 'lucide-react';

interface Props {
  userRole?: string;
}

export const Sidebar: React.FC<Props> = ({ userRole }) => {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Jobs', href: '/jobs', icon: ListTodo },
    { label: 'Analytics', href: '/analytics', icon: Activity },
  ];

  const adminItems = [
    { label: 'Workers', href: '/admin/workers', icon: Server },
    { label: 'Dead Letter Queue', href: '/admin/dlq', icon: AlertOctagon },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-gray-800 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="p-5">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-wide">QueueFlow</h1>
            <p className="text-[10px] uppercase font-mono text-blue-400 tracking-wider">Distributed Platform</p>
          </div>
        </div>

        <nav className="space-y-1">
          <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Platform</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}

          {userRole === 'ADMIN' && (
            <>
              <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-6 mb-2">Admin Tools</p>
              {adminItems.map((item) => {
                const Icon = item.icon;
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-800/80">
        <div className="glass-card p-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs text-gray-300 font-mono">Redis & BullMQ Active</span>
          </div>
          <span className="text-[10px] bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded font-mono">v1.0</span>
        </div>
      </div>
    </aside>
  );
};
