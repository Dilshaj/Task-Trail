import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import { History, Search, Filter, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { getTasksByEmployee } from '../services/taskService';

const TaskHistory = () => {
    const { user } = useAuth();
    const [historyTasks, setHistoryTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const empId = user?.employee_id || user?.employeeId;

    useEffect(() => {
        if (empId) {
            setLoading(true);
            getTasksByEmployee(empId)
                .then(data => {
                    setHistoryTasks(data || []);
                })
                .catch(err => console.error("Failed to fetch task history:", err))
                .finally(() => setLoading(false));
        }
    }, [empId]);

    const filteredTasks = historyTasks.filter(task => {
        const matchesSearch = (task.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (task.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (task.projectName || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = filterStatus === 'all' || 
                            (filterStatus === 'completed' && task.status === 'Completed') ||
                            (filterStatus === 'pending' && task.status !== 'Completed');

        return matchesSearch && matchesStatus;
    });

    return (
        <Layout>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
                        <History className="h-8 w-8 text-indigo-600" />
                        Task History
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">View all your previous tasks and work records.</p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-center">
                        <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Total Records</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white">{historyTasks.length}</p>
                    </div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="md:col-span-2 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search by title, description or project..."
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <select 
                        className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none transition-all shadow-sm cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="completed">Completed Only</option>
                        <option value="pending">In Progress / Pending</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                    <div className="h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-slate-500 font-bold">Loading your work history...</p>
                </div>
            ) : filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredTasks.map((task, idx) => (
                        <div key={task.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <TaskCard 
                                task={task} 
                                isUser={false} // Disable edit/actions in history page
                                employee={user}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800/40 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-16 text-center">
                    <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No Records Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        We couldn't find any task records matching your current filters or search terms.
                    </p>
                    {(searchTerm || filterStatus !== 'all') && (
                        <button 
                            onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                            className="mt-6 text-indigo-600 font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
            )}
        </Layout>
    );
};

export default TaskHistory;
