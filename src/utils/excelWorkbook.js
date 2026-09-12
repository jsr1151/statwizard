import { read, utils, writeFile } from 'xlsx';

// This adapter is imported only for Excel actions. Static named imports here
// let the production build retain only the SheetJS exports we actually use.
export const readExcelSheets = data => {
    const workbook = read(data, { type: 'array', cellDates: false });
    return workbook.SheetNames.map(name => ({
        name,
        grid: utils.sheet_to_json(workbook.Sheets[name], {
            header: 1,
            raw: false,
            defval: null,
        }),
    }));
};

export const writeExcelDataset = (rows, fileName) => {
    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(rows);
    utils.book_append_sheet(workbook, worksheet, 'Dataset');
    writeFile(workbook, fileName);
};
