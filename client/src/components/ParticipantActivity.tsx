import { useQuery } from '@tanstack/react-query';
import { UserPlus, MessageSquare, Vote, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect, useState } from 'react';
import type { ParticipantActivity as ActivityType } from '@/lib/types';

interface ParticipantActivityProps {
  eventId: number;
}

export default function ParticipantActivity({ eventId }: ParticipantActivityProps) {
  const [activities, setActivities] = useState<ActivityType[]>([]);

  const { data: participants = [] } = useQuery<any[]>({
    queryKey: ['/api/events', eventId, 'participants'],
    refetchInterval: 10000,
  });

  const { lastMessage } = useWebSocket(eventId);

  useEffect(() => {
    if (lastMessage) {
      const now = new Date().toISOString();
      let newActivity: ActivityType | null = null;

      switch (lastMessage.type) {
        case 'participant_joined':
          newActivity = {
            id: `activity_${Date.now()}`,
            user: lastMessage.data.name || 'Anonymous User',
            action: 'joined the session',
            timestamp: 'Just now',
            type: 'join'
          };
          break;
        case 'new_question':
          newActivity = {
            id: `activity_${Date.now()}`,
            user: lastMessage.data.authorName || 'Anonymous',
            action: 'asked a question',
            timestamp: 'Just now',
            type: 'question'
          };
          break;
        case 'poll_response':
          newActivity = {
            id: `activity_${Date.now()}`,
            user: 'Participant',
            action: 'voted on poll',
            timestamp: 'Just now',
            type: 'poll'
          };
          break;
        case 'question_vote':
          newActivity = {
            id: `activity_${Date.now()}`,
            user: 'Participant',
            action: 'voted on question',
            timestamp: 'Just now',
            type: 'vote'
          };
          break;
      }

      if (newActivity) {
        setActivities(prev => [newActivity!, ...prev.slice(0, 9)]);
      }
    }
  }, [lastMessage]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'join':
        return <UserPlus className="w-3 h-3 text-success" />;
      case 'question':
        return <MessageSquare className="w-3 h-3 text-primary" />;
      case 'poll':
        return <BarChart3 className="w-3 h-3 text-secondary" />;
      case 'vote':
        return <Vote className="w-3 h-3 text-purple-500" />;
      default:
        return <UserPlus className="w-3 h-3 text-success" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case 'join':
        return 'bg-success/10';
      case 'question':
        return 'bg-primary/10';
      case 'poll':
        return 'bg-secondary/10';
      case 'vote':
        return 'bg-purple-500/10';
      default:
        return 'bg-success/10';
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-neutral-200">
        <CardTitle>Participant Activity</CardTitle>
      </CardHeader>
      <div className="divide-y divide-neutral-100">
        {activities.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-neutral-500 text-sm">No recent activity</p>
            <p className="text-neutral-400 text-xs">Activity will appear here as participants interact</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="p-3 hover:bg-neutral-50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className={`w-6 h-6 ${getActivityBgColor(activity.type)} rounded-full flex items-center justify-center`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-800">
                    <span className="font-medium">{activity.user}</span>
                    <span className="text-neutral-500 ml-1">{activity.action}</span>
                  </p>
                  <p className="text-xs text-neutral-500">{activity.timestamp}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {participants.length > 0 && (
        <div className="p-3 text-center border-t border-neutral-200">
          <div className="text-sm text-neutral-600 mb-2">
            <span className="font-medium">{participants.length}</span> total participants
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-blue-700 font-medium">
            View All Activity
          </Button>
        </div>
      )}
    </Card>
  );
}
