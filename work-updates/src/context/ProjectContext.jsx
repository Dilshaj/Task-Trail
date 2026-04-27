import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { getProjects, addProject as apiAddProject, updateProject as apiUpdateProject, deleteProject as apiDeleteProject } from '../services/projectService';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getProjects();
            setProjects(data || []);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    // 🚀 STEP 4: Ensure UI Refreshes after creation
    const addProject = async (projectObj) => {
        try {
            // 1. Call createProject() and wait for it
            await apiAddProject(projectObj);

            // 2. Fetch projects immediately after to synchronize UI with DB
            await fetchProjects();

            console.log("✅ Project created and list refreshed successfully.");
        } catch (error) {
            console.error("Error adding project:", error);
            throw error;
        }
    };

    const editProject = async (id, data) => {
        try {
            await apiUpdateProject(id, data);
            await fetchProjects();
        } catch (error) {
            console.error("Error editing project:", error);
        }
    };

    const removeProject = async (id) => {
        try {
            await apiDeleteProject(id);
            await fetchProjects();
        } catch (error) {
            console.error("Error removing project:", error);
        }
    };

    return (
        <ProjectContext.Provider value={{
            projects,
            loading,
            addProject,
            editProject,
            removeProject,
            fetchProjects // Also exposing this for manual refreshes
        }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProjects = () => useContext(ProjectContext);
