// diff-engine.js

function compareText(text1, text2, options = {}) {
    const diff = [];
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    const maxLength = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLength; i++) {
        if (lines1[i] !== lines2[i]) {
            diff.push({ line: i + 1, text1: lines1[i] || '', text2: lines2[i] || '' });
        }
    }
    return diff;
}

function compareCSV(csv1, csv2) {
    const rows1 = csv1.split('\n').map(row => row.split(','));
    const rows2 = csv2.split('\n').map(row => row.split(','));
    const maxRows = Math.max(rows1.length, rows2.length);
    const diff = [];

    for (let i = 0; i < maxRows; i++) {
        const maxCols = Math.max(rows1[i]?.length || 0, rows2[i]?.length || 0);
        for (let j = 0; j < maxCols; j++) {
            if ((rows1[i] && rows1[i][j]) !== (rows2[i] && rows2[i][j])) {
                diff.push({ row: i + 1, col: j + 1, text1: rows1[i] ? rows1[i][j] : '', text2: rows2[i] ? rows2[i][j] : '' });
            }
        }
    }
    return diff;
}

function compareJSON(json1, json2, options = {}) {
    const diff = [];

    try {
        const obj1 = JSON.parse(json1);
        const obj2 = JSON.parse(json2);

        // Format both JSON objects for better visual comparison
        const formatted1 = JSON.stringify(obj1, null, 2);
        const formatted2 = JSON.stringify(obj2, null, 2);

        // Convert to lines for line-by-line comparison
        const lines1 = formatted1.split('\n');
        const lines2 = formatted2.split('\n');

        // Basic line-by-line comparison with context
        const maxLines = Math.max(lines1.length, lines2.length);

        // Track which properties have changed for highlighting
        const changedProps = findChangedProperties(obj1, obj2);

        // For each line, check if it contains a changed property
        for (let i = 0; i < maxLines; i++) {
            const line1 = lines1[i] || '';
            const line2 = lines2[i] || '';

            if (line1 === line2) {
                // Lines are identical
                diff.push({
                    line: i + 1,
                    text1: line1,
                    text2: line2,
                    type: 'unchanged'
                });
            } else {
                // Check if this line contains a property that changed
                let foundPropertyChange = false;

                for (const prop of changedProps) {
                    const propPattern = new RegExp(`"${prop}"\\s*:`);

                    if (propPattern.test(line1) || propPattern.test(line2)) {
                        foundPropertyChange = true;
                        // Extract property values
                        const propValue1 = extractPropertyValue(line1);
                        const propValue2 = extractPropertyValue(line2);

                        diff.push({
                            line: i + 1,
                            text1: line1,
                            text2: line2,
                            propName: prop,
                            propValue1: propValue1,
                            propValue2: propValue2,
                            type: 'property-changed'
                        });
                        break;
                    }
                }

                if (!foundPropertyChange) {
                    // Some other difference (structure, missing line, etc.)
                    diff.push({
                        line: i + 1,
                        text1: line1,
                        text2: line2,
                        type: 'changed'
                    });
                }
            }
        }
    } catch (error) {
        console.error("JSON parsing error:", error);
        diff.push({ path: 'ERROR', value1: 'Invalid JSON input', value2: error.message });
    }

    return diff;
}

function compareXML(xml1, xml2, options = {}) {
    const diff = [];

    try {
        // Format both XML documents for better visual comparison
        const formatted1 = formatXmlForComparison(xml1);
        const formatted2 = formatXmlForComparison(xml2);

        // Convert to lines for line-by-line comparison
        const lines1 = formatted1.split('\n');
        const lines2 = formatted2.split('\n');

        // Basic line-by-line comparison with context
        const maxLines = Math.max(lines1.length, lines2.length);

        for (let i = 0; i < maxLines; i++) {
            const line1 = lines1[i] || '';
            const line2 = lines2[i] || '';

            if (line1 === line2) {
                // Lines are identical
                diff.push({
                    line: i + 1,
                    text1: line1,
                    text2: line2,
                    type: 'unchanged'
                });
            } else {
                // Lines are different
                diff.push({
                    line: i + 1,
                    text1: line1,
                    text2: line2,
                    type: 'changed'
                });
            }
        }
    } catch (error) {
        console.error("XML comparison error:", error);
        diff.push({ path: 'ERROR', value1: 'XML processing error', value2: error.message });
    }

    return diff;
}

