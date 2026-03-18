/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'eps_notifications';
const MAX_STORED = 50;

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveToStorage = (notifications) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {}
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(loadFromStorage);

  const addNotification = useCallback(({ title, message, type = 'info' }) => {
    const newNotif = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, MAX_STORED);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveToStorage([]);
  }, []);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, markAsRead, markAllAsRead, clearAll, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
