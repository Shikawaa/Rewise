import React from "react";
import { cn } from "../../lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800",
        "shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500",
        "placeholder:text-gray-500 disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-800",
        "shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500",
        "placeholder:text-gray-500 disabled:opacity-50 resize-none",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Input, Textarea }; 