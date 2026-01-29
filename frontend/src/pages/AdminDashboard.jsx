import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  getAdminStats, getAdminUsers, getAdminCourses, 
  createCourse, updateCourse, deleteCourse,
  getWorkshops, createWorkshop, deleteWorkshop, updateWorkshop,
  getAdminLabs, createLab, deleteLab
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Pencil, Trash2, Loader2, Beaker, Route, GraduationCap
} from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  // Course form state
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    thumbnail_url: '',
    category: '',
    level: 'beginner',
    duration_hours: 10,
    price: 0,
    is_published: false
  });
  const [savingCourse, setSavingCourse] = useState(false);

  // Workshop form state
  const [workshopDialogOpen, setWorkshopDialogOpen] = useState(false);
  const [workshopForm, setWorkshopForm] = useState({
    title: '',
    description: '',
    instructor: '',
    date: '',
    duration_minutes: 60,
    max_participants: 50
  });
  const [savingWorkshop, setSavingWorkshop] = useState(false);

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
      const [statsData, usersData, coursesData, workshopsData] = await Promise.all([
        getAdminStats(),
        getAdminUsers(),
        getAdminCourses(),
        getWorkshops(false)
      ]);
      setStats(statsData);
      setUsers(usersData);
      setCourses(coursesData);
      setWorkshops(workshopsData);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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
        title: course.title,
        slug: course.slug,
        description: course.description,
        short_description: course.short_description,
        thumbnail_url: course.thumbnail_url,
        category: course.category,
        level: course.level,
        duration_hours: course.duration_hours,
        price: course.price,
        is_published: course.is_published
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: '',
        slug: '',
        description: '',
        short_description: '',
        thumbnail_url: '',
        category: '',
        level: 'beginner',
        duration_hours: 10,
        price: 0,
        is_published: false
      });
    }
    setCourseDialogOpen(true);
  };

  const handleSaveCourse = async () => {
    setSavingCourse(true);
    try {
      if (editingCourse) {
        await updateCourse(editingCourse.id, courseForm);
        toast.success('Course updated successfully');
      } else {
        await createCourse(courseForm);
        toast.success('Course created successfully');
      }
      setCourseDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save course');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;
    try {
      await deleteCourse(courseId);
      toast.success('Course deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete course');
    }
  };

  const handleSaveWorkshop = async () => {
    setSavingWorkshop(true);
    try {
      await createWorkshop(workshopForm);
      toast.success('Workshop created successfully');
      setWorkshopDialogOpen(false);
      setWorkshopForm({
        title: '',
        description: '',
        instructor: '',
        date: '',
        duration_minutes: 60,
        max_participants: 50
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to create workshop');
    } finally {
      setSavingWorkshop(false);
    }
  };

  const handleDeleteWorkshop = async (workshopId) => {
    if (!confirm('Are you sure you want to delete this workshop?')) return;
    try {
      await deleteWorkshop(workshopId);
      toast.success('Workshop deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete workshop');
    }
  };

  const downloadUsersCSV = () => {
    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Enrolled Courses', 'Created At'];
    const rows = users.map(u => [
      u.id,
      u.email,
      u.first_name,
      u.last_name,
      u.role,
      u.enrolled_courses?.length || 0,
      u.created_at
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV downloaded');
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
            Manage courses, users, and platform content
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card className="bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_courses || 0}</p>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.published_courses || 0}</p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_workshops || 0}</p>
                <p className="text-sm text-muted-foreground">Workshops</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="courses" data-testid="tab-courses">Courses</TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
            <TabsTrigger value="workshops" data-testid="tab-workshops">Workshops</TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Courses</CardTitle>
                  <CardDescription>Manage your course catalog</CardDescription>
                </div>
                <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openCourseDialog()} data-testid="add-course-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Course
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
                      <DialogDescription>
                        {editingCourse ? 'Update course details' : 'Add a new course to the catalog'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input
                            value={courseForm.title}
                            onChange={(e) => handleCourseFormChange('title', e.target.value)}
                            data-testid="course-title-input"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug</Label>
                          <Input
                            value={courseForm.slug}
                            onChange={(e) => handleCourseFormChange('slug', e.target.value)}
                            data-testid="course-slug-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Short Description</Label>
                        <Input
                          value={courseForm.short_description}
                          onChange={(e) => handleCourseFormChange('short_description', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={courseForm.description}
                          onChange={(e) => handleCourseFormChange('description', e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Thumbnail URL</Label>
                        <Input
                          value={courseForm.thumbnail_url}
                          onChange={(e) => handleCourseFormChange('thumbnail_url', e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                        />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input
                            value={courseForm.category}
                            onChange={(e) => handleCourseFormChange('category', e.target.value)}
                            placeholder="e.g., Engineering"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Level</Label>
                          <Select
                            value={courseForm.level}
                            onValueChange={(v) => handleCourseFormChange('level', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duration (hours)</Label>
                          <Input
                            type="number"
                            value={courseForm.duration_hours}
                            onChange={(e) => handleCourseFormChange('duration_hours', parseInt(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label>Published</Label>
                          <p className="text-sm text-muted-foreground">Make this course visible to users</p>
                        </div>
                        <Switch
                          checked={courseForm.is_published}
                          onCheckedChange={(v) => handleCourseFormChange('is_published', v)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveCourse} disabled={savingCourse} data-testid="save-course-btn">
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openCourseDialog(course)}
                            data-testid={`edit-course-${course.slug}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCourse(course.id)}
                            data-testid={`delete-course-${course.slug}`}
                          >
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

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>View all registered users</CardDescription>
                </div>
                <Button variant="outline" onClick={downloadUsersCSV} data-testid="download-csv-btn">
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.enrolled_courses?.length || 0}</TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Workshops</CardTitle>
                  <CardDescription>Manage live workshop sessions</CardDescription>
                </div>
                <Dialog open={workshopDialogOpen} onOpenChange={setWorkshopDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="add-workshop-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Workshop
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Workshop</DialogTitle>
                      <DialogDescription>Schedule a new live workshop</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          value={workshopForm.title}
                          onChange={(e) => setWorkshopForm({ ...workshopForm, title: e.target.value })}
                          data-testid="workshop-title-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={workshopForm.description}
                          onChange={(e) => setWorkshopForm({ ...workshopForm, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Instructor</Label>
                          <Input
                            value={workshopForm.instructor}
                            onChange={(e) => setWorkshopForm({ ...workshopForm, instructor: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date & Time</Label>
                          <Input
                            type="datetime-local"
                            value={workshopForm.date}
                            onChange={(e) => setWorkshopForm({ ...workshopForm, date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={workshopForm.duration_minutes}
                            onChange={(e) => setWorkshopForm({ ...workshopForm, duration_minutes: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Participants</Label>
                          <Input
                            type="number"
                            value={workshopForm.max_participants}
                            onChange={(e) => setWorkshopForm({ ...workshopForm, max_participants: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setWorkshopDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveWorkshop} disabled={savingWorkshop} data-testid="save-workshop-btn">
                        {savingWorkshop && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Create
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
                      <TableHead>Instructor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workshops.map((workshop) => (
                      <TableRow key={workshop.id}>
                        <TableCell className="font-medium">{workshop.title}</TableCell>
                        <TableCell>{workshop.instructor}</TableCell>
                        <TableCell>
                          {new Date(workshop.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{workshop.duration_minutes} min</TableCell>
                        <TableCell>
                          {workshop.registered_count}/{workshop.max_participants}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteWorkshop(workshop.id)}
                            data-testid={`delete-workshop-${workshop.id}`}
                          >
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
