import React from 'react';

const VARIANTS = {
  primary: 'bg-green-600 text-white hover:bg-green-700',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-500 text-white hover:bg-red-600',
};

function Button({ onClick, children, variant = 'primary', className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-lg font-semibold transition duration-150 ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
