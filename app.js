// Digital clock digit patterns (5 wide x 9 tall, 7-segment style)
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
    [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,1,1,1,0]]
];

const DIGIT_WIDTH = 5;
const DIGIT_HEIGHT = 9;
const DIGIT_SPACING = 2;
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
        var stored = localStorage.getItem(this.storageKey);
        this.clickedDays = new Set(stored ? JSON.parse(stored) : []);
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify([...this.clickedDays]));
    }

    getDayOfYear(date) {
        var start = new Date(date.getFullYear(), 0, 0);
        var diff = date - start;
        var oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    getDateFromDayNumber(dayNumber) {
        var date = new Date(this.year, 0);
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
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }

    getDateKey(date) {
        return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    }

    getCounterCols() {
        var w = window.innerWidth;
        if (w <= 400) return 18;
        if (w >= 600) return 24;
        return 20;
    }

    toggleDay(dayNumber, dotElement) {
        var date = this.getDateFromDayNumber(dayNumber);
        var dateKey = this.getDateKey(date);

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
        var container = document.getElementById('dots-container');
        if (!container) return;
        var totalDays = this.getDaysInYear();
        var todayNumber = this.today.getFullYear() === this.year ? this.getDayOfYear(this.today) : -1;

        container.innerHTML = '';

        for (var day = 1; day <= totalDays; day++) {
            var dot = document.createElement('div');
            dot.className = 'dot';
            dot.setAttribute('data-day', day);

            var date = this.getDateFromDayNumber(day);
            var dateKey = this.getDateKey(date);

            if (day === todayNumber) {
                dot.className += ' today breathing';
            } else if (day < todayNumber || (this.today.getFullYear() > this.year)) {
                dot.className += ' past';
            } else {
                dot.className += ' future';
            }

            if (this.clickedDays.has(dateKey)) {
                dot.className += ' clicked';
            }

            container.appendChild(dot);
        }
    }

    buildCounterGrid(number, cols) {
        var grid = [];
        var r, c;
        for (r = 0; r < COUNTER_ROWS; r++) {
            grid[r] = [];
            for (c = 0; c < cols; c++) {
                grid[r][c] = 0;
            }
        }

        var digits = String(number).split('');
        var totalWidth = digits.length * DIGIT_WIDTH + (digits.length - 1) * DIGIT_SPACING;
        var offsetX = Math.floor((cols - totalWidth) / 2);
        var offsetY = Math.floor((COUNTER_ROWS - DIGIT_HEIGHT) / 2);

        for (var i = 0; i < digits.length; i++) {
            var digit = parseInt(digits[i]);
            var dx = offsetX + i * (DIGIT_WIDTH + DIGIT_SPACING);
            var pattern = DIGIT_PATTERNS[digit];
            for (r = 0; r < DIGIT_HEIGHT; r++) {
                for (c = 0; c < DIGIT_WIDTH; c++) {
                    var gx = dx + c;
                    var gy = offsetY + r;
                    if (gx >= 0 && gx < cols && gy >= 0 && gy < COUNTER_ROWS) {
                        grid[gy][gx] = pattern[r][c];
                    }
                }
            }
        }

        return grid;
    }

    renderCounter() {
        var container = document.getElementById('counter-display');
        if (!container) return;
        var cols = this.getCounterCols();
        var count = this.clickedDays.size;
        var grid = this.buildCounterGrid(count, cols);

        container.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
        container.innerHTML = '';

        for (var row = 0; row < COUNTER_ROWS; row++) {
            for (var col = 0; col < cols; col++) {
                var dot = document.createElement('div');
                dot.className = grid[row][col] ? 'counter-dot on' : 'counter-dot';
                container.appendChild(dot);
            }
        }
    }

    setupEventListeners() {
        var self = this;
        var container = document.getElementById('dots-container');
        var tooltip = document.getElementById('tooltip');
        var themeToggle = document.getElementById('theme-toggle');

        if (themeToggle) {
            themeToggle.addEventListener('click', function() {
                self.toggleTheme();
            });
        }

        if (!container) return;

        container.addEventListener('click', function(e) {
            if (e.target.classList.contains('dot')) {
                var dayNumber = parseInt(e.target.getAttribute('data-day'));
                self.toggleDay(dayNumber, e.target);
            }
        });

        container.addEventListener('mouseover', function(e) {
            if (e.target.classList.contains('dot')) {
                var dayNumber = parseInt(e.target.getAttribute('data-day'));
                var date = self.getDateFromDayNumber(dayNumber);
                tooltip.textContent = self.formatDate(date);
                tooltip.classList.add('visible');
            }
        });

        container.addEventListener('mousemove', function(e) {
            if (tooltip.classList.contains('visible')) {
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY - 30 + 'px';
            }
        });

        container.addEventListener('mouseout', function(e) {
            if (e.target.classList.contains('dot')) {
                tooltip.classList.remove('visible');
            }
        });

        window.addEventListener('resize', function() {
            self.renderCounter();
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    new YearDotsApp();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js')
            .then(function(registration) {
                console.log('SW registered:', registration.scope);
            })
            .catch(function(error) {
                console.log('SW registration failed:', error);
            });
    });
}
