let zCounter = 2;

class MyWindow {
    constructor(title, width = 300, height = 200) {
        this.el = document.createElement('div');
        this.el.className = 'window inactive';
        this.el.style.width = width + 'px';
        this.el.style.height = height + 'px';

        this.titleBar = document.createElement('div');
        this.titleBar.className = 'title-bar';
        this.titleBar.textContent = title;

        // controls
        this.controls = document.createElement('div');
        this.controls.className = 'controls';
        ['minimize', 'maximize', 'close'].forEach(type => {
            const btn = document.createElement('div');
            btn.className = 'btn ' + type;
            btn.innerHTML = type === 'close' ? '&times;' : (type === 'minimize' ? '&#95;' : '&#9744;');
            btn.addEventListener('click', e => this.onControl(type));
            this.controls.appendChild(btn);
        });
        this.titleBar.appendChild(this.controls);
        this.el.appendChild(this.titleBar);

        this.content = document.createElement('div');
        this.content.className = 'content';
        this.el.appendChild(this.content);

        this.addResizeHandles();

        document.getElementById('desktop').appendChild(this.el);
        this.makeDraggable();
        this.el.addEventListener('mousedown', () => this.focus());
    }

    onControl(type) {
        if (type === 'close') this.el.remove();
        if (type === 'minimize') this.el.style.display = 'none';
        if (type === 'maximize') {
            this.el.style.top = '0';
            this.el.style.left = '0';
            this.el.style.width = '100%';
            this.el.style.height = '100%';
        }
    }

    focus() {
        // reset others
        document.querySelectorAll('.window').forEach(w => w.classList.add('inactive'));
        this.el.classList.remove('inactive');
        this.el.style.zIndex = ++zCounter;
    }

    makeDraggable() {
        let isDown = false;
        let offset = { x: 0, y: 0 };

        this.titleBar.addEventListener('mousedown', e => {
            isDown = true;
            offset.x = this.el.offsetLeft - e.clientX;
            offset.y = this.el.offsetTop - e.clientY;
        });
        document.addEventListener('mouseup', () => isDown = false);
        document.addEventListener('mousemove', e => {
            if (!isDown) return;
            this.el.style.left = (e.clientX + offset.x) + 'px';
            this.el.style.top = (e.clientY + offset.y) + 'px';
        });
    }

    addResizeHandles() {
        const dirs = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'];
        dirs.forEach(dir => {
            const handle = document.createElement('div');
            handle.className = 'resize-handle ' + dir;
            this.el.appendChild(handle);
            this.initResize(handle, dir);
        });
    }

    initResize(handle, dir) {
        let startX, startY, startW, startH, startT, startL;
        handle.addEventListener('mousedown', e => {
            e.stopPropagation();
            startX = e.clientX;
            startY = e.clientY;
            const rect = this.el.getBoundingClientRect();
            startW = rect.width; startH = rect.height;
            startT = rect.top; startL = rect.left;
            const onMouseMove = mm => {
                const dx = mm.clientX - startX;
                const dy = mm.clientY - startY;
                let newW = startW, newH = startH, newT = startT, newL = startL;

                if (dir.includes('e')) newW = startW + dx;
                if (dir.includes('s')) newH = startH + dy;
                if (dir.includes('w')) {
                    newW = startW - dx;
                    newL = startL + dx;
                }
                if (dir.includes('n')) {
                    newH = startH - dy;
                    newT = startT + dy;
                }

                // enforce mins if you like
                if (newW > 100) {
                    this.el.style.width = newW + 'px';
                    this.el.style.left = newL + 'px';
                }
                if (newH > 50) {
                    this.el.style.height = newH + 'px';
                    this.el.style.top = newT + 'px';
                }
            };
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    }

}

// Extend for specific windows
class MyComputerWindow extends MyWindow {
    constructor() {
        super('My Computer', 400, 300);
        this.content.innerHTML = '<p>Shared Documents</p><p>User\'s Documents</p>';
    }
}

class NotesWindow extends MyWindow {
    constructor() {
        super('Notes', 300, 200);
        this.content.innerHTML = '<textarea style="width:100%;height:100%"></textarea>';
    }
}

// Icon click handlers
document.getElementById('myComputerIcon').addEventListener('click', () => {
    const win = new MyComputerWindow();
    win.focus();
});
document.getElementById('notesIcon').addEventListener('click', () => {
    const win = new NotesWindow();
    win.focus();
});