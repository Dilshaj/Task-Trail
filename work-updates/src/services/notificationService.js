import api from './api';

const API_URL = 'notifications';

export const getNotifications = async () => {
    try {
        const response = await api.get(`${API_URL}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

export const markAsRead = async (notificationId) => {
    try {
        const response = await api.patch(`${API_URL}/${notificationId}/read`);
        return response.data;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        throw error;
    }
};
