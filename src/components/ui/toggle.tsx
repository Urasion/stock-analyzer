import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  value?: string;
}

export const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed, onPressedChange, ...props }, ref): React.JSX.Element => {
    return (
      <button
        type="button"
        ref={ref}
        aria-pressed={pressed}
        data-state={pressed ? 'on' : 'off'}
        onClick={(e) => {
          if (props.onClick) props.onClick(e);
          if (onPressedChange) onPressedChange(!pressed);
        }}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-xs font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
          'hover:bg-slate-900/10 dark:hover:bg-slate-800/50',
          'data-[state=on]:bg-white data-[state=on]:text-slate-100 data-[state=on]:shadow-sm',
          'dark:data-[state=on]:bg-slate-900 dark:data-[state=on]:text-slate-100',
          'px-3.5 py-1.5 cursor-pointer text-slate-400',
          className,
        )}
        {...props}
      />
    );
  },
);
Toggle.displayName = 'Toggle';
