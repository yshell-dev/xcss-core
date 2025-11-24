const AUTOREFRESH = false;

// --- Initial Load ---

const RootBody = document.getElementById('live-preview-body');
const RootMain = document.getElementById('live-preview-main');
window.addEventListener('load', () => {
    setTimeout(() => {
        RootBody.parentElement.removeAttribute("style");
    }, 100);
});

// --- Deploy Output Fragment ----

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const StapleElement = document.getElementById('live-preview-output-staple');
const OutputElement = document.getElementById('live-preview-output-container');
const RootCssElement = document.getElementById('live-preview-root-css');
const CompCssElement = document.getElementById('live-preview-comp-css');
const SymClassElement = document.getElementById('live-preview-symclass');

const activeComponent = {
    staple: "",
    summon: "",
    symclass: "",
    attributes: {},
    rootcss: "",
    compcss: "",
}

const outputState = {
    useProjectCss: false,
    activateResize: false,
    preserveScale: false,
    activateDebug: false,
}


let OutputStyle = '';
function OutputUpdate(updateComponent = false, newComponent = activeComponent) {
    if (OutputElement.hasAttribute('style')) { OutputStyle = OutputElement.getAttribute('style') ?? OutputStyle; }

    if (outputState.preserveScale) {
        OutputElement.setAttribute('style', OutputStyle);
    } else {
        if (outputState.activateResize && !OutputElement.hasAttribute('style')) { OutputElement.setAttribute('style', OutputStyle); }
        else if (!outputState.activateResize && OutputElement.hasAttribute('style')) { OutputElement.removeAttribute('style'); }
    }
    OutputElement.setAttribute("data-live-preview-output-container-debug", String(outputState.activateDebug))
    OutputElement.setAttribute("data-live-preview-output-container-resize", String(outputState.activateResize))
    OutputElement.setAttribute("data-live-preview-output-container-preserve", String(outputState.preserveScale))
    OutputElement.setAttribute("data-live-preview-output-container-preserve", String(outputState.preserveScale))

    RootCssElement.innerText = outputState.useProjectCss ? newComponent.rootcss : "";
    CompCssElement.innerText = newComponent.compcss;

    if (updateComponent) {
        const staple = (typeof newComponent.staple === "string") ? newComponent.staple : '';
        const structure = (typeof newComponent.summon === "string" && newComponent.summon.length) ? newComponent.summon : "[Placeholder]";
        const selector = (typeof newComponent.symclass === "string" && newComponent.symclass.length) ? newComponent.symclass : '[N/A]';

        StapleElement.innerHTML = staple;
        OutputElement.innerHTML = structure;
        OutputElement.className = "_";
        SymClassElement.innerHTML = selector;

        const attributes = newComponent.attributes
        if (typeof attributes === "object") {
            RootMain.setAttribute("style", typeof attributes["style"] === "string" ? attributes["style"].slice(1, -1) : "")
            Object.entries(attributes).forEach(([attr, value]) => {
                if (typeof value === "string") {
                    const fval = value.slice(1, -1);

                    if (attr === "class") {
                        OutputElement.classList.add(...fval.split(" "))
                    } else if (![
                        "id", "style",
                        "data-live-preview-output-container-debug",
                        "data-live-preview-output-container-resize",
                    ].includes(attr)) {
                        OutputElement.setAttribute(attr, fval)
                    }
                }
            })
        } else {
            RootMain.removeAttribute("style", "");
            OutputElement.getAttributeNames.forEach(attr => {
                if (![
                    "id", "class", "style",
                    "data-live-preview-output-container-debug",
                    "data-live-preview-output-container-resize",
                ].includes(attr)) {
                    OutputElement.removeAttribute(attr)
                }
            })
        }
    }
    Object.assign(activeComponent, newComponent);
}

// --- Drag handle Logic ---

let dragActive = false;
const dragStart = { x: 0, y: 0 };
const dragPosition = { top: 0, left: 0 };
const widgetElement = document.getElementById('live-preview-widget');
const dragElement = document.getElementById('live-preview-option-drag-handle');

if (dragElement && widgetElement) {
    dragElement.addEventListener('mousedown', (e) => {
        dragActive = true;
        dragStart.x = e.clientX;
        dragStart.y = e.clientY;
        const computedStyle = window.getComputedStyle(widgetElement);
        dragPosition.left = parseFloat(computedStyle.left || '0');
        dragPosition.top = parseFloat(computedStyle.top || '0');
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (dragActive) {
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            dragPosition.top = dragPosition.top + dy;
            dragPosition.left = dragPosition.left + dx;
            widgetElement.style.top = dragPosition.top + 'px';
            widgetElement.style.left = dragPosition.left + 'px';
            dragStart.x = e.clientX;
            dragStart.y = e.clientY;
        }
    });

    document.addEventListener('mouseup', () => {
        if (dragActive) {
            dragActive = false;
            document.body.style.userSelect = '';
        }
    });
}

// --- WebSocket Setup ---

const ws = new WebSocket(`ws://${location.hostname}:${location.port}/ws`);

