import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Monitor, Users, Clock, ArrowUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function PresenterView() {
  const { eventSlug } = useParams();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery<any>({
    queryKey: ['/api/events', eventSlug],
    enabled: !!eventSlug,
  });

  const { data: questions = [] } = useQuery<any[]>({
    queryKey: ['/api/events', event?.id, 'questions'],
    enabled: !!event?.id,
    refetchInterval: 2000,
  });

  const { lastMessage } = useWebSocket(event?.id);

  useEffect(() => {
    if (lastMessage && event?.id) {
      if (lastMessage.type === 'question_updated' || lastMessage.type === 'new_question') {
        queryClient.invalidateQueries({ queryKey: ['/api/events', event.id, 'questions'] });
      }
    }
  }, [lastMessage, queryClient, event?.id]);

  // Filter questions that are marked for presenter display
  const presenterQuestions = questions.filter((q: any) => q.isDisplayedInPresenter && !q.isHidden);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <p className="text-neutral-600">Loading presenter view...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Monitor className="w-8 h-8 text-neutral-400" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-2">Event Not Found</h1>
          <p className="text-neutral-600">The event you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-800 flex items-center">
                <Monitor className="w-8 h-8 mr-3 text-primary" />
                Presenter View
              </h1>
              <p className="text-neutral-600 mt-1">{event.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Badge 
                variant={event.isActive ? "default" : "secondary"}
                className={`px-3 py-1 ${event.isActive ? "bg-success animate-pulse" : ""}`}
              >
                {event.isActive ? 'Live' : 'Inactive'}
              </Badge>
              <div className="text-right text-sm text-neutral-500">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {presenterQuestions.length} selected questions
                </div>
                <div className="flex items-center mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {presenterQuestions.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Monitor className="w-12 h-12 text-neutral-400" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-800 mb-2">No Questions Selected</h2>
              <p className="text-neutral-600 max-w-md mx-auto">
                The event moderator will select questions to display here. 
                Questions will appear automatically once selected.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {presenterQuestions.map((question: any) => (
              <Card 
                key={question.id} 
                className="border-2 border-primary/20 bg-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-neutral-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-neutral-800 leading-relaxed">
                        {question.text}
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-3">
                        <div className="flex items-center text-sm text-neutral-500">
                          <span className="font-medium">
                            {question.isAnonymous ? 'Anonymous' : question.authorName}
                          </span>
                          <span className="mx-2">•</span>
                          <span>{new Date(question.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          {question.upvotes > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              <ArrowUp className="w-3 h-3 mr-1" />
                              {question.upvotes} votes
                            </Badge>
                          )}
                          {question.isPinned && (
                            <Badge variant="default" className="text-xs bg-primary">
                              Pinned
                            </Badge>
                          )}
                          {question.isAnswered && (
                            <Badge variant="default" className="text-xs bg-success">
                              Answered
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-neutral-500">
          <div>
            Questions update automatically • Powered by real-time sync
          </div>
          <div>
            URL: {window.location.host}/{event.slug}/presenter
          </div>
        </div>
      </div>
    </div>
  );
}