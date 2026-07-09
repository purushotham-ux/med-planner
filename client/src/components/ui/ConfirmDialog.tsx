import { Modal } from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  confirmLabel = 'Confirm', variant = 'default', isLoading,
}: ConfirmDialogProps) {
  const colors = {
    danger: { btn: 'bg-red-500 hover:bg-red-600', icon: 'text-red-400 bg-red-500/10' },
    warning: { btn: 'bg-amber-500 hover:bg-amber-600', icon: 'text-amber-400 bg-amber-500/10' },
    default: { btn: 'gradient-teal', icon: 'text-amber-400 bg-amber-500/10' },
  };

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${colors[variant].icon}`}>
          {variant === 'danger' ? <Trash2 size={24} /> : <AlertTriangle size={24} />}
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-navy-400 mb-6 max-w-[280px]">{message}</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-navy-800 text-navy-300 font-medium text-sm hover:bg-navy-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-xl text-white font-medium text-sm transition-all active:scale-[0.97] disabled:opacity-50 ${colors[variant].btn}`}
          >
            {isLoading ? '...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
