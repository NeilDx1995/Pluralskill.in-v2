import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getCourses, getWorkshops } from '@/services/api';
import CourseCard from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, GraduationCap, Users, BookOpen, Award, 
  Calendar, Clock, Sparkles, Target, Zap, CheckCircle2
} from 'lucide-react';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, workshopsData] = await Promise.all([
          getCourses(),
          getWorkshops()
        ]);
        setCourses(coursesData);
        setWorkshops(workshopsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isAuthenticated) {
    return <LoggedInDashboard user={user} courses={courses} workshops={workshops} loading={loading} />;
  }

  return <MarketingHomePage courses={courses} workshops={workshops} loading={loading} />;
};

const MarketingHomePage = ({ courses, workshops, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-lime-50 py-20 lg:py-32">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM0MzM4Y2EiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge className="bg-secondary text-secondary-foreground px-4 py-1.5 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                Learn skills that matter
              </Badge>
              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-foreground">
                Master <span className="text-primary">Job-Ready</span> Skills
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                Transform your career with hands-on courses, expert workshops, and virtual labs designed for the modern workforce.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105"
                  onClick={() => navigate('/signup')}
                  data-testid="hero-get-started"
                >
                  Start Learning Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="rounded-full"
                  onClick={() => navigate('/courses')}
                  data-testid="hero-explore"
                >
                  Explore Courses
                </Button>
              </div>
              <div className="flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="font-semibold">10K+</span>
                  <span className="text-muted-foreground">Learners</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <span className="font-semibold">50+</span>
                  <span className="text-muted-foreground">Courses</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="font-semibold">95%</span>
                  <span className="text-muted-foreground">Satisfaction</span>
                </div>
              </div>
            </div>
            <div className="relative lg:h-[500px] animate-scale-in hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1653669487404-09c3617c2b6c?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                alt="Students collaborating"
                className="w-full h-full object-cover rounded-3xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border animate-slide-in">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">New Certificate!</p>
                    <p className="text-sm text-muted-foreground">Cloud Architecture</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why PluralSkill */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Why PluralSkill</Badge>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">
              Learn Different. Learn Better.
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our unique approach combines practical projects, expert mentorship, and industry-recognized credentials.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Project-Based Learning',
                description: 'Build real projects that showcase your skills to employers.',
                color: 'bg-primary/10 text-primary'
              },
              {
                icon: Users,
                title: 'Expert Instructors',
                description: 'Learn from industry professionals with years of experience.',
                color: 'bg-secondary text-secondary-foreground'
              },
              {
                icon: Zap,
                title: 'Career Acceleration',
                description: 'Get job-ready faster with our focused curriculum.',
                color: 'bg-orange-100 text-orange-600'
              }
            ].map((feature, index) => (
              <Card key={index} className="group bg-white border-slate-100 hover:border-primary/20 hover:shadow-xl transition-all duration-300">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 lg:py-28 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge variant="outline" className="mb-4">Popular Courses</Badge>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl">
                Start Your Journey
              </h2>
            </div>
            <Button 
              variant="ghost" 
              className="hidden sm:flex items-center gap-2"
              onClick={() => navigate('/courses')}
              data-testid="view-all-courses"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses.slice(0, 4).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
          <div className="sm:hidden mt-8 text-center">
            <Button onClick={() => navigate('/courses')}>
              View All Courses
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Workshops */}
      {workshops.length > 0 && (
        <section className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Badge className="bg-primary/10 text-primary mb-4">Live Learning</Badge>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">
                Upcoming Workshops
              </h2>
              <p className="text-muted-foreground">Interactive sessions with industry experts</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {workshops.map((workshop) => (
                <Card key={workshop.id} className="group hover:shadow-lg transition-all border-slate-100">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge className="bg-secondary text-secondary-foreground">Live</Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {workshop.duration_minutes} min
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2">{workshop.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{workshop.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date(workshop.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {workshop.registered_count}/{workshop.max_participants} spots
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="font-heading font-bold text-3xl sm:text-4xl text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of learners who have advanced their careers with PluralSkill.
          </p>
          <Button 
            size="lg" 
            className="rounded-full bg-white text-primary hover:bg-white/90 shadow-xl hover:scale-105 transition-all"
            onClick={() => navigate('/signup')}
            data-testid="cta-signup"
          >
            Get Started for Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2 font-heading font-bold text-xl">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              PluralSkill
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <Link to="/courses" className="hover:text-white transition-colors">Courses</Link>
              <span className="hover:text-white transition-colors cursor-pointer">About</span>
              <span className="hover:text-white transition-colors cursor-pointer">Contact</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2026 PluralSkill. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const LoggedInDashboard = ({ user, courses, workshops, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="font-heading font-bold text-3xl mb-2">
            Welcome back, {user?.first_name}!
          </h1>
          <p className="text-muted-foreground">Continue your learning journey</p>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Card className="bg-white border-slate-100">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{user?.enrolled_courses?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Courses Enrolled</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-100">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-secondary-foreground" />
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
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Certificates</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enrolled Courses or Recommendations */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-semibold text-xl">
              {user?.enrolled_courses?.length > 0 ? 'Continue Learning' : 'Recommended for You'}
            </h2>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/courses')}
              className="text-primary"
            >
              Browse All <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 3).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Workshops */}
        {workshops.length > 0 && (
          <div>
            <h2 className="font-heading font-semibold text-xl mb-6">Upcoming Workshops</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {workshops.slice(0, 2).map((workshop) => (
                <Card key={workshop.id} className="bg-white border-slate-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge className="bg-secondary text-secondary-foreground mb-2">Live</Badge>
                        <h3 className="font-medium mb-1">{workshop.title}</h3>
                        <p className="text-sm text-muted-foreground">{workshop.instructor}</p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(workshop.date).toLocaleDateString()}
                        </p>
                        <p className="flex items-center gap-1 mt-1">
                          <Clock className="w-4 h-4" />
                          {workshop.duration_minutes} min
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
