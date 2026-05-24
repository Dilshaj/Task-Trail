import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { useTasks } from '../context/TaskContext';
import Layout from '../components/Layout';
import EmployeeCard from '../components/EmployeeCard';
import AddEmployeeModal from '../components/AddEmployeeModal';
import { ArrowLeft, Users, Clock, Search } from 'lucide-react';

const ProjectDetails = () => {
    const id = useParams().id;
    const navigate = useNavigate();
    const { projects } = useProjects();
    const { employees, tasks, addEmployee } = useTasks();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeDomain, setActiveDomain] = useState('All');

    useEffect(() => {
        setSearchQuery('');
        setActiveDomain('All');
    }, [id]);

    const handleAddEmployee = (employeeData) => {
        addEmployee(employeeData);
    };

    const project = projects.find(p => p.id === id);
    const projectEmployees = employees.filter(e => e.projectId === id);
    const projectTasks = tasks.filter(t => t.projectId === id);
    const recentUpdates = projectTasks.filter(t => t.status === 'Completed').sort((a, b) => new Date(b.deadline) - new Date(a.deadline));

    const getDomainGroup = (roleStr) => {
        if (!roleStr) return 'Others';
        const r = roleStr.toLowerCase();
        if (r.includes('python')) return 'Python Developer';
        if (r.includes('uiux') || r.includes('ui/ux') || r.includes('design')) return 'UI/UX Design';
        if (r.includes('developer')) return 'Developers';
        if (r.includes('analyst')) return 'Data Analysts';
        if (r.includes('devops')) return 'DevOps';
        if (r.includes('security')) return 'Cyber Security';
        return 'Others';
    };

    const domainCounts = {
        All: projectEmployees.length,
        Developers: projectEmployees.filter(e => getDomainGroup(e.role) === 'Developers').length,
        'Python Developer': projectEmployees.filter(e => getDomainGroup(e.role) === 'Python Developer').length,
        'Data Analysts': projectEmployees.filter(e => getDomainGroup(e.role) === 'Data Analysts').length,
        DevOps: projectEmployees.filter(e => getDomainGroup(e.role) === 'DevOps').length,
        'Cyber Security': projectEmployees.filter(e => getDomainGroup(e.role) === 'Cyber Security').length,
        'UI/UX Design': projectEmployees.filter(e => getDomainGroup(e.role) === 'UI/UX Design').length,
        Others: projectEmployees.filter(e => getDomainGroup(e.role) === 'Others').length,
    };

    let filteredEmployees = projectEmployees;
    if (activeDomain !== 'All') {
        filteredEmployees = filteredEmployees.filter(e => getDomainGroup(e.role) === activeDomain);
    }
    if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filteredEmployees = filteredEmployees.filter(e => 
            (e.name || '').toLowerCase().includes(query) || 
            (e.role || e.title || '').toLowerCase().includes(query)
        );
    }

    if (!project) return <div>Loading...</div>;

    return (
        <Layout>
            <div className="mb-6 flex items-center gap-4 animate-fade-in-up">
                <button
                    onClick={() => navigate(-1)}
                    className="rounded-full p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors hover:-translate-x-1"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">{project.name} Details</h2>
            </div>

            <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row items-center p-6 gap-6 relative animate-fade-in-up stagger-1 group">
                <div className="absolute inset-0 z-0 opacity-10 blur-sm overflow-hidden">
                    <img src={project.image} alt="bg" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="h-24 w-32 flex-shrink-0 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/40 shadow-md z-10 flex items-center justify-center p-3">
                    <img src={project.image} alt={project.name} className="h-full w-full object-contain drop-shadow-sm transition-transform group-hover:scale-110" />
                </div>
                <div className="z-10 flex flex-col items-center sm:items-start text-center sm:text-left">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{project.name}</h3>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full w-fit border border-slate-100 dark:border-slate-700 shadow-sm whitespace-nowrap">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">{projectEmployees.length} Team Members</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80 px-3 py-1.5 rounded-full w-fit border border-slate-100 dark:border-slate-700 shadow-sm whitespace-nowrap">
                            <Clock className="h-4 w-4 text-emerald-500" />
                            <span className="font-medium">{recentUpdates.length} Work Updates</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Work Updates Section */}
            <div className="mb-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in-up stagger-2 group">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-200/40 dark:border-slate-800 pb-3">
                    <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Latest Work Updates
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recentUpdates.length > 0 ? recentUpdates.slice(0, 3).map(task => {
                        const assignedTo = employees.find(e => e.id === task.assignedTo);
                        return (
                            <div key={task.id} className="flex gap-4 items-start p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Completed: {task.title}</h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase transition-colors duration-300 ${
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
                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">{task.description}</p>
                                    <div className="flex items-center gap-2">
                                        <img src={assignedTo?.avatar} alt={assignedTo?.name} className="h-5 w-5 rounded-full object-cover" />
                                        <span className="text-[10px] font-medium text-slate-400">{assignedTo?.name}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-full py-4 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">No recent completed updates for this project.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in-up stagger-2">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Project Team Members</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage and filter project contributors by their specialized domains</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Search members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-blue-600 dark:bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:shadow-md hover:bg-blue-700 dark:hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-300"
                    >
                        <Users className="h-4 w-4" />
                        <span className="font-bold text-lg leading-none">+</span> Add
                    </button>
                </div>
            </div>

            {/* Domain Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 overflow-x-auto no-scrollbar">
                {Object.keys(domainCounts).map((domain) => {
                    const count = domainCounts[domain];
                    const isActive = activeDomain === domain;
                    return (
                        <button
                            key={domain}
                            onClick={() => setActiveDomain(domain)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                isActive
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                    : 'bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/50 text-slate-600 dark:text-slate-300'
                            }`}
                        >
                            <span>{domain}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredEmployees.map((emp, index) => (
                    <div key={emp.id} className={`animate-fade-in-up stagger-${(index % 5) + 1}`}>
                        <EmployeeCard employee={emp} projectId={id} />
                    </div>
                ))}
                {filteredEmployees.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/50">
                        No employees found matching the filters.
                    </div>
                )}
            </div>

            <AddEmployeeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddEmployee}
                projectId={project.id}
                projectName={project.name}
            />
        </Layout>
    );
};

export default ProjectDetails;
