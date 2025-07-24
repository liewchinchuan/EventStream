import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface LivePollResultsProps {
  eventId: number;
}

export default function LivePollResults({ eventId }: LivePollResultsProps) {
  const queryClient = useQueryClient();

  const { data: activePoll } = useQuery<any>({
    queryKey: ['/api/events', eventId, 'polls', 'active'],
    refetchInterval: 3000,
  });

  const { data: pollResults } = useQuery<any>({
    queryKey: ['/api/polls', activePoll?.id, 'results'],
    enabled: !!activePoll?.id,
    refetchInterval: 2000,
  });

  const { lastMessage } = useWebSocket(eventId);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'new_poll' || lastMessage.type === 'poll_updated') {
        queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'polls', 'active'] });
      } else if (lastMessage.type === 'poll_response') {
        queryClient.invalidateQueries({ queryKey: ['/api/polls', activePoll?.id, 'results'] });
      }
    }
  }, [lastMessage, queryClient, eventId, activePoll?.id]);

  if (!activePoll) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Poll Results</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-neutral-400 mb-2">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-neutral-500">No active poll</p>
          <p className="text-sm text-neutral-400">Create a poll to see live results here</p>
        </CardContent>
      </Card>
    );
  }

  const colors = ['bg-primary', 'bg-secondary', 'bg-success', 'bg-warning', 'bg-pink-500', 'bg-purple-500'];

  return (
    <Card>
      <CardHeader className="border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <CardTitle>Current Poll</CardTitle>
          <Badge className="bg-success text-white animate-pulse">LIVE</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-neutral-800 mb-4">{activePoll.question}</p>
        
        {pollResults && pollResults.results ? (
          <div className="space-y-3">
            {pollResults.results.map((result: any, index: number) => {
              const colorClass = colors[index % colors.length];
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-700">{result.option}</span>
                    <span className="font-medium text-neutral-900">{result.percentage}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div 
                      className={`${colorClass} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="mt-4 pt-3 border-t border-neutral-200 text-xs text-neutral-500 text-center">
              <span>{pollResults.totalResponses} responses</span> • Updates every 2 seconds
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="animate-pulse">
              <div className="h-2 bg-neutral-200 rounded-full mb-2"></div>
              <div className="h-2 bg-neutral-200 rounded-full mb-2 w-3/4"></div>
              <div className="h-2 bg-neutral-200 rounded-full w-1/2"></div>
            </div>
            <p className="text-sm text-neutral-500 mt-4">Waiting for responses...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
