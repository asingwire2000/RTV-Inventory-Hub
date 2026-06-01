/**
 * RTV Inventory Hub - Shared Responsiveness Script
 * Handles mobile menu toggle and sidebar functionality
 */

document.addEventListener('DOMContentLoaded', () => {
    // Create menu toggle button if not exists
    const header = document.querySelector('.header');
    const headerLeft = document.querySelector('.header-left');
    
    if (!document.querySelector('.menu-toggle') && (header || headerLeft)) {
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'menu-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        toggleBtn.title = 'Toggle Navigation Menu';
        toggleBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
        toggleBtn.setAttribute('aria-expanded', 'false');
        
        if (headerLeft) {
            headerLeft.insertBefore(toggleBtn, headerLeft.firstChild);
        } else if (header) {
            const titleDiv = header.querySelector('.header-title');
            if (titleDiv) {
                titleDiv.insertBefore(toggleBtn, titleDiv.firstChild);
            } else {
                header.insertBefore(toggleBtn, header.firstChild);
            }
        }
    }

    // Create backdrop if not exists
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.setAttribute('role', 'button');
        backdrop.setAttribute('aria-label', 'Close menu');
        document.body.appendChild(backdrop);
    }

    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    // Toggle sidebar function
    function toggleSidebar() {
        if (!sidebar) return;
        
        const isOpen = sidebar.classList.contains('open');
        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }

    function openSidebar() {
        if (!sidebar) return;
        
        sidebar.classList.add('open');
        backdrop.style.display = 'block';
        if (menuToggle) {
            menuToggle.setAttribute('aria-expanded', 'true');
        }
        // Small delay for animation
        setTimeout(() => {
            backdrop.classList.add('active');
        }, 10);
        // Prevent body scroll on mobile
        document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
        if (!sidebar) return;
        
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
        if (menuToggle) {
            menuToggle.setAttribute('aria-expanded', 'false');
        }
        setTimeout(() => {
            backdrop.style.display = 'none';
            document.body.style.overflow = '';
        }, 300);
    }

    // Add event listeners
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeSidebar);
    }

    // Close sidebar on window resize (if screen becomes desktop)
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth >= 768 && sidebar && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        }, 250);
    });

    // Highlight active menu item
    function highlightActiveMenuItem() {
        try {
            const currentPath = window.location.pathname.split('/').pop() || 'index.html';
            const menuItems = document.querySelectorAll('.menu-item');
            
            menuItems.forEach(item => {
                const href = item.getAttribute('href');
                if (!href) return;
                
                item.classList.remove('active');
                
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

    highlightActiveMenuItem();

    // Close sidebar when clicking on menu item (mobile only)
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 768 && sidebar) {
                closeSidebar();
            }
        });
    });

    // Close sidebar when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });

    // Prevent body scroll when sidebar is open
    sidebar?.addEventListener('touchmove', (e) => {
        if (sidebar.classList.contains('open')) {
            e.stopPropagation();
        }
    });
});
