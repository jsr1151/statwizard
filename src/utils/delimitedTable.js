const DELIMITER_OPTIONS = [',', '\t', ';'];

const countDelimiter = (line, delimiter) => {
    let inQuotes = false;
    let count = 0;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
            const nextCharacter = line[index + 1];

            if (inQuotes && nextCharacter === '"') {
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (!inQuotes && character === delimiter) {
            count += 1;
        }
    }

    return count;
};

const detectDelimiter = (text) => {
    const sampleLine = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find((line) => line.length > 0);

    if (!sampleLine) {
        return ',';
    }

    const ranked = DELIMITER_OPTIONS
        .map((delimiter) => ({
            delimiter,
            count: countDelimiter(sampleLine, delimiter),
        }))
        .sort((left, right) => right.count - left.count);

    return ranked[0]?.count > 0 ? ranked[0].delimiter : ',';
};

const parseDelimitedLine = (line, delimiter) => {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (character === '"') {
            const nextCharacter = line[index + 1];

            if (inQuotes && nextCharacter === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (!inQuotes && character === delimiter) {
            cells.push(current.trim());
            current = '';
            continue;
        }

        current += character;
    }

    cells.push(current.trim());
    return cells;
};

const parseNumericValue = (value) => {
    const trimmed = String(value ?? '').trim();

    if (!trimmed) {
        return null;
    }

    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : null;
};

const hasHeaderRow = (row = []) =>
    row.some((cell) => {
        const trimmed = String(cell ?? '').trim();

        if (!trimmed) {
            return true;
        }

        return Number.isNaN(Number(trimmed));
    });

const normalizeHeader = (header, index, seen) => {
    const base = String(header ?? '').trim() || `Column ${index + 1}`;
    let candidate = base;
    let suffix = 2;

    while (seen.has(candidate)) {
        candidate = `${base} (${suffix})`;
        suffix += 1;
    }

    seen.add(candidate);
    return candidate;
};

export const parseDelimitedTable = (text) => {
    const source = String(text ?? '');
    const trimmed = source.trim();

    if (!trimmed) {
        return {
            ok: false,
            errors: ['Paste or upload a CSV-style table to begin.'],
            headers: [],
            rows: [],
            columns: [],
            numericColumns: [],
            delimiter: ',',
        };
    }

    const delimiter = detectDelimiter(trimmed);
    const rawRows = trimmed
        .split(/\r?\n/)
        .map((line) => parseDelimitedLine(line, delimiter))
        .filter((row) => row.some((cell) => String(cell ?? '').trim().length > 0));

    if (!rawRows.length) {
        return {
            ok: false,
            errors: ['No rows were found in the pasted table.'],
            headers: [],
            rows: [],
            columns: [],
            numericColumns: [],
            delimiter,
        };
    }

    const firstRow = rawRows[0];
    const usesHeaderRow = hasHeaderRow(firstRow);
    const width = rawRows.reduce((maxWidth, row) => Math.max(maxWidth, row.length), 0);
    const seenHeaders = new Set();
    const headers = Array.from({ length: width }, (_, index) => normalizeHeader(
        usesHeaderRow ? firstRow[index] : `Column ${index + 1}`,
        index,
        seenHeaders
    ));
    const dataRows = usesHeaderRow ? rawRows.slice(1) : rawRows;

    const paddedRows = dataRows.map((row) => {
        const padded = [...row];

        while (padded.length < width) {
            padded.push('');
        }

        return padded;
    });

    const columns = headers.map((name, index) => {
        const values = paddedRows.map((row) => row[index] ?? '');
        const numericValues = values.map(parseNumericValue);
        const validNumericValues = numericValues.filter((value) => Number.isFinite(value));

        return {
            name,
            values,
            numericValues,
            numericValidCount: validNumericValues.length,
            uniqueNumericCount: new Set(validNumericValues.map((value) => value.toFixed(10))).size,
            blankCount: values.filter((value) => !String(value ?? '').trim()).length,
        };
    });

    const rows = paddedRows.map((row, rowIndex) => Object.fromEntries(
        headers.map((header, columnIndex) => [header, row[columnIndex] ?? '']).concat([['__rowId', rowIndex]])
    ));

    return {
        ok: true,
        errors: [],
        delimiter,
        headers,
        rows,
        columns,
        numericColumns: columns.filter((column) => column.numericValidCount >= 2),
        rowCount: rows.length,
    };
};
