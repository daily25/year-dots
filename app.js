// Year Dots App
class YearDotsApp {
    constructor() {
        this.year = 2026;
        this.today = new Date();
        this.currentDay = null;
        this.storageKey = 'yearDots2026';
        this.dbName = 'YearDotsDB';
        this.dbVersion = 1;
        this.db = null;
        this.cameraStream = null;

        this.init();
    }

    async init() {
        await this.initDB();
        this.loadData();
        this.loadTheme();
        this.renderDots();
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

    // IndexedDB for selfie storage
    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('selfies')) {
                    db.createObjectStore('selfies', { keyPath: 'dateKey' });
                }
            };
        });
    }

    async saveSelfie(dateKey, imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['selfies'], 'readwrite');
            const store = transaction.objectStore('selfies');
            const request = store.put({ dateKey, imageData, timestamp: new Date().toISOString() });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async loadSelfie(dateKey) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['selfies'], 'readonly');
            const store = transaction.objectStore('selfies');
            const request = store.get(dateKey);

            request.onsuccess = () => resolve(request.result?.imageData || null);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllSelfies() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['selfies'], 'readonly');
            const store = transaction.objectStore('selfies');
            const request = store.getAll();

            request.onsuccess = () => {
                const selfies = request.result || [];
                // Sort by date
                selfies.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
                resolve(selfies);
            };
            request.onerror = () => reject(request.error);
        });
    }

    loadData() {
        const stored = localStorage.getItem(this.storageKey);
        this.data = stored ? JSON.parse(stored) : {};
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
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

            // Check if has data
            if (this.data[dateKey] && (this.data[dateKey].notes || this.data[dateKey].mood)) {
                dot.classList.add('has-data');
            }

            container.appendChild(dot);
        }
    }

    getDateKey(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    setupEventListeners() {
        const container = document.getElementById('dots-container');
        const tooltip = document.getElementById('tooltip');
        const backBtn = document.getElementById('back-btn');
        const saveBtn = document.getElementById('save-btn');
        const moodSelector = document.getElementById('mood-selector');
        const energySlider = document.getElementById('energy');
        const energyValue = document.getElementById('energy-value');
        const captureBtn = document.getElementById('capture-btn');
        const retakeBtn = document.getElementById('retake-btn');
        const generateVideoBtn = document.getElementById('generate-video-btn');
        const themeToggle = document.getElementById('theme-toggle');

        // Theme toggle
        themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Dot click
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('dot')) {
                const dayNumber = parseInt(e.target.dataset.day);
                this.openDayView(dayNumber, e.target);
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

        // Back button
        backBtn.addEventListener('click', () => {
            this.closeDayView();
        });

        // Save button
        saveBtn.addEventListener('click', () => {
            this.saveDayData();
        });

        // Mood buttons
        moodSelector.addEventListener('click', (e) => {
            const btn = e.target.closest('.mood-btn');
            if (btn) {
                document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            }
        });

        // Energy slider
        energySlider.addEventListener('input', (e) => {
            energyValue.textContent = e.target.value;
        });

        // Camera capture
        captureBtn.addEventListener('click', () => {
            this.captureSelfie();
        });

        // Retake selfie
        retakeBtn.addEventListener('click', () => {
            this.startCamera();
        });

        // Placeholder click to start camera
        const selfiePlaceholder = document.getElementById('selfie-placeholder');
        selfiePlaceholder.addEventListener('click', () => {
            this.startCamera();
        });

        // Generate video
        generateVideoBtn.addEventListener('click', () => {
            this.generateYearVideo();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('day-view').classList.contains('active')) {
                this.closeDayView();
            }
        });
    }

    async startCamera() {
        const cameraContainer = document.getElementById('camera-container');
        const selfieDisplay = document.getElementById('selfie-display');
        const selfiePlaceholder = document.getElementById('selfie-placeholder');
        const captureBtn = document.getElementById('capture-btn');
        const retakeBtn = document.getElementById('retake-btn');
        const video = document.getElementById('camera-preview');

        // Show camera, hide selfie and placeholder
        cameraContainer.style.display = 'block';
        selfieDisplay.style.display = 'none';
        selfiePlaceholder.style.display = 'none';
        captureBtn.style.display = 'flex';
        retakeBtn.style.display = 'none';

        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
                audio: false
            });
            video.srcObject = this.cameraStream;
        } catch (err) {
            console.error('Camera access denied:', err);
            alert('Unable to access camera. Please allow camera permissions.');
        }
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
    }

    async captureSelfie() {
        const video = document.getElementById('camera-preview');
        const canvas = document.getElementById('selfie-canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw mirrored image
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        // Get image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        // Save to IndexedDB
        const date = this.getDateFromDayNumber(this.currentDay);
        const dateKey = this.getDateKey(date);
        await this.saveSelfie(dateKey, imageData);

        // Show saved selfie
        this.displaySavedSelfie(imageData);
        this.stopCamera();
    }

    displaySavedSelfie(imageData) {
        const cameraContainer = document.getElementById('camera-container');
        const selfieDisplay = document.getElementById('selfie-display');
        const selfiePlaceholder = document.getElementById('selfie-placeholder');
        const savedSelfie = document.getElementById('saved-selfie');
        const captureBtn = document.getElementById('capture-btn');
        const retakeBtn = document.getElementById('retake-btn');

        savedSelfie.src = imageData;
        cameraContainer.style.display = 'none';
        selfieDisplay.style.display = 'block';
        selfiePlaceholder.style.display = 'none';
        captureBtn.style.display = 'none';
        retakeBtn.style.display = 'flex';
    }

    showSelfiePlaceholder() {
        const cameraContainer = document.getElementById('camera-container');
        const selfieDisplay = document.getElementById('selfie-display');
        const selfiePlaceholder = document.getElementById('selfie-placeholder');
        const captureBtn = document.getElementById('capture-btn');
        const retakeBtn = document.getElementById('retake-btn');

        cameraContainer.style.display = 'none';
        selfieDisplay.style.display = 'none';
        selfiePlaceholder.style.display = 'flex';
        captureBtn.style.display = 'none';
        retakeBtn.style.display = 'none';
    }

    async openDayView(dayNumber, dotElement = null) {
        this.currentDay = dayNumber;
        const date = this.getDateFromDayNumber(dayNumber);
        const dateKey = this.getDateKey(date);
        const dayData = this.data[dateKey] || {};

        // Update UI
        document.getElementById('day-title').textContent = this.formatDate(date);
        document.getElementById('day-number').textContent = `Day ${dayNumber} of ${this.getDaysInYear()}`;

        // Load saved data
        document.getElementById('notes').value = dayData.notes || '';
        document.getElementById('energy').value = dayData.energy || 5;
        document.getElementById('energy-value').textContent = dayData.energy || 5;

        // Load gratitude
        document.getElementById('grateful-1').value = dayData.grateful1 || '';
        document.getElementById('grateful-2').value = dayData.grateful2 || '';
        document.getElementById('grateful-3').value = dayData.grateful3 || '';

        // Load accomplishments
        document.getElementById('did-1').value = dayData.did1 || '';
        document.getElementById('did-2').value = dayData.did2 || '';
        document.getElementById('did-3').value = dayData.did3 || '';

        // Load fitness
        document.getElementById('steps').value = dayData.steps || '';
        document.getElementById('pushups').value = dayData.pushups || '';

        // Set mood
        document.querySelectorAll('.mood-btn').forEach(btn => {
            btn.classList.remove('selected');
            if (parseInt(btn.dataset.mood) === dayData.mood) {
                btn.classList.add('selected');
            }
        });

        // Reset save button
        const saveBtn = document.getElementById('save-btn');
        saveBtn.classList.remove('saved');
        saveBtn.querySelector('span').textContent = 'Save';

        // Check for saved selfie
        const savedSelfie = await this.loadSelfie(dateKey);
        if (savedSelfie) {
            this.displaySavedSelfie(savedSelfie);
        } else {
            // Show placeholder instead of auto-starting camera
            this.showSelfiePlaceholder();
        }

        // Show generate video button only on the last day of the year
        const generateVideoBtn = document.getElementById('generate-video-btn');
        const lastDayOfYear = this.getDaysInYear();
        if (dayNumber === lastDayOfYear) {
            generateVideoBtn.style.display = 'flex';
        } else {
            generateVideoBtn.style.display = 'none';
        }

        // Animate transition
        const gridView = document.getElementById('grid-view');
        const dayView = document.getElementById('day-view');

        // Calculate dot position for transform origin
        if (dotElement) {
            const rect = dotElement.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            gridView.style.setProperty('--dot-x', `${x}px`);
            gridView.style.setProperty('--dot-y', `${y}px`);
        }

        // Start zoom animation
        gridView.classList.add('zoom-out');

        setTimeout(() => {
            gridView.classList.remove('active', 'zoom-out');
            dayView.classList.add('active', 'zoom-enter');

            setTimeout(() => {
                dayView.classList.remove('zoom-enter');
            }, 400);
        }, 350);
    }

    closeDayView() {
        this.stopCamera();

        const gridView = document.getElementById('grid-view');
        const dayView = document.getElementById('day-view');

        // Exit animation
        dayView.classList.add('zoom-exit');

        setTimeout(() => {
            dayView.classList.remove('active', 'zoom-exit');
            gridView.classList.add('active', 'zoom-in');
            this.renderDots();

            setTimeout(() => {
                gridView.classList.remove('zoom-in');
            }, 400);
        }, 250);
    }

    saveDayData() {
        const date = this.getDateFromDayNumber(this.currentDay);
        const dateKey = this.getDateKey(date);

        const notes = document.getElementById('notes').value;
        const energy = parseInt(document.getElementById('energy').value);
        const selectedMood = document.querySelector('.mood-btn.selected');
        const mood = selectedMood ? parseInt(selectedMood.dataset.mood) : null;

        // Get gratitude
        const grateful1 = document.getElementById('grateful-1').value;
        const grateful2 = document.getElementById('grateful-2').value;
        const grateful3 = document.getElementById('grateful-3').value;

        // Get accomplishments
        const did1 = document.getElementById('did-1').value;
        const did2 = document.getElementById('did-2').value;
        const did3 = document.getElementById('did-3').value;

        // Get fitness
        const steps = parseInt(document.getElementById('steps').value) || 0;
        const pushups = parseInt(document.getElementById('pushups').value) || 0;

        this.data[dateKey] = {
            notes,
            energy,
            mood,
            grateful1,
            grateful2,
            grateful3,
            did1,
            did2,
            did3,
            steps,
            pushups,
            updatedAt: new Date().toISOString()
        };

        this.saveData();

        // Animate save button
        const saveBtn = document.getElementById('save-btn');
        saveBtn.classList.add('saved');
        saveBtn.querySelector('span').textContent = 'Saved!';

        setTimeout(() => {
            saveBtn.classList.remove('saved');
            saveBtn.querySelector('span').textContent = 'Save';
        }, 2000);
    }

    async generateYearVideo() {
        const btn = document.getElementById('generate-video-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Generating...';
        btn.disabled = true;

        try {
            const selfies = await this.getAllSelfies();

            if (selfies.length === 0) {
                alert('No selfies captured yet! Start taking daily selfies to generate a video.');
                btn.innerHTML = originalText;
                btn.disabled = false;
                return;
            }

            // Create canvas for video
            const canvas = document.createElement('canvas');
            canvas.width = 720;
            canvas.height = 960;
            const ctx = canvas.getContext('2d');

            // Setup MediaRecorder
            const stream = canvas.captureStream(30);
            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });
            const chunks = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: 'video/webm' });
                const url = URL.createObjectURL(blob);

                // Trigger download
                const a = document.createElement('a');
                a.href = url;
                a.download = `year-dots-${this.year}-selfies.webm`;
                a.click();

                URL.revokeObjectURL(url);
                btn.innerHTML = originalText;
                btn.disabled = false;
            };

            mediaRecorder.start();

            // Animate through selfies
            const frameDuration = 200; // ms per frame

            for (let i = 0; i < selfies.length; i++) {
                await new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        ctx.fillStyle = '#0a0a0f';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);

                        // Draw image centered and scaled
                        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
                        const x = (canvas.width - img.width * scale) / 2;
                        const y = (canvas.height - img.height * scale) / 2;
                        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                        // Add date overlay
                        ctx.fillStyle = 'rgba(0,0,0,0.5)';
                        ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
                        ctx.fillStyle = 'white';
                        ctx.font = 'bold 24px Inter, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(selfies[i].dateKey, canvas.width / 2, canvas.height - 25);

                        setTimeout(resolve, frameDuration);
                    };
                    img.src = selfies[i].imageData;
                });
            }

            // Stop recording
            mediaRecorder.stop();

        } catch (err) {
            console.error('Video generation failed:', err);
            alert('Failed to generate video. Please try again.');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new YearDotsApp();
});

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered:', registration.scope);
            })
            .catch((error) => {
                console.log('SW registration failed:', error);
            });
    });
}
