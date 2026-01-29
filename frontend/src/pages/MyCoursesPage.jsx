import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getMyCourses } from '@/services/api';
import CourseCard from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen, GraduationCap, ArrowRight, Loader2 } from 'lucide-react';

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isAuthenticated) {
      const fetchCourses = async () => {
        try {
          const data = await getMyCourses();
          setCourses(data);
        } catch (error) {
          console.error('Failed to fetch courses:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCourses();
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-heading font-bold text-3xl mb-2" data-testid="my-courses-title">
            My Learning
          </h1>
          <p className="text-muted-foreground">
            Continue where you left off
          </p>
        </div>

        {/* Content */}
        {courses.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <GraduationCap className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-heading font-semibold text-2xl mb-3">
                No courses yet
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                You haven't enrolled in any courses yet. Explore our catalog to find 
                courses that match your learning goals.
              </p>
              <Button 
                className="rounded-full"
                onClick={() => navigate('/courses')}
                data-testid="browse-courses-btn"
              >
                Browse Courses
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <Card className="bg-white border-slate-100">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{courses.length}</p>
                    <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-100">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-100">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-orange-600">0%</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-sm text-muted-foreground">Avg. Progress</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Courses Grid */}
            <div>
              <h2 className="font-heading font-semibold text-xl mb-6">
                Continue Learning
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage;
