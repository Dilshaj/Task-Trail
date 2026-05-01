import React, { createContext, useState, useContext, useEffect } from 'react';
import { useProjects } from './ProjectContext';

const ProjectFilterContext = createContext();

export const useProjectFilter = () => useContext(ProjectFilterContext);

export const ProjectFilterProvider = ({ children }) => {
    const { projects } = useProjects();

    const [selectedProjectId, setSelectedProjectId] = useState(() => {
        const stored = localStorage.getItem('selected_project_id');
        // Handle potential "undefined" or "null" strings from past storage
        return (stored && stored !== 'undefined' && stored !== 'null') ? stored : null;
    });

    // Derive the full project object from the ID
    const selectedProject = projects.find(p => p.id === selectedProjectId) || null;

    const selectProject = (projectId) => {
        if (!projectId || projectId === 'undefined' || projectId === 'null') {
            setSelectedProjectId(null);
            localStorage.removeItem('selected_project_id');
            localStorage.removeItem('selected_project_name');
            return;
        }

        const project = projects.find(p => p.id === projectId);
        setSelectedProjectId(projectId);
        localStorage.setItem('selected_project_id', projectId);
        if (project) {
            localStorage.setItem('selected_project_name', project.name);
        }
    };

    const clearProject = () => {
        setSelectedProjectId(null);
        localStorage.removeItem('selected_project_id');
        localStorage.removeItem('selected_project_name');
    };

    return (
        <ProjectFilterContext.Provider value={{ selectedProjectId, selectedProject, selectProject, clearProject }}>
            {children}
        </ProjectFilterContext.Provider>
    );
};
