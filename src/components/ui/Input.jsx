import React from 'react';

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

export default Input;
