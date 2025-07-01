# Diff Checker Application

## Overview
The Diff Checker Application is a web-based tool designed to compare various formats of data, including plain text, CSV, and JSON. It highlights the differences between the inputs and provides an AI-enhanced analysis report to help users understand the changes more effectively.

## Features
- **Multi-format Comparison**: Supports comparison of text, CSV, and JSON formats.
- **AI Analysis**: Utilizes AI capabilities to generate insightful comparison reports.
- **Interactive UI**: A user-friendly interface that allows easy input and visualization of differences.
- **Theme Support**: Users can switch between different themes for a personalized experience.

## Project Structure
```
diff-checker-app
├── index.html          # Main entry point of the application
├── css
│   ├── style.css      # Main styles for the application
│   └── themes.css     # Additional styles for theme switching
├── js
│   ├── main.js        # Initializes the application and manages flow
│   ├── diff-engine.js  # Core logic for comparing inputs
│   ├── formatters
│   │   ├── text-formatter.js  # Formats plain text for comparison
│   │   ├── csv-formatter.js   # Formats CSV for comparison
│   │   └── json-formatter.js  # Formats JSON for comparison
│   ├── ai-analysis.js  # AI functions for analysis and reporting
│   └── ui-controller.js # Manages UI interactions
├── assets
│   └── icons.svg      # SVG icons for UI elements
├── lib
│   └── diff-lib.js    # Utility functions for diff checks
└── README.md          # Documentation for the project
```

## Setup Instructions
1. Clone the repository to your local machine.
2. Open `index.html` in your preferred web browser.
3. Input the data you wish to compare in the designated fields.
4. Click the "Compare" button to see the differences highlighted.
5. Review the AI-generated analysis report for additional insights.

## Usage Guidelines
- Ensure that the input data is correctly formatted according to the selected type (text, CSV, or JSON).
- Use the theme switcher to customize the appearance of the application.
- Refer to the individual JavaScript files for more details on the functionality of each component.

## Contributing
Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.