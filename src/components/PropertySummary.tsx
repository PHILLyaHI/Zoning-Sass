import Card from "./Card";
import { PropertyRecord } from "../lib/mockData";

export function PropertySummary({ property }: { property: PropertyRecord }) {
  return (
    <Card title="Property Summary" subtitle={property.jurisdiction}>
      <div className="space-y-3">
        <div className="text-lg font-semibold">
          {property.address}, {property.city}, {property.state}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 rounded-xl bg-gray-50">
            <div className="text-muted">Parcel</div>
            <div className="font-semibold">Polygon available</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-50">
            <div className="text-muted">Jurisdiction</div>
            <div className="font-semibold">{property.jurisdiction}</div>
          </div>
          <div className="p-3 rounded-xl bg-gray-50">
            <div className="text-muted">Lat / Lng</div>
            <div className="font-semibold">
              {property.lat}, {property.lng}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-gray-50">
            <div className="text-muted">Layers saved</div>
            <div className="font-semibold">{property.layers.filter((l) => l.active).length} active</div>
          </div>
        </div>
        <div className="text-sm text-muted">
          Add more details (owner, APN, overlays) once data is connected.
        </div>
      </div>
    </Card>
  );
}



