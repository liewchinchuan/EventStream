import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LiveQAPanel from '@/components/LiveQAPanel';
import QuickPollCreator from '@/components/QuickPollCreator';
import LivePollResults from '@/components/LivePollResults';
import ParticipantActivity from '@/components/ParticipantActivity';
import EventSettingsPanel from '@/components/EventSettingsPanel';
import { Link } from 'wouter';

export default function EventPage() {
  const { eventId } = useParams();
  const eventIdNum = parseInt(eventId || '0');

  const { data: event, isLoading } = useQuery<any>({
    queryKey: ['/api/events', eventIdNum],
    enabled: !!eventIdNum,
  });

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold text-neutral-900 mb-2">Event Not Found</h1>
            <p className="text-neutral-600 mb-4">The event you're looking for doesn't exist.</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-neutral-900">{event.name}</h1>
                <p className="text-sm text-neutral-600">{event.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-neutral-600">
                <Users className="w-4 h-4" />
                <span>45 participants</span>
              </div>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                event.isActive 
                  ? 'bg-success text-white animate-pulse' 
                  : 'bg-neutral-400 text-white'
              }`}>
                {event.isActive ? 'Live' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Left Panel - Q&A and Polls */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <LiveQAPanel eventId={eventIdNum} />
            <QuickPollCreator eventId={eventIdNum} />
          </div>

          {/* Right Sidebar */}
          <aside className="w-80 bg-white border-l border-neutral-200 overflow-y-auto">
            <div className="p-6 space-y-6">
              <LivePollResults eventId={eventIdNum} />
              <ParticipantActivity eventId={eventIdNum} />
              <EventSettingsPanel eventId={eventIdNum} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
