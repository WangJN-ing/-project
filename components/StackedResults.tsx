import React, { useState, useRef, useEffect } from 'react';
import { ChartData, Translation } from '../types';
import DistributionCharts from './DistributionCharts';
import { ChevronUp, ChevronDown, Maximize2, Minimize2 } from 'lucide-react';

interface StackedResultsProps {
  data: ChartData;
  t: Translation;
}

const StackedResults: React.FC<StackedResultsProps> = ({ data, t }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Drag/Touch State
  const isDragging = useRef(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);

  // --- HEIGHT MANAGEMENT ---
  // Optimized heights for mobile visibility
  // Mobile Card Height: Increased to h-[600px] to fully show stacked charts
  
  // Chart container heights inside the cards
  // Increased mobile chart height from 200px to 250px for better readability
  const histHeight = isFullscreen ? "h-[320px]" : "h-[250px] md:h-[160px]"; 
  const singleHeight = isFullscreen ? "h-[450px]" : "h-[420px] md:h-[260px]";

  // Group 1: Histograms (Speed + Energy) - Compact Grid
  const HistogramGroup = () => (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 h-full ${isFullscreen ? 'p-4' : 'p-0 overflow-y-hidden'}`}>
      <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex flex-col justify-center">
         <DistributionCharts data={data} type="speed" isFinal={true} t={t} heightClass={histHeight} />
      </div>
      <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex flex-col justify-center">
         <DistributionCharts data={data} type="energy" isFinal={true} t={t} heightClass={histHeight} />
      </div>
    </div>
  );

  const cardGroups = [
    { id: 'histograms', content: <HistogramGroup />, title: t.charts.distributions },
    { id: 'semilog', content: <DistributionCharts data={data} type="semilog" isFinal={true} t={t} heightClass={singleHeight} />, title: t.charts.semilog },
    { id: 'totalEnergy', content: <DistributionCharts data={data} type="totalEnergy" t={t} heightClass={singleHeight} />, title: t.charts.totalEnergy },
    { id: 'tempError', content: <DistributionCharts data={data} type="tempError" t={t} heightClass={singleHeight} />, title: t.charts.tempError },
  ];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % cardGroups.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + cardGroups.length) % cardGroups.length);
  };

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if(isFullscreen) return; 
    isDragging.current = true;
    startY.current = e.clientY;
    setDragOffset(0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || isFullscreen) return;
    currentY.current = e.clientY;
    setDragOffset(currentY.current - startY.current);
  };

  const handleMouseUp = () => {
    endDrag();
  };

  const handleMouseLeave = () => {
      isDragging.current = false;
      setDragOffset(0);
  };

  // --- TOUCH HANDLERS (Mobile Swipe) ---
  const handleTouchStart = (e: React.TouchEvent) => {
      if(isFullscreen) return;
      isDragging.current = true;
      startY.current = e.touches[0].clientY;
      setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging.current || isFullscreen) return;
      currentY.current = e.touches[0].clientY;
      setDragOffset(currentY.current - startY.current);
  };

  const handleTouchEnd = () => {
      endDrag();
  };

  // Shared End Logic
  const endDrag = () => {
    if (!isDragging.current || isFullscreen) return;
    isDragging.current = false;
    
    const threshold = 50; 
    if (dragOffset < -threshold) {
       handleNext(); 
    } else if (dragOffset > threshold) {
       handlePrev(); 
    }
    setDragOffset(0);
  };

  // Fullscreen Logic
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const getCardStyle = (index: number) => {
    if (isFullscreen) return {};

    let offset = index - activeIndex;
    if (offset < 0) offset += cardGroups.length;

    const isActive = index === activeIndex;
    const isNext = index === (activeIndex + 1) % cardGroups.length;
    const isPrev = index === (activeIndex - 1 + cardGroups.length) % cardGroups.length;

    let zIndex = 0;
    let opacity = 0;
    let scale = 0.8;
    let translateY = 0; 

    if (isActive) {
        zIndex = 10;
        opacity = 1;
        scale = 1;
        translateY = dragOffset; 
    } else if (isNext) {
        zIndex = 5;
        opacity = 0.6;
        scale = 0.95;
        translateY = 35; // Tighter stack
    } else if (isPrev) {
        zIndex = 1; 
        opacity = 0; 
        scale = 0.9;
        translateY = -35;
    } else {
        zIndex = 0;
        opacity = 0;
    }

    return {
        zIndex,
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        transition: isDragging.current && isActive ? 'none' : 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
        pointerEvents: isActive ? 'auto' : 'none'
    } as React.CSSProperties;
  };

  return (
    <div 
        ref={containerRef} 
        // Increased container height on mobile to accommodate taller cards (h-[660px] on mobile)
        className={`relative transition-all duration-500 bg-white ${isFullscreen ? 'p-10 overflow-y-auto' : 'h-[660px] md:h-[400px] perspective-[1000px] select-none'}`}
    >
        <button 
            onClick={toggleFullscreen}
            className="absolute top-3 right-3 z-50 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-all border border-slate-200"
            title={isFullscreen ? t.common.collapse : t.common.expandAll}
        >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>

        {isFullscreen ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-7xl mx-auto pt-10">
                {cardGroups.map((group) => (
                    <div key={group.id} className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                         <h3 className="text-lg font-bold text-slate-800 mb-4 px-3 border-l-4 border-sciblue-500">{group.title}</h3>
                        <div className="h-full">
                            {group.content}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div 
                className="w-full h-full relative flex items-center justify-center touch-none" 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {cardGroups.map((group, index) => (
                    <div
                        key={group.id}
                        // Mobile Card Height: Increased to h-[600px] to allow full visibility of stacked charts
                        className="absolute w-full max-w-4xl h-[600px] md:h-[360px] bg-white border border-slate-200 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
                        style={getCardStyle(index)}
                    >
                        <div className="h-6 w-full flex items-center justify-center cursor-ns-resize opacity-30 hover:opacity-60 shrink-0">
                             <div className="w-8 h-1 bg-slate-400 rounded-full"></div>
                        </div>
                        <div className="flex-1 px-3 pb-3 pt-0 relative flex flex-col min-h-0">
                             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 select-none text-center">{group.title}</div>
                             <div className="flex-1 min-h-0 w-full relative">
                                {group.content}
                             </div>
                        </div>
                    </div>
                ))}

                {/* Navigation Buttons - Updated to match Desktop Style everywhere */}
                <div className="absolute z-20 pointer-events-none flex 
                    bottom-4 left-1/2 -translate-x-1/2 flex-row gap-8
                    md:top-1/2 md:right-4 md:bottom-auto md:left-auto md:translate-x-0 md:-translate-y-1/2 md:flex-col md:gap-2"
                >
                     <button 
                        onClick={handlePrev}
                        className="pointer-events-auto w-10 h-10 md:w-8 md:h-8 bg-white shadow-lg md:shadow-sm rounded-full text-slate-500 hover:text-sciblue-600 hover:border-sciblue-200 hover:shadow-md transition-all border border-slate-200 active:scale-95 flex items-center justify-center"
                        title={t.common.prev}
                     >
                        <ChevronUp size={20} />
                     </button>
                     <button 
                        onClick={handleNext}
                        className="pointer-events-auto w-10 h-10 md:w-8 md:h-8 bg-white shadow-lg md:shadow-sm rounded-full text-slate-500 hover:text-sciblue-600 hover:border-sciblue-200 hover:shadow-md transition-all border border-slate-200 active:scale-95 flex items-center justify-center"
                        title={t.common.next}
                     >
                        <ChevronDown size={20} />
                     </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default StackedResults;