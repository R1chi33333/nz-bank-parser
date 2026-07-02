import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Landmark } from 'lucide-react';
import type { ParseResult, RowError, Transaction } from 'nz-bank-parser';
import { BANK_LABELS } from '../samples';

const nzd = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' });

function formatCents(cents: number): string {
  return nzd.format(cents / 100);
}

function AmountCell({ tx }: { tx: Transaction }) {
  const debit = tx.direction === 'debit';
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs ${debit ? 'text-fg' : 'text-accent'}`}
    >
      {debit ? (
        <ArrowUpRight className="size-3.5 text-fg-muted" strokeWidth={1.5} />
      ) : (
        <ArrowDownLeft className="size-3.5" strokeWidth={1.5} />
      )}
      {debit ? '-' : '+'}
      {formatCents(tx.amount)}
    </span>
  );
}

function ErrorList({ errors }: { errors: RowError[] }) {
  return (
    <div className="rounded-md border border-border bg-surface-1">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <AlertTriangle className="size-4 text-fg-muted" strokeWidth={1.5} />
        <span className="text-xs font-medium">
          {errors.length} row{errors.length === 1 ? '' : 's'} could not be parsed
        </span>
      </div>
      <ul className="max-h-48 divide-y divide-border overflow-y-auto">
        {errors.map((error) => (
          <li key={`${String(error.line)}-${error.code}`} className="px-3 py-2">
            <p className="text-xs">
              <span className="font-mono text-fg-muted">line {error.line}</span>{' '}
              <span className="text-fg-muted">[{error.code}]</span> {error.message}
            </p>
            <p className="mt-1 truncate font-mono text-xs text-fg-muted">{error.rawLine}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResultsPanel({ result }: { result: ParseResult }) {
  const { bank, transactions, errors } = result;

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark className="size-4 text-accent" strokeWidth={1.5} />
          <span className="text-sm font-medium">{BANK_LABELS[bank]}</span>
          <span className="text-xs text-fg-muted">detected</span>
        </div>
        <span className="font-mono text-xs text-fg-muted">
          {transactions.length} transaction{transactions.length === 1 ? '' : 's'}
        </span>
      </div>

      {errors.length > 0 && <ErrorList errors={errors} />}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-1 text-fg-muted">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium">Reference</th>
              <th className="px-3 py-2 text-right font-medium">Amount</th>
              <th className="px-3 py-2 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {transactions.map((tx, i) => (
              <tr key={i} className="hover:bg-surface-1">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-fg-muted">{tx.date}</td>
                <td className="max-w-64 truncate px-3 py-2" title={tx.description}>
                  {tx.description}
                </td>
                <td
                  className="max-w-40 truncate px-3 py-2 text-fg-muted"
                  title={tx.reference || undefined}
                >
                  {tx.reference}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <AmountCell tx={tx} />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-fg-muted">
                  {tx.balance === undefined ? '' : formatCents(tx.balance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-fg-muted">
            No transactions could be parsed from this file.
          </p>
        )}
      </div>
    </section>
  );
}
