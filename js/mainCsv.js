// Set current year in the footer
document.getElementById('current-year').textContent = new Date().getFullYear();

// Theme toggle (reuse from index.html)
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
    document.body.classList.remove('theme-light', 'theme-dark');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem('theme', theme);
}

// Apply saved theme on load
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    applyTheme(savedTheme);
} else {
    // Default to dark if no theme is saved
    applyTheme('dark');
}

themeToggle.addEventListener('click', function () {
    if (document.body.classList.contains('theme-dark')) {
        applyTheme('light');
    } else {
        applyTheme('dark');
    }
});


// CSV Formatter Logic
let csvData = []; // Stores the original, full CSV data
let filteredData = []; // Stores the currently filtered/displayed data
let headers = [];
let filterCol = '';
let filterValue = '';
let currentPageStart = 0;
const rowsPerPage = 100;

const csvUpload = document.getElementById('csv-upload');
const csvTableContainer = document.getElementById('csv-table-container');
const csvTableInfo = document.getElementById('csv-table-info');
const csvLoading = document.getElementById('csv-loading');
const filterColSelect = document.getElementById('filter-col');
const filterValueInput = document.getElementById('filter-value');
const applyFilterBtn = document.getElementById('apply-filter');
const clearFilterBtn = document.getElementById('clear-filter');
const addColBtn = document.getElementById('add-col');
const downloadBtn = document.getElementById('download-csv');
const csvControls = document.getElementById('csv-controls');

// Helper function for deep copying arrays (essential for data integrity)
function deepCopy(arr) {
    if (!Array.isArray(arr)) {
        return arr; // Not an array, return as is
    }
    return arr.map(item => Array.isArray(item) ? deepCopy(item) : item);
}

// --- State Management and Persistence ---
function saveState() {
    try {
        localStorage.setItem('csvHeaders', JSON.stringify(headers));
        localStorage.setItem('csvFullData', JSON.stringify(csvData));
        localStorage.setItem('csvFilterCol', filterCol);
        localStorage.setItem('csvFilterValue', filterValue);
        localStorage.setItem('csvCurrentPageStart', currentPageStart);
    } catch (e) {
        console.error("Failed to save state to localStorage:", e);
        alert("Warning: Local storage limit reached. Data may not be fully saved.");
    }
}

function loadState() {
    try {
        const savedHeaders = localStorage.getItem('csvHeaders');
        const savedData = localStorage.getItem('csvFullData');
        const savedFilterCol = localStorage.getItem('csvFilterCol');
        const savedFilterValue = localStorage.getItem('csvFilterValue');
        const savedPageStart = localStorage.getItem('csvCurrentPageStart');

        if (savedHeaders && savedData) {
            headers = JSON.parse(savedHeaders);
            csvData = JSON.parse(savedData);
            filterCol = savedFilterCol || (headers.length > 0 ? '0' : ''); // Default to first col if exists
            filterValue = savedFilterValue || '';
            currentPageStart = savedPageStart ? parseInt(savedPageStart, 10) : 0;

            // Ensure current page start is valid after loading data
            if (currentPageStart >= csvData.length && csvData.length > 0) {
                currentPageStart = Math.max(0, csvData.length - rowsPerPage);
            } else if (csvData.length === 0) {
                currentPageStart = 0;
            }


            updateFilterOptions();
            csvControls.style.display = 'flex'; // Use flex for better control layout
            downloadBtn.style.display = 'inline-block';

            // Re-apply filter on load
            filteredData = applyCurrentFilter();
            renderTable(filteredData, currentPageStart, currentPageStart + rowsPerPage);

            csvTableInfo.textContent = `Loaded ${filteredData.length} rows from saved data.`;
            filterColSelect.value = filterCol;
            filterValueInput.value = filterValue;
            return true; // State loaded successfully
        }
    } catch (e) {
        console.error("Failed to load state from localStorage:", e);
        // Clear corrupt data if any
        localStorage.removeItem('csvHeaders');
        localStorage.removeItem('csvFullData');
        localStorage.removeItem('csvFilterCol');
        localStorage.removeItem('csvFilterValue');
        localStorage.removeItem('csvCurrentPageStart');
        alert("Warning: Corrupted data detected in local storage. Starting fresh.");
    }
    return false; // No saved state or error
}

// --- Web Worker for CSV Parsing ---
// NOTE: For this to work, you need a separate 'worker.js' file.
// If you cannot create a separate file, you can embed it as a Blob URL,
// but it's generally cleaner as a separate file.
// For simplicity in a single file response, I'm showing how the communication would work.
// You would put the 'self.onmessage' part in a file named `csvWorker.js` in your `js` folder.

