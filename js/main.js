// main.js - simplified to work with the new UI design

document.addEventListener('DOMContentLoaded', () => {
    console.log("Main.js loaded");

    // Set current year in the footer
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Add sample data based on selected format
    const addSampleData = (format) => {
        const input1 = document.getElementById('input1');
        const input2 = document.getElementById('input2');

        if (!input1 || !input2 || input1.value || input2.value) {
            return;
        }

        switch (format) {
            case 'json':
                // Add sample JSON data with actual differences
                input1.value = JSON.stringify({
                    "name": "John Doe",
                    "age": 30,
                    "city": "New York",
                    "status": "active",
                    "code": 200,
                    "details": {
                        "email": "john@example.com",
                        "phone": "123-456-7890"
                    }
                }, null, 2);

                input2.value = JSON.stringify({
                    "name": "John Doe",
                    "age": 31,
                    "city": "Los Angeles",
                    "status": "inactive",
                    "code": 400,
                    "details": {
                        "email": "john.doe@example.com",
                        "phone": "123-456-7890"
                    }
                }, null, 2);
                break;

            case 'xml':
                // Add sample XML data with differences
                input1.value = `<?xml version="1.0" encoding="UTF-8"?>
<user>
  <name>John Doe</name>
  <age>30</age>
  <city>New York</city>
  <status>active</status>
  <details>
    <email>john@example.com</email>
    <phone>123-456-7890</phone>
  </details>
</user>`;

                input2.value = `<?xml version="1.0" encoding="UTF-8"?>
<user>
  <name>John Doe</name>
  <age>31</age>
  <city>Los Angeles</city>
  <status>inactive</status>
  <details>
    <email>john.doe@example.com</email>
    <phone>123-456-7890</phone>
  </details>
</user>`;
                break;

            default:
                // Use JSON as the default sample
                addSampleData('json');
                return;
        }

        // Make sure overlays are hidden when sample data is loaded
        const diffOverlay1 = document.getElementById('diff-overlay-1');
        const diffOverlay2 = document.getElementById('diff-overlay-2');

        if (diffOverlay1) diffOverlay1.style.display = 'none';
        if (diffOverlay2) diffOverlay2.style.display = 'none';
    };

    // Get the format select and listen for changes
    const formatSelect = document.getElementById('format-select');
    if (formatSelect) {
        formatSelect.addEventListener('change', () => {
            const format = formatSelect.value;
            // Only add sample data if both inputs are empty
            const input1 = document.getElementById('input1');
            const input2 = document.getElementById('input2');
            if (input1 && input2 && !input1.value && !input2.value) {
                addSampleData(format);
            }
        });
    }

    // Add initial sample data
    setTimeout(() => {
        const format = formatSelect ? formatSelect.value : 'json';
        addSampleData(format);
    }, 500);
});