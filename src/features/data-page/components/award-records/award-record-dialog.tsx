'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, Calendar, Loader2, Tag } from 'lucide-react';
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
import { AwardRecord, awardRecordService } from '@/services/award-record.service';

const formSchema = z.object({
  organization: z.string().min(1, 'Organization is required').max(255),
  year: z.string().min(1, 'Year is required'),
  awardType: z.string().max(100).optional(),
  category: z.string().max(255).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AwardRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: AwardRecord | null;
}

export const AwardRecordDialog = ({ open, onOpenChange, initialData }: AwardRecordDialogProps) => {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organization: '',
      year: '',
      awardType: '',
      category: '',
    },
    mode: 'all',
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          organization: initialData.organization,
          year: initialData.years.join(', '),
          awardType: initialData.awardType || '',
          category: initialData.category || '',
        });
      } else {
        form.reset({
          organization: '',
          year: '',
          awardType: '',
          category: '',
        });
      }
    }
  }, [initialData, open, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const years = values.year
        .split(',')
        .map((y) => parseInt(y.trim(), 10))
        .filter((n) => !isNaN(n));

      const payload = {
        organization: values.organization,
        years,
        awardType: values.awardType || '',
        category: values.category || '',
      };

      if (isEditMode && initialData) {
        return awardRecordService.updateAwardRecord({
          id: initialData.id,
          ...payload,
        });
      } else {
        return awardRecordService.createAwardRecord(payload);
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode ? 'Award record updated successfully' : 'Award record added successfully'
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AWARD_RECORD.GET_ALL() });
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
          <DialogTitle>{isEditMode ? 'Edit Award Record' : 'Add Award Record'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Organization */}
            <FormField
              control={form.control}
              name='organization'
              render={({ field, fieldState }) => (
                <FormItem>
                  <Label className={cn(fieldState.invalid && 'text-destructive')}>
                    Organization
                  </Label>
                  <div className='relative'>
                    <Award
                      className={cn(
                        'absolute top-2.5 left-3 h-4 w-4',
                        fieldState.invalid ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <FormControl>
                      <Input
                        placeholder='e.g. One Show, Cannes Lions'
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

            {/* Year(s) */}
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

            {/* Award Type */}
            <FormField
              control={form.control}
              name='awardType'
              render={({ field, fieldState }) => (
                <FormItem>
                  <Label className={cn(fieldState.invalid && 'text-destructive')}>Award Type</Label>
                  <div className='relative'>
                    <Tag
                      className={cn(
                        'absolute top-2.5 left-3 h-4 w-4',
                        fieldState.invalid ? 'text-destructive' : 'text-muted-foreground'
                      )}
                    />
                    <FormControl>
                      <Input
                        placeholder='e.g. Gold, Grand Prix, Bronze'
                        className={cn('pl-9', fieldState.invalid && 'border-destructive')}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <Label>Category</Label>
                  <div className='relative'>
                    <Tag className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
                    <FormControl>
                      <Input
                        placeholder='e.g. Creative Strategy, Digital'
                        className='pl-9'
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
                {isEditMode ? 'Save Changes' : 'Add Award'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
