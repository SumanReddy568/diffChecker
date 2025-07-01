function formatTextForComparison(text) {
    // Normalize whitespace and line breaks
    const normalizedText = text
        .replace(/\r\n/g, '\n') // Convert Windows line endings to Unix
        .replace(/\r/g, '\n')   // Convert old Mac line endings to Unix
        .replace(/\s+/g, ' ')   // Replace multiple spaces with a single space
        .trim();                // Trim leading and trailing whitespace

    return normalizedText;
}

function highlightDifferences(originalText, newText) {
    const originalLines = originalText.split('\n');
    const newLines = newText.split('\n');
    const diff = [];

    originalLines.forEach((line, index) => {
        if (newLines[index] !== line) {
            diff.push(`<span class="diff-highlight">${line}</span>`);
        } else {
            diff.push(line);
        }
    });

    // Add remaining lines from newText if any
    if (newLines.length > originalLines.length) {
        for (let i = originalLines.length; i < newLines.length; i++) {
            diff.push(`<span class="diff-highlight">${newLines[i]}</span>`);
        }
    }

    return diff.join('\n');
}

// Replace export statement with global variable assignment
const textFormatter = {
    formatTextForComparison,
    highlightDifferences
};

// Remove the export line