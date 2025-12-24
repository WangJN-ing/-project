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
  // In Card Mode: Compact heights (160px) to prevent overflow when stacking 2 charts
  // In Fullscreen Mode: Generous heights
  const histHeight = isFullscreen ? "h-[320px]" : "h-[160px]"; 
  const singleHeight = isFullscreen ? "h-[400px]" : "h-[260px]";

  // Group 1: Histograms (Speed + Energy)
  const HistogramGroup = () => (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 p-1 md:p-2 ${isFullscreen ? '' : 'h-full overflow-y-auto'}`}>
      <div className="bg-slate-50/50 rounded-xl p-2 md:p-3 border border-slate-200">
         <DistributionCharts data={data} type="speed" isFinal={true} t={t} heightClass={histHeight} />
      </div>
      <div className="bg-slate-50/50 rounded-xl p-2 md:p-3 border border-slate-200">
         <DistributionCharts data={data} type="energy" isFinal={true} t={t} heightClass={histHeight} />
      </div>
    </div>
  );

  const cardGroups = [
    { id: 'histograms', content: <HistogramGroup />, title: "Distributions" },
    { id: 'semilog', content: <DistributionCharts data={data} type="semilog" isFinal={true} t={t} heightClass={singleHeight} />, title: "Semi-Log Plot" },
    { id: 'totalEnergy', content: <DistributionCharts data={data} type="totalEnergy" t={t} heightClass={singleHeight} />, title: "Total Energy" },
    { id: 'tempError', content: <DistributionCharts data={data} type="tempError" t={t} heightClass={singleHeight} />, title: "Temperature Error" },
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
        translateY = 40; 
    } else if (isPrev) {
        zIndex = 1; 
        opacity = 0; 
        scale = 0.9;
        translateY = -40;
    } else {
        zIndex = 0;
        opacity = 0;
    }

    return {
        zIndex,
        opacity,
        transform: `scale(${scale}) translateY(${translateY}px)`,
        transition: isDragging.current && isActive ? 'none' : 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
        pointerEvents: isActive ? 'auto' : 'none'
    } as React.CSSProperties;
  };

  return (
    <div 
        ref={containerRef} 
        className={`relative transition-all duration-500 bg-slate-100 ${isFullscreen ? 'p-10 overflow-y-auto' : 'h-[500px] perspective-[1000px] select-none'}`}
    >
        <button 
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur rounded-full shadow-lg hover:bg-sciblue-50 text-slate-600 hover:text-sciblue-600 transition-all active:scale-95 border border-slate-200"
            title={isFullscreen ? t.common.collapse : t.common.expandAll}
        >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>

        {isFullscreen ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-7xl mx-auto pt-10">
                {cardGroups.map((group) => (
                    <div key={group.id} className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
                         <h3 className="text-lg font-bold text-slate-700 mb-4 px-2 border-l-4 border-sciblue-500">{group.title}</h3>
                        <div className="h-full">
                            {group.content}
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div 
                className="w-full h-full relative flex items-center justify-center touch-none" // touch-none prevents page scroll when swiping cards
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
                        className="absolute w-full max-w-3xl h-[420px] bg-white/80 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
                        style={getCardStyle(index)}
                    >
                        <div className="h-8 w-full flex items-center justify-center cursor-ns-resize opacity-50 hover:opacity-100 border-b border-slate-100">
                             <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
                        </div>
                        <div className="flex-1 p-4 relative">
                             <div className="absolute top-2 left-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{group.title}</div>
                             <div className="mt-6 h-full">
                                {group.content}
                             </div>
                        </div>
                    </div>
                ))}

                {/* Navigation Buttons - Positioned to the Right Center to avoid blocking bottom Axis labels */}
                <div className="absolute right-2 md:right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-3 z-20 pointer-events-none">
                     <button 
                        onClick={handlePrev}
                        className="pointer-events-auto p-3 bg-white/80 backdrop-blur-sm shadow-lg rounded-full text-slate-500 hover:text-sciblue-600 hover:scale-110 hover:bg-white transition-all border border-slate-200 active:scale-95 flex items-center justify-center group"
                        title="Previous"
                     >
                        <ChevronUp size={24} className="group-hover:-translate-y-0.5 transition-transform"/>
                     </button>
                     <button 
                        onClick={handleNext}
                        className="pointer-events-auto p-3 bg-white/80 backdrop-blur-sm shadow-lg rounded-full text-slate-500 hover:text-sciblue-600 hover:scale-110 hover:bg-white transition-all border border-slate-200 active:scale-95 flex items-center justify-center group"
                        title="Next"
                     >
                        <ChevronDown size={24} className="group-hover:translate-y-0.5 transition-transform"/>
                     </button>
                </div>
            </div>
        )}
    </div>
  );
};

export default StackedResults;