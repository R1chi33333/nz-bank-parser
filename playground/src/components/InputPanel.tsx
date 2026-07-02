import { useCallback, useState, type DragEvent, type ChangeEvent } from 'react';
import { FileUp, ShieldCheck } from 'lucide-react';
import { SUPPORTED_BANKS, type BankId } from 'nz-bank-parser';
import { BANK_LABELS, SAMPLES } from '../samples';

interface InputPanelProps {
  csv: string;
  onCsvChange: (csv: string, fileName?: string) => void;
  fileName?: string;
}

export function InputPanel({ csv, onCsvChange, fileName }: InputPanelProps) {
  const [dragging, setDragging] = useState(false);

  const readFile = useCallback(
    (file: File) => {
      file
        .text()
        .then((text) => {
          onCsvChange(text, file.name);
        })
        .catch(() => {
          onCsvChange('', undefined);
        });
    },
    [onCsvChange],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files[0];
      if (file) {
        readFile(file);
      }
    },
    [readFile],
  );

  const onFilePicked = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        readFile(file);
      }
    },
    [readFile],
  );

  return (
    <section className="flex flex-col gap-4">
      <div
        role="button"
        aria-label="Drop a CSV file or click to browse"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => {
          setDragging(false);
        }}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            document.getElementById('file-input')?.click();
          }
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors ${
          dragging ? 'border-accent bg-surface-2' : 'border-border bg-surface-1 hover:bg-surface-2'
        }`}
      >
        <FileUp className="size-5 text-fg-muted" strokeWidth={1.5} />
        <p className="text-sm">{fileName ?? 'Drop a CSV export here, or click to browse'}</p>
        <p className="text-xs text-fg-muted">
          {SUPPORTED_BANKS.map((b: BankId) => BANK_LABELS[b]).join(' · ')}
        </p>
        <input
          id="file-input"
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onFilePicked}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-fg-muted">
        <ShieldCheck className="size-4 shrink-0 text-accent" strokeWidth={1.5} />
        Your data never leaves your browser. Parsing runs entirely client-side.
      </div>

      <textarea
        value={csv}
        onChange={(e) => {
          onCsvChange(e.target.value);
        }}
        placeholder="Or paste CSV content here"
        spellCheck={false}
        rows={10}
        className="w-full resize-y rounded-md border border-border bg-surface-1 p-3 font-mono text-xs leading-relaxed text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
      />

      <div className="flex items-center gap-2">
        <span className="text-xs text-fg-muted">Try a sample:</span>
        {SUPPORTED_BANKS.map((bank: BankId) => (
          <button
            key={bank}
            type="button"
            onClick={() => {
              onCsvChange(SAMPLES[bank], `${BANK_LABELS[bank]} sample`);
            }}
            className="rounded-md border border-border bg-surface-1 px-2.5 py-1 text-xs text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            {BANK_LABELS[bank]}
          </button>
        ))}
      </div>
    </section>
  );
}
