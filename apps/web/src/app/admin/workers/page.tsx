'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../dashboard/layout';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { Server, RefreshCw, Activity, Cpu } from 'lucide-react';

export default function WorkersAdminPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkers = async () => {
    try {
      const res = await api.get('/api/admin/workers');
      if (res.success) setWorkers(res.data);
    } catch (err: any) {
      console.error('Error fetching workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
    const interval = setInterval(fetchWorkers, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Active Worker Nodes</h1>
            <p className="text-xs text-gray-400">Heartbeat monitoring & health thresholds (10s pulse, 30s timeout)</p>
          </div>

          <button
            onClick={fetchWorkers}
            className="px-3 py-2 rounded-lg glass-card hover:bg-gray-800 text-xs font-medium text-gray-300 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Workers
          </button>
        </div>

        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/80 uppercase font-mono text-[10px] text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="py-3.5 px-4">Worker ID</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Last Heartbeat</th>
                  <th className="py-3.5 px-4">Jobs Processed</th>
                  <th className="py-3.5 px-4">Jobs Failed</th>
                  <th className="py-3.5 px-4">Started At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      Querying worker heartbeat registry...
                    </td>
                  </tr>
                ) : workers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      No active workers registered. Start worker process (`npm run dev:worker`).
                    </td>
                  </tr>
                ) : (
                  workers.map((worker) => (
                    <tr key={worker.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                        {worker.workerId}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={worker.status} />
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        {worker.lastHeartbeatAgoSeconds}s ago ({new Date(worker.lastHeartbeat).toLocaleTimeString()})
                      </td>
                      <td className="py-3.5 px-4 text-emerald-400 font-bold">{worker.jobsProcessed}</td>
                      <td className="py-3.5 px-4 text-rose-400 font-bold">{worker.jobsFailed}</td>
                      <td className="py-3.5 px-4 text-gray-500">{new Date(worker.startedAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
