import React, { useState } from 'react';
import { X } from 'lucide-react';

const AssignTaskModal = ({ isOpen, onClose, onAssign, employeeId, projectId }) => {
    const [taskObj, setTaskObj] = useState({
        title: '',
        description: '',
        deadline: '',
        priority: 'Medium',
        timeline: 'daily'
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (taskObj.title && taskObj.deadline) {
            onAssign({
                ...taskObj,
                assignedTo: employeeId,
                projectId: projectId
            });
            onClose();
        }
    };

    const getWeeklyRange = () => {
        const today = new Date();
        const day = today.getDay();
        const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
        
        const monday = new Date(today);
        monday.setDate(diffToMonday);
        
        const saturday = new Date(monday);
        saturday.setDate(monday.getDate() + 5);
        
        const formatDay = (date) => {
            return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
        };
        
        return `${formatDay(monday)} → ${formatDay(saturday)}`;
    };

    const handleChange = (field, value) => {
        setTaskObj(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'timeline' && value === 'weekly') {
                next.deadline = getWeeklyRange();
            } else if (field === 'timeline' && value === 'daily') {
                next.deadline = '';
            }
            return next;
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 transition-all duration-300">
            <div className="w-full max-w-md card-modern dark:bg-slate-900 animate-fade-in-up">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-white">Assign New Task</h2>
                    <button onClick={onClose} className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Title</label>
                            <input
                                type="text"
                                required
                                value={taskObj.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-4 pr-4 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-indigo-900/50 dark:text-white dark:placeholder:text-slate-500"
                                placeholder="e.g. Design Login Page"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                            <textarea
                                required
                                rows="3"
                                value={taskObj.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-indigo-900/50 dark:text-white dark:placeholder:text-slate-500"
                                placeholder="Details about the task..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Deadline</label>
                                {taskObj.timeline === 'weekly' ? (
                                    <div className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 font-medium flex items-center h-[38px] cursor-not-allowed">
                                        {taskObj.deadline}
                                    </div>
                                ) : (
                                    <input
                                        type="date"
                                        required
                                        value={taskObj.deadline}
                                        onChange={(e) => handleChange('deadline', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2 text-sm outline-none transition focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-indigo-900/50 dark:text-white"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                                <select
                                    value={taskObj.priority}
                                    onChange={(e) => handleChange('priority', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-indigo-900/50 dark:text-white"
                                >
                                    <option value="Low" className="dark:bg-slate-900">Low</option>
                                    <option value="Medium" className="dark:bg-slate-900">Medium</option>
                                    <option value="High" className="dark:bg-slate-900">High</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <input type="radio" checked={taskObj.timeline === 'daily'} onChange={() => handleChange('timeline', 'daily')} className="accent-blue-600 dark:accent-indigo-500" />
                                    Daily
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <input type="radio" checked={taskObj.timeline === 'weekly'} onChange={() => handleChange('timeline', 'weekly')} className="accent-blue-600 dark:accent-indigo-500" />
                                    Weekly
                                </label>
                            </div>
                        </div>

                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg btn-gradient px-4 py-2 text-sm font-medium text-white shadow-shadow-soft"
                        >
                            Assign Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignTaskModal;
