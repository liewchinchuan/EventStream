import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface QuickPollCreatorProps {
  eventId: number;
}

export default function QuickPollCreator({ eventId }: QuickPollCreatorProps) {
  const [question, setQuestion] = useState('');
  const [pollType, setPollType] = useState('multiple-choice');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showResults, setShowResults] = useState(true);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createPollMutation = useMutation({
    mutationFn: async () => {
      const pollData = {
        question,
        type: pollType,
        options: pollType === 'multiple-choice' ? options.filter(opt => opt.trim()) : null,
        isAnonymous,
        showResults,
        isActive: true,
      };

      const response = await apiRequest('POST', `/api/events/${eventId}/polls`, pollData);
      return response.json();
    },
    onSuccess: () => {
      setQuestion('');
      setOptions(['', '']);
      toast({
        title: "Poll launched!",
        description: "Your poll is now live and participants can start responding.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'polls'] });
    },
  });

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const canLaunch = question.trim() && (pollType !== 'multiple-choice' || options.filter(opt => opt.trim()).length >= 2);

  return (
    <Card>
      <CardHeader className="border-b border-neutral-200">
        <CardTitle className="text-lg">Quick Poll</CardTitle>
        <p className="text-sm text-neutral-600 mt-1">Create and launch a poll instantly</p>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div>
          <Label htmlFor="poll-question" className="block text-sm font-medium text-neutral-700 mb-2">
            Poll Question
          </Label>
          <Input
            id="poll-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., Which department should we focus on next quarter?"
          />
        </div>

        <div>
          <Label className="block text-sm font-medium text-neutral-700 mb-2">Poll Type</Label>
          <Select value={pollType} onValueChange={setPollType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
              <SelectItem value="open-text">Open Text Response</SelectItem>
              <SelectItem value="word-cloud">Word Cloud</SelectItem>
              <SelectItem value="rating">Rating Scale</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {pollType === 'multiple-choice' && (
          <div className="space-y-2">
            <Label className="block text-sm font-medium text-neutral-700">Options</Label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                {options.length > 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="px-2"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              onClick={addOption}
              className="text-sm text-primary hover:text-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Option
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="anonymous-responses"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              />
              <Label htmlFor="anonymous-responses" className="text-sm text-neutral-700">
                Anonymous responses
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show-results"
                checked={showResults}
                onCheckedChange={(checked) => setShowResults(checked === true)}
              />
              <Label htmlFor="show-results" className="text-sm text-neutral-700">
                Show results immediately
              </Label>
            </div>
          </div>
          <Button
            onClick={() => createPollMutation.mutate()}
            disabled={createPollMutation.isPending || !canLaunch}
            className="bg-primary text-white hover:bg-blue-600"
          >
            {createPollMutation.isPending ? 'Launching...' : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Launch Poll
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
