import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getLearningPaths, generateLearningPath, getLearningPath } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Sparkles, Route, ExternalLink, Clock, BookOpen, 
  Loader2, ArrowRight, Youtube, FileText, Github, 
  GraduationCap, Search, Plus
} from 'lucide-react';
import { toast } from 'sonner';

const OpenSourcePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPath, setSelectedPath] = useState(null);
  const [viewingPath, setViewingPath] = useState(false);
  
  const [formData, setFormData] = useState({
    skill_name: '',
    industry: '',
    current_level: 'beginner'
  });

  const industries = [
    'Finance & Banking',
    'HR & People Operations',
    'Retail & E-commerce',
    'Supply Chain & Logistics',
    'Healthcare',
    'Technology',
    'Marketing',
    'Cross-Industry'
  ];

  const levels = ['beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    fetchPaths();
  }, []);

  const fetchPaths = async () => {
    try {
      const data = await getLearningPaths();
      setPaths(data);
    } catch (error) {
      console.error('Failed to fetch paths:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.skill_name || !formData.industry) {
      toast.error('Please fill in all fields');
      return;
    }

    setGenerating(true);
    try {
      const newPath = await generateLearningPath(
        formData.skill_name,
        formData.industry,
        formData.current_level
      );
      setPaths([newPath, ...paths]);
      setDialogOpen(false);
      setFormData({ skill_name: '', industry: '', current_level: 'beginner' });
      toast.success('Learning path generated!');
      setSelectedPath(newPath);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to generate path');
    } finally {
      setGenerating(false);
    }
  };

  const viewPath = async (pathId) => {
    setViewingPath(true);
    try {
      const path = await getLearningPath(pathId);
      setSelectedPath(path);
    } catch (error) {
      toast.error('Failed to load path');
    } finally {
      setViewingPath(false);
    }
  };

  const getResourceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'video':
        return Youtube;
      case 'github':
        return Github;
      case 'documentation':
        return FileText;
      case 'article':
        return FileText;
      default:
        return BookOpen;
    }
  };

  const getResourceColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'video':
        return 'bg-red-100 text-red-600';
      case 'github':
        return 'bg-slate-100 text-slate-700';
      case 'documentation':
        return 'bg-blue-100 text-blue-600';
      case 'article':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-primary to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Route className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl">
                Open Source Learning Paths
              </h1>
              <p className="text-indigo-100">AI-Powered Skill Roadmaps</p>
            </div>
          </div>
          <p className="text-indigo-100 text-lg max-w-2xl mb-8">
            Generate personalized learning roadmaps using free, open-source resources. 
            Our AI curates the best content from YouTube, GitHub, documentation, and more.
          </p>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="rounded-full bg-white text-primary hover:bg-white/90"
                data-testid="generate-path-btn"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Learning Path
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Generate Learning Path
                </DialogTitle>
                <DialogDescription>
                  Tell us what you want to learn and we'll create a personalized roadmap.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>What skill do you want to learn?</Label>
                  <Input
                    placeholder="e.g., Python for Data Science, Excel Financial Modeling"
                    value={formData.skill_name}
                    onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                    data-testid="skill-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Industry Context</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(v) => setFormData({ ...formData, industry: v })}
                  >
                    <SelectTrigger data-testid="industry-select">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Your Current Level</Label>
                  <Select
                    value={formData.current_level}
                    onValueChange={(v) => setFormData({ ...formData, current_level: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {levels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={generating}
                className="w-full rounded-full"
                data-testid="generate-submit"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Path
                  </>
                )}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Paths List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="font-heading font-semibold text-xl mb-4">
              {paths.length > 0 ? 'Generated Paths' : 'No paths yet'}
            </h2>
            
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : paths.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Route className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">
                    Generate your first learning path!
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Path
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {paths.map((path) => (
                  <Card 
                    key={path.id} 
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedPath?.id === path.id ? 'border-primary shadow-md' : ''
                    }`}
                    onClick={() => viewPath(path.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {path.industry}
                        </Badge>
                        <Badge className={`text-xs ${
                          path.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                          path.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {path.difficulty}
                        </Badge>
                      </div>
                      <h3 className="font-medium mb-1">{path.skill_name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {path.estimated_weeks} weeks
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {path.steps?.length || 0} steps
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Path Detail */}
          <div className="lg:col-span-2">
            {viewingPath ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : selectedPath ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className="bg-primary/10 text-primary">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Generated
                    </Badge>
                    <Badge variant="outline">{selectedPath.industry}</Badge>
                  </div>
                  <h2 className="font-heading font-bold text-2xl mb-2">
                    {selectedPath.skill_name}
                  </h2>
                  <p className="text-muted-foreground">
                    {selectedPath.description}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedPath.estimated_weeks} weeks
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-4 h-4" />
                      {selectedPath.difficulty}
                    </span>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                  {selectedPath.steps?.map((step, idx) => (
                    <Card key={idx} className="overflow-hidden">
                      <CardHeader className="bg-slate-50 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                            {step.week}
                          </span>
                          <div>
                            <CardTitle className="text-lg">{step.title}</CardTitle>
                            <CardDescription>{step.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="py-4">
                        {/* Skills */}
                        {step.skills_covered?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {step.skills_covered.map((skill, sIdx) => (
                              <Badge key={sIdx} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                        
                        {/* Resources */}
                        <div className="space-y-2">
                          {step.resources?.map((resource, rIdx) => {
                            const Icon = getResourceIcon(resource.type);
                            return (
                              <a
                                key={rIdx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getResourceColor(resource.type)}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium text-sm group-hover:text-primary transition-colors">
                                      {resource.title}
                                    </p>
                                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {resource.description}
                                  </p>
                                  {resource.duration && (
                                    <span className="text-xs text-muted-foreground">
                                      {resource.duration}
                                    </span>
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                  {resource.type}
                                </Badge>
                              </a>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="border-dashed h-full min-h-[400px] flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Route className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-xl mb-2">
                    Select or Generate a Path
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Choose an existing path from the list or generate a new one 
                    tailored to your learning goals.
                  </p>
                  <Button onClick={() => setDialogOpen(true)} className="rounded-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate New Path
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpenSourcePage;
