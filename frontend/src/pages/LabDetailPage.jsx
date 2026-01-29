import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getLabBySlug, completeLab } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Clock, Users, ArrowLeft, CheckCircle, Beaker, 
  Loader2, Code, Lightbulb, Target, Award
} from 'lucide-react';
import { toast } from 'sonner';

const LabDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchLab = async () => {
      try {
        const data = await getLabBySlug(slug);
        setLab(data);
      } catch (error) {
        console.error('Failed to fetch lab:', error);
        if (error.response?.status === 404) {
          navigate('/labs');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLab();
  }, [slug, navigate]);

  const handleStepComplete = (stepIndex) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
      if (stepIndex < (lab?.steps?.length || 0) - 1) {
        setCurrentStep(stepIndex + 1);
      }
    }
  };

  const handleLabComplete = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setCompleting(true);
    try {
      await completeLab(lab.id);
      setLab({ ...lab, is_completed: true });
      toast.success('Congratulations! Lab completed!');
    } catch (error) {
      toast.error('Failed to mark lab as complete');
    } finally {
      setCompleting(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
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

  const progress = lab?.steps?.length ? (completedSteps.length / lab.steps.length) * 100 : 0;
  const allStepsCompleted = lab?.steps?.length && completedSteps.length === lab.steps.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-heading font-bold mb-4">Lab not found</h1>
        <Button onClick={() => navigate('/labs')}>Browse Labs</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link 
            to="/labs" 
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-6 transition-colors"
            data-testid="back-to-labs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Labs
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              {lab.technology}
            </Badge>
            <Badge className={getDifficultyColor(lab.difficulty)}>
              {lab.difficulty}
            </Badge>
            <Badge variant="outline" className="border-slate-600 text-slate-300">
              {lab.category}
            </Badge>
          </div>
          
          <h1 className="font-heading font-bold text-3xl sm:text-4xl mb-4" data-testid="lab-title">
            {lab.title}
          </h1>
          
          <p className="text-slate-300 text-lg max-w-3xl mb-6">
            {lab.short_description}
          </p>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-300">
            <span className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {lab.estimated_time_minutes} minutes
            </span>
            <span className="flex items-center gap-2">
              <Code className="w-5 h-5" />
              {lab.steps?.length || 0} steps
            </span>
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {lab.completions_count} completions
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section>
              <h2 className="font-heading font-semibold text-2xl mb-4">About This Lab</h2>
              <p className="text-muted-foreground leading-relaxed">{lab.description}</p>
            </section>

            {/* Prerequisites */}
            {lab.prerequisites?.length > 0 && (
              <section>
                <h2 className="font-heading font-semibold text-xl mb-4">Prerequisites</h2>
                <ul className="space-y-2">
                  {lab.prerequisites.map((prereq, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      {prereq}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Steps */}
            {lab.steps?.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading font-semibold text-2xl">Lab Steps</h2>
                  <span className="text-sm text-muted-foreground">
                    {completedSteps.length} / {lab.steps.length} completed
                  </span>
                </div>
                
                <div className="mb-6">
                  <Progress value={progress} className="h-2" />
                </div>
                
                <Accordion 
                  type="single" 
                  collapsible 
                  value={`step-${currentStep}`}
                  onValueChange={(val) => setCurrentStep(parseInt(val?.replace('step-', '') || '0'))}
                  className="space-y-3"
                >
                  {lab.steps.map((step, index) => (
                    <AccordionItem 
                      key={index} 
                      value={`step-${index}`}
                      className={`bg-white border rounded-xl px-6 ${
                        completedSteps.includes(index) ? 'border-green-200 bg-green-50/30' : ''
                      }`}
                    >
                      <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-4 text-left">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                            completedSteps.includes(index) 
                              ? 'bg-green-500 text-white' 
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {completedSteps.includes(index) ? <CheckCircle className="w-4 h-4" /> : index + 1}
                          </span>
                          <div>
                            <p className="font-medium">{step.title}</p>
                            <p className="text-sm text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 pl-12">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4 text-primary" />
                              Instructions
                            </h4>
                            <p className="text-muted-foreground bg-slate-50 p-4 rounded-lg">
                              {step.instructions}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Expected Outcome</h4>
                            <p className="text-muted-foreground">{step.expected_outcome}</p>
                          </div>
                          
                          {step.hints?.length > 0 && (
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-500" />
                                Hints
                              </h4>
                              <ul className="space-y-1">
                                {step.hints.map((hint, hIdx) => (
                                  <li key={hIdx} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-yellow-500">•</span>
                                    {hint}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {!completedSteps.includes(index) && (
                            <Button 
                              onClick={() => handleStepComplete(index)}
                              className="mt-4"
                              data-testid={`complete-step-${index}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Complete
                            </Button>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                {lab.is_completed ? (
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Lab Completed!</h3>
                    <p className="text-sm text-muted-foreground">
                      Great work! You've mastered this lab.
                    </p>
                  </div>
                ) : allStepsCompleted ? (
                  <Button 
                    className="w-full h-12 rounded-full bg-green-500 hover:bg-green-600"
                    onClick={handleLabComplete}
                    disabled={completing}
                    data-testid="complete-lab"
                  >
                    {completing ? (
                      <>
                        <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <Award className="mr-2 w-5 h-5" />
                        Complete Lab
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    className="w-full h-12 rounded-full"
                    onClick={() => setCurrentStep(completedSteps.length)}
                    data-testid="continue-lab"
                  >
                    <Beaker className="mr-2 w-5 h-5" />
                    {completedSteps.length === 0 ? 'Start Lab' : 'Continue'}
                  </Button>
                )}
                
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
                
                {/* Skills Gained */}
                {lab.skills_gained?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Skills You'll Gain</h4>
                    <div className="flex flex-wrap gap-2">
                      {lab.skills_gained.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabDetailPage;
