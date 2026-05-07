import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import { useAttendance } from '../context/AttendanceContext';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import AssignTaskModal from '../components/AssignTaskModal';
import EditTaskModal from '../components/EditTaskModal';
import { ArrowLeft, Clock, Plus, Target, Mail, Shield, Calendar } from 'lucide-react';

const EmployeeDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const projectId = new URLSearchParams(location.search).get('project');
    const navigate = useNavigate();

    const { employees, tasks, fetchTasks, assignTask, editTask, changeTaskStatus, updateTaskProgress, updateProgress } = useTasks();

    const employee = employees.find(e => e.id === id);
    const employeeTasks = tasks.filter(t => t.assignedTo === id);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [dailyProgress, setDailyProgress] = useState(employee?.dailyProgress || 0);
    const [weeklyProgress, setWeeklyProgress] = useState(employee?.weeklyProgress || 0);

    // Sync state if employee data changes (e.g. after initial load)
    React.useEffect(() => {
        if (employee) {
            setDailyProgress(employee.dailyProgress || 0);
            setWeeklyProgress(employee.weeklyProgress || 0);
        }
    }, [employee?.id]);

    if (!employee) return <div className="flex items-center justify-center py-20 text-slate-500">Loading employee details...</div>;

    const handleManualProgressUpdate = async () => {
        try {
            await updateProgress(employee.id, { dailyProgress: Number(dailyProgress), weeklyProgress: Number(weeklyProgress) });
            alert("Progress updated successfully!");
        } catch (err) {
            alert("Failed to update progress: " + err.message);
        }
    };

    const handleAssignTask = async (taskData) => {
        try {
            await assignTask(taskData);
            // After assignment, refresh tasks just in case
            await fetchTasks();
        } catch (error) {
            console.error("Failed to assign task:", error);
            alert(`Failed to assign task: ${error.message}`);
        }
    };

    const handleEditTask = async (taskId, taskData) => {
        try {
            await editTask(taskId, taskData);
        } catch (error) {
            console.error("Failed to update task:", error);
            alert(`Failed to update task: ${error.message}`);
        }
    };

    const recentUpdates = [...employeeTasks].sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
    const dailyTasks = employeeTasks.filter(t => !t.timeline || t.timeline.toLowerCase() === 'daily');
    const weeklyTasks = employeeTasks.filter(t => t.timeline && t.timeline.toLowerCase() === 'weekly');

    const calculateTotalProgress = (taskList) => {
        if (!taskList || taskList.length === 0) return 0;
        const total = taskList.reduce((acc, t) => {
            const p = t.status === 'Completed' ? 100 : (t.progress || 0);
            return acc + Number(p);
        }, 0);
        return Math.round(total / taskList.length);
    };

    const dynamicDailyProg = calculateTotalProgress(dailyTasks);
    const dynamicWeeklyProg = calculateTotalProgress(weeklyTasks);

    return (
        <Layout>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{employee.name}'s Details</h2>
                </div>

                <button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:bg-blue-700 hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4" />
                    Assign Task
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="col-span-1 lg:col-span-1 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col animate-fade-in-up stagger-1 group">
                    <div className="flex flex-col items-center mb-6">
                        <img src={employee.avatar} alt={employee.name} className="h-32 w-32 rounded-full border-4 border-slate-50 dark:border-slate-800 mb-4 shadow-md object-cover transition-transform group-hover:scale-105" />
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{employee.name}</h3>
                        <span className="text-sm font-medium capitalize text-blue-700 dark:text-indigo-300 bg-blue-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full mt-2 border border-blue-100 dark:border-indigo-800">{employee.role}</span>
                    </div>

                    <div className="space-y-5 pt-6 border-t border-slate-200/40 dark:border-slate-800 w-full mb-6">
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                            <span className="text-sm font-medium">{employee.email || `${employee.name.split(' ')[0].toLowerCase()}@eduprova.com`}</span>
                        </div>
                            <span className="text-sm font-medium capitalize">
                                {['ADMIN', 'SUPER_ADMIN'].includes(employee.role?.toUpperCase()) ? 'Admin Access' : 'User Access'}
                            </span>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <Calendar className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                            <span className="text-sm font-medium">Joined Jan 2024</span>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-200/40 dark:border-slate-800 w-full bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4 text-indigo-500" /> Set Manual Progress
                        </h4>
                        
                        <div>
                            <div className="flex justify-between items-center text-sm font-medium mb-2">
                                <label className="text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                    Daily Progress (Calculated: {dynamicDailyProg}%)
                                </label>
                                <span className="text-blue-600 dark:text-blue-400 font-bold">
                                    {dailyProgress}%
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={dailyProgress} 
                                onChange={(e) => setDailyProgress(e.target.value)}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center text-sm font-medium mb-2">
                                <label className="text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                    Weekly Progress (Calculated: {dynamicWeeklyProg}%)
                                </label>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                    {weeklyProgress}%
                                </span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={weeklyProgress} 
                                onChange={(e) => setWeeklyProgress(e.target.value)}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                        </div>

                        <button
                            onClick={handleManualProgressUpdate}
                            className="w-full mt-2 bg-slate-800 dark:bg-indigo-600 hover:bg-slate-900 dark:hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-lg shadow-sm transition-all active:scale-95"
                        >
                            Save Progress Percentages
                        </button>
                    </div>
                </div>

                <div className="col-span-1 lg:col-span-2 space-y-6">

                    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up stagger-2 group">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-200/40 dark:border-slate-800 pb-3">
                            <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Latest Work Updates
                        </h3>
                        <div className="space-y-4">
                            {recentUpdates.length > 0 ? recentUpdates.slice(0, 5).map(task => (
                                <div key={task.id} className="flex gap-4 items-start p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                                            {task.status === 'Completed' ? 'Finished' : 'Assigned'}: {task.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{task.description}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md transition-colors duration-300 ${
                                        (() => {
                                            const displayProgress = task.status === 'Completed' ? 100 : (task.progress || 0);
                                            return displayProgress >= 100
                                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                                                : 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30';
                                        })()
                                    }`}>
                                        {(() => {
                                            const displayProgress = task.status === 'Completed' ? 100 : (task.progress || 0);
                                            return `${displayProgress}%`;
                                        })()}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent updates.</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up stagger-3 group">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-200/40 dark:border-slate-800 pb-3">Active Tasks</h3>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">Daily Tasks</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {dailyTasks.map(task => (
                                        <TaskCard 
                                            key={task.id} 
                                            task={task} 
                                            employee={employee} 
                                            isUser={true} 
                                            onStatusChange={changeTaskStatus} 
                                            onProgressChange={updateTaskProgress}
                                            onEdit={(task) => setEditingTask(task)}
                                        />
                                    ))}
                                    {dailyTasks.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-500">No daily tasks.</p>}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">Weekly Tasks</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {weeklyTasks.map(task => (
                                        <TaskCard 
                                            key={task.id} 
                                            task={task} 
                                            employee={employee} 
                                            isUser={true} 
                                            onStatusChange={changeTaskStatus} 
                                            onProgressChange={updateTaskProgress}
                                            onEdit={(task) => setEditingTask(task)}
                                        />
                                    ))}
                                    {weeklyTasks.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-500">No weekly tasks.</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <AssignTaskModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onAssign={handleAssignTask}
                employeeId={id}
                projectId={projectId || employee.projectId}
            />

            <EditTaskModal
                isOpen={!!editingTask}
                onClose={() => setEditingTask(null)}
                onSave={handleEditTask}
                task={editingTask}
            />
        </Layout>
    );
};

export default EmployeeDetails;
