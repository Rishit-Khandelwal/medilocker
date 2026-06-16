import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);
let idCounter = 0;

const ICONS  = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS = { success: "text-success", error: "text-danger", info: "text-accent" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message, type = "info") => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ message, type, onDismiss }) {
  const Icon = ICONS[type] || Info;
  return (
    <div className="animate-in flex items-start gap-3 bg-surface border border-border rounded-xl shadow-md p-3.5">
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${COLORS[type]}`} />
      <p className="text-sm text-foreground flex-1">{message}</p>
      <button onClick={onDismiss} className="text-muted hover:text-foreground flex-shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}