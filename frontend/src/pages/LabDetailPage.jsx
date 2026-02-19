import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getLabBySlug, completeLab } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock, Users, ArrowLeft, CheckCircle, Play,
  Loader2, Code, Lightbulb, RotateCcw, Award, Target
} from 'lucide-react';
import { toast } from 'sonner';
import SEOHead from '@/components/SEOHead';

const LabDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [userCode, setUserCode] = useState('');
  const [output, setOutput] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const fetchLab = async () => {
      try {
        const data = await getLabBySlug(slug);
        setLab(data);
        if (data.steps && data.steps.length > 0) {
          setUserCode(data.steps[0].code_template || '');
        }
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

  // Update code template when step changes
  useEffect(() => {
    if (lab && lab.steps && lab.steps[currentStep]) {
      setUserCode(lab.steps[currentStep].code_template || '');
      setOutput(''); // Clear output on step change
    }
  }, [currentStep, lab]);

  const handleRunCode = () => {
    // Simulate code execution
    setOutput('Running code...\n\n');
    setTimeout(() => {
      if (lab && lab.steps && lab.steps[currentStep]) {
        const expected = lab.steps[currentStep].expected_output;
        if (expected) {
          setOutput((prev) => prev + `> ${expected}\n\n✅ Execution Successful`);
          // Auto-complete step if it matches (mock validation)
          if (!completedSteps.includes(currentStep)) {
            setCompletedSteps(prev => [...prev, currentStep]);
            toast.success("Step completed!");
          }
        } else {
          setOutput((prev) => prev + "> No expected output defined.\nStep marked as complete.");
          if (!completedSteps.includes(currentStep)) {
            setCompletedSteps(prev => [...prev, currentStep]);
          }
        }
      }
    }, 800);
  };

  const handleStepClick = (index) => {
    setCurrentStep(index);
  };

  const handleLabComplete = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
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

  const progress = lab?.steps?.length ? (completedSteps.length / lab.steps.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lab) return null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <SEOHead
        title={lab.title}
        description={lab.short_description}
        url={`/labs/${slug}`}
      />

      {/* Top Bar */}
      <header className="h-14 border-b bg-slate-900 text-white flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/labs" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-semibold truncate max-w-md">{lab.title}</h1>
          <Badge variant="outline" className="border-slate-600 text-slate-300 hidden sm:inline-flex">
            {lab.difficulty}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-xs text-slate-400">Progress</span>
            <div className="w-32 h-2 bg-slate-800 rounded-full mt-1">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          {progress === 100 && !lab.is_completed && (
            <Button
              size="sm"
              onClick={handleLabComplete}
              disabled={completing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {completing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Finish Lab"}
            </Button>
          )}
          {lab.is_completed && (
            <Badge className="bg-green-500 text-white">
              <Award className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </header>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Instructions */}
        <div className="w-1/3 min-w-[350px] border-r border-border bg-card flex flex-col">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-8">
              {/* Step List */}
              <div className="space-y-1">
                <h3 className="font-heading font-semibold mb-4 text-lg">Steps</h3>
                {lab.steps.map((step, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStepClick(idx)}
                    className={`w-full text-left px-4 py-3 rounded-lg flex items-start gap-3 transition-colors ${currentStep === idx
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${completedSteps.includes(idx)
                      ? 'bg-green-500 border-green-500 text-white'
                      : currentStep === idx
                        ? 'border-primary text-primary'
                        : 'border-slate-400 text-slate-400'
                      }`}>
                      {completedSteps.includes(idx) ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="text-xs">{idx + 1}</span>}
                    </div>
                    <div>
                      <span className={`text-sm font-medium block ${currentStep === idx ? 'text-primary' : ''}`}>
                        {step.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Current Step Content */}
              <div className="border-t pt-6">
                <h2 className="font-heading font-bold text-xl mb-2">
                  {lab.steps[currentStep].title}
                </h2>
                <p className="text-muted-foreground mb-4">
                  {lab.steps[currentStep].description}
                </p>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6 border border-blue-100 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" /> Instructions
                  </h4>
                  <p className="text-sm text-blue-900 dark:text-blue-100 leading-relaxed">
                    {lab.steps[currentStep].instructions}
                  </p>
                </div>

                {lab.steps[currentStep].hints && lab.steps[currentStep].hints.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm">
                      <Lightbulb className="w-4 h-4 text-yellow-500" /> Hints
                    </h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {lab.steps[currentStep].hints.map((hint, hIdx) => (
                        <li key={hIdx}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          {/* Bottom Navigation */}
          <div className="p-4 border-t bg-card/50 backdrop-blur-sm flex justify-between items-center">
            <Button
              variant="ghost"
              disabled={currentStep === 0}
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={currentStep === lab.steps.length - 1}
              onClick={() => setCurrentStep(prev => prev + 1)}
            >
              Next Step
            </Button>
          </div>
        </div>

        {/* Right Panel: Code Environment */}
        <div className="flex-1 flex flex-col bg-[#1e1e1e] text-white">
          {/* Toolbar */}
          <div className="h-10 border-b border-[#333] flex items-center px-4 justify-between bg-[#252526]">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Code className="w-4 h-4" />
              <span>main.py</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs hover:bg-[#333] text-slate-300"
                onClick={() => {
                  setUserCode(lab.steps[currentStep].code_template || '');
                  setOutput('');
                }}
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white border-0"
                onClick={handleRunCode}
              >
                <Play className="w-3.5 h-3.5 mr-1" /> Run Code
              </Button>
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col">
            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] p-4 font-mono text-sm resize-none focus:outline-none"
              spellCheck="false"
              placeholder="# Write your code here..."
            />

            {/* Terminal / Output */}
            <div className="h-1/3 border-t border-[#333] flex flex-col bg-[#1e1e1e]">
              <div className="px-4 py-2 bg-[#252526] text-xs font-semibold text-slate-400 border-b border-[#333]">
                Terminal Output
              </div>
              <ScrollArea className="flex-1 p-4 font-mono text-sm">
                <pre className="text-slate-300 whitespace-pre-wrap">{output || 'Ready to execute...'}</pre>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabDetailPage;
