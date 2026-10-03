// ===================================
// SELECT ELEMENTS FROM THE DOM
// ===================================
const currentOperandEl = document.getElementById('current-operand');
const previousOperandEl = document.getElementById('previous-operand');
const buttons = document.querySelectorAll('.btn');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const themeToggleBtn = document.getElementById('theme-toggle');

// ===================================
// CALCULATOR STATE VARIABLES
// ===================================
let currentOperand = '0';   // number currently being typed
let previousOperand = '';   // first number + operator, shown above
let operation = undefined;  // current operator (+, -, ×, ÷)
let shouldResetScreen = false; // true right after pressing "="

// ===================================
// LOAD HISTORY FROM localStorage
// ===================================
let calculationHistory = JSON.parse(localStorage.getItem('calcHistory')) || [];

// ===================================
// UPDATE DISPLAY SCREEN
// ===================================
function updateDisplay() {
  currentOperandEl.textContent = currentOperand;

  if (operation != null) {
    previousOperandEl.textContent = `${previousOperand} ${operation}`;
  } else {
    previousOperandEl.textContent = '';
  }
}

// ===================================
// APPEND A NUMBER (0-9)
// ===================================
function appendNumber(number) {
  // If a result was just shown, start fresh on new number entry
  if (shouldResetScreen) {
    currentOperand = '';
    shouldResetScreen = false;
  }

  // Prevent multiple leading zeros like "00"
  if (number === '0' && currentOperand === '0') return;

  // Replace initial "0" with the typed number
  if (currentOperand === '0') {
    currentOperand = number;
  } else {
    currentOperand += number;
  }
}

// ===================================
// APPEND A DECIMAL POINT
// ===================================
function appendDecimal() {
  if (shouldResetScreen) {
    currentOperand = '0';
    shouldResetScreen = false;
  }
  // Only one decimal point allowed per number
  if (currentOperand.includes('.')) return;
  currentOperand += '.';
}

// ===================================
// CHOOSE AN OPERATOR (+, -, ×, ÷)
// ===================================
function chooseOperator(selectedOperator) {
  if (currentOperand === '') return;

  // If there is already a pending calculation, solve it first
  if (previousOperand !== '') {
    calculate();
  }

  operation = selectedOperator;
  previousOperand = currentOperand;
  currentOperand = '';
  shouldResetScreen = false;

  highlightActiveOperator(selectedOperator);
}

// Highlight the currently selected operator button
function highlightActiveOperator(selectedOperator) {
  document.querySelectorAll('.operator-btn').forEach((btn) => {
    btn.classList.remove('active');
    if (btn.dataset.value === selectedOperator) {
      btn.classList.add('active');
    }
  });
}

// ===================================
// PERFORM THE CALCULATION (safe, no eval)
// ===================================
function calculate() {
  let result;
  const prev = parseFloat(previousOperand);
  const current = parseFloat(currentOperand);

  // If either value is missing, do nothing
  if (isNaN(prev) || isNaN(current)) return;

  switch (operation) {
    case '+':
      result = prev + current;
      break;
    case '-':
      result = prev - current;
      break;
    case '×':
      result = prev * current;
      break;
    case '÷':
      if (current === 0) {
        // Handle divide by zero without breaking the app
        currentOperand = 'Error: Div by 0';
        previousOperand = '';
        operation = undefined;
        shouldResetScreen = true;
        updateDisplay();
        return;
      }
      result = prev / current;
      break;
    default:
      return;
  }

  // Round long decimals to avoid floating-point issues (e.g. 0.1 + 0.2)
  result = Math.round(result * 100000000) / 100000000;

  // Save this calculation to history before resetting
  const historyEntry = `${previousOperand} ${operation} ${currentOperand} = ${result}`;
  addToHistory(historyEntry);

  currentOperand = result.toString();
  previousOperand = '';
  operation = undefined;
  shouldResetScreen = true;

  document.querySelectorAll('.operator-btn').forEach((btn) => btn.classList.remove('active'));
}

