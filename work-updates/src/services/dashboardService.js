import api from './api';
const API_URL = 'dashboard';

export const getAdminMetrics = async (projectId = null) => {
    try {
        const params = {};
        if (projectId) params.project_id = projectId;
        const res = await api.get(`${API_URL}/admin`, { params });
        return res.data;
    } catch (error) {
        console.error('Failed to fetch admin metrics:', error);
        return {
            activeProjects: 0,
            activeEmployees: 0,
            totalTasks: 0,
            completedTasks: 0
        };
    }
};

export const getUserMetrics = async (userId) => {
    try {
        const res = await api.get(`${API_URL}/employee/${userId}`);
        return res.data;
    } catch (error) {
        console.error('Failed to fetch user metrics:', error);
        return {
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0
        };
    }
};

export const getActivityChart = async (projectId = null) => {
    try {
        const params = {};
        if (projectId) params.project_id = projectId;
        const res = await api.get(`${API_URL}/activity-chart`, { params });
        return res.data;
    } catch (error) {
        console.error('Failed to fetch activity chart:', error);
        return [];
    }
};
