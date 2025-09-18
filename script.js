// Referências aos elementos HTML
const balanceElement = document.getElementById('balance');
const form = document.getElementById('transaction-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const transactionList = document.getElementById('transaction-list');
const chartCanvas = document.getElementById('myChart');
const monthSelector = document.getElementById('month-selector');

// Objeto para armazenar as transações, organizadas por mês e ano
// Exemplo: { "2023-09": [...], "2023-10": [...] }
let monthlyData = {};
let myChart;

// --- Funções para Salvar e Carregar dados ---

function saveMonthlyData() {
    localStorage.setItem('monthlyData', JSON.stringify(monthlyData));
}

function loadMonthlyData() {
    const savedData = localStorage.getItem('monthlyData');
    if (savedData) {
        monthlyData = JSON.parse(savedData);
    }
}

// --- Funções para Gerenciar o Seletor de Mês ---

function getFormattedMonth(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function updateMonthSelector() {
    monthSelector.innerHTML = '';
    const months = Object.keys(monthlyData).sort().reverse();
    
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = formatMonthForDisplay(month);
        monthSelector.appendChild(option);
    });

    if (months.length === 0) {
        monthSelector.innerHTML = '<option value="">Sem dados</option>';
    }
}

function formatMonthForDisplay(monthKey) {
    const [year, month] = monthKey.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// --- Funções para Renderizar e Atualizar a Interface ---

function renderCurrentMonth() {
    const selectedMonth = monthSelector.value;
    const transactionsForMonth = monthlyData[selectedMonth] || [];
    
    // Atualiza saldo, lista e gráfico para o mês selecionado
    updateBalance(transactionsForMonth);
    renderTransactions(transactionsForMonth);
    updateChart(transactionsForMonth);
}

function updateBalance(transactions) {
    const total = transactions.reduce((sum, transaction) => {
        const amount = parseFloat(transaction.amount);
        return transaction.type === 'receita' ? sum + amount : sum - amount;
    }, 0);
    
    balanceElement.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function renderTransactions(transactions) {
    transactionList.innerHTML = '';
    transactions.forEach(transaction => {
        const listItem = document.createElement('li');
        listItem.classList.add('transaction-item');
        
        const amountClass = transaction.type === 'receita' ? 'income' : 'expense';
        const formattedAmount = parseFloat(transaction.amount).toFixed(2).replace('.', ',');

        listItem.innerHTML = `
            <span>${transaction.description}</span>
            <span class="${amountClass}">R$ ${formattedAmount}</span>
        `;
        transactionList.appendChild(listItem);
    });
}

function updateChart(transactions) {
    const groupedData = transactions.reduce((acc, transaction) => {
        const type = transaction.type;
        const amount = parseFloat(transaction.amount);
        if (!acc[type]) {
            acc[type] = 0;
        }
        acc[type] += amount;
        return acc;
    }, {});

    const labels = Object.keys(groupedData).map(type => type === 'receita' ? 'Receitas' : 'Despesas');
    const data = Object.values(groupedData);
    const backgroundColors = [
        '#2ecc71', // Receitas
        '#e74c3c'  // Despesas
    ];

    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart(chartCanvas, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColors,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: false,
                }
            }
        }
    });
}

// --- Eventos ---

form.addEventListener('submit', (event) => {
    event.preventDefault();

    const newTransaction = {
        description: descriptionInput.value,
        amount: amountInput.value,
        type: typeSelect.value
    };

    const currentMonthKey = getFormattedMonth(new Date());

    if (!monthlyData[currentMonthKey]) {
        monthlyData[currentMonthKey] = [];
    }

    monthlyData[currentMonthKey].push(newTransaction);
    
    saveMonthlyData();
    updateMonthSelector();
    monthSelector.value = currentMonthKey;
    renderCurrentMonth();

    descriptionInput.value = '';
    amountInput.value = '';
});

monthSelector.addEventListener('change', renderCurrentMonth);

// --- Inicialização do Aplicativo ---

loadMonthlyData();
updateMonthSelector();
const currentMonth = getFormattedMonth(new Date());
if (Object.keys(monthlyData).length === 0) {
    monthlyData[currentMonth] = [];
    updateMonthSelector();
}
if (monthSelector.value) {
    renderCurrentMonth();
} else {
    monthSelector.value = currentMonth;
    renderCurrentMonth();
}