import React from 'react';
import { icons } from './icons';

function StarRating({ rating, onRate }) {
  return (
    <div className="flex space-x-1 cursor-pointer">
      {[1, 2, 3, 4, 5].map((star) => (
        <icons.Star
          key={star}
          className={`w-6 h-6 transition-colors duration-200 ${
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-none'
          }`}
          onClick={() => onRate(star)}
          aria-label={`Noter ${star} étoiles`}
        />
      ))}
    </div>
  );
}

export default StarRating;
