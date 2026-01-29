import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Courses
export const getCourses = async (publishedOnly = true) => {
  const response = await axios.get(`${API_URL}/courses`, {
    params: { published_only: publishedOnly }
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

// Workshops
export const getWorkshops = async (activeOnly = true) => {
  const response = await axios.get(`${API_URL}/workshops`, {
    params: { active_only: activeOnly }
  });
  return response.data;
};

// Admin APIs
export const getAdminStats = async () => {
  const response = await axios.get(`${API_URL}/admin/stats`, {
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
