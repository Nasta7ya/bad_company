import React from 'react';

interface VPIconProps {
  points: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const VPIcon: React.FC<VPIconProps> = ({ points, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  };

  const containerSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${containerSizes[size]} ${className}`}
      title={`${points} Переможних Очок (ПО)`}
    >
      {/* Authentic Bad Company Golden Star Badge SVG */}
      <svg viewBox="0 0 40 40" className="w-full h-full drop-shadow-md">
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="35%" stopColor="#EAB308" />
            <stop offset="70%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#A16207" />
          </linearGradient>
          <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer glowing ring */}
        <circle cx="20" cy="20" r="18.5" fill="#1e293b" stroke="url(#goldGradient)" strokeWidth="2.5" />
        <circle cx="20" cy="20" r="16" fill="#0f172a" stroke="#ca8a04" strokeWidth="1" strokeDasharray="2,2" />

        {/* Five-pointed golden sheriff/crime star */}
        <polygon
          points="20,4 24,14 35,15 27,22 30,33 20,27 10,33 13,22 5,15 16,14"
          fill="url(#goldGradient)"
          stroke="#78350f"
          strokeWidth="1"
          strokeLinejoin="round"
          opacity="0.35"
        />
      </svg>

      {/* Point value centered inside */}
      <span className={`absolute font-black tracking-tighter text-amber-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] ${sizeClasses[size]}`}>
        +{points}
      </span>
    </div>
  );
};
