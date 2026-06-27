document.addEventListener('DOMContentLoaded', function() {
    function initSharedVisitorCounter() {
        document.querySelectorAll('.visitor-counter').forEach((counter) => counter.remove());

        const counterDiv = document.createElement('div');
        counterDiv.className = 'visitor-counter';
        counterDiv.setAttribute('aria-live', 'polite');
        counterDiv.innerHTML = `
            <span class="visitor-counter__label">Page hits</span>
            <span class="visitor-counter__stat">Total: <strong id="visitor-total-count">...</strong></span>
            <span class="visitor-counter__stat">Today: <strong id="visitor-today-count">...</strong></span>
        `;

        const footer = document.querySelector('footer');
        if (footer) {
            footer.appendChild(counterDiv);
        } else {
            document.body.appendChild(counterDiv);
        }

        const totalElement = document.getElementById('visitor-total-count');
        const todayElement = document.getElementById('visitor-today-count');
        const namespace = sanitizeCounterKey(window.location.hostname || 'ev-electronics-lab');
        const page = sanitizeCounterKey((window.location.pathname.split('/').pop() || 'index.html').replace(/\.html$/i, ''));
        const today = getLocalDateKey();

        Promise.all([
            incrementCounter(namespace, `${page}-total`),
            incrementCounter(namespace, `${page}-${today}`)
        ])
            .then(([totalHits, todayHits]) => {
                totalElement.textContent = formatCounterNumber(totalHits);
                todayElement.textContent = formatCounterNumber(todayHits);
            })
            .catch(() => {
                totalElement.textContent = 'Unavailable';
                todayElement.textContent = 'Unavailable';
                counterDiv.classList.add('visitor-counter--offline');
                counterDiv.title = 'Visitor counter could not connect to the count service.';
            });
    }

    function sanitizeCounterKey(value) {
        return value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || 'page';
    }

    function getLocalDateKey() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    async function incrementCounter(namespace, key) {
        const response = await fetch(`https://api.counterapi.dev/v1/${namespace}/${key}/up`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error('Visitor counter request failed');
        }

        const data = await response.json();
        return Number(data.count ?? data.value) || 0;
    }

    function formatCounterNumber(value) {
        return new Intl.NumberFormat().format(value);
    }

    // Define the logical order of pages for navigation
    const pageOrder = [
        'index.html',
        'topics.html',
        'ev-fundamentals.html',
        'hv-comp-intro.html',
        'hv-safety-components.html',
        'motor-controls.html',
        'vf-control.html',
        'pmsm-foc-guide.html',
        'spwm.html',
        'overmodulation.html',
        'battery-bms.html',
        'power-electronics.html',
        'embedded-systems.html',
        'renewable-energy.html',
        'updates.html',
        'about.html',
        'journey.html',
        'projects.html',
        'contact.html'
    ];

    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    const currentIndex = pageOrder.indexOf(page);

    const navContainer = document.createElement('div');
    navContainer.className = 'floating-nav-container';

    function createButton(type, href, icon, text) {
        const btn = document.createElement(type === 'top' ? 'button' : 'a');
        btn.className = `floating-btn ${type}-btn`;
        if (type !== 'top') btn.href = href;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'icon';
        iconSpan.innerHTML = icon;

        const textSpan = document.createElement('span');
        textSpan.className = 'text';
        textSpan.innerText = text;

        btn.appendChild(iconSpan);
        btn.appendChild(textSpan);

        if (type === 'top') {
            btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        return btn;
    }

    if (currentIndex > 0) {
        const prevBtn = createButton('prev', pageOrder[currentIndex - 1], '←', 'Previous Topic');
        navContainer.appendChild(prevBtn);
    }

    const homeBtn = createButton('home', 'index.html', '🏠', 'Home');
    navContainer.appendChild(homeBtn);

    if (currentIndex !== -1 && currentIndex < pageOrder.length - 1) {
        const nextBtn = createButton('next', pageOrder[currentIndex + 1], '→', 'Next Topic');
        navContainer.appendChild(nextBtn);
    }

    const topBtn = createButton('top', '#', '↑', 'Back to Top');
    navContainer.appendChild(topBtn);

    document.body.appendChild(navContainer);

    function setHeaderVisibility(show) {
        const header = document.querySelector('header');
        if (!header) return;

        if (show) {
            header.classList.add('visible');
            header.classList.remove('hidden-header');
        } else {
            header.classList.remove('visible');
            header.classList.add('hidden-header');
        }
    }

    function updateHeaderVisibility(clientY = null) {
        const nearEdge = clientY !== null && (clientY <= 80 || clientY >= window.innerHeight - 80);
        const atScrollEdge = window.scrollY <= 50 || window.scrollY + window.innerHeight >= document.body.scrollHeight - 50;

        setHeaderVisibility(nearEdge || atScrollEdge);
    }

    const header = document.querySelector('header');
    if (header) {
        header.classList.add('hidden-header');
    }

    document.addEventListener('mousemove', (event) => updateHeaderVisibility(event.clientY));
    window.addEventListener('scroll', () => updateHeaderVisibility());
    window.addEventListener('touchstart', (event) => updateHeaderVisibility(event.touches[0]?.clientY || null));

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            topBtn.style.display = 'flex';
        } else {
            topBtn.style.display = 'none';
        }
    });

    if (window.scrollY <= 300) {
        topBtn.style.display = 'none';
    }
    initSharedVisitorCounter();
    updateHeaderVisibility();
});
