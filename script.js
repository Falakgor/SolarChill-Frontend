// ==================================================
// SOLARCHILL DASHBOARD
// ==================================================


// --------------------------------------------------
// API URLs
// --------------------------------------------------

const LATEST_API =
    "https://solarchill.onrender.com/api/sensor-data/latest";

const HISTORY_API =
    "https://solarchill.onrender.com/api/sensor-data";


// --------------------------------------------------
// DOM ELEMENTS
// --------------------------------------------------

const temperatureElement =
    document.getElementById("temperature");

const fanSpeedElement =
    document.getElementById("fanSpeed");

const systemStatusElement =
    document.getElementById("systemStatus");

const lastUpdatedElement =
    document.getElementById("lastUpdated");

const readingsTable =
    document.getElementById("readingsTable");


// --------------------------------------------------
// CHART
// --------------------------------------------------

let temperatureChart = null;


// ==================================================
// FETCH LATEST DATA
// ==================================================

async function fetchLatestData() {

    try {

        const response =
            await fetch(LATEST_API);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch latest data"
            );

        }

        const data =
            await response.json();


        // ------------------------------------------
        // Temperature
        // ------------------------------------------

        const temperature =
            Number(data.temperature);

        temperatureElement.textContent =
            temperature.toFixed(1);


        // ------------------------------------------
        // Fan Speed
        // ------------------------------------------

        let fanSpeed;

        if (data.fanSpeed !== undefined) {

            fanSpeed =
                Number(data.fanSpeed);

        } else {

            fanSpeed =
                calculateFanSpeed(temperature);

        }

        fanSpeedElement.textContent =
            fanSpeed;


        // ------------------------------------------
        // Status
        // ------------------------------------------

        let status;

        if (data.status !== undefined) {

            status =
                String(data.status).toUpperCase();

        } else {

            status =
                calculateStatus(temperature);

        }

        systemStatusElement.textContent =
            status;


        // ------------------------------------------
        // Status appearance
        // ------------------------------------------

        updateStatusAppearance(status);


        // ------------------------------------------
        // Last updated
        // ------------------------------------------

        if (data.timestamp) {

            lastUpdatedElement.textContent =
                formatDate(data.timestamp);

        }


    }

    catch (error) {

        console.error(
            "Latest data error:",
            error
        );

        temperatureElement.textContent =
            "--.-";

        fanSpeedElement.textContent =
            "--";

        systemStatusElement.textContent =
            "OFFLINE";

        lastUpdatedElement.textContent =
            "--";

        updateStatusAppearance("OFFLINE");
    }
}


// ==================================================
// FETCH HISTORY
// ==================================================

async function fetchHistoryData() {

    try {

        const response =
            await fetch(HISTORY_API);

        if (!response.ok) {

            throw new Error(
                "Failed to fetch history"
            );

        }

        const data =
            await response.json();


        // Update graph

        updateTemperatureChart(data);


        // Update last 5 readings

        updateRecentReadings(data);

    }

    catch (error) {

        console.error(
            "History data error:",
            error
        );

    }
}


// ==================================================
// CALCULATE STATUS
// ==================================================

function calculateStatus(temperature) {

    temperature =
        Number(temperature);


    if (temperature < 22) {

        return "NORMAL";

    }

    else if (temperature < 26) {

        return "WARNING";

    }

    else {

        return "CRITICAL";

    }
}


// ==================================================
// CALCULATE FAN SPEED
// ==================================================

function calculateFanSpeed(temperature) {

    temperature =
        Number(temperature);


    if (temperature < 18.5) {

        return 0;

    }

    else if (temperature < 22) {

        return 40;

    }

    else if (temperature < 26) {

        return 70;

    }

    else {

        return 100;

    }
}


// ==================================================
// UPDATE STATUS COLOR
// ==================================================

function updateStatusAppearance(status) {

    status =
        status.toUpperCase();


    if (status === "NORMAL") {

        systemStatusElement.style.color =
            "#15803d";

    }

    else if (status === "WARNING") {

        systemStatusElement.style.color =
            "#d97706";

    }

    else if (status === "CRITICAL") {

        systemStatusElement.style.color =
            "#dc2626";

    }

    else {

        systemStatusElement.style.color =
            "#6b7280";

    }
}


// ==================================================
// FORMAT DATE
// ==================================================

function formatDate(timestamp) {

    const date =
        new Date(timestamp);


    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );
}


// ==================================================
// FORMAT TIME ONLY
// ==================================================

function formatTime(timestamp) {

    const date =
        new Date(timestamp);


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        }
    );
}


// ==================================================
// UPDATE TEMPERATURE CHART
// ==================================================

function updateTemperatureChart(data) {

    if (!Array.isArray(data)) {

        return;
    }


    const readings =
        [...data].reverse();


    const labels =
        readings.map(item => {

            return formatTime(
                item.timestamp
            );

        });


    const temperatures =
        readings.map(item => {

            return Number(
                item.temperature
            );

        });


    if (temperatureChart) {

        temperatureChart.destroy();

    }


    const chartCanvas =
        document.getElementById(
            "temperatureChart"
        );


    temperatureChart =
        new Chart(
            chartCanvas,
            {

                type: "line",

                data: {

                    labels: labels,

                    datasets: [

                        {

                            label:
                                "Temperature (°C)",

                            data:
                                temperatures,

                            tension: 0.3,

                            fill: true,

                            pointRadius: 4,

                            pointHoverRadius: 6

                        }

                    ]

                },


                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    animation: {

                        duration: 500

                    },

                    interaction: {

                        intersect: false,

                        mode: "index"

                    },

                    plugins: {

                        legend: {

                            display: true

                        }

                    },

                    scales: {

                        x: {

                            title: {

                                display: true,

                                text: "Time"

                            }

                        },

                        y: {

                            title: {

                                display: true,

                                text:
                                    "Temperature (°C)"

                            }

                        }

                    }

                }

            }
        );
}


// ==================================================
// LAST 5 READINGS
// ==================================================

function updateRecentReadings(data) {

    if (!Array.isArray(data)) {

        return;
    }


    // MongoDB data is newest first

    const lastFive =
        data.slice(0, 5);


    if (lastFive.length === 0) {

        readingsTable.innerHTML = `

            <tr>

                <td colspan="4">
                    No readings available
                </td>

            </tr>

        `;

        return;
    }


    readingsTable.innerHTML = "";


    lastFive.forEach(item => {

        const temperature =
            Number(item.temperature);


        // Use backend values if available

        const fanSpeed =
            item.fanSpeed !== undefined
                ? Number(item.fanSpeed)
                : calculateFanSpeed(temperature);


        const status =
            item.status !== undefined
                ? String(item.status).toUpperCase()
                : calculateStatus(temperature);


        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${formatTime(item.timestamp)}
            </td>

            <td class="reading-temperature">
                ${temperature.toFixed(1)} °C
            </td>

            <td class="reading-fan">
                ${fanSpeed}%
            </td>

            <td>
                <span class="condition ${status.toLowerCase()}">
                    ${status}
                </span>
            </td>

        `;


        readingsTable.appendChild(row);

    });
}


// ==================================================
// LOAD DASHBOARD
// ==================================================

async function loadDashboard() {

    await fetchLatestData();

    await fetchHistoryData();

}


// ==================================================
// INITIAL LOAD
// ==================================================

loadDashboard();


// ==================================================
// AUTO REFRESH
// ==================================================

// Every 2 seconds

setInterval(
    loadDashboard,
    2000
);