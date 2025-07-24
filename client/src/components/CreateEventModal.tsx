import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Users, Link } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'URL slug is required').regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  allowQuestions: z.boolean().default(true),
  allowAnonymous: z.boolean().default(true),
  autoApprove: z.boolean().default(true),
  showVoting: z.boolean().default(true),
  isActive: z.boolean().default(false),
}).refine((data) => {
  if (data.startTime && data.endTime) {
    return new Date(data.startTime) < new Date(data.endTime);
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type CreateEventForm = z.infer<typeof createEventSchema>;

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateEventModal({ open, onOpenChange }: CreateEventModalProps) {
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: '',
      description: '',
      slug: '',
      startTime: '',
      endTime: '',
      allowQuestions: true,
      allowAnonymous: true,
      autoApprove: true,
      showVoting: true,
      isActive: false,
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventForm) => {
      const response = await apiRequest('POST', '/api/events', {
        ...data,
        organizerId: 1, // TODO: Get actual user ID from authentication
      });
      return response.json();
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      onOpenChange(false);
      form.reset({
        name: '',
        description: '',
        slug: '',
        startTime: '',
        endTime: '',
        allowQuestions: true,
        allowAnonymous: true,
        autoApprove: true,
        showVoting: true,
        isActive: false,
      });
      toast({
        title: "Event created!",
        description: `Your event "${event.name}" has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating event",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);
    
    if (!form.getValues('slug')) {
      setIsGeneratingSlug(true);
      const slug = generateSlug(name);
      form.setValue('slug', slug);
      setTimeout(() => setIsGeneratingSlug(false), 300);
    }
  };

  const onSubmit = (data: CreateEventForm) => {
    const submitData = {
      ...data,
      startTime: data.startTime ? new Date(data.startTime).toISOString() : undefined,
      endTime: data.endTime ? new Date(data.endTime).toISOString() : undefined,
    };
    createEventMutation.mutate(submitData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Create New Event
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                {...form.register('name')}
                onChange={handleNameChange}
                placeholder="e.g., Q1 All Hands Meeting"
                className="mt-1"
              />
              {form.formState.errors.name && (
                <p className="text-sm text-error mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...form.register('description')}
                placeholder="Brief description of your event (optional)"
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Date & Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  {...form.register('startTime')}
                  className="mt-1"
                />
                {form.formState.errors.startTime && (
                  <p className="text-sm text-error mt-1">{form.formState.errors.startTime.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="endTime">End Date & Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  {...form.register('endTime')}
                  className="mt-1"
                />
                {form.formState.errors.endTime && (
                  <p className="text-sm text-error mt-1">{form.formState.errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="slug">Event URL *</Label>
              <div className="mt-1 flex items-center">
                <span className="text-sm text-neutral-500 bg-neutral-100 px-3 py-2 rounded-l-md border border-r-0">
                  {window.location.host}/
                </span>
                <Input
                  id="slug"
                  {...form.register('slug')}
                  placeholder="event-url"
                  className={`rounded-l-none ${isGeneratingSlug ? 'animate-pulse bg-neutral-50' : ''}`}
                />
              </div>
              {form.formState.errors.slug && (
                <p className="text-sm text-error mt-1">{form.formState.errors.slug.message}</p>
              )}
              <p className="text-xs text-neutral-500 mt-1">
                Participants will join at: {window.location.host}/{form.watch('slug') || 'your-event-url'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-neutral-900 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Event Settings
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allowQuestions"
                  checked={form.watch('allowQuestions')}
                  onCheckedChange={(checked) => form.setValue('allowQuestions', checked === true)}
                />
                <Label htmlFor="allowQuestions" className="text-sm">
                  Allow participants to submit questions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="allowAnonymous"
                  checked={form.watch('allowAnonymous')}
                  onCheckedChange={(checked) => form.setValue('allowAnonymous', checked === true)}
                />
                <Label htmlFor="allowAnonymous" className="text-sm">
                  Allow anonymous participation
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="autoApprove"
                  checked={form.watch('autoApprove')}
                  onCheckedChange={(checked) => form.setValue('autoApprove', checked === true)}
                />
                <Label htmlFor="autoApprove" className="text-sm">
                  Auto-approve questions (no moderation)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="showVoting"
                  checked={form.watch('showVoting')}
                  onCheckedChange={(checked) => form.setValue('showVoting', checked === true)}
                />
                <Label htmlFor="showVoting" className="text-sm">
                  Enable question voting
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="isActive"
                  checked={form.watch('isActive')}
                  onCheckedChange={(checked) => form.setValue('isActive', checked === true)}
                />
                <Label htmlFor="isActive" className="text-sm font-medium">
                  Start event immediately
                </Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createEventMutation.isPending}
              className="bg-primary hover:bg-blue-600"
            >
              {createEventMutation.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
