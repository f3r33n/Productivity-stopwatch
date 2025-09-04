// Stopwatch state
let stopwatch = {
    startTime: 0,
    elapsedTime: 0,
    isRunning: false,
    laps: [],
    timerInterval: null
};

// DOM Elements
const hoursElement = document.getElementById('hours');
const minutesElement = document.getElementById('minutes');
const secondsElement = document.getElementById('seconds');
const millisecondsElement = document.getElementById('milliseconds');
const startStopBtn = document.getElementById('start-stop-btn');
const lapBtn = document.getElementById('lap-btn');
const resetBtn = document.getElementById('reset-btn');
const themeToggle = document.getElementById('theme-toggle');
const lapsContainer = document.getElementById('laps-container');
const searchLaps = document.getElementById('search-laps');
const exportBtn = document.getElementById('export-btn');
const fastestLap = document.getElementById('fastest-lap');
const slowestLap = document.getElementById('slowest-lap');
const averageLap = document.getElementById('average-lap');
const lapChart = document.getElementById('lap-chart');
const distributionChart = document.getElementById('distribution-chart');
const labelModal = document.getElementById('label-modal');
const lapLabelInput = document.getElementById('lap-label');
const saveLabelBtn = document.getElementById('save-label');
const skipLabelBtn = document.getElementById('skip-label');

// Chart contexts
let lapChartCtx = null;
let distributionChartCtx = null;

// Initialize the application
function init() {
    // Set up event listeners
    startStopBtn.addEventListener('click', toggleStartStop);
    lapBtn.addEventListener('click', recordLap);
    resetBtn.addEventListener('click', resetStopwatch);
    themeToggle.addEventListener('click', toggleTheme);
    searchLaps.addEventListener('input', filterLaps);
    exportBtn.addEventListener('click', exportLaps);
    saveLabelBtn.addEventListener('click', saveLapLabel);
    skipLabelBtn.addEventListener('click', skipLapLabel);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Initialize charts
    lapChartCtx = lapChart.getContext('2d');
    distributionChartCtx = distributionChart.getContext('2d');
    
    // Load theme preference
    loadThemePreference();
    
    // Initialize charts with empty data
    drawCharts();
     // Initialize analog canvas and start its render loop
    if (analogCanvas) {
        setupAnalogCanvas();
        // start continuous render loop (hands only move if stopwatch.isRunning)
        requestAnimationFrame(analogRenderLoop);
    }
}
   


// Format time for display
function formatTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    
    return {
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
        milliseconds: milliseconds.toString().padStart(2, '0')
    };
}

// Update the timer display
function updateTimerDisplay() {
    const time = formatTime(stopwatch.elapsedTime);
    hoursElement.textContent = time.hours;
    minutesElement.textContent = time.minutes;
    secondsElement.textContent = time.seconds;
    millisecondsElement.textContent = time.milliseconds;
}

// Toggle start/stop
function toggleStartStop() {
    if (stopwatch.isRunning) {
        stopStopwatch();
    } else {
        startStopwatch();
    }
}

// Start the stopwatch
function startStopwatch() {
    if (!stopwatch.isRunning) {
        stopwatch.startTime = Date.now() - stopwatch.elapsedTime;
        stopwatch.timerInterval = setInterval(() => {
            stopwatch.elapsedTime = Date.now() - stopwatch.startTime;
            updateTimerDisplay();
        }, 10);
        
        stopwatch.isRunning = true;
        startStopBtn.innerHTML = '<i class="fas fa-pause"></i>';
        startStopBtn.classList.remove('primary');
        startStopBtn.classList.add('secondary');
        lapBtn.disabled = false;
    }
}

// Stop the stopwatch
function stopStopwatch() {
    if (stopwatch.isRunning) {
        clearInterval(stopwatch.timerInterval);
        stopwatch.isRunning = false;
        startStopBtn.innerHTML = '<i class="fas fa-play"></i>';
        startStopBtn.classList.remove('secondary');
        startStopBtn.classList.add('primary');
    }
}

