
// Game State
let gameState = {
    balance: 1000,
    dailySpins: 10,
    cooldownTimer: 0,
    spinHistory: [],
    rewards: [],
    trashItems: [],
    settings: {
        theme: 'light',
        fontSize: 16,
        animations: true
    }
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadGameState();
    updateUI();
    setInterval(updateCooldown, 1000);
    
    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('Service Worker registered:', registration);
            })
            .catch(function(error) {
                console.log('Service Worker registration failed:', error);
            });
    }
    
    // PWA install prompt
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });
    
    // Check if app is already installed
    window.addEventListener('appinstalled', (evt) => {
        hideInstallButton();
        alert('App-ka waa la install garay! 🎉');
    });
});

// Welcome Screen Functions
function startGame() {
    showScreen('main-screen');
    showTab('spin');
}

function createAccount() {
    const name = prompt('Magacaaga geli:');
    if (name) {
        gameState.playerName = name;
        saveGameState();
        alert(`Ku soo dhaweyn ${name}!`);
        startGame();
    }
}

function restoreProgress() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    gameState = { ...gameState, ...data };
                    saveGameState();
                    updateUI();
                    alert('Progress-kaaga si guul leh ayaa loo soo celiyay!');
                    startGame();
                } catch (error) {
                    alert('File-ka ma ahan mid saxan ah!');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Dashboard Functions
function showPrivacyPolicy() {
    alert('Privacy Policy: Waxaan ilaalinaynaa xogahaaga shakhsi ahaaneed. Ma la wadaagno qof kale oo aan ahayn kuwa la ogol yahay.');
}

function shareApp() {
    const shareText = 'Ku soo biir Spin to Win app-ka oo ka guulayso lacag dhabta ah! 🎰💰';
    
    if (navigator.share) {
        navigator.share({
            title: 'Spin to Win - Real Cash App',
            text: shareText,
            url: window.location.href
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareText + ' ' + window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Share link-ka ayaa la copy garay!');
    }
}

// PWA Install Functions
let deferredPrompt;

function showInstallButton() {
    const installBtn = document.createElement('button');
    installBtn.id = 'install-btn';
    installBtn.className = 'dash-btn install-btn';
    installBtn.innerHTML = '📱 Install App';
    installBtn.onclick = installPWA;
    
    const buttonsContainer = document.querySelector('.dashboard-buttons');
    buttonsContainer.insertBefore(installBtn, buttonsContainer.firstChild);
}

function hideInstallButton() {
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
        installBtn.remove();
    }
}

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                hideInstallButton();
            }
            deferredPrompt = null;
        });
    }
}

function rateApp() {
    alert('Mahadsanid! Fadlan na qiimee 5 xiddigood app store-ka! ⭐⭐⭐⭐⭐');
}

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Tab Management
function showTab(tabName) {
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Update content based on tab
    if (tabName === 'wallet') {
        updateWalletTab();
    } else if (tabName === 'rewards') {
        updateRewardsTab();
    } else if (tabName === 'trash') {
        updateTrashTab();
    }
}

// Spin Wheel Functions
function spinWheel() {
    if (gameState.balance < 50) {
        alert('Ma haysid lacag ku filan spin-ka!');
        return;
    }
    
    if (gameState.dailySpins <= 0) {
        alert('Maanta spin-adii ayaa dhammaadeen!');
        return;
    }
    
    if (gameState.cooldownTimer > 0) {
        alert(`Sug ${gameState.cooldownTimer} second!`);
        return;
    }
    
    // Deduct spin cost
    gameState.balance -= 50;
    gameState.dailySpins--;
    gameState.cooldownTimer = 30; // 30 second cooldown
    
    // Disable spin button
    const spinBtn = document.getElementById('spin-btn');
    spinBtn.disabled = true;
    
    // Spin animation
    const wheel = document.getElementById('wheel');
    const randomDegree = Math.floor(Math.random() * 360) + 1440; // At least 4 full rotations
    
    if (gameState.settings.animations) {
        wheel.style.transform = `rotate(${randomDegree}deg)`;
    }
    
    // Calculate result
    setTimeout(() => {
        const sectionIndex = Math.floor(((randomDegree % 360) / 45));
        const sections = document.querySelectorAll('.wheel-section');
        const selectedSection = sections[sectionIndex];
        const reward = parseInt(selectedSection.dataset.reward);
        
        processSpinResult(reward, selectedSection.textContent);
        spinBtn.disabled = false;
        
        // Reset wheel rotation
        setTimeout(() => {
            wheel.style.transition = 'none';
            wheel.style.transform = 'rotate(0deg)';
            setTimeout(() => {
                wheel.style.transition = 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
            }, 50);
        }, 1000);
    }, 3000);
    
    updateUI();
}

