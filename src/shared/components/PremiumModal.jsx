import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function PremiumModal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  primaryAction, 
  secondaryAction,
  maxWidth = 'max-w-md'
}) {
  
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur for depth */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal panel with smooth scale-in animation */}
      <div 
        className={`relative w-full ${maxWidth} transform overflow-hidden rounded-2xl bg-white p-6 md:p-8 text-left align-middle shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold leading-6 text-slate-900" id="modal-title">
            {title}
          </h3>
          <button
            type="button"
            className="rounded-full p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
            onClick={onClose}
          >
            <span className="sr-only">Cerrar modal</span>
            <X size={20} />
          </button>
        </div>

        <div className="mt-2">
          {/* Modal content */}
          {children}
        </div>

        <div className="mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
          {secondaryAction && (
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 transition-colors sm:w-auto focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors sm:w-auto focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
