import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  getTrainerCourses, createTrainerCourse, updateTrainerCourse, deleteTrainerCourse,
  getTrainerLabs, createTrainerLab, updateTrainerLab, deleteTrainerLab,
  getWorkshops, createTrainerWorkshop, deleteTrainerWorkshop,
  uploadImage, uploadVideo
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  BookOpen, Calendar, Plus, Pencil, Trash2, 
  Loader2, Beaker, Upload, Video, Image, X, GripVertical,
  FileText, CheckCircle, AlertCircle
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
    duration_hours: 10, price: 0, is_published: false, learning_outcomes: [],
    modules: [], tests: []
  });
  const [savingCourse, setSavingCourse] = useState(false);
  const [outcomeInput, setOutcomeInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Module editing
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', duration_minutes: 30, video_url: '' });
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

  // Test/Quiz editing
  const [testForm, setTestForm] = useState({ question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' });

  // Lab form state
  const [labDialogOpen, setLabDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState(null);
  const [labForm, setLabForm] = useState({
    title: '', slug: '', description: '', short_description: '',
    thumbnail_url: '', category: '', technology: '', difficulty: 'beginner',
    estimated_time_minutes: 60, is_published: false, prerequisites: [], skills_gained: []
  });
  const [savingLab, setSavingLab] = useState(false);

  // Workshop form state
  const [workshopDialogOpen, setWorkshopDialogOpen] = useState(false);
  const [workshopForm, setWorkshopForm] = useState({
    title: '', description: '', leader: '', company: '', date: '',
    image_url: '', recording_url: '', tags: [], max_participants: 100, is_published: false
  });
  const [savingWorkshop, setSavingWorkshop] = useState(false);

  const fetchData = useCallback(async () => {
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
  }, [user?.id]);

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
  }, [isTrainerOrAdmin, fetchData]);

  // Image upload handler
  const handleImageUpload = async (e, field, formSetter) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const result = await uploadImage(file, (progress) => setUploadProgress(progress));
      formSetter(prev => ({ ...prev, [field]: result.url }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Video upload handler for modules
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingVideo(true);
    setVideoProgress(0);
    try {
      const result = await uploadVideo(file, (progress) => setVideoProgress(progress));
      setModuleForm(prev => ({ ...prev, video_url: result.url }));
      toast.success('Video uploaded');
    } catch (error) {
      toast.error('Failed to upload video');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Course handlers
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
        is_published: course.is_published, learning_outcomes: course.learning_outcomes || [],
        modules: course.modules || [], tests: course.tests || []
      });
    } else {
      setEditingCourse(null);
      setCourseForm({
        title: '', slug: '', description: '', short_description: '',
        thumbnail_url: '', category: '', industry: '', level: 'beginner',
        duration_hours: 10, price: 0, is_published: false, learning_outcomes: [],
        modules: [], tests: []
      });
    }
    setModuleForm({ title: '', description: '', duration_minutes: 30, video_url: '' });
    setTestForm({ question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' });
    setCourseDialogOpen(true);
  };

  // Add module to course
  const handleAddModule = () => {
    if (!moduleForm.title) {
      toast.error('Module title is required');
      return;
    }
    const newModule = {
      id: `m${Date.now()}`,
      ...moduleForm,
      order: courseForm.modules.length + 1
    };
    setCourseForm(prev => ({
      ...prev,
      modules: [...prev.modules, newModule]
    }));
    setModuleForm({ title: '', description: '', duration_minutes: 30, video_url: '' });
    toast.success('Module added');
  };

  const handleRemoveModule = (moduleId) => {
    setCourseForm(prev => ({
      ...prev,
      modules: prev.modules.filter(m => m.id !== moduleId)
    }));
  };

  // Add test/quiz question
  const handleAddTest = () => {
    if (!testForm.question || testForm.options.some(o => !o.trim())) {
      toast.error('Question and all options are required');
      return;
    }
    const newTest = {
      id: `q${Date.now()}`,
      ...testForm
    };
    setCourseForm(prev => ({
      ...prev,
      tests: [...prev.tests, newTest]
    }));
    setTestForm({ question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' });
    toast.success('Quiz question added');
  };

  const handleRemoveTest = (testId) => {
    setCourseForm(prev => ({
      ...prev,
      tests: prev.tests.filter(t => t.id !== testId)
    }));
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

  // Lab handlers
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

  // Workshop handlers
  const openWorkshopDialog = () => {
    setWorkshopForm({
      title: '', description: '', leader: '', company: '', date: '',
      image_url: '', recording_url: '', tags: [], max_participants: 100, is_published: false
    });
    setWorkshopDialogOpen(true);
  };

  const handleWorkshopFormChange = (field, value) => {
    setWorkshopForm({ ...workshopForm, [field]: value });
  };

  const handleSaveWorkshop = async () => {
    setSavingWorkshop(true);
    try {
      await createTrainerWorkshop(workshopForm);
      toast.success('Workshop created');
      setWorkshopDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save workshop');
    } finally {
      setSavingWorkshop(false);
    }
  };

  const handleDeleteWorkshop = async (workshopId) => {
    if (!confirm('Delete this workshop?')) return;
    try {
      await deleteTrainerWorkshop(workshopId);
      toast.success('Workshop deleted');
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
            <TabsTrigger value="workshops" data-testid="tab-workshops">Workshops</TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Courses</CardTitle>
                  <CardDescription>Create courses with modules, videos, and quizzes</CardDescription>
                </div>
                <Button onClick={() => openCourseDialog()} data-testid="add-course-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Course
                </Button>
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
                        <TableHead>Course</TableHead>
                        <TableHead>Modules</TableHead>
                        <TableHead>Quiz</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {course.thumbnail_url && (
                                <img src={course.thumbnail_url} alt="" className="w-12 h-12 rounded object-cover" />
                              )}
                              <div>
                                <p className="font-medium">{course.title}</p>
                                <p className="text-sm text-muted-foreground">{course.category}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{course.modules?.length || 0} modules</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{course.tests?.length || 0} questions</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={course.is_published ? 'default' : 'secondary'}>
                              {course.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </TableCell>
                          <TableCell>{course.enrolled_count || 0}</TableCell>
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
                <Button onClick={() => openLabDialog()} data-testid="add-lab-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Lab
                </Button>
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
                        <TableHead>Lab</TableHead>
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
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {lab.thumbnail_url && (
                                <img src={lab.thumbnail_url} alt="" className="w-12 h-12 rounded object-cover" />
                              )}
                              <p className="font-medium">{lab.title}</p>
                            </div>
                          </TableCell>
                          <TableCell>{lab.technology}</TableCell>
                          <TableCell className="capitalize">{lab.difficulty}</TableCell>
                          <TableCell>
                            <Badge variant={lab.is_published ? 'default' : 'secondary'}>
                              {lab.is_published ? 'Published' : 'Draft'}
                            </Badge>
                          </TableCell>
                          <TableCell>{lab.completions_count || 0}</TableCell>
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

          {/* Workshops Tab */}
          <TabsContent value="workshops">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Workshops</CardTitle>
                  <CardDescription>Create and manage workshops with recordings</CardDescription>
                </div>
                <Button onClick={openWorkshopDialog} data-testid="add-workshop-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workshop
                </Button>
              </CardHeader>
              <CardContent>
                {workshops.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No workshops yet. Create your first workshop!</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Workshop</TableHead>
                        <TableHead>Leader</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Recording</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workshops.map((workshop) => (
                        <TableRow key={workshop.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {workshop.image_url && (
                                <img src={workshop.image_url} alt="" className="w-12 h-12 rounded object-cover" />
                              )}
                              <p className="font-medium">{workshop.title}</p>
                            </div>
                          </TableCell>
                          <TableCell>{workshop.leader}</TableCell>
                          <TableCell>{workshop.date}</TableCell>
                          <TableCell>
                            {workshop.recording_url ? (
                              <Badge className="bg-green-100 text-green-700">Available</Badge>
                            ) : (
                              <Badge variant="outline">Not uploaded</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={workshop.is_published ? 'default' : 'secondary'}>
                              {workshop.is_published ? 'Published' : 'Draft'}
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Course Dialog */}
        <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
              <DialogDescription>Build your course with modules, videos, and quizzes</DialogDescription>
            </DialogHeader>
            
            <Accordion type="multiple" defaultValue={["basic", "modules", "tests"]} className="w-full">
              {/* Basic Info */}
              <AccordionItem value="basic">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Basic Information
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid gap-4 py-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title *</Label>
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
                    
                    {/* Banner Image Upload */}
                    <div className="space-y-2">
                      <Label>Course Banner Image</Label>
                      <div className="flex items-center gap-4">
                        {courseForm.thumbnail_url && (
                          <img src={courseForm.thumbnail_url} alt="Banner" className="w-24 h-16 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e, 'thumbnail_url', setCourseForm)}
                            disabled={uploadingImage}
                          />
                          {uploadingImage && (
                            <Progress value={uploadProgress} className="mt-2 h-2" />
                          )}
                        </div>
                      </div>
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
                            <X className="w-3 h-3 cursor-pointer" onClick={() => setCourseForm(prev => ({
                              ...prev,
                              learning_outcomes: prev.learning_outcomes.filter((_, i) => i !== idx)
                            }))} />
                          </Badge>
                        ))}
                      </div>
                      <Input value={outcomeInput} onChange={(e) => setOutcomeInput(e.target.value)} onKeyDown={handleAddOutcome} placeholder="Type and press Enter" />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Curriculum / Modules */}
              <AccordionItem value="modules">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Curriculum ({courseForm.modules.length} modules)
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 py-4">
                    {/* Existing Modules */}
                    {courseForm.modules.length > 0 && (
                      <div className="space-y-2">
                        {courseForm.modules.map((module, idx) => (
                          <div key={module.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                            <GripVertical className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium">{idx + 1}. {module.title}</p>
                              <p className="text-sm text-muted-foreground">{module.duration_minutes} min</p>
                            </div>
                            {module.video_url ? (
                              <Badge className="bg-green-100 text-green-700">
                                <Video className="w-3 h-3 mr-1" />
                                Video
                              </Badge>
                            ) : (
                              <Badge variant="outline">No video</Badge>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveModule(module.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Module */}
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Add New Module</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Module Title *</Label>
                            <Input 
                              value={moduleForm.title} 
                              onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="e.g., Introduction to Financial Modeling"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Duration (minutes)</Label>
                            <Input 
                              type="number"
                              value={moduleForm.duration_minutes} 
                              onChange={(e) => setModuleForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 30 }))}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Module Description</Label>
                          <Textarea 
                            value={moduleForm.description} 
                            onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Video Upload</Label>
                          <div className="flex items-center gap-4">
                            {moduleForm.video_url && (
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Video uploaded
                              </Badge>
                            )}
                            <Input
                              type="file"
                              accept="video/*"
                              onChange={handleVideoUpload}
                              disabled={uploadingVideo}
                            />
                          </div>
                          {uploadingVideo && (
                            <Progress value={videoProgress} className="mt-2 h-2" />
                          )}
                        </div>
                        <Button onClick={handleAddModule} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Module
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Quiz / Tests */}
              <AccordionItem value="tests">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Quiz Questions ({courseForm.tests.length} questions)
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Students must score 80% or higher on the quiz to earn their certificate.
                    </p>

                    {/* Existing Questions */}
                    {courseForm.tests.length > 0 && (
                      <div className="space-y-2">
                        {courseForm.tests.map((test, idx) => (
                          <div key={test.id} className="p-3 bg-slate-50 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">Q{idx + 1}: {test.question}</p>
                                <div className="mt-2 space-y-1">
                                  {test.options.map((opt, optIdx) => (
                                    <p key={optIdx} className={`text-sm ${optIdx === test.correct_answer ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                      {optIdx === test.correct_answer ? '✓' : '○'} {opt}
                                    </p>
                                  ))}
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveTest(test.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Question */}
                    <Card className="border-dashed">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Add Quiz Question</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Question *</Label>
                          <Input 
                            value={testForm.question} 
                            onChange={(e) => setTestForm(prev => ({ ...prev, question: e.target.value }))}
                            placeholder="e.g., What is the purpose of a P&L statement?"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Answer Options *</Label>
                          {testForm.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="correct_answer"
                                checked={testForm.correct_answer === idx}
                                onChange={() => setTestForm(prev => ({ ...prev, correct_answer: idx }))}
                              />
                              <Input 
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...testForm.options];
                                  newOptions[idx] = e.target.value;
                                  setTestForm(prev => ({ ...prev, options: newOptions }));
                                }}
                                placeholder={`Option ${idx + 1}`}
                              />
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground">Select the radio button next to the correct answer</p>
                        </div>
                        <div className="space-y-2">
                          <Label>Explanation (optional)</Label>
                          <Input 
                            value={testForm.explanation} 
                            onChange={(e) => setTestForm(prev => ({ ...prev, explanation: e.target.value }))}
                            placeholder="Explain why this is the correct answer"
                          />
                        </div>
                        <Button onClick={handleAddTest} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Question
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch checked={courseForm.is_published} onCheckedChange={(v) => handleCourseFormChange('is_published', v)} />
                <Label>Publish course</Label>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveCourse} disabled={savingCourse}>
                  {savingCourse && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lab Dialog */}
        <Dialog open={labDialogOpen} onOpenChange={setLabDialogOpen}>
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
              
              {/* Banner Image Upload */}
              <div className="space-y-2">
                <Label>Lab Banner Image</Label>
                <div className="flex items-center gap-4">
                  {labForm.thumbnail_url && (
                    <img src={labForm.thumbnail_url} alt="Banner" className="w-24 h-16 object-cover rounded" />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'thumbnail_url', setLabForm)}
                    disabled={uploadingImage}
                  />
                </div>
                {uploadingImage && <Progress value={uploadProgress} className="h-2" />}
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

        {/* Workshop Dialog */}
        <Dialog open={workshopDialogOpen} onOpenChange={setWorkshopDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Workshop</DialogTitle>
              <DialogDescription>Create a workshop with optional recording</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={workshopForm.title} onChange={(e) => handleWorkshopFormChange('title', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={workshopForm.description} onChange={(e) => handleWorkshopFormChange('description', e.target.value)} rows={3} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Leader/Speaker</Label>
                  <Input value={workshopForm.leader} onChange={(e) => handleWorkshopFormChange('leader', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input value={workshopForm.company} onChange={(e) => handleWorkshopFormChange('company', e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={workshopForm.date} onChange={(e) => handleWorkshopFormChange('date', e.target.value)} />
              </div>
              
              {/* Workshop Banner Image */}
              <div className="space-y-2">
                <Label>Workshop Banner Image</Label>
                <div className="flex items-center gap-4">
                  {workshopForm.image_url && (
                    <img src={workshopForm.image_url} alt="Banner" className="w-24 h-16 object-cover rounded" />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'image_url', setWorkshopForm)}
                    disabled={uploadingImage}
                  />
                </div>
                {uploadingImage && <Progress value={uploadProgress} className="h-2" />}
              </div>

              {/* Workshop Recording */}
              <div className="space-y-2">
                <Label>Workshop Recording (Video)</Label>
                <div className="flex items-center gap-4">
                  {workshopForm.recording_url && (
                    <Badge className="bg-green-100 text-green-700">
                      <Video className="w-3 h-3 mr-1" />
                      Recording uploaded
                    </Badge>
                  )}
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setUploadingVideo(true);
                      try {
                        const result = await uploadVideo(file, (progress) => setVideoProgress(progress));
                        setWorkshopForm(prev => ({ ...prev, recording_url: result.url }));
                        toast.success('Recording uploaded');
                      } catch (error) {
                        toast.error('Failed to upload recording');
                      } finally {
                        setUploadingVideo(false);
                      }
                    }}
                    disabled={uploadingVideo}
                  />
                </div>
                {uploadingVideo && <Progress value={videoProgress} className="h-2" />}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Publish</Label>
                  <p className="text-sm text-muted-foreground">Make visible to learners</p>
                </div>
                <Switch checked={workshopForm.is_published} onCheckedChange={(v) => handleWorkshopFormChange('is_published', v)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setWorkshopDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveWorkshop} disabled={savingWorkshop}>
                {savingWorkshop && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Workshop
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TrainerDashboard;
