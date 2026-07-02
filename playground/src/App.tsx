import { ShieldCheck } from 'lucide-react';
import { SUPPORTED_BANKS } from 'nz-bank-parser';

export default function App() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-6">
      <header className="flex items-center justify-between border-b border-border py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm font-semibold">nz-bank-parser</span>
          <span className="text-xs text-fg-muted">Playground</span>
        </div>
        <a
          href="https://github.com/R1chi33333/nz-bank-parser"
          className="text-sm text-fg-muted transition-colors hover:text-fg"
        >
          GitHub
        </a>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 py-16 text-center">
        <h1 className="max-w-xl text-3xl font-semibold tracking-tight">
          Parse NZ bank CSV exports into one clean format
        </h1>
        <p className="max-w-md text-sm leading-relaxed text-fg-muted">
          Drop a CSV export from {SUPPORTED_BANKS.map((b) => b.toUpperCase()).join(', ')} and get
          normalised transactions instantly. Parser under construction.
        </p>
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface-1 px-3 py-2 text-xs text-fg-muted">
          <ShieldCheck className="size-4 text-accent" strokeWidth={1.5} />
          Your data never leaves your browser
        </div>
      </main>

      <footer className="border-t border-border py-4 text-xs text-fg-muted">
        MIT licensed. Built as part of an open-source portfolio.
      </footer>
    </div>
  );
}
