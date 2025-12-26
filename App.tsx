import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Box, Activity, Globe, ChevronRight, Lock, Unlock, MousePointer2, User, Atom, AlertCircle, CheckCircle2, PanelLeftClose, SlidersHorizontal, X, Undo2, LayoutDashboard, Moon, Sun, ArrowLeft } from 'lucide-react';
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

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Simulation State
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [activeParams, setActiveParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const [isRunning, setIsRunning] = useState(false);
  
  // UI Control State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [needsReset, setNeedsReset] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // New State: Mobile Hint Guide & Interaction Tracking
  const [showMobileHint, setShowMobileHint] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

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

  // Visitor Counter
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [showVisitorToast, setShowVisitorToast] = useState(false);

  const engineRef = useRef<PhysicsEngine | null>(null);
  const reqRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  // Dark Mode Logic
  useEffect(() => {
    // Check local storage or system preference
    const storedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (storedTheme === 'dark' || (!storedTheme && systemPrefersDark)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      if (newMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('theme', 'dark');
      } else {
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
      }
  };

  // Screen Size Listener & Mobile Init Logic
  useEffect(() => {
    const checkMobile = () => {
        const mobile = window.innerWidth < 768;
        setIsMobile(mobile);
        // FORCE CLOSE SIDEBAR ON MOBILE INIT
        if (mobile) {
            setIsSidebarOpen(false);
        }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile Hint Timer Logic - Optimized
  useEffect(() => {
    let timer: number;
    // Show hint only if: Mobile + Sidebar Closed + Not Running + Never Interacted + After 2 seconds delay
    if (isMobile && !isSidebarOpen && !isRunning && !hasUserInteracted) {
        timer = window.setTimeout(() => {
            setShowMobileHint(true);
        }, 2000);
    } else {
        setShowMobileHint(false);
    }
    return () => clearTimeout(timer);
  }, [isMobile, isSidebarOpen, isRunning, hasUserInteracted]);

  // Initial Load & Animation smoothing
  useEffect(() => {
    // Determine visitor count
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
    
    // Init Engine
    engineRef.current = new PhysicsEngine(params);
    setChartData(engineRef.current.getHistogramData(false));
    setNeedsReset(false);

    // Show toast slightly later
    setTimeout(() => {
        setShowVisitorToast(true);
        setTimeout(() => setShowVisitorToast(false), 6000);
    }, 1500);
  }, []); 

  const showNotification = (text: string, duration = 1500, type: 'info'|'success'|'warning' = 'info') => {
    setNotification({ text, visible: true, type });
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = window.setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
    }, duration);
  };

  const handleParamChange = (key: keyof SimulationParams, valueStr: string) => {
      let val = valueStr === '' ? NaN : parseFloat(valueStr);
      setParams(prev => ({...prev, [key]: val}));
      setNeedsReset(true); 
  };
  
  const handleRestoreDefaults = () => {
      setParams(DEFAULT_PARAMS);
      setNeedsReset(true);
  };

  const handleReset = () => {
    if (isRunning) {
        showNotification(t.messages.pauseRequired, 2500, 'warning');
        return;
    }
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
        
        setActiveParams(params);
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
      setHasUserInteracted(true); // User has engaged, stop hints
      
      if (needsReset) {
          showNotification(t.messages.resetRequired, 2500, 'warning');
          if (!isSidebarOpen) setIsSidebarOpen(true);
          return;
      }

      if (!isRunning) {
          setIsRunning(true);
          // Smoother close for sidebar
          if (isSidebarOpen && isMobile) {
              setIsSidebarOpen(false); 
          }
      } else {
          setIsRunning(false);
      }
  };

  const handleOpenSidebar = () => {
      setIsSidebarOpen(true);
      setHasUserInteracted(true); // User has engaged, stop hints
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

  const handleOverlayClick = () => {
      if (isMobile && isSidebarOpen) setIsSidebarOpen(false);
  };

  return (
    <div className="h-screen w-screen font-sans flex overflow-hidden relative selection:bg-sciblue-200 selection:text-sciblue-900 dark:selection:bg-sciblue-900 dark:selection:text-sciblue-100 transition-colors duration-500">
      
      {/* --- SIDEBAR (CONTROLS) --- */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity duration-500 md:hidden ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={handleOverlayClick}
      />

      <aside 
        className={`
            fixed md:relative z-50 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl md:shadow-none
            transition-[width,transform,background-color] duration-500 cubic-bezier(0.25, 1, 0.5, 1) flex flex-col
            ${isSidebarOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0'}
            overflow-hidden
        `}
      >
        {/* Added safe-area padding for mobile: pt-14 */}
        <div className="w-[280px] min-w-[280px] h-full flex flex-col p-5 pt-14 md:pt-5 overflow-y-auto">
            {/* Sidebar Header */}
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 select-none">
                         {/* UPDATED ICON: Match floating button style */}
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sciblue-500 to-indigo-600 flex items-center justify-center border border-white/20 text-white shadow-inner">
                            <Atom size={18} />
                         </div>
                         <div className="flex flex-col leading-none">
                           <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t.brand.name}</span>
                           <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.brand.subtitle}</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors" title={t.tooltips.closeSidebar}>
                        <X size={18}/>
                    </button>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">
                        <SlidersHorizontal size={14} className="text-slate-400 dark:text-slate-500"/> {t.controls.title}
                    </div>
                    <button 
                        onClick={handleRestoreDefaults}
                        disabled={isRunning}
                        className={`text-[10px] font-medium flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${isRunning ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}
                        title={t.controls.restoreDefaults}
                    >
                        <Undo2 size={12}/> {t.controls.default}
                    </button>
                </div>
            </div>

            {/* Inputs Group */}
            <div className="space-y-4 flex-1">
                 {/* Input Fields - Cleaner Look */}
                 {[
                   { key: 'N', label: t.controls.particles, step: 1 },
                   { key: 'r', label: t.controls.radius, step: 0.05 },
                   { key: 'L', label: t.controls.boxSize, step: 1 },
                 ].map((field) => (
                    <div key={field.key} className="group relative">
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase block mb-1.5">{field.label}</label>
                        <div className="relative">
                            <input 
                            type="number" step={field.step}
                            value={isNaN(params[field.key as keyof SimulationParams]) ? '' : params[field.key as keyof SimulationParams]}
                            disabled={isRunning}
                            onChange={(e) => handleParamChange(field.key as keyof SimulationParams, e.target.value)}
                            className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-200 font-mono outline-none transition-all focus:bg-white dark:focus:bg-slate-700 ${isRunning ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'focus:border-sciblue-500 focus:ring-1 focus:ring-sciblue-500/20 hover:border-slate-300 dark:hover:border-slate-600'}`}
                            />
                            {isRunning && <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>}
                        </div>
                        {isRunning && <div className="absolute inset-0 z-10 cursor-not-allowed" onClick={() => showNotification(t.messages.pauseRequired, 2000, 'warning')} />}
                    </div>
                 ))}

                 <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

                 {[
                   { key: 'equilibriumTime', label: t.controls.equilTime },
                   { key: 'statsDuration', label: t.controls.statsDuration },
                 ].map((field) => (
                    <div key={field.key} className="group relative">
                        <label className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase block mb-1.5">{field.label}</label>
                        <div className="relative">
                            <input 
                            type="number" 
                            value={isNaN(params[field.key as keyof SimulationParams]) ? '' : params[field.key as keyof SimulationParams]}
                            disabled={isRunning}
                            onChange={(e) => handleParamChange(field.key as keyof SimulationParams, e.target.value)}
                            className={`w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-slate-700 dark:text-slate-200 font-mono outline-none transition-all focus:bg-white dark:focus:bg-slate-700 ${isRunning ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900' : 'focus:border-sciblue-500 focus:ring-1 focus:ring-sciblue-500/20 hover:border-slate-300 dark:hover:border-slate-600'}`}
                            />
                            {isRunning && <Lock size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"/>}
                        </div>
                         {isRunning && <div className="absolute inset-0 z-10 cursor-not-allowed" onClick={() => showNotification(t.messages.pauseRequired, 2000, 'warning')} />}
                    </div>
                 ))}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 flex flex-col gap-3 pb-8 md:pb-0">
                 <button 
                     onClick={handleStartPause}
                     disabled={needsReset} 
                     className={`
                        w-full font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all text-sm shadow-sm
                        ${needsReset 
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700' 
                            : !isRunning 
                                ? 'bg-slate-900 dark:bg-sciblue-600 hover:bg-slate-800 dark:hover:bg-sciblue-500 text-white active:scale-95'
                                : 'bg-white dark:bg-slate-800 border-2 border-amber-500 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-slate-700'
                        }
                     `}
                     title={isRunning ? t.controls.pause : t.controls.start}
                 >
                     {!isRunning ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />} 
                     {isRunning 
                        ? t.controls.pause 
                        : (stats.time > 0 && !needsReset) ? t.controls.resume : t.controls.start
                     }
                 </button>
                 
                 <button 
                   onClick={handleReset}
                   className={`
                      w-full font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all border text-sm
                      ${isRunning 
                        ? 'bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                        : needsReset 
                            ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:border-amber-300 shadow-sm' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                      }
                   `}
                   title={t.controls.reset}
                 >
                   <RotateCcw size={16} className={needsReset ? "animate-spin-slow" : ""} /> {t.controls.reset}
                 </button>
                 
                 <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="hidden md:flex items-center justify-center gap-2 mt-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-sciblue-600 dark:hover:text-sciblue-400 transition-colors py-2 uppercase tracking-widest"
                    title={t.common.collapse}
                 >
                    <PanelLeftClose size={12}/> {t.common.collapse}
                 </button>
            </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col z-0 scroll-smooth">
        
        {/* Modern Header Area */}
        {/* Landscape Optimization: Reduced top/bottom padding to maximize vertical space */}
        <header className="pt-24 pb-4 landscape:pt-6 landscape:pb-1 md:pt-24 md:pb-6 px-6 max-w-4xl mx-auto text-center animate-fade-in w-full shrink-0">
            {/* Version Badge - Centered Above Title */}
            <div className="flex justify-center mb-5 landscape:mb-2">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold tracking-[0.2em] uppercase shadow-sm ring-1 ring-slate-100 dark:ring-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]"></span>
                    {t.header.systemOp} · v2.1
                </div>
            </div>
            
            {/* Metallic Title with CSS Animation - Adjusted for mobile wrapping */}
            <h1 className="text-2xl sm:text-4xl landscape:text-3xl md:text-6xl font-serif font-black mb-4 landscape:mb-1 tracking-tight text-metallic whitespace-nowrap">
                {t.title}
            </h1>
            
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
                {t.subtitle}
            </p>
        </header>

        {/* Content Container */}
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 landscape:pb-4 space-y-6">
            
            {/* 3D View Card */}
            <CollapsibleCard 
              title={t.views.mdView} icon={<Box size={18} className="text-sciblue-600 dark:text-sciblue-400"/>} t={t}
              isLocked={isCanvasLocked || isRunning} 
              lockedWarningText={isRunning ? t.canvas.runningLocked : t.canvas.foldingLocked} 
              showNotification={showNotification}
              className="border-slate-200 shadow-sm bg-white"
              expandText={t.common.expandView}
            >
               {/* PASS isMobile PROP */}
               <SimulationCanvas 
                  particles={engineRef.current?.particles || []} L={activeParams.L} r={activeParams.r} isRunning={isRunning} t={t}
                  isFocused={isCanvasLocked} onFocusChange={setIsCanvasLocked} showNotification={(txt, dur) => showNotification(txt, dur, 'info')}
                  isMobile={isMobile}
               />
               <div className="mt-4">
                 <StatsPanel stats={stats} eqTime={params.equilibriumTime} statDuration={params.statsDuration} t={t} />
               </div>
            </CollapsibleCard>

            {/* Realtime Monitor */}
            {!finalChartData ? (
                <CollapsibleCard 
                    title={t.views.realtimeCharts} 
                    icon={<Activity size={18} className="text-emerald-500"/>} 
                    t={t} 
                    contentClassName="p-0"
                    className="border-slate-200 shadow-sm bg-white overflow-hidden"
                    expandText={t.common.expandCharts}
                >
                   <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 dark:divide-slate-800">
                      <div className="p-4 md:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <DistributionCharts data={chartData} type="speed" t={t} heightClass="h-[240px] md:h-[260px]" isDarkMode={isDarkMode}/>
                      </div>
                      <div className="p-4 md:p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                         <DistributionCharts data={chartData} type="energy" t={t} heightClass="h-[240px] md:h-[260px]" isDarkMode={isDarkMode} />
                      </div>
                   </div>
                </CollapsibleCard>
            ) : (
                <div className="animate-slide-up">
                    <CollapsibleCard 
                        title={t.views.finalStats} 
                        icon={<LayoutDashboard size={18} className="text-amber-500"/>} 
                        t={t}
                        expandText={t.common.expandResults}
                    >
                        <StackedResults data={finalChartData} t={t} isDarkMode={isDarkMode} />
                    </CollapsibleCard>
                </div>
            )}
            
        </div>
        
        {/* Footer Restored Here */}
        <Footer t={t} showNotification={(msg, dur, type) => showNotification(msg, dur, type)} />

        {/* --- FLOATING CONTROLS (Left Top) --- */}
        <div 
            className={`
                fixed top-14 md:top-6 left-4 z-40 flex items-center gap-3 transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                ${!isSidebarOpen ? 'translate-x-0 opacity-100' : 'translate-x-[-150%] opacity-0 pointer-events-none'}
            `}
        >
            <div className="relative">
                {/* Mobile Hint Ping Animation Layer */}
                {showMobileHint && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sciblue-400 opacity-75"></span>
                )}
                
                <button
                    onClick={handleOpenSidebar}
                    title={t.tooltips.openSidebar}
                    // Reduced padding on mobile: pr-3 pl-1 py-1
                    // Added ring animation support for mobile hint
                    className={`
                        relative flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md pr-3 pl-1 py-1 md:pr-5 md:pl-1.5 md:py-1.5 rounded-full border shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(14,165,233,0.15)] hover:scale-105 active:scale-95 transition-all group z-10
                        ${showMobileHint ? 'border-sciblue-400 ring-2 ring-sciblue-400/30' : 'border-slate-200/60 dark:border-slate-700/60'}
                    `}
                >
                     {/* Reduced size: w-6 h-6 on mobile */}
                     <div className="w-6 h-6 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-sciblue-500 to-indigo-600 flex items-center justify-center border border-white/20 text-white shadow-inner group-hover:rotate-12 transition-transform duration-500">
                        <Atom size={isMobile ? 12 : 18} />
                     </div>
                     <div className="flex flex-col items-start leading-none group-hover:text-sciblue-600 dark:group-hover:text-sciblue-400 transition-colors duration-300">
                       {/* Reduced font size */}
                       <span className="text-[8px] md:text-[11px] font-extrabold text-slate-700 dark:text-slate-200 tracking-widest uppercase font-mono group-hover:text-sciblue-600 dark:group-hover:text-sciblue-400">BJTU</span>
                       <span className="text-[8px] md:text-[9px] font-bold text-slate-400 dark:text-slate-500 tracking-wide group-hover:text-sciblue-400 dark:group-hover:text-sciblue-300">WEIHAI</span>
                    </div>
                </button>

                {/* Mobile Tooltip Guide - MOVED INSIDE RELATIVE WRAPPER & POSITIONED BELOW */}
                {showMobileHint && (
                   <div className="absolute top-full left-0 mt-2 flex flex-col items-start animate-fade-in pointer-events-none z-50 w-max">
                      {/* Arrow pointing up */}
                      <div className="w-0 h-0 border-x-[6px] border-x-transparent border-b-[8px] border-b-sciblue-500 ml-3 drop-shadow-sm"></div>
                      {/* Text Bubble */}
                      <span className="bg-sciblue-50 dark:bg-sciblue-900/95 text-sciblue-700 dark:text-sciblue-100 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg border border-sciblue-500 whitespace-nowrap">
                         {t.tooltips.openSidebar}
                      </span>
                   </div>
                )}
            </div>

            {!needsReset && (
                <button
                    onClick={handleStartPause}
                    title={isRunning ? t.controls.pause : t.controls.start}
                    // Reduced size: w-8 h-8 on mobile
                    className={`
                        w-8 h-8 md:w-11 md:h-11 rounded-full shadow-lg border backdrop-blur-md transition-all active:scale-90 flex items-center justify-center
                        ${isRunning 
                            ? 'bg-amber-500 border-amber-400 text-white hover:bg-amber-400 hover:shadow-amber-200/50' 
                            : 'bg-slate-800 dark:bg-sciblue-600 border-slate-700 dark:border-sciblue-500 text-white hover:bg-slate-700 dark:hover:bg-sciblue-500 hover:shadow-slate-300/50'
                        }
                    `}
                >
                    {isRunning ? <Pause size={isMobile ? 14 : 18} fill="currentColor"/> : <Play size={isMobile ? 14 : 18} fill="currentColor" className="ml-0.5"/>}
                </button>
            )}
        </div>

      </main>

      {/* VISITOR TOAST - MOVED TO BOTTOM */}
      <div className={`fixed bottom-24 md:bottom-10 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-700 ease-in-out ${showVisitorToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md text-slate-600 dark:text-slate-200 px-5 py-2 rounded-full shadow-xl border border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <span className="bg-emerald-100 dark:bg-emerald-900/40 p-1 rounded-full"><User size={12} className="text-emerald-600 dark:text-emerald-400"/></span>
            {/* Localized Visitor String */}
            <span className="text-xs font-medium tracking-wide">
                {t.footer.visitorCount.replace('{count}', visitorCount.toLocaleString())}
            </span>
        </div>
      </div>

      {/* NOTIFICATION */}
      <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none transition-all duration-500 ease-out ${notification.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className={`
            px-5 py-2.5 rounded-lg shadow-xl flex items-center gap-3 border backdrop-blur-md
            ${notification.type === 'success' ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' : 
              notification.type === 'warning' ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900' : 
              'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-slate-700 dark:border-slate-200'}
        `}>
            {notification.type === 'success' ? <CheckCircle2 size={16} className="text-emerald-500"/> :
             notification.type === 'warning' ? <AlertCircle size={16} className="text-amber-500"/> :
             (notification.text.includes(t.canvas.locked.split('·')[0]) ? <Lock size={16} className="text-sciblue-400"/> : <MousePointer2 size={16} className="text-amber-400"/>)}
            <span className="font-medium text-sm">{notification.text}</span>
        </div>
      </div>

      {/* RIGHT TOP CONTROLS: Dark Mode + Language */}
      {/* Hide on Mobile when sidebar is open to prevent overlap with Sidebar Close button */}
      <div className={`fixed top-14 right-4 md:top-6 md:right-6 z-[60] flex items-center gap-3 transition-opacity duration-300 ${isMobile && isSidebarOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {/* Dark Mode Toggle */}
        <button 
            onClick={toggleDarkMode}
            className="flex items-center justify-center w-8 h-8 md:w-auto md:px-3 md:py-1.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-sm text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-sciblue-400 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all active:scale-95 shadow-sm"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
            <span className="hidden md:inline-block text-xs font-bold tracking-wide ml-2">{isDarkMode ? t.common.modeDark : t.common.modeLight}</span>
        </button>

        {/* Language Menu */}
        <div className="group relative">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-all active:scale-95 shadow-sm">
                <Globe size={16} />
                {/* HIDDEN ON MOBILE */}
                <span className="hidden md:inline-block text-xs font-bold tracking-wide">{t.header.language}</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden py-1">
                    {['zh-CN', 'zh-TW', 'en-GB', 'en-US'].map((l) => (
                        <button key={l} onClick={() => setLang(l as LanguageCode)} className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 font-medium ${lang === l ? 'text-sciblue-600 dark:text-sciblue-400' : 'text-slate-500 dark:text-slate-400'}`}>
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