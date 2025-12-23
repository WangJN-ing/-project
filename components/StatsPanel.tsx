import React from 'react';
import { SimulationStats, Translation } from '../types';
import { Activity, Gauge, Thermometer, Wind } from 'lucide-react';

interface StatsPanelProps {
  stats: SimulationStats;
  eqTime: number;
  statDuration: number;
  t: Translation;
}

const StatItem = ({ label, value, unit, icon }: any) => (
  <div className="flex flex-col bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
    <div className="flex items-center gap-2 text-slate-400 mb-2 text-[10px] uppercase tracking-widest font-bold">
      <span className="text-sciblue-500">{icon}</span> {label}
    </div>
    <div className="text-2xl font-sans text-slate-800 font-semibold tracking-tight flex items-baseline gap-1">
      {value.toFixed(3)} <span className="text-xs text-slate-400 font-medium">{unit}</span>
    </div>
  </div>
);

const StatsPanel: React.FC<StatsPanelProps> = ({ stats, eqTime, statDuration, t }) => {
  const totalDuration = eqTime + statDuration;
  const remainingTime = Math.max(0, totalDuration - stats.time);
  const isFinished = stats.phase === 'finished';
  
  // Progress Bar Color Logic
  let progressColor = "bg-slate-300";
  let statusText = t.stats.idle;
  let statusColor = "text-slate-500";
  
  if (stats.phase === 'equilibrating') {
    progressColor = "bg-amber-400";
    statusText = t.stats.equilibrating;
    statusColor = "text-amber-600";
  } else if (stats.phase === 'collecting') {
    progressColor = "bg-emerald-500";
    statusText = t.stats.collecting;
    statusColor = "text-emerald-600";
  } else if (stats.phase === 'finished') {
    progressColor = "bg-sciblue-500";
    statusText = t.stats.finished;
    statusColor = "text-sciblue-600";
  }

  // Animation container: When finished, reduce height to 0 and opacity to 0
  return (
    <div 
        className={`transition-all duration-700 ease-in-out overflow-hidden ${isFinished ? 'max-h-0 opacity-0' : 'max-h-[300px] opacity-100'}`}
    >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full pt-4">
           <StatItem label={t.stats.temperature} value={stats.temperature} unit="K" icon={<Thermometer size={14}/>} />
           <StatItem label={t.stats.pressure} value={stats.pressure} unit="Pa" icon={<Gauge size={14}/>} />
           <StatItem label={t.stats.meanSpeed} value={stats.meanSpeed} unit="m/s" icon={<Wind size={14}/>} />
           <StatItem label={t.stats.rmsSpeed} value={stats.rmsSpeed} unit="m/s" icon={<Activity size={14}/>} />

           {/* Status Bar */}
           <div className="col-span-2 md:col-span-4 mt-2 px-1">
             <div className="flex justify-between text-xs mb-2 font-medium tracking-wide">
                <span className={`flex items-center gap-2 ${statusColor}`}>
                   <span className={`w-2 h-2 rounded-full ${progressColor} animate-pulse`}></span>
                   {t.stats.status}: {statusText}
                </span>
                <span className="text-slate-400 font-mono">
                    {stats.phase !== 'finished' ? `T - ${remainingTime.toFixed(1)}s` : t.stats.done}
                </span>
             </div>
             <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-300 ${progressColor}`} 
                    style={{ width: `${Math.min(100, (stats.time / totalDuration) * 100)}%` }}
                ></div>
             </div>
           </div>
        </div>
    </div>
  );
};

export default StatsPanel;