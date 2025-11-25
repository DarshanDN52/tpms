document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const openSidebarBtn = document.getElementById('open-sidebar-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const configForm = document.getElementById('config-form');
    const mainContent = document.getElementById('main-content');
    const tyrePositionsContainer = document.getElementById('tyre-positions-container');
    const liveDataBody = document.getElementById('live-data-body');
    const chartCanvas = document.getElementById('main-chart');
    const graphLinks = document.querySelectorAll('.dropdown-content a');
    const resetZoomBtn = document.getElementById('reset-zoom-btn');

    let mainChart;

    // Sidebar Toggle
    if (openSidebarBtn && closeSidebarBtn) {
        openSidebarBtn.addEventListener('click', () => {
            sidebar.style.left = '0';
            mainContent.style.marginLeft = '280px';
            mainContent.style.width = 'calc(100% - 280px)';
        });

        closeSidebarBtn.addEventListener('click', () => {
            sidebar.style.left = '-280px';
            mainContent.style.marginLeft = '0';
            mainContent.style.width = '100%';
        });
    }

    // Configuration Form Submission
    if (configForm) {
        configForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(configForm);
            
            // Get tire configuration and number of tires
            const tireConfigValue = document.getElementById('tire_config').value;
            const noOfTyres = parseInt(document.getElementById('no_of_tyres').value);
            
            // Validate tire configuration
            const axleStrings = tireConfigValue.split(',').filter(s => s.trim() !== '');
            const axleConfig = axleStrings.map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0 && n % 2 === 0);
            
            if (axleConfig.length === 0 || axleConfig.length !== axleStrings.length) {
                alert('Invalid tire configuration. Each axle must have an even number of tires (e.g., 2, 4).');
                return;
            }
            
            // Calculate total tires from configuration
            const totalTiresFromConfig = axleConfig.reduce((sum, count) => sum + count, 0);
            
            // Validate that configuration matches number of tires
            if (totalTiresFromConfig !== noOfTyres) {
                let exampleConfig = '';
                if (noOfTyres === 6) {
                    exampleConfig = '\u2022 2,4 (front: 2, rear: 4)\n\u2022 2,2,2 (3 axles with 2 tires each)';
                } else if (noOfTyres === 4) {
                    exampleConfig = '\u2022 2,2 (2 axles with 2 tires each)\n\u2022 4 (1 axle with 4 tires)';
                } else {
                    exampleConfig = '\u2022 Make sure total equals ' + noOfTyres;
                }
                alert(`Tire configuration mismatch!

Number of Tyres: ${noOfTyres}
Configuration Total: ${totalTiresFromConfig}

These values must be equal.

Example: For ${noOfTyres} tires, try configurations like:
${exampleConfig}`);
                return;
            }
            
            // Store configuration for 2D view
            tpmsAxleConfig = axleConfig;
            tpmsTireCount = noOfTyres;
            
            const params = new URLSearchParams(formData);
            
            fetch('/config', {
                method: 'POST',
                body: params,
            }).then(response => response.json())
              .then(data => {
                  if (data.status === 'success') {
                      alert('Configuration successful!');
                      // Close sidebar
                      sidebar.style.left = '-280px';
                      mainContent.style.marginLeft = '0';
                      mainContent.style.width = '100%';
                  }
              });
        });
    }

    // Generate Tyre Positions and Table Rows if containers exist
    if (tyrePositionsContainer && liveDataBody) {
        const urlParams = new URLSearchParams(window.location.search);
        const noOfTyres = parseInt(urlParams.get('no_of_tyres')) || 6;

        function generateTyreUI() {
            tyrePositionsContainer.innerHTML = '';
            liveDataBody.innerHTML = '';

            for (let i = 1; i <= noOfTyres; i++) {
                // Create tyre display block
                const tyreDiv = document.createElement('div');
                tyreDiv.classList.add('tyre');
                tyreDiv.innerHTML = `
                    <div class="tyre-label">Tyre ${i}</div>
                    <div class="tyre-data">
                        <div class="tyre-data-item">
                            <i class="fas fa-tachometer-alt"></i>
                            <div><span id="tyre${i}-pressure" class="value">--</span> PSI</div>
                        </div>
                        <div class="tyre-data-item">
                            <i class="fas fa-thermometer-half"></i>
                            <div><span id="tyre${i}-temp" class="value">--</span> °C</div>
                        </div>
                        <div class="tyre-data-item">
                            <i class="fas fa-battery-full"></i>
                            <div><span id="tyre${i}-battery" class="value">--</span> %</div>
                        </div>
                    </div>
                `;
                tyrePositionsContainer.appendChild(tyreDiv);

                // Create table row
                const tableRow = document.createElement('tr');
                tableRow.innerHTML = `
                    <td>Tyre ${i}</td>
                    <td id="table-tyre${i}-pressure">--</td>
                    <td id="table-tyre${i}-temp">--</td>
                    <td id="table-tyre${i}-battery">--</td>
                `;
                liveDataBody.appendChild(tableRow);
            }
        }

        function getStatus(value, normal, warning) {
            if (value < warning.low || value > warning.high) {
                return 'status-danger';
            } else if (value < normal.low || value > normal.high) {
                return 'status-warning';
            } else {
                return 'status-normal';
            }
        }

        // Function to update data
        function updateLiveData() {
            const pressureThresholds = { normal: { low: 28, high: 35 }, warning: { low: 25, high: 38 } };
            const tempThresholds = { normal: { low: 20, high: 40 }, warning: { low: 10, high: 50 } };
            const batteryThresholds = { normal: { low: 20, high: 100 }, warning: { low: 10, high: 20 } };

            for (let i = 1; i <= noOfTyres; i++) {
                const pressure = (Math.random() * 20 + 20).toFixed(2);
                const temp = (Math.random() * 40 + 5).toFixed(2);
                const battery = (Math.random() * 100).toFixed(0);

                const pressureStatus = getStatus(pressure, pressureThresholds.normal, pressureThresholds.warning);
                const tempStatus = getStatus(temp, tempThresholds.normal, tempThresholds.warning);
                const batteryStatus = getStatus(battery, batteryThresholds.normal, batteryThresholds.warning);

                // Update tyre display
                const pressureEl = document.getElementById(`tyre${i}-pressure`);
                if (pressureEl) {
                    pressureEl.textContent = pressure;
                }
                
                const tempEl = document.getElementById(`tyre${i}-temp`);
                if (tempEl) {
                    tempEl.textContent = temp;
                }

                const batteryEl = document.getElementById(`tyre${i}-battery`);
                if (batteryEl) {
                    batteryEl.textContent = battery;
                }

                // Update table
                const tablePressureEl = document.getElementById(`table-tyre${i}-pressure`);
                if (tablePressureEl) {
                    tablePressureEl.textContent = pressure;
                }

                const tableTempEl = document.getElementById(`table-tyre${i}-temp`);
                if (tableTempEl) {
                    tableTempEl.textContent = temp;
                }

                const tableBatteryEl = document.getElementById(`table-tyre${i}-battery`);
                if (tableBatteryEl) {
                    tableBatteryEl.textContent = battery;
                }
            }
        }

        generateTyreUI();
        updateLiveData();
        // Update data every 5 seconds
        setInterval(updateLiveData, 5000);
    }
     // Chart.js Setup
     if (chartCanvas) {
        const urlParams = new URLSearchParams(window.location.search);
        const noOfTyres = parseInt(urlParams.get('no_of_tyres')) || 6;
        function initializeChart() {
            const ctx = chartCanvas.getContext('2d');
            mainChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: false, ticks: { color: '#f0f0f0' } },
                        x: { ticks: { color: '#f0f0f0' } },
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'Pressure Data',
                            font: { size: 18, weight: 'bold' },
                            color: '#f0f0f0'
                        },
                        legend: { labels: { color: '#f0f0f0' } },
                        zoom: {
                            pan: {
                                enabled: true,
                                mode: 'xy',
                                modifierKey: null
                            },
                            zoom: {
                                wheel: {
                                    enabled: true,
                                    speed: 0.05,
                                    modifierKey: null
                                },
                                pinch: {
                                    enabled: true
                                },
                                drag: {
                                    enabled: true,
                                    backgroundColor: 'rgba(0, 170, 255, 0.2)',
                                    borderColor: 'rgba(0, 170, 255, 0.8)',
                                    borderWidth: 1
                                },
                                mode: 'xy',
                            }
                        }
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    },
                },
            });
        }

        function updateChart(graphType) {
            mainChart.data.datasets = [];
            mainChart.data.labels = [];

            // Update chart title based on graph type
            let chartTitle = '';
            if (graphType === 'pressure') {
                chartTitle = 'Pressure Data';
            } else if (graphType === 'temperature') {
                chartTitle = 'Temperature Data';
            } else if (graphType === 'battery') {
                chartTitle = 'Battery Data';
            }
            mainChart.options.plugins.title.text = chartTitle;

            const colors = ['#36a2eb', '#ff6384', '#4bc0c0', '#ff9f40', '#9966ff', '#ffcd56'];

            for (let i = 1; i <= noOfTyres; i++) {
                mainChart.data.datasets.push({
                    label: `Tyre ${i} ${graphType.charAt(0).toUpperCase() + graphType.slice(1)}`,
                    data: [],
                    borderColor: colors[(i - 1) % colors.length],
                    tension: 0.3,
                });
            }

            // Mock data update
            for (let j = 0; j < 20; j++) {
                const now = new Date();
                now.setSeconds(now.getSeconds() + j * 5);
                const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
                mainChart.data.labels.push(timeLabel);
                
                mainChart.data.datasets.forEach(dataset => {
                    let value;
                    if (graphType === 'pressure') {
                        value = (Math.random() * 10 + 30).toFixed(2);
                    } else if (graphType === 'temperature') {
                        value = (Math.random() * 15 + 25).toFixed(2);
                    } else { // battery
                        value = (Math.random() * 20 + 80).toFixed(0);
                    }
                    dataset.data.push(value);
                });
            }

            mainChart.update();
        }

        graphLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const graphType = e.target.getAttribute('data-graph');
                updateChart(graphType);
            });
        });

        if (resetZoomBtn) {
            resetZoomBtn.addEventListener('click', () => {
                if (mainChart) {
                    mainChart.resetZoom();
                }
            });
        }

        initializeChart();
        updateChart('pressure');
    }

    // View Switcher
    const dataViewBtn = document.getElementById('data-view-btn');
    const twoDViewBtn = document.getElementById('2d-view-btn');
    const dataViewContainer = document.getElementById('data-view-container');
    const truck2dContainer = document.getElementById('truck-2d-container');
    const tire2dDetailModal = document.getElementById('tire-2d-detail-modal');
    const closeTire2dDetail = document.querySelector('.close-tire-2d-detail');

    let tpmsAxleConfig = [2, 4]; // Default configuration
    let tpmsTireCount = 6;
    let tpmsData2D = {}; // Store tire data for 2D view
    let dataHistory2D = { pressure: {}, temperature: {}, battery: {} }; // Store history
    let selected2DTireNum = null;
    let tire2DDetailChart = null;
    let dataUpdateInterval = null;
    const maxHistoryPoints = 50;

    if (dataViewBtn && twoDViewBtn) {
        dataViewBtn.addEventListener('click', () => {
            if (!dataViewBtn.classList.contains('active')) {
                dataViewBtn.classList.add('active');
                twoDViewBtn.classList.remove('active');
                // Show data view, hide 2D view
                if (dataViewContainer) dataViewContainer.classList.add('active');
                if (truck2dContainer) truck2dContainer.classList.remove('active');
                // Stop data simulation
                stopDataSimulation();
                console.log("Switched to Data View");
            }
        });

        twoDViewBtn.addEventListener('click', () => {
            // Get tire configuration from sidebar
            const tireConfigInput = document.getElementById('tire_config');
            const noOfTyresInput = document.getElementById('no_of_tyres');
            
            if (tireConfigInput && noOfTyresInput) {
                const tireConfigValue = tireConfigInput.value;
                const noOfTyres = parseInt(noOfTyresInput.value);
                
                // Validate tire configuration format
                const axleStrings = tireConfigValue.split(',').filter(s => s.trim() !== '');
                const axleConfig = axleStrings.map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0 && n % 2 === 0);
                
                if (axleConfig.length === 0 || axleConfig.length !== axleStrings.length) {
                    alert('Invalid tire configuration format.\n\nPlease configure in the sidebar first and click Configure button.');
                    return;
                }
                
                // Update configuration and show 2D view
                tpmsAxleConfig = axleConfig;
                tpmsTireCount = noOfTyres;
                
                // Render 2D truck view
                render2DTruckView();
                
                // Show 2D view, hide data view
                if (dataViewContainer) dataViewContainer.classList.remove('active');
                if (truck2dContainer) truck2dContainer.classList.add('active');
                
                // Update active button
                twoDViewBtn.classList.add('active');
                dataViewBtn.classList.remove('active');
            }
        });
    }

    // TPMS Configuration Modal handlers (removed - now using sidebar)
    // Close button X for tire detail modal
    const closeTireDetailX = document.getElementById('close-tire-detail-x');
    if (closeTireDetailX) {
        closeTireDetailX.addEventListener('click', () => {
            tire2dDetailModal.style.display = 'none';
            selected2DTireNum = null;
        });
    }

    // TPMS Configuration Modal handlers (removed - now using sidebar)
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === tire2dDetailModal) {
            tire2dDetailModal.style.display = 'none';
            selected2DTireNum = null;
        }
    });

    // Function to render 2D truck view
    function render2DTruckView() {
        const truckView = document.getElementById('truck-2d-view');
        if (!truckView) return;

        // Clear existing tires
        const existingTires = truckView.querySelectorAll('.tire-2d');
        existingTires.forEach(tire => tire.remove());

        // Initialize data structures
        initialize2DTireData();

        // Calculate and render tire positions
        const positions = calculate2DTirePositions(tpmsAxleConfig);
        
        positions.forEach((pos, index) => {
            const tireNum = index + 1;
            const tire = document.createElement('div');
            tire.className = 'tire-2d';
            tire.id = `tire-2d-${tireNum}`;
            tire.style.left = `${pos.x}%`;
            tire.style.top = `${pos.y}%`;
            
            const label = document.createElement('div');
            label.className = 'tire-2d-label';
            label.textContent = `T${tireNum}`;
            
            tire.appendChild(label);
            truckView.appendChild(tire);
            
            // Add click event to show detail modal
            tire.addEventListener('click', () => {
                show2DTireDetail(tireNum);
            });
        });

        // Initialize chart only if it doesn't exist
        if (!tire2DDetailChart) {
            initialize2DTireDetailChart();
        }

        // Start data simulation
        startDataSimulation();
    }

    // Calculate tire positions for 2D truck view
    function calculate2DTirePositions(axleConfig) {
        const positions = [];
        const truckLength = 50;
        const truckFrontX = 20;
        const numAxles = axleConfig.length;
        const axleSpacing = numAxles > 1 ? truckLength / (numAxles - 1) : 0;

        for (let i = 0; i < numAxles; i++) {
            const axleX = truckFrontX + (i * axleSpacing);
            const numTiresOnAxle = axleConfig[i];
            const tiresPerSide = numTiresOnAxle / 2;
            const sideHeight = 16;
            const xOffset = 0;

            for (let j = 0; j < tiresPerSide; j++) {
                const currentX = axleX + (j % 2) * xOffset;
                positions.push({ x: currentX, y: 16.5 - j * sideHeight });
                positions.push({ x: currentX, y: 68.5 + j * sideHeight });
            }
        }
        return positions;
    }

    // Update 2D tire display (only for detail modal)
    function update2DTireDisplay(tireNum) {
        const tire = tpmsData2D[tireNum];
        if (!tire) return;

        // Update detail modal if it's open for this tire
        if (selected2DTireNum === tireNum) {
            update2DTireDetailCards(tireNum);
            update2DTireDetailChart(tireNum);
        }
    }

    // Initialize tire data
    function initialize2DTireData() {
        tpmsData2D = {};
        dataHistory2D = { pressure: {}, temperature: {}, battery: {} };

        for (let i = 1; i <= tpmsTireCount; i++) {
            tpmsData2D[i] = {
                pressure: 35 + Math.random() * 10,
                temperature: 20 + Math.random() * 15,
                battery: 60 + Math.random() * 30,
                lastUpdate: new Date()
            };

            dataHistory2D.pressure[i] = [];
            dataHistory2D.temperature[i] = [];
            dataHistory2D.battery[i] = [];
        }
    }

    // Start data simulation
    function startDataSimulation() {
        if (dataUpdateInterval) {
            clearInterval(dataUpdateInterval);
        }
        dataUpdateInterval = setInterval(() => {
            simulate2DTireData();
        }, 2000);
    }

    // Stop data simulation
    function stopDataSimulation() {
        if (dataUpdateInterval) {
            clearInterval(dataUpdateInterval);
            dataUpdateInterval = null;
        }
    }

    // Simulate tire data
    function simulate2DTireData() {
        for (let i = 1; i <= tpmsTireCount; i++) {
            const basePressure = 35 + (i % 3) * 5;
            const baseTemp = 20 + (i % 2) * 5;
            const baseBattery = 60 + (i % 4) * 5;

            const newData = {
                pressure: basePressure + (Math.random() - 0.5) * 8,
                temperature: baseTemp + (Math.random() - 0.5) * 10,
                battery: Math.max(0, Math.min(100, baseBattery + (Math.random() - 0.5) * 20))
            };

            update2DTireData(i, newData);
        }
    }

    // Update tire data
    function update2DTireData(tireNum, data) {
        if (!tpmsData2D[tireNum]) return;

        const now = new Date();
        const timeLabel = now.toLocaleTimeString();

        if (data.pressure !== undefined) {
            tpmsData2D[tireNum].pressure = data.pressure;
            addToHistory2D('pressure', tireNum, data.pressure, timeLabel);
        }
        if (data.temperature !== undefined) {
            tpmsData2D[tireNum].temperature = data.temperature;
            addToHistory2D('temperature', tireNum, data.temperature, timeLabel);
        }
        if (data.battery !== undefined) {
            tpmsData2D[tireNum].battery = data.battery;
            addToHistory2D('battery', tireNum, data.battery, timeLabel);
        }

        tpmsData2D[tireNum].lastUpdate = now;
        update2DTireDisplay(tireNum);
    }

    // Add data to history
    function addToHistory2D(type, tireNum, value, timeLabel) {
        if (!dataHistory2D[type][tireNum]) {
            dataHistory2D[type][tireNum] = [];
        }

        dataHistory2D[type][tireNum].push({ x: timeLabel, y: value });

        if (dataHistory2D[type][tireNum].length > maxHistoryPoints) {
            dataHistory2D[type][tireNum].shift();
        }
    }

    // Show tire detail modal
    function show2DTireDetail(tireNum) {
        selected2DTireNum = tireNum;
        const tire = tpmsData2D[tireNum];

        if (!tire || !tire2dDetailModal) return;

        tire2dDetailModal.style.display = 'block';

        document.getElementById('tire-2d-detail-title').textContent = `🚛 Tire ${tireNum} Details`;
        document.getElementById('tire-2d-detail-view-selector').value = 'pressure';

        update2DTireDetailCards(tireNum);
        update2DTireDetailChart(tireNum);
        update2DTireDetailView('pressure');
    }

    // Update tire detail cards
    function update2DTireDetailCards(tireNum) {
        const tire = tpmsData2D[tireNum];
        if (!tire) return;

        const pressureEl = document.getElementById('detail-2d-pressure');
        const tempEl = document.getElementById('detail-2d-temperature');
        const batteryEl = document.getElementById('detail-2d-battery');

        if (pressureEl) pressureEl.textContent = tire.pressure.toFixed(1);
        if (tempEl) tempEl.textContent = tire.temperature.toFixed(1);
        if (batteryEl) batteryEl.textContent = tire.battery.toFixed(0);
    }

    // Initialize tire detail chart
    function initialize2DTireDetailChart() {
        const canvas = document.getElementById('tire-2d-detail-chart');
        if (!canvas) return;

        // Destroy existing chart if it exists
        if (tire2DDetailChart) {
            tire2DDetailChart.destroy();
        }

        const ctx = canvas.getContext('2d');

        tire2DDetailChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Pressure (PSI)',
                        data: [],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y-pressure',
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        hidden: false // Visible by default
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
                        pointHoverRadius: 5,
                        hidden: true // Hidden by default
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
                        pointHoverRadius: 5,
                        hidden: true // Hidden by default
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: `Tire ${selected2DTireNum || ''} - Pressure Data`,
                        font: { size: 18, weight: 'bold' },
                        color: '#f0f0f0'
                    },
                    legend: {
                        display: false // Hide legend labels
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12
                    },
                    zoom: {
                        zoom: {
                            wheel: { 
                                enabled: true, 
                                speed: 0.05,
                                modifierKey: null // No need to hold any key
                            },
                            pinch: { 
                                enabled: true 
                            },
                            drag: {
                                enabled: true,
                                backgroundColor: 'rgba(0, 170, 255, 0.2)',
                                borderColor: 'rgba(0, 170, 255, 0.8)',
                                borderWidth: 1
                            },
                            mode: 'xy'
                        },
                        pan: {
                            enabled: true,
                            mode: 'xy',
                            modifierKey: null // No need to hold any key
                        },
                        limits: {
                            x: {min: 'original', max: 'original'},
                            y: {min: 'original', max: 'original'}
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time',
                            font: { size: 14, weight: 'bold' },
                            color: '#f0f0f0'
                        },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#f0f0f0' }
                    },
                    'y-pressure': {
                        type: 'linear',
                        display: true, // Visible by default for pressure
                        position: 'left',
                        title: {
                            display: true,
                            text: 'Pressure (PSI)',
                            font: { size: 12, weight: 'bold' },
                            color: '#4caf50'
                        },
                        grid: { color: 'rgba(76, 175, 80, 0.1)' },
                        ticks: { color: '#f0f0f0' },
                        beginAtZero: false
                    },
                    'y-temperature': {
                        type: 'linear',
                        display: false, // Hidden by default
                        position: 'right',
                        title: {
                            display: true,
                            text: 'Temperature (°C) / Battery (%)',
                            font: { size: 12, weight: 'bold' },
                            color: '#ff9800'
                        },
                        grid: { drawOnChartArea: false },
                        ticks: { color: '#f0f0f0' },
                        beginAtZero: false
                    }
                }
            }
        });

        // Initialize view controls
        initialize2DTireDetailControls();
    }

    // Initialize tire detail controls
    function initialize2DTireDetailControls() {
        const viewSelector = document.getElementById('tire-2d-detail-view-selector');
        const prevBtn = document.getElementById('prev-view-2d');
        const nextBtn = document.getElementById('next-view-2d');
        const zoomInBtn = document.getElementById('zoom-in-2d');
        const zoomOutBtn = document.getElementById('zoom-out-2d');
        const zoomResetBtn = document.getElementById('zoom-reset-2d');

        // Remove existing event listeners by cloning and replacing elements
        if (viewSelector && !viewSelector.dataset.initialized) {
            viewSelector.addEventListener('change', (e) => {
                update2DTireDetailView(e.target.value);
            });
            viewSelector.dataset.initialized = 'true';
        }

        if (prevBtn && !prevBtn.dataset.initialized) {
            prevBtn.addEventListener('click', () => {
                const options = viewSelector.options;
                const currentIndex = viewSelector.selectedIndex;
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
                viewSelector.selectedIndex = prevIndex;
                update2DTireDetailView(viewSelector.value);
            });
            prevBtn.dataset.initialized = 'true';
        }

        if (nextBtn && !nextBtn.dataset.initialized) {
            nextBtn.addEventListener('click', () => {
                const options = viewSelector.options;
                const currentIndex = viewSelector.selectedIndex;
                const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
                viewSelector.selectedIndex = nextIndex;
                update2DTireDetailView(viewSelector.value);
            });
            nextBtn.dataset.initialized = 'true';
        }

        if (zoomInBtn && tire2DDetailChart && !zoomInBtn.dataset.initialized) {
            zoomInBtn.addEventListener('click', () => {
                tire2DDetailChart.zoom(1.2); // 20% zoom in
            });
            zoomInBtn.dataset.initialized = 'true';
        }

        if (zoomOutBtn && tire2DDetailChart && !zoomOutBtn.dataset.initialized) {
            zoomOutBtn.addEventListener('click', () => {
                tire2DDetailChart.zoom(0.8); // 20% zoom out
            });
            zoomOutBtn.dataset.initialized = 'true';
        }

        if (zoomResetBtn && tire2DDetailChart && !zoomResetBtn.dataset.initialized) {
            zoomResetBtn.addEventListener('click', () => {
                tire2DDetailChart.resetZoom();
            });
            zoomResetBtn.dataset.initialized = 'true';
        }
    }

    // Update tire detail view
    function update2DTireDetailView(viewType) {
        if (!tire2DDetailChart || !selected2DTireNum) return;

        const datasets = tire2DDetailChart.data.datasets;

        // Hide all datasets first
        datasets.forEach(dataset => {
            dataset.hidden = true;
        });

        // Show only the selected dataset
        const scales = tire2DDetailChart.options.scales;
        if (viewType === 'pressure') {
            datasets[0].hidden = false; // Show only pressure
            scales['y-pressure'].display = true;
            scales['y-temperature'].display = false;
            tire2DDetailChart.options.plugins.title.text = `Tire ${selected2DTireNum} - Pressure Data`;
        } else if (viewType === 'temperature') {
            datasets[1].hidden = false; // Show only temperature
            scales['y-pressure'].display = false;
            scales['y-temperature'].display = true;
            scales['y-temperature'].title.text = 'Temperature (°C)';
            tire2DDetailChart.options.plugins.title.text = `Tire ${selected2DTireNum} - Temperature Data`;
        } else if (viewType === 'battery') {
            datasets[2].hidden = false; // Show only battery
            scales['y-pressure'].display = false;
            scales['y-temperature'].display = true;
            scales['y-temperature'].title.text = 'Battery (%)';
            tire2DDetailChart.options.plugins.title.text = `Tire ${selected2DTireNum} - Battery Data`;
        }

        tire2DDetailChart.update();
    }

    // Update tire detail chart
    function update2DTireDetailChart(tireNum) {
        if (!tire2DDetailChart || !selected2DTireNum || selected2DTireNum !== tireNum) return;

        const pressureHistory = dataHistory2D.pressure[tireNum] || [];
        const tempHistory = dataHistory2D.temperature[tireNum] || [];
        const batteryHistory = dataHistory2D.battery[tireNum] || [];

        const allLabels = new Set();
        pressureHistory.forEach(h => allLabels.add(h.x));
        tempHistory.forEach(h => allLabels.add(h.x));
        batteryHistory.forEach(h => allLabels.add(h.x));

        const sortedLabels = Array.from(allLabels).sort();

        const pressureMap = new Map(pressureHistory.map(h => [h.x, h.y]));
        const tempMap = new Map(tempHistory.map(h => [h.x, h.y]));
        const batteryMap = new Map(batteryHistory.map(h => [h.x, h.y]));

        const pressureData = sortedLabels.map(label => pressureMap.get(label) || null);
        const tempData = sortedLabels.map(label => tempMap.get(label) || null);
        const batteryData = sortedLabels.map(label => batteryMap.get(label) || null);

        tire2DDetailChart.data.labels = sortedLabels;
        tire2DDetailChart.data.datasets[0].data = pressureData;
        tire2DDetailChart.data.datasets[1].data = tempData;
        tire2DDetailChart.data.datasets[2].data = batteryData;

        tire2DDetailChart.update();
    }
});
