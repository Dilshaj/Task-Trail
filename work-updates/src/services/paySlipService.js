import api from './api';

export const generatePaySlip = async (data) => {
    const response = await api.post('pay-slips', data);
    return response.data;
};

export const getAllPaySlips = async (projectId = null) => {
    const response = await api.get('pay-slips', {
        params: { project_id: projectId }
    });
    return response.data;
};

export const getMyPaySlips = async (employeeId) => {
    const response = await api.get(`pay-slips/my/${employeeId}`);
    return response.data;
};

export const downloadPaySlip = async (id) => {
    try {
        const response = await api({
            url: `pay-slips/${id}/download`,
            method: 'GET',
            responseType: 'blob', // 🎯 CRITICAL: This is needed for PDF files
        });

        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;

        // Use a better filename if possible, or generic
        link.setAttribute('download', `PaySlip_${id}.pdf`);
        document.body.appendChild(link);
        link.click();

        // Clean up
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
};

export const downloadLatestPaySlip = async (employeeId) => {
    try {
        const response = await api({
            url: `pay-slips/latest/${employeeId}`,
            method: 'GET',
            responseType: 'blob',
        });

        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `PaySlip_${employeeId}_Latest.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
};

export const sendPaySlipEmail = async (id) => {
    const response = await api.post(`pay-slips/${id}/send-email`);
    return response.data;
};
