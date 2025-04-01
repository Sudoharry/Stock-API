// Fetch and Display Stock Data for Dashboard
async function fetchStockData() {
    const threshold = document.getElementById('threshold').value;
    const sectors = document.getElementById('sectors').value.split(',').map(s => s.trim());

    // Show loading animation
    const loader = document.getElementById('loader');
    loader.style.display = 'block';

    try {
        // Fetching stock data from the API
        const response = await fetch(`/api/stock-data?threshold=${threshold}&sectors=${sectors.join(',')}`);
        const data = await response.json();

        // Data to be displayed on the chart
        const ctx = document.getElementById('stockChart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.dates,  // Array of dates
                datasets: data.stocks.map(stock => ({
                    label: stock.name,
                    data: stock.values,  // Array of stock values for each date
                    borderColor: stock.color || '#3498db',  // Dynamic color or default blue
                    backgroundColor: stock.color || 'rgba(52, 152, 219, 0.2)', // Light background color
                    fill: true,
                    tension: 0.3  // Smooth curve for a more dynamic look
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#333',
                        bodyColor: '#333',
                        borderColor: '#3498db',
                        borderWidth: 1,
                        callbacks: {
                            label: function(tooltipItem) {
                                return `${tooltipItem.dataset.label}: ₹${tooltipItem.raw.toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error fetching stock data:', error);
    } finally {
        // Hide loading animation once data is fetched
        loader.style.display = 'none';
    }
}