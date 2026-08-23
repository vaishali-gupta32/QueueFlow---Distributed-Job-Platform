'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../dashboard/layout';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  RotateCcw,
  Ban,
  CheckCircle2,
  Calendar,
  Layers,
  Code,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchJob = async () => {
    try {
      const res = await api.get(`/api/jobs/${jobId}`);
      if (res.success) {
        setJob(res.data);
      }
    } catch (err: any) {
      console.error('Error loading job detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) fetchJob();
  }, [jobId]);

  const handleRetry = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/jobs/${jobId}/retry`);
      fetchJob();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/jobs/${jobId}/cancel`);
      fetchJob();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-blue-400 font-mono text-xs">
          Loading Job Metadata ({jobId})...
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout>
        <div className="py-12 text-center text-rose-400 font-mono text-xs">
          Job {jobId} not found or access denied.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/jobs"
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Jobs
          </Link>

          <div className="flex items-center gap-2">
            {['PENDING', 'RETRYING'].includes(job.status) && (
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800 text-rose-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" /> Cancel Job
              </button>
            )}

            {['FAILED', 'DEAD_LETTER', 'CANCELLED'].includes(job.status) && (
              <button
                onClick={handleRetry}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-queue & Retry Job
              </button>
            )}
          </div>
        </div>

        {/* Title Bar */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold font-mono text-white">{job.id}</span>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-xs text-gray-400 mt-1 font-mono">Job Strategy Type: {job.type}</p>
            </div>

            <div className="flex items-center gap-6 text-xs text-gray-400 font-mono">
              <div>
                <span className="text-gray-500 block text-[10px]">ATTEMPTS</span>
                <span className="text-white font-bold">{job.attempts} / {job.maxAttempts}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px]">PRIORITY</span>
                <span className="text-white font-bold">{job.priority}</span>
              </div>
            </div>
          </div>

          {job.lastError && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-rose-400" /> Execution Error Stack:
              </div>
              <pre className="font-mono text-[11px] whitespace-pre-wrap text-rose-200 bg-rose-950/60 p-2 rounded border border-rose-900/40">
                {job.lastError}
              </pre>
            </div>
          )}
        </div>

        {/* Detail Specs & Payload Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Metadata Breakdown */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" /> Lifecycle Metadata
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1.5 border-b border-gray-800">
                <span className="text-gray-400">Created At:</span>
                <span className="text-gray-200">{new Date(job.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-800">
                <span className="text-gray-400">Started At:</span>
                <span className="text-gray-200">{job.startedAt ? new Date(job.startedAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-800">
                <span className="text-gray-400">Completed At:</span>
                <span className="text-gray-200">{job.completedAt ? new Date(job.completedAt).toLocaleString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-800">
                <span className="text-gray-400">Failed At:</span>
                <span className="text-gray-200">{job.failedAt ? new Date(job.failedAt).toLocaleString() : 'N/A'}</span>
              </div>
              {job.nextRetryAt && (
                <div className="flex justify-between py-1.5 border-b border-gray-800 text-purple-400">
                  <span>Next Retry Scheduled:</span>
                  <span>{new Date(job.nextRetryAt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* JSON Payload Viewer */}
          <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-purple-400" /> Canonical Payload Data
            </h3>
            <pre className="p-3 bg-gray-950 rounded-xl border border-gray-800 font-mono text-xs text-blue-300 overflow-x-auto max-h-60">
              {JSON.stringify(job.payload, null, 2)}
            </pre>
          </div>
        </div>

        {/* Attempt Execution Timeline */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Attempt Execution History
          </h3>

          {!job.attemptLogs || job.attemptLogs.length === 0 ? (
            <p className="text-xs text-gray-500 font-mono italic">No execution attempts recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {job.attemptLogs.map((attempt: any) => (
                <div
                  key={attempt.id}
                  className="p-4 rounded-xl glass-card border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-white">Attempt #{attempt.attemptNumber}</span>
                      <StatusBadge status={attempt.status} />
                    </div>
                    {attempt.error && (
                      <p className="text-xs font-mono text-rose-400">{attempt.error}</p>
                    )}
                  </div>

                  <div className="text-xs font-mono text-gray-400 text-right shrink-0">
                    <span className="block text-gray-300 font-semibold">
                      Duration: {attempt.durationMs !== null ? `${attempt.durationMs} ms` : 'Executing...'}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(attempt.startedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
