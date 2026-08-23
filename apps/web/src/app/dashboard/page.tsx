'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from './layout';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import {
  ListTodo,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  TrendingUp,
  Zap,
  Plus,
  ArrowRight,
  RefreshCw,
  Mail,
  Webhook,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentJobs, setRecentJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingJob, setCreatingJob] = useState(false);
  const [jobType, setJobType] = useState('EMAIL');
  const [emailTo, setEmailTo] = useState('user@example.com');
  const [emailSubject, setEmailSubject] = useState('QueueFlow Test Dispatch');
  const [webhookUrl, setWebhookUrl] = useState('https://httpbin.org/post');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    try {
      const [analyticsRes, jobsRes] = await Promise.all([
        api.get('/api/analytics'),
        api.get('/api/jobs?limit=5'),
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (jobsRes.success) setRecentJobs(jobsRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling every 5s for live job updates
    return () => clearInterval(interval);
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingJob(true);

    let payload: any = {};
    if (jobType === 'EMAIL') {
      payload = {
        to: emailTo,
        subject: emailSubject,
        body: 'This is a test notification generated asynchronously via QueueFlow worker.',
        simulateFailure,
      };
    } else if (jobType === 'WEBHOOK') {
      payload = {
        url: webhookUrl,
        method: 'POST',
        body: { event: 'test.trigger', timestamp: new Date().toISOString() },
      };
    } else if (jobType === 'REPORT') {
      payload = {
        reportName: 'Quarterly_Metrics_Report',
        format: 'JSON',
      };
    }

    try {
      const res = await api.post('/api/jobs', {
        type: jobType,
        payload,
      });

      if (res.success) {
        setToastMessage(`Job ${res.data.id} created successfully! Returned 202 Accepted.`);
        setShowModal(false);
        loadData();
        setTimeout(() => setToastMessage(''), 4000);
      }
    } catch (err: any) {
      alert(`Job Creation Error: ${err.message}`);
    } finally {
      setCreatingJob(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
            <p className="text-xs text-gray-400">Real-time status of distributed worker queue engine</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="px-3 py-2 rounded-lg glass-card hover:bg-gray-800 text-xs font-medium text-gray-300 flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Submit New Job
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-sm flex items-center gap-3 animate-fade-in shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            {toastMessage}
          </div>
        )}

        {/* 7 Stat Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <div className="glass-card p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">Total Jobs</span>
              <ListTodo className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{analytics?.totalJobs ?? 0}</p>
            <span className="text-[10px] text-gray-500 font-mono">All Time Ingested</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{analytics?.completedJobs ?? 0}</p>
            <span className="text-[10px] text-emerald-500/80 font-mono">Successfully processed</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">Failed</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-400 font-mono">{analytics?.failedJobs ?? 0}</p>
            <span className="text-[10px] text-rose-500/80 font-mono">Attempts failed</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">Processing</span>
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
            </div>
            <p className="text-2xl font-bold text-blue-400 font-mono">{analytics?.processingJobs ?? 0}</p>
            <span className="text-[10px] text-blue-500/80 font-mono">Active in workers</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">Pending</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400 font-mono">{analytics?.pendingJobs ?? 0}</p>
            <span className="text-[10px] text-amber-500/80 font-mono">Queued in Redis</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">Success Rate</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{analytics?.successRate ?? 100}%</p>
            <span className="text-[10px] text-gray-500 font-mono">Completion ratio</span>
          </div>

          <div className="glass-card p-4 rounded-xl border border-gray-800 col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between text-gray-400 mb-2">
              <span className="text-xs font-medium">Avg Time</span>
              <Zap className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-300 font-mono">
              {analytics ? (analytics.avgProcessingTimeMs / 1000).toFixed(2) : '0.00'}s
            </p>
            <span className="text-[10px] text-purple-400/80 font-mono">{analytics?.avgProcessingTimeMs ?? 0} ms avg</span>
          </div>
        </div>

        {/* Recent Jobs Section */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Live Job Queue Stream</h2>
              <p className="text-xs text-gray-400">Most recent asynchronous operations handled by workers</p>
            </div>
            <Link
              href="/jobs"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              View All Jobs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentJobs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-gray-800 rounded-xl">
              <ListTodo className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-400">No active jobs found</p>
              <p className="text-xs text-gray-600 mt-1">Submit a new job above to trigger background worker execution.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-gray-900/60 uppercase font-mono text-[10px] text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="py-3 px-4">Job ID</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Attempts</th>
                    <th className="py-3 px-4">Created At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {recentJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-blue-400">
                        <Link href={`/jobs/${job.id}`} className="hover:underline">
                          {job.id.substring(0, 13)}...
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] bg-gray-800 text-gray-300 px-2 py-0.5 rounded border border-gray-700">
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
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Submit New Job Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-gray-800 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h3 className="text-lg font-bold text-white">Enqueue Asynchronous Job</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateJob} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">Job Type Strategy</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['EMAIL', 'WEBHOOK', 'REPORT'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setJobType(t)}
                        className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                          jobType === t
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                            : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:bg-gray-800'
                        }`}
                      >
                        {t === 'EMAIL' && <Mail className="w-3.5 h-3.5" />}
                        {t === 'WEBHOOK' && <Webhook className="w-3.5 h-3.5" />}
                        {t === 'REPORT' && <FileText className="w-3.5 h-3.5" />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {jobType === 'EMAIL' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Recipient Email</label>
                      <input
                        type="email"
                        value={emailTo}
                        onChange={(e) => setEmailTo(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1">Subject</label>
                      <input
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs text-white"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="simFail"
                        checked={simulateFailure}
                        onChange={(e) => setSimulateFailure(e.target.checked)}
                        className="rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-0"
                      />
                      <label htmlFor="simFail" className="text-xs text-rose-400 font-mono">
                        Simulate Failure (Test Retry & DLQ backoff)
                      </label>
                    </div>
                  </>
                )}

                {jobType === 'WEBHOOK' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-1">Target Webhook URL</label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-gray-700 text-xs text-white font-mono"
                      required
                    />
                  </div>
                )}

                {jobType === 'REPORT' && (
                  <p className="text-xs text-gray-400 p-3 bg-gray-900/60 rounded-lg border border-gray-800">
                    Will query database metrics asynchronously and format a structured JSON/CSV report output.
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingJob}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    {creatingJob ? 'Enqueuing...' : 'Dispatch Job (202 Accepted)'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
