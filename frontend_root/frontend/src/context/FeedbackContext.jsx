import { createContext, useContext, useMemo, useState } from "react";

const FeedbackContext = createContext(null);

function makeId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function FeedbackProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);
    const [inputValue, setInputValue] = useState("");

    const notify = (message, type = "info", duration = 3200) => {
        const id = makeId();
        setToasts((prev) => [...prev, { id, message, type }]);
        window.setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
    };

    const confirm = (options = {}) => {
        return new Promise((resolve) => {
            setDialog({
                type: "confirm",
                title: options.title || "",
                message: options.message || "",
                confirmText: options.confirmText || "Confirm",
                cancelText: options.cancelText || "Cancel",
                danger: !!options.danger,
                resolve,
            });
        });
    };

    const promptInput = (options = {}) => {
        return new Promise((resolve) => {
            setInputValue(options.initialValue || "");
            setDialog({
                type: "prompt",
                title: options.title || "",
                message: options.message || "",
                placeholder: options.placeholder || "",
                confirmText: options.confirmText || "Submit",
                cancelText: options.cancelText || "Cancel",
                required: options.required !== false,
                danger: !!options.danger,
                resolve,
            });
        });
    };

    const closeDialog = (value) => {
        if (!dialog) return;
        dialog.resolve(value);
        setDialog(null);
        setInputValue("");
    };

    const handlePromptSubmit = () => {
        if (!dialog) return;
        const value = inputValue.trim();
        if (dialog.required && !value) return;
        closeDialog(value);
    };

    const value = useMemo(
        () => ({
            notify,
            confirm,
            promptInput,
        }),
        []
    );

    return (
        <FeedbackContext.Provider value={value}>
            {children}

            <div className="toast-stack" aria-live="polite" aria-atomic="true">
                {toasts.map((toast) => (
                    <div key={toast.id} className={`toast-item toast-${toast.type}`}>
                        {toast.message}
                    </div>
                ))}
            </div>

            {dialog && (
                <div className="feedback-modal-overlay" role="presentation">
                    <div className="feedback-modal" role="dialog" aria-modal="true">
                        {dialog.title && <h3>{dialog.title}</h3>}
                        {dialog.message && <p>{dialog.message}</p>}

                        {dialog.type === "prompt" && (
                            <input
                                className="feedback-modal-input"
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={dialog.placeholder}
                                autoFocus
                            />
                        )}

                        <div className="feedback-modal-actions">
                            <button className="btn-secondary" type="button" onClick={() => closeDialog(null)}>
                                {dialog.cancelText}
                            </button>
                            <button
                                className={dialog.danger ? "btn-danger" : "btn-primary"}
                                type="button"
                                onClick={() => {
                                    if (dialog.type === "prompt") {
                                        handlePromptSubmit();
                                    } else {
                                        closeDialog(true);
                                    }
                                }}
                            >
                                {dialog.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </FeedbackContext.Provider>
    );
}

export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error("useFeedback must be used inside FeedbackProvider.");
    }
    return context;
}