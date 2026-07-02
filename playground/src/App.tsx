import { useMemo, useState } from 'react';
import { FileQuestion } from 'lucide-react';
import { parse, UnrecognisedFormatError, type ParseResult } from 'nz-bank-parser';
import { InputPanel } from './components/InputPanel';
import { ResultsPanel } from './components/ResultsPanel';

type ParseState =
  | { status: 'empty' }
  | { status: 'unrecognised' }
  | { status: 'parsed'; result: ParseResult };

function parseCsv(csv: string): ParseState {
  if (csv.trim() === '') {
    return { status: 'empty' };
  }
  try {
    return { status: 'parsed', result: parse(csv) };
  } catch (error) {
    if (error instanceof UnrecognisedFormatError) {
      return { status: 'unrecognised' };
    }
    throw error;
  }
}

export default function App() {
  const [csv, setCsv] = useState('');
  const [fileName, setFileName] = useState<string | undefined>(undefined);

  const state = useMemo(() => parseCsv(csv), [csv]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] flex-col px-6">
      <header className="flex items-center justify-between border-b border-border py-4">
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm font-semibold">nz-bank-parser</span>
          <span className="text-xs text-fg-muted">Playground</span>
        </div>
        <nav className="flex items-center gap-4">
          <a
            href="https://www.npmjs.com/package/nz-bank-parser"
            className="text-sm text-fg-muted transition-colors hover:text-fg"
          >
            npm
          </a>
          <a
            href="https://github.com/R1chi33333/nz-bank-parser"
            className="text-sm text-fg-muted transition-colors hover:text-fg"
          >
            GitHub
          </a>
        </nav>
      </header>

      <main className="grid flex-1 gap-8 py-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <InputPanel
          csv={csv}
          fileName={fileName}
          onCsvChange={(text, name) => {
            setCsv(text);
            setFileName(name);
          }}
        />

        {state.status === 'parsed' ? (
          <ResultsPanel result={state.result} />
        ) : (
          <section className="flex flex-col items-center justify-center gap-3 rounded-md border border-border bg-surface-1 p-10 text-center">
            {state.status === 'unrecognised' ? (
              <>
                <FileQuestion className="size-5 text-fg-muted" strokeWidth={1.5} />
                <p className="text-sm">This does not look like a known bank export.</p>
                <p className="max-w-sm text-xs leading-relaxed text-fg-muted">
                  The header row did not match ANZ, ASB, Westpac or Kiwibank. Check that the file
                  is an unmodified CSV export from internet banking.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm">Parsed transactions appear here</p>
                <p className="max-w-sm text-xs leading-relaxed text-fg-muted">
                  Drop a CSV export, paste its contents, or load a synthetic sample to see the
                  normalised output: ISO dates, amounts in cents, explicit direction, and per-row
                  errors.
                </p>
              </>
            )}
          </section>
        )}
      </main>

      <footer className="flex items-center justify-between border-t border-border py-4 text-xs text-fg-muted">
        <span>MIT licensed. All samples are synthetic.</span>
        <span className="font-mono">
          {'©'} {new Date().getFullYear()} Yutong Jin
        </span>
      </footer>
    </div>
  );
}
