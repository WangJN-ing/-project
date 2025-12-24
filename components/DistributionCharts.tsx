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
      <div className="bg-white border border-slate-200 p-2 rounded shadow-lg text-[10px] z-50 relative">
        <p className="font-bold mb-1 text-slate-900 border-b border-slate-100 pb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5 mb-0.5">
             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
             <span className="text-slate-600">{entry.name}:</span>
             <span className="font-mono font-bold text-slate-800">{Number(entry.value).toFixed(4)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DistributionCharts: React.FC<ChartProps> = ({ data, type, isFinal = false, t, heightClass = "h-[220px]" }) => {
  const containerClass = `w-full ${heightClass} flex flex-col`;
  
  // High Contrast Color Palette
  const colors = {
      simulation: isFinal ? "#3b82f6" : "#60a5fa", // Blue
      theory: "#ef4444",    // Red
      grid: "#e2e8f0",      // Slate 200 (Darker than before for visibility)
      axis: "#64748b",      // Slate 500 (Much darker than Slate 400)
      text: "#334155",      // Slate 700 (High contrast)
      area: "#f59e0b"       // Amber
  };

  const axisStyle = {
      fontSize: 10, // Slightly larger
      fontFamily: '"Inter", sans-serif',
      fill: colors.axis,
      fontWeight: 500
  };

  const labelStyle = {
      fontSize: 11,
      fontFamily: '"Inter", sans-serif',
      fontWeight: 700,
      fill: colors.text
  };

  const formatTick = (val: any) => Number(val).toFixed(2);
  
  // Tighter margins to maximize space
  const commonMargin = { top: 5, right: 10, left: 0, bottom: 5 };

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
        <h4 className="text-center text-[11px] font-bold text-slate-700 mb-2 uppercase tracking-wide">{isFinal ? t.charts.avgSpeed : t.charts.instSpeed}</h4>
        <div className="flex-1 min-h-0 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={commonMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis 
                dataKey="val" 
                tick={axisStyle}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                tickFormatter={formatTick}
                label={{ value: t.charts.speedX, position: 'insideBottom', offset: -5, ...labelStyle, fontSize: 10 }}
              />
              <YAxis 
                 tick={axisStyle}
                 tickLine={false}
                 axisLine={false}
                 tickFormatter={formatTick}
                 domain={fixedDomain}
                 allowDataOverflow={true}
                 label={{ value: 'P(v)', angle: -90, position: 'insideLeft', ...labelStyle, offset: 10, fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: '10px', color: colors.text, fontWeight: 600 }}/>
              <Bar dataKey="probability" name={t.charts.simulation} fill={colors.simulation} opacity={0.8} barSize={8} isAnimationActive={false} radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="theoretical" name={t.charts.theory} stroke={colors.theory} strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
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
        <h4 className="text-center text-[11px] font-bold text-slate-700 mb-2 uppercase tracking-wide">{isFinal ? t.charts.avgEnergy : t.charts.instEnergy}</h4>
        <div className="flex-1 min-h-0 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={commonMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
              <XAxis 
                dataKey="val" 
                tick={axisStyle}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                tickFormatter={formatTick}
                label={{ value: t.charts.energyX, position: 'insideBottom', offset: -5, ...labelStyle, fontSize: 10 }}
              />
              <YAxis 
                 tick={axisStyle}
                 tickLine={false}
                 axisLine={false}
                 tickFormatter={formatTick} 
                 domain={fixedDomain}
                 allowDataOverflow={true}
                 label={{ value: 'P(E)', angle: -90, position: 'insideLeft', ...labelStyle, offset: 10, fontSize: 10 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: '10px', color: colors.text, fontWeight: 600 }}/>
              <Bar dataKey="probability" name={t.charts.simulation} fill={colors.simulation} opacity={0.8} barSize={8} isAnimationActive={false} radius={[2, 2, 0, 0]} />
              <Line type="monotone" dataKey="theoretical" name={t.charts.theory} stroke={colors.theory} strokeWidth={2} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (type === 'semilog') {
     return (
        <div className={containerClass}>
            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart margin={commonMargin}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                      <XAxis 
                          type="number" 
                          dataKey="energy" 
                          name="Energy" 
                          tick={axisStyle}
                          tickLine={false}
                          axisLine={{ stroke: colors.grid }}
                          tickFormatter={formatTick}
                          domain={['dataMin', 'dataMax']}
                          label={{ value: t.charts.energyX, position: 'insideBottom', offset: -5, ...labelStyle, fontSize: 10 }}
                      />
                      <YAxis 
                          type="number" 
                          dataKey="logProb" 
                          name="ln(P)" 
                          tick={axisStyle}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={formatTick}
                          domain={['auto', 'auto']}
                          label={{ value: 'ln(P)', angle: -90, position: 'insideLeft', ...labelStyle, offset: 10, fontSize: 10 }}
                      />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={24} iconType="circle" wrapperStyle={{ fontSize: '10px', color: colors.text, fontWeight: 600 }}/>
                      
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
        </div>
     )
  }

  if (type === 'tempError') {
      return (
        <div className={containerClass}>
            <div className="flex-1 min-h-0 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.tempHistory} margin={commonMargin}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                      <XAxis 
                          dataKey="time" 
                          tick={axisStyle}
                          tickLine={false}
                          axisLine={{ stroke: colors.grid }}
                          tickFormatter={formatTick}
                          label={{ value: t.charts.timeX, position: 'insideBottom', offset: -5, ...labelStyle, fontSize: 10 }}
                      />
                      <YAxis 
                          tick={axisStyle}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={formatTick}
                          label={{ value: '% Error', angle: -90, position: 'insideLeft', ...labelStyle, offset: 10, fontSize: 10 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="error" stroke={colors.area} fill={colors.area} fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} name={t.charts.tempError} />
                  </AreaChart>
              </ResponsiveContainer>
            </div>
        </div>
      );
  }

  if (type === 'totalEnergy') {
    return (
      <div className={containerClass}>
          <div className="flex-1 min-h-0 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.tempHistory} margin={commonMargin}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
                    <XAxis 
                        dataKey="time" 
                        tick={axisStyle}
                        tickLine={false}
                        axisLine={{ stroke: colors.grid }}
                        tickFormatter={formatTick}
                        label={{ value: t.charts.timeX, position: 'insideBottom', offset: -5, ...labelStyle, fontSize: 10 }}
                    />
                    <YAxis 
                        tick={axisStyle}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatTick}
                        domain={['auto', 'auto']}
                        label={{ value: 'Energy E', angle: -90, position: 'insideLeft', ...labelStyle, offset: 10, fontSize: 10 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="totalEnergy" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={2} isAnimationActive={false} name={t.charts.totalEnergy} />
                </AreaChart>
            </ResponsiveContainer>
          </div>
      </div>
    );
}

  return null;
};

export default DistributionCharts;