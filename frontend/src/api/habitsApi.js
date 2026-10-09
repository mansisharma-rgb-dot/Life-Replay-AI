import axiosInstance from './axiosInstance';

export const habitsApi = {
  getHabits: async () => {
    const response = await axiosInstance.get('/habits/');
    return response.data;
  },

  getHabit: async (id) => {
    const response = await axiosInstance.get(`/habits/${id}`);
    return response.data;
  },

  createHabit: async (data) => {
    const response = await axiosInstance.post('/habits/', data);
    return response.data;
  },

  updateHabit: async (id, data) => {
    const response = await axiosInstance.put(`/habits/${id}`, data);
    return response.data;
  },

  recordCompletion: async (id, data) => {
    // data should contain { completed: boolean, date?: string }
    const response = await axiosInstance.post(`/habits/${id}/completion`, data);
    return response.data;
  },

  getHistory: async (id) => {
    const response = await axiosInstance.get(`/habits/${id}/history`);
    return response.data;
  }
};
