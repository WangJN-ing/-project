import React from 'react';
import { 
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, AreaChart, Area
} from 'recharts';
import { ChartData, Translation } from '../types';

interface ChartProps {
  data: ChartData;
  type: 'speed' | 'energy' | 'semilog' | 'tempError' | 'totalEnergy';
  isFinal?: boolean;
  t: Translation;
  heightClass?: string; // Allow custom height
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-xs backdrop-blur-none z-50 relative">
        <p className="font-serif font-bold mb-2 text-slate-900 border-b border-slate-100 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
             <span className="text-slate-500 font-medium">{entry.name}:</span>
             <span className="font-mono font-bold text-slate-700">{Number(entry.value).toFixed(4)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DistributionCharts: React.FC<ChartProps> = ({ data, type, isFinal = false, t, heightClass = "h-[220px]" }) => {
  const containerClass = `w-full ${heightClass} flex flex-col`;
  
  // Academic Color Palette
  const colors = {
      simulation: isFinal ? "#3b82f6" : "#60a5fa", // Blue 500/400
      theory: "#ef4444",    // Red 500
      grid: "#e2e8f0",      // Slate 200
      axis: "#64748b",      // Slate 500
      text: "#334155",      // Slate 700
      area: "#f59e0b"       // Amber 500
  };

  const axisStyle = {
      fontSize: 10,
      fontFamily: '"Inter", sans-serif',
      fill: colors.axis
  };

  const labelStyle = {
      fontSize: 11,
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      fill: colors.text
  };

  const formatTick = (val: any) => Number(val).toFixed(2);

  if (type === 'speed') {
    const maxTheoretical = Math.max(...data.speed.map(b => b.theoretical || 0));
    const fixedDomain = [0, maxTheoretical * 1.2];

    const chartData = data.speed.map(bin => ({
      val: (bin.binStart + bin.binEnd) / 2,
      probability: bin.probability,
      theoretical: bin.theoretical,
    }));

    return (
      <div className={containerClass}>
        <h4 className="text-center text-sm font-bold text-slate-800 mb-2 tracking-tight">{isFinal ? t.charts.avgSpeed : t.charts.instSpeed}</h4>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis 
              dataKey="val" 
              tick={axisStyle}
              tickLine={{ stroke: colors.axis }}
              axisLine={{ stroke: colors.axis }}
              tickFormatter={formatTick}
              label={{ value: t.charts.speedX, position: 'insideBottom', offset: -10, ...labelStyle }}
            />
            <YAxis 
               tick={axisStyle}
               tickLine={{ stroke: colors.axis }}
               axisLine={{ stroke: colors.axis }}
               tickFormatter={formatTick}
               domain={fixedDomain}
               allowDataOverflow={true}
               label={{ value: t.charts.probY, angle: -90, position: 'insideLeft', ...labelStyle, offset: 5 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: colors.text, fontWeight: 500 }}/>
            <Bar dataKey="probability" name={t.charts.simulation} fill={colors.simulation} opacity={0.9} barSize={10} isAnimationActive={false} radius={[2, 2, 0, 0]} />
            <Line type="basis" dataKey="theoretical" name={t.charts.theory} stroke={colors.theory} strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'energy') {
    const maxTheoretical = Math.max(...data.energy.map(b => b.theoretical || 0));
    const fixedDomain = [0, maxTheoretical * 1.2];

    const chartData = data.energy.map(bin => ({
      val: (bin.binStart + bin.binEnd) / 2,
      probability: bin.probability,
      theoretical: bin.theoretical,
    }));

    return (
      <div className={containerClass}>
        <h4 className="text-center text-sm font-bold text-slate-800 mb-2 tracking-tight">{isFinal ? t.charts.avgEnergy : t.charts.instEnergy}</h4>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis 
              dataKey="val" 
              tick={axisStyle}
              tickLine={{ stroke: colors.axis }}
              axisLine={{ stroke: colors.axis }}
              tickFormatter={formatTick}
              label={{ value: t.charts.energyX, position: 'insideBottom', offset: -10, ...labelStyle }}
            />
            <YAxis 
               tick={axisStyle}
               tickLine={{ stroke: colors.axis }}
               axisLine={{ stroke: colors.axis }}
               tickFormatter={formatTick} 
               domain={fixedDomain}
               allowDataOverflow={true}
               label={{ value: t.charts.probY, angle: -90, position: 'insideLeft', ...labelStyle, offset: 5 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: colors.text, fontWeight: 500 }}/>
            <Bar dataKey="probability" name={t.charts.simulation} fill={colors.simulation} opacity={0.9} barSize={10} isAnimationActive={false} radius={[2, 2, 0, 0]} />
            <Line type="basis" dataKey="theoretical" name={t.charts.theory} stroke={colors.theory} strokeWidth={2} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'semilog') {
     return (
        <div className={containerClass}>
            <h4 className="text-center text-sm font-bold text-slate-800 mb-2 tracking-tight">{t.charts.semilog}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                    <XAxis 
                        type="number" 
                        dataKey="energy" 
                        name="Energy" 
                        tick={axisStyle}
                        tickLine={{ stroke: colors.axis }}
                        axisLine={{ stroke: colors.axis }}
                        tickFormatter={formatTick}
                        domain={['dataMin', 'dataMax']}
                        label={{ value: t.charts.energyX, position: 'insideBottom', offset: -10, ...labelStyle }}
                    />
                    <YAxis 
                        type="number" 
                        dataKey="logProb" 
                        name="ln(P)" 
                        tick={axisStyle}
                        tickLine={{ stroke: colors.axis }}
                        axisLine={{ stroke: colors.axis }}
                        tickFormatter={formatTick}
                        domain={['auto', 'auto']}
                        label={{ value: 'ln(P)', angle: -90, position: 'insideLeft', ...labelStyle, offset: 5 }}
                    />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: colors.text, fontWeight: 500 }}/>
                    
                    <Line 
                        data={data.energyLog} 
                        type="monotone" 
                        dataKey="theoreticalLog" 
                        name={t.charts.theory} 
                        stroke={colors.theory} 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={false}
                    />
                    
                    <Scatter 
                        data={data.energyLog} 
                        name={t.charts.simulation} 
                        fill={colors.simulation} 
                        shape="circle"
                        line={false}
                        isAnimationActive={false}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
     )
  }

  if (type === 'tempError') {
      return (
        <div className={containerClass}>
            <h4 className="text-center text-sm font-bold text-slate-800 mb-2 tracking-tight">{t.charts.tempError}</h4>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.tempHistory} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                    <XAxis 
                        dataKey="time" 
                        tick={axisStyle}
                        tickLine={{ stroke: colors.axis }}
                        axisLine={{ stroke: colors.axis }}
                        tickFormatter={formatTick}
                        label={{ value: t.charts.timeX, position: 'insideBottom', offset: -10, ...labelStyle }}
                    />
                    <YAxis 
                        tick={axisStyle}
                        tickLine={{ stroke: colors.axis }}
                        axisLine={{ stroke: colors.axis }}
                        tickFormatter={formatTick}
                        label={{ value: t.charts.errorY, angle: -90, position: 'insideLeft', ...labelStyle, offset: 5 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="error" stroke={colors.area} fill={colors.area} fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} name={t.charts.tempError} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      );
  }

  if (type === 'totalEnergy') {
    return (
      <div className={containerClass}>
          <h4 className="text-center text-sm font-bold text-slate-800 mb-2 tracking-tight">{t.charts.totalEnergy}</h4>
          <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.tempHistory} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                  <XAxis 
                      dataKey="time" 
                      tick={axisStyle}
                      tickLine={{ stroke: colors.axis }}
                      axisLine={{ stroke: colors.axis }}
                      tickFormatter={formatTick}
                      label={{ value: t.charts.timeX, position: 'insideBottom', offset: -10, ...labelStyle }}
                  />
                  <YAxis 
                      tick={axisStyle}
                      tickLine={{ stroke: colors.axis }}
                      axisLine={{ stroke: colors.axis }}
                      tickFormatter={formatTick}
                      domain={['auto', 'auto']}
                      label={{ value: t.charts.energyY, angle: -90, position: 'insideLeft', ...labelStyle, offset: 5 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="totalEnergy" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} name={t.charts.totalEnergy} />
              </AreaChart>
          </ResponsiveContainer>
      </div>
    );
}

  return null;
};

export default DistributionCharts;