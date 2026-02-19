import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Auth
export const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, { email, password });
  return response.data;
};

export const signup = async (email, password, firstName, lastName) => {
  const response = await axios.post(`${API_URL}/auth/signup`, {
    email,
    password,
    first_name: firstName,
    last_name: lastName
  });
  return response.data;
};

export const refreshToken = async () => {
  const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await axios.post(`${API_URL}/auth/reset-password`, { token, password });
  return response.data;
};

// Workshops
export const getWorkshops = async ({ activeOnly = true, search, page = 1, limit = 12 } = {}) => {
  const response = await axios.get(`${API_URL}/workshops`, {
    params: { active_only: activeOnly, search, page, limit },
    headers: getAuthHeader()
  });
  return response.data;
};

export const getWorkshop = async (workshopId) => {
  const response = await axios.get(`${API_URL}/workshops/${workshopId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const registerForWorkshop = async (workshopId) => {
  const response = await axios.post(
    `${API_URL}/workshops/${workshopId}/register`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};

// Courses
export const getCourses = async ({ publishedOnly = true, search, category, level, page = 1, limit = 12 } = {}) => {
  const response = await axios.get(`${API_URL}/courses`, {
    params: { published_only: publishedOnly, search, category, level, page, limit },
    headers: getAuthHeader()
  });
  return response.data;
};

export const getCourseBySlug = async (slug) => {
  const response = await axios.get(`${API_URL}/courses/${slug}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const enrollInCourse = async (courseId) => {
  const response = await axios.post(
    `${API_URL}/courses/enroll`,
    { course_id: courseId },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const getMyCourses = async () => {
  const response = await axios.get(`${API_URL}/my-courses`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Open Source Learning Paths
export const getLearningPaths = async () => {
  const response = await axios.get(`${API_URL}/open-source/paths`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getLearningPath = async (pathId) => {
  const response = await axios.get(`${API_URL}/open-source/paths/${pathId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const generateLearningPath = async (skillName, industry, currentLevel = 'beginner') => {
  const response = await axios.post(
    `${API_URL}/open-source/generate`,
    { skill_name: skillName, industry, current_level: currentLevel },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const deleteLearningPath = async (pathId) => {
  const response = await axios.delete(`${API_URL}/open-source/paths/${pathId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Labs
export const getLabs = async ({ publishedOnly = true, search, difficulty, page = 1, limit = 12 } = {}) => {
  const response = await axios.get(`${API_URL}/labs`, {
    params: { published_only: publishedOnly, search, difficulty, page, limit },
    headers: getAuthHeader()
  });
  return response.data;
};

export const getLabBySlug = async (slug) => {
  const response = await axios.get(`${API_URL}/labs/${slug}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const startLab = async (labId) => {
  const response = await axios.post(
    `${API_URL}/labs/${labId}/start`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const executeLabCode = async (labId, stepId, code, executionType = 'terminal') => {
  const response = await axios.post(
    `${API_URL}/labs/execute`,
    { lab_id: labId, step_id: stepId, code, execution_type: executionType },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const saveLabProgress = async (labId, stepId) => {
  const response = await axios.post(
    `${API_URL}/labs/${labId}/save-progress`,
    null,
    { params: { step_id: stepId }, headers: getAuthHeader() }
  );
  return response.data;
};

export const getLabProgress = async (labId) => {
  const response = await axios.get(`${API_URL}/labs/${labId}/progress`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const completeLab = async (labId) => {
  const response = await axios.post(
    `${API_URL}/labs/${labId}/complete`,
    {},
    { headers: getAuthHeader() }
  );
  return response.data;
};

// User Profile
export const getProfile = async () => {
  const response = await axios.get(`${API_URL}/users/profile`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await axios.put(`${API_URL}/users/profile`, data, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await axios.put(
    `${API_URL}/auth/password`,
    { current_password: currentPassword, new_password: newPassword },
    { headers: getAuthHeader() }
  );
  return response.data;
};

// ============== PROGRESS TRACKING APIs ==============

export const getCourseProgress = async (courseId) => {
  const response = await axios.get(`${API_URL}/progress/${courseId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const markModuleComplete = async (courseId, moduleId, timeSpentMinutes = 0) => {
  const response = await axios.post(
    `${API_URL}/progress/module/complete`,
    { course_id: courseId, module_id: moduleId, time_spent_minutes: timeSpentMinutes },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const submitQuiz = async (courseId, answers) => {
  const response = await axios.post(
    `${API_URL}/progress/quiz/submit`,
    { course_id: courseId, answers },
    { headers: getAuthHeader() }
  );
  return response.data;
};

// ============== FILE UPLOAD APIs ==============

export const uploadImage = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_URL}/upload/image`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });
  return response.data;
};

export const uploadVideo = async (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_URL}/upload/video`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    }
  });
  return response.data;
};

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${API_URL}/upload/document`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// ============== ASSIGNMENT APIs ==============

export const getCourseAssignments = async (courseId) => {
  const response = await axios.get(`${API_URL}/courses/${courseId}/assignments`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createAssignment = async (data) => {
  const response = await axios.post(`${API_URL}/assignments`, data, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteAssignment = async (assignmentId) => {
  const response = await axios.delete(`${API_URL}/assignments/${assignmentId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const submitAssignment = async (assignmentId, file, notes = '') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('notes', notes);

  const response = await axios.post(`${API_URL}/assignments/${assignmentId}/submit`, formData, {
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const getAssignmentSubmissions = async (assignmentId) => {
  const response = await axios.get(`${API_URL}/assignments/${assignmentId}/submissions`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const gradeSubmission = async (submissionId, grade, feedback = '') => {
  const response = await axios.put(
    `${API_URL}/submissions/${submissionId}/grade`,
    { grade, feedback },
    { headers: getAuthHeader() }
  );
  return response.data;
};

// ============== CERTIFICATE APIs ==============

export const getMyCertificates = async () => {
  const response = await axios.get(`${API_URL}/certificates`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getCertificate = async (certificateId) => {
  const response = await axios.get(`${API_URL}/certificates/${certificateId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const verifyCertificate = async (certificateNumber) => {
  const response = await axios.get(`${API_URL}/certificates/verify/${certificateNumber}`);
  return response.data;
};

// ============== TRAINER APIs ==============

export const getTrainerCourses = async () => {
  const response = await axios.get(`${API_URL}/trainer/courses`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createTrainerCourse = async (courseData) => {
  const response = await axios.post(`${API_URL}/trainer/courses`, courseData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateTrainerCourse = async (courseId, courseData) => {
  const response = await axios.put(`${API_URL}/trainer/courses/${courseId}`, courseData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteTrainerCourse = async (courseId) => {
  const response = await axios.delete(`${API_URL}/trainer/courses/${courseId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getTrainerLabs = async () => {
  const response = await axios.get(`${API_URL}/trainer/labs`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createTrainerLab = async (labData) => {
  const response = await axios.post(`${API_URL}/trainer/labs`, labData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateTrainerLab = async (labId, labData) => {
  const response = await axios.put(`${API_URL}/trainer/labs/${labId}`, labData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteTrainerLab = async (labId) => {
  const response = await axios.delete(`${API_URL}/trainer/labs/${labId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createTrainerWorkshop = async (workshopData) => {
  const response = await axios.post(`${API_URL}/trainer/workshops`, workshopData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateTrainerWorkshop = async (workshopId, workshopData) => {
  const response = await axios.put(`${API_URL}/trainer/workshops/${workshopId}`, workshopData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteTrainerWorkshop = async (workshopId) => {
  const response = await axios.delete(`${API_URL}/trainer/workshops/${workshopId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// ============== ADMIN APIs ==============

export const getAdminStats = async () => {
  const response = await axios.get(`${API_URL}/admin/stats`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getAdminAnalytics = async () => {
  const response = await axios.get(`${API_URL}/admin/analytics`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await axios.get(`${API_URL}/admin/users`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateUserRole = async (userId, role) => {
  const response = await axios.put(`${API_URL}/admin/users/${userId}/role`, { role }, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getAdminCourses = async () => {
  const response = await axios.get(`${API_URL}/admin/courses`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createCourse = async (courseData) => {
  const response = await axios.post(`${API_URL}/admin/courses`, courseData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateCourse = async (courseId, courseData) => {
  const response = await axios.put(`${API_URL}/admin/courses/${courseId}`, courseData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteCourse = async (courseId) => {
  const response = await axios.delete(`${API_URL}/admin/courses/${courseId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getAdminWorkshops = async () => {
  const response = await axios.get(`${API_URL}/admin/workshops`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createWorkshop = async (workshopData) => {
  const response = await axios.post(`${API_URL}/admin/workshops`, workshopData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteWorkshop = async (workshopId) => {
  const response = await axios.delete(`${API_URL}/admin/workshops/${workshopId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const getAdminLabs = async () => {
  const response = await axios.get(`${API_URL}/admin/labs`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const createLab = async (labData) => {
  const response = await axios.post(`${API_URL}/admin/labs`, labData, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const deleteLab = async (labId) => {
  const response = await axios.delete(`${API_URL}/admin/labs/${labId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const adminDeleteLearningPath = async (pathId) => {
  const response = await axios.delete(`${API_URL}/admin/open-source/paths/${pathId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};


// Public paths that should NOT redirect to login on 401
const PUBLIC_PATHS = ['/courses', '/workshops', '/labs', '/open-source', '/certificates/verify'];

// Interceptor to handle 401s (Token Expired)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const requestUrl = error.config?.url || '';
      const isPublicRequest = PUBLIC_PATHS.some(p => requestUrl.includes(p));

      if (!isPublicRequest) {
        // Only clear token and redirect for auth-required requests
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login')) {
          const currentPath = window.location.pathname + window.location.search;
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    return Promise.reject(error);
  }
);
