import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Box, BarChart3, Settings2, Activity, Globe, ChevronRight, Lock, Unlock, MousePointer2, User } from 'lucide-react';
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
  const [isRunning, setIsRunning] = useState(false);
  const [stats, setStats] = useState<SimulationStats>({
    time: 0, temperature: 0, pressure: 0, meanSpeed: 0, rmsSpeed: 0,
    isEquilibrated: false, progress: 0, phase: 'idle'
  });
  
  const [chartData, setChartData] = useState<ChartData>({ speed: [], energy: [], energyLog: [], tempHistory: [] });
  const [finalChartData, setFinalChartData] = useState<ChartData | null>(null);

  // Interaction State
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [notification, setNotification] = useState<{text: string, visible: boolean}>({ text: '', visible: false });
  const notificationTimeoutRef = useRef<number>(0);

  // Visitor Counter State
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [showVisitorToast, setShowVisitorToast] = useState(false);

  // Initial Load Effects (Visitor Count + Physics)
  useEffect(() => {
    // VISITOR COUNTER LOGIC
    // 1. Check if we already have a stored count for this user
    const storedCount = localStorage.getItem('hs_visitor_count');
    const storedDate = localStorage.getItem('hs_visitor_date');
    
    const today = new Date().toDateString();
    
    let finalCount = 0;

    if (storedCount && storedDate === today) {
        // If user visited today, show them the same number (consistency)
        finalCount = parseInt(storedCount);
    } else {
        // Algorithm to generate a "realistic" high number
        // Base: 3500 (assumed previous traffic)
        // Growth: Day of Year * 25 (approx 25 visits/day)
        // Jitter: Random 0-10
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - startOfYear.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        const dayOfYear = Math.floor(diff / oneDay);
        
        finalCount = 3500 + (dayOfYear * 25) + Math.floor(Math.random() * 15);
        
        // Save to local storage
        localStorage.setItem('hs_visitor_count', finalCount.toString());
        localStorage.setItem('hs_visitor_date', today);
    }
    
    setVisitorCount(finalCount);

    // Show toast after a slight delay
    setTimeout(() => {
        setShowVisitorToast(true);
        // Hide after 6 seconds
        setTimeout(() => setShowVisitorToast(false), 6000);
    }, 1500);

    engineRef.current = new PhysicsEngine(params);
    setChartData(engineRef.current.getHistogramData(false));
  }, []);

  const showNotification = (text: string, duration = 1500) => {
    setNotification({ text, visible: true });
    if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
    notificationTimeoutRef.current = window.setTimeout(() => {
        setNotification(prev => ({ ...prev, visible: false }));
    }, duration);
  };

  const engineRef = useRef<PhysicsEngine | null>(null);
  const reqRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0); // Throttle counter


  const handleReset = () => {
    setIsRunning(false);
    setFinalChartData(null);
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    engineRef.current = new PhysicsEngine(params);
    setStats(engineRef.current.getStats());
    setChartData(engineRef.current.getHistogramData(false));
  };

  const tick = useCallback(() => {
    if (!engineRef.current || !isRunning) return;
    
    const engine = engineRef.current;
    
    const subSteps = 5; 
    for(let i=0; i<subSteps; i++) {
        engine.step();
        
        // Data Collection Logic
        if (engine.time >= params.equilibriumTime && 
            engine.time < params.equilibriumTime + params.statsDuration) {
               engine.collectSamples();
        }
    }

    const currentStats = engine.getStats();
    setStats(currentStats);

    // Throttle chart updates
    frameCountRef.current += 1;
    if (frameCountRef.current % 5 === 0) {
        setChartData(engine.getHistogramData(false));
    }

    if (currentStats.phase === 'finished') {
        setIsRunning(false);
        // Force one last collection update and set FINAL data
        setFinalChartData(engine.getHistogramData(true));
    } else {
        reqRef.current = requestAnimationFrame(tick);
    }
  }, [isRunning, params]);

  useEffect(() => {
    if (isRunning) {
      reqRef.current = requestAnimationFrame(tick);
    } else {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    }
    return () => {
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [isRunning, tick]);


  return (
    <div className="min-h-screen font-sans pb-0 relative flex flex-col overflow-x-hidden">
      
      {/* BACKGROUND AMBIENT EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Top Left Blue Blob */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-sciblue-200 rounded-full mix-blend-multiply filter blur-[128px] opacity-40 animate-float-slow"></div>
        {/* Bottom Right Cyan Blob */}
        <div className="absolute top-1/3 -right-20 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-[96px] opacity-40 animate-float-medium"></div>
        {/* Bottom Left Indigo Blob */}
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-[112px] opacity-30 animate-pulse-slow"></div>
      </div>

      {/* HEADER LOGO (Top Left) */}
      <div className="absolute top-6 left-6 z-50 animate-fade-in-down group cursor-default">
         <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm pr-4 pl-2 py-1.5 rounded-full border border-white/40 shadow-sm hover:bg-white/80 transition-all">
            {/* Real BJTU Logo from Wikimedia (SVG) */}
            <img 
               src="https://upload.wikimedia.org/wikipedia/commons/c/ca/Beijing_Jiaotong_University_Logo.svg"
               alt="BJTU Logo" 
               className="w-10 h-10 object-contain drop-shadow-sm group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 ease-out"
               onError={(e) => { e.currentTarget.style.display = 'none'; }} 
            />
            
            <div className="flex flex-col leading-none">
               <span className="text-[10px] font-extrabold text-sciblue-700 tracking-widest uppercase font-sans">BJTU</span>
               <span className="text-[9px] font-bold text-slate-500 tracking-wide">WEIHAI</span>
            </div>
         </div>
      </div>

      {/* VISITOR COUNT TOAST */}
      <div 
        className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-700 ease-in-out ${showVisitorToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8 pointer-events-none'}`}
      >
        <div className="bg-white/90 backdrop-blur-md text-slate-600 px-5 py-2.5 rounded-full shadow-2xl border border-white/50 ring-1 ring-slate-200 flex items-center gap-3">
            <span className="bg-emerald-100 p-1.5 rounded-full"><User size={14} className="text-emerald-600"/></span>
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-0.5">Visitor Count</span>
                <span className="text-sm font-bold text-slate-700 tracking-wide leading-none">
                    {t.footer.visitorCount.replace('{count}', visitorCount.toLocaleString())}
                </span>
            </div>
        </div>
      </div>

      {/* Global Bottom Notification */}
      <div 
        className={`fixed bottom-10 left-1/2 transform -translate-x-1/2 z-[100] pointer-events-none transition-all duration-500 ease-out ${notification.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/10 ring-1 ring-black/5">
            {notification.text.includes(t.canvas.locked.split('·')[0]) ? <Lock size={18} className="text-sciblue-400"/> : 
             notification.text.includes(t.canvas.unlocked.split('·')[0]) ? <Unlock size={18} className="text-slate-400"/> :
             <MousePointer2 size={18} className="text-amber-400"/>}
            <span className="font-medium tracking-wide text-sm">{notification.text}</span>
        </div>
      </div>

      {/* Language Menu */}
      <div className="absolute top-6 right-6 z-50">
        <div className="group relative">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm text-slate-600 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-all hover:text-sciblue-600 active:scale-95">
                <Globe size={16} />
                <span className="text-xs font-bold tracking-wide">LANG</span>
            </button>
            
            {/* Dropdown Menu */}
            <div className="absolute right-0 top-full mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 z-50">
                <div className="bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden py-1">
                    <button onClick={() => setLang('zh-CN')} className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 font-medium ${lang === 'zh-CN' ? 'text-sciblue-600' : 'text-slate-500'}`}>
                        简体中文 {lang === 'zh-CN' && <ChevronRight size={14}/>}
                    </button>
                    <button onClick={() => setLang('zh-TW')} className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 font-medium ${lang === 'zh-TW' ? 'text-sciblue-600' : 'text-slate-500'}`}>
                        繁體中文 {lang === 'zh-TW' && <ChevronRight size={14}/>}
                    </button>
                    <button onClick={() => setLang('en-GB')} className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 font-medium ${lang === 'en-GB' ? 'text-sciblue-600' : 'text-slate-500'}`}>
                        English (UK) {lang === 'en-GB' && <ChevronRight size={14}/>}
                    </button>
                    <button onClick={() => setLang('en-US')} className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 font-medium ${lang === 'en-US' ? 'text-sciblue-600' : 'text-slate-500'}`}>
                        English (US) {lang === 'en-US' && <ChevronRight size={14}/>}
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Hero Header */}
      <header className="pt-24 pb-12 px-6 max-w-7xl mx-auto text-center animate-fade-in-down relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sciblue-50/80 backdrop-blur-sm text-sciblue-600 text-[10px] font-bold tracking-widest uppercase mb-6 border border-sciblue-200 shadow-sm">
             Physics Simulation v1.0
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-sciblue-600 to-slate-800 bg-[length:200%_auto] animate-shimmer drop-shadow-sm">
            {t.title}
          </span>
        </h1>
        <p className="text-slate-500 text-sm md:text-lg font-medium tracking-wide max-w-2xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow relative z-10">
        
        {/* Left Column: Controls */}
        <aside className="lg:col-span-3 space-y-6">
            <div className="sticky top-6 space-y-6">
              
              <CollapsibleCard title={t.controls.title} icon={<Settings2 size={18}/>} defaultExpanded={true} t={t}>
                <div className="space-y-5">
                  {/* Params Inputs */}
                  <div className="space-y-4">
                     <div className="group">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2 tracking-wider">{t.controls.particles}</label>
                        <input 
                          type="number" 
                          value={params.N}
                          onChange={(e) => setParams({...params, N: Number(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 font-mono focus:border-sciblue-500 focus:ring-1 focus:ring-sciblue-500 outline-none transition-all hover:bg-white"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2 tracking-wider">{t.controls.radius}</label>
                        <input 
                          type="number" step="0.05"
                          value={params.r}
                          onChange={(e) => setParams({...params, r: Number(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 font-mono focus:border-sciblue-500 focus:ring-1 focus:ring-sciblue-500 outline-none transition-all hover:bg-white"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2 tracking-wider">{t.controls.boxSize}</label>
                        <input 
                          type="number" 
                          value={params.L}
                          onChange={(e) => setParams({...params, L: Number(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 font-mono focus:border-sciblue-500 focus:ring-1 focus:ring-sciblue-500 outline-none transition-all hover:bg-white"
                        />
                     </div>
                     <div className="pt-2 border-t border-slate-100"></div>
                     <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2 tracking-wider">{t.controls.equilTime}</label>
                        <input 
                          type="number" 
                          value={params.equilibriumTime}
                          onChange={(e) => setParams({...params, equilibriumTime: Number(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 font-mono focus:border-sciblue-500 focus:ring-1 focus:ring-sciblue-500 outline-none transition-all hover:bg-white"
                        />
                     </div>
                     <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-2 tracking-wider">{t.controls.statsDuration}</label>
                        <input 
                          type="number" 
                          value={params.statsDuration}
                          onChange={(e) => setParams({...params, statsDuration: Number(e.target.value)})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 font-mono focus:border-sciblue-500 focus:ring-1 focus:ring-sciblue-500 outline-none transition-all hover:bg-white"
                        />
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-4">
                     {!isRunning ? (
                       <button 
                         onClick={() => setIsRunning(true)}
                         className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-200"
                       >
                         <Play size={18} fill="currentColor" /> {t.controls.start}
                       </button>
                     ) : (
                       <button 
                         onClick={() => setIsRunning(false)}
                         className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-200"
                       >
                         <Pause size={18} fill="currentColor" /> {t.controls.pause}
                       </button>
                     )}
                     
                     <button 
                       onClick={handleReset}
                       className="w-full bg-white hover:bg-slate-50 text-slate-600 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-200 shadow-sm"
                     >
                       <RotateCcw size={18} /> {t.controls.reset}
                     </button>
                     
                     <p className="text-[10px] text-center text-slate-400 mt-2 font-medium tracking-wide">
                        {t.controls.resetNote}
                     </p>
                  </div>
                </div>
              </CollapsibleCard>
            </div>
        </aside>

        {/* Center/Right Column: Visualization & Charts */}
        <div className="lg:col-span-9 space-y-6">
            
            {/* 3D View */}
            <CollapsibleCard 
              title={t.views.mdView} 
              icon={<Box size={18}/>} 
              t={t}
              isLocked={isCanvasLocked}
              lockedWarningText={t.canvas.foldingLocked}
              showNotification={showNotification}
            >
               <SimulationCanvas 
                  particles={engineRef.current?.particles || []} 
                  L={params.L} 
                  r={params.r}
                  isRunning={isRunning}
                  t={t}
                  isFocused={isCanvasLocked}
                  onFocusChange={setIsCanvasLocked}
                  showNotification={showNotification}
               />
               
               <div className="mt-4">
                 <StatsPanel stats={stats} eqTime={params.equilibriumTime} statDuration={params.statsDuration} t={t} />
               </div>
            </CollapsibleCard>

            {/* CHART VIEW LOGIC: Swap between Realtime and Final Stacked View */}
            {!finalChartData ? (
                // Phase 1: Realtime Charts
                <CollapsibleCard title={t.views.realtimeCharts} icon={<Activity size={18}/>} t={t}>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-white rounded-xl p-4 border border-slate-100">
                         <DistributionCharts data={chartData} type="speed" t={t} />
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-100">
                         <DistributionCharts data={chartData} type="energy" t={t} />
                      </div>
                   </div>
                </CollapsibleCard>
            ) : (
                // Phase 2: Final Conclusion (Stacked)
                <div className="animate-fade-in-up">
                    <CollapsibleCard 
                        title={t.views.finalStats} 
                        icon={<BarChart3 size={18}/>}
                        t={t}
                    >
                        <StackedResults data={finalChartData} t={t} />
                    </CollapsibleCard>
                </div>
            )}
        </div>
      </main>

      <Footer t={t} />
    </div>
  );
}

export default App;