import axiosInstance from './axiosInstance';

export const searchApi = {
    search: async (query) => {
        if (!query || query.length < 2) return null;
        const response = await axiosInstance.get(`/search/?q=${encodeURIComponent(query)}`);
        return response.data.results;
    }
};
