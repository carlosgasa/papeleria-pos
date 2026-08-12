import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading = false, 
    fullWidth = false, 
    children, 
    className = '',
    disabled,
    ...props 
  }, ref) => {
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-700',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-700 dark:text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-700',
      success: 'bg-green-600 hover:bg-green-700 text-white dark:bg-green-700',
      outline: 'border-2 border-gray-300 hover:bg-gray-50 text-gray-900 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-white',
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const baseClasses = 'font-semibold rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...props}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
