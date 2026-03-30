'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Building2, Calendar, Loader2, TextCursorInput } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QUERY_KEYS } from '@/constants/query-key';
import { cn } from '@/lib/utils';
import { WorkExperience, workExperienceService } from '@/services/work-experience.service';

const formSchema = z.object({
  companyName: z.string().min(1, 'Company name is required'),
  title: z.string().min(1, 'Title is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().optional(),
  isCurrent: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface WorkExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: WorkExperience | null;
}

export const WorkExperienceDialog = ({
  open,
  onOpenChange,
  initialData,
}: WorkExperienceDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      title: '',
      startDate: '',
      endDate: '',
      description: '',
      isCurrent: false,
    },
    mode: 'all',
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          companyName: initialData.companyName,
          title: initialData.title,
          startDate: initialData.startDate,
          endDate: initialData.endDate || '',
          description: initialData.description || '',
          isCurrent: initialData.isCurrent || false,
        });
      } else {
        form.reset({
          companyName: '',
          title: '',
          startDate: '',
          endDate: '',
          description: '',
          isCurrent: false,
        });
      }
    }
  }, [initialData, open, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        companyName: values.companyName,
        title: values.title,
        startDate: values.startDate,
        endDate: values.endDate || null,
        description: values.description || '',
        isCurrent: values.isCurrent || false,
        isVisible: true,
      };

      if (isEditMode && initialData) {
        return workExperienceService.updateWorkExperience({
          id: initialData.id,
          ...payload,
        });
      } else {
        return workExperienceService.createWorkExperience(payload);
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode ? 'Work experience updated successfully' : 'Work experience added successfully'
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORK_EXPERIENCE.GET_ALL() });
      onOpenChange(false);
    },
    onError: () => {
      toast.error(isEditMode ? 'Failed to update.' : 'Failed to add. Please try again.');
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md' onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Work Experience' : 'Add Work Experience'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Company Name */}
            <FormField
              control={form.control}
              name='companyName'
              render={({ field, fieldState }) => (
                <FormItem>
                  <Label className={cn(fieldState.invalid && 'text-destructive')}>
                    Company Name
                  </Label>
                  <div className='relative'>
                    <Building2
                      className={cn(
                        'absolute top-2.5 left-3 h-4 w-4',
                        fieldState.invalid ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <FormControl>
                      <Input
                        placeholder='e.g. Paulus'
                        className={cn(
                          'pl-9',
                          fieldState.invalid &&
                            'border-destructive placeholder:text-destructive/60 focus-visible:ring-destructive/30'
                        )}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Job Title */}
            <FormField
              control={form.control}
              name='title'
              render={({ field, fieldState }) => (
                <FormItem>
                  <Label className={cn(fieldState.invalid && 'text-destructive')}>Title</Label>
                  <div className='relative'>
                    <Briefcase
                      className={cn(
                        'absolute top-2.5 left-3 h-4 w-4',
                        fieldState.invalid ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <FormControl>
                      <Input
                        placeholder='e.g. Chief Creative Officer'
                        className={cn(
                          'pl-9',
                          fieldState.invalid &&
                            'border-destructive placeholder:text-destructive/60 focus-visible:ring-destructive/30'
                        )}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name='startDate'
              render={({ field, fieldState }) => (
                <FormItem>
                  <Label className={cn(fieldState.invalid && 'text-destructive')}>Start Date</Label>
                  <div className='relative'>
                    <Calendar
                      className={cn(
                        'absolute top-2.5 left-3 h-4 w-4',
                        fieldState.invalid ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <FormControl>
                      <Input
                        type='date'
                        className={cn(
                          'pl-9',
                          fieldState.invalid &&
                            'border-destructive focus-visible:ring-destructive/30'
                        )}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name='endDate'
              render={({ field }) => (
                <FormItem>
                  <Label>End Date</Label>
                  <div className='relative'>
                    <Calendar className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
                    <FormControl>
                      <Input
                        type='date'
                        className='pl-9'
                        disabled={form.watch('isCurrent')}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormDescription className='text-xs'>
                    Leave empty if you are currently working here
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Is Current */}
            <FormField
              control={form.control}
              name='isCurrent'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3'>
                  <div className='space-y-0.5'>
                    <Label>Currently Working Here</Label>
                  </div>
                  <FormControl>
                    <input
                      type='checkbox'
                      checked={field.value || false}
                      onChange={field.onChange}
                      className='accent-primary h-4 w-4 cursor-pointer'
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name='description'
              render={({ field, fieldState }) => (
                <FormItem>
                  <Label className={cn(fieldState.invalid && 'text-destructive')}>
                    Description
                  </Label>
                  <div className='relative'>
                    <TextCursorInput
                      className={cn(
                        'absolute top-2.5 left-3 h-4 w-4',
                        fieldState.invalid ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <FormControl>
                      <Input
                        placeholder='Brief description of your role...'
                        className={cn('pl-9', fieldState.invalid && 'border-destructive')}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className='pt-2'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => onOpenChange(false)}
                className='cursor-pointer'
              >
                Cancel
              </Button>
              <Button type='submit' disabled={mutation.isPending} className='cursor-pointer'>
                {mutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {isEditMode ? 'Save Changes' : 'Add Experience'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
