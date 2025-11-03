import React from 'react';

const VARIANTS = {
  primary: 'bg-[#627E63] text-white hover:bg-[#516651] shadow-sm',
  secondary: 'bg-white text-[#627E63] border border-[#627E63] hover:bg-[#f0f5ef] shadow-sm',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
  ghost: 'bg-transparent text-[#627E63] hover:bg-[#f0f5ef]',
  'ghost-danger': 'bg-transparent text-red-600 hover:bg-red-50',
  plain: 'bg-transparent text-inherit shadow-none border-0 hover:bg-transparent',
};

function Button({ onClick, children, variant = 'primary', className = '', type = 'button', ...props }) {
  const variantClasses = VARIANTS[variant] || VARIANTS.primary;

  return (
    <button
      onClick={onClick}
      type={type}
      className={`w-full p-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#627E63] disabled:opacity-60 disabled:cursor-not-allowed ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
