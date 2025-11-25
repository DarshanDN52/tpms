// TPMS Dashboard JavaScript
let tireCount = 6;
let axleConfig = [2, 4];
let tpmsData = {};
let chart = null;
let tireDetailChart = null;
let isCollecting = false;
let selectedTireNum = null;
let dataHistory = {
    pressure: {},
    temperature: {},
    battery: {}
};
const maxHistoryPoints = 50;

// Socket connection
const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check for config in URL
    const urlParams = new URLSearchParams(window.location.search);
    const configParam = urlParams.get('config');

    if (configParam) {
        const axleStrings = configParam.split(',').filter(s => s.trim() !== '');
        const newAxleConfig = axleStrings.map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0 && n % 2 === 0);

        if (newAxleConfig.length > 0 && newAxleConfig.length === axleStrings.length) {
            const totalTires = newAxleConfig.reduce((sum, count) => sum + count, 0);
            if (totalTires >= 2 && totalTires <= 16) {
                axleConfig = newAxleConfig;
                tireCount = totalTires;
                
                // Hide the modal and start collection
                const modal = document.getElementById('tire-count-modal');
                if(modal) modal.style.display = 'none';

                // Defer start to ensure everything is rendered
                setTimeout(startTPMSCollection, 100);
            }
        }
    }

    initializeModal();
    initializeTireDetailModal();
    initializeTireDetailChart();
    setupSocketListeners();
    // No longer initializing main chart or buttons here as they are removed or moved.
    document.getElementById('configure-tpms-btn').addEventListener('click', () => {
        console.log('Configure TPMS button clicked.'); // Added for debugging
        const modal = document.getElementById('tire-count-modal');
        if (modal) modal.style.display = 'block';
    });
});

// Modal handling
function initializeModal() {
    const modal = document.getElementById('tire-count-modal');
    const closeBtn = document.querySelector('.close');
    const confirmBtn = document.getElementById('confirm-tire-count');
    const cancelBtn = document.getElementById('cancel-tire-count');



    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    cancelBtn.onclick = () => {
        modal.style.display = 'none';
    };

    confirmBtn.onclick = () => {
        console.log('Confirm button clicked in TPMS modal.');
        const configInput = document.getElementById('tire-config-input').value;
        const axleStrings = configInput.split(',').filter(s => s.trim() !== '');
        const newAxleConfig = axleStrings.map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0 && n % 2 === 0);

        if (newAxleConfig.length === 0 || newAxleConfig.length !== axleStrings.length) {
            alert('Please enter a valid axle configuration. Each axle must have an even number of tires (e.g., 2, 4).');
            return;
        }

        axleConfig = newAxleConfig;
        tireCount = axleConfig.reduce((sum, count) => sum + count, 0);

        if (tireCount < 2) {
            alert('Total number of tires must be at least 2.');
            return;
        }
        if (tireCount > 16) {
            alert('Total number of tires cannot exceed 16.');
            return;
        }

        modal.style.display = 'none';
        startTPMSCollection();
    };

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}





// Initialize tire detail modal
function initializeTireDetailModal() {
    const modal = document.getElementById('tire-detail-modal');
    const closeBtn = document.querySelector('.close-tire-detail');
    
    closeBtn.onclick = () => {
        modal.style.display = 'none';
        selectedTireNum = null;
        // Reset zoom when closing
        if (tireDetailChart) {
            tireDetailChart.resetZoom();
        }
    };
    
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            selectedTireNum = null;
            // Reset zoom when closing
            if (tireDetailChart) {
                tireDetailChart.resetZoom();
            }
        }
    };
}

