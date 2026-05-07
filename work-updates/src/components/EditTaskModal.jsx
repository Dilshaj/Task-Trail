import React, { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

const EditTaskModal = ({ isOpen, onClose, onSave, task }) => {
    const { allEmployees } = useTasks();
    const [taskObj, setTaskObj] = useState({
        title: '',
        description: '',
        deadline: '',
        priority: 'Medium',
        progress: 0,
        assignedTo: '',
        status: 'Pending'
    });

    useEffect(() => {
        if (task) {
            setTaskObj({
                title: task.title || '',
                description: task.description || '',
                deadline: task.deadline || '',
                priority: task.priority || 'Medium',
                progress: task.progress || 0,
                assignedTo: task.assignedTo || '',
                status: task.status || 'Pending'
            });
        }
    }, [task]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(task.id, taskObj);
        onClose();
    };

    const handleChange = (field, value) => {
        setTaskObj(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-up overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-8 py-5 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Edit Task</h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Modify task details and assignments</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Task Title</label>
                            <input
                                type="text"
                                required
                                value={taskObj.title}
                                onChange={(e) => handleChange('title', e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-3 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white"
                                placeholder="Task title..."
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Description</label>
                            <textarea
                                required
                                rows="3"
                                value={taskObj.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-3 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white resize-none"
                                placeholder="Task details..."
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Deadline</label>
                            <input
                                type="text"
                                required
                                value={taskObj.deadline}
                                onChange={(e) => handleChange('deadline', e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-3 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Priority</label>
                            <select
                                value={taskObj.priority}
                                onChange={(e) => handleChange('priority', e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-3 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white appearance-none"
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Assigned To</label>
                            <div className="relative">
                                <select
                                    value={taskObj.assignedTo}
                                    onChange={(e) => handleChange('assignedTo', e.target.value)}
                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-10 py-3 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white appearance-none"
                                >
                                    <option value="">Select Employee</option>
                                    {allEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                                <User className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Status</label>
                            <select
                                value={taskObj.status}
                                onChange={(e) => handleChange('status', e.target.value)}
                                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-5 py-3 text-sm outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all dark:text-white appearance-none"
                            >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Progress Override</label>
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{taskObj.progress}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={taskObj.progress}
                                onChange={(e) => handleChange('progress', Number(e.target.value))}
                                className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                    </div>

                    <div className="mt-10 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:-translate-y-0.5 active:scale-95 transition-all"
                        >
                            <Save className="h-4 w-4" />
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditTaskModal;
