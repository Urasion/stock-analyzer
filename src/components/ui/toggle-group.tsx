import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, value, onValueChange, children, ...props }, ref): React.JSX.Element => {
    // Clone children to inject pressed state and onClick handlers
    const items = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        const childProps = child.props as { value?: string };
        const itemValue = childProps.value;
        const isPressed = value === itemValue;
        return React.cloneElement(child as React.ReactElement<{ value?: string; pressed?: boolean; onPressedChange?: () => void }>, {
          pressed: isPressed,
          onPressedChange: () => {
            if (itemValue && onValueChange) {
              onValueChange(itemValue);
            }
          },
        });
      }
      return child;
    });

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg bg-slate-950 p-1 text-slate-400 border border-slate-900/60',
          className,
        )}
        {...props}
      >
        {items}
      </div>
    );
  },
);
ToggleGroup.displayName = 'ToggleGroup';