// Initialize tire detail chart
function initializeTireDetailChart() {
    const ctx = document.getElementById('tire-detail-chart').getContext('2d');
    
    tireDetailChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Pressure (PSI)',
                    data: [],
                    borderColor: '#101024ff',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y-pressure',
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Temperature (°C)',
                    data: [],
                    borderColor: '#ff9800',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y-temperature',
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Battery (%)',
                    data: [],
                    borderColor: '#2196f3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y-temperature',
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Live Tire Data',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    color: '#495057'
                },
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                if (label.includes('Pressure')) {
                                    label += context.parsed.y.toFixed(1) + ' PSI';
                                } else if (label.includes('Temperature')) {
                                    label += context.parsed.y.toFixed(1) + ' °C';
                                } else if (label.includes('Battery')) {
                                    label += context.parsed.y.toFixed(0) + ' %';
                                }
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        color: '#495057'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                'y-pressure': {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Pressure (PSI)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#4caf50'
                    },
                    grid: {
                        color: 'rgba(76, 175, 80, 0.1)'
                    },
                    beginAtZero: false
                },
                'y-temperature': {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Temperature (°C) / Battery (%)',
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#ff9800'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    beginAtZero: false
                },
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            },
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    },
                    pan: {
                        enabled: true,
                        mode: 'x',
                        modifierKey: 'ctrl'
                    },
                    limits: {
                        x: {min: 'original', max: 'original'},
                        y: {min: 'original', max: 'original'}
                    }
                }
            }
        }
    });
    
    // Initialize view selector and zoom controls
    initializeTireDetailControls();
}

// Initialize tire detail controls (view selector and zoom)
function initializeTireDetailControls() {
    const viewSelector = document.getElementById('tire-detail-view-selector');
    const prevBtn = document.getElementById('prev-view');
    const nextBtn = document.getElementById('next-view');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomResetBtn = document.getElementById('zoom-reset');
    
    // View selector change
    viewSelector.addEventListener('change', (e) => {
        updateTireDetailView(e.target.value);
    });
    
    // Arrow buttons for view navigation
    prevBtn.addEventListener('click', () => {
        const options = viewSelector.options;
        const currentIndex = viewSelector.selectedIndex;
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        viewSelector.selectedIndex = prevIndex;
        updateTireDetailView(viewSelector.value);
    });
    
    nextBtn.addEventListener('click', () => {
        const options = viewSelector.options;
        const currentIndex = viewSelector.selectedIndex;
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        viewSelector.selectedIndex = nextIndex;
        updateTireDetailView(viewSelector.value);
    });
    
    // Zoom controls
    zoomInBtn.addEventListener('click', () => {
        if (tireDetailChart) {
            const xScale = tireDetailChart.scales.x;
            if (xScale) {
                const min = xScale.min;
                const max = xScale.max;
                const center = (min + max) / 2;
                const range = max - min;
                xScale.options.min = center - range * 0.45;
                xScale.options.max = center + range * 0.45;
                tireDetailChart.update('none');
            }
        }
    });
    
    zoomOutBtn.addEventListener('click', () => {
        if (tireDetailChart) {
            const xScale = tireDetailChart.scales.x;
            if (xScale) {
                const min = xScale.min;
                const max = xScale.max;
                const center = (min + max) / 2;
                const range = max - min;
                xScale.options.min = center - range * 0.55;
                xScale.options.max = center + range * 0.55;
                tireDetailChart.update('none');
            }
        }
    });
    
    zoomResetBtn.addEventListener('click', () => {
        if (tireDetailChart) {
            const xScale = tireDetailChart.scales.x;
            if (xScale) {
                xScale.options.min = undefined;
                xScale.options.max = undefined;
                tireDetailChart.update();
            }
            // Also try the plugin's resetZoom if available
            if (typeof tireDetailChart.resetZoom === 'function') {
                tireDetailChart.resetZoom();
            }
        }
    });
}

// Update tire detail view based on selection
function updateTireDetailView(viewType) {
    if (!tireDetailChart || !selectedTireNum) return;
    
    const datasets = tireDetailChart.data.datasets;
    
    // Show/hide datasets based on view
    datasets.forEach((dataset, index) => {
        if (viewType === 'pressure' && index === 0) {
            dataset.hidden = false;
        } else if (viewType === 'temperature' && index === 1) {
            dataset.hidden = false;
        } else if (viewType === 'battery' && index === 2) {
            dataset.hidden = false;
        } else {
            dataset.hidden = true;
        }
    });
    
    // Update axis visibility
    const scales = tireDetailChart.options.scales;
    if (viewType === 'pressure') {
        scales['y-pressure'].display = true;
        scales['y-temperature'].display = false;
        scales['y-pressure'].title.text = 'Pressure (PSI)';
    } else if (viewType === 'temperature') {
        scales['y-pressure'].display = false;
        scales['y-temperature'].display = true;
        scales['y-temperature'].title.text = 'Temperature (°C)';
    } else if (viewType === 'battery') {
        scales['y-pressure'].display = false;
        scales['y-temperature'].display = true;
        scales['y-temperature'].title.text = 'Battery (%)';
    }
    
    tireDetailChart.update();
}





