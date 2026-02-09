import Card from "./Card";
import { LayerToggle } from "../lib/mockData";

export function LayerToggles({ layers }: { layers: LayerToggle[] }) {
  const groups = Array.from(new Set(layers.map((l) => l.group)));
  return (
    <Card title="Layers" subtitle="Toggle overlays and see legend">
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group}>
            <div className="text-sm font-semibold mb-2">{group}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {layers
                .filter((l) => l.group === group)
                .map((layer) => (
                  <label
                    key={layer.id}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 cursor-pointer ${
                      layer.active ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
                    }`}
                  >
                    <span>{layer.label}</span>
                    <input type="checkbox" checked={layer.active} readOnly className="accent-accent-primary" />
                  </label>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}



