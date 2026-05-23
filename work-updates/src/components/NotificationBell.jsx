import React, { useEffect, useState, useRef } from 'react';
import { Bell, BellOff, Check, Clock } from 'lucide-react';
import { getNotifications, markAsRead } from '../services/notificationService';

export const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        const data = await getNotifications();
        setNotifications(data);
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Check every 1 min
        
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            clearInterval(interval);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleRead = async (id) => {
        try {
            await markAsRead(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error("Failed to mark as read");
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:text-slate-400 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-xl transition-all duration-200"
            >
                <Bell className={`h-6 w-6 ${notifications.length > 0 ? 'animate-bounce-slow' : ''}`} />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-pulse">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 z-[100] overflow-hidden animate-scale-in origin-top-right">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
                        <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Notifications
                            {notifications.length > 0 && (
                                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] rounded-full">
                                    {notifications.length} New
                                </span>
                            )}
                        </h4>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <div className="inline-flex p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 text-slate-400">
                                    <BellOff className="h-6 w-6" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No new notifications</p>
                                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">We'll alert you when tasks or leaves update.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {notifications.map(n => (
                                    <div 
                                        key={n.id} 
                                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group"
                                    >
                                        <div className="flex gap-3">
                                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.type === 'task' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                                            <div className="flex-1">
                                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                                                    {n.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleRead(n.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg transition-all"
                                                title="Mark as read"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s infinite;
                }
            ` }} />
        </div>
    );
};


