import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  getTrainerCourses, createTrainerCourse, updateTrainerCourse, deleteTrainerCourse,
  getTrainerLabs, createTrainerLab, updateTrainerLab, deleteTrainerLab,
  getWorkshops, createTrainerWorkshop, deleteTrainerWorkshop
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
  BookOpen, Calendar, Plus, Pencil, Trash2, 
  Loader2, Beaker, Upload, Video
} from 'lucide-react';
import { toast } from 'sonner';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isTrainerOrAdmin, loading: authLoading, user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [labs, setLabs] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('courses');

  // Course form state
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    title: '', slug: '', description: '', short_description: '',
    thumbnail_url: '', category: '', industry: '', level: 'beginner',
    duration_hours: 10, price: 0, is_published: false, learning_outcomes: []
  });
  const [savingCourse, setSavingCourse] = useState(false);
  const [outcomeInput, setOutcomeInput] = useState('');

  // Lab form state
  const [labDialogOpen, setLabDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [labForm, setLabForm] = useState({
    title: '', slug: '', description: '', short_description: '',
    thumbnail_url: '', category: '', technology: '', difficulty: 'beginner',
    estimated_time_minutes: 60, is_published: false, prerequisites: [], skills_gained: []
  });
  const [savingLab, setSavingLab] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      if (!isTrainerOrAdmin) {
        navigate('/');
        toast.error('Trainer access required');
        return;
      }
    }
  }, [isAuthenticated, isTrainerOrAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isTrainerOrAdmin) {
      fetchData();
    }
  }, [isTrainerOrAdmin]);

  const fetchData = async () => {
    try {
      const [coursesData, labsData, workshopsData] = await Promise.all([
        getTrainerCourses(),
        getTrainerLabs(),
        getWorkshops(false)
      ]);
      setCourses(coursesData);
      setLabs(labsData);
      setWorkshops(workshopsData.filter(w => w.created_by === user?.id));
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  const handleAddOutcome = (e) => {
    if (e.key === 'Enter' && outcomeInput.trim()) {
      e.preventDefault();
      setCourseForm(prev => ({
        ...prev,
        learning_outcomes: [...prev.learning_outcomes, outcomeInput.trim()]
      }));
      setOutcomeInput('');
    }
  };

  const openCourseDialog = (course = null) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({
        title: course.title, slug: course.slug, description: course.description,
        short_description: course.short_description, thumbnail_url: course.thumbnail_url,
        category: course.category, industry: course.industry || '', level: course.level,
        duration_hours: course.duration_hours, price: course.price,
        is_published: course.is_published, learning_outcomes: course.learning_outcomes || []
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: '', slug: '', description: '', short_description: '',
        thumbnail_url: '', category: '', industry: '', level: 'beginner',
        duration_hours: 10, price: 0, is_published: false, learning_outcomes: []
      });
    }
    setCourseDialogOpen(true);
  };

  const handleSaveCourse = async () => {
    setSavingCourse(true);
    try {
      if (editingCourse) {
        await updateTrainerCourse(editingCourse.id, courseForm);
        toast.success('Course updated');
      } else {
        await createTrainerCourse(courseForm);
        toast.success('Course created');
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
    if (!confirm('Delete this course?')) return;
    try {
      await deleteTrainerCourse(courseId);
      toast.success('Course deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
    }
  };

  const handleLabFormChange = (field, value) => {
    setLabForm({ ...labForm, [field]: value });
    if (field === 'title' && !editingLab) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setLabForm(prev => ({ ...prev, slug }));
    }
  };

  const openLabDialog = (lab = null) => {
    if (lab) {
      setEditingLab(lab);
      setLabForm({
        title: lab.title, slug: lab.slug, description: lab.description,
        short_description: lab.short_description, thumbnail_url: lab.thumbnail_url,
        category: lab.category, technology: lab.technology, difficulty: lab.difficulty,
        estimated_time_minutes: lab.estimated_time_minutes, is_published: lab.is_published,
        prerequisites: lab.prerequisites || [], skills_gained: lab.skills_gained || []
      });
    } else {
      setEditingLab(null);
      setLabForm({
        title: '', slug: '', description: '', short_description: '',
        thumbnail_url: '', category: '', technology: '', difficulty: 'beginner',
        estimated_time_minutes: 60, is_published: false, prerequisites: [], skills_gained: []
      });
    }
    setLabDialogOpen(true);
  };

  const handleSaveLab = async () => {
    setSavingLab(true);
    try {
      if (editingLab) {
        await updateTrainerLab(editingLab.id, labForm);
        toast.success('Lab updated');
      } else {
        await createTrainerLab(labForm);
        toast.success('Lab created');
      }
      setLabDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save lab');
    } finally {
      setSavingLab(false);
    }
  };

  const handleDeleteLab = async (labId) => {
    if (!confirm('Delete this lab?')) return;
    try {
      await deleteTrainerLab(labId);
      toast.success('Lab deleted');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete');
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
          <h1 className="font-heading font-bold text-3xl mb-2" data-testid="trainer-title">
            Trainer Dashboard
          </h1>
          <p className="text-muted-foreground">
            Create and manage your courses, labs, and workshops
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          <Card className="bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{courses.length}</p>
                <p className="text-sm text-muted-foreground">My Courses</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Beaker className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{labs.length}</p>
                <p className="text-sm text-muted-foreground">My Labs</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workshops.length}</p>
                <p className="text-sm text-muted-foreground">My Workshops</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="courses" data-testid="tab-courses">Courses</TabsTrigger>
            <TabsTrigger value="labs" data-testid="tab-labs">Labs</TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Courses</CardTitle>
                  <CardDescription>Create and manage your courses</CardDescription>
                </div>
                <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openCourseDialog()} data-testid="add-course-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Course
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
                        <Input value={courseForm.thumbnail_url} onChange={(e) => handleCourseFormChange('thumbnail_url', e.target.value)} placeholder="https://..." />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input value={courseForm.category} onChange={(e) => handleCourseFormChange('category', e.target.value)} placeholder="e.g., Finance" />
                        </div>
                        <div className="space-y-2">
                          <Label>Industry</Label>
                          <Input value={courseForm.industry} onChange={(e) => handleCourseFormChange('industry', e.target.value)} placeholder="e.g., Banking" />
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
                      </div>
                      <div className="space-y-2">
                        <Label>Learning Outcomes (press Enter to add)</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {courseForm.learning_outcomes.map((outcome, idx) => (
                            <Badge key={idx} variant="secondary" className="gap-1">
                              {outcome}
                              <span className="cursor-pointer" onClick={() => setCourseForm(prev => ({
                                ...prev,
                                learning_outcomes: prev.learning_outcomes.filter((_, i) => i !== idx)
                              }))}>×</span>
                            </Badge>
                          ))}
                        </div>
                        <Input value={outcomeInput} onChange={(e) => setOutcomeInput(e.target.value)} onKeyDown={handleAddOutcome} placeholder="Type and press Enter" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Publish</Label>
                          <p className="text-sm text-muted-foreground">Make visible to learners</p>
                        </div>
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
                {courses.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No courses yet. Create your first course!</p>
                  </div>
                ) : (
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="labs">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Labs</CardTitle>
                  <CardDescription>Create simulation-based labs</CardDescription>
                </div>
                <Dialog open={labDialogOpen} onOpenChange={setLabDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openLabDialog()} data-testid="add-lab-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Lab
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingLab ? 'Edit Lab' : 'Create Lab'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Title</Label>
                          <Input value={labForm.title} onChange={(e) => handleLabFormChange('title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Slug</Label>
                          <Input value={labForm.slug} onChange={(e) => handleLabFormChange('slug', e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Short Description</Label>
                        <Input value={labForm.short_description} onChange={(e) => handleLabFormChange('short_description', e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={labForm.description} onChange={(e) => handleLabFormChange('description', e.target.value)} rows={3} />
                      </div>
                      <div className="space-y-2">
                        <Label>Thumbnail URL</Label>
                        <Input value={labForm.thumbnail_url} onChange={(e) => handleLabFormChange('thumbnail_url', e.target.value)} />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input value={labForm.category} onChange={(e) => handleLabFormChange('category', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label>Technology</Label>
                          <Input value={labForm.technology} onChange={(e) => handleLabFormChange('technology', e.target.value)} placeholder="e.g., Python" />
                        </div>
                        <div className="space-y-2">
                          <Label>Difficulty</Label>
                          <Select value={labForm.difficulty} onValueChange={(v) => handleLabFormChange('difficulty', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Publish</Label>
                          <p className="text-sm text-muted-foreground">Make visible to learners</p>
                        </div>
                        <Switch checked={labForm.is_published} onCheckedChange={(v) => handleLabFormChange('is_published', v)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setLabDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveLab} disabled={savingLab}>
                        {savingLab && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingLab ? 'Update' : 'Create'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {labs.length === 0 ? (
                  <div className="text-center py-12">
                    <Beaker className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No labs yet. Create your first lab!</p>
                  </div>
                ) : (
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
                            <Button variant="ghost" size="icon" onClick={() => openLabDialog(lab)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteLab(lab.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TrainerDashboard;
