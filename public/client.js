// Centralized URL and Socket Logic
const getBaseUrl = () => {
    // Local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `http://localhost:5050`;
    }
    // Production or relative
    return window.location.origin;
};

window.baseUrl = getBaseUrl();
const baseUrl = window.baseUrl; // Local alias

window.socket = (typeof io !== 'undefined') ? io(window.baseUrl) : null;
const socket = window.socket;

if (socket) {
    console.log('[Socket] Initialized at:', window.baseUrl);
    socket.on('connect', () => console.log('[Socket] Connected to server:', socket.id));
    socket.on('connect_error', (err) => console.error('[Socket] Connection error:', err));
} else {
    console.warn('[Socket] Socket.io not found. Real-time updates disabled.');
}

// Custom Toast System
window.showToast = (message, type = 'success') => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
    toast.innerHTML = `<span style="font-size:1.2rem">${icon}</span> ${message}`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
    
    toast.onclick = () => toast.remove();
};

// Helper to resolve absolute URLs for local assets
function formatImageUrl(url) {
    if (url && url.startsWith('/')) {
        return baseUrl + url;
    }
    return url;
}

// Helper to format currency in Indian numbering system
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN').format(amount);
}

if (socket) {
    socket.on('newBid', (data) => {
        console.log('New bid received:', data);
        
        // Update current bid if on item page
        const currentId = new URLSearchParams(window.location.search).get('id');
        if (currentId === data.itemId) {
            const bidVal = document.getElementById('item-current-bid');
            if (bidVal) {
                bidVal.innerText = `₹${formatCurrency(data.bidAmount)}`;
                bidVal.classList.add('price-up');
                setTimeout(() => bidVal.classList.remove('price-up'), 2000);
            }
            
            // Add to history table
            const historyTable = document.getElementById('bidding-history');
            if (historyTable) {
                const row = `
                    <tr>
                        <td>${data.userName}</td>
                        <td class="price-up">₹${formatCurrency(data.bidAmount)}</td>
                        <td>Just now</td>
                    </tr>
                `;
                historyTable.insertAdjacentHTML('afterbegin', row);
            }

            // Update hint
            const hint = document.getElementById('bid-hint');
            if (hint) {
                hint.innerText = `Minimum bid: ₹${formatCurrency(data.bidAmount + 1)}`;
            }

            // Update quick bids
            const quickBids = document.getElementById('quick-bid-buttons');
            if (quickBids) {
                quickBids.innerHTML = `
                    <button type="button" class="btn btn-outline" style="border-radius: 99px; padding: 0.6rem 1.2rem; font-size: 0.85rem; font-weight: 700; border-color: rgba(255,255,255,0.15);" onclick="window.setQuickBid(${data.bidAmount + 1000})">+₹1,000</button>
                    <button type="button" class="btn btn-outline" style="border-radius: 99px; padding: 0.6rem 1.2rem; font-size: 0.85rem; font-weight: 700; border-color: rgba(255,255,255,0.15);" onclick="window.setQuickBid(${data.bidAmount + 5000})">+₹5,000</button>
                    <button type="button" class="btn btn-outline" style="border-radius: 99px; padding: 0.6rem 1.2rem; font-size: 0.85rem; font-weight: 700; border-color: rgba(255,255,255,0.15);" onclick="window.setQuickBid(${data.bidAmount + 10000})">+₹10,000</button>
                `;
            }
        }


        // Update dashboard price if visible
        const cardBid = document.querySelector(`[data-item-id="${data.itemId}"] .curr-bid-value`);
        if (cardBid) {
            cardBid.innerText = `₹${formatCurrency(data.bidAmount)}`;
            cardBid.classList.add('price-up');
            setTimeout(() => cardBid.classList.remove('price-up'), 2000);
        }
    });
}

