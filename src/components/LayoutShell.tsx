import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-shell min-h-screen px-4 py-6 lg:p-12">
      <div className="mx-auto max-w-[1600px] bg-white/80 backdrop-blur-xl rounded-[28px] p-6 lg:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-[rgba(0,0,0,0.06)]">
        <div className="flex gap-8">
          <Sidebar />
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <Topbar />
            <main className="flex-1 fade-in">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}