// Setup Socket.IO listeners
function setupSocketListeners() {
    socket.on('tpms_data', (data) => {
        // This listener can be kept if there's an intention to send specific TPMS data
        // from the backend in the future, but it's currently unused by the Flask app.
        // For now, it will simply log the data if received.
        console.log('Received tpms_data (not processed by current UI):', data);
    });

    // Removed the 'can_messages' listener as per user's request to not connect TPMS data to the backend.
    // The TPMS dashboard should rely solely on its internal simulation.
}

// Start TPMS data collection
function startTPMSCollection() {
    console.log('startTPMSCollection function invoked.');
    isCollecting = true;
    
    // Initialize tire data structure
    initializeTireData();
    renderTruckView();
    
    // Start simulation directly as per user request
    console.log('TPMS collection started (frontend simulation)');
    startDataSimulation();
}

// Stop TPMS data collection
function stopTPMSCollection() {
    isCollecting = false;
    
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
    
    // Log that TPMS collection is stopped (frontend only)
    console.log('TPMS collection stopped (frontend simulation)');
}

let simulationInterval = null;

// Start data simulation for testing
function startDataSimulation() {
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }
    simulationInterval = setInterval(() => {
        if (isCollecting) {
            simulateTPMSData();
        }
    }, 2000);
}

// Initialize tire data structure
function initializeTireData() {
    tpmsData = {};
    dataHistory = {pressure: {}, temperature: {}, battery: {}};
    
    for (let i = 1; i <= tireCount; i++) {
        tpmsData[i] = {
            position: getTirePositionName(i),
            pressure: 35 + Math.random() * 10,
            temperature: 20 + Math.random() * 15,
            battery: 60 + Math.random() * 30,
            status: 'normal',
            lastUpdate: new Date()
        };
        
        dataHistory.pressure[i] = [];
        dataHistory.temperature[i] = [];
        dataHistory.battery[i] = [];
    }
}

// Get tire position name based on number
function getTirePositionName(tireNum) {
    // This function now needs to be dynamic based on axleConfig
    let count = 0;
    for (let i = 0; i < axleConfig.length; i++) {
        const axleTires = axleConfig[i];
        if (tireNum <= count + axleTires) {
            const axleName = getAxleName(i); // e.g., Front, Middle, Rear
            const tireIndexOnAxle = tireNum - count - 1;
            // With the new horizontal layout, even indices are Top, odd are Bottom
            const side = tireIndexOnAxle % 2 === 0 ? 'Top' : 'Bottom';
            const positionOnSide = Math.floor(tireIndexOnAxle / 2); // 0=Outer, 1=Inner, ...
            const positionName = getPositionName(positionOnSide);
            
            return `${axleName} ${side} ${positionName}`;
        }
        count += axleTires;
    }
    return `Tire ${tireNum}`; // Fallback
}

function getAxleName(axleIndex) {
    if (axleIndex === 0) return 'Front';
    if (axleIndex === axleConfig.length - 1) return 'Rear';
    return `Middle ${axleIndex}`;
}

function getPositionName(positionIndex) {
    if (positionIndex === 0) return 'Outer';
    if (positionIndex === 1) return 'Inner';
    return `Inner ${positionIndex + 1}`;
}



// Update tire data
function updateTireData(tireNum, data) {
    if (!tpmsData[tireNum]) return;
    
    const now = new Date();
    const timeLabel = now.toLocaleTimeString();
    
    // Update current data
    if (data.pressure !== undefined) {
        tpmsData[tireNum].pressure = data.pressure;
        addToHistory('pressure', tireNum, data.pressure, timeLabel);
    }
    if (data.temperature !== undefined) {
        tpmsData[tireNum].temperature = data.temperature;
        addToHistory('temperature', tireNum, data.temperature, timeLabel);
    }
    if (data.battery !== undefined) {
        tpmsData[tireNum].battery = data.battery;
        addToHistory('battery', tireNum, data.battery, timeLabel);
    }
    
    tpmsData[tireNum].lastUpdate = now;
    tpmsData[tireNum].status = calculateStatus(tpmsData[tireNum]);
    
    // Update UI
    updateTireVisual(tireNum);


    
    // Update tire detail modal if it's open for this tire
    if (selectedTireNum === tireNum) {
        updateTireDetailCards(tireNum);
        updateTireDetailChart(tireNum);
    }
}

