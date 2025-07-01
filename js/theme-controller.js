/**
 * Theme controller for toggling between light and dark themes
 */
document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const bodyElement = document.body;

    // Check if theme preference is stored in localStorage
    const savedTheme = localStorage.getItem('diff-checker-theme');

    // Apply saved theme or default to dark
    if (savedTheme === 'light') {
        bodyElement.classList.remove('theme-dark');
        bodyElement.classList.add('theme-light');
    }

    // Setup the toggle button with the correct icons
    if (bodyElement.classList.contains('theme-dark')) {
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    } else {
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', () => {
        if (bodyElement.classList.contains('theme-dark')) {
            // Switch to light theme
            bodyElement.classList.remove('theme-dark');
            bodyElement.classList.add('theme-light');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('diff-checker-theme', 'light');
        } else {
            // Switch to dark theme
            bodyElement.classList.remove('theme-light');
            bodyElement.classList.add('theme-dark');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('diff-checker-theme', 'dark');
        }
    });
});
