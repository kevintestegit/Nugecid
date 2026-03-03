import {
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

interface PieChartProps {
  data: { name: string; value: number }[];
  title: string;
  className?: string;
}

const COLORS = [
  "#2563eb",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
];
const tooltipStyles =
  "rounded-lg border border-border bg-card/95 px-3 py-2 shadow-sm text-sm text-foreground";

export function PieChart({ data, title, className }: PieChartProps) {
  const total = data.reduce((acc, cur) => acc + (cur.value || 0), 0);

  return (
    <Card
      className={cn(
        "h-full bg-gradient-to-b from-muted/40 to-background",
        className,
      )}
    >
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          {title}
        </CardTitle>
        <Badge variant="secondary" className="text-xs">
          {total} no período
        </Badge>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
              >
                {data.map((_entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "transparent", border: "none" }}
                wrapperClassName="!outline-none"
                formatter={(value: number, _name, info) => [
                  `${value} requisição${value === 1 ? "" : "s"}`,
                  info?.payload?.name ?? "",
                ]}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  return (
                    <div className={tooltipStyles}>
                      <p className="text-xs text-muted-foreground">
                        {item.name}
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {item.value} requisição{item.value === 1 ? "" : "s"}
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                formatter={(value) => (
                  <span className="text-xs text-muted-foreground">{value}</span>
                )}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