function processSpinResult(reward, description) {
    const spin = {
        id: Date.now(),
        reward: reward,
        description: description,
        timestamp: new Date(),
        pinned: false
    };
    
    gameState.balance += reward;
    gameState.spinHistory.unshift(spin);
    
    // Keep only last 50 spins
    if (gameState.spinHistory.length > 50) {
        gameState.spinHistory = gameState.spinHistory.slice(0, 50);
    }
    
    // Add to rewards if significant
    if (reward >= 100) {
        gameState.rewards.push({
            id: Date.now(),
            type: reward >= 500 ? 'jackpot' : 'coins',
            amount: reward,
            description: description,
            date: new Date(),
            category: 'coins'
        });
    }
    
    showSpinResult(reward, description);
    saveGameState();
    updateUI();
}

function showSpinResult(reward, description) {
    const modal = document.getElementById('result-modal');
    const content = document.getElementById('result-content');
    
    let resultHTML = '';
    if (reward > 0) {
        resultHTML = `
            <div class="result-success">
                <h2>🎉 Guul!</h2>
                <p>Waad kasatay:</p>
                <h3>${description}</h3>
                <p class="reward-amount">+${reward} Coins</p>
            </div>
        `;
    } else {
        resultHTML = `
            <div class="result-try-again">
                <h2>😅 Isku day mar kale!</h2>
                <p>Nasiib darro, mar kale isku day!</p>
            </div>
        `;
    }
    
    content.innerHTML = resultHTML;
    modal.style.display = 'block';
    
    // Auto close after 3 seconds
    setTimeout(() => {
        modal.style.display = 'none';
    }, 3000);
}

function quickSpin() {
    if (document.querySelector('.tab-content.active').id !== 'spin-tab') {
        showTab('spin');
    }
    spinWheel();
}

// Cooldown Timer
function updateCooldown() {
    if (gameState.cooldownTimer > 0) {
        gameState.cooldownTimer--;
        document.getElementById('cooldown-timer').textContent = gameState.cooldownTimer;
    }
}

// Wallet Functions
function updateWalletTab() {
    // Update balance display
    document.getElementById('wallet-balance').textContent = gameState.balance;
    
    // Add event listeners for payment methods
    document.querySelectorAll('.payment-method').forEach(method => {
        method.addEventListener('click', function() {
            document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
            this.classList.add('selected');
            const methodName = this.querySelector('span').textContent;
            document.querySelector('.payment-input').value = methodName;
        });
    });
    
    // Add event listeners for amount buttons
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Add withdraw button functionality
    document.querySelector('.withdraw-btn').addEventListener('click', function() {
        const selectedAmount = document.querySelector('.amount-btn.selected');
        const selectedMethod = document.querySelector('.payment-method.selected');
        
        if (!selectedAmount) {
            alert('Fadlan dooro amount!');
            return;
        }
        
        if (!selectedMethod) {
            alert('Fadlan dooro payment method!');
            return;
        }
        
        const dollarAmount = parseInt(selectedAmount.dataset.amount);
        const amount = dollarAmount * 10; // Convert to coins
        
        // Check if user has enough coins
        if (gameState.balance < amount) {
            alert('Ma haysid lacag ku filan withdraw-ka!');
            return;
        }
        
        // Check minimum coins requirement for $30
        if (dollarAmount >= 30 && gameState.balance < 300000) {
            alert('Waxaad u baahan tahay ugu yaraan 300,000 coins si aad $30 ama ka badan u withdraw gareeyso!');
            return;
        }
        
        gameState.balance -= amount;
        saveGameState();
        updateUI();
        alert(`Guul leh! $${dollarAmount} ayaa lagu withdraw gareysay ${selectedMethod.querySelector('span').textContent}!`);
        
        // Reset selections
        document.querySelectorAll('.amount-btn, .payment-method').forEach(el => el.classList.remove('selected'));
        document.querySelector('.payment-input').value = '';
    });
    
    // Add claim button functionality
    document.querySelector('.claim-btn').addEventListener('click', function() {
        gameState.balance += 500; // Add $50 worth of coins
        saveGameState();
        updateUI();
        alert('Guul! $50 ayaa lagu daray wallet-kaaga!');
    });
}

