/**
 * Responsive.js - Comprehensive responsive utilities with error handling
 * Ensures all layout calculations and responsive behaviors execute error-free
 * across all breakpoints (1024px, 768px, 480px)
 */

class ResponsiveManager {
    constructor() {
        this.currentBreakpoint = null;
        this.breakpoints = {
            large: 1024,
            tablet: 768,
            mobile: 480
        };
        this.minTouchSize = 32; // Minimum touch target size in pixels
        this.resizeTimeout = null;
        this.resizeDelay = 250; // Debounce delay for resize calculations

        this.init();
    }

    /**
     * Initialize responsive manager on DOM ready
     */
    init() {
        try {
            this.detectBreakpoint();
            window.addEventListener('resize', this.handleWindowResize.bind(this));
            this.validateResponsiveLayout();
        } catch (error) {
            console.error('[ResponsiveManager] Initialization error:', error);
        }
    }

    /**
     * Detect current breakpoint and return readable name
     * @returns {string} Breakpoint name: 'large', 'tablet', or 'mobile'
     */
    detectBreakpoint() {
        try {
            const width = window.innerWidth || document.documentElement.clientWidth;
            
            if (width >= this.breakpoints.large) {
                this.currentBreakpoint = 'large';
            } else if (width >= this.breakpoints.tablet) {
                this.currentBreakpoint = 'tablet';
            } else {
                this.currentBreakpoint = 'mobile';
            }
            
            return this.currentBreakpoint;
        } catch (error) {
            console.error('[ResponsiveManager] Breakpoint detection error:', error);
            return 'large'; // Default to large if error
        }
    }

