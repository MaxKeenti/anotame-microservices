interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
}

export function StatCard({ title, value, trend, trendUp }: StatCardProps) {
  return (
    <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-heading font-bold text-foreground">
          {value}
        </span>
        {trend && (
          <span
            className={`text-sm font-medium ${trendUp ? "text-success" : "text-destructive"
              }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
