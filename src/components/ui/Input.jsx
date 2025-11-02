import React from 'react';

function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full p-3 border border-accent/50 rounded-xl text-[#4B4B4B]
      focus:ring-2 focus:ring-accent focus:border-accent/70 outline-none transition-all
      bg-white placeholder:text-gray-400 ${className}`}
      {...props}
    />
  );
}

export default Input;
