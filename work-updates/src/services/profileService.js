import api from './api';
const API_URL = 'employee';

export const updateProfile = async (formData) => {
    try {
        const response = await api.put(`${API_URL}/update-profile`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Failed to update profile');
    }
};

export const getProfile = async (userId) => {
    try {
        const response = await api.get(`${API_URL}/profile/${userId}`);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.detail || 'Failed to fetch profile');
    }
};
