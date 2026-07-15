import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 10000
});

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            localStorage.removeItem('slbus_auth');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;