import React from 'react';
import {
  Smartphone,
  Watch,
  Headphones,
  BatteryCharging,
  Gift,
  Ticket,
  Coffee,
  Backpack,
  Shirt,
  Sparkles,
  Trophy,
  Package,
} from 'lucide-react';

interface PrizeIconProps {
  name?: string;
  className?: string;
}

export const PrizeIcon: React.FC<PrizeIconProps> = ({ name, className = 'w-6 h-6' }) => {
  const iconKey = (name || '').toLowerCase();

  switch (iconKey) {
    case 'smartphone':
      return <Smartphone className={className} />;
    case 'watch':
      return <Watch className={className} />;
    case 'headphones':
      return <Headphones className={className} />;
    case 'battery-charging':
    case 'powerbank':
      return <BatteryCharging className={className} />;
    case 'coffee':
    case 'termos':
      return <Coffee className={className} />;
    case 'ticket':
    case 'vaucher':
      return <Ticket className={className} />;
    case 'backpack':
    case 'sumka':
      return <Backpack className={className} />;
    case 'shirt':
    case 'futbolka':
      return <Shirt className={className} />;
    case 'trophy':
      return <Trophy className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'gift':
    default:
      return <Gift className={className} />;
  }
};
