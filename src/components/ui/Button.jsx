import React from 'react';

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-secondary shadow-sm',
  secondary: 'bg-white text-primary border border-primary hover:bg-accent/10 shadow-sm',
  danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
};

function Button({ onClick, children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl font-medium transition-all duration-200 focus:outline-none ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
