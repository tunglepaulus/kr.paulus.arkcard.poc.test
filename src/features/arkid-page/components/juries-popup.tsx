'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Briefcase,
  Calendar,
  Check,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Trophy,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import * as z from 'zod';

import { MultiSelectYear } from '@/components/multi-select-year';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QUERY_KEYS } from '@/constants/query-key';
import { cn } from '@/lib/utils';
import {
  JuryListItem,
  ScrapeJuries,
  juryExperienceService,
} from '@/services/jury-experience.service';

interface JuriesPopupProps {
  onSuccess?: () => void;
}

const eventSchema = z.object({
  id: z.string(),
  eventName: z.string().min(1, 'Event name is required'),
  year: z.string().min(1, 'Year is required'),
  role: z.string().min(1, 'Role is required'),
});

const formSchema = z.object({
  events: z.array(eventSchema),
});

type FormValues = z.infer<typeof formSchema>;

export const JuriesPopup = ({ onSuccess }: JuriesPopupProps) => {
  const [open, setOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJuries, setSelectedJuries] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch all juries from DB instead of AI scraping
  const { data: allJuries, isLoading: isFetchingData } = useQuery({
    queryKey: QUERY_KEYS.JURY_EXPERIENCE.ALL_JURIES(),
    queryFn: () => juryExperienceService.getAllJuries(),
    enabled: open,
  });

  // Filter juries based on search query
  const filteredJuries = useMemo(() => {
    if (!allJuries) return [];
    if (!searchQuery.trim()) return allJuries;
    const query = searchQuery.toLowerCase().trim();
    return allJuries.filter(
      (jury) =>
        jury.eventName.toLowerCase().includes(query) ||
        jury.roles.some((r) => r.toLowerCase().includes(query))
    );
  }, [allJuries, searchQuery]);

  const updateMutation = useMutation({
    mutationFn: (data: ScrapeJuries[]) =>
      juryExperienceService.updateJuryExperiencesBulk(data),
    onSuccess: () => {
      toast.success('Information updated successfully! Welcome aboard.');
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.JURY_EXPERIENCE.ALL_JURIES(),
      });
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: () => {
      toast.error('Failed to save events. Please try again.');
    },
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      events: [],
    },
    mode: 'all',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'events',
  });

  // Toggle a jury from the DB list — add/remove from the form
  const toggleJury = (jury: JuryListItem) => {
    const key = jury.eventName.toLowerCase().trim();
    const newSelected = new Set(selectedJuries);

    if (newSelected.has(key)) {
      // Remove from selected and from form
      newSelected.delete(key);
      const idx = fields.findIndex(
        (f) => f.eventName.toLowerCase().trim() === key
      );
      if (idx !== -1) remove(idx);
    } else {
      // Add to selected and to form
      newSelected.add(key);
      append({
        id: uuidv4(),
        eventName: jury.eventName,
        year: jury.years.length > 0 ? jury.years.join(', ') : '',
        role: jury.roles.length > 0 ? jury.roles[0] : '',
      });
    }

    setSelectedJuries(newSelected);
  };

  const onSubmit = (data: FormValues) => {
    const payload: ScrapeJuries[] = data.events.map((event) => {
      const yearsArray = event.year
        .split(',')
        .map((y) => parseInt(y.trim(), 10))
        .filter((y) => !isNaN(y));

      return {
        eventName: event.eventName,
        role: event.role,
        years: yearsArray,
      };
    });

    updateMutation.mutate(payload);
  };

  const onError = () => {
    toast.error('Please fill in all required fields.', {
      icon: <AlertCircle className='text-destructive h-4 w-4' />,
    });
  };

  const isSaving = updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className='bg-background/95 w-full backdrop-blur-xl sm:max-w-4xl [&>button]:hidden'
      >
        <DialogHeader>
          <DialogTitle className='font-display text-2xl'>Event History</DialogTitle>
          <DialogDescription className='text-base'>
            Select events from the list below, or add your own. Fill in year(s)
            and role for each selected event.
          </DialogDescription>
        </DialogHeader>

        {isFetchingData ? (
          <div className='flex h-[300px] w-full items-center justify-center'>
            <Loader2 className='text-primary h-8 w-8 animate-spin' />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)}>
              {/* Search and select from DB juries */}
              {allJuries && allJuries.length > 0 && (
                <div className='mb-4 space-y-3'>
                  <Label className='text-sm font-medium'>
                    Select from existing events
                  </Label>

                  {/* Search input */}
                  <div className='relative'>
                    <Search className='text-muted-foreground/60 absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                    <Input
                      placeholder='Search events...'
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className='h-9 pl-9'
                    />
                  </div>

                  {/* Selectable jury list */}
                  <div className='custom-scrollbar grid max-h-[180px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2'>
                    {filteredJuries.map((jury) => {
                      const key = jury.eventName.toLowerCase().trim();
                      const isSelected = selectedJuries.has(key);
                      return (
                        <button
                          key={key}
                          type='button'
                          onClick={() => toggleJury(jury)}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
                            isSelected
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border/60 hover:border-primary/40 hover:bg-secondary/10 text-foreground'
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border'
                            )}
                          >
                            {isSelected && <Check className='h-3 w-3' />}
                          </div>
                          <div className='min-w-0 flex-1'>
                            <div className='truncate font-medium'>
                              {jury.eventName}
                            </div>
                            {jury.roles.length > 0 && (
                              <div className='text-muted-foreground truncate text-xs'>
                                {jury.roles.join(', ')}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    {filteredJuries.length === 0 && (
                      <div className='text-muted-foreground col-span-2 py-4 text-center text-sm'>
                        No events found matching &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Divider between selection and form */}
              {fields.length > 0 && (
                <div className='border-border/40 mb-4 border-t pt-4'>
                  <Label className='text-sm font-medium'>
                    Selected events — edit details below
                  </Label>
                </div>
              )}

              {/* Column headers for desktop */}
              {fields.length > 0 && (
                <div className='text-muted-foreground border-border/40 hidden grid-cols-12 gap-4 border-b px-4 py-3 text-xs font-semibold tracking-wider uppercase lg:grid'>
                  <div className='col-span-5'>Event Name</div>
                  <div className='col-span-3'>Year(s)</div>
                  <div className='col-span-3'>Role</div>
                  <div className='col-span-1 text-center'></div>
                </div>
              )}
              <div className='custom-scrollbar -mr-2 max-h-[35vh] space-y-4 overflow-y-auto p-1 pr-2 lg:max-h-[300px] lg:space-y-3'>
                {fields.length === 0 ? (
                  <div className='text-muted-foreground bg-secondary/5 rounded-xl border border-dashed py-12 text-center'>
                    <div className='bg-secondary/20 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full'>
                      <Trophy className='h-6 w-6 opacity-50' />
                    </div>
                    <p>
                      {allJuries && allJuries.length > 0
                        ? 'Select events from the list above, or add a custom event below.'
                        : 'No events found. Please add your first event to continue.'}
                    </p>
                  </div>
                ) : (
                  fields.map((field, index) => (
                    <div
                      key={field.id}
                      className={cn(
                        'group animate-in fade-in slide-in-from-bottom-2 duration-300',
                        'border-border/60 bg-secondary/5 relative grid grid-cols-1 gap-4 rounded-xl border p-4 shadow-sm',
                        'lg:grid-cols-12 lg:items-start lg:gap-4 lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none',
                        form.formState.errors.events?.[index] &&
                          'border-destructive/50 bg-destructive/5 lg:border-none lg:bg-transparent'
                      )}
                    >
                      <div className='relative lg:col-span-5'>
                        <div className='mb-1.5 flex items-center gap-2 lg:hidden'>
                          <Trophy className='text-muted-foreground h-3.5 w-3.5' />
                          <Label className='text-muted-foreground text-xs font-medium uppercase'>
                            Event Name
                          </Label>
                        </div>

                        <div className='relative'>
                          <FormField
                            control={form.control}
                            name={`events.${index}.eventName`}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <div className='text-muted-foreground/70 pointer-events-none absolute top-1/2 left-3 z-10 hidden -translate-y-1/2 lg:block'>
                                  <Trophy
                                    className={cn(
                                      'h-4 w-4',
                                      fieldState.invalid && 'text-destructive'
                                    )}
                                  />
                                </div>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder='E.g. EthDenver'
                                    className={cn(
                                      'h-10 w-full shadow-sm transition-all lg:pl-10',
                                      fieldState.invalid
                                        ? 'border-destructive focus-visible:ring-destructive/30'
                                        : 'border-input hover:border-primary/50 focus:border-primary'
                                    )}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className='relative lg:col-span-3'>
                        <div className='mb-1.5 flex items-center gap-2 lg:hidden'>
                          <Calendar className='text-muted-foreground h-3.5 w-3.5' />
                          <Label className='text-muted-foreground text-xs font-medium uppercase'>
                            Year(s)
                          </Label>
                        </div>

                        <div className='relative'>
                          <FormField
                            control={form.control}
                            name={`events.${index}.year`}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <div className='text-muted-foreground/70 pointer-events-none absolute top-1/2 left-3 z-10 hidden -translate-y-1/2 lg:block'>
                                  <Calendar
                                    className={cn(
                                      'h-4 w-4',
                                      fieldState.invalid && 'text-destructive'
                                    )}
                                  />
                                </div>
                                <div className='lg:pl-8'>
                                  <FormControl>
                                    {/* [UPDATE] Use shared Component */}
                                    <MultiSelectYear
                                      value={field.value}
                                      onChange={field.onChange}
                                      hasError={fieldState.invalid}
                                      maxDisplay={2}
                                    />
                                  </FormControl>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className='relative lg:col-span-3'>
                        <div className='mb-1.5 flex items-center gap-2 lg:hidden'>
                          <Briefcase className='text-muted-foreground h-3.5 w-3.5' />
                          <Label className='text-muted-foreground text-xs font-medium uppercase'>
                            Role
                          </Label>
                        </div>

                        <div className='relative'>
                          <FormField
                            control={form.control}
                            name={`events.${index}.role`}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <div className='text-muted-foreground/70 pointer-events-none absolute top-1/2 left-3 z-10 hidden -translate-y-1/2 lg:block'>
                                  <Briefcase
                                    className={cn(
                                      'h-4 w-4',
                                      fieldState.invalid && 'text-destructive'
                                    )}
                                  />
                                </div>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder='E.g. Speaker'
                                    className={cn(
                                      'h-10 w-full shadow-sm transition-all lg:pl-10',
                                      fieldState.invalid
                                        ? 'border-destructive focus-visible:ring-destructive/30'
                                        : 'border-input hover:border-primary/50 focus:border-primary'
                                    )}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className='absolute top-2 right-2 lg:relative lg:top-auto lg:right-auto lg:col-span-1 lg:flex lg:justify-center'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => {
                            // Also remove from selectedJuries when deleting
                            const eventName = form.getValues(
                              `events.${index}.eventName`
                            );
                            const key = eventName.toLowerCase().trim();
                            const newSelected = new Set(selectedJuries);
                            newSelected.delete(key);
                            setSelectedJuries(newSelected);
                            remove(index);
                          }}
                          className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 cursor-pointer lg:h-9 lg:w-9'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className='pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    append({
                      id: uuidv4(),
                      eventName: '',
                      year: '',
                      role: '',
                    })
                  }
                  className='border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-primary text-muted-foreground h-11 w-full cursor-pointer border-dashed text-sm font-normal transition-all'
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Add Custom Event
                </Button>
              </div>

              <DialogFooter className='border-border/40 mt-2 border-t pt-4 sm:justify-end'>
                <Button
                  type='submit'
                  disabled={isSaving}
                  className='h-10 min-w-[140px] cursor-pointer px-8'
                >
                  {isSaving ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Save className='mr-2 h-4 w-4' />
                  )}
                  Save & Continue
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

