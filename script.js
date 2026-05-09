document.addEventListener('DOMContentLoaded', function() {
    // Define the logical order of pages for navigation
    const pageOrder = [
        'index.html',
        'topics.html',
        'ev-fundamentals.html',
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
    updateHeaderVisibility();
});
