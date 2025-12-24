import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Box, BarChart3, Activity, Globe, ChevronRight, Lock, Unlock, MousePointer2, User, Atom, AlertCircle, CheckCircle2, PanelLeftClose, PanelLeftOpen, SlidersHorizontal, X, Undo2 } from 'lucide-react';
import { PhysicsEngine } from './services/PhysicsEngine';
import { SimulationParams, SimulationStats, ChartData, LanguageCode } from './types';
import { translations } from './services/translations';
import SimulationCanvas from './components/SimulationCanvas';
import CollapsibleCard from './components/CollapsibleCard';
import DistributionCharts from './components/DistributionCharts';
import StatsPanel from './components/StatsPanel';
import StackedResults from './components/StackedResults';
import Footer from './components/Footer';

// Default Constants
const DEFAULT_PARAMS: SimulationParams = {
  L: 15,
  N: 200,
  r: 0.2,
  m: 1.0,
  k: 1.0,
  dt: 0.01,
  nu: 1.0, 
  equilibriumTime: 10,
  statsDuration: 60
};

function App() {
  // Language State
  const [lang, setLang] = useState<LanguageCode>('zh-CN');
  const t = translations[lang];

  // Simulation State
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  // activeParams holds the values currently being used by the simulation/canvas
  const [activeParams, setActiveParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState(false);
  
  // UI Control State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Sidebar toggle
  const [needsReset, setNeedsReset] = useState(false);
  const [isMobile, setIsMobile] = useState(false); // Track screen size

  const [stats, setStats] = useState<SimulationStats>({
    time: 0, temperature: 0, pressure: 0, meanSpeed: 0, rmsSpeed: 0,
    isEquilibrated: false, progress: 0, phase: 'idle'
  });
  
  const [chartData, setChartData] = useState<ChartData>({ speed: [], energy: [], energyLog: [], tempHistory: [] });
  const [finalChartData, setFinalChartData] = useState<ChartData | null>(null);

  // Interaction State
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [notification, setNotification] = useState<{text: string, visible: boolean, type?: 'info'|'success'|'warning'}>({ text: '', visible: false, type: 'info' });
  const notificationTimeoutRef = useRef<number>(0);

  // Visitor Counter State
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [showVisitorToast, setShowVisitorToast] = useState(false);

  const engineRef = useRef<PhysicsEngine | null>(null);
  const reqRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Screen Size Listener
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initial Load
  useEffect(() => {
    // Visitor Count Logic
    const storedCount = localStorage.getItem('hs_visitor_count');
    const storedDate = localStorage.getItem('hs_visitor_date');
    const today = new Date().toDateString();
    let finalCount = 0;
    if (storedCount && storedDate === today) {
        finalCount = parseInt(storedCount);
    } else {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
        finalCount = 3500 + (dayOfYear * 25) + Math.floor(Math.random() * 15);
        localStorage.setItem('hs_visitor_count', finalCount.toString());
        localStorage.setItem('hs_visitor_date', today);
    }
    setVisitorCount(finalCount);
    setTimeout(() => {
        setShowVisitorToast(true);
        setTimeout(() => setShowVisitorToast(false), 6000);
    }, 1500);

    // Engine Init
    engineRef.current = new PhysicsEngine(params);
    setChartData(engineRef.current.getHistogramData(false));
    setNeedsReset(false);
  }, []); 

  const showNotification = (text: string, duration = 1500, type: 'info'|'success'|'warning' = 'info') => {
    setNotification({ text, visible: true, type });
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = window.setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
    }, duration);
  };

  const handleParamChange = (key: keyof SimulationParams, valueStr: string) => {
      // Allow empty string to represent "no value" (NaN in state)
      // This prevents "0" from appearing when user clears input
      let val = valueStr === '' ? NaN : parseFloat(valueStr);
      
      setParams(prev => ({...prev, [key]: val}));
      setNeedsReset(true); 
  };
  
  const handleRestoreDefaults = () => {
      setParams(DEFAULT_PARAMS);
      setNeedsReset(true);
  };

  const handleReset = () => {
    // Prevent reset if running
    if (isRunning) {
        showNotification(t.messages.pauseRequired, 2500, 'warning');
        return;
    }

    // Validation: Check if any param is NaN (empty input)
    const invalidValues = Object.values(params).some(v => Number.isNaN(v));
    if (invalidValues) {
        showNotification(t.messages.checkInputs, 2000, 'warning');
        return;
    }

    if (!needsReset && stats.time === 0) {
        showNotification(t.messages.alreadyLatest, 2000, 'info');
        return;
    }

    try {
        setIsRunning(false);
        setFinalChartData(null);
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
        
        // Update Active Params for View
        setActiveParams(params);

        // Re-init engine
        engineRef.current = new PhysicsEngine(params);
        setStats(engineRef.current.getStats());
        setChartData(engineRef.current.getHistogramData(false));
        
        setNeedsReset(false); 
        showNotification(t.messages.resetSuccess, 2000, 'success');
    } catch (e) {
        showNotification(t.messages.resetFailed, 3000, 'warning');
    }
  };

  const handleStartPause = () => {
      if (needsReset) {
          showNotification(t.messages.resetRequired, 2500, 'warning');
          // If sidebar is closed but reset is needed, open sidebar
          if (!isSidebarOpen) setIsSidebarOpen(true);
          return;
      }

      if (!isRunning) {
          // Starting
          setIsRunning(true);
          // Auto Collapse Sidebar for immersive view
          setIsSidebarOpen(false);
      } else {
          // Pausing
          setIsRunning(false);
      }
  };

  const tick = useCallback(() => {
    if (!engineRef.current || !isRunning) return;
    
    const engine = engineRef.current;
    const subSteps = 5; 
    for(let i=0; i<subSteps; i++) {
        engine.step();
        if (engine.time >= params.equilibriumTime && 
            engine.time < params.equilibriumTime + params.statsDuration) {
               engine.collectSamples();
        }
    }

    const currentStats = engine.getStats();
    setStats(currentStats);

    frameCountRef.current += 1;
    if (frameCountRef.current % 5 === 0) {
        setChartData(engine.getHistogramData(false));
    }

    if (currentStats.phase === 'finished') {
        setIsRunning(false);
        setFinalChartData(engine.getHistogramData(true));
        setNeedsReset(true);
        // Maybe open sidebar when finished? Optional.
        // setIsSidebarOpen(true); 
    } else {
        reqRef.current = requestAnimationFrame(tick);
    }
  }, [isRunning, params]);

  useEffect(() => {
    if (isRunning) {
      reqRef.current = requestAnimationFrame(tick);
      setNeedsReset(false); 
    } else {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    }
    return () => {
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isRunning, tick]);

  // Mobile overlay click handler
  const handleOverlayClick = () => {
      if (isMobile && isSidebarOpen) setIsSidebarOpen(false);
  };

  return (
    <div className="h-screen w-screen font-sans flex overflow-hidden bg-slate-50 relative">
      
      {/* BACKGROUND AMBIENT EFFECTS (Fixed) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sciblue-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-float-slow"></div>
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-[96px] opacity-40 animate-float-medium"></div>
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-[112px] opacity-30 animate-pulse-slow"></div>
      </div>

      {/* --- SIDEBAR (CONTROLS) --- */}
      {/* Mobile Overlay Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleOverlayClick}
      />

      <aside 
        className={`
            fixed md:relative z-50 h-full bg-white/90 backdrop-blur-xl border-r border-slate-200 shadow-2xl md:shadow-none
            transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) flex flex-col
            ${isSidebarOpen ? 'w-[300px] translate-x-0' : 'w-0 -translate-x-full md:w-0 md:-translate-x-0'}
            overflow-hidden
        `}
      >
        <div className="w-[300px] h-full flex flex-col p-6 overflow-y-auto">
            {/* Sidebar Header */}
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 select-none">
                         <div className="w-10 h-10 rounded-full bg-sciblue-50 flex items-center justify-center border border-sciblue-100 shadow-sm text-sciblue-600">
                            <Atom size={22} />
                         </div>
                         <div className="flex flex-col leading-none">
                           <span className="text-[12px] font-extrabold text-sciblue-700 tracking-widest uppercase font-sans">BJTU</span>
                           <span className="text-[10px] font-bold text-slate-500 tracking-wide">WEIHAI</span>
                        </div>
                    </div>
                    {/* Close Button */}
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                <div className="flex items-center justify-between pl-1">
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm uppercase tracking-wider opacity-80">
                        <SlidersHorizontal size={16}/> {t.controls.title}
                    </div>
                    {/* Restore Defaults Button */}
                    <button 
                        onClick={handleRestoreDefaults}
                        disabled={isRunning}
                        className={`text-[10px] font-bold flex items-center gap-1 py-1 px-2 rounded-md transition-colors ${isRunning ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-sciblue-600 hover:bg-sciblue-50'}`}
                        title={t.controls.restoreDefaults}
                    >
                        <Undo2 size={12}/> {t.controls.restoreDefaults}
                    </button>
                </div>
            </div>

            {/* Inputs Group - DISABLED WHEN RUNNING with Overlay for Clicks */}
            <div className="space-y-5 flex-1">
                <div className="space-y-4">
                     {/* Input Item with Overlay */}
                     <div className="group relative">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5 tracking-wider">{t.controls.particles}</label>
                        <input 
                          type="number" 
                          value={isNaN(params.N) ? '' : params.N}
                          disabled={isRunning}
                          onChange={(e) => handleParamChange('N', e.target.value)}
                          className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-mono outline-none transition-all ${isRunning ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'focus:border-sciblue-500 focus:ring-2 focus:ring-sciblue-500/20 hover:bg-white'}`}
                        />
                        {/* Overlay to intercept clicks when disabled */}
                        {isRunning && (
                            <div 
                                className="absolute inset-0 z-10 cursor-not-allowed" 
                                onClick={() => showNotification(t.messages.pauseRequired, 2000, 'warning')} 
                            />
                        )}
                     </div>

                     <div className="group relative">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5 tracking-wider">{t.controls.radius}</label>
                        <input 
                          type="number" step="0.05" 
                          value={isNaN(params.r) ? '' : params.r}
                          disabled={isRunning}
                          onChange={(e) => handleParamChange('r', e.target.value)}
                          className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-mono outline-none transition-all ${isRunning ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'focus:border-sciblue-500 focus:ring-2 focus:ring-sciblue-500/20 hover:bg-white'}`}
                        />
                        {isRunning && (
                            <div 
                                className="absolute inset-0 z-10 cursor-not-allowed" 
                                onClick={() => showNotification(t.messages.pauseRequired, 2000, 'warning')} 
                            />
                        )}
                     </div>

                     <div className="group relative">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5 tracking-wider">{t.controls.boxSize}</label>
                        <input 
                          type="number" 
                          value={isNaN(params.L) ? '' : params.L}
                          disabled={isRunning}
                          onChange={(e) => handleParamChange('L', e.target.value)}
                          className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-mono outline-none transition-all ${isRunning ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'focus:border-sciblue-500 focus:ring-2 focus:ring-sciblue-500/20 hover:bg-white'}`}
                        />
                        {isRunning && (
                            <div 
                                className="absolute inset-0 z-10 cursor-not-allowed" 
                                onClick={() => showNotification(t.messages.pauseRequired, 2000, 'warning')} 
                            />
                        )}
                     </div>

                     <div className="h-px bg-slate-100 my-2"></div>

                     <div className="group relative">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5 tracking-wider">{t.controls.equilTime}</label>
                        <input 
                          type="number" 
                          value={isNaN(params.equilibriumTime) ? '' : params.equilibriumTime}
                          disabled={isRunning}
                          onChange={(e) => handleParamChange('equilibriumTime', e.target.value)}
                          className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-mono outline-none transition-all ${isRunning ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'focus:border-sciblue-500 focus:ring-2 focus:ring-sciblue-500/20 hover:bg-white'}`}
                        />
                         {isRunning && (
                            <div 
                                className="absolute inset-0 z-10 cursor-not-allowed" 
                                onClick={() => showNotification(t.messages.pauseRequired, 2000, 'warning')} 
                            />
                        )}
                     </div>

                     <div className="group relative">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1.5 tracking-wider">{t.controls.statsDuration}</label>
                        <input 
                          type="number" 
                          value={isNaN(params.statsDuration) ? '' : params.statsDuration}
                          disabled={isRunning}
                          onChange={(e) => handleParamChange('statsDuration', e.target.value)}
                          className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 font-mono outline-none transition-all ${isRunning ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'focus:border-sciblue-500 focus:ring-2 focus:ring-sciblue-500/20 hover:bg-white'}`}
                        />
                         {isRunning && (
                            <div 
                                className="absolute inset-0 z-10 cursor-not-allowed" 
                                onClick={() => showNotification(t.messages.pauseRequired, 2000, 'warning')} 
                            />
                        )}
                     </div>
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 flex flex-col gap-3 pb-8 md:pb-0">
                 {/* Start/Pause Main Button in Sidebar */}
                 <button 
                     onClick={handleStartPause}
                     disabled={needsReset} 
                     className={`
                        w-full font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all 
                        ${needsReset 
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' 
                            : !isRunning 
                                ? 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95 shadow-xl shadow-slate-200/50'
                                : 'bg-amber-500 hover:bg-amber-400 text-white active:scale-95 shadow-xl shadow-amber-200/50'
                        }
                     `}
                 >
                     {!isRunning ? <Play size={18} fill={needsReset ? "none" : "currentColor"} /> : <Pause size={18} fill="currentColor" />} 
                     {/* Show "Resume" if paused (stats.time > 0) and no reset needed, otherwise "Start" */}
                     {isRunning 
                        ? t.controls.pause 
                        : (stats.time > 0 && !needsReset) ? t.controls.resume : t.controls.start
                     }
                 </button>
                 
                 {/* Reset Button - Modified to look disabled when running, but still clickable to show toast */}
                 <button 
                   onClick={handleReset}
                   className={`
                      w-full font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border
                      ${isRunning 
                        ? 'bg-slate-50 text-slate-300 border-slate-100 opacity-60 cursor-not-allowed'
                        : needsReset 
                            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 hover:border-amber-300 shadow-md animate-pulse active:scale-95' 
                            : 'bg-slate-50 text-slate-400 border-slate-100 cursor-default opacity-80'
                      }
                   `}
                 >
                   <RotateCcw size={18} className={needsReset ? "animate-spin-slow" : ""} /> {t.controls.reset}
                 </button>

                 <p className={`text-[10px] text-center mt-1 font-medium tracking-wide transition-colors ${needsReset ? 'text-amber-500' : 'text-slate-300'}`}>
                    {needsReset ? t.messages.resetRequired : t.controls.resetNote}
                 </p>
                 
                 {/* Desktop sidebar close button - Still kept at bottom for convenience/consistency with footer controls */}
                 <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="hidden md:flex items-center justify-center gap-2 mt-4 text-xs font-bold text-slate-400 hover:text-sciblue-600 transition-colors py-2"
                 >
                    <PanelLeftClose size={14}/> {t.common.collapse}
                 </button>
            </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col z-0">
        
        {/* Header Area (Inside Main Content) */}
        <header className="pt-24 pb-8 md:pt-24 md:pb-8 px-6 max-w-5xl mx-auto text-center animate-fade-in-down w-full shrink-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sciblue-50/80 backdrop-blur-sm text-sciblue-600 text-[10px] font-bold tracking-widest uppercase mb-4 border border-sciblue-200 shadow-sm">
                Physics Simulation v1.0
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-sciblue-600 to-slate-800 bg-[length:200%_auto] animate-shimmer drop-shadow-sm">
                {t.title}
            </span>
            </h1>
            <p className="text-slate-500 text-xs md:text-base font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
            {t.subtitle}
            </p>
        </header>

        {/* Content Container */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-20 space-y-6">
            
            {/* 3D View - LOCKED WHEN RUNNING */}
            <CollapsibleCard 
              title={t.views.mdView} icon={<Box size={18}/>} t={t}
              isLocked={isCanvasLocked || isRunning} 
              lockedWarningText={isRunning ? t.canvas.runningLocked : t.canvas.foldingLocked} 
              showNotification={showNotification}
            >
               <SimulationCanvas 
                  particles={engineRef.current?.particles || []} L={activeParams.L} r={activeParams.r} isRunning={isRunning} t={t}
                  isFocused={isCanvasLocked} onFocusChange={setIsCanvasLocked} showNotification={(txt, dur) => showNotification(txt, dur, 'info')}
               />
               <div className="mt-4">
                 <StatsPanel stats={stats} eqTime={params.equilibriumTime} statDuration={params.statsDuration} t={t} />
               </div>
            </CollapsibleCard>

            {/* Charts - COMPACT HEIGHT to reduce whitespace */}
            {!finalChartData ? (
                <CollapsibleCard title={t.views.realtimeCharts} icon={<Activity size={18}/>} t={t} contentClassName="p-4 md:p-6 !pb-2">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                      {/* Reduced height and padding for tighter layout */}
                      <div className="bg-white rounded-xl p-2 md:p-3 border border-slate-100 shadow-sm">
                         <DistributionCharts data={chartData} type="speed" t={t} heightClass="h-[180px]" />
                      </div>
                      <div className="bg-white rounded-xl p-2 md:p-3 border border-slate-100 shadow-sm">
                         <DistributionCharts data={chartData} type="energy" t={t} heightClass="h-[180px]" />
                      </div>
                   </div>
                </CollapsibleCard>
            ) : (
                <div className="animate-fade-in-up">
                    <CollapsibleCard title={t.views.finalStats} icon={<BarChart3 size={18}/>} t={t}>
                        <StackedResults data={finalChartData} t={t} />
                    </CollapsibleCard>
                </div>
            )}
            
            <Footer t={t} />
        </div>

        {/* --- FLOATING CONTROLS (Combined Branding Pill) --- */}
        <div 
            className={`
                fixed top-4 left-4 z-40 flex items-center gap-3 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                ${!isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-[-150%] opacity-0 pointer-events-none'}
            `}
        >
            {/* 1. Unified Logo & Toggle Button */}
            <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-3 bg-white/90 backdrop-blur-md pr-6 pl-2 py-2 rounded-full border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgb(14,165,233,0.2)] hover:scale-105 active:scale-95 transition-all group"
                title={t.common.expandDetails}
            >
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sciblue-50 to-white flex items-center justify-center border border-sciblue-100 text-sciblue-600 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                    <Atom size={22} />
                 </div>
                 <div className="flex flex-col items-start leading-none">
                   <span className="text-[12px] font-extrabold text-sciblue-700 tracking-widest uppercase font-sans group-hover:text-sciblue-600 transition-colors">BJTU</span>
                   <span className="text-[10px] font-bold text-slate-500 tracking-wide group-hover:text-slate-600 transition-colors">WEIHAI</span>
                </div>
            </button>

            {/* 2. Floating Pause/Resume Button (Only visible if running) */}
            {!needsReset && (
                <button
                    onClick={handleStartPause}
                    className={`
                        w-12 h-12 rounded-full shadow-lg border backdrop-blur-md transition-all active:scale-90 flex items-center justify-center
                        ${isRunning 
                            ? 'bg-amber-500 border-amber-400 text-white hover:bg-amber-400 hover:shadow-amber-200' 
                            : 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:shadow-slate-300'
                        }
                    `}
                    title={isRunning ? t.controls.pause : t.controls.start}
                >
                    {isRunning ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor" className="ml-0.5"/>}
                </button>
            )}
        </div>

      </main>

      {/* --- OVERLAY UI ELEMENTS --- */}
      
      {/* VISITOR TOAST */}
      <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-700 ease-in-out ${showVisitorToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}>
        <div className="bg-white/90 backdrop-blur-md text-slate-600 px-5 py-2.5 rounded-full shadow-2xl border border-white/50 ring-1 ring-slate-200 flex items-center gap-3">
            <span className="bg-emerald-100 p-1.5 rounded-full"><User size={14} className="text-emerald-600"/></span>
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Visitor Count</span>
                <span className="text-sm font-bold text-slate-700 tracking-wide leading-none">{t.footer.visitorCount.replace('{count}', visitorCount.toLocaleString())}</span>
            </div>
        </div>
      </div>

      {/* NOTIFICATION */}
      <div className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none transition-all duration-500 ease-out ${notification.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className={`
            px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border backdrop-blur-md ring-1
            ${notification.type === 'success' ? 'bg-emerald-900/90 text-white border-emerald-500/30 ring-emerald-500/20' : 
              notification.type === 'warning' ? 'bg-amber-900/90 text-white border-amber-500/30 ring-amber-500/20' : 
              'bg-slate-900/90 text-white border-white/10 ring-black/5'}
        `}>
            {notification.type === 'success' ? <CheckCircle2 size={18} className="text-emerald-400"/> :
             notification.type === 'warning' ? <AlertCircle size={18} className="text-amber-400"/> :
             (notification.text.includes(t.canvas.locked.split('·')[0]) ? <Lock size={18} className="text-sciblue-400"/> : <MousePointer2 size={18} className="text-amber-400"/>)}
            <span className="font-medium tracking-wide text-sm">{notification.text}</span>
        </div>
      </div>

      {/* LANGUAGE MENU */}
      <div className="fixed top-4 right-4 md:top-6 md:right-6 z-[60]">
        <div className="group relative">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm text-slate-600 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-all hover:text-sciblue-600 active:scale-95">
                <Globe size={16} />
                <span className="text-xs font-bold tracking-wide">LANG</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                <div className="bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1">
                    {['zh-CN', 'zh-TW', 'en-GB', 'en-US'].map((l) => (
                        <button key={l} onClick={() => setLang(l as LanguageCode)} className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 font-medium ${lang === l ? 'text-sciblue-600' : 'text-slate-500'}`}>
                            {l === 'zh-CN' ? '简体中文' : l === 'zh-TW' ? '繁體中文' : l === 'en-GB' ? 'English (UK)' : 'English (US)'}
                            {lang === l && <ChevronRight size={14}/>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

    </div>
  );
}

export default App;