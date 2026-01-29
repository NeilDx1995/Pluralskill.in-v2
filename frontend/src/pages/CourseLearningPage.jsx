import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  getCourseBySlug, getCourseProgress, markModuleComplete, submitQuiz,
  getCourseAssignments, submitAssignment, getMyCertificates
} from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, Play, CheckCircle, Circle, Clock, Award, FileText,
  Upload, Loader2, AlertCircle, Trophy, Download, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const CourseLearningPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('modules');
  const [selectedModule, setSelectedModule] = useState(null);
  const [completingModule, setCompletingModule] = useState(false);
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [showQuizResultDialog, setShowQuizResultDialog] = useState(false);
  
  // Assignment state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  
  // Certificate state
  const [certificate, setCertificate] = useState(null);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [courseData, progressData, assignmentsData] = await Promise.all([
        getCourseBySlug(slug),
        getCourseProgress(slug).catch(() => null),
        getCourseAssignments(slug).catch(() => [])
      ]);
      
      setCourse(courseData);
      
      if (progressData) {
        setProgress(progressData);
        if (progressData.certificate) {
          setCertificate(progressData.certificate);
        }
      }
      
      setAssignments(assignmentsData);
      
      // Select first module by default
      if (courseData.modules?.length > 0) {
        setSelectedModule(courseData.modules[0]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (error.response?.status === 403) {
        navigate('/courses');
        toast.error('Please enroll in this course first');
      }
    } finally {
      setLoading(false);
    }
  }, [slug, navigate]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      fetchData();
    }
  }, [isAuthenticated, authLoading, navigate, fetchData]);

  const isModuleCompleted = (moduleId) => {
    if (!progress?.modules_progress) return false;
    return progress.modules_progress.some(m => m.module_id === moduleId && m.completed);
  };

  const handleMarkComplete = async () => {
    if (!selectedModule) return;
    
    setCompletingModule(true);
    try {
      const result = await markModuleComplete(course.id, selectedModule.id, 30);
      toast.success('Module marked as complete!');
      
      if (result.certificate_issued && result.certificate) {
        setCertificate(result.certificate);
        setShowCertificateDialog(true);
      }
      
      // Refresh progress
      await fetchData();
      
      // Auto-select next module
      const currentIndex = course.modules.findIndex(m => m.id === selectedModule.id);
      if (currentIndex < course.modules.length - 1) {
        setSelectedModule(course.modules[currentIndex + 1]);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to mark complete');
    } finally {
      setCompletingModule(false);
    }
  };

  const handleQuizSubmit = async () => {
    const totalQuestions = course.tests?.length || 0;
    const answeredQuestions = Object.keys(quizAnswers).length;
    
    if (answeredQuestions < totalQuestions) {
      toast.error(`Please answer all questions (${answeredQuestions}/${totalQuestions} answered)`);
      return;
    }
    
    setSubmittingQuiz(true);
    try {
      const result = await submitQuiz(course.id, quizAnswers);
      setQuizResult(result);
      setShowQuizResultDialog(true);
      
      if (result.certificate_issued && result.certificate) {
        setCertificate(result.certificate);
      }
      
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit quiz');
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!assignmentFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setSubmittingAssignment(true);
    try {
      await submitAssignment(selectedAssignment.id, assignmentFile, assignmentNotes);
      toast.success('Assignment submitted successfully!');
      setShowAssignmentDialog(false);
      setAssignmentFile(null);
      setAssignmentNotes('');
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit assignment');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  if (authLoading || loading) {
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
        <Button onClick={() => navigate('/my-courses')}>Go to My Courses</Button>
      </div>
    );
  }

  const overallProgress = progress?.overall_progress || 0;
  const quizPassed = progress?.quiz_progress?.passed;
  const quizBestScore = progress?.quiz_progress?.best_score || 0;
  const attemptsUsed = progress?.quiz_progress?.attempts?.length || 0;
  const attemptsRemaining = 2 - attemptsUsed;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link 
            to="/my-courses" 
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Courses
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="font-heading font-bold text-2xl" data-testid="learning-course-title">
                {course.title}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {course.duration_hours} hours
                </span>
                <Badge variant="outline" className="border-slate-600 text-slate-300">
                  {course.level}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-slate-400">Progress</p>
                <p className="text-2xl font-bold">{Math.round(overallProgress)}%</p>
              </div>
              <div className="w-32">
                <Progress value={overallProgress} className="h-3" />
              </div>
              
              {certificate && (
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setShowCertificateDialog(true)}
                  className="gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  View Certificate
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="modules" data-testid="tab-modules">
              Modules ({course.modules?.length || 0})
            </TabsTrigger>
            {course.tests?.length > 0 && (
              <TabsTrigger value="quiz" data-testid="tab-quiz">
                Quiz {quizPassed && <CheckCircle className="w-4 h-4 ml-1 text-green-500" />}
              </TabsTrigger>
            )}
            {assignments.length > 0 && (
              <TabsTrigger value="assignments" data-testid="tab-assignments">
                Assignments ({assignments.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* Modules Tab */}
          <TabsContent value="modules">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Module List */}
              <div className="space-y-2">
                <h3 className="font-semibold mb-4">Course Content</h3>
                {course.modules?.map((module, index) => {
                  const completed = isModuleCompleted(module.id);
                  const isActive = selectedModule?.id === module.id;
                  
                  return (
                    <button
                      key={module.id}
                      onClick={() => setSelectedModule(module)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      data-testid={`module-item-${index}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${completed ? 'text-green-700' : ''}`}>
                            {index + 1}. {module.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {module.duration_minutes} min
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Module Content */}
              <div className="lg:col-span-2">
                {selectedModule ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedModule.title}</CardTitle>
                      <CardDescription>{selectedModule.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Video Player */}
                      {selectedModule.video_url ? (
                        <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden">
                          <video
                            src={selectedModule.video_url}
                            controls
                            className="w-full h-full"
                            data-testid="module-video"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center">
                          <div className="text-center text-muted-foreground">
                            <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Video content coming soon</p>
                          </div>
                        </div>
                      )}

                      {/* Mark Complete Button */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          {isModuleCompleted(selectedModule.id) ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <span className="text-green-700 font-medium">Completed</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              Mark this module as complete when you're done
                            </span>
                          )}
                        </div>
                        
                        {!isModuleCompleted(selectedModule.id) && (
                          <Button 
                            onClick={handleMarkComplete}
                            disabled={completingModule}
                            data-testid="mark-complete-btn"
                          >
                            {completingModule ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mark as Complete
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground">Select a module to begin</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Quiz Tab */}
          {course.tests?.length > 0 && (
            <TabsContent value="quiz">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Course Quiz</CardTitle>
                      <CardDescription>
                        Pass with 80% or higher to earn your certificate. 
                        {attemptsRemaining > 0 
                          ? ` You have ${attemptsRemaining} attempt(s) remaining.`
                          : ' No attempts remaining.'}
                      </CardDescription>
                    </div>
                    {quizPassed && (
                      <Badge className="bg-green-100 text-green-700 gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Passed ({quizBestScore.toFixed(0)}%)
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {quizPassed ? (
                    <div className="text-center py-8">
                      <Trophy className="w-16 h-16 mx-auto text-yellow-500 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Quiz Completed!</h3>
                      <p className="text-muted-foreground mb-4">
                        Your best score: {quizBestScore.toFixed(0)}%
                      </p>
                      {certificate && (
                        <Button onClick={() => setShowCertificateDialog(true)}>
                          <Award className="w-4 h-4 mr-2" />
                          View Certificate
                        </Button>
                      )}
                    </div>
                  ) : attemptsRemaining > 0 ? (
                    <div className="space-y-8">
                      {course.tests.map((test, index) => (
                        <div key={test.id} className="space-y-4">
                          <h4 className="font-medium">
                            {index + 1}. {test.question}
                          </h4>
                          <RadioGroup
                            value={quizAnswers[test.id]?.toString()}
                            onValueChange={(value) => 
                              setQuizAnswers(prev => ({ ...prev, [test.id]: parseInt(value) }))
                            }
                          >
                            {test.options.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-3">
                                <RadioGroupItem 
                                  value={optIndex.toString()} 
                                  id={`q${index}-opt${optIndex}`}
                                  data-testid={`quiz-option-${index}-${optIndex}`}
                                />
                                <Label htmlFor={`q${index}-opt${optIndex}`} className="cursor-pointer">
                                  {option}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        </div>
                      ))}
                      
                      <div className="flex items-center justify-between pt-6 border-t">
                        <p className="text-sm text-muted-foreground">
                          {Object.keys(quizAnswers).length} of {course.tests.length} questions answered
                        </p>
                        <Button 
                          onClick={handleQuizSubmit}
                          disabled={submittingQuiz}
                          data-testid="submit-quiz-btn"
                        >
                          {submittingQuiz ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            'Submit Quiz'
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Attempts Remaining</h3>
                      <p className="text-muted-foreground">
                        Your best score was {quizBestScore.toFixed(0)}%. 
                        Contact support if you need additional attempts.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Assignments Tab */}
          {assignments.length > 0 && (
            <TabsContent value="assignments">
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const hasSubmission = assignment.submission;
                  const isGraded = assignment.submission?.grade !== null;
                  
                  return (
                    <Card key={assignment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <FileText className="w-5 h-5 text-primary" />
                              <h3 className="font-semibold">{assignment.title}</h3>
                              {assignment.is_required && (
                                <Badge variant="outline">Required</Badge>
                              )}
                              {hasSubmission && (
                                <Badge className={isGraded ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                                  {isGraded ? `Graded: ${assignment.submission.grade}/${assignment.max_score}` : 'Submitted'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-muted-foreground mb-4">{assignment.description}</p>
                            
                            {hasSubmission && assignment.submission.feedback && (
                              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                                <p className="text-sm font-medium mb-1">Instructor Feedback:</p>
                                <p className="text-sm text-muted-foreground">{assignment.submission.feedback}</p>
                              </div>
                            )}
                          </div>
                          
                          <div>
                            {!hasSubmission ? (
                              <Button
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setShowAssignmentDialog(true);
                                }}
                                data-testid={`submit-assignment-${assignment.id}`}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Submit
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" asChild>
                                <a href={assignment.submission.file_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  View Submission
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Quiz Result Dialog */}
      <Dialog open={showQuizResultDialog} onOpenChange={setShowQuizResultDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {quizResult?.passed ? '🎉 Congratulations!' : 'Quiz Results'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className={`text-5xl font-bold mb-4 ${quizResult?.passed ? 'text-green-600' : 'text-red-600'}`}>
              {quizResult?.score?.toFixed(0)}%
            </div>
            <p className="text-muted-foreground mb-4">
              You got {quizResult?.correct_answers} out of {quizResult?.total_questions} questions correct.
            </p>
            {quizResult?.passed ? (
              <p className="text-green-600 font-medium">
                You passed the quiz! {quizResult?.certificate_issued && 'Your certificate has been issued.'}
              </p>
            ) : (
              <p className="text-muted-foreground">
                You need 80% to pass. {quizResult?.attempts_remaining > 0 
                  ? `You have ${quizResult.attempts_remaining} attempt(s) remaining.`
                  : 'No attempts remaining.'}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowQuizResultDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assignment Submit Dialog */}
      <Dialog open={showAssignmentDialog} onOpenChange={setShowAssignmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Instructions</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedAssignment?.instructions}
              </p>
            </div>
            <div>
              <Label htmlFor="assignment-file">Upload File</Label>
              <Input
                id="assignment-file"
                type="file"
                onChange={(e) => setAssignmentFile(e.target.files[0])}
                className="mt-1"
                data-testid="assignment-file-input"
              />
            </div>
            <div>
              <Label htmlFor="assignment-notes">Notes (Optional)</Label>
              <Textarea
                id="assignment-notes"
                value={assignmentNotes}
                onChange={(e) => setAssignmentNotes(e.target.value)}
                placeholder="Add any notes for your instructor..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignmentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignmentSubmit} disabled={submittingAssignment}>
              {submittingAssignment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Certificate Dialog */}
      <Dialog open={showCertificateDialog} onOpenChange={setShowCertificateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Certificate of Completion
            </DialogTitle>
          </DialogHeader>
          {certificate && (
            <div className="py-6">
              <div className="border-4 border-double border-primary/20 p-8 rounded-lg text-center bg-gradient-to-b from-white to-slate-50">
                <div className="text-xs text-muted-foreground mb-4">CERTIFICATE OF COMPLETION</div>
                <Award className="w-16 h-16 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-heading font-bold mb-2">
                  {certificate.user_name}
                </h2>
                <p className="text-muted-foreground mb-4">
                  has successfully completed
                </p>
                <h3 className="text-xl font-semibold text-primary mb-4">
                  {certificate.course_title}
                </h3>
                <div className="flex justify-center gap-8 text-sm text-muted-foreground mb-4">
                  <div>
                    <p className="font-medium">Quiz Score</p>
                    <p>{certificate.quiz_score?.toFixed(0) || 'N/A'}%</p>
                  </div>
                  <div>
                    <p className="font-medium">Issue Date</p>
                    <p>{new Date(certificate.issued_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground border-t pt-4">
                  Certificate ID: {certificate.certificate_number}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCertificateDialog(false)}>
              Close
            </Button>
            <Button asChild>
              <a 
                href={`/certificates/verify/${certificate?.certificate_number}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Verify Online
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseLearningPage;
