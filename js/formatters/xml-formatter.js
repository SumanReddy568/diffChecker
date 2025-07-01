function formatXmlForComparison(xmlInput) {
    try {
        // Simple XML pretty printing
        let formatted = '';
        let indent = 0;
        const tab = '  '; // 2 spaces for indentation
        let inTag = false;
        let inContent = false;
        let inDeclaration = false;
        let inComment = false;
        let tagContent = '';

        for (let i = 0; i < xmlInput.length; i++) {
            const char = xmlInput.charAt(i);
            const nextChar = xmlInput.charAt(i + 1) || '';

            // Handle XML comments
            if (char === '<' && nextChar === '!' && xmlInput.substr(i, 4) === '<!--') {
                inComment = true;
                formatted += '\n' + tab.repeat(indent) + '<!--';
                i += 3;
                continue;
            }
            if (inComment && char === '-' && nextChar === '-' && xmlInput.charAt(i + 2) === '>') {
                inComment = false;
                formatted += '-->';
                i += 2;
                continue;
            }
            if (inComment) {
                formatted += char;
                continue;
            }

            // Handle XML declaration
            if (char === '<' && nextChar === '?') {
                inDeclaration = true;
                formatted += '<';
                continue;
            }
            if (inDeclaration && char === '?' && nextChar === '>') {
                inDeclaration = false;
                formatted += '?>\n';
                i++;
                continue;
            }
            if (inDeclaration) {
                formatted += char;
                continue;
            }

            // Handle tags and content
            if (char === '<' && !inTag && !inContent) {
                // Check if it's a closing tag
                if (nextChar === '/') {
                    indent--;
                }
                inTag = true;
                inContent = false;
                formatted += '\n' + tab.repeat(indent) + '<';
                if (nextChar !== '/') {
                    // Only increment indent for opening tags
                    indent++;
                }
            } else if (char === '>' && inTag) {
                inTag = false;
                inContent = true;
                tagContent = '';
                // Check for self-closing tags
                if (xmlInput.charAt(i - 1) === '/') {
                    indent--;
                }
                formatted += '>';
            } else if (inContent) {
                // Collect content until next tag
                if (char === '<') {
                    // Trim content and add indentation only if it's not empty
                    const trimmedContent = tagContent.trim();
                    if (trimmedContent.length > 0) {
                        formatted += trimmedContent;
                    }
                    i--; // Go back to process the '<' as start of a tag
                    inContent = false;
                } else {
                    tagContent += char;
                }
            } else {
                formatted += char;
            }
        }

        return formatted.trim();
    } catch (error) {
        console.error("Error formatting XML:", error);
        return xmlInput; // Return original if there's an error
    }
}

function highlightXmlDifferences(originalXml, newXml) {
    try {
        const originalFormatted = formatXmlForComparison(originalXml);
        const newFormatted = formatXmlForComparison(newXml);

        // Line by line comparison
        const originalLines = originalFormatted.split('\n');
        const newLines = newFormatted.split('\n');

        const diff = [];
        const maxLength = Math.max(originalLines.length, newLines.length);

        for (let i = 0; i < maxLength; i++) {
            const originalLine = originalLines[i] || '';
            const newLine = newLines[i] || '';

            if (originalLine !== newLine) {
                diff.push({
                    line: i + 1,
                    original: originalLine,
                    updated: newLine,
                    type: 'changed'
                });
            } else {
                diff.push({
                    line: i + 1,
                    original: originalLine,
                    updated: newLine,
                    type: 'unchanged'
                });
            }
        }

        return diff;
    } catch (error) {
        console.error("Error comparing XML:", error);
        return { error: error.message };
    }
}

const xmlFormatter = {
    formatXmlForComparison,
    highlightXmlDifferences
};