// --- csvWorker.js content (put this in a file named `js/csvWorker.js`) ---
/*
self.onmessage = function(e) {
    const { type, payload } = e.data;
    if (type === 'parseCSV') {
        const text = payload.text;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== ''); // Filter out empty lines
        if (lines.length === 0) {
            self.postMessage({ type: 'parseError', message: 'Empty or invalid CSV file.' });
            return;
        }

        const parsedData = lines.map(line => {
            // A basic CSV parser for comma-separated values,
            // does NOT handle quoted fields with commas inside them properly.
            // For robust parsing, consider a library like 'PapaParse' or more complex regex.
            return line.split(',');
        });
        self.postMessage({ type: 'parseComplete', data: parsedData });
    }
};
*/
// --- End of csvWorker.js content ---


const worker = new Worker('js/csvWorker.js'); // Make sure this path is correct

worker.onmessage = function (e) {
    const { type, data, message } = e.data;
    if (type === 'parseComplete') {
        csvLoading.style.display = 'none';
        if (data.length === 0) {
            csvTableInfo.textContent = 'CSV file is empty.';
            csvTableContainer.innerHTML = '<div class="placeholder-message"><i class="fas fa-table"></i><p>CSV file is empty.</p></div>';
            resetAppState();
            return;
        }
        headers = data[0];
        csvData = data.slice(1); // All rows except header
        filterCol = headers.length > 0 ? '0' : ''; // Default to first column for filter
        filterValue = ''; // Clear any previous filter value
        currentPageStart = 0; // Reset pagination

        updateFilterOptions();
        csvControls.style.display = 'flex';
        downloadBtn.style.display = 'inline-block';

        filteredData = deepCopy(csvData); // Initial deep copy
        renderTable(filteredData, currentPageStart, currentPageStart + rowsPerPage);
        csvTableInfo.textContent = `Loaded ${filteredData.length} rows.`;
        saveState(); // Save after initial load
    } else if (type === 'parseError') {
        csvLoading.style.display = 'none';
        alert("Error parsing CSV: " + message);
        csvTableContainer.innerHTML = '<div class="placeholder-message"><i class="fas fa-exclamation-triangle"></i><p>Error loading CSV.</p></div>';
        csvTableInfo.textContent = '';
        resetAppState();
    }
};

worker.onerror = function (error) {
    csvLoading.style.display = 'none';
    console.error("Web Worker error:", error);
    alert("An error occurred with the CSV parsing process.");
    csvTableContainer.innerHTML = '<div class="placeholder-message"><i class="fas fa-exclamation-triangle"></i><p>Error loading CSV.</p></div>';
    csvTableInfo.textContent = '';
    resetAppState();
};

function resetAppState() {
    csvData = [];
    filteredData = [];
    headers = [];
    filterCol = '';
    filterValue = '';
    currentPageStart = 0;
    csvControls.style.display = 'none';
    downloadBtn.style.display = 'none';
    filterColSelect.innerHTML = '';
    filterValueInput.value = '';
    localStorage.clear(); // Clear all saved state
}

function updateFilterOptions() {
    filterColSelect.innerHTML = '';
    headers.forEach((h, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = h;
        filterColSelect.appendChild(opt);
    });
    // Set the selected filter column if it exists and is valid
    if (filterCol !== '' && headers[parseInt(filterCol)]) {
        filterColSelect.value = filterCol;
    } else if (headers.length > 0) {
        filterColSelect.value = '0'; // Default to first column
        filterCol = '0';
    }
}

