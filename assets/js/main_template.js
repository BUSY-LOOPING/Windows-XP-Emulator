let zCounter = 2; // Global z-index counter

class WindowApp {
    /**
     * @param {object} cfg
     * @param {string} cfg.templateId   – ID of the <template>
     * @param {string} cfg.title
     * @param {string} cfg.iconSrc
     * @param {number} cfg.width
     * @param {number} cfg.height
     * @param {number} cfg.x
     * @param {number} cfg.y
     */
    constructor({ templateId, title, iconSrc, width, height, x, y }) {
        const tpl = document.getElementById(templateId);
        if (!tpl) throw new Error(`Template "${templateId}" not found`);
        const frag = tpl.content.cloneNode(true);

        // 2. get the window element
        this.el = frag.querySelector('.window');
        // set geometry
        this.el.style.width = width + 'px';
        this.el.style.height = height + 'px';
        this.el.style.left = x + 'px';
        this.el.style.top = y + 'px';

        // 3. set title & icon
        this.el.querySelector('.title-text').textContent = title;
        this.el.querySelector('.title-icon').src = iconSrc;

        // 4. inject your dynamic content
        // this.el.querySelector('.content').innerHTML = htmlContent;

        // 5. append & wire up
        document.getElementById('desktop').appendChild(frag);
        this.makeInteractive();
        this.enableMenuOpenClose();
        this.focus();

        this.isMaximized = false;
        this.orig = { width, height, x, y };

        // change maximize icon on toggle
        this.maximizeBtn = this.el.querySelector('.btn.maximize img');
        this.maximizeBtnSrc = {
            max: 'assets/images/Maximize.png',
            restore: 'assets/images/Restore.png'
        };

        // wire restore/max logic
        this.maximizeAction = this.el.querySelector('.btn.maximize');
        this.maximizeAction.addEventListener('click', () => this.toggleMaximize());

        // wire “click outside” unfocus globally once
        if (!WindowApp._desktopHandlerAttached) {
            document.getElementById('desktop').addEventListener('mousedown', e => {
                if (e.target.id === 'desktop') {
                    document.querySelectorAll('.window').forEach(w => w.classList.add('inactive'));
                }
            });
            WindowApp._desktopHandlerAttached = true;
        }
    }

    toggleMaximize() {
        if (!this.isMaximized) {
            // store original
            const style = getComputedStyle(this.el);
            this.orig = {
                width: parseInt(style.width),
                height: parseInt(style.height),
                x: this.el.offsetLeft,
                y: this.el.offsetTop
            };
            // maximize
            Object.assign(this.el.style, {
                top: '0px',
                left: '0px',
                width: `100%`,
                height: `100%`
            });
            // swap icon
            this.maximizeBtn.src = this.maximizeBtnSrc.restore;
        } else {
            // restore
            Object.assign(this.el.style, {
                top: `${this.orig.y}px`,
                left: `${this.orig.x}px`,
                width: `${this.orig.width}px`,
                height: `${this.orig.height}px`
            });
            this.maximizeBtn.src = this.maximizeBtnSrc.max;
        }
        this.isMaximized = !this.isMaximized;
    }

    makeInteractive() {
        const win = this.el;
        const titleBar = win.querySelector('.title-bar');
        const minimizeBtn = win.querySelector('.btn.minimize');
        const maximizeBtn = win.querySelector('.btn.maximize');
        const closeBtn = win.querySelector('.btn.close');

        // Focus window on mousedown
        win.addEventListener('mousedown', () => this.focus());

        // Dragging
        let isDragging = false;
        let offset = { x: 0, y: 0 };

        titleBar.addEventListener('mousedown', e => {
            if (e.target.closest('.controls')) return;
            isDragging = true;
            offset.x = win.offsetLeft - e.clientX;
            offset.y = win.offsetTop - e.clientY;
            e.preventDefault();
        });

        document.addEventListener('mouseup', () => isDragging = false);
        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            win.style.left = (e.clientX + offset.x) + 'px';
            win.style.top = (e.clientY + offset.y) + 'px';
        });

        // Controls
        closeBtn.addEventListener('click', () => win.remove());
        minimizeBtn.addEventListener('click', () => win.style.display = 'none');

        // Resize
        this.enableResizing();
    }

    enableResizing() {
        const win = this.el;
        const directions = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'];

        directions.forEach(dir => {
            const handle = win.querySelector(`.resize-handle.${dir}`);
            if (!handle) return;

            handle.addEventListener('mousedown', e => {
                e.preventDefault();
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = parseInt(getComputedStyle(win).width, 10);
                const startHeight = parseInt(getComputedStyle(win).height, 10);
                const startTop = win.offsetTop;
                const startLeft = win.offsetLeft;

                const resizeMove = (e) => {
                    if (dir.includes('e')) win.style.width = (startWidth + e.clientX - startX) + 'px';
                    if (dir.includes('s')) win.style.height = (startHeight + e.clientY - startY) + 'px';
                    if (dir.includes('w')) {
                        const newWidth = startWidth - (e.clientX - startX);
                        const newLeft = startLeft + (e.clientX - startX);
                        if (newWidth > 100) {
                            win.style.width = newWidth + 'px';
                            win.style.left = newLeft + 'px';
                        }
                    }
                    if (dir.includes('n')) {
                        const newHeight = startHeight - (e.clientY - startY);
                        const newTop = startTop + (e.clientY - startY);
                        if (newHeight > 100) {
                            win.style.height = newHeight + 'px';
                            win.style.top = newTop + 'px';
                        }
                    }
                };

                const stopResize = () => {
                    document.removeEventListener('mousemove', resizeMove);
                    document.removeEventListener('mouseup', stopResize);
                };

                document.addEventListener('mousemove', resizeMove);
                document.addEventListener('mouseup', stopResize);
            });
        });
    }

    focus() {
        document.querySelectorAll('.window').forEach(w => w.classList.add('inactive'));
        this.el.classList.remove('inactive');
        this.el.style.zIndex = ++zCounter;
    }

    enableMenuOpenClose() {
        document.querySelectorAll('.window-menu .menu-item').forEach(item => {
            item.addEventListener('mouseenter', function () {
                // Remove 'open' from all menu items
                document.querySelectorAll('.window-menu .menu-item.open').forEach(openItem => {
                    openItem.classList.remove('open');
                });
                // Add 'open' to this item if it has a submenu
                if (item.querySelector('.submenu')) {
                    item.classList.add('open');
                }
            });
            item.addEventListener('mouseleave', function () {
                // Remove 'open' when mouse leaves the menu item
                item.classList.remove('open');
            });
        });
    }
}

class WindowManager {
    /**
     * @param {string} templateId   – e.g. "template-my-computer"
     * @param {object} cfg          – rest of the WindowApp config
     */
    static openApp(templateId, cfg) {
        new WindowApp({ templateId, ...cfg });
    }
}

document.getElementById('myComputerIcon').addEventListener('dblclick', () => {
    WindowManager.openApp('template-my-computer', {
        title: 'My Computer',
        iconSrc: 'assets/images/my_computer.png',
        width: 600, height: 600, x: 50, y: 50
    });
});

document.getElementById('notesIcon').addEventListener('dblclick', () => {
    WindowManager.openApp('template-notepad', {
        title: 'Untitled - Notepad',
        iconSrc: 'assets/images/Notepad.png',
        width: 400, height: 300, x: 100, y: 100
    });
});

WindowManager.openApp('template-my-computer', {
    title: 'My Computer',
    iconSrc: 'assets/images/my_computer.png',
    width: 700, height: 400, x: 100, y: 20
});

