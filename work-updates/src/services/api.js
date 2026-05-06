import axios from 'axios';

// ✅ YOUR SERVER IP + PORT
const API_BASE_URL = "/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
});

// 🔐 Attach token
api.interceptors.request.use(
    (config) => {
        const savedUser = localStorage.getItem('user_v2');
        if (savedUser) {
            const { token } = JSON.parse(savedUser);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 🔄 Auto-Refresh Logic
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const savedUser = localStorage.getItem('user_v2');
            if (savedUser) {
                const userData = JSON.parse(savedUser);
                const { refreshToken } = userData;

                if (refreshToken) {
                    try {
                        console.log("🔄 [AUTH] Access token expired. Attempting refresh...");
                        // Call refresh endpoint
                        const res = await axios.post(`${API_BASE_URL}/auth/refresh?refresh_token=${refreshToken}`);

                        if (res.status === 200) {
                            const { token: newToken } = res.data;

                            // Update storage
                            const updatedUser = { ...userData, token: newToken };
                            localStorage.setItem('user_v2', JSON.stringify(updatedUser));

                            // Update original request and retry
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return api(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error("❌ [AUTH] Refresh token failed/expired. Logging out.");
                        localStorage.removeItem('user_v2');
                        window.location.href = "/";
                        return Promise.reject(refreshError);
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
