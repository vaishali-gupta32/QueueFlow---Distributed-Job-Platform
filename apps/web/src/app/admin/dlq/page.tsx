'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../dashboard/layout';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { AlertOctagon, RotateCcw, RefreshCw, Eye } from 'lucide-react';
import Link from 'next/link';

export default function DeadLetterQueueAdminPage() {
  const [dlqJobs, setDlqJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDLQ = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/dlq');
      if (res.success) setDlqJobs(res.data);
    } catch (err: any) {
      console.error('Error fetching DLQ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDLQ();
  }, []);

  const handleRetry = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await api.post(`/api/admin/jobs/${id}/retry`);
      if (res.success) {
        fetchDLQ();
      }
    } catch (err: any) {
      alert(`Failed to retry job: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <AlertOctagon className="w-6 h-6 text-rose-500" /> Dead Letter Queue (DLQ)
            </h1>
            <p className="text-xs text-gray-400">Jobs that exhausted maximum retries. Admins can manually re-queue them.</p>
          </div>

          <button
            onClick={fetchDLQ}
            className="px-3 py-2 rounded-lg glass-card hover:bg-gray-800 text-xs font-medium text-gray-300 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh DLQ
          </button>
        </div>

        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/80 uppercase font-mono text-[10px] text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="py-3.5 px-4">Job ID</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Attempts</th>
                  <th className="py-3.5 px-4">Terminal Error</th>
                  <th className="py-3.5 px-4">Failed At</th>
                  <th className="py-3.5 px-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500">
                      Querying Dead Letter Queue...
                    </td>
                  </tr>
                ) : dlqJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-emerald-400 font-mono">
                      ✓ Dead Letter Queue is empty! No dead-lettered jobs pending manual intervention.
                    </td>
                  </tr>
                ) : (
                  dlqJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-3.5 px-4 text-blue-400 font-medium">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.id}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">
                        {job.user?.email || job.userId}
                      </td>
                      <td className="py-3.5 px-4 text-purple-300 font-bold">{job.type}</td>
                      <td className="py-3.5 px-4 text-rose-400">{job.attempts} / {job.maxAttempts}</td>
                      <td className="py-3.5 px-4 text-rose-300 max-w-xs truncate" title={job.lastError || ''}>
                        {job.lastError || 'Unknown exception'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400">
                        {job.failedAt ? new Date(job.failedAt).toLocaleString() : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded text-xs inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Inspect
                        </Link>
                        <button
                          onClick={() => handleRetry(job.id)}
                          disabled={actionLoading === job.id}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold inline-flex items-center gap-1 shadow-md shadow-blue-500/20 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3 h-3" /> {actionLoading === job.id ? 'Re-queuing...' : 'Retry Job'}
                        </button>
                      </td>
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
