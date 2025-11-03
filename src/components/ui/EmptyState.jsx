import React from 'react';

function EmptyState({ icon: IconComponent, title, message }) {
  const renderedIcon = IconComponent
    ? React.createElement(IconComponent, {
        className: 'w-16 h-16 text-gray-300 mx-auto mb-4',
      })
    : null;

  return (
    <div className="p-12 text-center bg-white rounded-xl shadow-md border border-gray-100">
      {renderedIcon}
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}

export default EmptyState;
