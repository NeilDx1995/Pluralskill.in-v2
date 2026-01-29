import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/Navbar';
import ProtectedRoute from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import CoursesPage from '@/pages/CoursesPage';
import CourseDetailPage from '@/pages/CourseDetailPage';
import CourseLearningPage from '@/pages/CourseLearningPage';
import MyCoursesPage from '@/pages/MyCoursesPage';
import ProfilePage from '@/pages/ProfilePage';
import AdminDashboard from '@/pages/AdminDashboard';
import TrainerDashboard from '@/pages/TrainerDashboard';
import LabsPage from '@/pages/LabsPage';
import LabDetailPage from '@/pages/LabDetailPage';
import LabPracticePage from '@/pages/LabPracticePage';
import OpenSourcePage from '@/pages/OpenSourcePage';
import CertificateVerifyPage from '@/pages/CertificateVerifyPage';
import '@/App.css';

// Layout wrapper with Navbar
const MainLayout = ({ children }) => (
  <>
    <Navbar />
    <main>{children}</main>
  </>
);

// Auth pages without Navbar
const AuthLayout = ({ children }) => (
  <main>{children}</main>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes - no auth required */}
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />
          <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
          <Route path="/certificates/verify/:certificateNumber" element={<MainLayout><CertificateVerifyPage /></MainLayout>} />
          
          {/* Protected routes - require login */}
          <Route path="/courses" element={
            <ProtectedRoute>
              <MainLayout><CoursesPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/courses/:slug" element={
            <ProtectedRoute>
              <MainLayout><CourseDetailPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/learn/:slug" element={
            <ProtectedRoute>
              <MainLayout><CourseLearningPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/my-courses" element={
            <ProtectedRoute>
              <MainLayout><MyCoursesPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <MainLayout><ProfilePage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/labs" element={
            <ProtectedRoute>
              <MainLayout><LabsPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/labs/:slug" element={
            <ProtectedRoute>
              <MainLayout><LabDetailPage /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/labs/:slug/practice" element={
            <ProtectedRoute>
              <LabPracticePage />
            </ProtectedRoute>
          } />
          <Route path="/open-source" element={
            <ProtectedRoute>
              <MainLayout><OpenSourcePage /></MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Role-protected routes */}
          <Route path="/trainer-dashboard" element={
            <ProtectedRoute requiredRole="trainer">
              <MainLayout><TrainerDashboard /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <MainLayout><AdminDashboard /></MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
