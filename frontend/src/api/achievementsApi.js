import axiosInstance from './axiosInstance';

export const achievementsApi = {
    getAchievements: async () => {
        const response = await axiosInstance.get('/achievements/');
        return response.data;
    }
};
