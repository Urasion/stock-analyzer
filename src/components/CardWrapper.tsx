"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardWrapperProps {
  title: string;
  icon: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  children: ReactNode;
  fullHeight?: boolean;
}

export default function CardWrapper({ 
  title, 
  icon, 
  headerRight, 
  className, 
  children,
  fullHeight = true
}: CardWrapperProps) {
  return (
    <div className={cn(
      "bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col transition-all duration-300", 
      fullHeight ? "h-full" : "h-auto flex-1",
      className
    )}>
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-lg text-slate-100">{title}</h3>
        </div>
        {headerRight}
      </div>
      
      {/* Card Body */}
      {children}
    </div>
  );
}
