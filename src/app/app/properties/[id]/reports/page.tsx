"use client";

import Card from "../../../../../components/Card";

export default function ReportsPage() {
  const handleGenerate = () => {
    alert("Generating report... (mocked)");
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <Card title="Generate report">
        <div className="flex flex-col gap-3">
          <div className="text-sm text-muted">
            Generate zoning + utilities + risks report. Mocked for now; wire to exporter.
          </div>
          <button 
            onClick={handleGenerate}
            className="rounded-full bg-accent-primary text-white px-4 py-2 w-fit cursor-pointer hover:opacity-90 transition"
          >
            Generate
          </button>
        </div>
      </Card>
      <Card title="Share link">
        <div className="text-sm text-muted">Create shareable link (mock). Add auth + expirations later.</div>
      </Card>
    </div>
  );
}


