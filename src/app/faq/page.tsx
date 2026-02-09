const faqs = [
  { q: "Where is data from?", a: "County + federal sources; cite per-layer when available." },
  { q: "Does this replace due diligence?", a: "No—this is informational. Always verify locally." },
  { q: "Can I export reports?", a: "Yes—report generation is in the Reports tab (mocked for now)." }
];

export default function FaqPage() {
  return (
    <div className="dashboard-shell min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-frame shadow-card border border-gray-100">
        <h1 className="text-3xl font-semibold mb-2">FAQ</h1>
        <div className="space-y-4 mt-6">
          {faqs.map((item) => (
            <div key={item.q} className="card p-5">
              <div className="text-lg font-semibold">{item.q}</div>
              <div className="text-muted mt-2">{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}