// Add data point to history
function addToHistory(type, tireNum, value, timeLabel) {
    if (!dataHistory[type][tireNum]) {
        dataHistory[type][tireNum] = [];
    }
    
    dataHistory[type][tireNum].push({x: timeLabel, y: value});
    
    // Keep only last N points
    if (dataHistory[type][tireNum].length > maxHistoryPoints) {
        dataHistory[type][tireNum].shift();
    }
}

// Calculate tire status
function calculateStatus(tire) {
    if (tire.pressure < 20 || tire.pressure > 120 || tire.temperature > 80 || tire.battery < 20) {
        return 'critical';
    } else if (tire.pressure < 30 || tire.pressure > 100 || tire.temperature > 60 || tire.battery < 40) {
        return 'warning';
    }
    return 'normal';
}

// Render truck 2D view with tires arranged around rectangle
function renderTruckView() {
    const truckView = document.getElementById('truck-view');
    // Clear existing tires
    const existingTires = truckView.querySelectorAll('.tire');
    existingTires.forEach(tire => tire.remove());
    
    // Calculate positions based on tire count - arranged around truck rectangle
    const positions = calculateTirePositions(axleConfig);
    
    positions.forEach((pos, index) => {
        const tireNum = index + 1;
        const tire = document.createElement('div');
        tire.className = 'tire';
        tire.id = `tire-${tireNum}`;
        tire.style.left = `${pos.x}%`;
        tire.style.top = `${pos.y}%`;
        
        const label = document.createElement('div');
        label.className = 'tire-label';
        label.textContent = `T${tireNum}`;
        
        tire.appendChild(label);
        truckView.appendChild(tire);
        
        // Add click event listener to tire
        tire.addEventListener('click', () => {
            showTireDetail(tireNum);
        });
        
        // Initialize with current data
        updateTireVisual(tireNum);
    });

}

// Show tire detail modal
function showTireDetail(tireNum) {
    selectedTireNum = tireNum;
    const modal = document.getElementById('tire-detail-modal');
    const tire = tpmsData[tireNum];
    
    if (!tire) return;
    
    // Show modal first to ensure canvas is visible for Chart.js rendering
    modal.style.display = 'block';

    // Update modal title
    document.getElementById('tire-detail-title').textContent = `🚛 Tire ${tireNum} - ${tire.position}`;
    
    // Set default view to "pressure" and update the chart
    document.getElementById('tire-detail-view-selector').value = 'pressure';
    updateTireDetailView('pressure');
    
    // Update live data cards
    updateTireDetailCards(tireNum);
    
    // Update chart (this will call tireDetailChart.update() internally)
    updateTireDetailChart(tireNum);
    
    // Reset zoom
    setTimeout(() => {
        if (tireDetailChart) {
            const xScale = tireDetailChart.scales.x;
            if (xScale) {
                xScale.options.min = undefined;
                xScale.options.max = undefined;
                tireDetailChart.update();
            }
            if (typeof tireDetailChart.resetZoom === 'function') {
                tireDetailChart.resetZoom();
            }
        }
    }, 100);
}

// Update tire detail cards with live data
function updateTireDetailCards(tireNum) {
    const tire = tpmsData[tireNum];
    if (!tire) return;
    
    document.getElementById('detail-pressure').textContent = tire.pressure.toFixed(1);
    document.getElementById('detail-temperature').textContent = tire.temperature.toFixed(1);
    document.getElementById('detail-battery').textContent = tire.battery.toFixed(0);
}

