export interface ProjectileEntity {
  id: string;
  x: number;
  y: number;
  targetId: string;
  damage: number;
  speed: number;
  behavior: 'single' | 'pierce' | 'rapid' | 'splash' | 'slow';
  slowMultiplier: number;
  splashRadius: number;
}
