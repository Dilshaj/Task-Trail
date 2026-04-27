import api from './api';
const API_URL = 'employee';

export const applyLeave = async (leaveData) => {
    try {
        const response = await api.post(`${API_URL}/apply-leave`, leaveData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Failed to submit leave request');
    }
};

export const getMyLeaves = async (employeeId) => {
    try {
        const response = await api.get(`${API_URL}/my-leaves/${employeeId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to fetch user leaves:', error);
        return [];
    }
};

export const getAllLeaves = async (projectId = null) => {
    try {
        const params = {};
        if (projectId) params.project_id = projectId;
        const response = await api.get(`${API_URL}/all-leaves`, { params });
        return response.data;
    } catch (error) {
        console.error('Failed to fetch all leaves:', error);
        return [];
    }
};

export const updateLeaveStatus = async (leaveId, status) => {
    try {
        const response = await api.patch(`${API_URL}/update-status/${leaveId}?status=${status}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Failed to update leave status');
    }
};