// Helper function to find property names that changed values
function findChangedProperties(obj1, obj2, path = '') {
    const changedProps = [];

    // Compare primitive values
    if (obj1 === null || obj2 === null ||
        typeof obj1 !== 'object' || typeof obj2 !== 'object') {
        if (obj1 !== obj2) {
            changedProps.push(path);
        }
        return changedProps;
    }

    // Handle arrays
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        const maxLength = Math.max(obj1.length, obj2.length);
        for (let i = 0; i < maxLength; i++) {
            if (i < obj1.length && i < obj2.length) {
                const arrayPath = path ? `${path}[${i}]` : `[${i}]`;
                changedProps.push(...findChangedProperties(obj1[i], obj2[i], arrayPath));
            }
        }
        return changedProps;
    }

    // Compare object properties
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;

        if (!(key in obj1) || !(key in obj2)) {
            changedProps.push(currentPath);
        } else if (typeof obj1[key] !== typeof obj2[key]) {
            changedProps.push(currentPath);
        } else if (typeof obj1[key] === 'object' && obj1[key] !== null && obj2[key] !== null) {
            changedProps.push(...findChangedProperties(obj1[key], obj2[key], currentPath));
        } else if (obj1[key] !== obj2[key]) {
            changedProps.push(currentPath);
        }
    }

    return changedProps;
}

// Helper function to extract property value from a JSON line
function extractPropertyValue(line) {
    const valueMatch = line.match(/:\s*(.+?)(?:,|\s*$)/);
    return valueMatch ? valueMatch[1].trim() : null;
}

function highlightDifferences(diff, mode = 'vertical') {
    if (mode === 'vertical') {
        return generateVerticalHighlight(diff);
    } else {
        return generateInlineHighlight(diff);
    }
}

function generateVerticalHighlight(diff) {
    let html = '<div class="comparison-container">';
    html += '<div class="column source"><h3>Original</h3>';

    let leftLineNum = 1;
    let rightLineNum = 1;

    diff.forEach(d => {
        if (d.text1 !== undefined) {
            html += `<div class="line ${d.text1 !== d.text2 ? 'removed' : ''}">`;
            html += `<span class="line-numbers">${leftLineNum++}</span>`;
            html += `${d.text1}</div>`;
        } else {
            html += `<div class="spacer"></div>`;
        }
    });

    html += '</div><div class="column target"><h3>Modified</h3>';

    diff.forEach(d => {
        if (d.text2 !== undefined) {
            html += `<div class="line ${d.text1 !== d.text2 ? 'added' : ''}">`;
            html += `<span class="line-numbers">${rightLineNum++}</span>`;
            html += `${d.text2}</div>`;
        } else {
            html += `<div class="spacer"></div>`;
        }
    });

    html += '</div></div>';
    return html;
}

function generateInlineHighlight(diff) {
    let html = '';
    diff.forEach(d => {
        if (d.text1 !== d.text2) {
            html += `<div class="diff-line">`;
            if (d.text1 !== undefined) {
                html += `<span class="removed">${d.text1}</span>`;
            }
            if (d.text2 !== undefined) {
                html += `<span class="added">${d.text2}</span>`;
            }
            html += `</div>`;
        } else {
            html += `<div class="diff-line unchanged">${d.text1}</div>`;
        }
    });
    return html;
}

function generateAIReport(diff) {
    // Implementation for generating an AI-based report on the differences
}

// Helper function to format XML for comparison
function formatXmlForComparison(xmlInput) {
    // Use the XML formatter if available, otherwise use a simplified version
    if (window.xmlFormatter && typeof window.xmlFormatter.formatXmlForComparison === 'function') {
        return window.xmlFormatter.formatXmlForComparison(xmlInput);
    }

    // Simple XML formatting fallback
    try {
        let formatted = '';
        let indent = 0;
        const tab = '  ';
        let inTag = false;

        for (let i = 0; i < xmlInput.length; i++) {
            const char = xmlInput.charAt(i);

            if (char === '<') {
                if (xmlInput.charAt(i + 1) === '/') indent--;
                formatted += '\n' + tab.repeat(indent) + '<';
                inTag = true;
                if (xmlInput.charAt(i + 1) !== '/' &&
                    xmlInput.charAt(i + 1) !== '?' &&
                    xmlInput.substr(i + 1, 3) !== '!--') {
                    indent++;
                }
            } else if (char === '>') {
                formatted += '>';
                inTag = false;
                if (xmlInput.charAt(i - 1) === '/') indent--;
            } else {
                formatted += char;
            }
        }

        return formatted.trim();
    } catch (error) {
        console.error("XML formatting error:", error);
        return xmlInput;
    }
}

const diffEngine = {
    compareText,
    compareCSV,
    compareJSON,
    compareXML,
    highlightDifferences,
    generateAIReport
};