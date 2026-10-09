import axiosInstance from './axiosInstance';

export const goalsApi = {
  getGoals: async () => {
    const response = await axiosInstance.get('/goals/');
    return response.data;
  },

  getGoal: async (id) => {
    const response = await axiosInstance.get(`/goals/${id}`);
    return response.data;
  },

  createGoal: async (data) => {
    const response = await axiosInstance.post('/goals/', data);
    return response.data;
  },

  updateGoal: async (id, data) => {
    const response = await axiosInstance.put(`/goals/${id}`, data);
    return response.data;
  },

  getGoalPredictions: async (range = '30d') => {
    const { data } = await axiosInstance.get(`/goals/predictions?range=${range}`);
    return data;
  },

  deleteGoal: async (id) => {
    const response = await axiosInstance.delete(`/goals/${id}`);
    return response.data;
  }
};
