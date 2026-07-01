"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import InfoTooltip from './InfoTooltip';

interface MetricItemProps {
  label: string;
  value: ReactNode;
  tooltipContent?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function MetricItem({ 
  label, 
  value, 
  tooltipContent, 
  footer, 
  className 
}: MetricItemProps) {
  return (
    <div className={cn(
      "p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/60 flex flex-col justify-between", 
      className
    )}>
      <div>
        {/* Label & Optional Tooltip */}
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-slate-400 text-xs font-semibold block truncate">
            {label}
          </span>
          {tooltipContent && (
            <InfoTooltip content={tooltipContent} />
          )}
        </div>
        
        {/* Metric Value */}
        <div className="text-lg font-bold text-slate-100 flex items-center">
          {value}
        </div>
      </div>

      {/* Optional Footer (e.g. Trend badges or dates) */}
      {footer && (
        <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-slate-900/60 text-[10px]">
          {footer}
        </div>
      )}
    </div>
  );
}