// Record a lap
function recordLap() {
    if (stopwatch.isRunning) {
        // Show modal to label the lap
        showLabelModal();
    }
}

// Show the label modal
function showLabelModal() {
    labelModal.style.display = 'flex';
    lapLabelInput.value = '';
    lapLabelInput.focus();
}

// Hide the label modal
function hideLabelModal() {
    labelModal.style.display = 'none';
}

// Save the lap label
function saveLapLabel() {
    const label = lapLabelInput.value.trim() || `Lap ${stopwatch.laps.length + 1}`;
    addLap(label);
    hideLabelModal();
}

// Skip adding a label
function skipLapLabel() {
    addLap(`Lap ${stopwatch.laps.length + 1}`);
    hideLabelModal();
}

// Add a lap to the list
function addLap(label) {
    const lapTime = stopwatch.elapsedTime;
    const previousLapTime = stopwatch.laps.length > 0 
        ? stopwatch.laps[stopwatch.laps.length - 1].time 
        : 0;
    
    const lap = {
        number: stopwatch.laps.length + 1,
        time: lapTime,
        lapTime: lapTime - previousLapTime,
        label: label,
        timestamp: new Date()
    };
    
    stopwatch.laps.push(lap);
    displayLaps();
    updateAnalytics();
    drawCharts();
}

// Display laps in the UI
function displayLaps() {
    const searchTerm = searchLaps.value.toLowerCase();
    
    if (stopwatch.laps.length === 0) {
        lapsContainer.innerHTML = '<p class="no-laps">No laps recorded yet</p>';
        return;
    }
    
    const filteredLaps = stopwatch.laps.filter(lap => 
        lap.label.toLowerCase().includes(searchTerm)
    );
    
    if (filteredLaps.length === 0) {
        lapsContainer.innerHTML = '<p class="no-laps">No laps match your search</p>';
        return;
    }
    
    lapsContainer.innerHTML = '';
    filteredLaps.forEach(lap => {
        const lapTime = formatTime(lap.lapTime);
        const lapElement = document.createElement('div');
        lapElement.className = 'lap-item';
        lapElement.innerHTML = `
            <div class="lap-info">
                <span class="lap-number">#${lap.number}</span>
                <span class="lap-label">${lap.label}</span>
            </div>
            <div class="lap-time">${lapTime.minutes}:${lapTime.seconds}.${lapTime.milliseconds}</div>
        `;
        lapsContainer.appendChild(lapElement);
    });
}

// Filter laps based on search input
function filterLaps() {
    displayLaps();
}

// Reset the stopwatch
function resetStopwatch() {
    stopStopwatch();
    stopwatch.elapsedTime = 0;
    stopwatch.laps = [];
    updateTimerDisplay();
    displayLaps();
    updateAnalytics();
    drawCharts();
        // Trigger starfield effect on reset
    triggerStarfieldWarp();

}

// Update analytics
function updateAnalytics() {
    if (stopwatch.laps.length === 0) {
        fastestLap.textContent = '--:--.--';
        slowestLap.textContent = '--:--.--';
        averageLap.textContent = '--:--.--';
        return;
    }
    
    const lapTimes = stopwatch.laps.map(lap => lap.lapTime);
    const fastest = Math.min(...lapTimes);
    const slowest = Math.max(...lapTimes);
    const average = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
    
    const fastestTime = formatTime(fastest);
    const slowestTime = formatTime(slowest);
    const averageTime = formatTime(average);
    
    fastestLap.textContent = `${fastestTime.minutes}:${fastestTime.seconds}.${fastestTime.milliseconds}`;
    slowestLap.textContent = `${slowestTime.minutes}:${slowestTime.seconds}.${slowestTime.milliseconds}`;
    averageLap.textContent = `${averageTime.minutes}:${averageTime.seconds}.${averageTime.milliseconds}`;
}

