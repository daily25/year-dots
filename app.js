// Year Dots — one dot per day, tap to mark it.

const CONFIG = {
    goal: 100,          // days to aim for this year
    gapRatio: 0.27,     // gap size relative to dot size
    maxDot: 26,         // px, keeps dots from ballooning on big screens
    minDot: 3.5,
    minCols: 8,
    maxCols: 42,
    sizeTolerance: 0.35, // px of dot size worth trading for a tidier grid
    minAspect: 0.7,      // keep the block from getting too tall...
    maxAspect: 1.9,      // ...or too wide, whatever shape the screen is
    raggedWeight: 0.8,   // how much a half-empty last row costs
    readoutMs: 1600
};

class YearDots {
    constructor() {
        this.today = new Date();
        this.year = this.today.getFullYear();
        this.storageKey = 'yearDots' + this.year;
        this.dateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        this.marked = new Set();
        this.readoutTimer = null;
        this.measured = { w: 0, h: 0, days: 0 };
    }

    init() {
        this.el = {
            year: document.getElementById('year'),
            score: document.getElementById('score-count'),
            goal: document.getElementById('score-goal'),
            scoreBlock: document.getElementById('score'),
            ring: document.getElementById('ring-fill'),
            stage: document.getElementById('stage'),
            dots: document.getElementById('dots'),
            readout: document.getElementById('readout'),
            themeToggle: document.getElementById('theme-toggle'),
            themeColor: document.getElementById('theme-color')
        };

        // If the page and this script ever disagree about the markup — a browser
        // serving one of them from a stale cache — say so instead of leaving a
        // half-drawn screen behind.
        const missing = Object.keys(this.el).filter((key) => !this.el[key]);
        if (missing.length) {
            console.error('Year Dots: markup is out of date, missing ' + missing.join(', '));
            return;
        }

        this.applyTheme(this.storedTheme());
        this.loadData();
        this.el.year.textContent = this.year;
        this.el.goal.textContent = CONFIG.goal;
        this.ringLength = 2 * Math.PI * this.el.ring.r.baseVal.value;
        this.el.ring.style.strokeDasharray = this.ringLength;
        this.el.dots.setAttribute('aria-label', 'Days of ' + this.year);
        this.buildDots();
        this.layout();
        this.updateScore(false);
        this.bindEvents();
    }

    /* ---------- data ---------- */

