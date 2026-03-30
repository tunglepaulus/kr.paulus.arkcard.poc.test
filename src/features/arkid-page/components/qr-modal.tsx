'use client';

import { QrCode, Download, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUserStore } from '@/stores/use-user-store';

interface QRModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const QRModal = ({ open = false, onOpenChange }: QRModalProps) => {
  const { user: currentUser } = useUserStore();

  const profileUrl = currentUser?.uuid
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/user/${currentUser.uuid}`
    : '';

  const handleDownload = useCallback(() => {
    if (!profileUrl) return;

    const svg = document.getElementById('ark-qr-code') as SVGElement | null;
    if (!svg) {
      toast.error('QR code not ready');
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Failed to create canvas');
      return;
    }

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgWidth = svg.getAttribute('width') ?? '256';
    const svgHeight = svg.getAttribute('height') ?? '256';
    const img = new Image(Number(svgWidth), Number(svgHeight));

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `ark-card-${currentUser?.uuid ?? 'qr'}.png`;
      link.href = pngUrl;
      link.click();
      toast.success('QR code downloaded!');
    };

    img.onerror = () => toast.error('Failed to generate QR code');
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }, [profileUrl, currentUser]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm'>
        <DialogHeader>
          <DialogTitle className='font-display text-center'>Your Ark.Card QR Code</DialogTitle>
        </DialogHeader>
        <div className='flex flex-col items-center gap-6 py-4'>
          <div className='bg-card border-border flex h-56 w-56 items-center justify-center rounded-2xl border-2 p-4'>
            {profileUrl ? (
              <QRCodeSVG
                id='ark-qr-code'
                value={profileUrl}
                size={200}
                level='H'
                includeMargin
                bgColor='#ffffff'
                fgColor='#000000'
              />
            ) : (
              <span className='text-muted-foreground text-sm'>Loading...</span>
            )}
          </div>

          <div className='text-center'>
            <p className='text-foreground font-medium'>{currentUser?.name ?? 'Your Name'}</p>
            <p className='text-muted-foreground text-sm'>{currentUser?.email ?? ''}</p>
          </div>

          <Button
            variant='outline'
            className='flex w-full cursor-pointer gap-2'
            onClick={handleDownload}
            disabled={!profileUrl}
          >
            <Download className='h-4 w-4' />
            Download QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const QRButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    variant='outline'
    size='icon'
    className='border-border h-10 w-10 cursor-pointer rounded-full'
    onClick={onClick}
  >
    <QrCode className='h-5 w-5' />
  </Button>
);

export const ShareButton = () => {
  const { user: currentUser } = useUserStore();

  const profileUrl = currentUser?.uuid
    ? `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/user/${currentUser.uuid}`
    : '';

  const handleShare = async () => {
    if (!profileUrl) {
      toast.error('Profile URL not available');
      return;
    }

    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Button onClick={handleShare} className='cursor-pointer bg-neutral-100 text-neutral-700'>
      <Share2 className='mr-2 h-4 w-4' />
      Share My Card
    </Button>
  );
};
