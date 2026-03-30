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
import { awardRecordService } from '@/services/award-record.service';

interface DeleteAwardRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  awardRecordId: number;
}

export const DeleteAwardRecordDialog = ({
  open,
  onOpenChange,
  awardRecordId,
}: DeleteAwardRecordDialogProps) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => awardRecordService.deleteAwardRecord(id),
    onSuccess: () => {
      toast.success('Award record deleted successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.AWARD_RECORD.GET_ALL() });
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Failed to delete. Please try again.');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(awardRecordId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <div className='text-destructive flex items-center gap-2'>
            <AlertTriangle className='h-6 w-6' />
            <DialogTitle>Delete Award Record</DialogTitle>
          </div>
          <DialogDescription className='pt-2'>
            Are you sure you want to delete this award record? This action cannot be undone.
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
