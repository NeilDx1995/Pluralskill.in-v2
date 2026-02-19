import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getCourses, getWorkshops, getLabs } from '@/services/api';
import CourseCard from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  ArrowRight, GraduationCap, Users, BookOpen, Award,
  Calendar, Clock, Sparkles, Target, Zap, CheckCircle2,
  Play, Linkedin, Building2, Code, Beaker, Route, ExternalLink
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesData, workshopsData, labsData] = await Promise.all([
          getCourses(),
          getWorkshops(),
          getLabs()
        ]);
        setCourses(coursesData);
        setWorkshops(workshopsData);
        setLabs(labsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isAuthenticated) {
    return <LoggedInDashboard user={user} courses={courses} workshops={workshops} labs={labs} loading={loading} />;
  }

  return <MarketingHomePage courses={courses} workshops={workshops} labs={labs} loading={loading} />;
};

const MarketingHomePage = ({ courses, workshops, labs, loading }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <SEOHead
        title="Home"
        description="Master job-ready skills with hands-on labs, workshops, and expert-led courses in AI, Data Science, and more."
      />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-lime-50 py-20 lg:py-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM0MzM4Y2EiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8 animate-fade-in">
              <Badge className="bg-secondary text-secondary-foreground px-4 py-1.5 text-sm font-medium">
                <Sparkles className="w-4 h-4 mr-2" />
                Learn skills that matter
              </Badge>
              <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-tight text-foreground">
                Unlock Your <span className="text-primary">Potential</span>, One Skill at a Time
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
                PluralSkill offers interactive, real-world learning experiences. Expert-led workshops, hands-on labs, and industry-focused courses to get you job-ready.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-105"
                  onClick={() => navigate('/signup')}
                  data-testid="hero-get-started"
                >
                  Get Started Free
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
            </div>
            <div className="relative lg:h-[450px] animate-scale-in hidden lg:block">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=800"
                alt="Students learning"
                className="w-full h-full object-cover rounded-3xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl border animate-slide-in">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Live Workshop</p>
                    <p className="text-sm text-muted-foreground">Industry Leaders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1. WORKSHOPS SECTION - First Priority */}
      <section className="py-20 lg:py-28 bg-white" id="workshops">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-primary/10 text-primary mb-4">Live on Instagram</Badge>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">
              Upcoming Workshops
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join free live workshops featuring industry leaders and guest speakers from top organizations.
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.map((workshop) => (
                <Card key={workshop.id} className="group overflow-hidden bg-white border-slate-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className="bg-red-500 text-white">
                        <Play className="w-3 h-3 mr-1" /> Live
                      </Badge>
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {workshop.duration_minutes} min
                      </span>
                    </div>

                    <h3 className="font-heading font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                      {workshop.title}
                    </h3>

                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {workshop.description}
                    </p>

                    {/* Speakers */}
                    <div className="space-y-3 mb-4">
                      {workshop.speakers?.slice(0, 2).map((speaker, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border-2 border-primary/10">
                            <AvatarImage src={speaker.avatar_url} alt={speaker.name} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {speaker.name?.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{speaker.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {speaker.title} • {speaker.company}
                            </p>
                          </div>
                          {speaker.company_logo && (
                            <img
                              src={speaker.company_logo}
                              alt={speaker.company}
                              className="w-6 h-6 object-contain grayscale opacity-60"
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {workshop.tags?.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

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
                        {workshop.registered_count}/{workshop.max_participants}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 2. OPEN SOURCE SECTION */}
      <section className="py-20 lg:py-28 bg-slate-50/50" id="open-source">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">AI-Powered</Badge>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-6">
                Open Source Learning Paths
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Want to learn an industry-specific skill? Our AI creates personalized roadmaps using the best free resources from YouTube, GitHub, documentation, and more.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: Route, text: 'AI-generated learning roadmaps tailored to your goals' },
                  { icon: ExternalLink, text: 'Curated open-source resources from trusted platforms' },
                  { icon: Target, text: 'Industry-specific skills: Finance, HR, Supply Chain, Tech' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                      <item.icon className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <span className="text-muted-foreground">{item.text}</span>
                  </div>
                ))}
              </div>

              <Button
                className="rounded-full"
                onClick={() => navigate('/open-source')}
                data-testid="explore-open-source"
              >
                Generate Your Learning Path
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            <div className="relative">
              <Card className="bg-white border-slate-100 shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Example: Python for Data Science</p>
                      <p className="text-sm text-muted-foreground">6-week roadmap</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      { week: 1, title: 'Python Fundamentals', resources: 'freeCodeCamp, Python Docs' },
                      { week: 2, title: 'Pandas & NumPy', resources: 'Kaggle, YouTube tutorials' },
                      { week: 3, title: 'Data Visualization', resources: 'Matplotlib docs, Seaborn' },
                      { week: 4, title: 'SQL for Data', resources: 'W3Schools, Mode Analytics' },
                    ].map((item) => (
                      <div key={item.week} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                        <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium flex-shrink-0">
                          {item.week}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.resources}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COURSES SECTION */}
      <section className="py-20 lg:py-28 bg-white" id="courses">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <Badge variant="outline" className="mb-4">Curriculum-Based</Badge>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl">
                Our Courses
              </h2>
              <p className="text-muted-foreground mt-2">
                Industry-focused courses with videos, projects, and assessments
              </p>
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.slice(0, 6).map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}

          <div className="sm:hidden mt-8 text-center">
            <Button onClick={() => navigate('/courses')}>View All Courses</Button>
          </div>
        </div>
      </section>

      {/* 4. LABS SECTION */}
      <section className="py-20 lg:py-28 bg-slate-900 text-white" id="labs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-secondary text-secondary-foreground mb-4">Hands-On</Badge>
              <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-6">
                Enter The Lab
              </h2>
              <p className="text-slate-300 text-lg mb-8">
                Go beyond theory with simulation-based learning. Build real projects, experience deployment lifecycles, and master skills through guided practice.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Beaker, title: 'Simulated Environments', desc: 'Risk-free practice' },
                  { icon: Code, title: 'Real Projects', desc: 'Industry scenarios' },
                  { icon: Route, title: 'Guided Paths', desc: 'Step-by-step learning' },
                  { icon: Award, title: 'Achievements', desc: 'Track your progress' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 backdrop-blur">
                    <item.icon className="w-5 h-5 text-secondary mt-0.5" />
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                onClick={() => navigate('/labs')}
                data-testid="explore-labs"
              >
                Explore Labs
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {labs.slice(0, 3).map((lab) => (
                <Link
                  key={lab.id}
                  to={`/labs/${lab.slug}`}
                  className="block p-5 rounded-xl bg-white/5 backdrop-blur border border-white/10 hover:bg-white/10 transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-slate-300 border-slate-600 text-xs">
                          {lab.technology}
                        </Badge>
                        <Badge className={`text-xs ${lab.difficulty === 'beginner' ? 'bg-green-500/20 text-green-300' :
                            lab.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                              'bg-red-500/20 text-red-300'
                          }`}>
                          {lab.difficulty}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-1 group-hover:text-secondary transition-colors">
                        {lab.title}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-1">{lab.short_description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lab.estimated_time_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {lab.completions_count} completed
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Why PluralSkill</Badge>
            <h2 className="font-heading font-bold text-3xl sm:text-4xl mb-4">
              Learn Different. Learn Better.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Building2,
                title: 'Industry-Ready Skills',
                description: 'Courses designed with input from professionals at top companies.',
                color: 'bg-primary/10 text-primary'
              },
              {
                icon: Beaker,
                title: 'Hands-On Labs',
                description: 'Practice in simulated environments that mirror real-world scenarios.',
                color: 'bg-secondary text-secondary-foreground'
              },
              {
                icon: Users,
                title: 'Expert Workshops',
                description: 'Learn directly from industry leaders through live sessions.',
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
              <Link to="/labs" className="hover:text-white transition-colors">Labs</Link>
              <Link to="/open-source" className="hover:text-white transition-colors">Open Source</Link>
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

const LoggedInDashboard = ({ user, courses, workshops, labs, loading }) => {
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
        <div className="grid sm:grid-cols-4 gap-4 mb-10">
          <Card className="bg-white border-slate-100">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{user?.enrolled_courses?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Courses</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-slate-100">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Beaker className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{user?.completed_labs?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Labs</p>
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
          <Card className="bg-white border-slate-100">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workshops.length}</p>
                <p className="text-sm text-muted-foreground">Workshops</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Workshops */}
        {workshops.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-xl">Upcoming Workshops</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {workshops.slice(0, 3).map((workshop) => (
                <Card key={workshop.id} className="bg-white border-slate-100 hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge className="bg-red-500 text-white text-xs">
                        <Play className="w-3 h-3 mr-1" /> Live
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(workshop.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-medium mb-2 line-clamp-2">{workshop.title}</h3>
                    <div className="flex items-center gap-2">
                      {workshop.speakers?.[0] && (
                        <>
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={workshop.speakers[0].avatar_url} />
                            <AvatarFallback className="text-xs bg-primary/10">
                              {workshop.speakers[0].name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {workshop.speakers[0].name}
                          </span>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Courses */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-semibold text-xl">
              {user?.enrolled_courses?.length > 0 ? 'Continue Learning' : 'Recommended for You'}
            </h2>
            <Button variant="ghost" onClick={() => navigate('/courses')} className="text-primary">
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

        {/* Featured Labs */}
        {labs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading font-semibold text-xl">Featured Labs</h2>
              <Button variant="ghost" onClick={() => navigate('/labs')} className="text-primary">
                View All <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {labs.slice(0, 2).map((lab) => (
                <Link key={lab.id} to={`/labs/${lab.slug}`}>
                  <Card className="bg-white border-slate-100 hover:shadow-md hover:border-primary/20 transition-all group">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Beaker className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">{lab.technology}</Badge>
                            <Badge className={`text-xs ${lab.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                                lab.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                              }`}>
                              {lab.difficulty}
                            </Badge>
                          </div>
                          <h3 className="font-medium group-hover:text-primary transition-colors">{lab.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{lab.short_description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
