"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  items: Array<{ value: string; label: string }>;
  registerItem: (value: string, label: string) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

export interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [items, setItems] = React.useState<Array<{ value: string; label: string }>>([]);

  const registerItem = React.useCallback((itemValue: string, label: string) => {
    setItems((prev) => {
      const exists = prev.some((item) => item.value === itemValue);
      if (exists) return prev;
      return [...prev, { value: itemValue, label }];
    });
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, items, registerItem }}>
      {children}
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SelectTrigger = React.forwardRef<HTMLDivElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext);
    if (!context) throw new Error("SelectTrigger must be used within Select");

    const selectRef = React.useRef<HTMLSelectElement>(null);

    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        <select
          ref={selectRef}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          value={context.value}
          onChange={(e) => context.onValueChange(e.target.value)}
        >
          {context.items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <div
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm pointer-events-none ring-offset-white dark:border-gray-700 dark:bg-gray-950",
            className
          )}
        >
          <div className="flex items-center gap-2">{children}</div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>
    );
  }
);

SelectTrigger.displayName = "SelectTrigger";

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectValue must be used within Select");

  const selectedItem = context.items.find((item) => item.value === context.value);
  return <span>{selectedItem?.label || placeholder || "Select..."}</span>;
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  // This component just renders its children (SelectItems) so they can register themselves
  return <>{children}</>;
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error("SelectItem must be used within Select");

  // Register this item with the context
  React.useEffect(() => {
    const label = typeof children === "string" ? children : value;
    context.registerItem(value, label);
  }, [value, children, context]);

  // Don't render anything visible
  return null;
}
