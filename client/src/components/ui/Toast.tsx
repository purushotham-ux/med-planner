import { useToastStore } from '../../stores/toastStore';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { clsx } from 'clsx';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const styles = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  error: 'bg-red-500/15 border-red-500/30 text-red-400',
  info: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  warning: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex flex-col items-center gap-2 p-3 pointer-events-none">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={clsx(
              'pointer-events-auto w-full max-w-sm px-4 py-3 rounded-2xl border backdrop-blur-xl',
              'flex items-center gap-3 animate-slide-down shadow-lg shadow-black/20',
              styles[t.type],
            )}
          >
            <Icon size={18} className="shrink-0" />
            <p className="flex-1 text-sm font-medium text-white">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100 transition-opacity min-h-0 min-w-0 p-0.5"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