function renderTable(data, start = 0, end = rowsPerPage) {
    currentPageStart = start; // Update the global page start

    if (!data.length && !filterValue) { // No data and no active filter
        csvTableContainer.innerHTML = '<div class="placeholder-message"><i class="fas fa-table"></i><p>No CSV data loaded.</p></div>';
        csvTableInfo.textContent = '';
        return;
    } else if (!data.length && filterValue) { // Filter applied, but no results
        csvTableContainer.innerHTML = '<div class="placeholder-message"><i class="fas fa-search-minus"></i><p>No results found for the current filter.</p></div>';
        csvTableInfo.textContent = `0 rows found for filter.`;
        return;
    }

    const rowsToRender = data.slice(start, Math.min(end, data.length));

    let html = '<table class="csv-table" style="width:100%; border-collapse:collapse;">';
    // Header row
    html += '<thead><tr>';
    headers.forEach((h, idx) => {
        html += `<th style="background:var(--bg-tertiary);color:var(--text-primary);padding:8px;border-bottom:1px solid var(--border-color);position:relative;">
            ${h}
            <button class="button button-danger" style="padding:2px 6px;font-size:0.9em;margin-left:6px;" onclick="deleteCol(${idx})" title="Delete Column"><i class="fas fa-trash"></i></button>
        </th>`;
    });
    html += '</tr></thead><tbody>';
    // Data rows (virtualized view)
    rowsToRender.forEach((row, rowIndexInChunk) => {
        // Calculate the original row index in the full filteredData array
        const originalRowIndex = start + rowIndexInChunk;
        html += '<tr>';
        headers.forEach((h, colIdx) => {
            const cellValue = row[colIdx] !== undefined ? row[colIdx] : '';
            html += `<td style="padding:6px;border-bottom:1px solid var(--border-subtle);color:var(--text-primary);background:var(--bg-primary);" contenteditable="true" data-original-row-idx="${originalRowIndex}" data-col="${colIdx}">${cellValue}</td>`;
        });
        html += '</tr>';
    });
    html += '</tbody></table>';

    // Paging controls for large files
    if (data.length > rowsPerPage) {
        html += `<div style="margin:10px 0; text-align: center;">
            <button class="button button-secondary" id="prev-page" ${start === 0 ? 'disabled' : ''}>Prev</button>
            <span style="margin:0 10px; color:var(--text-primary);">Rows ${start + 1}-${Math.min(end, data.length)} of ${data.length}</span>
            <button class="button button-secondary" id="next-page" ${end >= data.length ? 'disabled' : ''}>Next</button>
        </div>`;
    }
    csvTableContainer.innerHTML = html;

    // Attach cell edit listeners
    Array.from(csvTableContainer.querySelectorAll('td[contenteditable="true"]')).forEach(cell => {
        cell.addEventListener('input', function () {
            const originalRowIndex = parseInt(this.getAttribute('data-original-row-idx'));
            const colIdx = parseInt(this.getAttribute('data-col'));
            const newValue = this.textContent;

            // Update the filteredData array directly
            if (filteredData[originalRowIndex]) {
                filteredData[originalRowIndex][colIdx] = newValue;
            }

            // If no filter is applied, also update the original csvData
            // This relies on filteredData being a deepCopy when no filter is active.
            if (!filterValue) {
                // If filterValue is empty, filteredData is a deep copy of csvData.
                // So updating filteredData at originalRowIndex also means that
                // the corresponding row in csvData (if it's the same array as filteredData)
                // or its values (if it was deeply copied) needs to be updated.
                // Since filteredData is always a copy, we need to map back to csvData.
                // This is the most robust way: find the value in the original `csvData`
                // that matches the edited `filteredData` row and update it.
                // This approach ensures consistency.
                if (csvData[originalRowIndex]) {
                    csvData[originalRowIndex][colIdx] = newValue;
                }
            } else {
                // If a filter is applied, the originalRowIndex refers to the index
                // within the `filteredData` array. To update `csvData`,
                // you would need a mechanism to find the corresponding original
                // row in `csvData`. This is where storing `original_csv_index`
                // within each `filteredData` row object (if you switch to objects)
                // would be useful.
                // For now, if filtered, edits are only truly reflected in filteredData until filter is cleared.
                // A more advanced solution would track original indices for filtered rows.
            }
            saveState(); // Save state after edit
        });
    });

    // Paging events
    if (data.length > rowsPerPage) {
        document.getElementById('prev-page').onclick = () => {
            const newStart = Math.max(0, start - rowsPerPage);
            renderTable(data, newStart, newStart + rowsPerPage);
            saveState(); // Save state on page change
        };
        document.getElementById('next-page').onclick = () => {
            const newStart = start + rowsPerPage;
            renderTable(data, newStart, Math.min(data.length, newStart + rowsPerPage));
            saveState(); // Save state on page change
        };
    }
    csvTableInfo.textContent = `Showing ${rowsToRender.length} of ${data.length} rows.`;
}

// Expose deleteCol globally for inline onclick
window.deleteCol = function (idx) {
    if (!confirm('Are you sure you want to delete this column? This action cannot be undone.')) {
        return;
    }

    // Remove header
    headers.splice(idx, 1);

    // Remove column data from each row in the ORIGINAL csvData
    csvData.forEach(row => {
        if (row.length > idx) {
            row.splice(idx, 1);
        }
    });

    // Re-apply filter and re-render with updated data
    filteredData = applyCurrentFilter();
    updateFilterOptions();

    // Adjust currentPageStart if it goes out of bounds
    if (currentPageStart >= filteredData.length && filteredData.length > 0) {
        currentPageStart = Math.max(0, filteredData.length - rowsPerPage);
    } else if (filteredData.length === 0) {
        currentPageStart = 0;
    }

    renderTable(filteredData, currentPageStart, currentPageStart + rowsPerPage);
    saveState(); // Save state after deletion
};

