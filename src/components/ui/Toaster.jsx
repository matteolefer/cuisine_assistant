import React from 'react';
import { icons } from './icons';

function Toaster({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 w-80 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-red-600 text-white'
          } animate-fade-in-right`}
        >

          {toast.type === 'success' ? (
            <icons.Check className="w-5 h-5 mr-3" />
          ) : (
            <icons.Alert className="w-5 h-5 mr-3" />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

export default Toaster;
