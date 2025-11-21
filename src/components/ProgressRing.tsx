interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const ProgressRing = ({
  value,
  max,
  label,
  size = 120,
  strokeWidth = 10,
  color = "hsl(var(--primary))",
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min((value / max) * 100, 100);
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{value}</span>
          <span className="text-xs text-muted-foreground">/ {max}</span>
        </div>
      </div>
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
};

export default ProgressRing;
