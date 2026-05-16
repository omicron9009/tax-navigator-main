import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label"; // 1. Import the new Label component

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string; // 2. Add the custom label prop
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, label, id, ...props }, ref) => {
    // 3. Generate a unique ID automatically if the user doesn't provide one
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full space-y-2">
        {/* 4. Render the label conditionally if the prop is passed */}
        {label && (
          <Label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-900"
          >
            {label}
          </Label>
        )}

        <div className="relative flex items-center w-full">
          {icon && (
            <div className="absolute left-3 flex items-center justify-center text-zinc-400 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            id={inputId} // 5. Attach the ID to the actual input HTML
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm transition-colors",
              "file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-zinc-400",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              "disabled:cursor-not-allowed disabled:opacity-50",
              icon ? "pl-10" : "",
              className,
            )}
            ref={ref}
            {...props}
          />
        </div>
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
