import React, { createContext, ReactNode, useContext, useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    hideToast: () => void;
    message: string;
    type: ToastType;
    visible: boolean;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('info');

    const showToast = (msg: string, t: ToastType = 'info', duration = 3000) => {
        setMessage(msg);
        setType(t);
        setVisible(true);
        setTimeout(() => {
            setVisible(false);
        }, duration);
    };

    const hideToast = () => setVisible(false);

    return (
        <ToastContext.Provider value={{ showToast, hideToast, message, type, visible }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
