import React from 'react';

export const Logo = ({ size = 'md', light = false, showTagline = true }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-3 select-none">
      <div className={`${iconSizes[size]} rounded-lg bg-navy-900 border border-gold-400/40 flex items-center justify-center p-1.5 shadow-sm`}>
        {/* Minimal Legal Scales of Justice Icon */}
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-gold-400" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18" />
          <path d="M7 21h10" />
          <path d="M3 7h18" />
          <path d="M6 7l-3 7c-.5 1 .2 2 1.5 2s2-.9 1.5-2L6 7z" />
          <path d="M18 7l-3 7c-.5 1 .2 2 1.5 2s2-.9 1.5-2L18 7z" />
          <circle cx="12" cy="3" r="1" fill="#C5A36B" />
        </svg>
      </div>
      <div>
        <div className={`font-bold tracking-wider uppercase font-serif ${titleSizes[size]} ${light ? 'text-white' : 'text-navy-900'}`}>
          AAV <span className="text-gold-400 font-sans font-light">PARTNERS</span>
        </div>
        {showTagline && (
          <div className="text-[10px] tracking-widest uppercase font-medium text-gold-500 font-sans -mt-0.5">
            Advocates & Legal Consultants
          </div>
        )}
      </div>
    </div>
  );
};
