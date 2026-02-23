const API_URL = '/api';

// Elements
const usersList = document.getElementById('users-list');
const logsBody = document.getElementById('logs-body');
const viewUsersBtn = document.getElementById('view-users-btn');
const viewLogsBtn = document.getElementById('view-logs-btn');
const dashboard = document.getElementById('dashboard');
const logs = document.getElementById('logs');
const errorBanner = document.getElementById('error-banner');
const mainContent = document.getElementById('main-content');

// Modals
const regModal = document.getElementById('register-modal');
const maskModal = document.getElementById('mask-modal');
const payModal = document.getElementById('pay-modal');
const allModals = [regModal, maskModal, payModal];

// Forms
const regForm = document.getElementById('register-form');
const maskForm = document.getElementById('mask-form');
const payForm = document.getElementById('pay-form');

// State for focus trap
let lastFocusedElement = null;

// Helper to escape HTML and prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function showError(message) {
    if (errorBanner) {
        errorBanner.textContent = message;
        errorBanner.classList.remove('hidden');
        errorBanner.setAttribute('aria-hidden', 'false');
        // Auto-hide after 5 seconds
        setTimeout(() => {
            errorBanner.classList.add('hidden');
            errorBanner.setAttribute('aria-hidden', 'true');
        }, 5000);
    }
}

// Modal Toggle Logic with Accessibility
function openModal(modal) {
    lastFocusedElement = document.activeElement;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    mainContent.setAttribute('aria-hidden', 'true');
    mainContent.setAttribute('inert', '');

    // Focus first focusable element
    const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (firstFocusable) firstFocusable.focus();

    // Trap focus
    modal.addEventListener('keydown', trapFocus);
}

function closeModal(modal) {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    mainContent.removeAttribute('aria-hidden');
    mainContent.removeAttribute('inert');
    modal.removeEventListener('keydown', trapFocus);

    if (lastFocusedElement) {
        lastFocusedElement.focus();
    }
}

function trapFocus(e) {
    if (e.key === 'Escape') {
        closeModal(e.currentTarget);
        return;
    }
    if (e.key !== 'Tab') return;

    const modal = e.currentTarget;
    const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
        }
    } else { // Tab
        if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
        }
    }
}

// Global Modal Controls
document.getElementById('open-register-modal').addEventListener('click', () => {
    openModal(regModal);
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
        closeModal(e.target.closest('.modal'));
    });
});

// Close modals on background click
allModals.forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
});

// Toggle Views
viewUsersBtn.addEventListener('click', () => {
    dashboard.classList.remove('hidden');
    logs.classList.add('hidden');
    viewUsersBtn.classList.add('active');
    viewLogsBtn.classList.remove('active');
    fetchUsers();
});

viewLogsBtn.addEventListener('click', () => {
    dashboard.classList.add('hidden');
    logs.classList.remove('hidden');
    viewUsersBtn.classList.remove('active');
    viewLogsBtn.classList.add('active');
    fetchLogs();
});