// Draw charts
function drawCharts() {
    drawLapChart();
    drawDistributionChart();
}
/* ===============================
   Magical Analog Watch (canvas)
   Adds an analog clock that reflects the stopwatch elapsed time.
   Hands only move when the stopwatch is running.
   Includes retina scaling and a smooth render loop.
   =============================== */

const analogCanvas = document.getElementById('analog-clock');
let analogCtx = null;
let analogCssW = 260;
let analogCssH = 260;
let analogDPR = Math.min(window.devicePixelRatio || 1, 2);

function setupAnalogCanvas() {
    if (!analogCanvas) return;
    // CSS size (we respect CSS/width with getBoundingClientRect)
    const rect = analogCanvas.getBoundingClientRect();
    // fallback when not yet rendered
    const cssW = Math.max(160, Math.min(280, rect.width || 260));
    const cssH = cssW;
    analogCssW = cssW;
    analogCssH = cssH;

    // device pixel ratio for crisp rendering (limit to 2)
    analogDPR = Math.min(window.devicePixelRatio || 1, 2);

    // set internal pixel size and scale context so drawing uses CSS px coordinates
    analogCanvas.width = Math.round(analogCssW * analogDPR);
    analogCanvas.height = Math.round(analogCssH * analogDPR);
    analogCanvas.style.width = `${analogCssW}px`;
    analogCanvas.style.height = `${analogCssH}px`;

    analogCtx = analogCanvas.getContext('2d');
    // Reset transform and scale to DPR (so 1 unit = 1 CSS px)
    analogCtx.setTransform(analogDPR, 0, 0, analogDPR, 0, 0);
}

/**
 * drawAnalogClock(ctx, w, h)
 * w,h are CSS pixels (not internal canvas pixels) — use setupAnalogCanvas to keep them in sync
 */
