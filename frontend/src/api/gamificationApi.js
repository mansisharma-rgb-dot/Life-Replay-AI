import axiosInstance from './axiosInstance';

export const gamificationApi = {
    getProfile: async () => {
        const response = await axiosInstance.get('/gamification/profile');
        return response.data;
    },
    
    getXpHistory: async (page = 1, perPage = 20) => {
        const response = await axiosInstance.get(`/gamification/xp-history?page=${page}&per_page=${perPage}`);
        return response.data;
    }
};
