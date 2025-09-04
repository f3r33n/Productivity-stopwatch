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