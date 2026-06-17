import { createContext, useCallback, useContext, useState } from "react";
import {
  IconCheckCircle,
  IconAlert,
  IconInfo,
  IconX,
} from "../components/icons.jsx";

const ToastContext = createContext(null);

let counter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (type, title, message) => {
      const id = ++counter;
      setToasts((t) => [...t, { id, type, title, message }]);
      setTimeout(() => remove(id), 4000);
    },
    [remove]
  );

  const toast = {
    success: (title, message) => push("success", title, message),
    error: (title, message) => push("error", title, message),
    info: (title, message) => push("info", title, message),
  };

  const icons = {
    success: <IconCheckCircle width={18} height={18} />,
    error: <IconAlert width={18} height={18} />,
    info: <IconInfo width={18} height={18} />,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`} role="alert">
            <span className="toast__icon">{icons[t.type]}</span>
            <div className="toast__body">
              <strong>{t.title}</strong>
              {t.message && <p>{t.message}</p>}
            </div>
            <button className="toast__close" onClick={() => remove(t.id)}>
              <IconX width={15} height={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
