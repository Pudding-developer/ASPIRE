import React from 'react';

export function Button({ className, variant, size, children, ...props }) {
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
  };

  const vClass = variants[variant] || variants.default;
  const sClass = sizes[size] || sizes.default;

  return (
    <button className={`${base} ${vClass} ${sClass} ${className || ''}`} {...props}>
      {children}
    </button>
  );
}
