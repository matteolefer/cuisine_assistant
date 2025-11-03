import React from 'react';

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full p-3 border border-[#d6e2d3] rounded-xl text-[#4B4B4B]
      focus-visible:ring-2 focus-visible:ring-[#627E63] focus-visible:ring-offset-2 focus:border-[#627E63]
      outline-none transition-all bg-white placeholder:text-gray-400 ${className}`}
      {...props}
    />
  );
}

export default Input;
