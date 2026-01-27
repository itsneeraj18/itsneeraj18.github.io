document.addEventListener('DOMContentLoaded', function() {
    // Define the logical order of pages for navigation
    const pageOrder = [
        'index.html',
        'topics.html',
        'ev-fundamentals.html',
        // 'hv-safety-components.html',
        'motor-controls.html',
        'vf-control.html',
        'spwm.html',
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

    // Get current page filename
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';
    const currentIndex = pageOrder.indexOf(page);

    // Create container for floating buttons
    const navContainer = document.createElement('div');
    navContainer.className = 'floating-nav-container';

    // Helper function to create buttons
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

    // Add Previous Button
    if (currentIndex > 0) {
        const prevBtn = createButton('prev', pageOrder[currentIndex - 1], '←', 'Previous Topic');
        navContainer.appendChild(prevBtn);
    }

    // Add Next Button
    if (currentIndex !== -1 && currentIndex < pageOrder.length - 1) {
        const nextBtn = createButton('next', pageOrder[currentIndex + 1], '→', 'Next Topic');
        navContainer.appendChild(nextBtn);
    }

    // Add Back to Top Button
    const topBtn = createButton('top', '#', '↑', 'Back to Top');
    navContainer.appendChild(topBtn);

    // Append to body
    document.body.appendChild(navContainer);

    // Show/Hide Back to Top button based on scroll position
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            topBtn.style.display = 'flex';
        } else {
            topBtn.style.display = 'none';
        }
    });
    
    // Initial check
    if (window.scrollY <= 300) {
        topBtn.style.display = 'none';
    }
});
