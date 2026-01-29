import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/Navbar';
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
          {/* Auth routes - no navbar */}
          <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} />
          <Route path="/signup" element={<AuthLayout><SignupPage /></AuthLayout>} />
          
          {/* Main routes - with navbar */}
          <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
          <Route path="/courses" element={<MainLayout><CoursesPage /></MainLayout>} />
          <Route path="/courses/:slug" element={<MainLayout><CourseDetailPage /></MainLayout>} />
          <Route path="/learn/:slug" element={<MainLayout><CourseLearningPage /></MainLayout>} />
          <Route path="/my-courses" element={<MainLayout><MyCoursesPage /></MainLayout>} />
          <Route path="/profile" element={<MainLayout><ProfilePage /></MainLayout>} />
          <Route path="/admin" element={<MainLayout><AdminDashboard /></MainLayout>} />
          <Route path="/trainer-dashboard" element={<MainLayout><TrainerDashboard /></MainLayout>} />
          <Route path="/labs" element={<MainLayout><LabsPage /></MainLayout>} />
          <Route path="/labs/:slug" element={<MainLayout><LabDetailPage /></MainLayout>} />
          <Route path="/open-source" element={<MainLayout><OpenSourcePage /></MainLayout>} />
          <Route path="/certificates/verify/:certificateNumber" element={<MainLayout><CertificateVerifyPage /></MainLayout>} />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
