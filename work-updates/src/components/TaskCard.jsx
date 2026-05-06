import React from 'react';
import { Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { formatDate } from '../utils/helpers';

const TaskCard = ({ task, onStatusChange, onProgressChange, isUser, employee }) => {
    const statusColors = {
        'Pending': 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-900/50',
        'In Progress': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900/50',
        'Completed': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-900/50',
    };

    const priorityColors = {
        'High': 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/40',
        'Medium': 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40',
        'Low': 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40',
    };

    const displayProgress = task.status === 'Completed' ? 100 : (task.progress || 0);


    return (
        <div className="flex flex-col rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-5 shadow-sm transition-all duration-300 hover:shadow-xl dark:hover:shadow-indigo-900/20 hover:-translate-y-1 group">
            <div className="flex items-start justify-between gap-4 mb-3">
                <h4 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{task.title}</h4>
                <div className="flex flex-col items-end gap-1">
                    <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap", 
                        displayProgress >= 100 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                    )}>
                        {displayProgress}%
                    </span>
                </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 flex-1">{task.description}</p>


            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 mb-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(task.deadline)}</span>
                </div>
                <div className={clsx("flex items-center gap-1 px-2 py-1 rounded-md font-medium", priorityColors[task.priority])}>
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{task.priority}</span>
                </div>
            </div>

            {isUser && (
                <div className="flex flex-col gap-3">
                    {task.status !== 'Completed' && (
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>Task Progress</span>
                                <span>{displayProgress}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={displayProgress}
                                onChange={(e) => onProgressChange && onProgressChange(task.id, Number(e.target.value))}
                                className="w-full accent-indigo-600 dark:accent-indigo-500"
                            />
                        </div>
                    )}
                    <div className="flex gap-2">
                        {task.status !== 'Completed' && (
                            <button
                                onClick={() => onStatusChange(task.id, 'Completed')}
                                className="flex-1 rounded-xl flex items-center justify-center gap-2 bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:bg-emerald-500 hover:-translate-y-0.5 transition-all duration-300"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Mark Complete
                            </button>
                        )}
                        {task.status === 'Pending' && (
                            <button
                                onClick={() => onStatusChange(task.id, 'In Progress')}
                                className="flex-1 rounded-xl flex items-center justify-center gap-2 bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white shadow-sm hover:shadow-md hover:bg-blue-500 hover:-translate-y-0.5 transition-all duration-300"
                            >
                                Start Task
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskCard;
