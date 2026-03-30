'use client';

import { useQuery } from '@tanstack/react-query';
import { User, Briefcase, Award, Scale, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { QUERY_KEYS } from '@/constants/query-key';
import { DataSection } from '@/features/data-page/components/data-section';
import { BioSection } from '@/features/data-page/data-section';
import { cn } from '@/lib/utils';
import { AwardRecord, awardRecordService } from '@/services/award-record.service';
import { JuryExperience, juryExperienceService } from '@/services/jury-experience.service';
import { WorkExperience, workExperienceService } from '@/services/work-experience.service';
import { useStore } from '@/stores/use-store';

import { AwardRecordDialog } from './components/award-records/award-record-dialog';
import { AwardRecordItem } from './components/award-records/award-record-item';
import { DeleteAwardRecordDialog } from './components/award-records/delete-award-record-dialog';
import { DeleteJudgingDialog } from './components/judging-experiences/delete-judging-dialog';
import { JudgingExperienceDialog } from './components/judging-experiences/judging-experience-dialog';
import { JudgingItem } from './components/judging-experiences/judging-item';
import { DeleteWorkExperienceDialog } from './components/work-experiences/delete-work-experience-dialog';
import { WorkExperienceDialog } from './components/work-experiences/work-experience-dialog';
import { WorkExperienceItem } from './components/work-experiences/work-experience-item';

const DataWrapper = () => {
  const { user, updateBio } = useStore();
  const [isRenewing, setIsRenewing] = useState(false);
  const [cooldown, setCooldown] = useState(false);

  // --- WORK EXPERIENCE STATE MANAGEMENT ---
  const [workDialogState, setWorkDialogState] = useState<'add' | WorkExperience | null>(null);
  const [deletingWorkId, setDeletingWorkId] = useState<number | null>(null);

  // --- AWARD RECORD STATE MANAGEMENT ---
  const [awardDialogState, setAwardDialogState] = useState<'add' | AwardRecord | null>(null);
  const [deletingAwardId, setDeletingAwardId] = useState<number | null>(null);

  // --- JUDGING EXPERIENCE STATE MANAGEMENT ---
  // null = dialog closed
  // 'add' = open dialog for adding new item
  // object JuryExperience = open dialog for editing that item
  const [dialogState, setDialogState] = useState<'add' | JuryExperience | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleRenew = async () => {};

  const { data: juryExperiences } = useQuery({
    queryKey: QUERY_KEYS.JURY_EXPERIENCE.GET_ALL(),
    queryFn: () => juryExperienceService.getJuryExperiences(),
  });

  const { data: workExperiences } = useQuery({
    queryKey: QUERY_KEYS.WORK_EXPERIENCE.GET_ALL(),
    queryFn: () => workExperienceService.getWorkExperiences(),
  });

  const { data: awardRecords } = useQuery({
    queryKey: QUERY_KEYS.AWARD_RECORD.GET_ALL(),
    queryFn: () => awardRecordService.getAwardRecords(),
  });

  return (
    <div className='safe-top bg-background min-h-screen pb-24'>
      <div className='mx-auto max-w-lg px-4 py-6'>
        <header className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='font-display text-foreground text-2xl font-bold'>My Data</h1>
            <p className='text-muted-foreground mt-1 text-sm'>AI-scraped professional profile</p>
          </div>

          <Button
            onClick={handleRenew}
            disabled={isRenewing || cooldown}
            size='sm'
            className={cn(
              'text-primary-foreground bg-primary hover:bg-primary/90',
              isRenewing && 'animate-pulse'
            )}
          >
            <RefreshCw className={cn('mr-2 h-4 w-4', isRenewing && 'animate-spin')} />
            {isRenewing ? 'Renewing...' : 'Renew with AI'}
          </Button>
        </header>

        <div className='space-y-4'>
          <DataSection title='Bio' icon={<User className='h-5 w-5' />} defaultExpanded={true}>
            <BioSection bio={user.bio} onUpdate={updateBio} />
          </DataSection>

          <DataSection
            title='Experience'
            icon={<Briefcase className='h-5 w-5' />}
            count={workExperiences?.length}
            defaultExpanded={true}
            onAdd={() => setWorkDialogState('add')}
            addLabel='Add Work Experience'
          >
            <div className='space-y-0'>
              {workExperiences?.map((exp) => (
                <WorkExperienceItem
                  key={exp.id}
                  id={exp.id}
                  companyName={exp.companyName}
                  title={exp.title}
                  startDate={exp.startDate}
                  endDate={exp.endDate}
                  description={exp.description}
                  isCurrent={exp.isCurrent}
                  isVisible={exp.isVisible}
                  onEdit={() => setWorkDialogState(exp)}
                  onDelete={() => setDeletingWorkId(exp.id)}
                />
              ))}
            </div>
          </DataSection>

          <DataSection
            title='Award Winning Records'
            icon={<Award className='h-5 w-5' />}
            count={awardRecords?.length}
            defaultExpanded={false}
            onAdd={() => setAwardDialogState('add')}
            addLabel='Add Award Record'
          >
            <div className='space-y-0'>
              {awardRecords?.map((award) => (
                <AwardRecordItem
                  key={award.id}
                  id={award.id}
                  organization={award.organization}
                  years={award.years}
                  awardType={award.awardType}
                  category={award.category}
                  onEdit={() => setAwardDialogState(award)}
                  onDelete={() => setDeletingAwardId(award.id)}
                />
              ))}
            </div>
          </DataSection>

          <DataSection
            title='Judging Experience'
            icon={<Scale className='h-5 w-5' />}
            count={juryExperiences?.length}
            defaultExpanded={false}
            onAdd={() => setDialogState('add')}
            addLabel='Add New Experience'
          >
            <div className='space-y-0'>
              {juryExperiences?.map((judging) => (
                <div key={judging.id} className='relative'>
                  <JudgingItem
                    id={judging.id}
                    eventName={judging.eventName}
                    years={judging.years}
                    role={judging.role}
                    onEdit={() => setDialogState(judging)}
                    onDelete={() => setDeletingId(judging.id)}
                  />
                </div>
              ))}
            </div>
            {/* No need for a manual Button container here anymore */}
          </DataSection>
        </div>

        {/* --- DIALOG QUẢN LÝ --- */}

        {/* Edit & Add chung 1 Component */}
        {dialogState && (
          <JudgingExperienceDialog
            open={!!dialogState}
            onOpenChange={(open) => !open && setDialogState(null)}
            // If dialogState is an object (Edit), pass it in; if 'add', initialData will be null/undefined
            initialData={typeof dialogState === 'object' ? dialogState : null}
          />
        )}

        {/* Delete Dialog */}
        {deletingId && (
          <DeleteJudgingDialog
            open={!!deletingId}
            onOpenChange={(open) => !open && setDeletingId(null)}
            juryId={deletingId}
          />
        )}

        {/* Work Experience Edit & Add */}
        {workDialogState && (
          <WorkExperienceDialog
            open={!!workDialogState}
            onOpenChange={(open) => !open && setWorkDialogState(null)}
            initialData={typeof workDialogState === 'object' ? workDialogState : null}
          />
        )}

        {/* Work Experience Delete Dialog */}
        {deletingWorkId && (
          <DeleteWorkExperienceDialog
            open={!!deletingWorkId}
            onOpenChange={(open) => !open && setDeletingWorkId(null)}
            workExperienceId={deletingWorkId}
          />
        )}

        {/* Award Record Edit & Add */}
        {awardDialogState && (
          <AwardRecordDialog
            open={!!awardDialogState}
            onOpenChange={(open) => !open && setAwardDialogState(null)}
            initialData={typeof awardDialogState === 'object' ? awardDialogState : null}
          />
        )}

        {/* Award Record Delete Dialog */}
        {deletingAwardId && (
          <DeleteAwardRecordDialog
            open={!!deletingAwardId}
            onOpenChange={(open) => !open && setDeletingAwardId(null)}
            awardRecordId={deletingAwardId}
          />
        )}
      </div>
    </div>
  );
};

export default DataWrapper;
