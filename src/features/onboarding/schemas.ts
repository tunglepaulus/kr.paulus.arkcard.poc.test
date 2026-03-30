import { z } from 'zod';

const emailRegex =
  /^(?!\.)(?!.*\.{2})([a-zA-Z0-9_'+\-.]*)[a-zA-Z0-9_'+\-]@([a-zA-Z0-9][a-zA-Z0-9\-]*\.)+[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const emailStepSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Please enter a valid email address'),
});

export const identityStepSchema = z.object({
  name: z
    .string()
    .min(2, 'Name needs to be at least 2 characters')
    .refine((val) => val.trim().split(/\s+/).length >= 2, {
      message: 'Please enter your full name (First & Last name)',
    }),
});

// [UPDATE] Updated to match API structure
export const companySchema = z.object({
  id: z.number().nullable().optional(), // API requires id, can be null for new
  companyName: z.string().min(1, 'Company name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  isCurrentCompany: z.boolean().nullable().optional(), // API requires this
});

export const professionalStepSchema = z.object({
  companies: z.array(companySchema).min(1, 'Please add at least one company'),
});

export const securityStepSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(passwordRegex, 'Must contain uppercase, lowercase, number, and special character'),
});

export const onboardingFormSchema = emailStepSchema
  .merge(identityStepSchema)
  .merge(professionalStepSchema)
  .merge(securityStepSchema);

export type OnboardingFormData = z.infer<typeof onboardingFormSchema>;