    loadData() {
        let days = [];
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) days = JSON.parse(stored);
        } catch (e) {
            days = []; // unreadable or corrupt storage — carry on with an empty year
        }
        this.marked = new Set(Array.isArray(days) ? days : []);
    }

    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify([...this.marked]));
        } catch (e) {
            /* storage unavailable (private mode) — the UI still works for this session */
        }
    }

    /* ---------- dates ---------- */

    isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    }

    daysInYear() {
        return this.isLeapYear(this.year) ? 366 : 365;
    }

    dayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        return Math.floor((date - start) / 86400000);
    }

    dateForDay(dayNumber) {
        const date = new Date(this.year, 0);
        date.setDate(dayNumber);
        return date;
    }

    dateKey(date) {
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
    }

    /* ---------- rendering ---------- */

    buildDots() {
        const total = this.daysInYear();
        const todayNumber = this.dayOfYear(this.today);
        const fragment = document.createDocumentFragment();

        for (let day = 1; day <= total; day++) {
            const date = this.dateForDay(day);
            const key = this.dateKey(date);
            const dot = document.createElement('div');

            let className = 'dot';
            if (day === todayNumber) {
                className += ' today';
            } else if (day < todayNumber) {
                className += ' past';
            }
            if (this.marked.has(key)) {
                className += ' marked';
            }

            dot.className = className;
            dot.dataset.key = key;
            dot.setAttribute('role', 'checkbox');
            dot.setAttribute('aria-label', this.dateFormat.format(date));
            dot.setAttribute('aria-checked', this.marked.has(key) ? 'true' : 'false');
            fragment.appendChild(dot);
        }

        this.el.dots.textContent = '';
        this.el.dots.appendChild(fragment);
    }

    // Pick the column count that makes the dots as large as possible in the
    // space available, then break ties towards a well-proportioned block with
    // a last row that isn't left mostly empty.
    pickLayout(width, height, count) {
        const target = Math.min(CONFIG.maxAspect, Math.max(CONFIG.minAspect, width / height));
        const options = [];

        for (let cols = CONFIG.minCols; cols <= CONFIG.maxCols; cols++) {
            const rows = Math.ceil(count / cols);
            const cell = Math.min(width / cols, height / rows);
            const dot = Math.min(cell / (1 + CONFIG.gapRatio), CONFIG.maxDot);
            const lastRow = count - (rows - 1) * cols;
            const cost = Math.abs(Math.log((cols / rows) / target)) +
                CONFIG.raggedWeight * ((cols - lastRow) / cols);
            options.push({ cols, dot, cost });
        }

        const largest = options.reduce((max, option) => Math.max(max, option.dot), 0);
        return options
            .filter((option) => option.dot >= largest - CONFIG.sizeTolerance)
            .sort((a, b) => a.cost - b.cost)[0];
    }

    // Space for the grid is whatever the stage has left once the score is placed.
    availableSpace() {
        const stage = this.el.stage;
        const styles = getComputedStyle(stage);
        const inset = (side) => parseFloat(styles['padding' + side]) || 0;
        return {
            width: stage.clientWidth - inset('Left') - inset('Right'),
            height: stage.clientHeight - inset('Top') - inset('Bottom') -
                this.el.scoreBlock.offsetHeight - (parseFloat(styles.rowGap) || 0)
        };
    }

    // Force the next layout() to recompute even if the stage is the same size.
    invalidateLayout() {
        this.measured = { w: 0, h: 0, days: 0 };
    }

    layout() {
        const { width, height } = this.availableSpace();
        const days = this.daysInYear();
        if (width <= 0 || height <= 0) return;
        if (width === this.measured.w && height === this.measured.h && days === this.measured.days) return;
        this.measured = { w: width, h: height, days: days };

        const best = this.pickLayout(width, height, days);
        const dot = Math.max(CONFIG.minDot, best.dot);

        this.el.dots.style.setProperty('--dot', dot.toFixed(2) + 'px');
        this.el.dots.style.setProperty('--gap', (dot * CONFIG.gapRatio).toFixed(2) + 'px');
        this.el.dots.style.gridTemplateColumns = 'repeat(' + best.cols + ', var(--dot))';
    }

    updateScore(animate) {
        const count = this.marked.size;
        const progress = Math.min(1, count / CONFIG.goal);

        this.el.score.textContent = count;
        this.el.ring.style.strokeDashoffset = this.ringLength * (1 - progress);
        this.el.scoreBlock.classList.toggle('reached', count >= CONFIG.goal);

        if (animate) {
            this.el.score.classList.remove('pop');
            void this.el.score.offsetWidth; // restart the animation
            this.el.score.classList.add('pop');
        }
    }

    /* ---------- interaction ---------- */

    toggleDay(dot) {
        const key = dot.dataset.key;
        const marking = !this.marked.has(key);

        if (marking) {
            this.marked.add(key);
            dot.classList.add('marked', 'bump');
            dot.addEventListener('animationend', () => dot.classList.remove('bump'), { once: true });
        } else {
            this.marked.delete(key);
            dot.classList.remove('marked');
        }

        dot.setAttribute('aria-checked', marking ? 'true' : 'false');
        this.saveData();
        this.updateScore(true);
        this.showReadout(dot.getAttribute('aria-label'), true);

        if (marking && navigator.vibrate) navigator.vibrate(8);
    }

    showReadout(text, autoHide) {
        clearTimeout(this.readoutTimer);
        this.el.readout.textContent = text;
        this.el.readout.classList.add('visible');
        if (autoHide) {
            this.readoutTimer = setTimeout(() => this.hideReadout(), CONFIG.readoutMs);
        }
    }

    hideReadout() {
        clearTimeout(this.readoutTimer);
        this.el.readout.classList.remove('visible');
    }

    /* ---------- theme ---------- */

    storedTheme() {
        let saved = null;
        try {
            saved = localStorage.getItem('yearDotsTheme');
        } catch (e) {
            saved = null;
        }
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.colorScheme = theme;
        this.el.themeColor.setAttribute('content', theme === 'light' ? '#fbfbfd' : '#0a0a0f');
        try {
            localStorage.setItem('yearDotsTheme', theme);
        } catch (e) {
            /* ignore */
        }
    }

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        this.applyTheme(current === 'light' ? 'dark' : 'light');
    }

    /* ---------- date rollover ---------- */

    refreshIfDateChanged() {
        const now = new Date();
        if (this.dateKey(now) === this.dateKey(this.today)) return;

        const yearChanged = now.getFullYear() !== this.year;
        this.today = now;

        if (yearChanged) {
            this.year = now.getFullYear();
            this.storageKey = 'yearDots' + this.year;
            this.loadData();
            this.el.year.textContent = this.year;
            this.el.dots.setAttribute('aria-label', 'Days of ' + this.year);
        }

        this.buildDots();
        this.invalidateLayout();
        this.layout();
        this.updateScore(false);
    }

    /* ---------- events ---------- */

    bindEvents() {
        const dots = this.el.dots;

        dots.addEventListener('click', (e) => {
            const dot = e.target.closest('.dot');
            if (dot) this.toggleDay(dot);
        });

        if (window.matchMedia('(hover: hover)').matches) {
            dots.addEventListener('mouseover', (e) => {
                const dot = e.target.closest('.dot');
                if (dot) this.showReadout(dot.getAttribute('aria-label'), false);
            });
            dots.addEventListener('mouseleave', () => this.hideReadout());
        }

        this.el.themeToggle.addEventListener('click', () => this.toggleTheme());

        if (window.ResizeObserver) {
            let frame = null;
            const observer = new ResizeObserver(() => {
                cancelAnimationFrame(frame);
                frame = requestAnimationFrame(() => this.layout());
            });
            observer.observe(this.el.stage);
        } else {
            window.addEventListener('resize', () => this.layout());
        }

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.refreshIfDateChanged();
        });

        // The score block changes height when the web font swaps in.
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                this.invalidateLayout();
                this.layout();
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new YearDots().init();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {
            /* offline support is optional */
        });
    });
}
