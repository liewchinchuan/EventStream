import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface EventSettingsPanelProps {
  eventId: number;
}

export default function EventSettingsPanel({ eventId }: EventSettingsPanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: event } = useQuery<any>({
    queryKey: ['/api/events', eventId],
  });

  const updateEventMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest('PATCH', `/api/events/${eventId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
      toast({
        title: "Settings updated",
        description: "Event settings have been saved successfully.",
      });
    },
  });

  const handleSettingChange = (key: string, value: boolean) => {
    updateEventMutation.mutate({ [key]: value });
  };

  if (!event) return null;

  return (
    <Card>
      <CardHeader className="border-b border-neutral-200">
        <CardTitle className="flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Event Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Allow Questions</Label>
            <p className="text-xs text-neutral-500">Enable audience to submit questions</p>
          </div>
          <Switch
            checked={event.allowQuestions}
            onCheckedChange={(checked) => handleSettingChange('allowQuestions', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Auto-approve Questions</Label>
            <p className="text-xs text-neutral-500">Questions appear immediately without moderation</p>
          </div>
          <Switch
            checked={event.autoApprove}
            onCheckedChange={(checked) => handleSettingChange('autoApprove', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Show Voting</Label>
            <p className="text-xs text-neutral-500">Display upvote/downvote buttons on questions</p>
          </div>
          <Switch
            checked={event.showVoting}
            onCheckedChange={(checked) => handleSettingChange('showVoting', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Anonymous Questions</Label>
            <p className="text-xs text-neutral-500">Allow participants to ask questions anonymously</p>
          </div>
          <Switch
            checked={event.allowAnonymous}
            onCheckedChange={(checked) => handleSettingChange('allowAnonymous', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Event Status</Label>
            <p className="text-xs text-neutral-500">Control whether the event is accepting participants</p>
          </div>
          <Switch
            checked={event.isActive}
            onCheckedChange={(checked) => handleSettingChange('isActive', checked)}
          />
        </div>
      </CardContent>
      <div className="p-4 border-t border-neutral-200">
        <Button variant="outline" className="w-full text-sm font-medium">
          Advanced Settings
        </Button>
      </div>
    </Card>
  );
}
