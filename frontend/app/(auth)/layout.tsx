import { Logo } from "@/components/brand/logo";
import { Check } from "lucide-react";

const highlights = [
  "Track anything on a board — jobs, courses, projects, and more",
  "Custom stages and fields, tailored to each tracker",
  "A calendar heatmap of your activity, day by day",
  "Reminders and pipeline stats so nothing slips",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-zinc-950 p-10 text-zinc-50 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative max-w-md space-y-6">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Track anything, stage by stage.
          </h2>
          <ul className="space-y-3 text-sm text-zinc-300">
            {highlights.map((h) => (
              <li key={h} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-zinc-500">Pursuit — your personal tracker for anything.</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