// Fetch Data
async function fetchUsers() {
    try {
        const res = await fetch(`${API_URL}/users`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const users = await res.json();
        renderUsers(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        showError('Failed to load accounts. Please check your connection.');
        usersList.innerHTML = '<div class="error">Unable to load accounts right now.</div>';
    }
}

async function fetchLogs() {
    try {
        const res = await fetch(`${API_URL}/logs`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        renderLogs(data.reverse());
    } catch (error) {
        console.error('Fetch logs error:', error);
        showError('Failed to load activity logs.');
        renderLogs([]);
    }
}

function renderUsers(users) {
    if (!users || users.length === 0) {
        usersList.innerHTML = '<div class="loading">No accounts found. Register one to get started!</div>';
        return;
    }

    usersList.innerHTML = '';
    users.forEach(user => {
        const primarySource = (user.funding_sources && user.funding_sources.length > 0)
            ? user.funding_sources[0]
            : { id: '', last4: '----', availableBalance: 0, network: 'UNKNOWN' };

        const cardElement = document.createElement('div');
        cardElement.className = 'user-card';

        const content = `
            <div class="user-info">
                <h3>${escapeHTML(user.names)}</h3>
                <p>${escapeHTML(user.email)}</p>
                <div style="font-size: 0.75rem; color: var(--accent); margin-top: 0.5rem;">
                    🔗 Linked Source: ${escapeHTML(primarySource.network)} **** ${escapeHTML(primarySource.last4)}
                </div>
            </div>
            <div class="balance-box">
                <span>Available Funds (at Source)</span>
                <div class="amount">${primarySource.availableBalance.toLocaleString()} RWF</div>
            </div>
            
            <div class="mask-cards-list">
                <label style="font-size: 0.7rem; color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">ACTIVE SUBSCRIPTION SHIELDS</label>
                <div id="masks-${user.user_id}"></div>
            </div>

            <button class="btn-secondary" id="add-mask-${user.user_id}" style="width:100%">+ New Subscription Guard</button>
        `;

        cardElement.innerHTML = content;
        usersList.appendChild(cardElement);

        // Inject Masks
        const masksContainer = document.getElementById(`masks-${user.user_id}`);
        if (user.mask_cards.length === 0) {
            masksContainer.innerHTML = '<p style="color:var(--text-secondary);font-size:0.8rem">No subscription shields active.</p>';
        } else {
            user.mask_cards.forEach(mask => {
                const maskItem = document.createElement('div');
                maskItem.className = 'mask-item';

                const maskInfo = document.createElement('div');
                const statusDot = document.createElement('span');
                statusDot.className = `status ${mask.status.toLowerCase()}`;

                const panText = document.createElement('span');
                panText.title = mask.type;
                panText.textContent = mask.pan.replace(/(.{4})/g, '$1 ');

                maskInfo.appendChild(statusDot);
                maskInfo.appendChild(panText);

                const payBtn = document.createElement('button');
                payBtn.className = 'btn-primary btn-tiny';
                payBtn.textContent = 'Pay';

                if (mask.status === 'ACTIVE') {
                    payBtn.onclick = () => openPayModal(mask.pan);
                } else {
                    payBtn.disabled = true;
                    payBtn.title = "Payments can only be initiated for ACTIVE shields";
                }

                maskItem.appendChild(maskInfo);
                maskItem.appendChild(payBtn);
                masksContainer.appendChild(maskItem);
            });
        }

        // Action Button
        document.getElementById(`add-mask-${user.user_id}`).onclick = () => {
            if (!primarySource.id) {
                showError('User has no valid funding source linked.');
                return;
            }
            openMaskModalInternal(user.user_id, primarySource.id);
        };
    });
}

function renderLogs(logs) {
    logsBody.innerHTML = '';
    if (logs.length === 0) {
        logsBody.innerHTML = '<tr><td colspan="5" style="text-align:center">No transactions found.</td></tr>';
        return;
    }

    logs.forEach(log => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
            <td>${escapeHTML(log.merchant)}</td>
            <td>${log.amount.toLocaleString()} RWF</td>
            <td><span class="status-badge ${log.status.toLowerCase()}">${escapeHTML(log.status)}</span></td>
            <td style="color:var(--text-secondary); font-size: 0.8rem">${escapeHTML(log.failureReason) || '-'}</td>
        `;
        logsBody.appendChild(row);
    });
}

// Action Handlers
regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        names: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        originalCardLast4: document.getElementById('reg-card').value,
        network: document.getElementById('reg-network').value
    };

    try {
        const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Registration failed');
        }

        closeModal(regModal);
        regForm.reset();
        fetchUsers();
    } catch (error) {
        showError(error.message);
    }
});

function openMaskModalInternal(userId, sourceId) {
    document.getElementById('mask-user-id').value = userId;
    document.getElementById('mask-funding-source-id').value = sourceId;
    openModal(maskModal);
}

document.getElementById('mask-type').addEventListener('change', (e) => {
    const field = document.getElementById('merchant-locking-field');
    if (e.target.value === 'MERCHANT_LOCKED') {
        field.classList.remove('hidden');
    } else {
        field.classList.add('hidden');
    }
});

maskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = document.getElementById('mask-user-id').value;
    const type = document.getElementById('mask-type').value;
    const limit = document.getElementById('mask-limit').value;
    const fundingSourceId = document.getElementById('mask-funding-source-id').value;
    const merchant = document.getElementById('mask-merchant').value;

    const data = {
        type,
        limit,
        fundingSourceId,
        useCases: type === 'MERCHANT_LOCKED' ? [merchant] : ['general']
    };

    try {
        const res = await fetch(`${API_URL}/users/${userId}/mask`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create shield');
        }

        closeModal(maskModal);
        maskForm.reset();
        fetchUsers();
    } catch (error) {
        showError(error.message);
    }
});

function openPayModal(pan) {
    document.getElementById('pay-pan').value = pan;
    openModal(payModal);
}

payForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        pan: document.getElementById('pay-pan').value,
        merchant: document.getElementById('pay-merchant').value,
        amount: document.getElementById('pay-amount').value
    };

    try {
        const res = await fetch(`${API_URL}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Connection error');
        }

        const result = await res.json();
        closeModal(payModal);
        payForm.reset();

        if (result.status === 'SUCCESS') {
            alert('Payment Approved ✅ - Funds pulled from linked source.');
        } else {
            alert(`Payment Declined: ${result.failureReason} ❌`);
        }

        fetchUsers();
    } catch (error) {
        showError(error.message);
    }
});

// Initial Load
fetchUsers();
