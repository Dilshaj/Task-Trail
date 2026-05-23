import React, { createContext, useState, useContext, useEffect } from 'react';
import { useProjects } from './ProjectContext';
import { useAuth } from './AuthContext';

const ProjectFilterContext = createContext();

export const useProjectFilter = () => useContext(ProjectFilterContext);

export const ProjectFilterProvider = ({ children }) => {
    const { projects } = useProjects();
    const { user } = useAuth();

    const [selectedProjectId, setSelectedProjectId] = useState(() => {
        const stored = sessionStorage.getItem('selected_project_id');
        return (stored && stored !== 'undefined' && stored !== 'null') ? stored : null;
    });

    // 🔒 RBAC Enforcement: TEAM_LEAD is locked to their project
    useEffect(() => {
        if (!user) return;
        const role = user?.role?.toUpperCase();
        if (role === 'TEAM_LEAD' && user.projectId) {
            setSelectedProjectId(user.projectId);
            sessionStorage.setItem('selected_project_id', user.projectId);
        } else if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
            // Global admins should start with no project filter to see ALL data
            const currentPath = window.location.pathname;
            if (!currentPath.includes('project-dashboard')) {
                setSelectedProjectId(null);
                sessionStorage.removeItem('selected_project_id');
                sessionStorage.removeItem('selected_project_name');
            }
        }
    }, [user]);

    // Derive the full project object from the ID
    const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

    const selectProject = (projectId) => {
        if (!projectId || projectId === 'undefined' || projectId === 'null') {
            setSelectedProjectId(null);
            sessionStorage.removeItem('selected_project_id');
            sessionStorage.removeItem('selected_project_name');
            return;
        }

        const project = projects.find(p => p.id === projectId);
        setSelectedProjectId(projectId);
        sessionStorage.setItem('selected_project_id', projectId);
        if (project) {
            sessionStorage.setItem('selected_project_name', project.name);
        }
    };

    const clearProject = () => {
        setSelectedProjectId(null);
        sessionStorage.removeItem('selected_project_id');
        sessionStorage.removeItem('selected_project_name');
    };

    return (
        <ProjectFilterContext.Provider value={{ selectedProjectId, selectedProject, selectProject, clearProject }}>
            {children}
        </ProjectFilterContext.Provider>
    );
};
