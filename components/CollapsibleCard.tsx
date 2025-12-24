import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { Translation } from '../types';

interface CollapsibleCardProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  icon?: React.ReactNode;
  extraHeader?: React.ReactNode;
  t: Translation;
  isLocked?: boolean;
  lockedWarningText?: string;
  showNotification?: (text: string) => void;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({ 
  title, 
  children, 
  defaultExpanded = true, 
  className = "",
  icon,
  extraHeader,
  t,
  isLocked = false,
  lockedWarningText,
  showNotification
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
      if (isLocked) {
          if (showNotification && lockedWarningText) {
              showNotification(lockedWarningText);
          }
          return;
      }
      setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`
        bg-white border border-slate-200/60
        rounded-2xl overflow-hidden transition-all duration-300 ease-out
        /* Mobile: Elastic active state instead of hover */
        active:scale-[0.99] active:shadow-sm
        /* Desktop: Hover state */
        md:hover:shadow-xl md:hover:shadow-slate-200/50 md:hover:-translate-y-0.5
        shadow-sm shadow-slate-100
        ${className}
      `}
    >
      <div 
        className={`p-4 md:p-5 flex items-center justify-between cursor-pointer bg-white hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${isLocked ? 'cursor-not-allowed opacity-80' : ''}`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-slate-500 bg-slate-100 p-2 rounded-lg">{icon}</span>}
          <h3 className="font-bold text-slate-800 tracking-tight text-sm md:text-base">{title}</h3>
        </div>
        <div className="flex items-center gap-4">
          {extraHeader}
          <button className={`text-slate-400 hover:text-sciblue-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      <div 
        className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden bg-white ${
          isExpanded ? 'max-h-[1200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 md:p-6">
          {children}
        </div>
      </div>
      
      {!isExpanded && (
        <div 
            className="h-9 md:h-10 flex items-center justify-center text-slate-400 text-xs font-medium bg-slate-50/50 cursor-pointer hover:bg-slate-100 hover:text-sciblue-600 transition-colors border-t border-slate-100 tracking-wide uppercase"
            onClick={handleToggle}
        >
            <span className="flex items-center gap-2">
                <Maximize2 size={12}/> {t.common.expandDetails}
            </span>
        </div>
      )}
    </div>
  );
};

export default CollapsibleCard;