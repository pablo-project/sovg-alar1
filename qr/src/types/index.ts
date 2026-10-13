export interface Prize {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  totalCount: number;
  wonCount: number;
  remainingCount: number;
  probabilityWeight: number;
  isActive: boolean;
}

export interface AllowedPhone {
  id: string;
  phone: string;
  name: string;
  note: string;
  addedAt: string;
  hasWon: boolean;
  wonAt?: string;
  prizeId?: string;
  prizeName?: string;
  assignedPrizeId?: string; // Admin oldindan belgilagan aniq sovg'a
  assignedPrizeName?: string;
  source?: 'telegram' | 'product_qr' | 'direct';
  qrCodeId?: string;
}

export interface ProductQR {
  id: string;
  code: string;
  batchName: string;
  createdAt: string;
  isUsed: boolean;
  usedAt?: string;
  usedByPhone?: string;
  usedByName?: string;
  prizeName?: string;
}

export interface Winner {
  id: string;
  ticketId: string;
  firstName: string;
  lastName: string;
  phone: string;
  prizeId: string;
  prizeName: string;
  prizeIcon?: string;
  timestamp: string;
  source: 'telegram' | 'product_qr';
  qrCodeId?: string;
  status: 'claimed' | 'pending' | 'verified';
}

export interface SystemSettings {
  adminPasswordHash: string;
  telegramChannelUrl: string;
  brandName: string;
  operatorPhone: string;
  operatorTelegram: string;
  isGameActive: boolean;
  defaultGlobalPrizeId?: string; // Barcha uchun yagona belgilangan sovg'a
  customSiteUrl?: string; // QR-kod ichiga joylanadigan ochiq sayt havolasi
}

export interface SpinResult {
  success: boolean;
  winningPrize: Prize;
  prizeIndex: number;
  totalSegments: number;
  ticketId: string;
  timestamp: string;
  message?: string;
}

export interface DashboardStats {
  totalAllowedPhones: number;
  totalWinners: number;
  remainingChances: number;
  totalProductQRs: number;
  usedProductQRs: number;
  unusedProductQRs: number;
  totalPrizes: number;
  remainingPrizesCount: number;
}
