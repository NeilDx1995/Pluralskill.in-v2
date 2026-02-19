import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getLabs } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CardGridSkeleton } from '@/components/LoadingSkeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Beaker, Clock, Users, ArrowRight, Code, X } from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const LabsPage = () => {
  const navigate = useNavigate();
  const [labs, setLabs] = useState([]);
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const data = await getLabs();
        const items = data.items || data;
        setLabs(items);
        setFilteredLabs(items);
      } catch (error) {
        console.error('Failed to fetch labs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLabs();
  }, []);

  useEffect(() => {
    let result = labs;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (lab) =>
          lab.title.toLowerCase().includes(query) ||
          lab.description.toLowerCase().includes(query) ||
          lab.technology.toLowerCase().includes(query)
      );
    }

    if (selectedTechnology !== 'all') {
      result = result.filter((lab) => lab.technology === selectedTechnology);
    }

    if (selectedDifficulty !== 'all') {
      result = result.filter((lab) => lab.difficulty === selectedDifficulty);
    }

    setFilteredLabs(result);
  }, [searchQuery, selectedTechnology, selectedDifficulty, labs]);

  const technologies = ['all', ...new Set(labs.map((l) => l.technology))];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTechnology('all');
    setSelectedDifficulty('all');
  };

  const hasActiveFilters = searchQuery || selectedTechnology !== 'all' || selectedDifficulty !== 'all';

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

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Interactive Labs"
        description="Gain practical experience with our hands-on simulation labs. Build real-world projects in a risk-free environment."
        url="/labs"
      />
      {/* Header */}
      <div className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <Beaker className="w-7 h-7 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-3xl sm:text-4xl">
                The Lab
              </h1>
              <p className="text-slate-300">Simulation-Based Learning</p>
            </div>
          </div>
          <p className="text-slate-300 text-lg max-w-2xl">
            Go beyond theory with hands-on, guided simulations. Experience real-world scenarios,
            build projects, and master skills through practice.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search labs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white"
                data-testid="lab-search"
              />
            </div>
            <div className="flex gap-3">
              <Select value={selectedTechnology} onValueChange={setSelectedTechnology}>
                <SelectTrigger className="w-40 h-11 bg-white" data-testid="technology-filter">
                  <SelectValue placeholder="Technology" />
                </SelectTrigger>
                <SelectContent>
                  {technologies.map((tech) => (
                    <SelectItem key={tech} value={tech}>
                      {tech === 'all' ? 'All Technologies' : tech}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-36 h-11 bg-white" data-testid="difficulty-filter">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map((diff) => (
                    <SelectItem key={diff} value={diff}>
                      {diff === 'all' ? 'All Levels' : diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="outline" size="icon" onClick={clearFilters} className="h-11 w-11">
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Labs Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {filteredLabs.length} {filteredLabs.length === 1 ? 'lab' : 'labs'} found
          </p>
        </div>

        {loading ? (
          <CardGridSkeleton count={6} />
        ) : filteredLabs.length === 0 ? (
          <div className="text-center py-16">
            <Beaker className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-xl mb-2">No labs found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters</p>
            <Button onClick={clearFilters} variant="outline">Clear filters</Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLabs.map((lab) => (
              <Link key={lab.id} to={`/labs/${lab.slug}`} data-testid={`lab-card-${lab.slug}`}>
                <Card className="group h-full overflow-hidden bg-white border-slate-100 hover:shadow-xl hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={lab.thumbnail_url}
                      alt={lab.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white/20 text-white border-white/30 backdrop-blur text-xs">
                          {lab.technology}
                        </Badge>
                        <Badge className={`${getDifficultyColor(lab.difficulty)} text-xs`}>
                          {lab.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-heading font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {lab.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {lab.short_description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {lab.estimated_time_minutes} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Code className="w-3.5 h-3.5" />
                          {lab.steps?.length || 0} steps
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {lab.completions_count}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LabsPage;
