import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronUp, Send, Users, MessageSquare, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function AudiencePage() {
  const { eventSlug } = useParams();
  const [participantName, setParticipantName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [questionText, setQuestionText] = useState('');
  const [participantId, setParticipantId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: event, isLoading } = useQuery<any>({
    queryKey: ['/api/events', eventSlug],
    enabled: !!eventSlug,
  });

  const { data: questions = [] } = useQuery<any[]>({
    queryKey: ['/api/events', event?.id, 'questions'],
    enabled: !!event?.id,
    refetchInterval: 3000,
  });

  const { data: activePoll } = useQuery<any>({
    queryKey: ['/api/events', event?.id, 'polls', 'active'],
    enabled: !!event?.id,
    refetchInterval: 2000,
  });

  const { data: pollResults } = useQuery<any>({
    queryKey: ['/api/polls', activePoll?.id, 'results'],
    enabled: !!activePoll?.id,
    refetchInterval: 2000,
  });

  const { lastMessage } = useWebSocket(event?.id);

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'new_question' || lastMessage.type === 'question_updated') {
        queryClient.invalidateQueries({ queryKey: ['/api/events', event?.id, 'questions'] });
      } else if (lastMessage.type === 'new_poll' || lastMessage.type === 'poll_updated') {
        queryClient.invalidateQueries({ queryKey: ['/api/events', event?.id, 'polls', 'active'] });
      } else if (lastMessage.type === 'poll_response') {
        queryClient.invalidateQueries({ queryKey: ['/api/polls', activePoll?.id, 'results'] });
      }
    }
  }, [lastMessage, queryClient, event?.id, activePoll?.id]);

  const joinEventMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/events/${event.id}/participants`, {
        name: isAnonymous ? null : participantName,
        isAnonymous,
        sessionId: `session_${Date.now()}_${Math.random()}`,
      });
      return response.json();
    },
    onSuccess: (participant) => {
      setParticipantId(participant.id);
      toast({
        title: "Welcome!",
        description: "You've successfully joined the event.",
      });
    },
  });

  const questionMutation = useMutation({
    mutationFn: async (data: { text: string }) => {
      const response = await apiRequest('POST', `/api/events/${event.id}/questions`, {
        text: data.text,
        authorName: isAnonymous ? null : participantName,
        isAnonymous,
        isApproved: event.autoApprove,
      });
      return response.json();
    },
    onSuccess: () => {
      setQuestionText('');
      toast({
        title: "Question submitted!",
        description: "Your question has been sent to the moderator.",
      });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async ({ questionId, voteType }: { questionId: number; voteType: 'upvote' | 'downvote' }) => {
      const response = await apiRequest('POST', `/api/questions/${questionId}/vote`, {
        participantId,
        voteType,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', event?.id, 'questions'] });
    },
  });

  const pollResponseMutation = useMutation({
    mutationFn: async (response: any) => {
      const res = await apiRequest('POST', `/api/polls/${activePoll.id}/responses`, {
        participantId,
        response,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Response recorded!",
        description: "Thank you for participating in the poll.",
      });
    },
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
            <p className="text-neutral-600">The event you're looking for doesn't exist or has ended.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!participantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl">{event.name}</CardTitle>
            <p className="text-neutral-600">{event.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="anonymous" 
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              />
              <Label htmlFor="anonymous">Join anonymously</Label>
            </div>

            {!isAnonymous && (
              <div>
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            )}

            <Button 
              onClick={() => joinEventMutation.mutate()}
              disabled={joinEventMutation.isPending || (!isAnonymous && !participantName.trim())}
              className="w-full"
            >
              {joinEventMutation.isPending ? 'Joining...' : 'Join Event'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-primary text-white p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{event.name}</h1>
              <p className="text-sm opacity-90">
                {questions.length} questions • Live event
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span className="text-sm">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Active Poll */}
        {activePoll && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{activePoll.question}</CardTitle>
                <Badge variant="secondary">Live Poll</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {activePoll.type === 'multiple-choice' && (
                <div className="space-y-2">
                  {(activePoll.options as string[]).map((option, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => pollResponseMutation.mutate({ option })}
                      disabled={pollResponseMutation.isPending}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              )}

              {pollResults && activePoll.showResults && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-neutral-600">Current results:</p>
                  {pollResults.results.map((result: any, index: number) => (
                    <div key={index}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{result.option}</span>
                        <span className="font-medium">{result.percentage}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-neutral-500">
                    {pollResults.totalResponses} responses
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Question Submission */}
        {event.allowQuestions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Ask a Question
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What would you like to ask?"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="questionAnonymous" 
                    checked={isAnonymous}
                    onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                  />
                  <Label htmlFor="questionAnonymous" className="text-sm">
                    Ask anonymously
                  </Label>
                </div>
                <Button
                  onClick={() => questionMutation.mutate({ text: questionText })}
                  disabled={questionMutation.isPending || !questionText.trim()}
                >
                  {questionMutation.isPending ? 'Submitting...' : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle>Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <p className="text-center text-neutral-500 py-8">
                No questions yet. Be the first to ask!
              </p>
            ) : (
              <div className="space-y-4">
                {questions.map((question: any) => (
                  <div key={question.id} className="border border-neutral-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      {event.showVoting && (
                        <div className="flex flex-col items-center space-y-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => voteMutation.mutate({ 
                              questionId: question.id, 
                              voteType: 'upvote' 
                            })}
                            disabled={voteMutation.isPending}
                            className="p-2 h-auto text-neutral-400 hover:text-success"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <span className="text-sm font-medium text-neutral-600">
                            {question.upvotes}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <p className="text-sm text-neutral-800 mb-2 flex-1">{question.text}</p>
                          {question.isDisplayedInPresenter && (
                            <Badge variant="default" className="ml-2 text-xs bg-blue-600 flex items-center">
                              <Monitor className="w-3 h-3 mr-1" />
                              On Screen
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-xs text-neutral-500">
                          <span>
                            {question.isAnonymous ? 'Anonymous' : question.authorName}
                          </span>
                          <span>
                            {new Date(question.createdAt).toLocaleTimeString()}
                          </span>
                          {question.isPinned && (
                            <Badge variant="secondary" className="text-xs">
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
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}