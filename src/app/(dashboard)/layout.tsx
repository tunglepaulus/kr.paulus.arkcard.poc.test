import { BottomNavigation } from '@/components/layout/bottom-navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative min-h-screen pb-20'>
      {children}
      <BottomNavigation />
    </div>
  );
}
