const uiController = (() => {
    // Get DOM elements
    const inputText1 = document.getElementById('input1');
    const inputText2 = document.getElementById('input2');
    const compareButton = document.getElementById('compare-btn');
    const diffOverlay1 = document.getElementById('diff-overlay-1');
    const diffOverlay2 = document.getElementById('diff-overlay-2');
    const aiReportContainer = document.getElementById('ai-report');
    const formatSelect = document.getElementById('format-select');
    const toggleUnchanged = document.getElementById('toggle-unchanged');
    const clearButton = document.getElementById('clear-btn');

    let showUnchanged = true;
    let currentDiffResult = null;
    let isComparing = false;

    // Add variables to store original text
    let originalText1 = '';
    let originalText2 = '';
    let originalFormat = '';

    // Add variable to track editing state and throttle events
    let isEditing = false;
    let scrollSyncTimeout = null;
    let lastScrollTime = 0;

    // Helper function to escape HTML
    const escapeHtml = (unsafe) => {
        if (unsafe === undefined || unsafe === null) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // Optimized scroll sync with throttling
    const syncScroll = (source) => {
        if (isComparing || isEditing) return; // Don't sync during comparison or active editing

        // Throttle scroll syncing to improve performance
        const now = Date.now();
        if (now - lastScrollTime < 16) { // Approx 60fps (1000ms/60 ≈ 16ms)
            clearTimeout(scrollSyncTimeout);
            scrollSyncTimeout = setTimeout(() => {
                syncScrollImmediate(source);
            }, 16);
            return;
        }

        lastScrollTime = now;
        syncScrollImmediate(source);
    };

    // Immediate scroll sync (used by throttled version)
    const syncScrollImmediate = (source) => {
        const scrollTop = source.scrollTop;

        if (source === inputText1) {
            if (inputText2) inputText2.scrollTop = scrollTop;
            if (diffOverlay1) diffOverlay1.scrollTop = scrollTop;
            if (diffOverlay2) diffOverlay2.scrollTop = scrollTop;
        } else if (source === inputText2) {
            if (inputText1) inputText1.scrollTop = scrollTop;
            if (diffOverlay1) diffOverlay1.scrollTop = scrollTop;
            if (diffOverlay2) diffOverlay2.scrollTop = scrollTop;
        }
    };

    // Show loading indicator
    const showLoading = (element) => {
        if (!element) return;
        element.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Analyzing...</p>
            </div>
        `;
    };

    // Enhanced text diff - removed options for ignoring whitespace and case
    const getTextDiff = (text1, text2) => {
        const lines1 = text1.split('\n');
        const lines2 = text2.split('\n');
        const result = [];
        const maxLines = Math.max(lines1.length, lines2.length);

        for (let i = 0; i < maxLines; i++) {
            const line1 = lines1[i] || '';
            const line2 = lines2[i] || '';

            if (i >= lines1.length) {
                // Line only exists in second text
                result.push({
                    type: 'added',
                    line1: '',
                    line2: line2,
                    lineNumber: i + 1
                });
            } else if (i >= lines2.length) {
                // Line only exists in first text
                result.push({
                    type: 'removed',
                    line1: line1,
                    line2: '',
                    lineNumber: i + 1
                });
            } else if (line1 !== line2) {
                // Lines are different - this is a real change
                result.push({
                    type: 'changed',
                    line1: line1,
                    line2: line2,
                    lineNumber: i + 1
                });
            } else {
                // Lines are identical - don't highlight
                result.push({
                    type: 'unchanged',
                    line1: line1,
                    line2: line2,
                    lineNumber: i + 1
                });
            }
        }

        return result;
    };

    // Enhanced JSON diff with ignore options
    const getJsonDiff = (json1, json2) => {
        try {
            let obj1 = JSON.parse(json1);
            let obj2 = JSON.parse(json2);

            // Create formatted strings
            let formatted1 = JSON.stringify(obj1, null, 2);
            let formatted2 = JSON.stringify(obj2, null, 2);

            // Use text diff with the formatted JSON
            return getTextDiff(formatted1, formatted2);
        } catch (e) {
            console.error("JSON parsing error:", e);
            return [{ type: 'error', message: `JSON parsing error: ${e.message}` }];
        }
    };

    // Enhanced CSV diff with ignore options
    const getCsvDiff = (csv1, csv2) => {
        // CSV is just text with a specific format
        return getTextDiff(csv1, csv2);
    };

    // Enhanced XML diff with ignore options
    const getXmlDiff = (xml1, xml2) => {
        try {
            const formattedXml1 = formatXmlForComparison(xml1);
            const formattedXml2 = formatXmlForComparison(xml2);

            // Use text diff with the formatted XML
            return getTextDiff(formattedXml1, formattedXml2);
        } catch (e) {
            console.error("XML parsing error:", e);
            return [{ type: 'error', message: `XML processing error: ${e.message}` }];
        }
    };

    // Highlight differences with proper line mapping
    const highlightDifferencesInInputs = (diffResult) => {
        if (!diffOverlay1 || !diffOverlay2) {
            console.error("Diff overlay elements not found");
            return;
        }

        isComparing = true;

        // Clear previous highlights
        diffOverlay1.innerHTML = '';
        diffOverlay2.innerHTML = '';

        let addedCount = 0;
        let removedCount = 0;
        let changedCount = 0;
        let firstDiffLine = -1;

        // Count only actual changes
        diffResult.forEach((diff, index) => {
            if (diff.type === 'added') {
                addedCount++;
                if (firstDiffLine === -1) firstDiffLine = index;
            } else if (diff.type === 'removed') {
                removedCount++;
                if (firstDiffLine === -1) firstDiffLine = index;
            } else if (diff.type === 'changed') {
                changedCount++;
                if (firstDiffLine === -1) firstDiffLine = index;
            }
        });

        // Only proceed if there are actual differences
        if (addedCount > 0 || removedCount > 0 || changedCount > 0) {
            const { leftLines, rightLines } = createLineHighlights(diffResult);

            // Update overlays with proper line structure
            diffOverlay1.innerHTML = `<div class="diff-lines">${leftLines.join('')}</div>`;
            diffOverlay2.innerHTML = `<div class="diff-lines">${rightLines.join('')}</div>`;

            // Ensure overlays are visible
            diffOverlay1.style.display = 'block';
            diffOverlay2.style.display = 'block';

            // Auto-scroll to first difference
            setTimeout(() => {
                scrollToFirstDiff(firstDiffLine);
            }, 150);
        } else {
            // No differences - clear overlays
            diffOverlay1.innerHTML = '';
            diffOverlay2.innerHTML = '';
            diffOverlay1.style.display = 'none';
            diffOverlay2.style.display = 'none';
        }

        // Store current result
        currentDiffResult = diffResult;

        // Update stats
        updateDiffStats(addedCount, removedCount, changedCount);

        isComparing = false;
    };

    // Create line highlight spans - ONLY for changed lines
    const createLineHighlights = (diffResult) => {
        const leftLines = [];
        const rightLines = [];

        diffResult.forEach((diff) => {
            if (diff.type === 'error') {
                leftLines.push(`<div class="line-highlight error-line">${escapeHtml(diff.message)}</div>`);
                rightLines.push(`<div class="line-highlight error-line">${escapeHtml(diff.message)}</div>`);
                return;
            }

            if (diff.type === 'added') {
                leftLines.push('<div class="line-highlight"></div>'); // No highlight
                rightLines.push('<div class="line-highlight line-added"></div>'); // Green highlight
            } else if (diff.type === 'removed') {
                leftLines.push('<div class="line-highlight line-removed"></div>'); // Red highlight
                rightLines.push('<div class="line-highlight"></div>'); // No highlight
            } else if (diff.type === 'changed') {
                leftLines.push('<div class="line-highlight line-removed"></div>'); // Red highlight
                rightLines.push('<div class="line-highlight line-added"></div>'); // Green highlight
            } else {
                leftLines.push('<div class="line-highlight"></div>'); // No highlight
                rightLines.push('<div class="line-highlight"></div>'); // No highlight
            }
        });

        return { leftLines, rightLines };
    };

    // Auto-scroll to first difference
    const scrollToFirstDiff = (lineIndex) => {
        const lineHeight = 20.8; // Approximate line height in pixels (13px font * 1.6 line-height)
        const scrollPosition = Math.max(0, (lineIndex * lineHeight) - 100);

        if (inputText1) {
            inputText1.scrollTop = scrollPosition;
        }
        if (inputText2) {
            inputText2.scrollTop = scrollPosition;
        }
        if (diffOverlay1) {
            diffOverlay1.scrollTop = scrollPosition;
        }
        if (diffOverlay2) {
            diffOverlay2.scrollTop = scrollPosition;
        }

        // Add flash effect to highlight first difference
        setTimeout(() => {
            const firstDiffLeft = diffOverlay1.querySelector('.line-added, .line-removed');
            const firstDiffRight = diffOverlay2.querySelector('.line-added, .line-removed');

            if (firstDiffLeft) {
                firstDiffLeft.style.animation = 'diffFlash 1.5s ease-in-out';
            }
            if (firstDiffRight) {
                firstDiffRight.style.animation = 'diffFlash 1.5s ease-in-out';
            }
        }, 100);
    };

    // Update diff stats to show only when there are actual changes
    const updateDiffStats = (added, removed, changed) => {
        const header1 = document.querySelector('.input-area:first-child h3');
        const header2 = document.querySelector('.input-area:last-child h3');

        if (!header1 || !header2) return;

        let stats1 = header1.querySelector('.diff-stats');
        let stats2 = header2.querySelector('.diff-stats');

        if (!stats1) {
            stats1 = document.createElement('span');
            stats1.className = 'diff-stats';
            header1.appendChild(stats1);
        }

        if (!stats2) {
            stats2 = document.createElement('span');
            stats2.className = 'diff-stats';
            header2.appendChild(stats2);
        }

        const totalLeft = removed + changed;
        const totalRight = added + changed;
        const totalChanges = added + removed + changed;

        if (totalChanges === 0) {
            stats1.textContent = 'No changes';
            stats2.textContent = 'No changes';
            stats1.style.color = 'var(--text-muted)';
            stats2.style.color = 'var(--text-muted)';
        } else {
            stats1.textContent = totalLeft > 0 ? `${totalLeft} changes` : '';
            stats2.textContent = totalRight > 0 ? `${totalRight} changes` : '';
            stats1.style.color = totalLeft > 0 ? 'var(--removed-text)' : 'var(--text-muted)';
            stats2.style.color = totalRight > 0 ? 'var(--added-text)' : 'var(--text-muted)';
        }
    };

    // Show AI analysis
    const showAIAnalysis = (analysisResult) => {
        if (!aiReportContainer) return;

        try {
            const formattedReport = window.aiAnalysis.generateComparisonReport(analysisResult);
            aiReportContainer.innerHTML = formattedReport;
        } catch (err) {
            console.error("Failed to format AI report:", err);
            aiReportContainer.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> Error generating AI analysis</div>`;
        }
    };

    // Toggle unchanged lines
    const toggleUnchangedLines = () => {
        showUnchanged = !showUnchanged;
        console.log("Toggle unchanged lines:", showUnchanged ? "showing" : "hiding");

        // If we have no diff result, there's nothing to toggle
        if (!currentDiffResult || !inputText1 || !inputText2) {
            console.log("No diff result to toggle");
            return;
        }

        // When hiding unchanged lines, we modify the actual text in the textareas
        if (!showUnchanged) {
            // Store original texts for later restoration
            originalText1 = inputText1.value;
            originalText2 = inputText2.value;
            originalFormat = formatSelect ? formatSelect.value : 'json';

            // Create new texts with only changed lines
            let newText1 = [];
            let newText2 = [];

            // Process each line from the diff result
            currentDiffResult.forEach(diff => {
                if (diff.type !== 'unchanged') {
                    // For changed, added, or removed lines, keep them
                    newText1.push(diff.line1);
                    newText2.push(diff.line2);
                }
            });

            // Update the textareas with filtered content
            inputText1.value = newText1.join('\n');
            inputText2.value = newText2.join('\n');

            // Rehighlight with only the changed lines
            const filteredDiff = currentDiffResult.filter(diff => diff.type !== 'unchanged');
            const { leftLines, rightLines } = createLineHighlights(filteredDiff);

            diffOverlay1.innerHTML = `<div class="diff-lines">${leftLines.join('')}</div>`;
            diffOverlay2.innerHTML = `<div class="diff-lines">${rightLines.join('')}</div>`;
        } else {
            // When showing unchanged lines, restore the original texts
            inputText1.value = originalText1;
            inputText2.value = originalText2;

            // Re-run the comparison with the original texts
            if (formatSelect) formatSelect.value = originalFormat;

            // Don't call compareInputs() directly as it would trigger a new comparison
            // Instead, just restore the original diff results and highlights
            highlightDifferencesInInputs(currentDiffResult);
        }

        // Update button text
        if (toggleUnchanged) {
            toggleUnchanged.innerHTML = showUnchanged
                ? '<i class="fas fa-eye-slash"></i> Hide Unchanged'
                : '<i class="fas fa-eye"></i> Show Unchanged';
        }
    };

    // Clear inputs
    const clearInputs = () => {
        if (inputText1) inputText1.value = '';
        if (inputText2) inputText2.value = '';
        if (diffOverlay1) diffOverlay1.innerHTML = '';
        if (diffOverlay2) diffOverlay2.innerHTML = '';

        updateDiffStats(0, 0, 0);
        currentDiffResult = null;

        if (aiReportContainer) {
            aiReportContainer.innerHTML = `
                <div class="placeholder-message">
                    <i class="fas fa-robot fa-3x"></i>
                    <p>AI will analyze your comparison and provide detailed insights about the changes, patterns, and impact.</p>
                </div>
            `;
        }
    };

    // Main compare function
    const compareInputs = () => {
        if (!inputText1 || !inputText2) {
            console.error("Input elements not found");
            return;
        }

        const text1 = inputText1.value.trim();
        const text2 = inputText2.value.trim();

        if (!text1 && !text2) {
            return;
        }

        // Store original settings for use with toggle unchanged
        showUnchanged = true;
        originalText1 = text1;
        originalText2 = text2;
        originalFormat = formatSelect ? formatSelect.value : 'json';

        const format = formatSelect ? formatSelect.value : 'json';

        // Show loading with minimal delay
        if (diffOverlay1) {
            diffOverlay1.innerHTML = '<div class="loading-small">Processing...</div>';
            diffOverlay1.style.display = 'block'; // Make sure overlay is visible
        }
        if (diffOverlay2) {
            diffOverlay2.innerHTML = '<div class="loading-small">Processing...</div>';
            diffOverlay2.style.display = 'block'; // Make sure overlay is visible
        }
        if (aiReportContainer) showLoading(aiReportContainer);

        // Process immediately for better responsiveness
        setTimeout(() => {
            try {
                let diffResult;

                switch (format) {
                    case 'json':
                        diffResult = getJsonDiff(text1, text2);
                        break;
                    case 'csv':
                        diffResult = getCsvDiff(text1, text2);
                        break;
                    case 'xml':
                        diffResult = getXmlDiff(text1, text2);
                        break;
                    default:
                        diffResult = getTextDiff(text1, text2);
                }

                // Highlight differences
                highlightDifferencesInInputs(diffResult);

                // Make sure the UI reflects the comparison state
                if (compareButton) {
                    compareButton.textContent = 'Re-Compare';
                }

                // Generate AI analysis
                if (window.aiAnalysis) {
                    const aiAnalysisReport = window.aiAnalysis.analyzeDifferences(text1, text2, format);
                    showAIAnalysis(aiAnalysisReport);
                }

            } catch (error) {
                console.error("Comparison error:", error);
                if (diffOverlay1) diffOverlay1.innerHTML = '';
                if (diffOverlay2) diffOverlay2.innerHTML = '';
                if (aiReportContainer) {
                    aiReportContainer.innerHTML = `<div class="error"><i class="fas fa-exclamation-triangle"></i> Error: ${error.message}</div>`;
                }
            }
        }, 50);
    };

    // Initialize
    const init = () => {
        console.log("Initializing UI controller...");

        // Set default format to JSON
        if (formatSelect) {
            formatSelect.value = 'json';

            // Add XML option if it doesn't exist
            if (!Array.from(formatSelect.options).some(option => option.value === 'xml')) {
                const xmlOption = document.createElement('option');
                xmlOption.value = 'xml';
                xmlOption.textContent = 'XML';
                formatSelect.appendChild(xmlOption);
            }
        }

        // Optimize textarea behavior - track editing state to reduce UI updates
        if (inputText1) {
            // Optimize scroll sync
            inputText1.addEventListener('scroll', () => syncScroll(inputText1));

            // Track when user is actively editing
            inputText1.addEventListener('focus', () => { isEditing = true; });
            inputText1.addEventListener('blur', () => {
                isEditing = false;
                // Re-sync scroll position when done editing
                setTimeout(() => syncScrollImmediate(inputText1), 100);
            });
        }

        if (inputText2) {
            // Optimize scroll sync
            inputText2.addEventListener('scroll', () => syncScroll(inputText2));

            // Track when user is actively editing
            inputText2.addEventListener('focus', () => { isEditing = true; });
            inputText2.addEventListener('blur', () => {
                isEditing = false;
                // Re-sync scroll position when done editing
                setTimeout(() => syncScrollImmediate(inputText2), 100);
            });
        }

        // Setup event listeners
        if (compareButton) {
            compareButton.addEventListener('click', compareInputs);
            // Ensure the button text is initially 'Compare'
            compareButton.textContent = 'Compare';
        }

        if (clearButton) {
            clearButton.addEventListener('click', clearInputs);
        }

        if (toggleUnchanged) {
            toggleUnchanged.addEventListener('click', toggleUnchangedLines);
        }

        // Hide overlays on initial load
        if (diffOverlay1) diffOverlay1.style.display = 'none';
        if (diffOverlay2) diffOverlay2.style.display = 'none';

        // Keyboard shortcuts - keep this for convenience
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                compareInputs();
            }
        });

        // Setup theme-aware editor behavior
        const handleThemeChange = () => {
            const isDarkTheme = document.body.classList.contains('theme-dark');
            // Adjust editor styles based on theme if needed
            if (inputText1 && inputText2) {
                const editorBackground = isDarkTheme ? 'var(--bg-primary)' : 'var(--bg-primary)';
                inputText1.style.background = editorBackground;
                inputText2.style.background = editorBackground;
            }
        };

        // Call once on init
        handleThemeChange();

        // Listen for theme changes
        const themeObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    handleThemeChange();
                }
            });
        });
        themeObserver.observe(document.body, { attributes: true });

        console.log("UI controller initialized");
    };

    return {
        init,
        compareInputs,
        clearInputs,
        showAIAnalysis
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    uiController.init();
});