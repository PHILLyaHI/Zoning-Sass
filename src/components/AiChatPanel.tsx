import Card from "./Card";

const mockReplies = [
  {
    question: "Can I add an ADU on this parcel?",
    answer:
      "Likely yes. Zoning appears to allow one accessory dwelling; confirm overlay setbacks.",
    sources: ["County zoning layer (updated Q3)", "Local ADU ordinance 12.08"]
  },
  {
    question: "What are next steps?",
    answer: "Confirm sewer availability, run perc test, submit pre-app to planning.",
    sources: ["Utilities map (unknown sewer)", "Health Dept checklist"]
  }
];

export function AiChatPanel() {
  return (
    <Card
      title="AI Q&A"
      subtitle="Structured answers with why + next steps + sources"
      actions={<button className="px-3 py-1 rounded-full bg-accent-primary text-white text-sm">Ask</button>}
    >
      <div className="space-y-4">
        <textarea
          className="w-full min-h-[80px] rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
          placeholder="Ask: Can I subdivide? Can I build a duplex? What are the setbacks?"
        />
        <div className="space-y-3">
          {mockReplies.map((item) => (
            <div key={item.question} className="border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="text-sm font-semibold">{item.question}</div>
              <div className="text-sm text-gray-800">{item.answer}</div>
              <div className="text-xs text-muted">
                Sources: {item.sources.join(", ")} (mocked — wire to citations)
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}



