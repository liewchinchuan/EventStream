import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronUp, ChevronDown, Pin, Check, EyeOff, Share2, Copy, Download, Trash2, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useEffect } from 'react';

interface LiveQAPanelProps {
  eventId: number;
}

export default function LiveQAPanel({ eventId }: LiveQAPanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: event } = useQuery<any>({
    queryKey: ['/api/events', eventId],
  });

  const { data: questions = [] } = useQuery<any[]>({
    queryKey: ['/api/events', eventId, 'questions'],
    refetchInterval: 2000,
  });

  const { lastMessage } = useWebSocket(eventId);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'new_question' || lastMessage.type === 'question_updated' || lastMessage.type === 'question_vote') {
        queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'questions'] });
      }
    }
  }, [lastMessage, queryClient, eventId]);

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      const response = await apiRequest('PATCH', `/api/questions/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'questions'] });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest('PATCH', `/api/events/${eventId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
    },
  });

  const copyEventUrl = () => {
    const url = `${window.location.origin}/${event?.slug}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "Event URL has been copied to clipboard.",
    });
  };

  const exportQuestions = () => {
    const csv = questions.map((q: any) => 
      `"${q.text}","${q.authorName || 'Anonymous'}","${q.upvotes}","${new Date(q.createdAt).toISOString()}"`
    ).join('\n');
    
    const blob = new Blob([`Text,Author,Votes,Created\n${csv}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `questions-${event?.name}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!event) return null;

  return (
    <Card>
      <CardHeader className="border-b border-neutral-200 bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{event.name} - Live Q&A</CardTitle>
            <p className="text-sm text-neutral-600 mt-1">
              {questions.length} questions • {event.isActive ? 'Live' : 'Inactive'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={event.isActive ? "default" : "secondary"}
              className={event.isActive ? "bg-success animate-pulse" : ""}
            >
              {event.isActive ? 'Live' : 'Inactive'}
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => window.open(`/${event.slug}/presenter`, '_blank')}
              title="Open presenter view"
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={copyEventUrl}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Event URL */}
        <div className="mt-4 p-4 bg-white rounded-lg border border-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center">
                <div className="w-12 h-12 bg-primary/10 rounded border-2 border-primary/20">
                  <div className="grid grid-cols-3 gap-1 p-2">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full ${Math.random() > 0.5 ? 'bg-primary' : 'bg-neutral-300'}`} />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">Event URL</p>
                <p className="font-mono text-sm text-primary">
                  {window.location.host}/{event.slug}
                </p>
                <Button variant="ghost" size="sm" onClick={copyEventUrl} className="text-xs p-0 h-auto">
                  <Copy className="w-3 h-3 mr-1" />
                  Copy Link
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Controls */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-neutral-700">Moderation:</span>
              <Select defaultValue="automatic">
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre-approved">Pre-approved</SelectItem>
                  <SelectItem value="post-approved">Post-approved</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="anonymous" 
                checked={event.allowAnonymous}
                onCheckedChange={(checked) => 
                  updateEventMutation.mutate({ allowAnonymous: checked })
                }
              />
              <label htmlFor="anonymous" className="text-sm text-neutral-700">
                Allow anonymous
              </label>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={exportQuestions}>
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="text-error border-error hover:bg-error/5">
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="max-h-96 overflow-y-auto">
        {questions.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Share2 className="w-6 h-6 text-neutral-400" />
            </div>
            <p>No questions yet</p>
            <p className="text-sm">Share the event URL to start receiving questions</p>
          </div>
        ) : (
          questions.map((question: any) => (
            <div 
              key={question.id} 
              className="p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="flex flex-col items-center space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-neutral-400 hover:text-success hover:bg-success/10"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium text-neutral-600">
                    {question.upvotes}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-neutral-400 hover:text-error hover:bg-error/10"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-neutral-800 font-medium ${question.isAnswered ? 'line-through opacity-60' : ''}`}>
                        {question.text}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                        <span>{question.isAnonymous ? 'Anonymous' : question.authorName}</span>
                        <span>{new Date(question.createdAt).toLocaleTimeString()}</span>
                        {question.isPinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="w-3 h-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        {question.isAnswered && (
                          <Badge variant="default" className="text-xs bg-success">
                            <Check className="w-3 h-3 mr-1" />
                            Answered
                          </Badge>
                        )}
                        {question.isDisplayedInPresenter && (
                          <Badge variant="default" className="text-xs bg-blue-600">
                            <Monitor className="w-3 h-3 mr-1" />
                            On Screen
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuestionMutation.mutate({
                          id: question.id,
                          updates: { isDisplayedInPresenter: !question.isDisplayedInPresenter }
                        })}
                        className={`p-1.5 ${question.isDisplayedInPresenter ? 'text-blue-600 bg-blue-50' : 'text-neutral-400 hover:text-blue-600'}`}
                        title="Toggle display in presenter mode"
                      >
                        <Monitor className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuestionMutation.mutate({
                          id: question.id,
                          updates: { isPinned: !question.isPinned }
                        })}
                        className={`p-1.5 ${question.isPinned ? 'text-primary bg-primary/10' : 'text-neutral-400 hover:text-primary'}`}
                        title="Pin question"
                      >
                        <Pin className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuestionMutation.mutate({
                          id: question.id,
                          updates: { isAnswered: !question.isAnswered }
                        })}
                        className={`p-1.5 ${question.isAnswered ? 'text-success bg-success/10' : 'text-neutral-400 hover:text-success'}`}
                        title="Mark as answered"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuestionMutation.mutate({
                          id: question.id,
                          updates: { isHidden: true }
                        })}
                        className="p-1.5 text-neutral-400 hover:text-error"
                        title="Hide question"
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Preview of audience input */}
      <div className="p-4 bg-neutral-50 border-t border-neutral-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-neutral-300 rounded-full flex items-center justify-center">
            <Share2 className="w-4 h-4 text-neutral-600" />
          </div>
          <div className="flex-1 bg-white border border-neutral-300 rounded-lg px-3 py-2">
            <p className="text-sm text-neutral-500">Audience members can submit questions here...</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
