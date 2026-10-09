import axiosInstance from './axiosInstance';

export const journalsApi = {
  getJournals: async (page = 1, perPage = 20) => {
    const response = await axiosInstance.get(`/journals/?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  getJournal: async (id) => {
    const response = await axiosInstance.get(`/journals/${id}`);
    return response.data;
  },

  updateJournal: async (id, data) => {
    const response = await axiosInstance.put(`/journals/${id}`, data);
    return response.data;
  }
};
