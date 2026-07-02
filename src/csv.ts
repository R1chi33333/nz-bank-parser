/**
 * Minimal CSV tokenizer, internal to the library.
 *
 * Follows RFC 4180 semantics with the leniencies real bank exports need:
 * a UTF-8 BOM is stripped, CRLF and LF both terminate records, fields may
 * be quoted with embedded commas, newlines and doubled quotes, and an
 * unterminated quote consumes the rest of the input rather than failing.
 */

/** One record with its position in the original file. */
export interface CsvRow {
  /** 1-based line number where this record starts. */
  line: number;
  fields: string[];
}

const BOM = '\uFEFF';

/**
 * Split CSV text into records. Lines that contain nothing at all are
 * skipped; deciding whether a row of empty fields is meaningful is left
 * to the caller, which knows the expected column count.
 */
export function tokenize(content: string): CsvRow[] {
  const text = content.startsWith(BOM) ? content.slice(BOM.length) : content;
  const rows: CsvRow[] = [];

  let fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let fieldWasQuoted = false;
  let line = 1;
  let rowStartLine = 1;
  let rowHasContent = false;

  const endField = (): void => {
    fields.push(field);
    field = '';
    fieldWasQuoted = false;
  };

  const endRow = (): void => {
    if (rowHasContent) {
      endField();
      rows.push({ line: rowStartLine, fields });
    }
    fields = [];
    field = '';
    fieldWasQuoted = false;
    rowHasContent = false;
  };

  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        if (char === '\n') {
          line++;
        }
        field += char;
      }
      continue;
    }

    switch (char) {
      case '"':
        // A quote only opens a quoted section at the start of a field;
        // mid-field quotes are kept verbatim, as some banks emit them.
        if (field === '' && !fieldWasQuoted) {
          inQuotes = true;
          fieldWasQuoted = true;
          rowHasContent = true;
        } else {
          field += char;
        }
        break;
      case ',':
        endField();
        rowHasContent = true;
        break;
      case '\r':
        if (text[i + 1] === '\n') {
          i++;
        }
        endRow();
        line++;
        rowStartLine = line;
        break;
      case '\n':
        endRow();
        line++;
        rowStartLine = line;
        break;
      default:
        field += char;
        rowHasContent = true;
    }
  }

  endRow();
  return rows;
}
