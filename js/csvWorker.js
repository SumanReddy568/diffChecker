// js/csvWorker.js
self.onmessage = function (e) {
    const { type, payload } = e.data;
    if (type === 'parseCSV') {
        const text = payload.text;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== ''); // Filter out empty lines
        if (lines.length === 0) {
            self.postMessage({ type: 'parseError', message: 'Empty or invalid CSV file.' });
            return;
        }

        const parsedData = lines.map(line => {
            // A basic CSV parser for comma-separated values.
            // This simple split does NOT handle quoted fields with commas inside them properly.
            // For example, "cell with, comma" will be split into two cells.
            // For a robust solution, consider a dedicated CSV parsing library (e.g., PapaParse)
            // or a more complex regex/state-machine parser for CSV with quoted fields.
            // Example of a slightly more robust regex split (still not perfect for all edge cases):
            // return line.match(/(".*?"|[^,]+)(?=,|$)/g) || [];
            return line.split(',');
        });
        self.postMessage({ type: 'parseComplete', data: parsedData });
    }
};