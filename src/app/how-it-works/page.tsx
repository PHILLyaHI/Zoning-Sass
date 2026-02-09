const steps = [
  { title: "Search any property", detail: "Address, APN, or drop a pin." },
  { title: "See zoning + layers", detail: "Parcel outline, overlays, utilities, risks." },
  { title: "Ask AI with sources", detail: "Structured answers, next steps, citations." }
];

export default function HowItWorksPage() {
  return (
    <div className="dashboard-shell min-h-screen px-4 py-12">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-frame shadow-card border border-gray-100">
        <h1 className="text-3xl font-semibold mb-2">How it works</h1>
        <p className="text-muted mb-8">Three steps to know what you can do on a property.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {steps.map((step, i) => (
            <div key={step.title} className="card p-6 space-y-2">
              <div className="text-sm text-muted">Step {i + 1}</div>
              <div className="text-xl font-semibold">{step.title}</div>
              <div className="text-sm text-muted">{step.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





