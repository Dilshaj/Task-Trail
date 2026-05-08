import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { getTasksByEmployee } from '../services/taskService';
import { Calendar, CheckCircle2, Clock, Filter, Search, ChevronRight, FileText, Briefcase } from 'lucide-react';
import clsx from 'clsx';

const TaskHistory = () => {
    const { user } = useAuth();
    const { tasks: globalTasks, loading: globalLoading } = useTasks();
    const [localTasks, setLocalTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    const empId = (user?.employee_id || user?.employeeId || '').toLowerCase().trim();
    const userId = (user?.id || user?._id || '').toLowerCase().trim();

    useEffect(() => {
        if (empId || userId) {
            setLoading(true);
            getTasksByEmployee(empId || userId, false)
                .then(data => setLocalTasks(data || []))
                .finally(() => setLoading(false));
        }
    }, [empId, userId, globalTasks]); // Refresh if global tasks change

    // Combine local and global tasks for maximum sync, then filter uniquely by ID
    const allTasks = [...localTasks];
    globalTasks.forEach(gt => {
        if (!allTasks.find(lt => lt.id === gt.id)) {
            allTasks.push(gt);
        }
    });

    const filteredTasks = allTasks.filter(task => {
        // Ownership check: must be assigned to this user
        const assignedId = (task.assignedTo || task.assigned_to || '').toLowerCase().trim();
        const isMine = (assignedId === userId) || (empId && assignedId === empId);
        if (!isMine) return false;

        const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (task.projectName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Completed':
                return 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
            case 'In Progress':
                return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
            case 'Pending':
                return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800';
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
                    <Briefcase className="h-8 w-8 text-indigo-500" />
                    Work History
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                    Review your past tasks, projects, and overall performance history.
                </p>
            </div>

            <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by task title or project..."
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                            {['All', 'Pending', 'In Progress', 'Completed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={clsx(
                                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                                        filterStatus === status 
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none"
                                            : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                                    )}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-900/20 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Project</th>
                                <th className="px-6 py-4">Task Details</th>
                                <th className="px-6 py-4">Progress</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="px-6 py-4">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredTasks.length > 0 ? (
                                filteredTasks.map((task, idx) => (
                                    <tr 
                                        key={task.id} 
                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                                    {new Date(task.createdAt || task.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                    {task.projectName || task.project_name || 'General'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p className="text-sm font-semibold text-slate-800 dark:text-white line-clamp-1">{task.title}</p>
                                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{task.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5 min-w-[100px]">
                                                <div className="flex justify-between text-[10px] font-bold">
                                                    <span className="text-slate-400">Progress</span>
                                                    <span className="text-indigo-600">{task.progress}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                                                    <div 
                                                        className="h-full bg-indigo-500 transition-all duration-500"
                                                        style={{ width: `${task.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={clsx(
                                                "inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider",
                                                getStatusStyle(task.status)
                                            )}>
                                                {task.status === 'Completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                                {task.status === 'In Progress' && <Clock className="h-3 w-3 mr-1" />}
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all">
                                                <FileText className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Search className="h-12 w-12 opacity-20 mb-3" />
                                            <p className="text-sm font-medium">No tasks found in history</p>
                                            <p className="text-xs mt-1">Try adjusting your filters or search terms.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default TaskHistory;
