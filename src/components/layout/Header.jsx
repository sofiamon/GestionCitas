import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, HeartPulse, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

const getRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  return `hace ${days}d`;
};

const typeDot = {
  success: 'bg-emerald-500',
  error:   'bg-red-500',
  warning: 'bg-amber-500',
  info:    'bg-blue-500',
};

const Header = ({ onMenuToggle }) => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef(null);

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';
  };

  useEffect(() => {
    if (!panelOpen) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelOpen]);

  const recentNotifications = notifications.slice(0, 10);

  return (
    <header className={`sticky top-0 z-30 backdrop-blur-lg border-b lg:hidden transition-colors duration-300 ${
      isDark
        ? 'bg-slate-900/90 border-slate-700'
        : 'bg-white/90 border-gray-100'
    }`}>
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
            }`}
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <HeartPulse size={16} className="text-white" />
            </div>
            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>EPS</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
            }`}
            aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {isDark ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} />}
          </button>

          {/* Bell + Notification Panel */}
          <div className="relative" ref={panelRef}>
            <button
              onClick={() => setPanelOpen(prev => !prev)}
              className={`p-2 rounded-xl transition-colors relative cursor-pointer ${
                isDark ? 'hover:bg-white/10 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label="Notificaciones"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
              )}
            </button>

            {panelOpen && (
              <div className={`absolute right-0 top-full mt-2 w-80 rounded-xl shadow-xl border overflow-hidden z-50 ${
                isDark
                  ? 'bg-slate-800 border-slate-700'
                  : 'bg-white border-gray-100'
              }`}>
                {/* Panel header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b ${
                  isDark ? 'border-slate-700' : 'border-gray-100'
                }`}>
                  <span className={`font-semibold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Notificaciones
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-500 text-white text-xs font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className={`text-xs font-medium transition-colors ${
                        isDark ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
                      }`}
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                </div>

                {/* Notifications list */}
                <div className="max-h-80 overflow-y-auto">
                  {recentNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4">
                      <Bell size={28} className={isDark ? 'text-slate-600' : 'text-gray-300'} />
                      <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                        No tienes notificaciones
                      </p>
                    </div>
                  ) : (
                    recentNotifications.map(notif => {
                      const dot = typeDot[notif.type] || typeDot.info;
                      return (
                        <button
                          key={notif.id}
                          onClick={() => markAsRead(notif.id)}
                          className={`w-full text-left px-4 py-3 flex gap-3 transition-colors border-b last:border-0 ${
                            isDark
                              ? `border-slate-700/50 ${notif.read ? 'hover:bg-slate-700/30' : 'bg-slate-700/50 hover:bg-slate-700'}`
                              : `border-gray-50 ${notif.read ? 'hover:bg-gray-50' : 'bg-primary-50/40 hover:bg-primary-50'}`
                          }`}
                        >
                          <div className="flex-shrink-0 mt-1.5">
                            <span className={`block w-2 h-2 rounded-full ${dot}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {notif.title}
                            </p>
                            <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                              {notif.message}
                            </p>
                            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                              {getRelativeTime(notif.createdAt)}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="flex-shrink-0 self-center">
                              <span className="block w-2 h-2 rounded-full bg-primary-500" />
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white text-xs font-bold">
            {getInitials(user?.nombreCompleto)}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
