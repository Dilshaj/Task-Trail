import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "danger" }) => {
    if (!isOpen) return null;

    const typeClasses = {
        danger: "bg-red-600 hover:bg-red-700 shadow-red-100",
        warning: "bg-amber-600 hover:bg-amber-700 shadow-amber-100",
        info: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-white/20 overflow-hidden animate-fade-in-up">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${type === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`}>
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{message}</p>
                </div>

                <div className="p-6 pt-0 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-white shadow-lg transition active:scale-95 ${typeClasses[type] || typeClasses.info}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
