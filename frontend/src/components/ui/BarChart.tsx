import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/utils/cn';

interface BarChartProps {
  data: { name: string; total: number }[];
  title: string;
  className?: string;
}

const tooltipStyles =
  'rounded-lg border border-border bg-card/95 px-3 py-2 shadow-sm text-sm text-foreground';

export function BarChart({ data, title, className }: BarChartProps) {
  const hasData = Array.isArray(data) && data.some((item) => item.total > 0);

  return (
    <Card className={cn('h-full bg-gradient-to-b from-muted/40 to-background', className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
        <Badge variant="secondary" className="text-xs">
          {hasData ? '12 meses' : 'Sem dados'}
        </Badge>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={data}>
              <defs>
                <linearGradient id="barGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.75} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{ background: 'transparent', border: 'none' }}
                wrapperClassName="!outline-none"
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                formatter={(value: number) => [`${value} req.`, 'Total']}
                labelClassName="hidden"
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  return (
                    <div className={tooltipStyles}>
                      <p className="text-xs text-muted-foreground">{item.payload.name}</p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.value} requisição{item.value === 1 ? '' : 's'}
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                formatter={() => <span className="text-xs text-muted-foreground">Total</span>}
              />
              <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
