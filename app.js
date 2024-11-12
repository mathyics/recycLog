function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}


document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.remove('active');
        }
    });
});


let userData = {
    totalItems: 0,
    co2Saved: 0,
    points: 0,
    history: []
};


const co2Savings = {
    plastic: 0.5,
    glass: 0.3,
    paper: 0.2,
    metal: 0.8
};

const leaderboardData = [
    { username: "EcoWarrior", points: 5000 },
    { username: "GreenHero", points: 4500 },
    { username: "RecycleMaster", points: 4000 },
    { username: "EarthSaver", points: 3500 },
    { username: "You", points: 0 }
];

// QR Scanner implementation
let html5QrcodeScanner = null;

function startQRScanner() {
    document.getElementById('qr-modal').style.display = 'block';
    
    if (html5QrcodeScanner === null) {
        html5QrcodeScanner = new Html5QrcodeScanner(
            "qr-reader",
            { 
                fps: 10,
                qrbox: { width: 250, height: 250 }
            }
        );
        
        html5QrcodeScanner.render((decodedText) => {
            try {
                const recycleData = JSON.parse(decodedText);
                if (recycleData.type && recycleData.quantity) {
                    document.getElementById('item-type').value = recycleData.type;
                    document.getElementById('item-quantity').value = recycleData.quantity;
                    
                    closeQRScanner();
                    showLogModal();
                } else {
                    alert('Invalid QR code format');
                }
            } catch (e) {
                alert('Invalid QR code format. Please scan a valid recycling QR code.');
            }
        }, (error) => {
            console.warn(`QR scan error: ${error}`);
        });
    }
}

function closeQRScanner() {
    const modal = document.getElementById('qr-modal');
    modal.style.display = 'none';
    
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(error => {
            console.error('Failed to clear scanner', error);
        });
        html5QrcodeScanner = null;
    }
}

// Theme management
function initTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeButton(theme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    const button = document.getElementById('theme-btn');
    button.textContent = theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme';
}

// Data management
function loadUserData() {
    const saved = localStorage.getItem('recyclogData');
    if (saved) {
        userData = JSON.parse(saved);
    }
}

function saveUserData() {
    localStorage.setItem('recyclogData', JSON.stringify(userData));
}

function updateStats() {
    document.getElementById('total-items').textContent = userData.totalItems;
    document.getElementById('co2-saved').textContent = `${userData.co2Saved.toFixed(1)} kg`;
    document.getElementById('points').textContent = userData.points;
}

function logRecycling() {
    const type = document.getElementById('item-type').value;
    const quantity = parseInt(document.getElementById('item-quantity').value);

    if (quantity > 0) {
        userData.totalItems += quantity;
        userData.co2Saved += co2Savings[type] * quantity;
        userData.points += quantity * 10;

        userData.history.unshift({
            type,
            quantity,
            date: new Date().toISOString()
        });

        saveUserData();
        updateStats();
        updateActivityFeed();
        updateChart();
        updateLeaderboard();
        closeModal();
    }
}

function updateActivityFeed() {
    const feed = document.getElementById('activity-feed');
    feed.innerHTML = '<h3>Recent Activity</h3>';

    userData.history.slice(0, 5).forEach(item => {
        const date = new Date(item.date).toLocaleDateString();
        feed.innerHTML += `
            <div class="feed-item">
                Recycled ${item.quantity} ${item.type} items on ${date}
            </div>
        `;
    });
}

// Charts
function initChart(startDate, endDate) {
    const ctx = document.getElementById('recycling-chart').getContext('2d');
    window.recyclingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Items Recycled',
                data: [],
                borderColor: '#4CAF50',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    updateChart(startDate, endDate);
}

function updateChart(startDate, endDate) {
    const filteredData = userData.history.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
    });

    const dates = filteredData.map(item => new Date(item.date));
    const quantities = filteredData.map(item => item.quantity);

    window.recyclingChart.data.labels = dates;
    window.recyclingChart.data.datasets[0].data = quantities;
    window.recyclingChart.update();
}

function updateChartDateRange() {
    const startDate = new Date(document.getElementById('start-date').value);
    const endDate = new Date(document.getElementById('end-date').value);
    updateChart(startDate, endDate);
}

function initMaterialsChart() {
    const ctx = document.getElementById('materials-chart').getContext('2d');
    window.materialsChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Plastic', 'Glass', 'Paper', 'Metal'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
    updateMaterialsChart();
}

function updateMaterialsChart() {
    const materials = {
        plastic: 0,
        glass: 0,
        paper: 0,
        metal: 0
    };

    userData.history.forEach(item => {
        materials[item.type] += item.quantity;
    });

    window.materialsChart.data.datasets[0].data = Object.values(materials);
    window.materialsChart.update();
}

// Leaderboard
function updateLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    
    leaderboardData.find(user => user.username === "You").points = userData.points;
    leaderboardData.sort((a, b) => b.points - a.points);

    leaderboardList.innerHTML = '';
    
    leaderboardData.forEach((user, index) => {
        const rank = index + 1;
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <span>#${rank}</span>
            <span>${user.username}</span>
            <span>${user.points}</span>
        `;
        if (user.username === "You") {
            item.style.backgroundColor = 'var(--accent-color)';
            item.style.color = 'white';
        }
        leaderboardList.appendChild(item);
    });
}

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    document.getElementById(sectionId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
}

// Modal functions
function showLogModal() {
    document.getElementById('log-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('log-modal').style.display = 'none';
}

// Logout
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('recyclogData');
        location.reload();
    }
}


function initApp() {
    loadUserData();
    updateStats();
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    document.getElementById('start-date').value = startDate.toISOString().split('T')[0];
    document.getElementById('end-date').value = endDate.toISOString().split('T')[0];
    initChart(startDate, endDate);
    initMaterialsChart();
    updateActivityFeed();
    updateLeaderboard();
    initTheme();

  
    window.onclick = function(event) {
        if (event.target.className === 'modal') {
            event.target.style.display = 'none';
            if (event.target.id === 'qr-modal') {
                closeQRScanner();
            }
        }
    };
}


window.onload = initApp;