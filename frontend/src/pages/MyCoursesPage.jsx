import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getMyCourses, getMyCertificates } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, GraduationCap, ArrowRight, Loader2, 
  Play, Trophy, Award, CheckCircle 
} from 'lucide-react';

const MyCoursesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const [coursesData, certsData] = await Promise.all([
            getMyCourses(),
            getMyCertificates()
          ]);
          setCourses(coursesData);
          setCertificates(certsData);
        } catch (error) {
          console.error('Failed to fetch data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [isAuthenticated, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedCourses = courses.filter(c => c.completed);
  const inProgressCourses = courses.filter(c => !c.completed);
  const avgProgress = courses.length > 0 
    ? Math.round(courses.reduce((acc, c) => acc + (c.progress || 0), 0) / courses.length)
    : 0;

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
            <div className="grid sm:grid-cols-4 gap-4 mb-10">
              <Card className="bg-white border-slate-100">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{courses.length}</p>
                    <p className="text-sm text-muted-foreground">Enrolled</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-100">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{completedCourses.length}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-100">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{certificates.length}</p>
                    <p className="text-sm text-muted-foreground">Certificates</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-slate-100">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                    <span className="text-lg font-bold text-secondary-foreground">{avgProgress}%</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-sm text-muted-foreground">Avg. Progress</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="courses">
                  In Progress ({inProgressCourses.length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completed ({completedCourses.length})
                </TabsTrigger>
                <TabsTrigger value="certificates">
                  Certificates ({certificates.length})
                </TabsTrigger>
              </TabsList>

              {/* In Progress Courses */}
              <TabsContent value="courses">
                {inProgressCourses.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No courses in progress</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inProgressCourses.map((course) => (
                      <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-40 object-cover"
                        />
                        <CardContent className="p-5">
                          <Badge variant="outline" className="mb-2">{course.category}</Badge>
                          <h3 className="font-semibold mb-2 line-clamp-2">{course.title}</h3>
                          
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{course.progress || 0}%</span>
                            </div>
                            <Progress value={course.progress || 0} className="h-2" />
                          </div>
                          
                          <Button 
                            className="w-full" 
                            onClick={() => navigate(`/learn/${course.slug}`)}
                            data-testid={`continue-course-${course.id}`}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Continue Learning
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Completed Courses */}
              <TabsContent value="completed">
                {completedCourses.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">No completed courses yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedCourses.map((course) => (
                      <Card key={course.id} className="overflow-hidden">
                        <div className="relative">
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-40 object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-5">
                          <Badge variant="outline" className="mb-2">{course.category}</Badge>
                          <h3 className="font-semibold mb-4 line-clamp-2">{course.title}</h3>
                          
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => navigate(`/learn/${course.slug}`)}
                          >
                            Review Course
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Certificates */}
              <TabsContent value="certificates">
                {certificates.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Complete courses to earn certificates
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {certificates.map((cert) => (
                      <Card key={cert.id} className="overflow-hidden">
                        <CardContent className="p-6 text-center">
                          <Award className="w-12 h-12 mx-auto text-primary mb-4" />
                          <h3 className="font-semibold mb-2">{cert.course_title}</h3>
                          <p className="text-sm text-muted-foreground mb-1">
                            Issued: {new Date(cert.issued_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground mb-4">
                            ID: {cert.certificate_number}
                          </p>
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <Link to={`/certificates/verify/${cert.certificate_number}`}>
                              View Certificate
                            </Link>
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
};

export default MyCoursesPage;
