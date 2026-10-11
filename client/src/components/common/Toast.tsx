import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Toast: React.FC = () => {
  const { toastMessage } = useAuth();

  if (!toastMessage) return null;

  const bgColors = {
    success: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100 shadow-emerald-900/40',
    error: 'bg-rose-900/90 border-rose-500/50 text-rose-100 shadow-rose-900/40',
    info: 'bg-slate-900/90 border-sky-500/50 text-sky-100 shadow-sky-900/40',
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounce-short">
      <div
        className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-md shadow-xl text-sm font-medium transition-all duration-300 max-w-md ${
          bgColors[toastMessage.type]
        }`}
      >
        {icons[toastMessage.type]}
        <span>{toastMessage.message}</span>
      </div>
    </div>
  );
};
