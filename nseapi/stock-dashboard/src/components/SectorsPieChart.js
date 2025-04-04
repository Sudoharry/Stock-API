import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const SectorsPieChart = ({ sectors }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!sectors || sectors.length === 0) return;

    // Destroy previous chart instance if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    // Prepare data for the pie chart
    const data = {
      labels: sectors.map(sector => sector.name || 'Unknown'),
      datasets: [{
        data: sectors.map(sector => Math.abs(sector.change_percentage)),
        backgroundColor: sectors.map(sector => 
          sector.change_percentage >= 0 
            ? `rgba(16, 185, 129, ${0.6 + Math.abs(sector.change_percentage/10)})`  // Green with varying opacity
            : `rgba(239, 68, 68, ${0.6 + Math.abs(sector.change_percentage/10)})`   // Red with varying opacity
        ),
        borderColor: sectors.map(sector => 
          sector.change_percentage >= 0 ? '#059669' : '#dc2626'
        ),
        borderWidth: 1
      }]
    };

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                family: "'Inter', sans-serif",
                size: 12
              },
              generateLabels: (chart) => {
                const { labels, datasets } = chart.data;
                return labels.map((label, index) => ({
                  text: `${label} (${sectors[index].change_percentage.toFixed(2)}%)`,
                  fillStyle: datasets[0].backgroundColor[index],
                  strokeStyle: datasets[0].borderColor[index],
                  lineWidth: 1,
                  hidden: false,
                  index: index
                }));
              }
            }
          },
          title: {
            display: true,
            text: 'Sector Performance Distribution',
            font: {
              family: "'Inter', sans-serif",
              size: 16,
              weight: 600
            },
            padding: {
              top: 10,
              bottom: 20
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [sectors]);

  return (
    <div className="dashboard-card sectors-chart">
      <div className="card-header">
        <i className="fas fa-chart-pie card-icon"></i>
        <h3>Sector Performance</h3>
      </div>
      <div className="chart-container" style={{ height: '300px', position: 'relative' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default SectorsPieChart; 