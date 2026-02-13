// Digital clock digit patterns (5 wide × 9 tall, 7-segment style)
const DIGIT_PATTERNS = [
    // 0
    [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,0,0,0,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    // 1
    [[0,0,0,0,0],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,0],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,0]],
    // 2
    [[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,0]],
    // 3
    [[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,1,1,1,0]],
    // 4
    [[0,0,0,0,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,0]],
    // 5
    [[0,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,1,1,1,0]],
    // 6
    [[0,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    // 7
    [[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,0],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,0]],
    // 8
    [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    // 9
    [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,1,1,1,0]],
];

const DIGIT_WIDTH = 5;
const DIGIT_HEIGHT = 9;
const DIGIT_SPACING = 2;
const COUNTER_COLS = 20;
const COUNTER_ROWS = 11;

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
        this.renderCounter();
        this.setupEventListeners();
    }

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
        this.renderCounter();
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

            if (day === todayNumber) {
                dot.classList.add('today', 'breathing');
            } else if (day < todayNumber || (this.today.getFullYear() > this.year)) {
                dot.classList.add('past');
            } else {
                dot.classList.add('future');
            }

            if (this.clickedDays.has(dateKey)) {
                dot.classList.add('clicked');
            }

            container.appendChild(dot);
        }
    }

    // Build a grid bitmap for the counter number
    buildCounterGrid(number) {
        const grid = Array.from({ length: COUNTER_ROWS }, () => Array(COUNTER_COLS).fill(0));
        const digits = String(number).split('').map(Number);
        const totalWidth = digits.length * DIGIT_WIDTH + (digits.length - 1) * DIGIT_SPACING;
        const offsetX = Math.floor((COUNTER_COLS - totalWidth) / 2);
        const offsetY = Math.floor((COUNTER_ROWS - DIGIT_HEIGHT) / 2);

        digits.forEach((digit, i) => {
            const dx = offsetX + i * (DIGIT_WIDTH + DIGIT_SPACING);
            const pattern = DIGIT_PATTERNS[digit];
            for (let row = 0; row < DIGIT_HEIGHT; row++) {
                for (let col = 0; col < DIGIT_WIDTH; col++) {
                    const gx = dx + col;
                    const gy = offsetY + row;
                    if (gx >= 0 && gx < COUNTER_COLS && gy >= 0 && gy < COUNTER_ROWS) {
                        grid[gy][gx] = pattern[row][col];
                    }
                }
            }
        });

        return grid;
    }

    renderCounter() {
        const container = document.getElementById('counter-display');
        const count = this.clickedDays.size;
        const grid = this.buildCounterGrid(count);

        container.innerHTML = '';

        for (let row = 0; row < COUNTER_ROWS; row++) {
            for (let col = 0; col < COUNTER_COLS; col++) {
                const dot = document.createElement('div');
                dot.className = 'counter-dot';
                if (grid[row][col]) {
                    dot.classList.add('on');
                }
                container.appendChild(dot);
            }
        }
    }

    setupEventListeners() {
        const container = document.getElementById('dots-container');
        const tooltip = document.getElementById('tooltip');
        const themeToggle = document.getElementById('theme-toggle');

        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('dot')) {
                const dayNumber = parseInt(e.target.dataset.day);
                this.toggleDay(dayNumber, e.target);
            }
        });

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

document.addEventListener('DOMContentLoaded', () => {
    new YearDotsApp();
});

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
