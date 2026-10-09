import axiosInstance from './axiosInstance';

export const documentsApi = {
    getDocuments: async () => {
        const response = await axiosInstance.get('/documents/');
        return response.data;
    },
    
    uploadDocument: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axiosInstance.post('/documents/', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    
    getDocument: async (docId) => {
        const response = await axiosInstance.get(`/documents/${docId}`);
        return response.data;
    },

    deleteDocument: async (docId) => {
        const response = await axiosInstance.delete(`/documents/${docId}`);
        return response.data;
    }
};
