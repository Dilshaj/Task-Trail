// v1.1.0-deploy
import React, { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { useProjectFilter } from '../context/ProjectFilterContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProjectCard from '../components/ProjectCard';
import AddProjectModal from '../components/AddProjectModal';
import AddEmployeeModal from '../components/AddEmployeeModal';
import { Plus, Users, FolderKanban, CheckCircle, X } from 'lucide-react';
import { getAdminMetrics } from '../services/dashboardService';

const AdminDashboard = () => {
    const { projects, addProject, editProject, removeProject } = useProjects();
    const { allEmployees, employees, tasks, addEmployee } = useTasks();
    const { user } = useAuth();
    const { selectedProjectId, selectedProject, clearProject, selectProject } = useProjectFilter();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    // 🕵️ DEBUG: Log project data to verify arrival from backend
    React.useEffect(() => {
        console.log("📂 PROJECT DATA SYNC:", projects);
    }, [projects]);

    const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
    const [projectForEmployee, setProjectForEmployee] = useState(null);

    // Local calculations for real-time, zero-flicker metrics
    const totalProjects = projects.length;
    const totalEmployees = allEmployees.length;
    const completedCount = tasks.filter(t => t.status === 'Completed').length;

    // Use computed metrics for the UI
    const metrics = {
        activeProjects: totalProjects,
        activeEmployees: totalEmployees,
        completedTasks: completedCount
    };


    const handleSaveProject = (projectData) => {
        if (editingProject) {
            editProject(projectData.id, projectData);
        } else {
            addProject(projectData);
        }
    };

    const openAddModal = () => {
        setEditingProject(null);
        setIsModalOpen(true);
    };

    const openEditModal = (project) => {
        setEditingProject(project);
        setIsModalOpen(true);
    };

    const openAddEmployeeModal = (project) => {
        setProjectForEmployee(project);
        setIsAddEmpModalOpen(true);
    };

    const handleAddEmployee = (employeeData) => {
        addEmployee(employeeData);
    };

    const handleProjectClick = (project) => {
        // Store in React state via context
        selectProject(project.id);

        // Explicitly store in localStorage as requested
        localStorage.setItem('selected_project_id', project.id);
        localStorage.setItem('selected_project_name', project.name);

        navigate(`/project-dashboard`);
    };

    const completedTasks = tasks.filter(t => t.status === 'Completed').length;

    return (
        <Layout>
            <div className="mb-8">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center flex-wrap gap-3">
                            {selectedProject ? `${selectedProject.name} Dashboard` : `Welcome back, ${user?.name} 👋`}
                            <span className="text-sm font-medium capitalize text-blue-700 dark:text-indigo-300 bg-blue-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full border border-blue-100 dark:border-indigo-800 align-middle">
                                {user?.role}
                            </span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            {selectedProject
                                ? `Viewing detailed metrics for project ${selectedProject.name}.`
                                : "Here's your global admin overview for today."}
                        </p>
                    </div>
                    {selectedProject && (
                        <button
                            onClick={clearProject}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                            <X className="h-4 w-4" />
                            Clear Filter
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 text-slate-700 dark:text-slate-200">
                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 animate-fade-in-up stagger-1">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 transition-transform group-hover:scale-110">
                        <FolderKanban className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                            {selectedProject ? "Project Active" : "Total Projects"}
                        </p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {metrics.activeProjects}
                        </h3>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 animate-fade-in-up stagger-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 transition-transform group-hover:scale-110">
                        <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Employees</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {metrics.activeEmployees}
                        </h3>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-center gap-4 animate-fade-in-up stagger-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 transition-transform group-hover:scale-110">
                        <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completed Tasks</p>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white">
                            {metrics.completedTasks}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Projects Overview</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {projects.map((project, idx) => (
                    <div key={project.id} className={`animate-fade-in-up stagger-${(idx % 5) + 1}`}>
                        <ProjectCard
                            project={project}
                            onEdit={openEditModal}
                            onDelete={removeProject}
                            onBodyClick={handleProjectClick}
                            onAddEmployee={openAddEmployeeModal}
                        />
                    </div>
                ))}

                <button
                    onClick={openAddModal}
                    className="group flex aspect-video md:aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-transparent text-slate-500 dark:text-slate-400 transition-all duration-300 hover:shadow-md hover:border-blue-400 dark:hover:border-indigo-500 hover:bg-blue-50 dark:hover:bg-indigo-900/20 hover:text-blue-600 dark:hover:text-indigo-400 hover:-translate-y-1 animate-fade-in-up stagger-4"
                >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-indigo-900/40 transition">
                        <Plus className="h-6 w-6" />
                    </div>
                    <span className="font-medium">Add Project</span>
                </button>
            </div>

            <AddProjectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProject}
                project={editingProject}
            />

            {projectForEmployee && (
                <AddEmployeeModal
                    isOpen={isAddEmpModalOpen}
                    onClose={() => setIsAddEmpModalOpen(false)}
                    onAdd={handleAddEmployee}
                    projectId={projectForEmployee.id}
                    projectName={projectForEmployee.name}
                />
            )}
        </Layout>
    );
};

export default AdminDashboard;
