import { Minus, Plus } from 'lucide-react';

interface QtyControlProps {
  value: number;
  onMinus?: () => void;
  onPlus?: () => void;
}

export function QtyControl({ value, onMinus, onPlus }: QtyControlProps) {
  return (
    <div className="qty">
      <button onClick={onMinus}><Minus size={15} /></button>
      <span>{value}</span>
      <button onClick={onPlus}><Plus size={15} /></button>
    </div>
  );
}
