import axiosInstance from './axiosInstance';


export const analyticsApi = {
  getOverview: async (timeRange = '30d') => {
    const { data } = await axiosInstance.get(`/analytics/overview?timeRange=${timeRange}`);
    return data;
  },

  getLifeScoreAnalytics: async (timeRange = '30d') => {
    const { data } = await axiosInstance.get(`/analytics/life-score?timeRange=${timeRange}`);
    return data;
  },

  getMoodAnalytics: async (timeRange = '30d') => {
    const { data } = await axiosInstance.get(`/analytics/mood?timeRange=${timeRange}`);
    return data;
  },

  getHabitAnalytics: async (timeRange = '30d') => {
    const { data } = await axiosInstance.get(`/analytics/habits?timeRange=${timeRange}`);
    return data;
  },

  getProductivityAnalytics: async (timeRange = '30d') => {
    const { data } = await axiosInstance.get(`/analytics/productivity?timeRange=${timeRange}`);
    return data;
  },

  getSleepAnalytics: async (timeRange = '30d') => {
    const { data } = await axiosInstance.get(`/analytics/sleep?timeRange=${timeRange}`);
    return data;
  },

  getWaterAnalytics: async (timeRange = '30d') => {
    const { data } = await axiosInstance.get(`/analytics/water?timeRange=${timeRange}`);
    return data;
  },

  getGoalProgress: async () => {
    const { data } = await axiosInstance.get(`/analytics/goals`);
    return data;
  },

  getAchievements: async () => {
    const { data } = await axiosInstance.get(`/analytics/achievements`);
    return data;
  },

  getCorrelations: async (timeRange = '30d') => {
    const { data } = await axiosInstance.get(`/analytics/correlations?timeRange=${timeRange}&ai=true`);
    return data;
  },

  getTimeAnalysis: async (timeRange = '30d') => {
    const { data } = await axiosInstance.get(`/analytics/time-analysis?timeRange=${timeRange}&ai=true`);
    return data;
  }
};
