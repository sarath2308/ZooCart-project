const revenueChart = new Chart(document.getElementById('revenueChart'), {
    type: 'line',
    data: {
        labels: ['Apr 7', 'Apr 8', 'Apr 9', 'Apr 10', 'Apr 11', 'Apr 12'],
        datasets: [{
            label: 'Revenue',
            data: [20000, 25000, 22000, 62000, 30000, 42000],
            borderColor: '#007bff',
            borderWidth: 2,
            fill: false
        }]
    },
});

const salesChart = new Chart(document.getElementById('salesChart'), {
    type: 'doughnut',
    data: {
        labels: ['iOS', 'Android', 'Others'],
        datasets: [{
            data: [40, 50, 10],
            backgroundColor: ['#007bff', '#28a745', '#ffc107']
        }]
    }
});