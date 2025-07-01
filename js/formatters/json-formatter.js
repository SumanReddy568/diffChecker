function formatJsonForComparison(jsonInput) {
    try {
        const parsedJson = JSON.parse(jsonInput);
        return JSON.stringify(parsedJson, null, 2); // Pretty print JSON with 2-space indentation
    } catch (error) {
        console.error("Invalid JSON input:", error);
        return null;
    }
}

function highlightDifferences(originalJson, newJson) {
    try {
        const originalParsed = typeof originalJson === 'string' ? JSON.parse(originalJson) : originalJson;
        const newParsed = typeof newJson === 'string' ? JSON.parse(newJson) : newJson;

        const diff = {};

        function recursiveDiff(original, updated, path = '') {
            // Handle null values
            if (original === null || updated === null) {
                if (original !== updated) {
                    diff[path] = { original: original, updated: updated };
                }
                return;
            }

            // Handle primitive types (string, number, boolean)
            if (typeof original !== 'object' || typeof updated !== 'object') {
                if (original !== updated) {
                    diff[path] = { original: original, updated: updated };
                }
                return;
            }

            // Handle arrays
            if (Array.isArray(original) && Array.isArray(updated)) {
                const maxLength = Math.max(original.length, updated.length);
                for (let i = 0; i < maxLength; i++) {
                    const itemPath = path ? `${path}[${i}]` : `[${i}]`;
                    if (i >= original.length) {
                        diff[itemPath] = { added: updated[i] };
                    } else if (i >= updated.length) {
                        diff[itemPath] = { removed: original[i] };
                    } else {
                        recursiveDiff(original[i], updated[i], itemPath);
                    }
                }
                return;
            }

            // Handle objects
            for (const key in updated) {
                const currentPath = path ? `${path}.${key}` : key;
                if (!(key in original)) {
                    diff[currentPath] = { added: updated[key] };
                } else {
                    recursiveDiff(original[key], updated[key], currentPath);
                }
            }

            for (const key in original) {
                const currentPath = path ? `${path}.${key}` : key;
                if (!(key in updated)) {
                    diff[currentPath] = { removed: original[key] };
                }
            }
        }

        recursiveDiff(originalParsed, newParsed);
        return diff;
    } catch (error) {
        console.error("Error comparing JSON:", error);
        return { error: error.message };
    }
}

// Simplified highlighting function
function highlightJsonPropertyInText(jsonText, propertyPath, className) {
    try {
        const jsonObj = JSON.parse(jsonText);
        const formattedJson = JSON.stringify(jsonObj, null, 2);
        const pathParts = propertyPath.replace(/\[(\d+)\]/g, '.$1').split('.');
        const propertyName = pathParts[pathParts.length - 1];
        const propertyRegex = new RegExp(`("${propertyName}"\\s*:\\s*)(.*?)([,\\n\\r}])`, 'g');

        return formattedJson.replace(propertyRegex, (match, prefix, value, suffix) => {
            return `${prefix}<span class="${className}">${value}</span>${suffix}`;
        });
    } catch (error) {
        console.error("Error highlighting JSON property:", error);
        return jsonText;
    }
}

const jsonFormatter = {
    formatJsonForComparison,
    highlightDifferences,
    highlightJsonPropertyInText
};