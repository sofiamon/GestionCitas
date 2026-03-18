import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}) => {
  const { isDark } = useTheme();

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const panelCls = isDark
    ? 'bg-slate-800 border border-slate-700'
    : 'bg-white';
  const headerBorder = isDark ? 'border-slate-700' : 'border-gray-100';
  const titleCls = isDark ? 'text-gray-100' : 'text-gray-800';
  const closeCls = isDark
    ? 'hover:bg-white/10 text-gray-400 hover:text-gray-200'
    : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Modal */}
      <div className={`relative ${sizeClasses[size]} w-full rounded-2xl shadow-2xl animate-scale-in z-10 ${panelCls}`}>
        {/* Header */}
        {title && (
          <div className={`flex items-center justify-between px-6 py-4 border-b ${headerBorder}`}>
            <h2 className={`text-lg font-semibold ${titleCls}`}>{title}</h2>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${closeCls}`}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t ${headerBorder}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
