"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardWrapperProps {
  title: string;
  icon: ReactNode;
  headerRight?: ReactNode;
  className?: string;
  children: ReactNode;
}

export default function CardWrapper({ 
  title, 
  icon, 
  headerRight, 
  className, 
  children 
}: CardWrapperProps) {
  return (
    <div className={cn(
      "bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 shadow-xl h-full flex flex-col transition-all duration-300", 
      className
    )}>
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60 shrink-0">
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
