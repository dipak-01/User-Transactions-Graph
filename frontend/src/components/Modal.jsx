import { useEffect } from "react";

function Modal({ title, children, onClose, footer }) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 flex h-full items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 focus:outline-none"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
          <div className="px-6 py-4 text-slate-100 overflow-y-auto max-h-[70vh]">
            {children}
          </div>
          {footer && (
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 rounded-b-2xl flex justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;
