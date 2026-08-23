'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../dashboard/layout';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import {
  ListTodo,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  Webhook,
  FileText,
  RotateCcw,
  Ban,
} from 'lucide-react';
import Link from 'next/link';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchId, setSearchId] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = `/api/jobs?page=${page}&limit=15`;
      if (statusFilter) query += `&status=${statusFilter}`;
      if (typeFilter) query += `&type=${typeFilter}`;

      const res = await api.get(query);
      if (res.success) {
        setJobs(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalJobs(res.meta.total || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, statusFilter, typeFilter]);

  const filteredJobs = searchId
    ? jobs.filter((j) => j.id.toLowerCase().includes(searchId.toLowerCase()))
    : jobs;

  const handleCancel = async (jobId: string) => {
    try {
      await api.post(`/api/jobs/${jobId}/cancel`);
      fetchJobs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRetry = async (jobId: string) => {
    try {
      await api.post(`/api/jobs/${jobId}/retry`);
      fetchJobs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Job Inventory</h1>
            <p className="text-xs text-gray-400">Database-paginated job tracking records ({totalJobs} total)</p>
          </div>

          <button
            onClick={fetchJobs}
            className="px-3 py-2 rounded-lg glass-card hover:bg-gray-800 text-xs font-medium text-gray-300 flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Queue
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="glass-panel p-4 rounded-xl border border-gray-800 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Job ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-900/80 border border-gray-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-gray-900 border border-gray-800 text-xs text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="FAILED">FAILED</option>
              <option value="RETRYING">RETRYING</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="DEAD_LETTER">DEAD_LETTER</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-gray-900 border border-gray-800 text-xs text-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="EMAIL">EMAIL</option>
              <option value="WEBHOOK">WEBHOOK</option>
              <option value="REPORT">REPORT</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="glass-panel rounded-2xl border border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/80 uppercase font-mono text-[10px] text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="py-3.5 px-4">Job ID</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Attempts</th>
                  <th className="py-3.5 px-4">Created At</th>
                  <th className="py-3.5 px-4">Completed / Failed At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 font-mono">
                      Loading database jobs...
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-500 font-mono">
                      No jobs matched current filter criteria
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-blue-400 font-medium">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.id}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded border border-gray-700">
                          {job.type === 'EMAIL' && <Mail className="w-3 h-3 text-blue-400" />}
                          {job.type === 'WEBHOOK' && <Webhook className="w-3 h-3 text-purple-400" />}
                          {job.type === 'REPORT' && <FileText className="w-3 h-3 text-emerald-400" />}
                          {job.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {job.attempts} / {job.maxAttempts}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-400">
                        {job.completedAt
                          ? new Date(job.completedAt).toLocaleTimeString()
                          : job.failedAt
                          ? new Date(job.failedAt).toLocaleTimeString()
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {['PENDING', 'RETRYING'].includes(job.status) && (
                          <button
                            onClick={() => handleCancel(job.id)}
                            className="p-1 text-gray-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                            title="Cancel Job"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}

                        {['FAILED', 'DEAD_LETTER', 'CANCELLED'].includes(job.status) && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-950/40 rounded transition-colors"
                            title="Retry Job"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}

                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 px-2.5 py-1 rounded transition-colors"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 bg-gray-900/60 border-t border-gray-800 flex items-center justify-between">
            <span className="text-xs text-gray-400 font-mono">
              Page {page} of {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