// Update tire detail chart
function updateTireDetailChart(tireNum) {
    if (!tireDetailChart || !selectedTireNum || selectedTireNum !== tireNum) return;
    
    const pressureHistory = dataHistory.pressure[tireNum] || [];
    const tempHistory = dataHistory.temperature[tireNum] || [];
    const batteryHistory = dataHistory.battery[tireNum] || [];
    
    // Get all unique time labels
    const allLabels = new Set();
    pressureHistory.forEach(h => allLabels.add(h.x));
    tempHistory.forEach(h => allLabels.add(h.x));
    batteryHistory.forEach(h => allLabels.add(h.x));
    
    const sortedLabels = Array.from(allLabels).sort();
    
    // Create data maps
    const pressureMap = new Map(pressureHistory.map(h => [h.x, h.y]));
    const tempMap = new Map(tempHistory.map(h => [h.x, h.y]));
    const batteryMap = new Map(batteryHistory.map(h => [h.x, h.y]));
    
    // Map data to labels
    const pressureData = sortedLabels.map(label => pressureMap.get(label) || null);
    const tempData = sortedLabels.map(label => tempMap.get(label) || null);
    const batteryData = sortedLabels.map(label => batteryMap.get(label) || null);
    
    // Update chart
    tireDetailChart.data.labels = sortedLabels;
    tireDetailChart.data.datasets[0].data = pressureData;
    tireDetailChart.data.datasets[1].data = tempData;
    tireDetailChart.data.datasets[2].data = batteryData;
    
    tireDetailChart.update();
}




// Calculate tire positions for 2D top view - arranged around truck rectangle
function calculateTirePositions(axleConfig) {
    const positions = [];
    const truckLength = 50; // x-axis for axle placement
    const truckFrontX = 20; // Starting X for front axle

    const numAxles = axleConfig.length;
    // Distribute axles evenly along the truck length
    const axleSpacing = numAxles > 1 ? truckLength / (numAxles - 1) : 0;

    for (let i = 0; i < numAxles; i++) {
        const axleX = truckFrontX + (i * axleSpacing);
        const numTiresOnAxle = axleConfig[i];
        const tiresPerSide = numTiresOnAxle / 2;
        
        const sideHeight = 5; // Vertical gap between tires on the same side
        const xOffset = 6;   // Horizontal offset for "inner" tires to give perspective

        for (let j = 0; j < tiresPerSide; j++) {
            // Add a top and a bottom tire for each 'ring'
            const currentX = axleX + (j % 2) * xOffset;
            
            // Top side tire (truck body is 32.5-67.5, tire is ~18% high)
            // Gap of ~1%: tire bottom at 31.5. Tire top at 31.5 - 18 = 13.5
            positions.push({ x: currentX, y: 19.5 - j * sideHeight });
            
            // Bottom side tire
            // Gap of ~1%: tire top at 68.5.
            positions.push({ x: currentX, y: 68.5 + j * sideHeight });
        }
    }
    return positions;
}

// Update tire visual appearance
function updateTireVisual(tireNum) {
    const tireElement = document.getElementById(`tire-${tireNum}`);
    if (!tireElement || !tpmsData[tireNum]) return;
    
    const tire = tpmsData[tireNum];
    tireElement.className = 'tire';
    
    if (tire.status === 'critical') {
        tireElement.classList.add('critical');
    } else if (tire.status === 'warning') {
        tireElement.classList.add('warning');
    } else {
        tireElement.classList.add('normal');
    }
    
    // Update tire display with all three metrics
    
}

// Update tire display with pressure, temperature, and battery
function updateTireDisplay(tireNum) {
    const tire = tpmsData[tireNum];
    if (!tire) return;
    
    const pressureEl = document.getElementById(`tire-pressure-${tireNum}`);
    const tempEl = document.getElementById(`tire-temp-${tireNum}`);
    const batteryEl = document.getElementById(`tire-battery-${tireNum}`);
    
    if (pressureEl) {
        pressureEl.innerHTML = `<span class="metric-label">P:</span>${tire.pressure.toFixed(1)} PSI`;
    }
    if (tempEl) {
        tempEl.innerHTML = `<span class="metric-label">T:</span>${tire.temperature.toFixed(1)}°C`;
    }
    if (batteryEl) {
        batteryEl.innerHTML = `<span class="metric-label">B:</span>${tire.battery.toFixed(0)}%`;
    }
}







// Simulate data for testing
function simulateTPMSData() {
    if (!isCollecting) return;
    
    for (let i = 1; i <= tireCount; i++) {
        // Simulate realistic variations
        const basePressure = 35 + (i % 3) * 5;
        const baseTemp = 20 + (i % 2) * 5;
        const baseBattery = 60 + (i % 4) * 5;
        
        const data = {
            pressure: basePressure + (Math.random() - 0.5) * 8,
            temperature: baseTemp + (Math.random() - 0.5) * 10,
            battery: Math.max(0, Math.min(100, baseBattery + (Math.random() - 0.5) * 20))
        };
        updateTireData(i, data);
    }
}