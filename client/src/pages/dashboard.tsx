import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Users, Calendar, MessageSquare, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LiveQAPanel from '@/components/LiveQAPanel';
import QuickPollCreator from '@/components/QuickPollCreator';
import LivePollResults from '@/components/LivePollResults';
import ParticipantActivity from '@/components/ParticipantActivity';
import EventSettingsPanel from '@/components/EventSettingsPanel';
import CreateEventModal from '@/components/CreateEventModal';

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ['/api/events'],
  });

  const activeEvent = events.find((event: any) => event.isActive);

  const stats = {
    activeEvents: events.filter((e: any) => e.isActive).length,
    totalParticipants: 1247,
    questionsAsked: 89,
    engagementRate: '78%'
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="text-white w-4 h-4" />
                </div>
                <span className="text-xl font-semibold text-neutral-800">AudienceEngage</span>
              </div>
              <div className="hidden md:flex space-x-1 bg-neutral-100 rounded-lg p-1">
                <Button variant="ghost" size="sm" className="bg-white text-primary shadow-sm">
                  Dashboard
                </Button>
                <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-neutral-800">
                  Live Events
                </Button>
                <Button variant="ghost" size="sm" className="text-neutral-600 hover:text-neutral-800">
                  Analytics
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">JD</span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium">John Doe</div>
                  <div className="text-xs text-neutral-500">Admin</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:flex lg:flex-shrink-0 lg:w-64 bg-white border-r border-neutral-200">
          <div className="flex flex-col p-4 space-y-6">
            <div className="space-y-3">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="w-full bg-primary text-white hover:bg-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
              <Button variant="outline" className="w-full">
                Join Event
              </Button>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-3">Recent Events</h3>
              <div className="space-y-2">
                {events.slice(0, 3).map((event: any) => (
                  <div 
                    key={event.id}
                    className="p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <div className="font-medium text-sm">{event.name}</div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center mt-2 space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        event.isActive ? 'bg-success text-white' : 'bg-neutral-400 text-white'
                      }`}>
                        {event.isActive ? 'Live' : 'Ended'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
              <p className="text-neutral-600 mt-1">Manage your audience engagement events and view real-time analytics</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Active Events</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.activeEvents}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Calendar className="text-primary w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <span className="text-success">+2</span>
                    <span className="text-neutral-500 ml-1">from last week</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Participants</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalParticipants}</p>
                    </div>
                    <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                      <Users className="text-success w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <span className="text-success">+15%</span>
                    <span className="text-neutral-500 ml-1">from last month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Questions Asked</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.questionsAsked}</p>
                    </div>
                    <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <MessageSquare className="text-secondary w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <span className="text-success">+8</span>
                    <span className="text-neutral-500 ml-1">this week</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Engagement Rate</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.engagementRate}</p>
                    </div>
                    <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                      <TrendingUp className="text-warning w-6 h-6" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4 text-sm">
                    <span className="text-success">+5%</span>
                    <span className="text-neutral-500 ml-1">from average</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {activeEvent && (
                  <>
                    <LiveQAPanel eventId={activeEvent.id} />
                    <QuickPollCreator eventId={activeEvent.id} />
                  </>
                )}
                {!activeEvent && (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="text-neutral-400 mb-4">
                        <Calendar className="w-12 h-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">No Active Events</h3>
                      <p className="text-neutral-600 mb-6">Create your first event to start engaging with your audience</p>
                      <Button onClick={() => setShowCreateModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Event
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                {activeEvent && (
                  <>
                    <LivePollResults eventId={activeEvent.id} />
                    <ParticipantActivity eventId={activeEvent.id} />
                    <EventSettingsPanel eventId={activeEvent.id} />
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <CreateEventModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
    </div>
  );
}
