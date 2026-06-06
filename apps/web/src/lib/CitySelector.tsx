'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Check } from 'lucide-react';
import { CITIES, getCity, setCity, type City } from '@/lib/city';

export default function CitySelector({ compact }: { compact?: boolean }) {
  const [city, setCityState] = useState<City>(CITIES[0]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCityState(getCity());
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (c: City) => {
    setCity(c.id);
    setCityState(c);
    setOpen(false);
  };

  return (
    <div className="city-selector" ref={ref}>
      <button className="city-trigger" onClick={() => setOpen(!open)}>
        <MapPin size={compact ? 16 : 18} />
        <div>
          <small>Giao hàng tại</small>
          <b>{city.name}</b>
        </div>
        <ChevronDown size={14} className={`city-arrow ${open ? 'open' : ''}`} />
      </button>
      {open && (
        <div className="city-dropdown">
          <div className="city-dropdown-title">Chọn khu vực giao hàng</div>
          {CITIES.map(c => (
            <button
              key={c.id}
              className={`city-option ${c.id === city.id ? 'active' : ''}`}
              onClick={() => select(c)}
            >
              <MapPin size={16} />
              <div>
                <b>{c.name}</b>
                <span>{c.address}</span>
              </div>
              {c.id === city.id && <Check size={16} className="city-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