function drawAnalogClock(ctx, w, h) {
    if (!ctx) return;

    // compute elapsed milliseconds from your existing stopwatch state
    // when running: smooth reading from system time ensures sub-60FPS hand motion
    const totalMs = stopwatch.isRunning ? (Date.now() - stopwatch.startTime) : stopwatch.elapsedTime;

    // time components with fractional seconds for smooth hand movement
    const ms = totalMs % 1000;
    const secondsFloat = (Math.floor(totalMs / 1000) % 60) + ms / 1000;
    const minutesFloat = (Math.floor(totalMs / 60000) % 60) + secondsFloat / 60;
    const hoursFloat = (Math.floor(totalMs / 3600000) % 12) + minutesFloat / 60;

    // sizes
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) / 2 - 6;

    // clear
    ctx.clearRect(0, 0, w, h);

    // subtle radial background (gives magical depth)
    const bgGrad = ctx.createRadialGradient(cx - radius*0.2, cy - radius*0.3, radius*0.05, cx, cy, radius);
    bgGrad.addColorStop(0, 'rgba(255,255,255,0.04)');
    bgGrad.addColorStop(0.35, 'rgba(255,255,255,0.01)');
    bgGrad.addColorStop(1, 'rgba(0,0,0,0.02)');
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, Math.PI * 2);
    ctx.fillStyle = bgGrad;
    ctx.fill();

    // outer ring with gradient stroke
    const ringGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    ringGrad.addColorStop(0, 'rgba(74,108,247,0.95)');
    ringGrad.addColorStop(0.5, 'rgba(138,96,255,0.85)');
    ringGrad.addColorStop(1, 'rgba(74,108,247,0.6)');
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = ringGrad;
    ctx.stroke();

    // draw tick marks (hours longer)
    for (let i = 0; i < 60; i++) {
        const angle = (i * Math.PI / 30) - Math.PI / 2;
        const outer = {
            x: cx + Math.cos(angle) * (radius - 6),
            y: cy + Math.sin(angle) * (radius - 6)
        };
        const inner = {
            x: cx + Math.cos(angle) * (radius - (i % 5 === 0 ? 18 : 12)),
            y: cy + Math.sin(angle) * (radius - (i % 5 === 0 ? 18 : 12))
        };
        ctx.beginPath();
        ctx.moveTo(inner.x, inner.y);
        ctx.lineTo(outer.x, outer.y);
        ctx.lineWidth = (i % 5 === 0) ? 3 : 1.2;
        ctx.strokeStyle = (i % 5 === 0) ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.7)';
        ctx.stroke();
    }

    // subtle numbers for 12/3/6/9
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `${Math.max(12, Math.floor(radius*0.12))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('12', cx, cy - radius*0.64);
    ctx.fillText('3', cx + radius*0.64, cy);
    ctx.fillText('6', cx, cy + radius*0.64);
    ctx.fillText('9', cx - radius*0.64, cy);

    // HANDS: compute angles
    const secAngle = secondsFloat * Math.PI / 30 - Math.PI / 2;
    const minAngle = minutesFloat * Math.PI / 30 - Math.PI / 2;
    const hourAngle = hoursFloat * Math.PI / 6 - Math.PI / 2;

    // hour hand (short, thick)
    ctx.beginPath();
    ctx.lineWidth = Math.max(6, radius * 0.09);
    ctx.lineCap = 'round';
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(hourAngle) * (radius * 0.5), cy + Math.sin(hourAngle) * (radius * 0.5));
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.shadowColor = 'rgba(138,96,255,0.18)';
    ctx.shadowBlur = 8;
    ctx.stroke();

    // minute hand (longer, sleeker)
    ctx.beginPath();
    ctx.lineWidth = Math.max(4, radius * 0.06);
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(minAngle) * (radius * 0.72), cy + Math.sin(minAngle) * (radius * 0.72));
    ctx.strokeStyle = 'rgba(240,240,255,0.95)';
    ctx.shadowColor = 'rgba(74,108,247,0.14)';
    ctx.shadowBlur = 6;
    ctx.stroke();

    // second hand (thin colored, smooth)
    ctx.beginPath();
    ctx.lineWidth = Math.max(1.6, radius * 0.02);
    ctx.lineCap = 'round';
    ctx.moveTo(cx - Math.cos(secAngle) * (radius * 0.12), cy - Math.sin(secAngle) * (radius * 0.12)); // small tail
    ctx.lineTo(cx + Math.cos(secAngle) * (radius * 0.82), cy + Math.sin(secAngle) * (radius * 0.82));
    // gradient for second hand
    const secGrad = ctx.createLinearGradient(cx, cy, cx + Math.cos(secAngle) * radius, cy + Math.sin(secAngle) * radius);
    secGrad.addColorStop(0, 'rgba(255,90,109,0.95)');
    secGrad.addColorStop(1, 'rgba(255,170,120,0.95)');
    ctx.strokeStyle = secGrad;
    ctx.shadowColor = 'rgba(255,120,130,0.15)';
    ctx.shadowBlur = 10;
    ctx.stroke();

    // small circle at pointer end (cap)
    ctx.beginPath();
    ctx.arc(cx + Math.cos(secAngle) * (radius * 0.82), cy + Math.sin(secAngle) * (radius * 0.82), Math.max(3, radius * 0.03), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();

    // central hub
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(5, radius * 0.05), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40,40,60,0.98)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2.5, radius * 0.025), 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.98)';
    ctx.fill();

    // optional magical shimmer (outer subtle pulse) - does not move hands
    const shimmerAlpha = 0.08 + 0.04 * Math.sin(Date.now() / 800); // subtle pulsation
    ctx.beginPath();
    const shimmerGrad = ctx.createRadialGradient(cx, cy - radius * 0.12, radius*0.1, cx, cy, radius);
    shimmerGrad.addColorStop(0, `rgba(138,96,255,${0.14 * shimmerAlpha})`);
    shimmerGrad.addColorStop(0.7, `rgba(74,108,247,${0.04 * shimmerAlpha})`);
    shimmerGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = shimmerGrad;
    ctx.fillRect(cx - radius, cy - radius, radius*2, radius*2);
}
// animation loop
function analogRenderLoop() {
    if (!analogCtx) return requestAnimationFrame(analogRenderLoop);

    if (starfieldActive) {
        drawStarfield(analogCtx, analogCssW, analogCssH);
    } else {
        drawAnalogClock(analogCtx, analogCssW, analogCssH);
    }

    requestAnimationFrame(analogRenderLoop);
}

/* ===============================
   Starfield Warp Effect (on reset)
   =============================== */

let starfieldActive = false;
let stars = [];
let starStartTime = 0;

function triggerStarfieldWarp() {
    if (!analogCtx) return;

    starfieldActive = true;
    starStartTime = Date.now();
    stars = [];

    const numStars = 120;
    const cx = analogCssW / 2;
    const cy = analogCssH / 2;

    for (let i = 0; i < numStars; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        stars.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 1 + Math.random() * 2,
            alpha: 1
        });
    }

    // automatically stop after ~1.2s
    setTimeout(() => {
        starfieldActive = false;
    }, 1200);
}

function drawStarfield(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    const elapsed = (Date.now() - starStartTime) / 1000;

    for (let star of stars) {
        star.x += star.vx;
        star.y += star.vy;
        star.alpha = Math.max(0, 1 - elapsed * 1.2);

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${star.alpha})`;
        ctx.fill();
    }
}

