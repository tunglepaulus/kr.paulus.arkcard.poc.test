'use client';

import { Plus, Trash2, Briefcase, UserRoundCog } from 'lucide-react';
import {
  Control,
  useFieldArray,
  useFormState,
  Controller,
  UseFormSetValue, // [IMPORT] Add this type
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OnboardingFormData } from '@/features/onboarding/schemas';

interface StepWorkProps {
  control: Control<OnboardingFormData>;
  setValue: UseFormSetValue<OnboardingFormData>; // [NEW] Need this function to set data
}

const StepWork = ({ control, setValue }: StepWorkProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'companies',
  });

  const { errors } = useFormState({ control });

  // [NEW LOGIC] Handler that allows only 1 current company to be selected
  const handleCurrentCompanyChange = (index: number, isChecked: boolean) => {
    if (isChecked) {
      // If user checks this box -> Uncheck ALL other boxes
      fields.forEach((_, i) => {
        if (i !== index) {
          setValue(`companies.${i}.isCurrentCompany`, false, {
            shouldDirty: true,
            shouldTouch: true,
            shouldValidate: true,
          });
        }
      });
    }
    // Update value for the clicked checkbox
    setValue(`companies.${index}.isCurrentCompany`, isChecked, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  return (
    <div className='animate-fade-in mx-auto flex w-full max-w-lg flex-col'>
      <p className='text-muted-foreground mb-2 text-sm tracking-wide uppercase'>
        Professional Background
      </p>
      <h2 className='font-display text-foreground mb-6 text-2xl font-semibold'>
        Where do you work?
      </h2>

      <div className='flex flex-col gap-4'>
        <div className='custom-scrollbar max-h-[500px] space-y-6 overflow-y-auto p-1'>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className='group animate-in slide-in-from-bottom-2 fade-in border-border/40 bg-secondary/10 hover:border-border/80 relative flex flex-col gap-3 rounded-lg border p-4 transition-all'
            >
              <div className='grid gap-3 sm:grid-cols-2'>
                {/* COMPANY NAME */}
                <div className='flex flex-col gap-1.5'>
                  <div className='relative'>
                    <Briefcase className='text-muted-foreground absolute top-3.5 left-3 h-4 w-4' />
                    <Input
                      {...control.register(`companies.${index}.companyName`)}
                      placeholder='Company Name'
                      className={`bg-background h-11 pl-9 ${
                        errors.companies?.[index]?.companyName
                          ? 'border-destructive ring-destructive/20'
                          : ''
                      }`}
                      autoFocus={index === fields.length - 1}
                    />
                  </div>
                  {errors.companies?.[index]?.companyName && (
                    <p className='text-destructive ml-1 text-xs'>
                      {errors.companies[index]?.companyName?.message}
                    </p>
                  )}
                </div>

                {/* JOB TITLE */}
                <div className='flex flex-col gap-1.5'>
                  <div className='relative'>
                    <UserRoundCog className='text-muted-foreground absolute top-3.5 left-3 h-4 w-4' />
                    <Input
                      {...control.register(`companies.${index}.jobTitle`)}
                      placeholder='Job Title'
                      className={`bg-background h-11 pl-9 ${
                        errors.companies?.[index]?.jobTitle
                          ? 'border-destructive ring-destructive/20'
                          : ''
                      }`}
                    />
                  </div>
                  {errors.companies?.[index]?.jobTitle && (
                    <p className='text-destructive ml-1 text-xs'>
                      {errors.companies[index]?.jobTitle?.message}
                    </p>
                  )}
                </div>
              </div>

              {/* ACTION ROW */}
              <div className='flex items-center justify-between pt-1'>
                <div className='flex items-center space-x-2'>
                  <Controller
                    control={control}
                    name={`companies.${index}.isCurrentCompany`}
                    render={({ field: { value } }) => (
                      <Checkbox
                        id={`current-${field.id}`}
                        checked={value ?? false}
                        // [UPDATE] Call handleCurrentCompanyChange instead of default onChange
                        onCheckedChange={(checked) =>
                          handleCurrentCompanyChange(index, checked as boolean)
                        }
                      />
                    )}
                  />
                  <Label
                    htmlFor={`current-${field.id}`}
                    className='text-muted-foreground cursor-pointer text-sm font-normal select-none'
                  >
                    I currently work here
                  </Label>
                </div>

                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  className='text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 cursor-pointer px-2 disabled:opacity-30'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  <span className='text-xs'>Remove</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() =>
            append({
              companyName: '',
              jobTitle: '',
              id: null,
              isCurrentCompany: false, // New entry defaults to not selected
            })
          }
          className='text-muted-foreground hover:text-primary hover:border-primary mt-2 cursor-pointer self-start border-dashed'
        >
          <Plus className='mr-2 h-4 w-4' />
          Add another position
        </Button>

        {errors.companies?.root && (
          <p className='text-destructive text-xs font-medium'>{errors.companies.root.message}</p>
        )}
      </div>
    </div>
  );
};

export default StepWork;
