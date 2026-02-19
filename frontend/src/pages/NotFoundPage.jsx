import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';

const NotFoundPage = () => {
    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <SEOHead title="Page Not Found" />
            <div className="max-w-lg w-full text-center space-y-8">
                {/* Large 404 */}
                <div className="relative">
                    <h1 className="text-[120px] sm:text-[160px] font-bold leading-none tracking-tighter bg-gradient-to-b from-foreground to-muted-foreground/30 bg-clip-text text-transparent select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="w-12 h-12 text-muted-foreground/50 animate-pulse" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-semibold tracking-tight">Page not found</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        The page you're looking for doesn't exist or has been moved.
                        Let's get you back on track.
                    </p>
                </div>

                <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => window.history.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                    <Button asChild>
                        <Link to="/">
                            <Home className="w-4 h-4 mr-2" />
                            Home
                        </Link>
                    </Button>
                </div>

                {/* Quick Links */}
                <div className="pt-6 border-t">
                    <p className="text-sm text-muted-foreground mb-3">Popular pages</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/courses">Courses</Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/workshops">Workshops</Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/labs">Labs</Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/open-source">Learning Paths</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