// ===================================
// CLEAR EVERYTHING (C button)
// ===================================
function clearAll() {
  currentOperand = '0';
  previousOperand = '';
  operation = undefined;
  shouldResetScreen = false;
  document.querySelectorAll('.operator-btn').forEach((btn) => btn.classList.remove('active'));
}

// ===================================
// BACKSPACE / DELETE LAST DIGIT
// ===================================
function backspace() {
  if (shouldResetScreen) {
    clearAll();
    return;
  }
  currentOperand = currentOperand.toString().slice(0, -1);
  if (currentOperand === '' || currentOperand === '-') {
    currentOperand = '0';
  }
}

// ===================================
// TOGGLE POSITIVE / NEGATIVE (+/-)
// ===================================
function toggleSign() {
  if (currentOperand === '0' || currentOperand === 'Error: Div by 0') return;
  currentOperand = currentOperand.startsWith('-')
    ? currentOperand.slice(1)
    : '-' + currentOperand;
}

// ===================================
// PERCENTAGE (%)
// ===================================
function applyPercent() {
  if (currentOperand === '' || currentOperand === 'Error: Div by 0') return;
  currentOperand = (parseFloat(currentOperand) / 100).toString();
}

// ===================================
// HISTORY FUNCTIONS
// ===================================
function addToHistory(entry) {
  calculationHistory.unshift(entry); // add newest entry to the top

  // Keep history to a reasonable size
  if (calculationHistory.length > 50) {
    calculationHistory.pop();
  }

  localStorage.setItem('calcHistory', JSON.stringify(calculationHistory));
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = '';

  if (calculationHistory.length === 0) {
    const emptyMsg = document.createElement('li');
    emptyMsg.textContent = 'No calculations yet.';
    emptyMsg.classList.add('history-empty');
    historyList.appendChild(emptyMsg);
    return;
  }

  calculationHistory.forEach((entry) => {
    const li = document.createElement('li');
    li.textContent = entry;
    historyList.appendChild(li);
  });
}

function clearHistory() {
  calculationHistory = [];
  localStorage.removeItem('calcHistory');
  renderHistory();
}

// ===================================
// BUTTON CLICK EVENTS
// ===================================
buttons.forEach((button) => {
  button.addEventListener('click', () => {
    // Number buttons
    if (button.dataset.number) {
      appendNumber(button.dataset.number);
      updateDisplay();
      return;
    }

    const action = button.dataset.action;

    switch (action) {
      case 'operator':
        chooseOperator(button.dataset.value);
        break;
      case 'equals':
        calculate();
        break;
      case 'clear':
        clearAll();
        break;
      case 'backspace':
        backspace();
        break;
      case 'sign':
        toggleSign();
        break;
      case 'percent':
        applyPercent();
        break;
      case 'decimal':
        appendDecimal();
        break;
    }

    updateDisplay();
  });
});

clearHistoryBtn.addEventListener('click', clearHistory);

// ===================================
// KEYBOARD SUPPORT
// ===================================
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') {
    appendNumber(e.key);
  } else if (e.key === '.') {
    appendDecimal();
  } else if (e.key === '+') {
    chooseOperator('+');
  } else if (e.key === '-') {
    chooseOperator('-');
  } else if (e.key === '*') {
    chooseOperator('×');
  } else if (e.key === '/') {
    e.preventDefault(); // stop browser's quick-find from opening
    chooseOperator('÷');
  } else if (e.key === 'Enter' || e.key === '=') {
    calculate();
  } else if (e.key === 'Backspace') {
    backspace();
  } else if (e.key === 'Escape') {
    clearAll();
  } else {
    return; // ignore all other keys
  }

  updateDisplay();
});

// ===================================
// DARK / LIGHT MODE TOGGLE
// ===================================
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('calcTheme', theme);
}

themeToggleBtn.addEventListener('click', () => {
  const currentTheme = document.body.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
});

// ===================================
// INITIAL SETUP ON PAGE LOAD
// ===================================
function init() {
  // Load saved theme, default to light
  const savedTheme = localStorage.getItem('calcTheme') || 'light';
  applyTheme(savedTheme);

  // Load saved history
  renderHistory();

  // Show initial display
  updateDisplay();
}

init();