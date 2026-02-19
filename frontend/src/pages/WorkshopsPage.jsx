import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getWorkshops, registerForWorkshop } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Calendar, Clock, Users, MapPin, Building2, Linkedin,
    Play, CheckCircle2, Loader2, ExternalLink
} from 'lucide-react';
import SEOHead from '@/components/SEOHead';

const WorkshopsPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const [workshops, setWorkshops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState(null);

    useEffect(() => {
        const fetchWorkshops = async () => {
            try {
                const data = await getWorkshops();
                setWorkshops(data.items || data);
            } catch (err) {
                console.error('Failed to fetch workshops:', err);
                toast.error('Failed to load workshops');
            } finally {
                setLoading(false);
            }
        };
        fetchWorkshops();
    }, []);

    const handleRegister = async (workshopId) => {
        if (!isAuthenticated) {
            navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
            return;
        }
        setRegistering(workshopId);
        try {
            await registerForWorkshop(workshopId);
            toast.success('Successfully registered for workshop!');
            // Refresh workshops to update count
            const data = await getWorkshops();
            setWorkshops(data.items || data);
        } catch (err) {
            const message = err?.response?.data?.detail || 'Failed to register';
            toast.error(message);
        } finally {
            setRegistering(null);
        }
    };

    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const isUpcoming = (dateStr) => {
        try {
            return new Date(dateStr) > new Date();
        } catch {
            return false;
        }
    };

    if (loading) return <PageSkeleton />;

    const upcomingWorkshops = workshops.filter(w => isUpcoming(w.date));
    const pastWorkshops = workshops.filter(w => !isUpcoming(w.date));

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <SEOHead
                title="Workshops"
                description="Join live workshops with industry experts. Learn cutting-edge skills in interactive sessions."
                url="/workshops"
            />
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight mb-3">
                    Industry Workshops
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Learn directly from industry leaders at top companies. Live sessions covering AI,
                    analytics, and digital transformation across industries.
                </p>
            </div>

            {/* Upcoming Workshops */}
            {upcomingWorkshops.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-primary" />
                        Upcoming Workshops
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {upcomingWorkshops.map((workshop) => (
                            <WorkshopCard
                                key={workshop.id}
                                workshop={workshop}
                                isUpcoming={true}
                                onRegister={handleRegister}
                                registering={registering}
                                isAuthenticated={isAuthenticated}
                                formatDate={formatDate}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Past Workshops */}
            {pastWorkshops.length > 0 && (
                <section>
                    <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                        <Play className="w-6 h-6 text-muted-foreground" />
                        Past Workshops
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {pastWorkshops.map((workshop) => (
                            <WorkshopCard
                                key={workshop.id}
                                workshop={workshop}
                                isUpcoming={false}
                                formatDate={formatDate}
                            />
                        ))}
                    </div>
                </section>
            )}

            {workshops.length === 0 && (
                <div className="text-center py-16">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-medium mb-2">No workshops available</h3>
                    <p className="text-muted-foreground">Check back soon for upcoming industry workshops.</p>
                </div>
            )}
        </div>
    );
};

const WorkshopCard = ({ workshop, isUpcoming, onRegister, registering, isAuthenticated, formatDate }) => {
    const speakers = workshop.speakers || [];
    const spotsLeft = (workshop.max_participants || 500) - (workshop.registered_count || 0);
    const isFull = spotsLeft <= 0;

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
            {workshop.image_url && (
                <div className="aspect-video overflow-hidden">
                    <img
                        src={workshop.image_url}
                        alt={workshop.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                </div>
            )}
            <CardHeader className="pb-3">
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {(workshop.tags || []).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                    {isUpcoming ? (
                        <Badge className="bg-green-100 text-green-800 text-xs">Upcoming</Badge>
                    ) : (
                        <Badge variant="outline" className="text-xs">Completed</Badge>
                    )}
                </div>
                <CardTitle className="text-lg leading-tight">{workshop.title}</CardTitle>
                <CardDescription className="line-clamp-2">{workshop.description}</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>{formatDate(workshop.date)}</span>
                    </div>
                    {workshop.duration_minutes && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>{workshop.duration_minutes} minutes</span>
                        </div>
                    )}
                    {workshop.platform && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4 shrink-0" />
                            <span>{workshop.platform}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4 shrink-0" />
                        <span>{workshop.registered_count || 0} / {workshop.max_participants || '∞'} registered</span>
                    </div>
                </div>

                {/* Speakers */}
                {speakers.length > 0 && (
                    <div className="border-t pt-3">
                        {speakers.map((speaker, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                    {speaker.name?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{speaker.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {speaker.title}{speaker.company ? ` at ${speaker.company}` : ''}
                                    </p>
                                </div>
                                {speaker.linkedin_url && (
                                    <a href={speaker.linkedin_url} target="_blank" rel="noopener noreferrer" className="ml-auto">
                                        <Linkedin className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Legacy support for old schema */}
                {!speakers.length && workshop.leader && (
                    <div className="border-t pt-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                {workshop.leader.charAt(0)}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{workshop.leader}</p>
                                {workshop.company && (
                                    <p className="text-xs text-muted-foreground">{workshop.company}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                {isUpcoming && onRegister && (
                    <Button
                        className="w-full"
                        disabled={isFull || registering === workshop.id}
                        onClick={() => onRegister(workshop.id)}
                    >
                        {registering === workshop.id ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...</>
                        ) : isFull ? (
                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Workshop Full</>
                        ) : (
                            'Register Now'
                        )}
                    </Button>
                )}

                {!isUpcoming && workshop.recording_url && (
                    <Button variant="outline" className="w-full" asChild>
                        <a href={workshop.recording_url} target="_blank" rel="noopener noreferrer">
                            <Play className="w-4 h-4 mr-2" /> Watch Recording
                        </a>
                    </Button>
                )}
            </CardContent>
        </Card>
    );
};

export default WorkshopsPage;
