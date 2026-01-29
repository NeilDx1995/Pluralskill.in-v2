import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getLabBySlug, executeLabCode, saveLabProgress, getLabProgress, completeLab } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Play, CheckCircle, Circle, Loader2, 
  Terminal, Code, Upload, Lightbulb, ChevronRight,
  ChevronLeft, Award, RotateCcw, Copy, Check
} from 'lucide-react';
import { toast } from 'sonner';

const LabPracticePage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [completing, setCompleting] = useState(false);
  
  // Code editor state
  const [code, setCode] = useState('');
  const [output, setOutput] = useState([]);
  const [activeTab, setActiveTab] = useState('terminal');
  const [copied, setCopied] = useState(false);
  
  const outputRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [labData, progressData] = await Promise.all([
        getLabBySlug(slug),
        getLabProgress(slug).catch(() => ({ completed_steps: [] }))
      ]);
      
      setLab(labData);
      setCompletedSteps(progressData.completed_steps || []);
      
      // Set initial code from first step
      if (labData.steps?.length > 0) {
        setCode(labData.steps[0].code_template || '');
      }
    } catch (error) {
      console.error('Failed to fetch lab:', error);
      if (error.response?.status === 404) {
        navigate('/labs');
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

  useEffect(() => {
    // Update code when step changes
    if (lab?.steps?.[currentStepIndex]) {
      setCode(lab.steps[currentStepIndex].code_template || '');
      setOutput([]);
    }
  }, [currentStepIndex, lab]);

  useEffect(() => {
    // Scroll to bottom of output
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const currentStep = lab?.steps?.[currentStepIndex];
  const progress = lab?.steps?.length ? (completedSteps.length / lab.steps.length) * 100 : 0;
  const allStepsCompleted = lab?.steps?.length && completedSteps.length === lab.steps.length;

  const addOutput = (text, type = 'output') => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput(prev => [...prev, { text, type, timestamp }]);
  };

  const handleExecute = async () => {
    if (!code.trim()) {
      toast.error('Please enter some code to execute');
      return;
    }

    setExecuting(true);
    addOutput(`$ Executing ${currentStep?.title || 'code'}...`, 'command');

    try {
      const result = await executeLabCode(
        lab.id, 
        currentStep.id, 
        code,
        lab.technology.toLowerCase().includes('python') ? 'python' : 
        lab.technology.toLowerCase().includes('sql') ? 'sql' : 'terminal'
      );

      if (result.success) {
        addOutput(result.output, 'success');
        
        if (result.step_complete && !completedSteps.includes(currentStep.id)) {
          setCompletedSteps(prev => [...prev, currentStep.id]);
          await saveLabProgress(lab.id, currentStep.id);
          toast.success('Step completed! 🎉');
        }
      } else {
        addOutput(result.error || 'Execution failed', 'error');
      }

      if (result.hints?.length > 0) {
        result.hints.forEach(hint => addOutput(`💡 Hint: ${hint}`, 'hint'));
      }
    } catch (error) {
      addOutput(`Error: ${error.response?.data?.detail || error.message}`, 'error');
    } finally {
      setExecuting(false);
    }
  };

  const handleReset = () => {
    setCode(currentStep?.code_template || '');
    setOutput([]);
    toast.info('Code reset to template');
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNextStep = () => {
    if (currentStepIndex < (lab?.steps?.length || 0) - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleCompleteLab = async () => {
    setCompleting(true);
    try {
      await completeLab(lab.id);
      toast.success('🎉 Congratulations! Lab completed!');
      navigate('/labs');
    } catch (error) {
      toast.error('Failed to complete lab');
    } finally {
      setCompleting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to={`/labs/${slug}`}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-semibold">{lab.title}</h1>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                  {lab.technology}
                </Badge>
                <span>•</span>
                <span>Step {currentStepIndex + 1} of {lab.steps?.length || 0}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-32">
              <Progress value={progress} className="h-2" />
            </div>
            <span className="text-sm text-slate-400">{Math.round(progress)}%</span>
            
            {allStepsCompleted && (
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleCompleteLab}
                disabled={completing}
              >
                {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4 mr-2" />}
                Complete Lab
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Instructions */}
        <div className="w-1/2 border-r border-slate-800 flex flex-col">
          {/* Step Navigation */}
          <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lab.steps?.map((step, idx) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                    completedSteps.includes(step.id)
                      ? 'bg-green-600 text-white'
                      : idx === currentStepIndex
                        ? 'bg-primary text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}
                  data-testid={`step-nav-${idx}`}
                >
                  {completedSteps.includes(step.id) ? <Check className="w-4 h-4" /> : idx + 1}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handlePrevStep}
                disabled={currentStepIndex === 0}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNextStep}
                disabled={currentStepIndex >= (lab.steps?.length || 0) - 1}
                className="text-slate-400 hover:text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Step Content */}
          <ScrollArea className="flex-1 p-6">
            {currentStep && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      completedSteps.includes(currentStep.id)
                        ? 'bg-green-600'
                        : 'bg-primary'
                    }`}>
                      {completedSteps.includes(currentStep.id) ? <CheckCircle className="w-5 h-5" /> : currentStepIndex + 1}
                    </span>
                    <h2 className="text-xl font-semibold">{currentStep.title}</h2>
                  </div>
                  <p className="text-slate-400">{currentStep.description}</p>
                </div>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-slate-200">📋 Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-300 whitespace-pre-wrap">{currentStep.instructions}</p>
                  </CardContent>
                </Card>

                {currentStep.expected_output && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-slate-200">🎯 Expected Output</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300">{currentStep.expected_output}</p>
                    </CardContent>
                  </Card>
                )}

                {currentStep.hints?.length > 0 && (
                  <Card className="bg-amber-900/30 border-amber-700/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-amber-200 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4" />
                        Hints
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {currentStep.hints.map((hint, idx) => (
                          <li key={idx} className="text-amber-200/80 text-sm flex items-start gap-2">
                            <span>•</span>
                            {hint}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Panel - Code Editor & Terminal */}
        <div className="w-1/2 flex flex-col">
          {/* Editor Tabs */}
          <div className="bg-slate-900 border-b border-slate-800">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between px-4">
                <TabsList className="bg-transparent border-b-0 h-auto p-0">
                  <TabsTrigger 
                    value="terminal" 
                    className="data-[state=active]:bg-slate-800 rounded-b-none px-4 py-2"
                  >
                    <Terminal className="w-4 h-4 mr-2" />
                    Terminal
                  </TabsTrigger>
                  <TabsTrigger 
                    value="code" 
                    className="data-[state=active]:bg-slate-800 rounded-b-none px-4 py-2"
                  >
                    <Code className="w-4 h-4 mr-2" />
                    Code Editor
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCopyCode}
                    className="text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleReset}
                    className="text-slate-400 hover:text-white"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Tabs>
          </div>

          {/* Code Input */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              <Textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full resize-none bg-slate-950 border-0 rounded-none font-mono text-sm text-green-400 focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                placeholder={`Enter your ${lab.technology} code here...`}
                spellCheck={false}
                data-testid="code-editor"
              />
            </div>

            {/* Execute Button */}
            <div className="bg-slate-900 border-t border-slate-800 p-3 flex items-center justify-between">
              <Button 
                onClick={handleExecute}
                disabled={executing}
                className="bg-green-600 hover:bg-green-700"
                data-testid="run-code-btn"
              >
                {executing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Code
                  </>
                )}
              </Button>
              
              {completedSteps.includes(currentStep?.id) && (
                <Badge className="bg-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Step Complete
                </Badge>
              )}
            </div>
          </div>

          {/* Output Console */}
          <div className="h-1/3 bg-black border-t border-slate-800">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900">
              <Terminal className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Output Console</span>
            </div>
            <ScrollArea className="h-[calc(100%-36px)]" ref={outputRef}>
              <div className="p-4 font-mono text-sm space-y-1">
                {output.length === 0 ? (
                  <p className="text-slate-500">Output will appear here when you run your code...</p>
                ) : (
                  output.map((line, idx) => (
                    <div 
                      key={idx} 
                      className={`whitespace-pre-wrap ${
                        line.type === 'command' ? 'text-blue-400' :
                        line.type === 'success' ? 'text-green-400' :
                        line.type === 'error' ? 'text-red-400' :
                        line.type === 'hint' ? 'text-amber-400' :
                        'text-slate-300'
                      }`}
                    >
                      {line.type === 'command' && <span className="text-slate-500">[{line.timestamp}] </span>}
                      {line.text}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabPracticePage;
