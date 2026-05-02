import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import { useAttendance } from '../context/AttendanceContext';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import AssignTaskModal from '../components/AssignTaskModal';
import { ArrowLeft, Clock, Plus, Target, Mail, Shield, Calendar } from 'lucide-react';

const EmployeeDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const projectId = new URLSearchParams(location.search).get('project');
    const navigate = useNavigate();

    const { employees, tasks, assignTask, changeTaskStatus, updateProgress } = useTasks();

    const employee = employees.find(e => e.id === id);
    const employeeTasks = tasks.filter(t => t.assignedTo === id);

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [dailyProgress, setDailyProgress] = useState(employee?.dailyProgress || 0);
    const [weeklyProgress, setWeeklyProgress] = useState(employee?.weeklyProgress || 0);

    if (!employee) return <div>Loading...</div>;

    const handleManualProgressUpdate = () => {
        updateProgress(employee.id, { dailyProgress: Number(dailyProgress), weeklyProgress: Number(weeklyProgress) });
    };

    const handleAssignTask = (taskData) => {
        assignTask(taskData);
    };

    const recentUpdates = [...employeeTasks].sort((a, b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0));
    const dailyTasks = employeeTasks.filter(t => t.timeline === 'daily');
    const weeklyTasks = employeeTasks.filter(t => t.timeline === 'weekly');

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
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <Shield className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                            <span className="text-sm font-medium capitalize">{employee.role === 'admin' ? 'Admin Access' : 'User Access'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                            <Calendar className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                            <span className="text-sm font-medium">Joined Jan 2024</span>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-200/40 dark:border-slate-800 w-full">
                        <div>
                            <div className="flex justify-between items-center text-sm font-medium mb-3">
                                <label className="text-slate-600 dark:text-slate-300 flex items-center gap-2 font-semibold">
                                    <Target className="h-4 w-4 text-blue-500" /> Daily Progress
                                </label>
                                <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-4 py-1 rounded-full text-xs font-bold">
                                    {employee.dailyProgress || 0}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${employee.dailyProgress || 0}%` }}
                                ></div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center text-sm font-medium mb-3">
                                <label className="text-slate-600 dark:text-slate-300 flex items-center gap-2 font-semibold">
                                    <Target className="h-4 w-4 text-emerald-500" /> Weekly Progress
                                </label>
                                <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-4 py-1 rounded-full text-xs font-bold">
                                    {employee.weeklyProgress || 0}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-900 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${employee.weeklyProgress || 0}%` }}
                                ></div>
                            </div>
                        </div>
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
                                    <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                                        task.status === 'Completed' 
                                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' 
                                            : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                    }`}>
                                        {task.status}
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
                                    {dailyTasks.map(task => <TaskCard key={task.id} task={task} />)}
                                    {dailyTasks.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-500">No daily tasks.</p>}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">Weekly Tasks</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {weeklyTasks.map(task => <TaskCard key={task.id} task={task} />)}
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
        </Layout>
    );
};

export default EmployeeDetails;
