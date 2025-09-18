import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, variant = 'success', timeoutMs = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, timeoutMs);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1055 }}>
        {toasts.map(t => (
          <div key={t.id} className={`alert alert-${t.variant} shadow-sm mb-2`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};


