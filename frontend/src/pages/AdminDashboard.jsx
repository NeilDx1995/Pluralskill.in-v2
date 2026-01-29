import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  getAdminStats, getAdminAnalytics, getAdminUsers, updateUserRole,
  getAdminCourses, createCourse, updateCourse, deleteCourse,
  getAdminWorkshops, createWorkshop, deleteWorkshop,
  getAdminLabs, createLab, deleteLab
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, BookOpen, Calendar, Download, Plus, 
  Pencil, Trash2, Loader2, Beaker, Route, GraduationCap,
  TrendingUp, BarChart3, Eye, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Course form state
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '', slug: '', description: '', short_description: '',
    thumbnail_url: '', category: '', industry: '', level: 'beginner',
    duration_hours: 10, price: 0, is_published: false
  });
  const [savingCourse, setSavingCourse] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      if (!isAdmin) {
        navigate('/');
        toast.error('Admin access required');
        return;
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    try {
      const [statsData, analyticsData, usersData, coursesData, workshopsData, labsData] = await Promise.all([
        getAdminStats(),
        getAdminAnalytics(),
        getAdminUsers(),
        getAdminCourses(),
        getAdminWorkshops(),
        getAdminLabs()
      ]);
      setStats(statsData);
      setAnalytics(analyticsData);
      setUsers(usersData);
      setCourses(coursesData);
      setWorkshops(workshopsData);
      setLabs(labsData);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success('Role updated');
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleCourseFormChange = (field, value) => {
    setCourseForm({ ...courseForm, [field]: value });
    if (field === 'title' && !editingCourse) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setCourseForm(prev => ({ ...prev, slug }));
    }
  };

  const openCourseDialog = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title, slug: course.slug, description: course.description,
        short_description: course.short_description, thumbnail_url: course.thumbnail_url,
        category: course.category, industry: course.industry || '', level: course.level,
        duration_hours: course.duration_hours, price: course.price, is_published: course.is_published
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: '', slug: '', description: '', short_description: '',
        thumbnail_url: '', category: '', industry: '', level: 'beginner',
        duration_hours: 10, price: 0, is_published: false
      });
    }
    setCourseDialogOpen(true);
  };

  const handleSaveCourse = async () => {
    setSavingCourse(true);
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, courseForm);
        toast.success('Course updated');
      } else {
        await createCourse(courseForm);
        toast.success('Course created');
      }
      setCourseDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Delete this course?')) return;
    try {
      await deleteCourse(courseId);
      toast.success('Course deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteLab = async (labId) => {
    if (!confirm('Delete this lab?')) return;
    try {
      await deleteLab(labId);
      toast.success('Lab deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const handleDeleteWorkshop = async (workshopId) => {
    if (!confirm('Delete this workshop?')) return;
    try {
      await deleteWorkshop(workshopId);
      toast.success('Workshop deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const downloadUsersCSV = () => {
    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Enrolled Courses', 'Created At'];
    const rows = users.map(u => [u.id, u.email, u.first_name, u.last_name, u.role, u.enrolled_courses?.length || 0, u.created_at]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    toast.success('CSV downloaded');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'trainer': return 'bg-blue-100 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

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
          <h1 className="font-heading font-bold text-3xl mb-2" data-testid="admin-title">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Full platform analytics and management
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4 mr-2" />Overview
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />Users
            </TabsTrigger>
            <TabsTrigger value="courses" data-testid="tab-courses">
              <BookOpen className="w-4 h-4 mr-2" />Courses
            </TabsTrigger>
            <TabsTrigger value="labs" data-testid="tab-labs">
              <Beaker className="w-4 h-4 mr-2" />Labs
            </TabsTrigger>
            <TabsTrigger value="workshops" data-testid="tab-workshops">
              <Calendar className="w-4 h-4 mr-2" />Workshops
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {/* Main Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Total Users</p>
                      <p className="text-3xl font-bold">{stats?.total_users || 0}</p>
                    </div>
                    <Users className="w-10 h-10 text-primary/30" />
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      {stats?.total_learners || 0} Learners
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      {stats?.total_trainers || 0} Trainers
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white border-l-4 border-l-secondary">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Live Courses</p>
                      <p className="text-3xl font-bold">{stats?.published_courses || 0}</p>
                    </div>
                    <BookOpen className="w-10 h-10 text-secondary/50" />
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Published</span>
                      <span>{stats?.published_courses || 0} / {stats?.total_courses || 0}</span>
                    </div>
                    <Progress value={stats?.total_courses ? (stats.published_courses / stats.total_courses) * 100 : 0} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-orange-400">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Active Workshops</p>
                      <p className="text-3xl font-bold">{stats?.active_workshops || 0}</p>
                    </div>
                    <Calendar className="w-10 h-10 text-orange-400/50" />
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {stats?.total_workshops || 0} total workshops
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white border-l-4 border-l-purple-400">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Live Labs</p>
                      <p className="text-3xl font-bold">{stats?.published_labs || 0}</p>
                    </div>
                    <Beaker className="w-10 h-10 text-purple-400/50" />
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Published</span>
                      <span>{stats?.published_labs || 0} / {stats?.total_labs || 0}</span>
                    </div>
                    <Progress value={stats?.total_labs ? (stats.published_labs / stats.total_labs) * 100 : 0} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Engagement Stats */}
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Enrollments</p>
                      <p className="text-2xl font-bold">{stats?.total_enrollments || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-green-200 flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-green-700" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Lab Completions</p>
                      <p className="text-2xl font-bold">{stats?.total_lab_completions || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-200 flex items-center justify-center">
                      <Route className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Learning Paths</p>
                      <p className="text-2xl font-bold">{stats?.total_learning_paths || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Content */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Courses by Enrollment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.top_courses?.map((course, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{course.title}</p>
                            <p className="text-xs text-muted-foreground">{course.category}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{course.enrolled_count} enrolled</Badge>
                      </div>
                    ))}
                    {(!analytics?.top_courses || analytics.top_courses.length === 0) && (
                      <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Labs by Completions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.top_labs?.map((lab, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-secondary-foreground">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{lab.title}</p>
                            <p className="text-xs text-muted-foreground">{lab.technology}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{lab.completions_count} completed</Badge>
                      </div>
                    ))}
                    {(!analytics?.top_labs || analytics.top_labs.length === 0) && (
                      <p className="text-muted-foreground text-sm text-center py-4">No data yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Users by Role */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Users by Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-8">
                  {analytics?.users_by_role?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${
                        item._id === 'admin' ? 'bg-red-500' :
                        item._id === 'trainer' ? 'bg-blue-500' : 'bg-green-500'
                      }`}></div>
                      <div>
                        <p className="font-medium capitalize">{item._id || 'learner'}</p>
                        <p className="text-sm text-muted-foreground">{item.count} users</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage user roles and access</CardDescription>
                </div>
                <Button variant="outline" onClick={downloadUsersCSV} data-testid="download-csv-btn">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>{user.enrolled_courses?.length || 0}</TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Select value={user.role} onValueChange={(v) => handleRoleChange(user.id, v)}>
                            <SelectTrigger className="w-28 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="learner">Learner</SelectItem>
                              <SelectItem value="trainer">Trainer</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>All Courses</CardTitle>
                  <CardDescription>Manage platform courses</CardDescription>
                </div>
                <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openCourseDialog()} data-testid="add-course-btn">
                      <Plus className="w-4 h-4 mr-2" />Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={courseForm.title} onChange={(e) => handleCourseFormChange('title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug</Label>
                          <Input value={courseForm.slug} onChange={(e) => handleCourseFormChange('slug', e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Short Description</Label>
                        <Input value={courseForm.short_description} onChange={(e) => handleCourseFormChange('short_description', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={courseForm.description} onChange={(e) => handleCourseFormChange('description', e.target.value)} rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label>Thumbnail URL</Label>
                        <Input value={courseForm.thumbnail_url} onChange={(e) => handleCourseFormChange('thumbnail_url', e.target.value)} />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input value={courseForm.category} onChange={(e) => handleCourseFormChange('category', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Level</Label>
                          <Select value={courseForm.level} onValueChange={(v) => handleCourseFormChange('level', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (hrs)</Label>
                          <Input type="number" value={courseForm.duration_hours} onChange={(e) => handleCourseFormChange('duration_hours', parseInt(e.target.value))} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div><Label>Publish</Label><p className="text-sm text-muted-foreground">Make visible</p></div>
                        <Switch checked={courseForm.is_published} onCheckedChange={(v) => handleCourseFormChange('is_published', v)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveCourse} disabled={savingCourse}>
                        {savingCourse && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingCourse ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.category}</TableCell>
                        <TableCell className="capitalize">{course.level}</TableCell>
                        <TableCell>
                          <Badge variant={course.is_published ? 'default' : 'secondary'}>
                            {course.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>{course.enrolled_count}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openCourseDialog(course)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteCourse(course.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="labs">
            <Card>
              <CardHeader>
                <CardTitle>All Labs</CardTitle>
                <CardDescription>Manage simulation labs</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Technology</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Completions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labs.map((lab) => (
                      <TableRow key={lab.id}>
                        <TableCell className="font-medium">{lab.title}</TableCell>
                        <TableCell>{lab.technology}</TableCell>
                        <TableCell className="capitalize">{lab.difficulty}</TableCell>
                        <TableCell>
                          <Badge variant={lab.is_published ? 'default' : 'secondary'}>
                            {lab.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>{lab.completions_count}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteLab(lab.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workshops Tab */}
          <TabsContent value="workshops">
            <Card>
              <CardHeader>
                <CardTitle>All Workshops</CardTitle>
                <CardDescription>Manage live workshops</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Speakers</TableHead>
                      <TableHead>Registrations</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workshops.map((workshop) => (
                      <TableRow key={workshop.id}>
                        <TableCell className="font-medium">{workshop.title}</TableCell>
                        <TableCell>{new Date(workshop.date).toLocaleDateString()}</TableCell>
                        <TableCell>{workshop.speakers?.length || 0}</TableCell>
                        <TableCell>{workshop.registered_count}/{workshop.max_participants}</TableCell>
                        <TableCell>
                          <Badge variant={workshop.is_active ? 'default' : 'secondary'}>
                            {workshop.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteWorkshop(workshop.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
