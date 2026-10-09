import axiosInstance from './axiosInstance';

export const timelineApi = {
    getTimeline: async (page = 1, perPage = 50) => {
        const response = await axiosInstance.get(`/timeline/?page=${page}&per_page=${perPage}`);
        return response.data;
    }
};
