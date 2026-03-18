import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Card = ({
  children,
  className = '',
  hover = false,
  gradient = false,
  padding = 'p-6',
  onClick,
  ...props
}) => {
  const { isDark } = useTheme();
  const hoverClasses = hover
    ? 'hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer'
    : '';

  const bgClass = gradient
    ? 'gradient-card'
    : isDark
      ? 'bg-slate-800 border-slate-700'
      : 'bg-white border-gray-100';

  return (
    <div
      className={`rounded-2xl border shadow-sm transition-all duration-300 ${bgClass} ${padding} ${hoverClasses} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
