import React from 'react';

interface MenuItemPlaceholderProps {
  className?: string;
  size?: number;
}

const MenuItemPlaceholder: React.FC<MenuItemPlaceholderProps> = ({ 
  className = "w-full h-full", 
  size = 200 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Gradient */}
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:'#f8fafc', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#e2e8f0', stopOpacity:1}} />
        </linearGradient>
        <linearGradient id="plateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor:'#ffffff', stopOpacity:1}} />
          <stop offset="100%" style={{stopColor:'#f1f5f9', stopOpacity:1}} />
        </linearGradient>
      </defs>
      
      <rect width="200" height="200" fill="url(#bgGradient)"/>
      
      {/* Plate Shadow */}
      <ellipse cx="100" cy="140" rx="70" ry="20" fill="#cbd5e1" opacity="0.3"/>
      
      {/* Plate */}
      <ellipse cx="100" cy="135" rx="75" ry="25" fill="url(#plateGradient)" stroke="#94a3b8" strokeWidth="1"/>
      
      {/* Main Dish */}
      <circle cx="100" cy="120" r="25" fill="#fed7aa" stroke="#fdba74" strokeWidth="2"/>
      <circle cx="100" cy="120" r="20" fill="#fbbf24" opacity="0.7"/>
      
      {/* Side Items */}
      <circle cx="75" cy="130" r="8" fill="#86efac"/>
      <circle cx="85" cy="125" r="6" fill="#86efac"/>
      <circle cx="115" cy="125" r="6" fill="#fca5a5"/>
      <circle cx="125" cy="130" r="8" fill="#fca5a5"/>
      
      {/* Fork */}
      <g transform="translate(40, 60)">
        <rect x="0" y="0" width="2" height="40" fill="#9ca3af"/>
        <rect x="-2" y="0" width="1" height="8" fill="#9ca3af"/>
        <rect x="0" y="0" width="1" height="8" fill="#9ca3af"/>
        <rect x="2" y="0" width="1" height="8" fill="#9ca3af"/>
        <rect x="4" y="0" width="1" height="8" fill="#9ca3af"/>
      </g>
      
      {/* Knife */}
      <g transform="translate(150, 60)">
        <rect x="0" y="0" width="2" height="40" fill="#9ca3af"/>
        <polygon points="0,0 6,0 8,6 2,8" fill="#d1d5db"/>
      </g>
      
      {/* Steam Effects */}
      <g transform="translate(90, 25)" opacity="0.4">
        <path d="M0 0 Q2 -3 4 0 Q6 3 8 0" stroke="#94a3b8" strokeWidth="1.5" fill="none"/>
        <path d="M3 -2 Q5 -5 7 -2 Q9 1 11 -2" stroke="#94a3b8" strokeWidth="1.5" fill="none"/>
        <path d="M6 -4 Q8 -7 10 -4 Q12 -1 14 -4" stroke="#94a3b8" strokeWidth="1.5" fill="none"/>
      </g>
      
      {/* Cafe Icon */}
      <g transform="translate(85, 40)" opacity="0.6">
        <circle cx="15" cy="8" r="12" fill="none" stroke="#f59e0b" strokeWidth="2"/>
        <path d="M10 5 Q15 2 20 5 Q15 8 10 5" fill="#f59e0b" opacity="0.5"/>
        <circle cx="15" cy="8" r="3" fill="#f59e0b"/>
      </g>
    </svg>
  );
};

export default MenuItemPlaceholder;