import React from 'react';

export function Button({ 
  children, 
  variant = 'default', 
  size = 'default', 
  fullWidth = false,
  className = '',
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variantClasses = {
    default: 'bg-purple-600 text-white hover:bg-purple-600/90 active:bg-purple-600/95',
    outline: 'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100',
    secondary: 'bg-purple-500 text-white hover:bg-purple-500/90 active:bg-purple-500/95',
    ghost: 'hover:bg-gray-100 active:bg-gray-200 text-gray-700',
    link: 'text-purple-600 underline-offset-4 hover:underline',
    destructive: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  };
  
  const sizeClasses = {
    default: 'h-10 py-2 px-4 text-sm',
    sm: 'h-8 px-3 text-xs',
    md: 'h-11 py-2 px-5 text-base',
    lg: 'h-12 px-8 text-base font-semibold',
    icon: 'h-10 w-10',
  };
  
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`;
  
  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
} 