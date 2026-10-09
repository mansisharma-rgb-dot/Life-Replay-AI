import axiosInstance from './axiosInstance';

export const aiApi = {
  getOverview: (timeRange = '30d') => {
    return axiosInstance.get(`/ai/overview?timeRange=${timeRange}`);
  },
  
  getInsights: (timeRange = '30d') => {
    return axiosInstance.get(`/ai/insights?timeRange=${timeRange}`);
  },
  
  getRecommendations: (timeRange = '30d') => {
    return axiosInstance.get(`/ai/recommendations?timeRange=${timeRange}`);
  },
  
  getReplay: (query) => {
    return axiosInstance.post('/ai/replay', { query });
  }
};
