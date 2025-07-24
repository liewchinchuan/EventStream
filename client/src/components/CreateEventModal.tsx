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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Create New Event
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Basic Information</h3>
                
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
                      className="mt-1 resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Event URL *</Label>
                    <div className="mt-1 flex items-center">
                      <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-2 rounded-l-md border border-r-0 whitespace-nowrap">
                        {window.location.host}/
                      </span>
                      <Input
                        id="slug"
                        {...form.register('slug')}
                        placeholder="event-url"
                        className={`rounded-l-none text-sm ${isGeneratingSlug ? 'animate-pulse bg-neutral-50' : ''}`}
                      />
                    </div>
                    {form.formState.errors.slug && (
                      <p className="text-sm text-error mt-1">{form.formState.errors.slug.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-900 mb-3">Schedule (Optional)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime" className="text-sm">Start Date & Time</Label>
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
                  <Label htmlFor="endTime" className="text-sm">End Date & Time</Label>
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
            </div>

            {/* Settings */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Event Settings
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="allowQuestions"
                    checked={form.watch('allowQuestions')}
                    onCheckedChange={(checked) => form.setValue('allowQuestions', checked === true)}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="allowQuestions" className="text-sm font-medium">
                      Enable Q&A
                    </Label>
                    <p className="text-xs text-neutral-500">Allow participants to submit questions</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="allowAnonymous"
                    checked={form.watch('allowAnonymous')}
                    onCheckedChange={(checked) => form.setValue('allowAnonymous', checked === true)}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="allowAnonymous" className="text-sm font-medium">
                      Anonymous Users
                    </Label>
                    <p className="text-xs text-neutral-500">Allow participation without names</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="autoApprove"
                    checked={form.watch('autoApprove')}
                    onCheckedChange={(checked) => form.setValue('autoApprove', checked === true)}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="autoApprove" className="text-sm font-medium">
                      Auto-approve
                    </Label>
                    <p className="text-xs text-neutral-500">Questions appear instantly</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="showVoting"
                    checked={form.watch('showVoting')}
                    onCheckedChange={(checked) => form.setValue('showVoting', checked === true)}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="showVoting" className="text-sm font-medium">
                      Question Voting
                    </Label>
                    <p className="text-xs text-neutral-500">Enable upvoting questions</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2 sm:col-span-2">
                  <Checkbox 
                    id="isActive"
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked === true)}
                    className="mt-0.5"
                  />
                  <div>
                    <Label htmlFor="isActive" className="text-sm font-semibold text-green-700">
                      Start Event Immediately
                    </Label>
                    <p className="text-xs text-neutral-500">Make event live right after creation</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Preview */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-neutral-900 mb-2">Preview</h3>
              <p className="text-xs text-neutral-500 mb-2">Participants will join at:</p>
              <div className="bg-white border rounded px-3 py-2 font-mono text-sm text-primary break-all">
                {window.location.host}/{form.watch('slug') || 'your-event-url'}
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 flex justify-end space-x-3 pt-4 mt-4 border-t bg-white">
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
