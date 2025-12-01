import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and we have a refresh token, try to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { token } = response.data;

          // Save new token
          localStorage.setItem('token', token);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============ Authentication ============

export const registerUser = async (email, password, fullName, company = '') => {
  try {
    const response = await api.post('/auth/register', {
      email,
      password,
      fullName,
      company,
    });
    return response.data;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Error logging out:', error);
  } finally {
    // Always clear tokens, even if logout request fails
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
};

export const refreshAccessToken = async (refreshToken) => {
  try {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

// ============ User Management ============

// User management
export const createUserSession = async () => {
  try {
    const response = await api.post('/users');
    return response.data;
  } catch (error) {
    console.error('Error creating user session:', error);
    throw error;
  }
};

// Valuation
export const submitValuation = async (userId, inputData) => {
  try {
    const response = await api.post('/valuate', {
      userId,
      inputData,
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting valuation:', error);
    throw error;
  }
};

export const getValuation = async (valuationId) => {
  try {
    const response = await api.get(`/valuations/${valuationId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching valuation:', error);
    throw error;
  }
};

export const updateValuation = async (valuationId, inputData) => {
  try {
    const response = await api.put(`/valuations/${valuationId}`, {
      inputData,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating valuation:', error);
    throw error;
  }
};

export const markImprovementAsCompleted = async (valuationId, improvementKey) => {
  try {
    const response = await api.post(
      `/valuations/${valuationId}/improvements/${improvementKey}`
    );
    return response.data;
  } catch (error) {
    console.error('Error marking improvement as completed:', error);
    throw error;
  }
};

export const getUserValuations = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}/valuations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user valuations:', error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Error checking API health:', error);
    throw error;
  }
};

// ============ VAC (Value Acceleration Calculator) ============

export const calculateVAC = async (data) => {
  try {
    const response = await api.post('/vac/calculate', data);
    return response.data;
  } catch (error) {
    console.error('Error calculating VAC:', error);
    throw error;
  }
};

export const calculateRiskScore = async (answers) => {
  try {
    const response = await api.post('/vac/risk-score', answers);
    return response.data;
  } catch (error) {
    console.error('Error calculating risk score:', error);
    throw error;
  }
};

export const calculateEBITDA = async (data) => {
  try {
    const response = await api.post('/vac/ebitda', data);
    return response.data;
  } catch (error) {
    console.error('Error calculating EBITDA:', error);
    throw error;
  }
};

export const calculateValuation = async (data) => {
  try {
    const response = await api.post('/vac/valuation', data);
    return response.data;
  } catch (error) {
    console.error('Error calculating valuation:', error);
    throw error;
  }
};

export const calculateValueAcceleration = async (data) => {
  try {
    const response = await api.post('/vac/value-acceleration', data);
    return response.data;
  } catch (error) {
    console.error('Error calculating value acceleration:', error);
    throw error;
  }
};

export const calculateProbability = async (data) => {
  try {
    const response = await api.post('/vac/probability', data);
    return response.data;
  } catch (error) {
    console.error('Error calculating probability:', error);
    throw error;
  }
};

export const calculateWealthGap = async (data) => {
  try {
    const response = await api.post('/vac/wealth-gap', data);
    return response.data;
  } catch (error) {
    console.error('Error calculating wealth gap:', error);
    throw error;
  }
};

export const searchIndustries = async (query, limit = 20) => {
  try {
    const response = await api.get('/vac/industries', { params: { q: query, limit } });
    return response.data;
  } catch (error) {
    console.error('Error searching industries:', error);
    throw error;
  }
};

export const getIndustryByCode = async (code) => {
  try {
    const response = await api.get(`/vac/industries/${code}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching industry:', error);
    throw error;
  }
};

export const getIndustryMultiples = async () => {
  try {
    const response = await api.get('/vac/industry-multiples');
    return response.data;
  } catch (error) {
    console.error('Error fetching industry multiples:', error);
    throw error;
  }
};

export const getCommonMultiples = async () => {
  try {
    const response = await api.get('/vac/multiples');
    return response.data;
  } catch (error) {
    console.error('Error fetching common multiples:', error);
    throw error;
  }
};

export const getRiskCategories = async () => {
  try {
    const response = await api.get('/vac/risk-categories');
    return response.data;
  } catch (error) {
    console.error('Error fetching risk categories:', error);
    throw error;
  }
};

// ============ Business Management ============

export const getBusinesses = async () => {
  try {
    const response = await api.get('/businesses');
    return response.data;
  } catch (error) {
    console.error('Error fetching businesses:', error);
    throw error;
  }
};

export const getBusiness = async (businessId) => {
  try {
    const response = await api.get(`/businesses/${businessId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching business:', error);
    throw error;
  }
};

export const createBusiness = async (data) => {
  try {
    const response = await api.post('/businesses', data);
    return response.data;
  } catch (error) {
    console.error('Error creating business:', error);
    throw error;
  }
};

export const updateBusiness = async (businessId, data) => {
  try {
    const response = await api.put(`/businesses/${businessId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating business:', error);
    throw error;
  }
};

export const deleteBusiness = async (businessId) => {
  try {
    const response = await api.delete(`/businesses/${businessId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting business:', error);
    throw error;
  }
};

// ============ Engagement Management ============

export const getEngagements = async () => {
  try {
    const response = await api.get('/engagements');
    return response.data;
  } catch (error) {
    console.error('Error fetching engagements:', error);
    throw error;
  }
};

export const getEngagement = async (engagementId) => {
  try {
    const response = await api.get(`/engagements/${engagementId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching engagement:', error);
    throw error;
  }
};

export const createEngagement = async (businessId, data) => {
  try {
    const response = await api.post(`/businesses/${businessId}/engagements`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating engagement:', error);
    throw error;
  }
};

export const updateEngagement = async (engagementId, data) => {
  try {
    const response = await api.put(`/engagements/${engagementId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating engagement:', error);
    throw error;
  }
};

// ============ Document Management ============

export const getDocumentTypes = async () => {
  try {
    const response = await api.get('/documents/types');
    return response.data;
  } catch (error) {
    console.error('Error fetching document types:', error);
    throw error;
  }
};

export const uploadDocuments = async (engagementId, documentType, files, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('documentType', documentType);

    // Add each file to FormData
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post(
      `/engagements/${engagementId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading documents:', error);
    throw error;
  }
};

export const getEngagementDocuments = async (engagementId) => {
  try {
    const response = await api.get(`/engagements/${engagementId}/documents`);
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const getDocumentChecklist = async (engagementId) => {
  try {
    const response = await api.get(`/engagements/${engagementId}/documents/checklist`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document checklist:', error);
    throw error;
  }
};

export const getDocument = async (documentId) => {
  try {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

export const downloadDocument = async (documentId) => {
  try {
    const response = await api.get(`/documents/${documentId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};

export const updateDocumentStatus = async (documentId, status, advisorNotes = '') => {
  try {
    const response = await api.put(`/documents/${documentId}/status`, {
      status,
      advisorNotes,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating document status:', error);
    throw error;
  }
};

export const deleteDocument = async (documentId) => {
  try {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// ============ Business Portal (Public - uses access token) ============

// Create a separate axios instance for business portal (no auth token required)
const businessPortalApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getBusinessPortalData = async (accessToken) => {
  try {
    const response = await businessPortalApi.get(`/business-portal/${accessToken}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching business portal data:', error);
    throw error;
  }
};

export const saveQuestionnaireResponses = async (accessToken, responses, sectionId = null) => {
  try {
    const response = await businessPortalApi.post(`/business-portal/${accessToken}/responses`, {
      responses,
      sectionId
    });
    return response.data;
  } catch (error) {
    console.error('Error saving questionnaire responses:', error);
    throw error;
  }
};

export const submitQuestionnaire = async (accessToken) => {
  try {
    const response = await businessPortalApi.post(`/business-portal/${accessToken}/submit`);
    return response.data;
  } catch (error) {
    console.error('Error submitting questionnaire:', error);
    throw error;
  }
};

export const getBusinessPortalReports = async (accessToken) => {
  try {
    const response = await businessPortalApi.get(`/business-portal/${accessToken}/reports`);
    return response.data;
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const uploadBusinessPortalDocument = async (accessToken, engagementId, documentType, files, onProgress) => {
  try {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('accessToken', accessToken);

    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await businessPortalApi.post(
      `/engagements/${engagementId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

// ============ Admin Dashboard API ============

export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};

export const getAdminOverview = async () => {
  try {
    const response = await api.get('/admin/overview');
    return response.data;
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    throw error;
  }
};

export const getAdvisors = async (search = '', status = '') => {
  try {
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    const response = await api.get('/admin/advisors', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching advisors:', error);
    throw error;
  }
};

export const createAdvisor = async (data) => {
  try {
    const response = await api.post('/admin/advisors', data);
    return response.data;
  } catch (error) {
    console.error('Error creating advisor:', error);
    throw error;
  }
};

export const updateAdvisor = async (advisorId, data) => {
  try {
    const response = await api.put(`/admin/advisors/${advisorId}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating advisor:', error);
    throw error;
  }
};

export const deactivateAdvisor = async (advisorId) => {
  try {
    const response = await api.delete(`/admin/advisors/${advisorId}`);
    return response.data;
  } catch (error) {
    console.error('Error deactivating advisor:', error);
    throw error;
  }
};

export const getAdminBusinesses = async (search = '', advisorId = '') => {
  try {
    const params = {};
    if (search) params.search = search;
    if (advisorId) params.advisorId = advisorId;
    const response = await api.get('/admin/businesses', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching businesses:', error);
    throw error;
  }
};

export const getAdminBusinessDetail = async (businessId) => {
  try {
    const response = await api.get(`/admin/businesses/${businessId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching business detail:', error);
    throw error;
  }
};

export const getAdminEngagements = async (search = '', status = '', engagementType = '') => {
  try {
    const params = {};
    if (search) params.search = search;
    if (status) params.status = status;
    if (engagementType) params.engagementType = engagementType;
    const response = await api.get('/admin/engagements', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching engagements:', error);
    throw error;
  }
};

export const getAdminActivityLog = async (limit = 50, offset = 0) => {
  try {
    const response = await api.get('/admin/activity', { params: { limit, offset } });
    return response.data;
  } catch (error) {
    console.error('Error fetching activity log:', error);
    throw error;
  }
};

// ============ Industry Multiples Management ============

export const getIndustryMultiples = async (search = '') => {
  try {
    const params = {};
    if (search) params.search = search;
    const response = await api.get('/admin/industry-multiples', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching industry multiples:', error);
    throw error;
  }
};

export const getIndustryMultiple = async (id) => {
  try {
    const response = await api.get(`/admin/industry-multiples/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching industry multiple:', error);
    throw error;
  }
};

export const createIndustryMultiple = async (data) => {
  try {
    const response = await api.post('/admin/industry-multiples', data);
    return response.data;
  } catch (error) {
    console.error('Error creating industry multiple:', error);
    throw error;
  }
};

export const updateIndustryMultiple = async (id, data) => {
  try {
    const response = await api.put(`/admin/industry-multiples/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating industry multiple:', error);
    throw error;
  }
};

export const deleteIndustryMultiple = async (id) => {
  try {
    const response = await api.delete(`/admin/industry-multiples/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting industry multiple:', error);
    throw error;
  }
};

export const bulkImportIndustryMultiples = async (multiples) => {
  try {
    const response = await api.post('/admin/industry-multiples/bulk', { multiples });
    return response.data;
  } catch (error) {
    console.error('Error bulk importing industry multiples:', error);
    throw error;
  }
};

export const toggleAdvisorStatus = async (advisorId, status) => {
  try {
    const response = await api.put(`/admin/advisors/${advisorId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error toggling advisor status:', error);
    throw error;
  }
};
