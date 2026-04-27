import api from './api';
const API_URL = 'auth';

export const login = async (email, employeeId, password) => {
    try {
        const payload = {};
        if (email) payload.email = email;
        if (employeeId) payload.employee_id = employeeId;
        payload.password = password;

        const response = await api.post(`${API_URL}/login`, payload);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Invalid credentials');
    }
};

export const changePassword = async (token, newPassword) => {
    try {
        const response = await api.post(
            `${API_URL}/change-password`,
            { newPassword }
        );
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Failed to change password');
    }
};
