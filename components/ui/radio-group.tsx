"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  value: string;
  onValueChange: (value: string) => void;
  name: string;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined);

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  name?: string;
}

export function RadioGroup({
  value,
  onValueChange,
  name = "radio-group",
  className,
  children,
  ...props
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div className={cn("grid gap-2", className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    if (!context) throw new Error("RadioGroupItem must be used within RadioGroup");

    return (
      <input
        type="radio"
        className={cn(
          "h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:focus:ring-blue-400",
          className
        )}
        ref={ref}
        name={context.name}
        value={value}
        checked={context.value === value}
        onChange={() => context.onValueChange(value)}
        {...props}
      />
    );
  }
);

RadioGroupItem.displayName = "RadioGroupItem";
