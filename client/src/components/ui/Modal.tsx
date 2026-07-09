import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] modal-container">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet on phone / Centered dialog on tablet+ */}
      <div
        ref={contentRef}
        className={clsx(
          'relative shadow-2xl shadow-black/50 animate-sheet-up overflow-hidden flex flex-col',
          // Phone: bottom sheet
          'w-full max-w-lg rounded-t-3xl border-t border-white/5',
          // Tablet+: centered dialog
          'md:rounded-2xl md:border md:border-white/5 md:animate-scale-in',
          size === 'sm' && 'max-h-[50vh] md:max-h-[50vh]',
          size === 'md' && 'max-h-[80vh] md:max-h-[70vh]',
          size === 'lg' && 'max-h-[92vh] md:max-h-[85vh]',
          size === 'full' && 'max-h-[96vh] md:max-h-[90vh]',
        )}
        style={{ backgroundColor: '#121216' }}
      >
        {/* Drag handle — phone only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-white/10" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 md:pt-5 shrink-0">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', color: '#8e8e9e', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 overscroll-contain safe-bottom">
          {children}
        </div>
      </div>
    </div>
  );
}
