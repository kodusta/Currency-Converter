// Main currency converter class
class CurrencyConverter {
    constructor() {
        this.baseUrl = 'api.php';
        this.rates = {};
        this.lastUpdate = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadRates();
    }
    
    initializeElements() {
        this.amountInput = document.getElementById('amount');
        this.fromCurrency = document.getElementById('fromCurrency');
        this.toCurrency = document.getElementById('toCurrency');
        this.resultInput = document.getElementById('result');
        this.convertBtn = document.getElementById('convertBtn');
        this.swapBtn = document.getElementById('swapBtn');
        this.rateInfo = document.getElementById('rateInfo');
        this.rateText = document.getElementById('rateText');
        this.ratesContainer = document.getElementById('ratesContainer');
    }
    
    bindEvents() {
        this.convertBtn.addEventListener('click', () => this.convert());
        this.swapBtn.addEventListener('click', () => this.swapCurrencies());
        
        this.amountInput.addEventListener('input', () => this.autoConvert());
        this.fromCurrency.addEventListener('change', () => this.autoConvert());
        this.toCurrency.addEventListener('change', () => this.autoConvert());
        
        this.amountInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.convert();
            }
        });
    }
    
    // Fetch current exchange rates from API
    async loadRates() {
        try {
            this.showLoading();
            
            const response = await fetch(`${this.baseUrl}?action=getRates`);
            const data = await response.json();
            
            if (data.success) {
                this.rates = data.rates;
                this.lastUpdate = data.date;
                this.displayRates();
                this.autoConvert();
            } else {
                this.showError('Failed to load exchange rates: ' + data.error);
            }
        } catch (error) {
            this.showError('Connection error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    displayRates() {
        const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];
        const baseCurrency = 'TRY';
        
        let html = '';
        
        popularCurrencies.forEach(currency => {
            if (this.rates[currency]) {
                const rate = this.rates[currency];
                html += `
                    <div class="col-6 col-md-4 col-lg-3 mb-3">
                        <div class="rate-card">
                            <div class="rate-currency">${currency}</div>
                            <div class="rate-value">${rate.toFixed(4)}</div>
                            <small class="text-muted">1 ${baseCurrency}</small>
                        </div>
                    </div>
                `;
            }
        });
        
        this.ratesContainer.innerHTML = html;
        
        if (this.lastUpdate) {
            const updateTime = new Date(this.lastUpdate).toLocaleString('tr-TR');
            this.ratesContainer.innerHTML += `
                <div class="col-12">
                    <div class="last-updated">
                        <i class="fas fa-clock me-1"></i>
                        Son güncelleme: ${updateTime}
                    </div>
                </div>
            `;
        }
    }
    
    // Convert currency with validation
    async convert() {
        const amount = parseFloat(this.amountInput.value);
        const from = this.fromCurrency.value;
        const to = this.toCurrency.value;
        
        if (!amount || amount <= 0) {
            this.showError('Please enter a valid amount');
            return;
        }
        
        if (from === to) {
            this.resultInput.value = amount.toFixed(2);
            this.hideRateInfo();
            return;
        }
        
        try {
            this.showLoading();
            
            const response = await fetch(`${this.baseUrl}?action=convert&from=${from}&to=${to}&amount=${amount}`);
            const data = await response.json();
            
            if (data.success) {
                const result = parseFloat(data.result);
                this.resultInput.value = result.toFixed(2);
                this.showRateInfo(data.rate, from, to);
                this.resultInput.classList.add('success-animation');
                setTimeout(() => this.resultInput.classList.remove('success-animation'), 600);
            } else {
                this.showError('Conversion error: ' + data.error);
            }
        } catch (error) {
            this.showError('Connection error: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    autoConvert() {
        if (this.amountInput.value && this.rates[this.fromCurrency.value] && this.rates[this.toCurrency.value]) {
            this.convert();
        }
    }
    
    swapCurrencies() {
        const fromValue = this.fromCurrency.value;
        const toValue = this.toCurrency.value;
        
        this.fromCurrency.value = toValue;
        this.toCurrency.value = fromValue;
        
        this.swapBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            this.swapBtn.style.transform = 'rotate(0deg)';
        }, 300);
        
        this.autoConvert();
    }
    
    showRateInfo(rate, from, to) {
        this.rateText.textContent = `1 ${from} = ${rate.toFixed(4)} ${to}`;
        this.rateInfo.style.display = 'block';
    }
    
    hideRateInfo() {
        this.rateInfo.style.display = 'none';
    }
    
    // Show loading state during API calls
    showLoading() {
        this.convertBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
        this.convertBtn.disabled = true;
        document.body.classList.add('loading');
    }
    
    // Hide loading state
    hideLoading() {
        this.convertBtn.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Convert';
        this.convertBtn.disabled = false;
        document.body.classList.remove('loading');
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle me-2"></i>${message}`;
        
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        this.rateInfo.parentNode.insertBefore(errorDiv, this.rateInfo);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

// Initialize the currency converter when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CurrencyConverter();
});

// Keyboard shortcuts for better UX
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        location.reload();
    }
});
