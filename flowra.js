document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('.canvas');
    const exportBtn = document.getElementById('export-btn');
    const addProcessBtn = document.getElementById('add-process');
    const addDatastoreBtn = document.getElementById('add-datastore');
    const addEntityBtn = document.getElementById('add-entity');
    const contextMenu = document.getElementById('context-menu');
    const addDataflowContextBtn = document.getElementById('add-dataflow-context');
    const editLabelBtn = document.getElementById('edit-label');
    const deleteShapeBtn = document.getElementById('delete-shape');
    const modeSwitch = document.getElementById('mode');
    
    let activeElement = null;
    let contextTarget = null;
    let offsetX = 0;
    let offsetY = 0;
    let shapeCounters = { process: 1, datastore: 1, entity: 2, flow: 2 };
    let currentMode = 'normal'; // normal, drawing-flow-end
    let flowStartElement = null;

    const isEditMode = () => modeSwitch.checked;

    function updateEditorControls() {
        const editModeActive = isEditMode();
        addProcessBtn.disabled = !editModeActive;
        addDatastoreBtn.disabled = !editModeActive;
        addEntityBtn.disabled = !editModeActive;

        if (!editModeActive) {
            setMode('normal');
        }
    }

    function setMode(mode) {
        currentMode = mode;
        if (mode === 'drawing-flow-end') {
            canvas.classList.add('drawing-mode');
        } else {
            canvas.classList.remove('drawing-mode');
            flowStartElement = null;
        }
    }

    function addShape(type, label) {
        const newShape = document.createElement('div');
        const typeName = type.split('-').pop();
        const newId = `${typeName.charAt(0)}${shapeCounters[typeName]++}`;
        newShape.id = newId;
        newShape.classList.add('diagram-element', typeName);
        newShape.style.top = '20px';
        newShape.style.left = '20px';
        const span = document.createElement('span');
        span.textContent = `${newId}: ${label}`;
        newShape.appendChild(span);
        canvas.appendChild(newShape);
    }

    function addDataFlow(fromEl, toEl) {
        const newFlow = document.createElement('div');
        const newId = `flow${shapeCounters.flow++}`;
        newFlow.id = newId;
        newFlow.classList.add('data-flow');
        newFlow.dataset.from = fromEl.id;
        newFlow.dataset.to = toEl.id;
        canvas.appendChild(newFlow);
        updateArrows();
    }

    function getIntersectionPoint(rect, otherCenter) {
        const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const dx = otherCenter.x - center.x;
        const dy = otherCenter.y - center.y;
        const halfW = rect.width / 2;
        const halfH = rect.height / 2;
        if (dx === 0) return { x: center.x, y: center.y + Math.sign(dy) * halfH };
        if (dy === 0) return { x: center.x + Math.sign(dx) * halfW, y: center.y };
        const slope = dy / dx;
        const rectSlope = halfH / halfW;
        let x, y;
        if (Math.abs(slope) < rectSlope) {
            x = center.x + Math.sign(dx) * halfW;
            y = center.y + slope * (x - center.x);
        } else {
            y = center.y + Math.sign(dy) * halfH;
            x = center.x + (y - center.y) / slope;
        }
        return { x, y };
    }

    function updateArrows() {
        const flows = document.querySelectorAll('.data-flow');
        flows.forEach(flow => {
            const fromElement = document.getElementById(flow.dataset.from);
            const toElement = document.getElementById(flow.dataset.to);
            if (fromElement && toElement) {
                const fromRect = fromElement.getBoundingClientRect();
                const toRect = toElement.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();
                const fromCenter = { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 };
                const toCenter = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 };
                const startPoint = getIntersectionPoint(fromRect, toCenter);
                const endPoint = getIntersectionPoint(toRect, fromCenter);
                const x1 = startPoint.x - canvasRect.left;
                const y1 = startPoint.y - canvasRect.top;
                const x2 = endPoint.x - canvasRect.left;
                const y2 = endPoint.y - canvasRect.top;
                const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
                flow.style.width = `${length}px`;
                flow.style.left = `${x1}px`;
                flow.style.top = `${y1}px`;
                flow.style.transform = `rotate(${angle}deg)`;
            }
        });
    }

    function onMouseDown(e) {
        if (e.button !== 0) return;
        const target = e.target.closest('.diagram-element');

        if (currentMode === 'drawing-flow-end' && target && target !== flowStartElement) {
            addDataFlow(flowStartElement, target);
            setMode('normal');
            return;
        }

        if (currentMode === 'normal' && target) {
            e.preventDefault();
            activeElement = target;
            offsetX = activeElement.offsetWidth / 2;
            offsetY = activeElement.offsetHeight / 2;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }
    }

    function onMouseMove(e) {
        if (!activeElement) return;
        e.preventDefault();
        const canvasRect = canvas.getBoundingClientRect();
        let x = e.clientX - offsetX - canvasRect.left;
        let y = e.clientY - offsetY - canvasRect.top;
        x = Math.max(0, Math.min(x, canvas.clientWidth - activeElement.offsetWidth));
        y = Math.max(0, Math.min(y, canvas.clientHeight - activeElement.offsetHeight));
        activeElement.style.left = `${x}px`;
        activeElement.style.top = `${y}px`;
        updateArrows();
    }

    function onMouseUp(e) {
        if (!activeElement) return;
        e.preventDefault();
        activeElement = null;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    function handleExport() {
        const exportData = { context: { description: "○○システムについて", "root-process": {}, "external-entity": [], "data-store": [], "data-flow": [] } };
        document.querySelectorAll('.diagram-element').forEach(el => {
            const item = { id: el.id, label: el.querySelector('span').textContent || '', description: "" };
            if (el.classList.contains('process')) {
                if (!exportData.context.process) exportData.context.process = [];
                exportData.context.process.push(item);
            } else if (el.classList.contains('entity')) {
                exportData.context['external-entity'].push(item);
            }
        });
        document.querySelectorAll('.data-flow').forEach(el => {
            exportData.context['data-flow'].push({ from: el.dataset.from, to: [el.dataset.to], label: "", description: "" });
        });
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'flowra-export.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function showContextMenu(e) {
        if (!isEditMode()) return;
        e.preventDefault();
        if (currentMode !== 'normal') return;
        contextTarget = e.target.closest('.diagram-element');
        if (contextTarget) {
            contextMenu.style.top = `${e.clientY}px`;
            contextMenu.style.left = `${e.clientX}px`;
            contextMenu.style.display = 'block';
        } else {
            hideContextMenu();
        }
    }

    function hideContextMenu() {
        contextMenu.style.display = 'none';
        contextTarget = null;
    }

    function handleEditLabel() {
        if (!contextTarget) return;
        const span = contextTarget.querySelector('span');
        if (!span) return;
        const oldLabel = span.textContent;
        const parts = oldLabel.split(/:(.*)/s);
        const idPart = parts[0];
        const textPart = parts[1] ? parts[1].trim() : '';
        const newText = prompt('新しいラベルを入力してください:', textPart);
        if (newText !== null) {
            span.textContent = `${idPart}: ${newText.trim()}`;
        }
        hideContextMenu();
    }

    function handleDeleteShape() {
        if (!contextTarget) return;
        const shapeId = contextTarget.id;
        const flows = document.querySelectorAll(`.data-flow[data-from="${shapeId}"], .data-flow[data-to="${shapeId}"]`);
        flows.forEach(flow => flow.remove());
        contextTarget.remove();
        hideContextMenu();
    }

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('contextmenu', showContextMenu);
    window.addEventListener('click', (e) => {
        if (!contextMenu.contains(e.target)) {
            hideContextMenu();
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            setMode('normal');
        }
    });

    exportBtn.addEventListener('click', handleExport);
    addProcessBtn.addEventListener('click', () => addShape('process', '新規プロセス'));
    addDatastoreBtn.addEventListener('click', () => addShape('datastore', '新規データストア'));
    addEntityBtn.addEventListener('click', () => addShape('entity', '新規エンティティ'));
    
    addDataflowContextBtn.addEventListener('click', () => {
        if (contextTarget) {
            flowStartElement = contextTarget;
            setMode('drawing-flow-end');
            hideContextMenu();
        }
    });

    editLabelBtn.addEventListener('click', handleEditLabel);
    deleteShapeBtn.addEventListener('click', handleDeleteShape);
    modeSwitch.addEventListener('change', updateEditorControls);
    
    updateArrows();
    updateEditorControls(); // Set initial state
});