addColBtn.addEventListener('click', function () {
    const colName = prompt('Enter new column name:');
    if (!colName || colName.trim() === '') {
        alert("Column name cannot be empty.");
        return;
    }
    if (headers.includes(colName.trim())) {
        alert("A column with this name already exists.");
        return;
    }

    headers.push(colName.trim());
    csvData.forEach(row => row.push('')); // Add empty string for new column
    filteredData = applyCurrentFilter(); // Re-apply filter
    updateFilterOptions();
    renderTable(filteredData, currentPageStart, currentPageStart + rowsPerPage);
    saveState(); // Save state after adding column
});

function applyCurrentFilter() {
    if (!filterValue.trim()) {
        // If no filter, return a deep copy of the original data.
        return deepCopy(csvData);
    }
    const colIdx = parseInt(filterColSelect.value, 10);
    const filterText = filterValue.toLowerCase();

    // Ensure colIdx is valid
    if (isNaN(colIdx) || colIdx < 0 || colIdx >= headers.length) {
        console.warn("Invalid filter column selected. Clearing filter.");
        return deepCopy(csvData);
    }

    return csvData.filter(row => {
        const cellContent = row[colIdx] !== undefined ? String(row[colIdx]) : '';
        return cellContent.toLowerCase().includes(filterText);
    });
}

applyFilterBtn.addEventListener('click', function () {
    filterCol = filterColSelect.value;
    filterValue = filterValueInput.value;
    currentPageStart = 0; // Reset pagination on new filter
    filteredData = applyCurrentFilter();
    renderTable(filteredData, currentPageStart, currentPageStart + rowsPerPage);
    saveState(); // Save state after applying filter
});

clearFilterBtn.addEventListener('click', function () {
    filterValueInput.value = '';
    filterValue = '';
    filterCol = headers.length > 0 ? '0' : ''; // Reset to first column
    filterColSelect.value = filterCol;
    currentPageStart = 0; // Reset pagination
    filteredData = deepCopy(csvData); // Clear filter, show all data (deep copy)
    renderTable(filteredData, currentPageStart, currentPageStart + rowsPerPage);
    saveState(); // Save state after clearing filter
});

downloadBtn.addEventListener('click', function () {
    let csvContent = headers.map(h => {
        // Enclose headers in quotes if they contain commas or quotes
        let processedHeader = String(h);
        if (processedHeader.includes(',') || processedHeader.includes('"') || processedHeader.includes('\n')) {
            processedHeader = '"' + processedHeader.replace(/"/g, '""') + '"';
        }
        return processedHeader;
    }).join(',') + '\n';

    filteredData.forEach(row => {
        csvContent += row.map(cell => {
            let processedCell = (cell !== undefined && cell !== null) ? String(cell) : '';
            // Enclose cells in quotes if they contain commas, double quotes, or newlines
            if (processedCell.includes(',') || processedCell.includes('"') || processedCell.includes('\n')) {
                processedCell = '"' + processedCell.replace(/"/g, '""') + '"';
            }
            return processedCell;
        }).join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted_filtered_csv_data.csv'; // More descriptive default name
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

csvUpload.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) { // 50 MB limit
        alert("File is too large. Please upload a CSV file smaller than 50MB for optimal performance.");
        // Optionally, handle larger files with more advanced streaming or server-side processing
        return;
    }

    csvLoading.style.display = 'flex'; // Use flex for centering spinner
    csvTableContainer.innerHTML = '';
    csvTableInfo.textContent = '';
    filterColSelect.innerHTML = '';
    filterValueInput.value = '';

    const reader = new FileReader();
    reader.onload = function (evt) {
        worker.postMessage({ type: 'parseCSV', payload: { text: evt.target.result } });
    };
    reader.onerror = function (evt) {
        csvLoading.style.display = 'none';
        console.error("File reading error:", evt.target.error);
        alert("Error reading file: " + evt.target.error.name);
        resetAppState();
    };
    reader.readAsText(file);
});

// Initial load check
document.addEventListener('DOMContentLoaded', () => {
    if (!loadState()) {
        // If no state found, ensure the initial placeholder message is shown
        csvTableContainer.innerHTML = '<div class="placeholder-message"><i class="fas fa-table"></i><p>Upload a CSV file to get started.</p></div>';
        csvTableInfo.textContent = '';
    }
});