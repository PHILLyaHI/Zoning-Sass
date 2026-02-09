import Card from "../../../../../components/Card";

export default function ZoningPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Zoning</h1>
      <Card title="Permitted uses" subtitle="Mocked data">
        <ul className="list-disc pl-4 text-sm text-muted space-y-1">
          <li>Residential (single family) permitted.</li>
          <li>ADU permitted with conditions.</li>
          <li>Short-term rental: unknown; verify locally.</li>
        </ul>
      </Card>
      <Card title="Citations">
        <div className="text-sm text-muted">Zoning layer source (Q3); local ordinance ref 12.08.</div>
      </Card>
    </div>
  );
}