// ensure canvas is ready and start loop
// call setupAnalogCanvas() + start loop from init()
window.addEventListener('resize', () => {
    // debounce lightly
    if (analogCanvas) {
        setupAnalogCanvas();
    }
});

// Draw lap time bar chart
function drawLapChart() {
    const width = lapChart.width;
    const height = lapChart.height;
    
    // Clear the canvas
    lapChartCtx.clearRect(0, 0, width, height);
    
    if (stopwatch.laps.length === 0) {
        lapChartCtx.font = '16px sans-serif';
        lapChartCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
        lapChartCtx.textAlign = 'center';
        lapChartCtx.fillText('No lap data available', width / 2, height / 2);
        return;
    }
    
    const lapTimes = stopwatch.laps.map(lap => lap.lapTime);
    const maxTime = Math.max(...lapTimes);
    const barWidth = (width - 40) / lapTimes.length;
    const maxBarHeight = height - 60;
    
    // Draw bars
    lapTimes.forEach((time, index) => {
        const barHeight = (time / maxTime) * maxBarHeight;
        const x = 20 + index * barWidth;
        const y = height - 40 - barHeight;
        
        lapChartCtx.fillStyle = `hsl(${index * 30}, 70%, 60%)`;
        lapChartCtx.fillRect(x, y, barWidth - 5, barHeight);
        
        // Draw lap number below bar
        lapChartCtx.font = '12px sans-serif';
        lapChartCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
        lapChartCtx.textAlign = 'center';
        lapChartCtx.fillText(stopwatch.laps[index].number, x + barWidth / 2 - 2.5, height - 20);
    });
    
    // Draw Y-axis labels
    lapChartCtx.textAlign = 'right';
    lapChartCtx.textBaseline = 'middle';
    
    for (let i = 0; i <= 5; i++) {
        const value = (maxTime * i / 5);
        const formatted = formatTime(value);
        const y = height - 40 - (maxBarHeight * i / 5);
        
        lapChartCtx.fillText(`${formatted.minutes}:${formatted.seconds}`, 15, y);
    }
}

