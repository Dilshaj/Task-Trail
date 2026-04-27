import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trash2, Loader2 } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import TaskProgressBar from './TaskProgressBar';

const EmployeeCard = ({ employee, projectId }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { removeEmployee } = useTasks();
    const [isDeleting, setIsDeleting] = useState(false);

    const isAdmin = user?.role === 'admin';

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to remove this employee?")) {
            return;
        }
        setIsDeleting(true);
        try {
            await removeEmployee(employee.employeeId);
            // UI update is handled inside removeEmployee (filters state)
        } catch (err) {
            console.error('Delete failed:', err);
            alert(err.message || 'Failed to delete employee. Please try again.');
            setIsDeleting(false);
        }
    };

    return (
        <div
            className={`flex flex-col rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-5 shadow-sm transition-all duration-300 hover:shadow-xl dark:hover:shadow-indigo-900/20 hover:-translate-y-1 cursor-pointer group relative ${isDeleting ? 'opacity-50 pointer-events-none scale-95' : ''
                }`}
            onClick={() => !isDeleting && navigate(`/admin/employee/${employee.id}?project=${projectId}`)}
        >
            {isAdmin && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="absolute top-4 right-4 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/40 disabled:cursor-not-allowed"
                    title="Remove Employee"
                >
                    {isDeleting
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />
                    }
                </button>
            )}

            <div className="flex items-center gap-4 mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
                <img
                    src={employee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random&color=fff&bold=true`}
                    alt={employee.name}
                    className="h-12 w-12 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random&color=fff&bold=true`;
                    }}
                />
                <div className="pr-8">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 truncate max-w-[120px]">{employee.name}</h4>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{employee.title || employee.role}</span>
                </div>
            </div>

            <div className="space-y-4 flex-1 flex flex-col justify-end">
                <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Daily Tasks</span>
                        <span className="text-slate-800 dark:text-slate-300">{employee.dailyProgress}%</span>
                    </div>
                    <TaskProgressBar progress={employee.dailyProgress} color="bg-blue-600" />
                </div>

                <div>
                    <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-600 dark:text-slate-400">Weekly Tasks</span>
                        <span className="text-slate-800 dark:text-slate-300">{employee.weeklyProgress}%</span>
                    </div>
                    <TaskProgressBar progress={employee.weeklyProgress} color="bg-emerald-500" />
                </div>
            </div>
        </div>
    );
};

export default EmployeeCard;