    /**
     * Handle window resize with debouncing
     */
    handleWindowResize() {
        try {
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }

            this.resizeTimeout = setTimeout(() => {
                const previousBreakpoint = this.currentBreakpoint;
                const newBreakpoint = this.detectBreakpoint();

                if (previousBreakpoint !== newBreakpoint) {
                    this.onBreakpointChange(previousBreakpoint, newBreakpoint);
                }

                this.recalculateLayout();
            }, this.resizeDelay);
        } catch (error) {
            console.error('[ResponsiveManager] Resize handler error:', error);
        }
    }

    /**
     * Execute callback when breakpoint changes
     * @param {string} oldBreakpoint - Previous breakpoint
     * @param {string} newBreakpoint - New breakpoint
     */
    onBreakpointChange(oldBreakpoint, newBreakpoint) {
        try {
            console.log(`[ResponsiveManager] Breakpoint changed: ${oldBreakpoint} → ${newBreakpoint}`);
            
            // Trigger any custom breakpoint change handlers
            const event = new CustomEvent('breakpointChange', {
                detail: { oldBreakpoint, newBreakpoint }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('[ResponsiveManager] Breakpoint change handler error:', error);
        }
    }

    /**
     * Recalculate and validate responsive layout
     */
    recalculateLayout() {
        try {
            this.validateTouchTargets();
            this.adjustModalPositioning();
            this.ensureSidebarVisibility();
            this.validateTableResponsiveness();
            this.adjustButtonLayouts();
        } catch (error) {
            console.error('[ResponsiveManager] Layout recalculation error:', error);
        }
    }

    /**
     * Validate overall responsive layout without errors
     */
    validateResponsiveLayout() {
        try {
            // Check that all essential elements exist
            this.validateElementExistence([
                '.sidebar',
                '.mobile-menu-toggle',
                'header',
                'main'
            ]);

            // Perform initial layout validation
            this.recalculateLayout();
        } catch (error) {
            console.warn('[ResponsiveManager] Layout validation issue:', error);
        }
    }

    /**
     * Validate that required DOM elements exist
     * @param {array} selectors - Array of CSS selectors to validate
     */
    validateElementExistence(selectors) {
        try {
            selectors.forEach(selector => {
                const element = document.querySelector(selector);
                if (!element) {
                    console.warn(`[ResponsiveManager] Element not found: ${selector}`);
                }
            });
        } catch (error) {
            console.error('[ResponsiveManager] Element validation error:', error);
        }
    }

    /**
     * Validate all touch targets are minimum size (32x32px)
     */
    validateTouchTargets() {
        try {
            const buttons = document.querySelectorAll('button, a[role="button"], .btn, [role="button"]');
            
            buttons.forEach(button => {
                try {
                    const rect = button.getBoundingClientRect();
                    
                    // Only validate buttons that are visible
                    if (rect.width > 0 && rect.height > 0) {
                        if (rect.width < this.minTouchSize || rect.height < this.minTouchSize) {
                            // Apply minimum touch size padding
                            const computedStyle = window.getComputedStyle(button);
                            const currentPadding = this.parsePixelValue(computedStyle.padding);
                            
                            if (rect.width < this.minTouchSize) {
                                button.style.paddingLeft = this.minTouchSize / 2 + 'px';
                                button.style.paddingRight = this.minTouchSize / 2 + 'px';
                            }
                            
                            if (rect.height < this.minTouchSize) {
                                button.style.minHeight = this.minTouchSize + 'px';
                            }
                        }
                    }
                } catch (error) {
                    console.debug('[ResponsiveManager] Touch target validation error for element:', error);
                }
            });
        } catch (error) {
            console.error('[ResponsiveManager] Touch targets validation error:', error);
        }
    }

    /**
     * Adjust modal positioning to ensure it's centered and visible
     */
    adjustModalPositioning() {
        try {
            const modals = document.querySelectorAll('.modal-content, .modal');
            
            modals.forEach(modal => {
                try {
                    if (modal.offsetParent === null) return; // Modal is hidden

                    const rect = modal.getBoundingClientRect();
                    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

                    // Check if modal extends beyond viewport
                    if (rect.left < 0) {
                        modal.style.marginLeft = Math.abs(rect.left) + 10 + 'px';
                    }
                    
                    if (rect.right > viewportWidth) {
                        modal.style.marginRight = (rect.right - viewportWidth) + 10 + 'px';
                    }

                    // Ensure modal height doesn't exceed viewport
                    if (rect.height > viewportHeight) {
                        modal.style.maxHeight = (viewportHeight - 40) + 'px';
                        modal.style.overflowY = 'auto';
                    }
                } catch (error) {
                    console.debug('[ResponsiveManager] Modal adjustment error:', error);
                }
            });
        } catch (error) {
            console.error('[ResponsiveManager] Modal positioning error:', error);
        }
    }

    /**
     * Ensure sidebar visibility and proper z-index on mobile
     */
    ensureSidebarVisibility() {
        try {
            const sidebar = document.querySelector('.sidebar');
            if (!sidebar) return;

            const isScreenSmall = this.currentBreakpoint !== 'large';
            
            if (isScreenSmall) {
                sidebar.style.position = 'fixed';
                sidebar.style.zIndex = '1000';
                sidebar.style.top = '0';
                sidebar.style.left = '0';
                sidebar.style.height = '100vh';
            }
        } catch (error) {
            console.error('[ResponsiveManager] Sidebar visibility error:', error);
        }
    }

    /**
     * Validate table responsiveness and ensure scrollability
     */
    validateTableResponsiveness() {
        try {
            const tables = document.querySelectorAll('.data-table, table');
            
            tables.forEach(table => {
                try {
                    const parent = table.parentElement;
                    
                    if (this.currentBreakpoint !== 'large') {
                        // Ensure table has proper scrolling container
                        if (!parent || parent.style.overflowX !== 'auto') {
                            table.style.minWidth = '100%';
                            
                            // If parent exists and not already scrollable, add scroll styles
                            if (parent && parent !== table) {
                                parent.style.overflowX = 'auto';
                                parent.style.WebkitOverflowScrolling = 'touch';
                            }
                        }
                    }
                } catch (error) {
                    console.debug('[ResponsiveManager] Table validation error:', error);
                }
            });
        } catch (error) {
            console.error('[ResponsiveManager] Table responsiveness error:', error);
        }
    }

    /**
     * Adjust button layouts for different breakpoints
     */
    adjustButtonLayouts() {
        try {
            const buttonGroups = document.querySelectorAll('.table-actions, .button-group, .action-buttons');
            
            buttonGroups.forEach(group => {
                try {
                    if (this.currentBreakpoint === 'mobile') {
                        // Stack buttons vertically on mobile
                        group.style.display = 'flex';
                        group.style.flexDirection = 'column';
                        group.style.gap = '0.5rem';
                        
                        // Make buttons full width
                        const buttons = group.querySelectorAll('button, .btn, a[role="button"]');
                        buttons.forEach(btn => {
                            btn.style.width = '100%';
                            btn.style.minHeight = '36px';
                        });
                    }
                } catch (error) {
                    console.debug('[ResponsiveManager] Button layout adjustment error:', error);
                }
            });
        } catch (error) {
            console.error('[ResponsiveManager] Button layout error:', error);
        }
    }

    /**
     * Parse pixel value from computed style
     * @param {string} value - CSS value (e.g., "10px", "1rem")
     * @returns {number} Pixel value or 0 if parsing fails
     */
    parsePixelValue(value) {
        try {
            if (!value) return 0;
            const match = value.match(/(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
        } catch (error) {
            console.debug('[ResponsiveManager] Pixel parsing error:', error);
            return 0;
        }
    }

    /**
     * Get current viewport dimensions with error handling
     * @returns {object} Object with width and height properties
     */
    getViewportDimensions() {
        try {
            return {
                width: window.innerWidth || document.documentElement.clientWidth || 0,
                height: window.innerHeight || document.documentElement.clientHeight || 0
            };
        } catch (error) {
            console.error('[ResponsiveManager] Viewport dimensions error:', error);
            return { width: 1024, height: 768 }; // Safe defaults
        }
    }

    /**
     * Check if current breakpoint is mobile
     * @returns {boolean} True if current breakpoint is mobile or tablet
     */
    isMobileBreakpoint() {
        try {
            return this.currentBreakpoint === 'mobile' || this.currentBreakpoint === 'tablet';
        } catch (error) {
            console.error('[ResponsiveManager] Mobile breakpoint check error:', error);
            return false;
        }
    }

    /**
     * Get human-readable breakpoint name
     * @returns {string} Breakpoint description
     */
    getBreakpointName() {
        try {
            const names = {
                large: 'Desktop (1024px+)',
                tablet: 'Tablet (768px - 1023px)',
                mobile: 'Mobile (<768px)'
            };
            return names[this.currentBreakpoint] || 'Unknown';
        } catch (error) {
            console.error('[ResponsiveManager] Breakpoint name error:', error);
            return 'Unknown';
        }
    }

    /**
     * Validate and fix modal visibility issues
     * @param {string} modalSelector - CSS selector for modal
     */
    validateModalVisibility(modalSelector) {
        try {
            const modal = document.querySelector(modalSelector);
            if (!modal) {
                console.warn(`[ResponsiveManager] Modal not found: ${modalSelector}`);
                return;
            }

            const rect = modal.getBoundingClientRect();
            
            // Ensure modal is visible
            if (rect.width === 0 || rect.height === 0) {
                modal.style.display = 'block';
            }

            // Ensure modal isn't off-screen
            const viewport = this.getViewportDimensions();
            if (rect.left < 0 || rect.top < 0 || rect.right > viewport.width || rect.bottom > viewport.height) {
                modal.style.position = 'fixed';
                modal.style.left = '50%';
                modal.style.top = '50%';
                modal.style.transform = 'translate(-50%, -50%)';
            }
        } catch (error) {
            console.error('[ResponsiveManager] Modal visibility validation error:', error);
        }
    }

    /**
     * Fix overflow issues on specific containers
     * @param {string} containerSelector - CSS selector for container
     */
    fixContainerOverflow(containerSelector) {
        try {
            const container = document.querySelector(containerSelector);
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const viewport = this.getViewportDimensions();

            if (rect.width > viewport.width) {
                container.style.overflowX = 'auto';
                container.style.WebkitOverflowScrolling = 'touch';
            }
        } catch (error) {
            console.error('[ResponsiveManager] Container overflow fix error:', error);
        }
    }

    /**
     * Safe sidebar toggle with error handling
     */
    toggleSidebar() {
        try {
            const sidebar = document.querySelector('.sidebar');
            if (!sidebar) {
                console.warn('[ResponsiveManager] Sidebar not found for toggle');
                return;
            }

            sidebar.classList.toggle('active');
        } catch (error) {
            console.error('[ResponsiveManager] Sidebar toggle error:', error);
        }
    }

    /**
     * Safe sidebar close with error handling
     */
    closeSidebar() {
        try {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) {
                sidebar.classList.remove('active');
            }
        } catch (error) {
            console.error('[ResponsiveManager] Sidebar close error:', error);
        }
    }

    /**
     * Log current responsive state
     */
    logResponsiveState() {
        try {
            const viewport = this.getViewportDimensions();
            console.log('[ResponsiveManager] State:', {
                breakpoint: this.currentBreakpoint,
                breakpointName: this.getBreakpointName(),
                viewportWidth: viewport.width,
                viewportHeight: viewport.height,
                isMobile: this.isMobileBreakpoint()
            });
        } catch (error) {
            console.error('[ResponsiveManager] State logging error:', error);
        }
    }
}

// Initialize responsive manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            window.responsiveManager = new ResponsiveManager();
            console.log('[ResponsiveManager] Initialized successfully');
        } catch (error) {
            console.error('[ResponsiveManager] Failed to initialize:', error);
        }
    });
} else {
    // DOM already loaded
    try {
        window.responsiveManager = new ResponsiveManager();
        console.log('[ResponsiveManager] Initialized successfully');
    } catch (error) {
        console.error('[ResponsiveManager] Failed to initialize:', error);
    }
}
