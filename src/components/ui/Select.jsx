import React from 'react';

function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export default Select;
