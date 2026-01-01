
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity duration-500" 
        onClick={onCancel} 
      />
      <div className="relative glass border-white/10 w-full max-w-lg rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-12">
          <div className="flex flex-col items-center text-center gap-8 mb-12">
            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl border ${
              confirmVariant === 'danger' 
              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
              : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
            }`}>
              {confirmVariant === 'danger' ? (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic mb-4">{title}</h2>
              <p className="text-slate-500 text-sm leading-relaxed max-w-sm font-medium">
                {message}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <button
              onClick={onConfirm}
              className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl hover:scale-[1.02] active:scale-[0.98] ${
                confirmVariant === 'danger' 
                ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/20' 
                : 'bg-white text-slate-950 hover:bg-indigo-500 hover:text-white'
              }`}
            >
              {confirmLabel}
            </button>
            <button
              onClick={onCancel}
              className="w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-all bg-white/5 border border-white/5"
            >
              Cancel Protocol
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
