import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../context/ProjectContext';
import { useTasks } from '../context/TaskContext';
import { useProjectFilter } from '../context/ProjectFilterContext';
import Layout from '../components/Layout';
import EmployeeCard from '../components/EmployeeCard';
import AddEmployeeModal from '../components/AddEmployeeModal';
import { ArrowLeft, Users, Clock, FolderKanban, CheckCircle } from 'lucide-react';
import { getAdminMetrics } from '../services/dashboardService';

const ProjectDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { projects } = useProjects();
    const { employees, tasks, addEmployee, refreshEmployees } = useTasks();
    const { selectedProjectId, selectedProject } = useProjectFilter();

    const role = user?.role?.toUpperCase();
    const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
    const isTeamLead = role === 'TEAM_LEAD';

    // ... stats logic ...

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [metrics, setMetrics] = useState({
        activeProjects: 0,
        activeEmployees: 0,
        totalTasks: 0,
        completedTasks: 0
    });
    const [loadingMetrics, setLoadingMetrics] = useState(true);

    const projectId = selectedProjectId || sessionStorage.getItem('selected_project_id');

    useEffect(() => {
        if (!projectId) {
            navigate('/admin');
            return;
        }

        const fetchMetricsInitial = async () => {
            setLoadingMetrics(true);
            try {
                const data = await getAdminMetrics(projectId);
                setMetrics(data);
                // Also ensure employee data is fresh for the team section
                if (refreshEmployees) await refreshEmployees();
            } catch (err) {
                console.error("Failed to load dashboard data:", err);
            } finally {
                setLoadingMetrics(false);
            }
        };
        fetchMetricsInitial();
    }, [projectId, navigate, refreshEmployees]);

    // Polling background sync removed to optimize API usage


    // Local calculations for metrics to ensure zero lag and perfect sync
    const project = projects.find(p => p.id === projectId);
    const projectEmployees = employees.filter(e => e.projectId === projectId);
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const completedCount = projectTasks.filter(t => t.status === 'Completed').length;
    const recentUpdates = projectTasks.filter(t => t.status === 'Completed').sort((a, b) => new Date(b.deadline) - new Date(a.deadline));

    const handleAddEmployee = (employeeData) => {
        addEmployee(employeeData);
    };

    if (!project && !loadingMetrics) return (
        <Layout>
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <p className="text-slate-500 dark:text-slate-400">Please select a project.</p>
                <button onClick={() => navigate('/admin')} className="mt-4 text-blue-600 hover:underline">Return to Dashboard</button>
            </div>
        </Layout>
    );

    return (
        <Layout>
            <div className="mb-6 flex items-center gap-4 animate-fade-in-up">
                {isSuperAdmin && (
                    <button
                        onClick={() => navigate('/admin')}
                        className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:-translate-x-1"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                )}
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {selectedProject 
                        ? `Project: ${selectedProject.name}` 
                        : (selectedProjectId ? `Loading project details...` : "Select a Project")}
                </h2>
            </div>

            {/* Project Stats Dashboard Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-4 animate-fade-in-up stagger-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                        <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Team Size</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {projectEmployees.length}
                        </h3>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-4 animate-fade-in-up stagger-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <FolderKanban className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Tasks</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {projectTasks.length}
                        </h3>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex items-center gap-4 animate-fade-in-up stagger-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                        <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {completedCount}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Project Banner Area */}
            <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 shadow-sm flex flex-col sm:row items-center p-6 gap-6 relative animate-fade-in-up stagger-1 group">
                <div className="absolute inset-0 z-0 opacity-10 blur-sm overflow-hidden">
                    <img src={project?.image} alt="bg" className="w-full h-full object-cover" />
                </div>
                <div className="h-24 w-32 flex-shrink-0 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 shadow-md z-10 flex items-center justify-center p-3">
                    <img src={project?.image} alt={project?.name} className="h-full w-full object-contain" />
                </div>
                <div className="z-10 flex flex-col items-center sm:items-start text-center sm:text-left">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{project?.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Project ID: {projectId}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <div
                    onClick={() => navigate('/admin/employees')}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hidden lg:flex flex-col items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
                >
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                        <Users className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Employees</span>
                </div>
                <div
                    onClick={() => navigate('/admin/attendance')}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hidden lg:flex flex-col items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
                >
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400">
                        <Clock className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Attendance</span>
                </div>
                <div
                    onClick={() => navigate('/admin/leaves')}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hidden lg:flex flex-col items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all"
                >
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Leaves</span>
                </div>
            </div>

            {/* Latest Work Updates Section */}
            <div className="mb-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm animate-fade-in-up stagger-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-200/40 dark:border-slate-800 pb-3">
                    <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Latest Work Updates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentUpdates.length > 0 ? recentUpdates.slice(0, 6).map(task => {
                        const assignedTo = employees.find(e => e.id === task.assignedTo);
                        return (
                            <div key={task.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">{task.title}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors duration-300 ${
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
                                <div className="flex items-center gap-2">
                                    <img src={assignedTo?.avatar} alt={assignedTo?.name} className="h-5 w-5 rounded-full object-cover" />
                                    <span className="text-[10px] font-medium text-slate-400">{assignedTo?.name}</span>
                                </div>
                            </div>
                        );
                    }) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 col-span-full">No recent updates.</p>
                    )}
                </div>
            </div>

            {/* Project Team Members Grid */}
            <div className="mb-8">
                <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Project Team Members</h3>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 dark:bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
                    >
                        + Add Member
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {projectEmployees.map((emp) => (
                        <EmployeeCard key={emp.id} employee={emp} projectId={projectId} />
                    ))}
                    {projectEmployees.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200/60">
                            No employees assigned to this project yet.
                        </div>
                    )}
                </div>
            </div>

            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddEmployee}
                projectId={projectId}
                projectName={project?.name}
            />
        </Layout>
    );
};

export default ProjectDashboard;
