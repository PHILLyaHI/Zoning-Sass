import Card from "../../../../../components/Card";

export default function HazardsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Hazards</h1>
      <Card title="Flood">
        <div className="text-sm text-muted">Outside FEMA SFHA. Check local overlays for accuracy.</div>
      </Card>
      <Card title="Wildfire">
        <div className="text-sm text-muted">Wildfire risk: moderate. Maintain defensible space.</div>
      </Card>
      <Card title="Nearby sites">
        <div className="text-sm text-muted">No known industrial sites nearby (mock). Always verify.</div>
      </Card>
    </div>
  );
}



