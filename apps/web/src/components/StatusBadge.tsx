import React from 'react';

interface Props {
  status: string;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  let bg = 'bg-gray-800 text-gray-300 border-gray-700';
  let dotColor = 'bg-gray-400';
  let pulse = false;

  switch (status) {
    case 'PENDING':
      bg = 'bg-amber-950/40 text-amber-300 border-amber-800/50';
      dotColor = 'bg-amber-400';
      pulse = true;
      break;
    case 'PROCESSING':
      bg = 'bg-blue-950/50 text-blue-300 border-blue-800/60';
      dotColor = 'bg-blue-400';
      pulse = true;
      break;
    case 'COMPLETED':
    case 'HEALTHY':
      bg = 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50';
      dotColor = 'bg-emerald-400';
      break;
    case 'FAILED':
    case 'UNHEALTHY':
      bg = 'bg-rose-950/40 text-rose-300 border-rose-800/50';
      dotColor = 'bg-rose-400';
      break;
    case 'RETRYING':
      bg = 'bg-purple-950/40 text-purple-300 border-purple-800/50';
      dotColor = 'bg-purple-400';
      pulse = true;
      break;
    case 'DEAD_LETTER':
    case 'OFFLINE':
      bg = 'bg-red-950/60 text-red-400 border-red-800/80';
      dotColor = 'bg-red-500';
      break;
    case 'CANCELLED':
      bg = 'bg-slate-800 text-slate-400 border-slate-700';
      dotColor = 'bg-slate-500';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${bg}`}>
      <span className="relative flex h-2 w-2">
        {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dotColor} opacity-75`}></span>}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
      </span>
      {status}
    </span>
  );
};
