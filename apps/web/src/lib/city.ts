const STORAGE_KEY = 'hsbx_city';

export type City = {
  id: string;
  name: string;
  shortName: string;
  address: string;
  hotline: string;
  region: string;
};

export const CITIES: City[] = [
  {
    id: 'hcm',
    name: 'TP. Hồ Chí Minh',
    shortName: 'HCM',
    address: '123 Đường Biển, Q.1, TP.HCM',
    hotline: '0901 234 567',
    region: 'miền Nam',
  },
  {
    id: 'hn',
    name: 'Hà Nội',
    shortName: 'HN',
    address: '45 Phố Biển, Hoàn Kiếm, Hà Nội',
    hotline: '0902 345 678',
    region: 'miền Bắc',
  },
  {
    id: 'dn',
    name: 'Đà Nẵng',
    shortName: 'ĐN',
    address: '78 Bạch Đằng, Hải Châu, Đà Nẵng',
    hotline: '0903 456 789',
    region: 'miền Trung',
  },
];

export function getCity(): City {
  if (typeof window === 'undefined') return CITIES[0];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const found = CITIES.find(c => c.id === saved);
    if (found) return found;
  }
  return CITIES[0];
}

export function setCity(cityId: string) {
  localStorage.setItem(STORAGE_KEY, cityId);
}
