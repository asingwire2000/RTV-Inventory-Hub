/**
 * RTV Inventory Hub - Shared Responsiveness Script
 * Handles mobile menu toggle and sidebar functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Menu Toggle Button in Header dynamically if needed
    const headerLeft = document.querySelector('.header-left');
    const header = document.querySelector('.header');
    
    // Create menu toggle hamburger button if not present in HTML
    if (!document.querySelector('.menu-toggle') && (headerLeft || header)) {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'menu-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.title = 'Toggle Navigation Menu';
        toggleBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
        
        if (headerLeft) {
            headerLeft.insertBefore(toggleBtn, headerLeft.firstChild);
        } else if (header) {
            header.insertBefore(toggleBtn, header.firstChild);
        }
    }

    // 2. Ensure Backdrop overlay exists in DOM
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.setAttribute('role', 'button');
        backdrop.setAttribute('aria-label', 'Close menu');
        document.body.appendChild(backdrop);
    }

    // 3. Get sidebar and menu toggle elements
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    // 4. Menu toggle click handler
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // 5. Backdrop click handler to close sidebar
    if (backdrop && sidebar) {
        backdrop.addEventListener('click', closeSidebar);
    }

    // 6. Handle window resize for responsive behavior
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024 && sidebar) {
            sidebar.classList.remove('open');
            backdrop.classList.remove('active');
            backdrop.style.display = 'none';
        }
    });

    // 7. Highlight active menu item dynamically
    highlightActiveMenuItem();

    // 8. Setup menu item click handlers
    setupMenuItemHandlers();

    /**
     * Toggle sidebar visibility
     */
    function toggleSidebar() {
        if (!sidebar) return;
        
        const isOpen = sidebar.classList.contains('open');
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    /**
     * Open sidebar
     */
    function openSidebar() {
        if (!sidebar) return;
        
        sidebar.classList.add('open');
        backdrop.style.display = 'block';
        // Small delay for animation
        setTimeout(() => {
            backdrop.classList.add('active');
        }, 10);
    }

    /**
     * Close sidebar
     */
    function closeSidebar() {
        if (!sidebar) return;
        
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
        setTimeout(() => {
            backdrop.style.display = 'none';
        }, 300);
    }

    /**
     * Highlight the active menu item based on current page
     */
    function highlightActiveMenuItem() {
        try {
            const currentPath = window.location.pathname.split('/').pop() || 'index.html';
            const menuItems = document.querySelectorAll('.menu-item');
            
            menuItems.forEach(item => {
                const href = item.getAttribute('href');
                if (!href) return;

                // Remove active class first
                item.classList.remove('active');

                // Check if this is the current page
                if (href === currentPath || 
                    (currentPath === '' && href === 'index.html') ||
                    (href && currentPath.includes(href.replace('.html', '')))) {
                    item.classList.add('active');
                }
            });
        } catch (error) {
            console.error('Error highlighting active menu item:', error);
        }
    }

    /**
     * Setup click handlers for menu items
     */
    function setupMenuItemHandlers() {
        const menuItems = document.querySelectorAll('.menu-item');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Close sidebar on mobile when item is clicked
                if (window.innerWidth < 1024 && sidebar) {
                    closeSidebar();
                }
            });

            // Add keyboard support
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    // Prevent sidebar close when clicking inside sidebar
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // Close sidebar when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });
});
