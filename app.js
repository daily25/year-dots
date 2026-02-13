// Year Dots App
class YearDotsApp {
    constructor() {
        this.year = 2026;
        this.today = new Date();
        this.storageKey = 'yearDots2026';

        this.init();
    }

    init() {
        this.loadData();
        this.loadTheme();
        this.renderDots();
        this.updateCounter();
        this.setupEventListeners();
    }

    // Theme Management
    loadTheme() {
        const savedTheme = localStorage.getItem('yearDotsTheme') || 'dark';
        document.body.setAttribute('data-theme', savedTheme);
    }

    saveTheme(theme) {
        localStorage.setItem('yearDotsTheme', theme);
    }

    toggleTheme() {
        const currentTheme = document.body.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        this.saveTheme(newTheme);
    }

    // Data persistence - stores Set of clicked date keys as array
    loadData() {
        const stored = localStorage.getItem(this.storageKey);
        this.clickedDays = new Set(stored ? JSON.parse(stored) : []);
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify([...this.clickedDays]));
    }

    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    getDateFromDayNumber(dayNumber) {
        const date = new Date(this.year, 0);
        date.setDate(dayNumber);
        return date;
    }

    isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    getDaysInYear() {
        return this.isLeapYear(this.year) ? 366 : 365;
    }

    formatDate(date) {
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    updateCounter() {
        document.getElementById('clicked-count').textContent = this.clickedDays.size;
    }

    toggleDay(dayNumber, dotElement) {
        const date = this.getDateFromDayNumber(dayNumber);
        const dateKey = this.getDateKey(date);

        if (this.clickedDays.has(dateKey)) {
            this.clickedDays.delete(dateKey);
            dotElement.classList.remove('clicked');
        } else {
            this.clickedDays.add(dateKey);
            dotElement.classList.add('clicked');
        }

        this.saveData();
        this.updateCounter();
    }

    renderDots() {
        const container = document.getElementById('dots-container');
        const totalDays = this.getDaysInYear();
        const todayNumber = this.today.getFullYear() === this.year ? this.getDayOfYear(this.today) : -1;

        container.innerHTML = '';

        for (let day = 1; day <= totalDays; day++) {
            const dot = document.createElement('div');
            dot.className = 'dot';
            dot.dataset.day = day;

            const date = this.getDateFromDayNumber(day);
            const dateKey = this.getDateKey(date);

            // Determine dot state
            if (day === todayNumber) {
                dot.classList.add('today', 'breathing');
            } else if (day < todayNumber || (this.today.getFullYear() > this.year)) {
                dot.classList.add('past');
            } else {
                dot.classList.add('future');
            }

            // Check if clicked
            if (this.clickedDays.has(dateKey)) {
                dot.classList.add('clicked');
            }

            container.appendChild(dot);
        }
    }

    setupEventListeners() {
        const container = document.getElementById('dots-container');
        const tooltip = document.getElementById('tooltip');
        const themeToggle = document.getElementById('theme-toggle');

        // Theme toggle
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Dot click - toggle color
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('dot')) {
                const dayNumber = parseInt(e.target.dataset.day);
                this.toggleDay(dayNumber, e.target);
            }
        });

        // Tooltip on hover
        container.addEventListener('mouseover', (e) => {
            if (e.target.classList.contains('dot')) {
                const dayNumber = parseInt(e.target.dataset.day);
                const date = this.getDateFromDayNumber(dayNumber);
                tooltip.textContent = this.formatDate(date);
                tooltip.classList.add('visible');
            }
        });

        container.addEventListener('mousemove', (e) => {
            if (tooltip.classList.contains('visible')) {
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY - 30 + 'px';
            }
        });

        container.addEventListener('mouseout', (e) => {
            if (e.target.classList.contains('dot')) {
                tooltip.classList.remove('visible');
            }
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new YearDotsApp();
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('SW registered:', registration.scope);
            })
            .catch((error) => {
                console.log('SW registration failed:', error);
            });
    });
}
