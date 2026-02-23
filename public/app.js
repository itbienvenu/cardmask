const API_URL = 'http://localhost:3000/api';

// Elements
const usersList = document.getElementById('users-list');
const logsBody = document.getElementById('logs-body');
const viewUsersBtn = document.getElementById('view-users-btn');
const viewLogsBtn = document.getElementById('view-logs-btn');
const dashboard = document.getElementById('dashboard');
const logs = document.getElementById('logs');

// Modals
const regModal = document.getElementById('register-modal');
const maskModal = document.getElementById('mask-modal');
const payModal = document.getElementById('pay-modal');

// Forms
const regForm = document.getElementById('register-form');
const maskForm = document.getElementById('mask-form');
const payForm = document.getElementById('pay-form');

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

// Modal Controls
document.getElementById('open-register-modal').addEventListener('click', () => {
    regModal.classList.remove('hidden');
});

document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    });
});

// Fetch Data
async function fetchUsers() {
    const res = await fetch(`${API_URL}/users`);
    const users = await res.json();
    renderUsers(users);
}

async function fetchLogs() {
    const res = await fetch(`${API_URL}/logs`);
    const data = await res.json();
    renderLogs(data.reverse());
}

function renderUsers(users) {
    usersList.innerHTML = users.map(user => {
        // Find the primary funding source for display
        const primarySource = user.funding_sources[0] || { last4: '----', available_balance: 0 };

        return `
            <div class="user-card">
                <div class="user-info">
                    <h3>${user.names}</h3>
                    <p>${user.email}</p>
                    <div style="font-size: 0.75rem; color: var(--accent); margin-top: 0.5rem;">
                        🔗 Linked Source: ${primarySource.network} **** ${primarySource.last4}
                    </div>
                </div>
                <div class="balance-box">
                    <span>Available Funds (at Source)</span>
                    <div class="amount">${primarySource.available_balance.toLocaleString()} RWF</div>
                </div>
                
                <div class="mask-cards-list">
                    <label style="font-size: 0.7rem; color: var(--text-secondary); display: block; margin-bottom: 0.5rem;">ACTIVE SUBSCRIPTION SHIELDS</label>
                    ${user.mask_cards.map(mask => `
                        <div class="mask-item">
                            <div>
                                <span class="status ${mask.status.toLowerCase()}"></span>
                                <span title="${mask.type}">${mask.pan.replace(/(.{4})/g, '$1 ')}</span>
                            </div>
                            ${mask.status === 'ACTIVE'
                                ? `<button class="btn-primary btn-tiny" onclick="openPayModal('${mask.pan}')">Pay</button>`
                                : `<button class="btn-primary btn-tiny" disabled title="Payments can only be initiated for ACTIVE shields">Pay</button>`
                            }
                        </div>
                    `).join('')}
                    ${user.mask_cards.length === 0 ? '<p style="color:var(--text-secondary);font-size:0.8rem">No subscription shields active.</p>' : ''}
                </div>

                <button class="btn-secondary" onclick="openMaskModal('${user.user_id}', '${primarySource.id}')" style="width:100%">+ New Subscription Guard</button>
            </div>
        `;
    }).join('');
}

function renderLogs(logs) {
    logsBody.innerHTML = logs.map(log => `
        <tr>
            <td>${new Date(log.timestamp).toLocaleTimeString()}</td>
            <td>${log.merchant}</td>
            <td>${log.amount.toLocaleString()} RWF</td>
            <td><span class="status-badge ${log.status.toLowerCase()}">${log.status}</span></td>
            <td style="color:var(--text-secondary); font-size: 0.8rem">${log.failureReason || '-'}</td>
        </tr>
    `).join('');
}

// Actions
regForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        names: document.getElementById('reg-name').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value,
        originalCardLast4: document.getElementById('reg-card').value,
        network: document.getElementById('reg-network').value
    };

    await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    regModal.classList.add('hidden');
    regForm.reset();
    fetchUsers();
});

window.openMaskModal = (userId, sourceId) => {
    document.getElementById('mask-user-id').value = userId;
    document.getElementById('mask-orig-last4').value = sourceId; // Repurposing field for sourceId
    maskModal.classList.remove('hidden');
};

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
    const fundingSourceId = document.getElementById('mask-orig-last4').value;
    const merchant = document.getElementById('mask-merchant').value;

    const data = {
        type,
        limit,
        fundingSourceId,
        useCases: type === 'MERCHANT_LOCKED' ? [merchant] : ['general']
    };

    await fetch(`${API_URL}/users/${userId}/mask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    maskModal.classList.add('hidden');
    maskForm.reset();
    fetchUsers();
});

window.openPayModal = (pan) => {
    document.getElementById('pay-pan').value = pan;
    payModal.classList.remove('hidden');
};

payForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        pan: document.getElementById('pay-pan').value,
        merchant: document.getElementById('pay-merchant').value,
        amount: document.getElementById('pay-amount').value
    };

    const res = await fetch(`${API_URL}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    const result = await res.json();
    payModal.classList.add('hidden');
    payForm.reset();

    if (result.status === 'SUCCESS') {
        alert('Payment Approved ✅ - Funds pulled from linked source.');
    } else {
        alert(`Payment Declined: ${result.failureReason} ❌`);
    }

    fetchUsers();
});

// Initial Load
fetchUsers();
