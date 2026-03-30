'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Calendar, Loader2, Trophy } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

import { MultiSelectYear } from '@/components/multi-select-year';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QUERY_KEYS } from '@/constants/query-key';
import { cn } from '@/lib/utils';
import { JuryExperience, juryExperienceService } from '@/services/jury-experience.service';

const formSchema = z.object({
  eventName: z.string().min(1, 'Event name is required'),
  year: z.string().min(1, 'Year is required'),
  role: z.string().min(1, 'Role is required'),
});

type FormValues = z.infer<typeof formSchema>;

interface JuryExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: JuryExperience | null;
}

export const JudgingExperienceDialog = ({
  open,
  onOpenChange,
  initialData,
}: JuryExperienceDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      eventName: '',
      role: '',
      year: '',
    },
    mode: 'all',
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          eventName: initialData.eventName,
          role: initialData.role,
          year: initialData.years.join(', '),
        });
      } else {
        form.reset({
          eventName: '',
          role: '',
          year: '',
        });
      }
    }
  }, [initialData, open, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const newYears = values.year
        .split(',')
        .map((y) => parseInt(y.trim(), 10))
        .filter((n) => !isNaN(n));

      if (isEditMode && initialData) {
        return juryExperienceService.updateJuryExperience({
          id: initialData.id,
          eventName: values.eventName,
          role: values.role,
          years: newYears,
        });
      } else {
        return juryExperienceService.createJuryExperience({
          eventName: values.eventName,
          role: values.role,
          years: newYears,
        });
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode ? 'Experience updated successfully' : 'Experience added successfully'
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JURY_EXPERIENCE.GET_ALL() });
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
      <DialogContent
        className='sm:max-w-md'
        // [FIX] Prevent auto-focus on the first input when dialog opens
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Judging Experience' : 'Add Judging Experience'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Event Name */}
            <FormField
              control={form.control}
              name='eventName'
              render={({ field, fieldState }) => (
                <FormItem>
                  <Label className={cn(fieldState.invalid && 'text-destructive')}>Event Name</Label>
                  <div className='relative'>
                    <Trophy
                      className={cn(
                        'absolute top-2.5 left-3 h-4 w-4',
                        fieldState.invalid ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <FormControl>
                      <Input
                        placeholder='e.g. Awwwards'
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

            {/* Year */}
            <FormField
              control={form.control}
              name='year'
              render={({ field, fieldState }) => (
                <FormItem>
                  <Label className={cn(fieldState.invalid && 'text-destructive')}>Year(s)</Label>
                  <div className='relative'>
                    <Calendar
                      className={cn(
                        'absolute top-2.5 left-3 z-10 h-4 w-4',
                        fieldState.invalid ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <div className='pl-9'>
                      <FormControl>
                        <MultiSelectYear
                          value={field.value}
                          onChange={field.onChange}
                          hasError={fieldState.invalid}
                          maxDisplay={3}
                        />
                      </FormControl>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role */}
            <FormField
              control={form.control}
              name='role'
              render={({ field, fieldState }) => (
                <FormItem>
                  <Label className={cn(fieldState.invalid && 'text-destructive')}>Role</Label>
                  <div className='relative'>
                    <Briefcase
                      className={cn(
                        'absolute top-2.5 left-3 h-4 w-4',
                        fieldState.invalid ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <FormControl>
                      <Input
                        placeholder='e.g. Grand Jury'
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
