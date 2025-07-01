function formatCSV(input) {
    const rows = input.split('\n');
    const formattedData = rows.map(row => row.split(',').map(cell => cell.trim()));
    return formattedData;
}

function compareCSV(csv1, csv2) {
    const formattedCSV1 = formatCSV(csv1);
    const formattedCSV2 = formatCSV(csv2);

    const maxRows = Math.max(formattedCSV1.length, formattedCSV2.length);
    const differences = [];

    for (let i = 0; i < maxRows; i++) {
        const row1 = formattedCSV1[i] || [];
        const row2 = formattedCSV2[i] || [];
        const maxCols = Math.max(row1.length, row2.length);

        for (let j = 0; j < maxCols; j++) {
            const cell1 = row1[j] || '';
            const cell2 = row2[j] || '';
            if (cell1 !== cell2) {
                differences.push({
                    row: i + 1,
                    col: j + 1,
                    value1: cell1,
                    value2: cell2
                });
            }
        }
    }

    return differences;
}

const csvFormatter = {
    formatCSV,
    compareCSV
};