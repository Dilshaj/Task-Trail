import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import { useAttendance } from '../context/AttendanceContext';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, ListTodo, LogIn, LogOut, FileText, Download, ShieldCheck, CalendarRange, Edit2, Mail, RotateCw } from 'lucide-react';
import { calculateActiveHours } from '../utils/helpers';
import { downloadOfferLetter } from '../services/offerLetterService';
import { downloadPaySlip, downloadLatestPaySlip } from '../services/paySlipService';
import { useLeaves } from '../context/LeaveContext';
import ConfirmationModal from '../components/ConfirmationModal';
import EditTaskModal from '../components/EditTaskModal';
import { getNotifications, markAsRead } from '../services/notificationService';

const UserDashboard = () => {
    const { user } = useAuth();
    const { employees, allEmployees, tasks, editTask, changeTaskStatus, updateTaskProgress } = useTasks();
    const { activeLog, loading, locationStatus, handleCheckIn, handleCheckOut } = useAttendance();
    const { leaves } = useLeaves();
    const navigate = useNavigate();
    const [showSlipHistory, setShowSlipHistory] = useState(false);
    const [showDateSelector, setShowDateSelector] = useState(false);
    const [slipDateRange, setSlipDateRange] = useState({ start: '', end: '' });
    const [paySlips, setPaySlips] = useState([]);
    const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [myWeeklyTasks, setMyWeeklyTasks] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    const empId = user?.employee_id || user?.employeeId;

    // Use allEmployees (global list) to find current user to bypass project filtering issues
    const employeeData = allEmployees?.find(e => e.id === user?.id || e.employeeId === empId) || 
                       employees?.find(e => e.id === user?.id) || 
                       user;

    React.useEffect(() => {
        if (empId) {
            import('../services/paySlipService').then(({ getMyPaySlips }) => {
                getMyPaySlips(empId)
                    .then(data => setPaySlips(data || []))
                    .catch(err => {
                        console.warn("Pay slips fetch skipped/failed:", err.message);
                        setPaySlips([]);
                    });
            });

            // Fetch Notifications
            getNotifications().then(setNotifications).catch(() => setNotifications([]));

            // Fetch Weekly Tasks
            import('../services/taskService').then(({ getTasksByEmployee }) => {
                getTasksByEmployee(empId, true).then(setMyWeeklyTasks);
            });
        }
    }, [empId, tasks]); // Refresh if global tasks change (e.g. status update)

    const handleMarkAsRead = async (id) => {
        try {
            await markAsRead(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error("Failed to mark as read");
        }
    };

    const handleDownloadOffer = () => {
        if (empId) {
            downloadOfferLetter(empId);
        } else {
            alert('Employee ID not found. Please contact admin.');
        }
    };

    const handleDownloadPaySlip = async (id = null) => {
        if (!empId) {
            alert('Employee ID not found.');
            return;
        }

        try {
            if (id) {
                // Download specific slip from history
                await downloadPaySlip(id);
            } else {
                // Download latest slip
                await downloadLatestPaySlip(empId);
            }
        } catch (err) {
            alert('Failed to download pay slip. Make sure a pay slip has been generated for you.');
        }
    };
    const userId = (user?.id || '').toLowerCase().trim();
    const employeeId = (user?.employee_id || user?.employeeId || '').toLowerCase().trim();
    
    const myTasks = tasks.filter(t => {
        const assignedId = (t.assignedTo || '').toLowerCase().trim();
        return assignedId === userId || (employeeId && assignedId === employeeId);
    });

    const [filter, setFilter] = useState('all');

    // 🔥 PRECISE WEEK SYNC: Monday 00:00:00 to Sunday 23:59:59
    const getWeekBoundaries = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const start = new Date(d.setDate(diff));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    const { start: currentWeekStart, end: currentWeekEnd } = getWeekBoundaries(new Date());

    const filteredTasks = tasks.filter(task => {
        // 1. Ownership Check
        const assignedId = (task.assignedTo || '').toLowerCase().trim();
        const isMine = assignedId === userId || (employeeId && assignedId === employeeId);
        if (!isMine) return false;

        // 2. Active Check: Must NOT be completed (Completed tasks move to History)
        if (task.status === 'Completed') return false;

        // 3. Precise Week Check
        const taskWeekStart = task.weekStart ? new Date(task.weekStart) : null;
        const taskWeekEnd = task.weekEnd ? new Date(task.weekEnd) : null;
        const taskCreatedAt = task.createdAt ? new Date(task.createdAt) : null;

        let isInCurrentWeek = false;
        if (taskWeekStart && taskWeekEnd) {
            // If task has explicit week bounds, check if they overlap with current week
            isInCurrentWeek = taskWeekStart <= currentWeekEnd && taskWeekEnd >= currentWeekStart;
        } else if (taskCreatedAt) {
            // Fallback: check if createdAt is within current week boundaries
            isInCurrentWeek = taskCreatedAt >= currentWeekStart && taskCreatedAt <= currentWeekEnd;
        }

        if (!isInCurrentWeek) return false;

        // 4. Timeline Filter
        if (filter === 'all') return true;
        return task.timeline && task.timeline.toLowerCase() === filter.toLowerCase();
    });

    const handleStatusChange = (taskId, newStatus) => {
        changeTaskStatus(taskId, newStatus);
    };

    const handleEditTask = async (taskId, taskData) => {
        try {
            await editTask(taskId, taskData);
        } catch (error) {
            alert("Failed to update task: " + error.message);
        }
    };


    const completedCount = myTasks.filter(t => t.status === 'Completed').length;
    const pendingCount = myTasks.filter(t => t.status !== 'Completed').length;

    const myLeaves = leaves.filter(l => l.userId === empId);
    const latestLeave = myLeaves.length > 0 ? myLeaves[0] : null;

    // 🔥 INSTANT SYNC: Calculate progress locally from the tasks array
    const calculateAggregatedProgress = (taskList, timeline) => {
        const filtered = taskList.filter(t => (t.timeline || '').toLowerCase() === timeline);
        if (filtered.length === 0) return 0;
        const total = filtered.reduce((acc, t) => {
            const p = t.status === 'Completed' ? 100 : (t.progress || 0);
            return acc + Number(p);
        }, 0);
        return Math.round(total / filtered.length);
    };

    const localDailyProgress = calculateAggregatedProgress(myTasks, 'daily');
    const localWeeklyProgress = calculateAggregatedProgress(myTasks, 'weekly');

    return (
        <Layout>
            {/* Profile Overview Section */}
            <div className="mb-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up relative overflow-hidden group">
                {/* Decorative background element */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors duration-500"></div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Profile Image with status ring */}
                        <div className="relative">
                            <img
                                src={user?.avatar || `https://ui-avatars.com/api/?name=${(user?.name || 'User').replace(' ', '+')}&background=random`}
                                alt={user?.name}
                                className="h-28 w-28 rounded-2xl object-cover border-4 border-white dark:border-slate-800 shadow-xl"
                            />
                            {activeLog && (
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 border-4 border-white dark:border-slate-800 w-6 h-6 rounded-full shadow-lg animate-pulse" title="Active Check-in"></div>
                            )}
                        </div>

                        <div className="text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                                <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">
                                    {user?.name}
                                </h2>
                                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 w-fit mx-auto sm:mx-0">
                                    {employeeData?.role}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                    <Mail className="h-4 w-4 text-indigo-500" />
                                    <span>{user?.email}</span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-2 text-slate-500 dark:text-slate-400 text-sm">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    <span>Joined: {user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row items-stretch sm:items-center lg:items-stretch">
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center justify-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
                        >
                            <Edit2 className="h-4 w-4" />
                            Edit Profile
                        </button>

                        <div className="h-px w-full xl:w-px xl:h-10 bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>

                        {/* 🔒 Security Warning for Geolocation */}
                        {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
                            <div className="flex flex-col gap-2 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800 animate-pulse max-w-[240px]">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                                    <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                                    <span>GPS blocked (Insecure HTTP). Location will be inaccurate.</span>
                                </div>
                                <button 
                                    onClick={() => window.location.href = `https://${window.location.host}${window.location.pathname}`}
                                    className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm transition-all"
                                >
                                    Switch to Secure HTTPS
                                </button>
                            </div>
                        )}

                        {/* 🕒 Strict Time Window Validation */}
                        {(() => {
                            const utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
                            const ist = new Date(utc + (3600000 * 5.5));
                            const hour = ist.getHours();
                            
                            if (hour < 8) {
                                return (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-xl text-amber-700 dark:text-amber-400 text-xs font-bold animate-pulse">
                                        Check-in starts at 8:00 AM
                                    </div>
                                );
                            }
                            if (hour >= 19) {
                                return (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-2 rounded-xl text-red-700 dark:text-red-400 text-xs font-bold">
                                        Check-in closed (after 7:00 PM)
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        {!activeLog ? (
                            <button
                                onClick={handleCheckIn}
                                disabled={loading || (() => {
                                    const utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
                                    const ist = new Date(utc + (3600000 * 5.5));
                                    const hour = ist.getHours();
                                    return hour < 8 || hour >= 19;
                                })()}
                                className={`flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 dark:shadow-none hover:-translate-y-0.5 active:scale-95 ${
                                    (loading || (() => {
                                        const utc = new Date().getTime() + (new Date().getTimezoneOffset() * 60000);
                                        const ist = new Date(utc + (3600000 * 5.5));
                                        const hour = ist.getHours();
                                        return hour < 8 || hour >= 19;
                                    })()) 
                                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed shadow-none' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <RotateCw className="h-4 w-4 animate-spin" />
                                        {locationStatus || 'Capturing...'}
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="h-4 w-4" />
                                        Check In
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/40 p-1 pr-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                                    <Clock className="h-5 w-5" />
                                </div>
                                <div className="flex flex-col pr-2">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Working Since</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                        {(() => {
                                            const timeStr = activeLog.checkInTime || activeLog.checkIn || activeLog.check_in;
                                            if (!timeStr) return '--:--';
                                            const date = new Date(timeStr);
                                            return isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        })()}
                                    </span>
                                </div>

                                {/* 📍 Live Location Update Button */}
                                <button
                                    onClick={handleCheckIn}
                                    disabled={loading}
                                    className={`flex items-center justify-center p-2.5 rounded-xl transition-all shadow-sm active:scale-95 border ${loading ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white text-blue-600 border-blue-100 hover:bg-blue-50 hover:shadow-md'}`}
                                    title="Refresh Live Location"
                                >
                                    <RotateCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                                </button>

                                <button
                                    onClick={() => setShowCheckoutConfirm(true)}
                                    className="bg-rose-500 hover:bg-rose-600 text-white p-2.5 rounded-xl transition-all shadow-md shadow-rose-100 dark:shadow-none active:scale-95"
                                    title="Check Out"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 text-slate-700 dark:text-slate-200">
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center justify-between animate-fade-in-up stagger-1 group">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</p>
                        <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{myTasks.length}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 transition-transform group-hover:scale-110">
                        <ListTodo className="h-6 w-6" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center justify-between animate-fade-in-up stagger-2 group">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending</p>
                        <h3 className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1">{pendingCount}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 transition-transform group-hover:scale-110">
                        <Clock className="h-6 w-6" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center justify-between animate-fade-in-up stagger-3 group">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
                        <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{completedCount}</h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 transition-transform group-hover:scale-110">
                        <CheckCircle2 className="h-6 w-6" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center justify-between animate-fade-in-up stagger-4 group">
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Hours (Today)</p>
                        <h3 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                            {activeLog ? calculateActiveHours(activeLog.checkInTime || activeLog.checkIn || activeLog.check_in) : '0h 0m'}
                        </h3>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 transition-transform group-hover:scale-110">
                        <Clock className="h-6 w-6" />
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-800/50 dark:to-emerald-900/10 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center justify-between animate-fade-in-up stagger-5 group">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Daily Work Progress</p>
                        <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                            {localDailyProgress}%
                        </h3>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${localDailyProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-800/50 dark:to-blue-900/10 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex items-center justify-between animate-fade-in-up stagger-6 group">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Weekly Work Progress</p>
                        <h3 className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                            {localWeeklyProgress}%
                        </h3>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                                className="bg-blue-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${localWeeklyProgress}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col animate-fade-in-up stagger-7">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Notifications</p>
                        {notifications.length > 0 && (
                            <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-full animate-pulse">
                                {notifications.length} NEW
                            </span>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto max-h-[120px] space-y-3 pr-1 scrollbar-none">
                        {notifications.length > 0 ? (
                            notifications.map(n => (
                                <div key={n.id} className="flex items-start gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-100 transition group relative">
                                    <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${n.type === 'task' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                                    <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex-1 leading-tight line-clamp-2">
                                        {n.message}
                                    </p>
                                    <button 
                                        onClick={() => handleMarkAsRead(n.id)}
                                        className="text-slate-400 hover:text-indigo-600 transition"
                                        title="Dismiss"
                                    >
                                        <RotateCw className="h-3 w-3" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-4">
                                <ShieldCheck className="h-8 w-8 opacity-20 mb-2" />
                                <p className="text-[10px] font-medium italic">No new alerts</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions & Documents Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Employee Resources */}
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-blue-500" />
                        Quick Resources
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={() => alert('Bench Policy: 1. Regular attendance is required even if not assigned to a project. 2. Self-learning and internal project contributions are mandatory. 3. Daily check-in/out is essential.')}
                            className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-blue-300 dark:hover:border-indigo-800 hover:bg-blue-50 dark:hover:bg-indigo-900/20 transition-all group"
                        >
                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 group-hover:scale-110 transition">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-800 dark:text-white text-sm">Bench Policies</p>
                                <p className="text-xs text-slate-500">View company guidelines</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/apply-leave')}
                            className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-purple-800 hover:bg-indigo-50 dark:hover:bg-purple-900/20 transition-all group"
                        >
                            <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition">
                                <CalendarRange className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-slate-800 dark:text-white text-sm">Apply Leave</p>
                                <p className="text-xs text-slate-500">Manage your time off</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Document Downloads */}
                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-500" />
                            Official Documents
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setShowDateSelector(!showDateSelector); setShowSlipHistory(false); }}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition ${showDateSelector ? 'bg-indigo-600 text-white' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40'}`}
                            >
                                {showDateSelector ? 'Back' : 'Date Selection'}
                            </button>
                            <button
                                onClick={() => { setShowSlipHistory(!showSlipHistory); setShowDateSelector(false); }}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-xl transition ${showSlipHistory ? 'bg-indigo-600 text-white' : 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40'}`}
                            >
                                {showSlipHistory ? 'Back' : 'History'}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {!showSlipHistory && !showDateSelector ? (
                            <>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">Offer Letter</p>
                                            <p className="text-xs text-slate-500">Employment Confirmation</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDownloadOffer}
                                        className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition"
                                        title="Download"
                                    >
                                        <Download className="h-5 w-5" />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-emerald-200 transition group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white text-sm">Current Pay Slip</p>
                                            <p className="text-xs text-slate-500">March 2026 • Issued Today</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownloadPaySlip()}
                                        className="p-2 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition"
                                        title="Download"
                                    >
                                        <Download className="h-5 w-5" />
                                    </button>
                                </div>
                            </>
                        ) : showDateSelector ? (
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
                                <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Select Pay Slip Duration</p>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1 ml-1">START DATE</label>
                                        <input
                                            type="date"
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                            value={slipDateRange.start}
                                            onChange={(e) => setSlipDateRange({ ...slipDateRange, start: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 block mb-1 ml-1">END DATE</label>
                                        <input
                                            type="date"
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                            value={slipDateRange.end}
                                            onChange={(e) => setSlipDateRange({ ...slipDateRange, end: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <button
                                    disabled={!slipDateRange.start || !slipDateRange.end}
                                    onClick={() => alert(`Generating pay slip for period: ${slipDateRange.start} to ${slipDateRange.end}`)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg py-2.5 text-xs font-bold transition-all shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Custom Range Slip
                                </button>
                            </div>
                        ) : (
                            <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                {paySlips.map((slip, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-slate-400" />
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white text-sm">Pay Slip - {slip.month}</p>
                                                <p className="text-xs text-slate-500">Issued on {new Date(slip.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDownloadPaySlip(slip.id)}
                                            className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition"
                                            title="Download"
                                        >
                                            <Download className="h-5 w-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>


            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        Active Tasks
                    </h2>
                    <p className="text-xs text-slate-500">
                        Showing active tasks for the current week
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 w-full sm:w-auto overflow-x-auto">
                        {['all', 'daily', 'weekly'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition flex-1 sm:flex-none text-center ${filter === f ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTasks.length > 0 ? (
                    filteredTasks.map((task, idx) => (
                        <div key={task.id} className={`animate-fade-in-up stagger-${(idx % 5) + 1}`}>
                            <TaskCard
                                task={task}
                                isUser={true}
                                employee={employeeData}
                                onStatusChange={handleStatusChange}
                                onProgressChange={updateTaskProgress}
                                onEdit={(t) => setEditingTask(t)}
                            />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col items-center justify-center">
                        <CheckCircle2 className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3" />
                        <p className="font-medium">No tasks found for this filter.</p>
                        <p className="text-xs mt-1">You're all caught up!</p>
                    </div>
                )}
            </div>
            <ConfirmationModal
                isOpen={showCheckoutConfirm}
                onClose={() => setShowCheckoutConfirm(false)}
                onConfirm={handleCheckOut}
                title="Confirm Check-Out"
                message="Are you sure you want to check out? Your active working session for today will be ended."
                confirmText="Yes, Check Out"
                type="danger"
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

export default UserDashboard;
