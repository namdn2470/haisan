interface BadgeProps {
  text: string;
  variant?: 'ban_chay' | 'uu_dai' | 'tuoi_ngon' | 'moi';
}

const badgeColors: Record<string, string> = {
  ban_chay: '#ff2b2b',
  uu_dai: '#f59e0b',
  tuoi_ngon: '#04a755',
  moi: '#005bdc',
};

export function Badge({ text, variant = 'moi' }: BadgeProps) {
  return (
    <span
      style={{
        background: badgeColors[variant] || badgeColors.moi,
        color: '#fff',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
      }}
    >
      {text}
    </span>
  );
}
