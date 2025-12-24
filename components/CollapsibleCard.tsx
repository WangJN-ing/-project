import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { Translation } from '../types';

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  expanded?: boolean;         // Controlled state
  onToggle?: () => void;      // Controlled handler
  className?: string;
  icon?: React.ReactNode;
  extraHeader?: React.ReactNode;
  t: Translation;
  isLocked?: boolean;
  lockedWarningText?: string;
  showNotification?: (text: string) => void;
  hideFooter?: boolean;       // Option to hide the footer expand button
  contentClassName?: string;  // Allow custom content padding
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ 
  title, 
  children, 
  defaultExpanded = true, 
  expanded,
  onToggle,
  className = "",
  icon,
  extraHeader,
  t,
  isLocked = false,
  lockedWarningText,
  showNotification,
  hideFooter = false,
  contentClassName = "p-4 md:p-6"
}) => {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isExpanded = expanded !== undefined ? expanded : internalExpanded;

  const handleToggle = (e?: React.MouseEvent) => {
      // Stop propagation to prevent any parent handlers from firing if needed
      if (e) e.stopPropagation();

      if (isLocked) {
          if (showNotification && lockedWarningText) {
              showNotification(lockedWarningText);
          }
          return;
      }
      
      if (onToggle) {
          onToggle();
      } else {
          setInternalExpanded(!internalExpanded);
      }
  };

  return (
    <div 
      className={`
        bg-white border border-slate-200/60
        rounded-2xl overflow-hidden transition-all duration-300 ease-out
        shadow-sm shadow-slate-100
        ${className}
      `}
    >
      {/* Header Container: No longer clickable as a whole, cursor default */}
      <div 
        className={`
            p-3 md:p-4 flex items-center justify-between bg-white border-b border-slate-100 cursor-default
            transition-colors
        `}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-slate-500 bg-slate-50 border border-slate-100 p-2 rounded-lg">{icon}</span>}
          <h3 className="font-bold text-slate-800 tracking-tight text-sm md:text-base select-none">{title}</h3>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          {extraHeader}
          
          {/* Dedicated Toggle Button */}
          <button 
            onClick={handleToggle}
            className={`
                w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full
                border border-slate-200 bg-slate-50 text-slate-400
                transition-all duration-200 ease-out
                hover:bg-white hover:text-sciblue-600 hover:border-sciblue-200 hover:shadow-md hover:shadow-sciblue-100
                active:scale-90 active:bg-slate-100
                ${isLocked ? 'cursor-not-allowed opacity-50 grayscale' : 'cursor-pointer'}
            `}
            title={isExpanded ? t.common.closeCard : t.common.openCard}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronDown 
                size={18} 
                className={`transition-transform duration-300 ease-out ${isExpanded ? 'rotate-180' : 'rotate-0'}`} 
            />
          </button>
        </div>
      </div>

      <div 
        className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden bg-white ${
          isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={contentClassName}>
          {children}
        </div>
      </div>
      
      {/* Footer "Expand" bar - kept clickable for convenience when collapsed at the bottom, 
          but visual style updated to match the clean look */}
      {!isExpanded && !hideFooter && (
        <div 
            className="h-9 md:h-10 flex items-center justify-center text-slate-400 text-xs font-medium bg-slate-50/30 cursor-pointer hover:bg-slate-50 hover:text-sciblue-600 transition-colors border-t border-slate-100 tracking-wide uppercase group"
            onClick={handleToggle}
        >
            <span className="flex items-center gap-2 group-active:scale-95 transition-transform">
                <Maximize2 size={12}/> {t.common.expandDetails}
            </span>
        </div>
      )}
    </div>
  );
};

export default CollapsibleCard;