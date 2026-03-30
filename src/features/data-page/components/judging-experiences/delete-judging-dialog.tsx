'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QUERY_KEYS } from '@/constants/query-key';
import { juryExperienceService } from '@/services/jury-experience.service';

interface DeleteJudgingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  juryId: number;
}

export const DeleteJudgingDialog = ({ open, onOpenChange, juryId }: DeleteJudgingDialogProps) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => juryExperienceService.deleteJuryExperience(id),
    onSuccess: () => {
      toast.success('Experience deleted successfully');
      // Refresh the list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JURY_EXPERIENCE.GET_ALL() });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to delete. Please try again.');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(juryId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <div className='text-destructive flex items-center gap-2'>
            <AlertTriangle className='h-6 w-6' />
            <DialogTitle>Delete Experience</DialogTitle>
          </div>
          <DialogDescription className='pt-2'>
            Are you sure you want to delete this judging experience? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button
            type='button'
            variant='ghost'
            onClick={() => onOpenChange(false)}
            className='cursor-pointer'
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type='button'
            variant='destructive'
            onClick={handleDelete}
            className='bg-destructive hover:bg-destructive/90 ml-2 cursor-pointer'
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
