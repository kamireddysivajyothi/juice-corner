
document.addEventListener('DOMContentLoaded', () => {
    const juiceList = document.getElementById('juice-list');
    const recommendationList = document.getElementById('recommendation-list');

    // Auth State Handling
    const authLinks = document.getElementById('auth-links');
    const signupLink = document.getElementById('signup-link');
    const username = localStorage.getItem('username');

    if (username && authLinks) {
        authLinks.innerHTML = `<a href="#">Welcome, ${username}</a>`;
        if (signupLink) {
            signupLink.innerHTML = `<a href="#" id="logoutBtn">Logout</a>`;
            document.getElementById('logoutBtn').addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('username');
                window.location.reload();
            });
        }
    }

    // Signup Logic
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(signupForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (response.ok) {
                    alert('Signup successful! Please login.');
                    window.location.href = 'login.html';
                } else {
                    alert(result.message);
                }
            } catch (err) {
                console.error('Signup error:', err);
            }
        });
    }

    // Login Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (response.ok) {
                    localStorage.setItem('username', result.username);
                    alert('Login successful!');
                    window.location.href = 'index.html';
                } else {
                    alert(result.message);
                }
            } catch (err) {
                console.error('Login error:', err);
            }
        });
    }

    // Function to create a juice card
    const createJuiceCard = (juice, isRecommendation = false) => {
        const card = document.createElement('div');
        card.className = `juice-card ${isRecommendation ? 'ml-recommendation' : ''}`;
        
        const trendingBadge = juice.isTrending ? '<div class="trending-badge">Trending</div>' : '';
        const mlScore = isRecommendation ? `<div class="ml-score">🤖 ${juice.matchScore}% Match</div>` : '';
        
        card.innerHTML = `
            ${trendingBadge}
            ${mlScore}
            <div class="juice-image">
                <img src="${juice.image}" alt="${juice.name}" loading="lazy" 
                    onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1546173159-315724a31696?q=80&w=1974&auto=format&fit=crop';">
            </div>
            <div class="juice-info">
                <span class="category-tag">${juice.category}</span>
                <h3>${juice.name}</h3>
                <p class="description">${juice.description}</p>
                <div class="juice-footer">
                    <span class="price">$${juice.price.toFixed(2)}</span>
                    <button class="btn btn-small order-btn" 
                        data-name="${juice.name}" 
                        data-price="${juice.price}">Order Now</button>
                </div>
            </div>
        `;
        return card;
    };

    // Modal and Form Elements
    const modal = document.getElementById('order-modal');
    const closeBtn = document.querySelector('.close-modal');
    const orderForm = document.getElementById('order-form');
    const summaryPrice = document.getElementById('summary-price');
    const orderJuiceName = document.getElementById('order-juice-name');
    const formJuiceName = document.getElementById('form-juice-name');
    const formJuicePrice = document.getElementById('form-juice-price');

    // Handle "Order Now" button clicks (Event Delegation)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('order-btn')) {
            const name = e.target.getAttribute('data-name');
            const price = parseFloat(e.target.getAttribute('data-price'));

            orderJuiceName.textContent = name;
            formJuiceName.value = name;
            formJuicePrice.value = price;
            summaryPrice.textContent = `$${price.toFixed(2)}`;
            modal.style.display = 'block';
        }
    });

    // Close Modal
    closeBtn.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target == modal) modal.style.display = 'none';
    };

    // Submit Order Form
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const orderData = {
            juiceName: orderJuiceName.textContent,
            customerName: document.getElementById('customerName').value,
            customerPhone: document.getElementById('customerPhone').value,
            customerAddress: document.getElementById('customerAddress').value,
            totalPrice: parseFloat(formJuicePrice.value)
        };

        console.log('Order data being sent:', orderData);

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                alert('Order placed successfully! Thank you.');
                modal.style.display = 'none';
                orderForm.reset();
            } else {
                alert('Failed to place order. Please try again.');
            }
        } catch (err) {
            console.error('Error placing order:', err);
            alert(`An error occurred: ${err.message}. Please try again later.`);
        }
    });

    // Fetch Menu and Recommendations without repeats
    Promise.all([
        fetch('/api/juices').then(res => res.json()),
        fetch('/api/recommendations').then(res => res.json())
    ])
    .then(([allJuices, recommendedJuices]) => {
        // 1. Display Recommendations
        recommendedJuices.forEach(juice => {
            recommendationList.appendChild(createJuiceCard(juice, true));
        });

        // 2. Display Full Menu, but filter out items already in Recommendations to avoid repetition
        const recommendedNames = recommendedJuices.map(j => j.name);
        const filteredMenu = allJuices.filter(juice => !recommendedNames.includes(juice.name));

        filteredMenu.forEach(juice => {
            juiceList.appendChild(createJuiceCard(juice));
        });
    })
    .catch(err => console.error('Error loading menu data:', err));
});
