import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type ToastType = "success" | "info" | "undo" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ToastContextValue {
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
}

const noopToast: ToastContextValue = {
  showToast: (message: string, type?: ToastType, _durationMs?: number) => {
    console.info(`[Toast ${type ?? "info"}]: ${message}`);
  },
};

export const ToastContext = createContext<ToastContextValue>(noopToast);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: ToastType = "success", durationMs: number = 3200) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type }]);

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, durationMs);
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <aside
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 print:hidden"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isUndo = toast.type === "undo";
          const isWarning = toast.type === "warning";

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-center gap-2.5 rounded-[8px] border border-line bg-navy-deep px-4 py-3 text-parchment shadow-xl transition-all duration-200 animate-fade-in-up"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold shrink-0">
                {isSuccess && <span className="text-green">✓</span>}
                {isUndo && <span className="text-gold">↺</span>}
                {isWarning && <span className="text-maroon-bright">⚠</span>}
                {!isSuccess && !isUndo && !isWarning && <span className="text-gold">ℹ</span>}
              </span>
              <span className="font-sans text-[13px] font-medium tracking-normal text-parchment">
                {toast.message}
              </span>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  return ctx ?? noopToast;
}
