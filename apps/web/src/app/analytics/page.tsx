'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../dashboard/layout';
import { api } from '@/lib/api';
import { Activity, Zap, CheckCircle2, AlertOctagon, TrendingUp } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/api/analytics');
        if (res.success) setData(res.data);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Queue Processing Analytics</h1>
          <p className="text-xs text-gray-400">High-performance metrics cached via Redis with 30s TTL window</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-blue-400 font-mono text-xs">Computing aggregate stats...</div>
        ) : (
          <div className="space-y-6">
            {/* Visual Progress Bar */}
            <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-white">Completion vs Failure Ratio</span>
                <span className="text-emerald-400 font-mono">{data?.successRate ?? 100}% Success Rate</span>
              </div>

              <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden flex">
                <div
                  style={{ width: `${data?.successRate || 100}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                ></div>
                <div
                  style={{ width: `${100 - (data?.successRate || 100)}%` }}
                  className="bg-rose-500 h-full transition-all duration-500"
                ></div>
              </div>
              <div className="flex justify-between text-[11px] font-mono text-gray-400">
                <span className="text-emerald-400">{data?.completedJobs ?? 0} Completed</span>
                <span className="text-rose-400">{(data?.failedJobs || 0) + (data?.deadLetterJobs || 0)} Failed / DLQ</span>
              </div>
            </div>

            {/* Metrics Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Volume</span>
                <p className="text-3xl font-bold font-mono text-white">{data?.totalJobs}</p>
                <p className="text-xs text-gray-500">Total jobs ingested by API</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Avg Processing Time</span>
                <p className="text-3xl font-bold font-mono text-purple-300">
                  {((data?.avgProcessingTimeMs || 0) / 1000).toFixed(2)}s
                </p>
                <p className="text-xs text-purple-400/80 font-mono">{data?.avgProcessingTimeMs} ms average worker latency</p>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-gray-800 space-y-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dead Letter Queue</span>
                <p className="text-3xl font-bold font-mono text-rose-400">{data?.deadLetterJobs}</p>
                <p className="text-xs text-rose-500/80">Jobs requiring admin manual retry</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
