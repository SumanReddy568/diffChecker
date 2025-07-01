const aiAnalysis = (() => {
    // Enhanced AI analysis with deeper insights and pattern recognition
    const analyzeDifferences = (original, modified, format = 'text') => {
        const report = {
            differences: [],
            summary: '',
            format: format,
            insights: [],
            patterns: [],
            impact: 'neutral',
            complexity: 'low',
            semanticChanges: []
        };

        // Skip empty content
        if (!original || !modified) {
            report.summary = 'Cannot analyze empty content.';
            return report;
        }

        try {
            // Ensure inputs are strings
            const originalStr = String(original);
            const modifiedStr = String(modified);

            // Format-specific analysis
            let result;
            if (format === 'json') {
                result = analyzeJsonDifferences(originalStr, modifiedStr, report);
            } else if (format === 'csv') {
                result = analyzeCsvDifferences(originalStr, modifiedStr, report);
            } else {
                result = analyzeTextDifferences(originalStr, modifiedStr, report);
            }

            // Add semantic analysis for all formats
            analyzeSemanticChanges(originalStr, modifiedStr, result);

            // Analyze the overall impact and complexity of changes
            analyzeImpactAndComplexity(result);

            return result;
        } catch (e) {
            console.error("Analysis error:", e);
            report.summary = `Error analyzing content: ${e.message}`;
            return report;
        }
    };

    const analyzeTextDifferences = (original, modified, report) => {
        try {
            const originalLines = original.split('\n');
            const modifiedLines = modified.split('\n');

            // Count additions and removals
            let addedLines = 0;
            let removedLines = 0;
            let modifiedLineCount = 0;

            // Detailed change tracking
            const modifiedLineDetails = [];
            const addedLineDetails = [];
            const removedLineDetails = [];

            // Simple diff algorithm
            const maxLines = Math.max(originalLines.length, modifiedLines.length);
            for (let i = 0; i < maxLines; i++) {
                if (i >= originalLines.length) {
                    addedLines++;
                    addedLineDetails.push({
                        lineNumber: i + 1,
                        content: modifiedLines[i]
                    });
                } else if (i >= modifiedLines.length) {
                    removedLines++;
                    removedLineDetails.push({
                        lineNumber: i + 1,
                        content: originalLines[i]
                    });
                } else if (originalLines[i] !== modifiedLines[i]) {
                    modifiedLineCount++;
                    modifiedLineDetails.push({
                        lineNumber: i + 1,
                        original: originalLines[i],
                        modified: modifiedLines[i],
                        // Calculate simple word-level diff
                        wordChanges: identifyWordChanges(originalLines[i], modifiedLines[i])
                    });
                }
            }

            // Generate insights
            if (addedLines > 0) {
                report.insights.push(`Added ${addedLines} new line(s)`);

                // Add detailed insights about added lines
                addedLineDetails.slice(0, 3).forEach(detail => {
                    const previewContent = truncateWithEllipsis(detail.content, 50);
                    report.insights.push(`Line ${detail.lineNumber}: Added "${previewContent}"`);
                });

                if (addedLineDetails.length > 3) {
                    report.insights.push(`... and ${addedLineDetails.length - 3} more added lines`);
                }
            }

            if (removedLines > 0) {
                report.insights.push(`Removed ${removedLines} line(s)`);

                // Add detailed insights about removed lines
                removedLineDetails.slice(0, 3).forEach(detail => {
                    const previewContent = truncateWithEllipsis(detail.content, 50);
                    report.insights.push(`Line ${detail.lineNumber}: Removed "${previewContent}"`);
                });

                if (removedLineDetails.length > 3) {
                    report.insights.push(`... and ${removedLineDetails.length - 3} more removed lines`);
                }
            }

            if (modifiedLineCount > 0) {
                report.insights.push(`Modified ${modifiedLineCount} line(s)`);

                // Add detailed insights about modified lines
                modifiedLineDetails.slice(0, 3).forEach(detail => {
                    report.insights.push(`Line ${detail.lineNumber}: Changed from "${truncateWithEllipsis(detail.original, 30)}" to "${truncateWithEllipsis(detail.modified, 30)}"`);

                    // Add word-level changes if available
                    if (detail.wordChanges && detail.wordChanges.length > 0) {
                        detail.wordChanges.slice(0, 2).forEach(change => {
                            if (change.type === 'added') {
                                report.insights.push(`  • Added "${change.value}"`);
                            } else if (change.type === 'removed') {
                                report.insights.push(`  • Removed "${change.value}"`);
                            } else if (change.type === 'modified') {
                                report.insights.push(`  • Changed "${change.original}" to "${change.modified}"`);
                            }
                        });

                        if (detail.wordChanges.length > 2) {
                            report.insights.push(`  • ... and ${detail.wordChanges.length - 2} more word changes`);
                        }
                    }
                });

                if (modifiedLineDetails.length > 3) {
                    report.insights.push(`... and ${modifiedLineDetails.length - 3} more modified lines`);
                }
            }

            // Check for specific patterns
            const originalText = original.toLowerCase();
            const modifiedText = modified.toLowerCase();

            // Look for common patterns in the text
            identifyCommonPatterns(originalText, modifiedText, report);

            // Generate summary
            if (addedLines === 0 && removedLines === 0 && modifiedLineCount === 0) {
                report.summary = 'No significant differences found.';
            } else {
                report.summary = `Found ${addedLines + removedLines + modifiedLineCount} change(s): ${addedLines} addition(s), ${removedLines} removal(s), and ${modifiedLineCount} modification(s).`;

                // Add a more descriptive summary if there are modifications
                if (modifiedLineCount > 0) {
                    const sample = modifiedLineDetails[0];
                    report.summary += ` For example, line ${sample.lineNumber} was changed from "${truncateWithEllipsis(sample.original, 20)}" to "${truncateWithEllipsis(sample.modified, 20)}".`;
                }
            }

            return report;
        } catch (err) {
            console.error("Text analysis error:", err);
            report.summary = "Error analyzing text: " + err.message;
            return report;
        }
    };

    // Helper function to identify word-level changes
    const identifyWordChanges = (original, modified) => {
        if (!original || !modified) return [];

        const originalWords = original.split(/\s+/);
        const modifiedWords = modified.split(/\s+/);
        const changes = [];

        // Simple word-level diff
        let i = 0, j = 0;
        while (i < originalWords.length || j < modifiedWords.length) {
            if (i >= originalWords.length) {
                // Added words
                changes.push({ type: 'added', value: modifiedWords[j] });
                j++;
            } else if (j >= modifiedWords.length) {
                // Removed words
                changes.push({ type: 'removed', value: originalWords[i] });
                i++;
            } else if (originalWords[i] !== modifiedWords[j]) {
                // Modified words
                // Simple heuristic: if lengths are similar, consider it a modification
                if (Math.abs(originalWords[i].length - modifiedWords[j].length) < 3) {
                    changes.push({
                        type: 'modified',
                        original: originalWords[i],
                        modified: modifiedWords[j]
                    });
                } else {
                    changes.push({ type: 'removed', value: originalWords[i] });
                    changes.push({ type: 'added', value: modifiedWords[j] });
                }
                i++;
                j++;
            } else {
                // Unchanged words
                i++;
                j++;
            }
        }

        return changes;
    };

    // Helper function to identify common text patterns
    const identifyCommonPatterns = (originalText, modifiedText, report) => {
        // Check for error references
        if (originalText.includes('error') && !modifiedText.includes('error')) {
            report.insights.push('Error references have been removed');
        }

        if (!originalText.includes('error') && modifiedText.includes('error')) {
            report.insights.push('Error references have been added');
        }

        // Check for URL changes
        const originalUrls = extractUrls(originalText);
        const modifiedUrls = extractUrls(modifiedText);

        const addedUrls = modifiedUrls.filter(url => !originalUrls.includes(url));
        const removedUrls = originalUrls.filter(url => !modifiedUrls.includes(url));

        if (addedUrls.length > 0) {
            report.insights.push(`Added ${addedUrls.length} URL(s): ${addedUrls.join(', ')}`);
        }

        if (removedUrls.length > 0) {
            report.insights.push(`Removed ${removedUrls.length} URL(s): ${removedUrls.join(', ')}`);
        }

        // Check for number changes
        const originalNumbers = extractNumbers(originalText);
        const modifiedNumbers = extractNumbers(modifiedText);

        if (originalNumbers.length > 0 && modifiedNumbers.length > 0) {
            const changedNumbers = compareNumbers(originalNumbers, modifiedNumbers);
            if (changedNumbers.length > 0) {
                changedNumbers.slice(0, 3).forEach(change => {
                    report.insights.push(`Number changed from ${change.original} to ${change.modified}`);
                });

                if (changedNumbers.length > 3) {
                    report.insights.push(`... and ${changedNumbers.length - 3} more number changes`);
                }
            }
        }
    };

    // Helper function to extract URLs from text
    const extractUrls = (text) => {
        const urlPattern = /https?:\/\/[^\s]+/g;
        return text.match(urlPattern) || [];
    };

    // Helper function to extract numbers from text
    const extractNumbers = (text) => {
        const numberPattern = /\b\d+(?:\.\d+)?\b/g;
        return text.match(numberPattern) || [];
    };

    // Helper function to compare numbers
    const compareNumbers = (originalNumbers, modifiedNumbers) => {
        const changes = [];
        const minLength = Math.min(originalNumbers.length, modifiedNumbers.length);

        for (let i = 0; i < minLength; i++) {
            if (originalNumbers[i] !== modifiedNumbers[i]) {
                changes.push({
                    original: originalNumbers[i],
                    modified: modifiedNumbers[i]
                });
            }
        }

        return changes;
    };

    // Helper function to truncate text with ellipsis
    const truncateWithEllipsis = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const analyzeJsonDifferences = (original, modified, report) => {
        try {
            const originalObj = JSON.parse(original);
            const modifiedObj = JSON.parse(modified);

            // Track different types of changes
            const addedKeys = [];
            const removedKeys = [];
            const modifiedKeys = [];
            const structuralChanges = [];
            const valueChanges = []; // Track actual value changes

            // Compare objects recursively
            compareJsonObjects(originalObj, modifiedObj, '', addedKeys, removedKeys, modifiedKeys, structuralChanges, valueChanges);

            // Generate insights
            if (addedKeys.length > 0) {
                report.insights.push(`Added ${addedKeys.length} property/properties: ${addedKeys.slice(0, 3).join(', ')}${addedKeys.length > 3 ? '...' : ''}`);

                // Add detailed insights about added properties
                addedKeys.slice(0, 3).forEach(key => {
                    const value = getValueByPath(modifiedObj, key);
                    const valueStr = truncateWithEllipsis(JSON.stringify(value), 40);
                    report.insights.push(`Added property "${key}" with value: ${valueStr}`);
                });
            }

            if (removedKeys.length > 0) {
                report.insights.push(`Removed ${removedKeys.length} property/properties: ${removedKeys.slice(0, 3).join(', ')}${removedKeys.length > 3 ? '...' : ''}`);

                // Add detailed insights about removed properties
                removedKeys.slice(0, 3).forEach(key => {
                    const value = getValueByPath(originalObj, key);
                    const valueStr = truncateWithEllipsis(JSON.stringify(value), 40);
                    report.insights.push(`Removed property "${key}" with value: ${valueStr}`);
                });
            }

            if (valueChanges.length > 0) {
                report.insights.push(`Modified ${valueChanges.length} value(s)`);

                // Add detailed insights about value changes
                valueChanges.slice(0, 3).forEach(change => {
                    report.insights.push(`Property "${change.path}" changed from ${truncateWithEllipsis(JSON.stringify(change.oldValue), 30)} to ${truncateWithEllipsis(JSON.stringify(change.newValue), 30)}`);

                    // Add specific analysis for number changes
                    if (typeof change.oldValue === 'number' && typeof change.newValue === 'number') {
                        const diff = change.newValue - change.oldValue;
                        const percentChange = ((diff / Math.abs(change.oldValue)) * 100).toFixed(2);
                        if (!isNaN(percentChange)) {
                            report.insights.push(`  • Numeric value ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)} (${Math.abs(percentChange)}%)`);
                        }
                    }
                });

                if (valueChanges.length > 3) {
                    report.insights.push(`... and ${valueChanges.length - 3} more value changes`);
                }
            }

            if (structuralChanges.length > 0) {
                report.insights.push(`Structural changes detected in: ${structuralChanges.slice(0, 3).join(', ')}${structuralChanges.length > 3 ? '...' : ''}`);

                // Add detailed insights about structural changes
                structuralChanges.slice(0, 3).forEach(path => {
                    const originalType = getTypeByPath(originalObj, path);
                    const modifiedType = getTypeByPath(modifiedObj, path);
                    report.insights.push(`Type of "${path}" changed from ${originalType} to ${modifiedType}`);
                });
            }

            // Summary
            const totalChanges = addedKeys.length + removedKeys.length + valueChanges.length + structuralChanges.length;
            if (totalChanges === 0) {
                report.summary = 'No differences found in the JSON structure.';
            } else {
                report.summary = `Found ${totalChanges} change(s) in the JSON structure: ${addedKeys.length} added, ${removedKeys.length} removed, ${valueChanges.length} modified values, and ${structuralChanges.length} structural changes.`;

                // Add a more descriptive summary for the first significant change
                if (valueChanges.length > 0) {
                    const firstChange = valueChanges[0];
                    report.summary += ` For example, "${firstChange.path}" changed from ${truncateWithEllipsis(JSON.stringify(firstChange.oldValue), 20)} to ${truncateWithEllipsis(JSON.stringify(firstChange.newValue), 20)}.`;
                } else if (addedKeys.length > 0) {
                    report.summary += ` For example, property "${addedKeys[0]}" was added.`;
                } else if (removedKeys.length > 0) {
                    report.summary += ` For example, property "${removedKeys[0]}" was removed.`;
                }
            }

        } catch (e) {
            report.summary = `Invalid JSON format: ${e.message}`;
            report.insights.push('Ensure both inputs are valid JSON objects');
        }

        return report;
    };

    // Helper function to get value by path from an object
    const getValueByPath = (obj, path) => {
        if (!path) return obj;

        const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
        let current = obj;

        for (const part of parts) {
            if (part === 'root') continue;
            if (current === null || current === undefined) return undefined;
            current = current[part];
        }

        return current;
    };

    // Helper function to get type by path from an object
    const getTypeByPath = (obj, path) => {
        const value = getValueByPath(obj, path);
        if (value === null) return 'null';
        if (Array.isArray(value)) return 'array';
        return typeof value;
    };

    const compareJsonObjects = (obj1, obj2, path, addedKeys, removedKeys, modifiedKeys, structuralChanges, valueChanges) => {
        // Handle null cases
        if (obj1 === null || obj2 === null) {
            if (obj1 !== obj2) {
                modifiedKeys.push(path || 'root');
                valueChanges.push({
                    path: path || 'root',
                    oldValue: obj1,
                    newValue: obj2
                });
            }
            return;
        }

        // Handle different types
        if (typeof obj1 !== typeof obj2) {
            structuralChanges.push(path || 'root');
            return;
        }

        // If not objects, compare values
        if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
            if (obj1 !== obj2) {
                modifiedKeys.push(path || 'root');
                valueChanges.push({
                    path: path || 'root',
                    oldValue: obj1,
                    newValue: obj2
                });
            }
            return;
        }

        // For arrays, check length and elements
        if (Array.isArray(obj1) && Array.isArray(obj2)) {
            if (obj1.length !== obj2.length) {
                structuralChanges.push(path || 'root');
            }

            const maxLength = Math.max(obj1.length, obj2.length);
            for (let i = 0; i < maxLength; i++) {
                const newPath = path ? `${path}[${i}]` : `[${i}]`;
                if (i >= obj1.length) {
                    addedKeys.push(newPath);
                } else if (i >= obj2.length) {
                    removedKeys.push(newPath);
                } else {
                    compareJsonObjects(obj1[i], obj2[i], newPath, addedKeys, removedKeys, modifiedKeys, structuralChanges, valueChanges);
                }
            }
            return;
        }

        // For objects, compare keys
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        // Find added keys
        keys2.forEach(key => {
            if (!keys1.includes(key)) {
                const newPath = path ? `${path}.${key}` : key;
                addedKeys.push(newPath);
            }
        });

        // Find removed keys
        keys1.forEach(key => {
            if (!keys2.includes(key)) {
                const newPath = path ? `${path}.${key}` : key;
                removedKeys.push(newPath);
            }
        });

        // Compare common keys
        keys1.forEach(key => {
            if (keys2.includes(key)) {
                const newPath = path ? `${path}.${key}` : key;
                compareJsonObjects(obj1[key], obj2[key], newPath, addedKeys, removedKeys, modifiedKeys, structuralChanges, valueChanges);
            }
        });
    };

    const analyzeCsvDifferences = (original, modified, report) => {
        const originalRows = original.split('\n').filter(row => row.trim());
        const modifiedRows = modified.split('\n').filter(row => row.trim());

        // Get headers
        const originalHeaders = originalRows.length > 0 ? originalRows[0].split(',').map(h => h.trim()) : [];
        const modifiedHeaders = modifiedRows.length > 0 ? modifiedRows[0].split(',').map(h => h.trim()) : [];

        // Count changes
        const addedHeaders = modifiedHeaders.filter(h => !originalHeaders.includes(h));
        const removedHeaders = originalHeaders.filter(h => !modifiedHeaders.includes(h));

        // Row count changes
        const rowDiff = modifiedRows.length - originalRows.length;

        // Track cell-level changes
        const cellChanges = [];

        // Generate insights
        if (addedHeaders.length > 0) {
            report.insights.push(`Added ${addedHeaders.length} column(s): ${addedHeaders.join(', ')}`);
        }

        if (removedHeaders.length > 0) {
            report.insights.push(`Removed ${removedHeaders.length} column(s): ${removedHeaders.join(', ')}`);
        }

        if (rowDiff > 0) {
            report.insights.push(`Added ${rowDiff} row(s)`);

            // Show examples of added rows
            if (modifiedRows.length > originalRows.length) {
                const addedRowsStart = originalRows.length;
                const addedRowsEnd = Math.min(modifiedRows.length, addedRowsStart + 3);

                for (let i = addedRowsStart; i < addedRowsEnd; i++) {
                    report.insights.push(`Added row ${i + 1}: "${truncateWithEllipsis(modifiedRows[i], 50)}"`);
                }

                if (modifiedRows.length > addedRowsEnd) {
                    report.insights.push(`... and ${modifiedRows.length - addedRowsEnd} more added rows`);
                }
            }
        } else if (rowDiff < 0) {
            report.insights.push(`Removed ${Math.abs(rowDiff)} row(s)`);

            // Show examples of removed rows
            if (originalRows.length > modifiedRows.length) {
                const removedRowsStart = modifiedRows.length;
                const removedRowsEnd = Math.min(originalRows.length, removedRowsStart + 3);

                for (let i = removedRowsStart; i < removedRowsEnd; i++) {
                    report.insights.push(`Removed row ${i + 1}: "${truncateWithEllipsis(originalRows[i], 50)}"`);
                }

                if (originalRows.length > removedRowsEnd) {
                    report.insights.push(`... and ${originalRows.length - removedRowsEnd} more removed rows`);
                }
            }
        }

        // Check for data changes in existing columns and rows
        const commonHeaders = originalHeaders.filter(h => modifiedHeaders.includes(h));
        if (commonHeaders.length > 0 && originalRows.length > 1 && modifiedRows.length > 1) {
            let changedCells = 0;
            const minRows = Math.min(originalRows.length, modifiedRows.length);

            for (let i = 1; i < minRows; i++) { // Start from 1 to skip header
                const origCells = originalRows[i].split(',').map(c => c.trim());
                const modCells = modifiedRows[i].split(',').map(c => c.trim());

                for (let j = 0; j < commonHeaders.length; j++) {
                    const headerIndex1 = originalHeaders.indexOf(commonHeaders[j]);
                    const headerIndex2 = modifiedHeaders.indexOf(commonHeaders[j]);

                    if (headerIndex1 !== -1 && headerIndex2 !== -1 &&
                        origCells[headerIndex1] !== modCells[headerIndex2]) {
                        changedCells++;

                        cellChanges.push({
                            row: i + 1,
                            column: commonHeaders[j],
                            oldValue: origCells[headerIndex1],
                            newValue: modCells[headerIndex2]
                        });
                    }
                }
            }

            if (changedCells > 0) {
                report.insights.push(`Modified ${changedCells} cell value(s) in existing rows`);

                // Show examples of changed cells
                cellChanges.slice(0, 3).forEach(change => {
                    report.insights.push(`Changed cell at row ${change.row}, column "${change.column}" from "${change.oldValue}" to "${change.newValue}"`);
                });

                if (cellChanges.length > 3) {
                    report.insights.push(`... and ${cellChanges.length - 3} more cell changes`);
                }
            }
        }

        // Generate summary
        if (report.insights.length === 0) {
            report.summary = 'No significant differences found in CSV data.';
        } else {
            const totalChanges = addedHeaders.length + removedHeaders.length + Math.abs(rowDiff) + cellChanges.length;
            report.summary = `Found ${totalChanges} change(s) in the CSV data: ${addedHeaders.length} added column(s), ${removedHeaders.length} removed column(s), ${Math.abs(rowDiff) > 0 ? (rowDiff > 0 ? rowDiff + ' added' : Math.abs(rowDiff) + ' removed') + ' row(s)' : '0 row changes'}, and ${cellChanges.length} modified cell(s).`;

            // Add a more descriptive summary for the first significant change
            if (cellChanges.length > 0) {
                const firstChange = cellChanges[0];
                report.summary += ` For example, at row ${firstChange.row}, column "${firstChange.column}" changed from "${firstChange.oldValue}" to "${firstChange.newValue}".`;
            }
        }

        return report;
    };

    // Enhanced report generation with more AI insights
    const generateComparisonReport = (report) => {
        try {
            let reportHtml = '<div class="ai-report-content">';

            // Add executive summary if available
            if (report.executiveSummary) {
                reportHtml += `<div class="ai-insight executive-summary">
                    <h4><i class="fas fa-chart-line"></i> Executive Summary</h4>
                    <p>${report.executiveSummary}</p>
                    <div class="impact-indicator ${report.impact}-impact">
                        <span>Impact: <strong>${report.impact.toUpperCase()}</strong></span>
                        <span>Complexity: <strong>${report.complexity.toUpperCase()}</strong></span>
                    </div>
                </div>`;
            }

            reportHtml += `<h3><i class="fas fa-brain"></i> AI Analysis</h3>`;
            reportHtml += `<p class="summary">${report.summary || 'Analysis failed'}</p>`;

            // Show semantic insights if available
            if (report.semanticChanges && report.semanticChanges.length > 0) {
                reportHtml += '<div class="ai-insight semantic-changes">';
                reportHtml += '<h4><i class="fas fa-lightbulb"></i> Semantic Insights</h4>';
                reportHtml += '<ul>';

                // Group by type for better organization
                const semanticByType = {};
                report.semanticChanges.forEach(change => {
                    if (!semanticByType[change.type]) {
                        semanticByType[change.type] = [];
                    }
                    semanticByType[change.type].push(change);
                });

                Object.keys(semanticByType).forEach(type => {
                    reportHtml += `<li><strong>${type.replace('-', ' ').toUpperCase()}</strong>: `;
                    semanticByType[type].forEach((change, i) => {
                        if (i > 0) reportHtml += '; ';
                        if (change.action) {
                            reportHtml += `${change.action} `;
                        }
                        if (change.description) {
                            reportHtml += change.description;
                        } else if (change.from && change.to) {
                            reportHtml += `changed from ${change.from} to ${change.to}`;
                        } else if (change.items) {
                            reportHtml += change.items.slice(0, 2).join(', ');
                            if (change.items.length > 2) {
                                reportHtml += ` and ${change.items.length - 2} more`;
                            }
                        }
                    });
                    reportHtml += '</li>';
                });

                reportHtml += '</ul>';
                reportHtml += '</div>';
            }

            if (report.insights && report.insights.length > 0) {
                reportHtml += '<h4><i class="fas fa-list"></i> Detailed Findings</h4>';
                reportHtml += '<ul class="insights-list">';

                // Group insights by type for better organization
                const groupedInsights = groupInsights(report.insights);

                Object.keys(groupedInsights).forEach(group => {
                    reportHtml += `<li class="insight-group"><strong>${group}</strong>`;
                    reportHtml += '<ul class="sub-insights">';

                    groupedInsights[group].forEach(insight => {
                        // Add indentation for nested insights
                        if (insight.startsWith('  •')) {
                            reportHtml += `<li class="nested-insight">${insight.substring(3)}</li>`;
                        } else {
                            reportHtml += `<li>${insight}</li>`;
                        }
                    });

                    reportHtml += '</ul></li>';
                });

                reportHtml += '</ul>';
            }

            // Add recommendations based on the analysis
            reportHtml += generateRecommendations(report);

            reportHtml += '</div>';
            return reportHtml;
        } catch (err) {
            console.error("Error generating report:", err);
            return '<div class="error">Error generating report</div>';
        }
    };

    // Generate AI-powered recommendations
    const generateRecommendations = (report) => {
        if (!report.insights || report.insights.length === 0) {
            return '';
        }

        let html = '<div class="ai-recommendations">';
        html += '<h4><i class="fas fa-magic"></i> AI Recommendations</h4>';
        html += '<ul>';

        // Generate recommendations based on the type of changes
        const hasSecurityChanges = report.semanticChanges &&
            report.semanticChanges.some(c => c.type === 'security');

        const hasApiChanges = report.semanticChanges &&
            report.semanticChanges.some(c => c.type === 'api');

        const hasVersionChanges = report.semanticChanges &&
            report.semanticChanges.some(c => c.type === 'versioning');

        const hasCodeStructureChanges = report.semanticChanges &&
            report.semanticChanges.some(c => c.type === 'code-structure');

        if (hasSecurityChanges) {
            html += '<li>Review security-related changes carefully for potential vulnerabilities</li>';
        }

        if (hasApiChanges) {
            html += '<li>Test API endpoints to ensure they still function correctly</li>';
        }

        if (hasVersionChanges) {
            html += '<li>Update documentation to reflect version changes</li>';
        }

        if (hasCodeStructureChanges) {
            html += '<li>Consider additional unit tests for modified code structures</li>';
        }

        // Add general recommendations based on impact and complexity
        if (report.impact === 'high') {
            html += '<li>Schedule a dedicated review session for these high-impact changes</li>';
        }

        if (report.complexity === 'high') {
            html += '<li>Break down complex changes into smaller, more manageable units for review</li>';
        }

        // Format-specific recommendations
        if (report.format === 'json') {
            html += '<li>Validate JSON structure against schema if available</li>';
        } else if (report.format === 'csv') {
            html += '<li>Ensure data integrity by checking row and column counts match expectations</li>';
        }

        html += '</ul>';
        html += '</div>';

        return html;
    };

    // Helper function to group insights by type
    const groupInsights = (insights) => {
        const groups = {
            'Added Content': [],
            'Removed Content': [],
            'Modified Content': [],
            'Structural Changes': [],
            'Other Changes': []
        };

        insights.forEach(insight => {
            if (insight.toLowerCase().includes('added')) {
                groups['Added Content'].push(insight);
            } else if (insight.toLowerCase().includes('removed')) {
                groups['Removed Content'].push(insight);
            } else if (insight.toLowerCase().includes('modified') || insight.toLowerCase().includes('changed')) {
                groups['Modified Content'].push(insight);
            } else if (insight.toLowerCase().includes('structural')) {
                groups['Structural Changes'].push(insight);
            } else {
                groups['Other Changes'].push(insight);
            }
        });

        // Remove empty groups
        Object.keys(groups).forEach(key => {
            if (groups[key].length === 0) {
                delete groups[key];
            }
        });

        return groups;
    };

    // Add semantic analysis to identify meaningful changes
    const analyzeSemanticChanges = (original, modified, report) => {
        try {
            // Detect significant semantic patterns
            const semanticPatterns = [
                { pattern: /password|credential|token|key|secret/i, type: 'security', impact: 'high' },
                { pattern: /error|exception|failure|warning/i, type: 'reliability', impact: 'medium' },
                { pattern: /version|v\d+\.\d+\.\d+/i, type: 'versioning', impact: 'medium' },
                { pattern: /\b(https?:\/\/|www\.)[^\s<>"']+/g, type: 'link', impact: 'medium' },
                { pattern: /api|endpoint|url|uri/i, type: 'api', impact: 'high' },
                { pattern: /copyright|\(c\)|\d{4}-\d{4}|all rights reserved/i, type: 'legal', impact: 'low' },
                { pattern: /deprecated|obsolete|removed/i, type: 'deprecation', impact: 'high' },
                { pattern: /TODO|FIXME|HACK|NOTE|XXX/i, type: 'development', impact: 'low' },
                { pattern: /(\d{1,3}\.){3}\d{1,3}/g, type: 'ip-address', impact: 'medium' },
                { pattern: /null|undefined|NaN/i, type: 'code-quality', impact: 'medium' }
            ];

            // Check for patterns in the changes
            semanticPatterns.forEach(patternObj => {
                const originalMatches = original.match(patternObj.pattern) || [];
                const modifiedMatches = modified.match(patternObj.pattern) || [];

                // Find added patterns
                const addedMatches = modifiedMatches.filter(m => !originalMatches.includes(m));
                // Find removed patterns
                const removedMatches = originalMatches.filter(m => !modifiedMatches.includes(m));

                if (addedMatches.length > 0) {
                    report.semanticChanges.push({
                        type: patternObj.type,
                        action: 'added',
                        items: addedMatches,
                        impact: patternObj.impact
                    });

                    // Add to insights
                    if (addedMatches.length <= 3) {
                        report.insights.push(`Added ${patternObj.type}: ${addedMatches.join(', ')}`);
                    } else {
                        report.insights.push(`Added ${addedMatches.length} ${patternObj.type} items`);
                    }
                }

                if (removedMatches.length > 0) {
                    report.semanticChanges.push({
                        type: patternObj.type,
                        action: 'removed',
                        items: removedMatches,
                        impact: patternObj.impact
                    });

                    // Add to insights
                    if (removedMatches.length <= 3) {
                        report.insights.push(`Removed ${patternObj.type}: ${removedMatches.join(', ')}`);
                    } else {
                        report.insights.push(`Removed ${removedMatches.length} ${patternObj.type} items`);
                    }
                }
            });

            // Detect language changes (natural language sentiment)
            const sentimentChanges = detectSentimentChanges(original, modified);
            if (sentimentChanges) {
                report.semanticChanges.push(sentimentChanges);
                report.insights.push(`Language tone changed from ${sentimentChanges.from} to ${sentimentChanges.to}`);
            }

            // Detect code structure changes if applicable
            if (report.format === 'json' || /function|class|if\s*\(|for\s*\(|while\s*\(/i.test(original) ||
                /function|class|if\s*\(|for\s*\(|while\s*\(/i.test(modified)) {
                const codeChanges = detectCodeStructureChanges(original, modified);
                if (codeChanges.length > 0) {
                    report.semanticChanges.push(...codeChanges);
                    codeChanges.forEach(change => {
                        report.insights.push(`Code ${change.action}: ${change.description}`);
                    });
                }
            }
        } catch (e) {
            console.error("Semantic analysis error:", e);
            // Don't fail the entire analysis if semantic analysis fails
        }
    };

    // Detect changes in language sentiment/tone
    const detectSentimentChanges = (original, modified) => {
        // Simple sentiment analysis based on keywords
        const positiveWords = /good|great|excellent|awesome|nice|improve|better|enhancement|success|happy|resolve|fix|solved/gi;
        const negativeWords = /bad|poor|terrible|awful|bug|error|issue|problem|fail|crash|wrong|broken|worse/gi;
        const technicalWords = /function|method|class|property|variable|parameter|return|value|object|array|string|number|boolean/gi;

        const originalPositive = (original.match(positiveWords) || []).length;
        const originalNegative = (original.match(negativeWords) || []).length;
        const originalTechnical = (original.match(technicalWords) || []).length;

        const modifiedPositive = (modified.match(positiveWords) || []).length;
        const modifiedNegative = (modified.match(negativeWords) || []).length;
        const modifiedTechnical = (modified.match(technicalWords) || []).length;

        // Determine overall sentiment
        let originalTone = 'neutral';
        if (originalPositive > originalNegative * 1.5) originalTone = 'positive';
        else if (originalNegative > originalPositive * 1.5) originalTone = 'negative';
        if (originalTechnical > (originalPositive + originalNegative) * 2) originalTone = 'technical';

        let modifiedTone = 'neutral';
        if (modifiedPositive > modifiedNegative * 1.5) modifiedTone = 'positive';
        else if (modifiedNegative > modifiedPositive * 1.5) modifiedTone = 'negative';
        if (modifiedTechnical > (modifiedPositive + modifiedNegative) * 2) modifiedTone = 'technical';

        // Only report if there's a significant change
        if (originalTone !== modifiedTone) {
            return {
                type: 'sentiment',
                from: originalTone,
                to: modifiedTone,
                impact: 'medium'
            };
        }

        return null;
    };

    // Detect code structure changes
    const detectCodeStructureChanges = (original, modified) => {
        const changes = [];

        // Function signature changes
        const originalFunctions = original.match(/function\s+(\w+)\s*\([^)]*\)/g) || [];
        const modifiedFunctions = modified.match(/function\s+(\w+)\s*\([^)]*\)/g) || [];

        // Added/removed functions
        const addedFunctions = modifiedFunctions.filter(f => !originalFunctions.includes(f));
        const removedFunctions = originalFunctions.filter(f => !modifiedFunctions.includes(f));

        if (addedFunctions.length > 0) {
            changes.push({
                type: 'code-structure',
                action: 'added',
                description: `${addedFunctions.length} function(s)`,
                items: addedFunctions,
                impact: 'high'
            });
        }

        if (removedFunctions.length > 0) {
            changes.push({
                type: 'code-structure',
                action: 'removed',
                description: `${removedFunctions.length} function(s)`,
                items: removedFunctions,
                impact: 'high'
            });
        }

        // Conditional statements changes
        const originalConditions = (original.match(/if\s*\([^)]+\)/g) || []).length;
        const modifiedConditions = (modified.match(/if\s*\([^)]+\)/g) || []).length;

        if (Math.abs(originalConditions - modifiedConditions) > 1) {
            changes.push({
                type: 'code-structure',
                action: originalConditions < modifiedConditions ? 'added' : 'removed',
                description: `${Math.abs(originalConditions - modifiedConditions)} conditional statement(s)`,
                impact: 'medium'
            });
        }

        // Loop changes
        const originalLoops = (original.match(/for\s*\([^)]+\)|while\s*\([^)]+\)/g) || []).length;
        const modifiedLoops = (modified.match(/for\s*\([^)]+\)|while\s*\([^)]+\)/g) || []).length;

        if (Math.abs(originalLoops - modifiedLoops) > 0) {
            changes.push({
                type: 'code-structure',
                action: originalLoops < modifiedLoops ? 'added' : 'removed',
                description: `${Math.abs(originalLoops - modifiedLoops)} loop(s)`,
                impact: 'medium'
            });
        }

        return changes;
    };

    // Analyze the overall impact and complexity of changes
    const analyzeImpactAndComplexity = (report) => {
        // Set default values
        let impact = 'low';
        let complexity = 'low';

        // Calculate impact based on semantic changes
        if (report.semanticChanges && report.semanticChanges.length > 0) {
            const highImpactChanges = report.semanticChanges.filter(c => c.impact === 'high').length;
            const mediumImpactChanges = report.semanticChanges.filter(c => c.impact === 'medium').length;

            if (highImpactChanges > 0) {
                impact = 'high';
            } else if (mediumImpactChanges > 1) {
                impact = 'medium';
            }
        }

        // Calculate complexity based on number and types of changes
        const totalChanges = report.insights ? report.insights.length : 0;

        if (totalChanges > 15) {
            complexity = 'high';
        } else if (totalChanges > 5) {
            complexity = 'medium';
        }

        // Update the report
        report.impact = impact;
        report.complexity = complexity;

        // Add an executive summary based on impact and complexity
        if (impact === 'high' && complexity === 'high') {
            report.executiveSummary = 'Major changes detected with significant impact. Careful review recommended.';
        } else if (impact === 'high') {
            report.executiveSummary = 'High-impact changes detected that may affect functionality.';
        } else if (complexity === 'high') {
            report.executiveSummary = 'Complex changes detected across multiple areas.';
        } else if (impact === 'medium' && complexity === 'medium') {
            report.executiveSummary = 'Moderate changes with potential functional impact.';
        } else {
            report.executiveSummary = 'Minor changes with limited impact detected.';
        }
    };

    return {
        analyzeDifferences,
        generateComparisonReport,
    };
})();

// Make aiAnalysis globally available
window.aiAnalysis = aiAnalysis;