ws.onopen = function () {
    console.log('WebSocket connected');
};
ws.onerror = function (e) {
    console.error('WebSocket error:', e);
};

let awaitRefresh = false;
ws.onmessage = function (evt) {
    const response = JSON.parse(evt.data);
    if (response.method === 'sandbox-state-set' || response.method === 'sandbox-state-init') {
        tweakIndex[response.result.key]?.apply(response.result.value);
        OutputUpdate(false);
    } else if (response.method === 'sandbox-view') {
        if (AUTOREFRESH) {
            if (awaitRefresh) { return }
            awaitRefresh = true;
            setTimeout(() => awaitRefresh = false, 250)
        }
        try {
            const result = response.result;
            if (result && typeof result === "object") {
                OutputUpdate(true, result);
            } else {
                OutputUpdate(false);
            }
        } catch (e) {
            console.error("Unable to update component!");
        }
    }
};


// --- Tweak class modification ---
class Tweak {
    constructor(key, fallback, applyFunction = () => { }, options = {}) {
        this.key = key;
        this.fallback = fallback;
        this.apply = applyFunction.bind(this);
        this.dom_element = this.element;
        this.options = options;
    }

    get element() {
        if (!this.dom_element) {
            this.dom_element = document.getElementById(this.key);
            if (this.dom_element) {
                this.dom_element.addEventListener('change', () => { this.Update(); });
            }
        }
        return this.dom_element;
    }

    Initialize() {
        if (this.element) {
            const message = JSON.stringify({
                jsonrpc: "2.0",
                method: 'sandbox-state-init',
                id: Date.now(),
                params: {
                    key: this.key,
                    value: this.fallback,
                }
            })
            ws.send(message);
            this.apply();
        }
    }

    Update() {
        if (ws.readyState === WebSocket.OPEN && this.element) {
            const message = JSON.stringify({
                jsonrpc: "2.0",
                method: 'sandbox-state-set',
                id: Date.now(),
                params: {
                    key: this.key,
                    value: this.element.type === 'checkbox'
                        ? this.element.checked
                        : this.element.value
                }
            })
            console.log(message)
            ws.send(message);
            this.apply();
        }
    }
}

const tweaks = [
    new Tweak('live-preview-option-color-picker', '#ffffff', function (value = this.element?.value) {
        if (this.element && value !== undefined) {
            this.element.value = value;
            document.getElementById("live-preview-body").style.setProperty("--live-preview-extension-background", value);
        }
    }),
    new Tweak('live-preview-option-live-cursor', false, function (value = this.element?.checked) {
        if (this.element && value !== undefined) {
            const valBool = typeof value === "boolean" ? value : (value === 'true');
            this.element.checked = valBool;
            if (valBool) this.element.setAttribute("checked", "")
            else this.element.removeAttribute("checked")
            OutputUpdate();
        }
    }),

    new Tweak('live-preview-option-project-index', false, function (value = this.element?.checked) {
        if (this.element && value !== undefined) {
            const valBool = typeof value === "boolean" ? value : (value === 'true');
            this.element.checked = valBool;
            outputState.useProjectCss = valBool;
            if (valBool) this.element.setAttribute("checked", "")
            else this.element.removeAttribute("checked")
            OutputUpdate();
        }
    }),
    new Tweak('live-preview-option-container-resize', false, function (value = this.element?.checked) {
        if (this.element && value !== undefined) {
            const valBool = typeof value === "boolean" ? value : (value === 'true');
            this.element.checked = valBool;
            outputState.activateResize = valBool;
            if (valBool) this.element.setAttribute("checked", "")
            else this.element.removeAttribute("checked")
            OutputUpdate();
        }
    }),
    new Tweak('live-preview-option-preserve-scale', false, function (value = this.element?.checked) {
        if (this.element && value !== undefined) {
            const valBool = typeof value === "boolean" ? value : (value === 'true');
            this.element.checked = valBool;
            outputState.preserveScale = valBool;
            if (valBool) this.element.setAttribute("checked", "")
            else this.element.removeAttribute("checked")
            OutputUpdate();
        }
    }),
    new Tweak('live-preview-option-debug-mode', false, function (value = this.element?.checked) {
        if (this.element && value !== undefined) {
            const valBool = typeof value === "boolean" ? value : (value === 'true');
            this.element.checked = valBool;
            outputState.activateDebug = valBool;
            if (valBool) this.element.setAttribute("checked", "")
            else this.element.removeAttribute("checked")
            OutputUpdate();
        }
    }),
];

function requstComponent() {
    if (!awaitRefresh) {
        ws.send(JSON.stringify({
            jsonrpc: "2.0",
            method: 'sandbox-view',
            id: Date.now(),
            params: {}
        }));
    }
}

const tweakIndex = {}
ws.onopen = () => {
    tweaks.forEach((tweak) => {
        tweakIndex[tweak.key] = tweak;
        tweak.Initialize();
    });
    requstComponent;
    if (AUTOREFRESH) {
        setInterval(requstComponent, 1000)
    }
};