function setWalletView(viewType) {
    const buttons = document.querySelectorAll('.view-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="setWalletView('${viewType}')"]`).classList.add('active');
    
    const transactionsList = document.getElementById('wallet-transactions');
    if (viewType === 'grid') {
        transactionsList.className = 'transactions-grid';
    } else {
        transactionsList.className = 'transactions-list';
    }
}

// Rewards Functions
function updateRewardsTab() {
    const rewardsList = document.getElementById('rewards-list');
    let rewardsHTML = '';
    
    gameState.rewards.forEach(reward => {
        rewardsHTML += `
            <div class="card reward-item" data-category="${reward.category}">
                <div class="reward-header">
                    <h4>${reward.description}</h4>
                    <button class="pin-btn" onclick="togglePin(${reward.id})" title="Pin/Unpin">
                        <i class="fas fa-thumbtack ${reward.pinned ? 'pinned' : ''}"></i>
                    </button>
                </div>
                <p class="reward-amount">${reward.amount} Coins</p>
                <p class="reward-date">${formatDate(reward.date)}</p>
                <div class="reward-actions">
                    <button class="btn-secondary" onclick="shareReward(${reward.id})">
                        <i class="fas fa-share"></i> Share
                    </button>
                    <button class="btn-danger" onclick="moveToTrash(${reward.id}, 'reward')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    rewardsList.innerHTML = rewardsHTML || '<p>Wali ma haysid rewards!</p>';
}

function filterRewards(category) {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    const rewardItems = document.querySelectorAll('.reward-item');
    rewardItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function searchRewards() {
    const searchTerm = document.getElementById('rewards-search').value.toLowerCase();
    const rewardItems = document.querySelectorAll('.reward-item');
    
    rewardItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function togglePin(rewardId) {
    const reward = gameState.rewards.find(r => r.id === rewardId);
    if (reward) {
        reward.pinned = !reward.pinned;
        saveGameState();
        updateRewardsTab();
    }
}

function shareReward(rewardId) {
    const reward = gameState.rewards.find(r => r.id === rewardId);
    if (reward) {
        const shareText = `Waxaan ku guuleystay ${reward.description} Spin to Win app-ka! 🎰`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Spin to Win - Guul!',
                text: shareText
            });
        } else {
            // Fallback for browsers that don't support native sharing
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Share text-ka ayaa la copy garay!');
        }
    }
}

// Trash Functions
function moveToTrash(itemId, itemType) {
    let item;
    if (itemType === 'reward') {
        const index = gameState.rewards.findIndex(r => r.id === itemId);
        if (index !== -1) {
            item = gameState.rewards.splice(index, 1)[0];
        }
    } else if (itemType === 'spin') {
        const index = gameState.spinHistory.findIndex(s => s.id === itemId);
        if (index !== -1) {
            item = gameState.spinHistory.splice(index, 1)[0];
        }
    }
    
    if (item) {
        gameState.trashItems.push({
            ...item,
            deletedAt: new Date(),
            originalType: itemType
        });
        saveGameState();
        updateUI();
        alert('Item-ka waxaa la diray trash-ka!');
    }
}

function updateTrashTab() {
    const trashList = document.getElementById('trash-list');
    let trashHTML = '';
    
    gameState.trashItems.forEach(item => {
        trashHTML += `
            <div class="card trash-item">
                <div class="item-header">
                    <h4>${item.description || item.name}</h4>
                    <span class="item-type">${item.originalType}</span>
                </div>
                <p>Deleted: ${formatDate(item.deletedAt)}</p>
                <div class="trash-actions">
                    <button class="btn-secondary" onclick="restoreFromTrash(${item.id})">
                        <i class="fas fa-undo"></i> Restore
                    </button>
                    <button class="btn-danger" onclick="permanentDelete(${item.id})">
                        <i class="fas fa-times"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });
    
    trashList.innerHTML = trashHTML || '<p>Trash-ka ma jirto wax!</p>';
}

function restoreFromTrash(itemId) {
    const index = gameState.trashItems.findIndex(t => t.id === itemId);
    if (index !== -1) {
        const item = gameState.trashItems.splice(index, 1)[0];
        
        if (item.originalType === 'reward') {
            delete item.deletedAt;
            delete item.originalType;
            gameState.rewards.push(item);
        } else if (item.originalType === 'spin') {
            delete item.deletedAt;
            delete item.originalType;
            gameState.spinHistory.unshift(item);
        }
        
        saveGameState();
        updateTrashTab();
        alert('Item-ka waa la soo celiyay!');
    }
}

function permanentDelete(itemId) {
    if (confirm('Ma hubtaa inaad si joogto ah u tirtirto item-kan?')) {
        const index = gameState.trashItems.findIndex(t => t.id === itemId);
        if (index !== -1) {
            gameState.trashItems.splice(index, 1);
            saveGameState();
            updateTrashTab();
            alert('Item-ka si joogto ah ayaa loo tirtiri!');
        }
    }
}

function clearTrash() {
    if (confirm('Ma hubtaa inaad dhammaan trash-ka tirtirto?')) {
        gameState.trashItems = [];
        saveGameState();
        updateTrashTab();
        alert('Trash-ka waa la nadiifiya!');
    }
}

// Settings Functions
function changeTheme() {
    const theme = document.getElementById('theme-select').value;
    gameState.settings.theme = theme;
    
    if (theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.body.setAttribute('data-theme', theme);
    }
    
    saveGameState();
}

function changeFontSize() {
    const fontSize = document.getElementById('font-size').value;
    gameState.settings.fontSize = fontSize;
    document.documentElement.style.setProperty('--font-size', fontSize + 'px');
    saveGameState();
}

function toggleAnimations() {
    gameState.settings.animations = document.getElementById('animations').checked;
    saveGameState();
}

function backupData() {
    const dataBlob = new Blob([JSON.stringify(gameState, null, 2)], {
        type: 'application/json'
    });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spin-to-win-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('Backup-ka waa la sameeyay!');
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    gameState = { ...gameState, ...data };
                    saveGameState();
                    updateUI();
                    alert('Data-da waa la soo celiyay!');
                } catch (error) {
                    alert('File-ka ma ahan mid saxan ah!');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

function resetApp() {
    if (confirm('Ma hubtaa inaad dib u dejiso app-ka? Dhammaan data-da way baabbi\'i doontaa!')) {
        localStorage.removeItem('spinToWinGameState');
        location.reload();
    }
}

// Utility Functions
function formatDate(date) {
    if (!(date instanceof Date)) {
        date = new Date(date);
    }
    return date.toLocaleDateString('so-SO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateUI() {
    // Update balance displays
    document.getElementById('balance').textContent = gameState.balance;
    document.getElementById('wallet-balance').textContent = gameState.balance;
    
    // Update welcome screen balance if it exists
    const welcomeBalance = document.getElementById('welcome-balance');
    if (welcomeBalance) {
        welcomeBalance.textContent = gameState.balance;
    }
    
    // Update daily spins
    document.getElementById('daily-spins').textContent = gameState.dailySpins;
    
    // Update recent spins
    updateRecentSpins();
    
    // Apply settings
    applySettings();
}

function updateRecentSpins() {
    const recentSpinsList = document.getElementById('recent-spins-list');
    const recentSpins = gameState.spinHistory.slice(0, 5);
    
    let spinsHTML = '';
    recentSpins.forEach(spin => {
        spinsHTML += `
            <div class="list-item">
                <div class="item-details">
                    <div class="item-title">${spin.description}</div>
                    <div class="item-subtitle">${formatDate(spin.timestamp)}</div>
                </div>
                <div class="item-value ${spin.reward > 0 ? 'positive' : 'neutral'}">
                    ${spin.reward} Coins
                </div>
            </div>
        `;
    });
    
    recentSpinsList.innerHTML = spinsHTML || '<p>Wali ma jiraan spins!</p>';
}

function applySettings() {
    // Apply theme
    if (gameState.settings.theme === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.body.setAttribute('data-theme', gameState.settings.theme);
    }
    
    // Apply font size
    document.documentElement.style.setProperty('--font-size', gameState.settings.fontSize + 'px');
    
    // Update settings controls
    document.getElementById('theme-select').value = gameState.settings.theme;
    document.getElementById('font-size').value = gameState.settings.fontSize;
    document.getElementById('animations').checked = gameState.settings.animations;
}

// Local Storage Functions
function saveGameState() {
    localStorage.setItem('spinToWinGameState', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('spinToWinGameState');
    if (saved) {
        const parsedState = JSON.parse(saved);
        gameState = { ...gameState, ...parsedState };
        
        // Convert date strings back to Date objects
        gameState.spinHistory.forEach(spin => {
            spin.timestamp = new Date(spin.timestamp);
        });
        gameState.rewards.forEach(reward => {
            reward.date = new Date(reward.date);
        });
        gameState.trashItems.forEach(item => {
            if (item.deletedAt) item.deletedAt = new Date(item.deletedAt);
            if (item.timestamp) item.timestamp = new Date(item.timestamp);
            if (item.date) item.date = new Date(item.date);
        });
    }
}

// Modal Functions
function closeModal() {
    document.getElementById('result-modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('result-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Daily reset (check every hour)
setInterval(() => {
    const now = new Date();
    const lastReset = gameState.lastDailyReset ? new Date(gameState.lastDailyReset) : new Date(0);
    
    if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth()) {
        gameState.dailySpins = 10;
        gameState.lastDailyReset = now;
        saveGameState();
        updateUI();
    }
}, 3600000); // Check every hour