// Global UI Functions
window.fetchItems = async () => {
    const category = document.getElementById('category-filter')?.value || '';
    const sortByBid = document.getElementById('sort-filter')?.value || '';
    const search = document.getElementById('search-input')?.value || '';
    
    const params = new URLSearchParams({ category, sortByBid, search });
    
    try {
        const res = await fetch(`${baseUrl}/api/items?${params.toString()}`);
        const items = await res.json();
        
        const container = document.getElementById('items-container');
        if (!container) return;

        if (items.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 6rem 2rem;" class="glass reveal">
                    <div style="font-size: 5rem; opacity: 0.6; margin-bottom: 1.5rem; filter: drop-shadow(0 0 20px rgba(99, 102, 241, 0.4));">🔍</div>
                    <h3 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-main);">No Assets Found</h3>
                    <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 2.5rem; max-width: 400px; margin-inline: auto;">We couldn't find any live auctions matching your current filter criteria.</p>
                    <button class="btn btn-primary" onclick="document.getElementById('search-input').value=''; document.getElementById('category-filter').value=''; document.getElementById('sort-filter').value=''; window.fetchItems()" style="border-radius: 99px; padding: 0.8rem 2.5rem; font-weight: 700;">Reset All Filters</button>
                </div>
            `;
            window.initScrollReveal();
            return;
        }

        container.innerHTML = items.map(item => `
            <div class="item-card reveal" onclick="window.location.href='item.html?id=${item._id}'" data-item-id="${item._id}">
                <div class="item-img-wrapper">
                    <img src="${formatImageUrl(item.imageUrl)}" alt="${item.title}" class="item-img" onerror="this.src='https://placehold.co/600x400/1e293b/a855f7?text=No+Image'">
                    <div class="item-badge">
                         <div class="dot"></div>
                         <span>LIVE AUCTION</span>
                    </div>
                </div>
                <div class="item-info">
                    <div class="item-category">${item.category}</div>
                    <h3 class="item-title">${item.title}</h3>
                    <div class="item-stats-box">
                        <div>
                            <div class="stat-label">Current Bid</div>
                            <div class="stat-value price-value curr-bid-value">₹${formatCurrency(item.currentBid)}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="stat-label">Time Left</div>
                            <div class="stat-value timer" id="timer-${item._id}" data-endtime="${item.endTime}">--:--:--</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Start countdowns
        startCountdowns();
        // Initialize reveal animations for new items
        window.initScrollReveal();
    } catch (err) {
        console.error('Fetch items error:', err);
        const container = document.getElementById('items-container');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 6rem 2rem;" class="glass reveal">
                    <div style="font-size: 4rem; margin-bottom: 1.5rem;">⚠️</div>
                    <h3 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; color: #ef4444;">Connection Failed</h3>
                    <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 2.5rem; max-width: 400px; margin-inline: auto;">Please ensure the backend server is running and accessible.</p>
                </div>
            `;
        }
    }
};

window.fetchItemDetails = async (itemId) => {
    try {
        const res = await fetch(`${baseUrl}/api/items/${itemId}`);
        const item = await res.json();
        
        const content = document.getElementById('item-detail-content');
        if (!content) return;

        if (!res.ok) {
            content.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem;" class="glass reveal">
                    <div style="font-size: 4rem; margin-bottom: 1.5rem;">⚠️</div>
                    <h3 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; color: #ef4444;">Asset Not Found</h3>
                    <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 2.5rem; max-width: 400px; margin-inline: auto;">The auction item you are looking for does not exist, has been removed, or the server is unreachable.</p>
                    <button class="btn btn-primary" onclick="window.location.href='dashboard.html'">Back to Marketplace</button>
                </div>
            `;
            return;
        }

        content.innerHTML = `
            <div class="detail-grid" style="align-items: start; gap: 2.5rem;">
                <div class="reveal">
                    <div class="glass" style="padding: 1rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; background: rgba(0,0,0,0.2);">
                         <img src="${formatImageUrl(item.imageUrl)}" alt="${item.title}" class="detail-img" style="border-radius: 16px; width: 100%; height: auto; display: block;" onerror="this.src='https://placehold.co/600x400/1e293b/a855f7?text=No+Image'">
                    </div>
                </div>
                <div class="reveal" style="animation-delay: 0.2s;">
                    <div class="badge" style="background: rgba(99, 102, 241, 0.1); color: var(--primary); padding: 0.5rem 1rem; border-radius: 99px; font-size: 0.7rem; font-weight: 700; letter-spacing: 1px; margin-bottom: 1.2rem; display: inline-block;">${item.category}</div>
                    <h1 style="font-size: 3rem; font-weight: 800; line-height: 1; margin-bottom: 1.5rem; letter-spacing: -1.5px;" class="gradient-text">${item.title}</h1>
                    <p style="color: var(--text-muted); font-size: 1rem; line-height: 1.6; margin-bottom: 2rem;">${item.description}</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; border-top: 1px solid var(--glass-border); padding-top: 2rem;">
                        <div>
                            <div class="curr-bid-label" style="text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1.5px; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">Current Highest Bid</div>
                            <div id="item-current-bid" class="curr-bid-value glow-text" style="font-size: 2.8rem; color: var(--primary); font-weight: 800; letter-spacing: -1px;">₹${formatCurrency(item.currentBid)}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="curr-bid-label" style="text-transform: uppercase; font-size: 0.7rem; letter-spacing: 1.5px; font-weight: 700; color: var(--text-muted); margin-bottom: 0.5rem;">Auction Ends In</div>
                            <div id="detail-timer" class="timer" style="font-size: 1.8rem; font-weight: 800; color: white;" data-endtime="${item.endTime}">--:--:--</div>
                        </div>
                    </div>

                    <div style="background: rgba(99, 102, 241, 0.05); padding: 1.2rem; border-radius: 20px; border: 1px solid var(--primary-glow); display: flex; align-items: center; gap: 1rem;">
                         <div style="width: 40px; height: 40px; background: var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">🔒</div>
                         <div>
                            <div style="font-weight: 700; font-size: 0.9rem;">Buyer Protection Guaranteed</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">Secure escrow & verified high-value asset transfer.</div>
                         </div>
                    </div>
                </div>
            </div>
        `;

        const hint = document.getElementById('bid-hint');
        if (hint) hint.innerText = `Minimum bid: ₹${formatCurrency(item.currentBid + 1)}`;
        
        const quickBids = document.getElementById('quick-bid-buttons');
        if (quickBids) {
             quickBids.innerHTML = `
                <button type="button" class="btn btn-outline" style="border-radius: 99px; padding: 0.6rem 1.2rem; font-size: 0.85rem; font-weight: 700; border-color: rgba(255,255,255,0.15);" onclick="window.setQuickBid(${item.currentBid + 1000})">+₹1,000</button>
                <button type="button" class="btn btn-outline" style="border-radius: 99px; padding: 0.6rem 1.2rem; font-size: 0.85rem; font-weight: 700; border-color: rgba(255,255,255,0.15);" onclick="window.setQuickBid(${item.currentBid + 5000})">+₹5,000</button>
                <button type="button" class="btn btn-outline" style="border-radius: 99px; padding: 0.6rem 1.2rem; font-size: 0.85rem; font-weight: 700; border-color: rgba(255,255,255,0.15);" onclick="window.setQuickBid(${item.currentBid + 10000})">+₹10,000</button>
             `;
        }

        startCountdowns();
        // Initialize reveal animations
        window.initScrollReveal();
    } catch (err) {
        console.error('Fetch detail error:', err);
        const content = document.getElementById('item-detail-content');
        if (content) {
            content.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem;" class="glass reveal">
                    <div style="font-size: 4rem; margin-bottom: 1.5rem;">📡</div>
                    <h3 style="font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; color: #ef4444;">Connection Failed</h3>
                    <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 2.5rem; max-width: 400px; margin-inline: auto;">Could not connect to the backend server. Please verify it is running.</p>
                </div>
            `;
        }
    }
};

window.fetchBiddingHistory = async (itemId) => {
    const historyTable = document.getElementById('bidding-history');
    if (!historyTable) return;
    
    // Show loading state
    historyTable.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading bidding history...</td></tr>';

    try {
        const res = await fetch(`${baseUrl}/api/bids/${itemId}`);
        const bids = await res.json();
        
        if (bids.length === 0) {
            historyTable.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--text-muted);">No bids yet. Be the first to bid!</td></tr>';
        } else {
            historyTable.innerHTML = bids.map(bid => `
                <tr>
                    <td style="font-weight: 600;">${bid.userName}</td>
                    <td class="price-up">₹${formatCurrency(bid.bidAmount)}</td>
                    <td style="color: var(--text-muted); font-size: 0.85rem;">${new Date(bid.timestamp).toLocaleString()}</td>
                </tr>
            `).join('');
        }
        // Initialize reveal animations
        window.initScrollReveal();
    } catch (err) {
        console.error('Fetch bid history error:', err);
        historyTable.innerHTML = '<tr><td colspan="3" style="text-align: center; padding: 2rem; color: var(--error);">Error loading history.</td></tr>';
    }
};

window.fetchFeaturedItems = async () => {
    try {
        const res = await fetch(`${baseUrl}/api/items`);
        let items = await res.json();
        // Featured only 3
        items = items.slice(0, 3);
        
        const container = document.getElementById('featured-items-container');
        if (!container) return;

        const isLoggedIn = !!localStorage.getItem('token');
        container.innerHTML = items.map(item => `
            <div class="item-card reveal" onclick="window.location.href='${isLoggedIn ? 'item.html?id=' + item._id : 'login.html'}'" data-item-id="${item._id}">
                <div class="item-img-wrapper">
                    <img src="${formatImageUrl(item.imageUrl)}" alt="${item.title}" class="item-img" onerror="this.src='https://placehold.co/600x400/1e293b/a855f7?text=No+Image'">
                    <div class="item-badge">
                         <div class="dot"></div>
                         <span>LIVE AUCTION</span>
                    </div>
                </div>
                <div class="item-info">
                    <div class="item-category">${item.category}</div>
                    <h3 class="item-title">${item.title}</h3>
                    <div class="item-stats-box">
                        <div>
                            <div class="stat-label">Current Bid</div>
                            <div class="stat-value price-value curr-bid-value">₹${formatCurrency(item.currentBid)}</div>
                        </div>
                        <div style="text-align: right;">
                             <div class="stat-label">Time Left</div>
                             <div class="stat-value timer" id="timer-${item._id}" data-endtime="${item.endTime}" style="font-size: 0.95rem;">--:--:--</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Start countdowns
        startCountdowns();
        // Initialize reveal animations
        window.initScrollReveal();
    } catch (err) {
        console.error('Fetch featured items error:', err);
        const container = document.getElementById('featured-items-container');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;" class="glass reveal">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">⚠️</div>
                    <h3 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; color: #ef4444;">Server Unavailable</h3>
                    <p style="color: var(--text-muted); font-size: 1rem;">Could not connect to the backend server.</p>
                </div>
            `;
        }
    }
};

window.setQuickBid = (amount) => {
    const input = document.getElementById('bid-amount');
    if (input) {
         input.value = amount;
         input.focus();
         // Adding a subtle highlight effect so user knows it changed
         input.style.boxShadow = '0 0 15px var(--primary-glow)';
         setTimeout(() => input.style.boxShadow = '', 500);
    }
};

window.placeBid = async (itemId, amount) => {
    const btn = document.getElementById('place-bid-btn');
    const msg = document.getElementById('bid-message');
    
    if (!amount || amount <= 0) {
        window.showToast('Please enter a valid amount', 'warning');
        return;
    }

    btn.disabled = true;
    btn.innerText = 'Processing...';

    try {
        const res = await fetch(`${baseUrl}/api/bids`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ itemId, bidAmount: Number(amount) })
        });
        
        if (res.status === 401) {
            alert('Your session has expired. Please login again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }

        const data = await res.json();
        msg.style.display = 'block';
        msg.innerHTML = (res.ok ? '<span style="font-size: 1.5rem;">✅</span> ' : '<span style="font-size: 1.5rem;">❌</span> ') + data.message;
        msg.style.color = res.ok ? 'var(--success)' : 'var(--error)';

        if (res.ok) {
            document.getElementById('bid-amount').value = '';
            btn.innerHTML = 'Success! Bid Placed ✅';
            btn.style.background = 'var(--success)';
            setTimeout(() => {
                btn.innerHTML = 'Place Bid Now';
                btn.style.background = '';
            }, 3000);
        }
    } catch (err) {
        console.error('Bid error:', err);
        window.showToast('Failed to connect to the server.', 'error');
    } finally {
        if (btn.innerHTML === 'Processing...') {
            btn.disabled = false;
            btn.innerText = 'Place Bid Now';
        } else {
             // Keep the success state for 3s
             setTimeout(() => {
                btn.disabled = false;
             }, 3000);
        }
    }
};

function startCountdowns() {
    const timers = document.querySelectorAll('.timer');
    if (window.countdownInterval) clearInterval(window.countdownInterval);
    
    const update = () => {
        timers.forEach(timer => {
            const endTime = new Date(timer.dataset.endtime).getTime();
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance < 0) {
                timer.innerText = "EXPIRED";
                timer.style.color = "var(--text-muted)";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            timer.innerText = `${days > 0 ? days + 'd ' : ''}${hours}H ${minutes}M ${seconds}S`;
        });
    };

    update();
    window.countdownInterval = setInterval(update, 1000);
}

// Global Scroll Reveal Logic
window.initScrollReveal = () => {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
};

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.initScrollReveal());
} else {
    window.initScrollReveal();
}
