import { BottomNavigation } from '@/components/layout/bottom-navigation';

export default function UserDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='relative min-h-screen pb-20'>
      {children}
      <BottomNavigation />
    </div>
  );
}
