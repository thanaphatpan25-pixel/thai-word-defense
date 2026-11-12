export type UpgradeId = 'rapid-fire' | 'fortify' | 'study-time' | 'income' | 'repair' | 'range' | 'power' | 'shield-break';

export interface UpgradeCard {
  id: UpgradeId;
  title: string;
  description: string;
  icon: string;
}

export const UPGRADE_CARDS: UpgradeCard[] = [
  { id: 'rapid-fire', title: 'ฝึกยิงคล่อง', description: 'ป้อมทุกชนิดยิงเร็วขึ้น 12%', icon: '⚡' },
  { id: 'fortify', title: 'รั้วโรงเรียนแข็งแรง', description: 'เพิ่ม HP ฐาน 120 หน่วย', icon: '🧱' },
  { id: 'study-time', title: 'เวลาคิดเพิ่ม', description: 'เพิ่มเวลาตอบคำถาม 3 วินาที', icon: '⏱️' },
  { id: 'income', title: 'กระปุกออมสิน', description: 'รับเหรียญเพิ่มทันที 55 เหรียญ', icon: '🪙' },
  { id: 'repair', title: 'หน่วยพยาบาล', description: 'ฟื้น HP ฐาน 180 หน่วย', icon: '💚' },
  { id: 'range', title: 'กล้องส่องทางไกล', description: 'เพิ่มระยะป้อมทุกชนิด 10%', icon: '🔭' },
  { id: 'power', title: 'กระสุนความรู้', description: 'เพิ่มความแรงป้อมทุกชนิด 15%', icon: '💥' },
  { id: 'shield-break', title: 'คำตอบทะลุโล่', description: 'คำตอบถูกครั้งต่อไปทำลายโล่เพิ่มอีก 1 ชั้น', icon: '📖' },
];
