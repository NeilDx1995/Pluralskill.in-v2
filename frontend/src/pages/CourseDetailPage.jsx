import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getCourseBySlug, enrollInCourse } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Clock, Users, BookOpen, Award, ArrowLeft, 
  CheckCircle, Play, Loader2, GraduationCap 
} from 'lucide-react';
import { toast } from 'sonner';

const CourseDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, updateUser } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const data = await getCourseBySlug(slug);
        setCourse(data);
      } catch (error) {
        console.error('Failed to fetch course:', error);
        if (error.response?.status === 404) {
          navigate('/courses');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [slug, navigate]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      await enrollInCourse(course.id);
      setCourse({ ...course, is_enrolled: true });
      updateUser({ 
        enrolled_courses: [...(user.enrolled_courses || []), course.id] 
      });
      toast.success('Successfully enrolled in the course!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to enroll');
    } finally {
      setEnrolling(false);
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Course not found</h1>
        <Button onClick={() => navigate('/courses')}>Browse Courses</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link 
            to="/courses" 
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
            data-testid="back-to-courses"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Link>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={getLevelColor(course.level)}>
                  {course.level}
                </Badge>
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {course.category}
                </Badge>
              </div>
              
              <h1 className="font-heading font-bold text-3xl sm:text-4xl" data-testid="course-title">
                {course.title}
              </h1>
              
              <p className="text-slate-300 text-lg leading-relaxed">
                {course.short_description}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
                <span className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  {course.duration_hours} hours
                </span>
                <span className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {course.modules?.length || 0} modules
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  {course.enrolled_count?.toLocaleString()} enrolled
                </span>
              </div>
            </div>
            
            {/* Enrollment Card */}
            <div className="lg:row-start-1">
              <Card className="sticky top-24 overflow-hidden">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-6 space-y-6">
                  <div className="text-center">
                    {course.price > 0 ? (
                      <p className="text-3xl font-bold">${course.price}</p>
                    ) : (
                      <p className="text-3xl font-bold text-green-600">Free</p>
                    )}
                  </div>
                  
                  {course.is_enrolled ? (
                    <Button 
                      className="w-full h-12 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      onClick={() => navigate('/my-courses')}
                      data-testid="go-to-my-courses"
                    >
                      <GraduationCap className="mr-2 w-5 h-5" />
                      Go to My Courses
                    </Button>
                  ) : (
                    <Button 
                      className="w-full h-12 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                      onClick={handleEnroll}
                      disabled={enrolling}
                      data-testid="enroll-button"
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 w-5 h-5" />
                          Enroll Now
                        </>
                      )}
                    </Button>
                  )}
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Full lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Certificate of completion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Hands-on projects</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <section>
              <h2 className="font-heading font-semibold text-2xl mb-4">About This Course</h2>
              <p className="text-muted-foreground leading-relaxed">
                {course.description}
              </p>
            </section>

            {/* Syllabus */}
            {course.modules?.length > 0 && (
              <section>
                <h2 className="font-heading font-semibold text-2xl mb-6">Course Syllabus</h2>
                <Accordion type="single" collapsible className="space-y-3">
                  {course.modules.map((module, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`module-${index}`}
                      className="bg-white border rounded-xl px-6"
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-4 text-left">
                          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{module.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {module.duration_minutes} min
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pl-12">
                        <p className="text-muted-foreground">{module.description}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </div>

          {/* Sidebar (Desktop Placeholder) */}
          <div className="hidden lg:block" />
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
