import axiosInstance from './axiosInstance';

export const skillsApi = {
    getSkills: async () => {
        const response = await axiosInstance.get('/skills/');
        return response.data;
    },
    addSkill: async (data) => {
        const response = await axiosInstance.post('/skills/', data);
        return response.data;
    },
    updateSkill: async (id, data) => {
        const response = await axiosInstance.put(`/skills/${id}`, data);
        return response.data;
    },
    deleteSkill: async (id) => {
        const response = await axiosInstance.delete(`/skills/${id}`);
        return response.data;
    }
};
