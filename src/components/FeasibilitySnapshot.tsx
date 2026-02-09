import Card from "./Card";
import { FeasibilityFlag } from "../lib/mockData";

const badgeColors: Record<FeasibilityFlag["status"], string> = {
  green: "bg-green-100 text-green-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  unknown: "bg-gray-100 text-gray-700"
};

export function FeasibilitySnapshot({ items }: { items: FeasibilityFlag[] }) {
  return (
    <Card title="Feasibility Snapshot" subtitle="Quick risk + feasibility view">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-start justify-between gap-3 border border-gray-100 rounded-xl p-3"
          >
            <div>
              <div className="font-medium">{item.label}</div>
              <div className="text-sm text-muted">{item.detail}</div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeColors[item.status]}`}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}



