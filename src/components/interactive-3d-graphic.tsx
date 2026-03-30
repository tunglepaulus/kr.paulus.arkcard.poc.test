import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
  pulseOffset: number;
}

interface Interactive3DGraphicProps {
  className?: string;
  variant?: 'landing' | 'welcome' | 'progress';
  interactive?: boolean;
}

export const Interactive3DGraphic = ({
  className,
  variant = 'landing',
  interactive = true,
}: Interactive3DGraphicProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const timeRef = useRef(0);
  const animationRef = useRef<number | undefined>(undefined);

  const [isLoaded, setIsLoaded] = useState(false);

  // Ark.works color palette - cold grays, bright whites on black
  const colors = [
    { h: 210, s: 15, l: 95 }, // Bright white
    { h: 215, s: 20, l: 85 }, // Cool white
    { h: 220, s: 25, l: 70 }, // Light steel
    { h: 215, s: 18, l: 60 }, // Steel gray
    { h: 220, s: 15, l: 50 }, // Mid gray
    { h: 220, s: 12, l: 40 }, // Dark steel
    { h: 215, s: 10, l: 30 }, // Charcoal
    { h: 220, s: 8, l: 20 }, // Dark gray
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles with 3D positions
    const particleCount = variant === 'progress' ? 80 : 120;
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const angleY = (Math.random() - 0.5) * Math.PI;
      const distance = Math.random() * Math.min(centerX, centerY) * 0.7 + 50;
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        x: centerX + Math.cos(angle) * Math.cos(angleY) * distance,
        y: centerY + Math.sin(angleY) * distance,
        z: Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        vz: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 5 + 2,
        color: `hsl(${color.h}, ${color.s}%, ${color.l}%)`,
        alpha: Math.random() * 0.5 + 0.5,
        pulseOffset: Math.random() * Math.PI * 2,
      };
    });

    const animate = () => {
      timeRef.current += 0.016;
      const time = timeRef.current;
      const rect = canvas.getBoundingClientRect();

      // Pure black background with subtle radial gradient
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, rect.width, rect.height);

      // Subtle center glow
      const bgGradient = ctx.createRadialGradient(
        rect.width / 2,
        rect.height / 2,
        0,
        rect.width / 2,
        rect.height / 2,
        rect.width * 0.6
      );
      bgGradient.addColorStop(0, 'hsla(220, 15%, 8%, 0.5)');
      bgGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Sort particles by z for proper depth rendering
      const sortedParticles = [...particlesRef.current].sort((a, b) => a.z - b.z);

      // Draw connections with gradient
      sortedParticles.forEach((p1, i) => {
        sortedParticles.slice(i + 1).forEach((p2) => {
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dz = p2.z - p1.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (distance < 120) {
            const alpha = (1 - distance / 120) * 0.25;
            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            gradient.addColorStop(0, `hsla(215, 15%, 60%, ${alpha * p1.alpha})`);
            gradient.addColorStop(1, `hsla(220, 18%, 55%, ${alpha * p2.alpha})`);

            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = Math.max(0.3, 1.5 - distance / 80);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Pulsing alpha
        const pulse = Math.sin(time * 2 + particle.pulseOffset) * 0.2 + 0.8;

        // Mouse interaction
        if (mouseRef.current.active && interactive) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 200) {
            const force = (200 - distance) / 200;
            particle.vx -= (dx / distance) * force * 0.8;
            particle.vy -= (dy / distance) * force * 0.8;
            particle.vz += force * 0.5 * (Math.random() - 0.5);
          }
        }

        // 3D rotation based on variant
        if (variant === 'progress') {
          // Spiral inward
          const dx = centerX - particle.x;
          const dy = centerY - particle.y;
          particle.vx += dx * 0.002;
          particle.vy += dy * 0.002;
          particle.vz *= 0.99;
        } else if (variant === 'welcome') {
          // Gentle float
          particle.vy += Math.sin(time + particle.pulseOffset) * 0.02;
          particle.vx += Math.cos(time * 0.5 + particle.pulseOffset) * 0.01;
        } else {
          // Landing: 3D orbital motion
          const dx = centerX - particle.x;
          const dy = centerY - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy + particle.z * particle.z);

          // Perpendicular forces for smooth orbiting
          const orbitSpeed = 0.012;
          particle.vx += (-dy / distance) * orbitSpeed + dx * 0.0002;
          particle.vy += (dx / distance) * orbitSpeed + dy * 0.0002;
          particle.vz += Math.sin(time * 0.5 + particle.pulseOffset) * 0.08;
        }

        // Apply velocity with smooth damping
        particle.vx *= 0.985;
        particle.vy *= 0.985;
        particle.vz *= 0.98;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;

        // Soft boundary
        const margin = 50;
        if (particle.x < margin) particle.vx += 0.5;
        if (particle.x > rect.width - margin) particle.vx -= 0.5;
        if (particle.y < margin) particle.vy += 0.5;
        if (particle.y > rect.height - margin) particle.vy -= 0.5;
        if (Math.abs(particle.z) > 200) particle.vz *= -0.5;

        // Calculate depth-based scale and alpha
        const depthScale = 1 + particle.z / 500;
        const depthAlpha = Math.max(0.3, Math.min(1, 1 - particle.z / 400));
        const finalSize = particle.size * depthScale * pulse;
        const finalAlpha = particle.alpha * depthAlpha * pulse;

        // Draw outer glow
        const glowGradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          finalSize * 4
        );
        const colorMatch = particle.color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
        if (colorMatch) {
          const [, h, s, l] = colorMatch;
          glowGradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${finalAlpha * 0.5})`);
          glowGradient.addColorStop(0.4, `hsla(${h}, ${s}%, ${l}%, ${finalAlpha * 0.15})`);
          glowGradient.addColorStop(1, 'transparent');
        }

        ctx.beginPath();
        ctx.fillStyle = glowGradient;
        ctx.arc(particle.x, particle.y, finalSize * 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw middle glow
        const midGradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          finalSize * 2
        );
        if (colorMatch) {
          const [, h, s, l] = colorMatch;
          midGradient.addColorStop(
            0,
            `hsla(${h}, ${Number(s) + 5}%, ${Number(l) + 10}%, ${finalAlpha * 0.8})`
          );
          midGradient.addColorStop(1, 'transparent');
        }

        ctx.beginPath();
        ctx.fillStyle = midGradient;
        ctx.arc(particle.x, particle.y, finalSize * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.beginPath();
        ctx.fillStyle = particle.color.replace(')', `, ${finalAlpha})`).replace('hsl', 'hsla');
        ctx.arc(particle.x, particle.y, finalSize * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw bright center
        ctx.beginPath();
        if (colorMatch) {
          const [, h] = colorMatch;
          ctx.fillStyle = `hsla(${h}, 10%, 98%, ${finalAlpha * 0.9})`;
        }
        ctx.arc(particle.x, particle.y, finalSize * 0.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw central glow
      const centralGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 150);
      centralGlow.addColorStop(0, 'hsla(215, 20%, 50%, 0.1)');
      centralGlow.addColorStop(0.5, 'hsla(220, 15%, 40%, 0.03)');
      centralGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = centralGlow;
      ctx.fillRect(0, 0, rect.width, rect.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    setTimeout(() => {
      setIsLoaded(true);
      animate();
    }, 100);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    const handleMouseEnter = () => {
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = e.touches[0].clientX - rect.left;
        mouseRef.current.y = e.touches[0].clientY - rect.top;
        mouseRef.current.active = true;
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current.active = false;
    };

    if (interactive) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseenter', handleMouseEnter);
      canvas.addEventListener('mouseleave', handleMouseLeave);
      canvas.addEventListener('touchmove', handleTouchMove);
      canvas.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (interactive) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseenter', handleMouseEnter);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [variant, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        'h-full w-full transition-opacity duration-700',
        isLoaded ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{ touchAction: 'none' }}
      aria-label='Interactive 3D graphic representing creative data assembling'
      role='img'
    />
  );
};

// Fallback static image for low-end devices
export const StaticHeroImage = ({ className }: { className?: string }) => (
  <div className={cn('relative flex h-full w-full items-center justify-center', className)}>
    <div className='relative'>
      {/* Central glow */}
      <div className='bg-muted-foreground/20 absolute inset-0 rounded-full blur-3xl' />

      {/* Decorative circles */}
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className='bg-muted-foreground/15 absolute animate-pulse rounded-full'
          style={{
            width: `${15 + i * 12}px`,
            height: `${15 + i * 12}px`,
            left: `${50 + Math.cos((i * 45 * Math.PI) / 180) * 50}%`,
            top: `${50 + Math.sin((i * 45 * Math.PI) / 180) * 50}%`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}

      {/* Center logo area */}
      <div className='from-muted-foreground/30 to-muted-foreground/10 shadow-glow flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br'>
        <span className='font-display text-foreground text-3xl font-bold'>A</span>
      </div>
    </div>
  </div>
);