// Draw distribution pie chart
function drawDistributionChart() {
    const width = distributionChart.width;
    const height = distributionChart.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    // Clear the canvas
    distributionChartCtx.clearRect(0, 0, width, height);
    
    if (stopwatch.laps.length === 0) {
        distributionChartCtx.font = '16px sans-serif';
        distributionChartCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
        distributionChartCtx.textAlign = 'center';
        distributionChartCtx.fillText('No data available', width / 2, height / 2);
        return;
    }
    
    // Group laps by label
    const labelMap = {};
    stopwatch.laps.forEach(lap => {
        if (!labelMap[lap.label]) {
            labelMap[lap.label] = 0;
        }
        labelMap[lap.label] += lap.lapTime;
    });
    
    const labels = Object.keys(labelMap);
    const times = Object.values(labelMap);
    const totalTime = times.reduce((sum, time) => sum + time, 0);
    
    // Draw pie chart
    let startAngle = 0;
    
    labels.forEach((label, index) => {
        const sliceAngle = (times[index] / totalTime) * 2 * Math.PI;
        
        // Draw slice
        distributionChartCtx.beginPath();
        distributionChartCtx.moveTo(centerX, centerY);
        distributionChartCtx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
        distributionChartCtx.closePath();
        
        distributionChartCtx.fillStyle = `hsl(${index * 60}, 70%, 60%)`;
        distributionChartCtx.fill();
        
        // Draw label if slice is big enough
        if (sliceAngle > 0.3) {
            const labelAngle = startAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            distributionChartCtx.font = '12px sans-serif';
            distributionChartCtx.fillStyle = '#fff';
            distributionChartCtx.textAlign = 'center';
            distributionChartCtx.textBaseline = 'middle';
            
            // Shorten long labels
            const shortLabel = label.length > 10 ? label.substring(0, 10) + '...' : label;
            distributionChartCtx.fillText(shortLabel, labelX, labelY);
        }
        
        startAngle += sliceAngle;
    });
    
    // Draw center circle
    distributionChartCtx.beginPath();
    distributionChartCtx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
    distributionChartCtx.fillStyle = getComputedStyle(document.body).backgroundColor;
    distributionChartCtx.fill();
    
    // Draw total time in center
    const totalFormatted = formatTime(totalTime);
    distributionChartCtx.font = '14px sans-serif';
    distributionChartCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
    distributionChartCtx.textAlign = 'center';
    distributionChartCtx.textBaseline = 'middle';
    distributionChartCtx.fillText('Total', centerX, centerY - 10);
    distributionChartCtx.fillText(`${totalFormatted.minutes}:${totalFormatted.seconds}`, centerX, centerY + 10);
}

// Toggle theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    if (currentTheme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    }
    
    // Redraw charts with new theme
    drawCharts();
}

// Load theme preference from localStorage
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Export laps as JSON or CSV
function exportLaps() {
    if (stopwatch.laps.length === 0) {
        alert('No laps to export');
        return;
    }
    
    const exportType = confirm('Export as JSON? Click OK for JSON, Cancel for CSV');
    
    if (exportType) {
        // Export as JSON
        const dataStr = JSON.stringify(stopwatch.laps, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        exportFile(dataUri, 'stopwatch-laps.json');
    } else {
        // Export as CSV
        let csvContent = 'Lap Number,Label,Time,Lap Time,Timestamp\n';
        stopwatch.laps.forEach(lap => {
            const time = formatTime(lap.time);
            const lapTime = formatTime(lap.lapTime);
            csvContent += `${lap.number},"${lap.label}",${time.minutes}:${time.seconds}.${time.milliseconds},${lapTime.minutes}:${lapTime.seconds}.${lapTime.milliseconds},${lap.timestamp.toISOString()}\n`;
        });
        
        const dataUri = 'data:text/csv;charset=utf-8,'+ encodeURIComponent(csvContent);
        exportFile(dataUri, 'stopwatch-laps.csv');
    }
}

// Helper function to trigger file download
function exportFile(dataUri, fileName) {
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    if (e.code === 'Space') {
        e.preventDefault();
        toggleStartStop();
    } else if (e.code === 'Enter' || e.code === 'KeyL') {
        e.preventDefault();
        if (!lapBtn.disabled) {
            recordLap();
        }
    } else if (e.code === 'KeyR') {
        e.preventDefault();
        resetStopwatch();
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);