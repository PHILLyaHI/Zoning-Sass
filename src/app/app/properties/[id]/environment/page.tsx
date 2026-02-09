import Card from "../../../../../components/Card";

export default function EnvironmentPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Environment</h1>
      <Card title="Wetlands">
        <div className="text-sm text-muted">Wetlands nearby; buffer may apply. Verify with local agency.</div>
      </Card>
      <Card title="Soils">
        <div className="text-sm text-muted">
          Soil type: well-drained loam. Watch for shrink-swell; impacts foundation and septic.
        </div>
      </Card>
      <Card title="Drainage / Slope">
        <div className="text-sm text-muted">
          Gentle slope to north; consider stormwater plan and low-point grading.
        </div>
      </Card>
    </div>
  );
}



