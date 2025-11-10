document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('.canvas');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const exportBtn = document.getElementById('export-btn');
    const addProcessBtn = document.getElementById('add-process');
    const addDatastoreBtn = document.getElementById('add-datastore');
    const addEntityBtn = document.getElementById('add-entity');
    const contextMenu = document.getElementById('context-menu');
    const addDataflowContextBtn = document.getElementById('add-dataflow-context');
    const deleteDataflowContextBtn = document.getElementById('delete-dataflow-context');
    const editLabelBtn = document.getElementById('edit-label');
    const deleteShapeBtn = document.getElementById('delete-shape');
    const modeSwitch = document.getElementById('mode');
    const levelUpBtn = document.getElementById('level-up-btn');
    const levelDisplay = document.getElementById('level-display');
    const detailLevelContextBtn = document.getElementById('detail-level-context');
    
    let activeElement = null;
    let contextTarget = null;
    let offsetX = 0;
    let offsetY = 0;
    let shapeCounters = { process: 1, datastore: 1, entity: 2, flow: 2 };
    let currentMode = 'normal'; // normal, drawing-flow-end, deleting-flow-end
    let flowStartElement = null;
    let currentLevel = 0;
    let processContextStack = ['root']; // Stack to manage process context history


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
        if (mode === 'drawing-flow-end' || mode === 'deleting-flow-end') {
            canvas.classList.add('drawing-mode');
        } else {
            canvas.classList.remove('drawing-mode');
            flowStartElement = null;
        }
    }

    function addShape(type, label, top = '20px', left = '20px') {
        const typeName = type.split('-').pop();
        const newId = `${typeName.charAt(0)}${shapeCounters[typeName]++}`;
        const contextId = processContextStack[processContextStack.length - 1];
        return addShapeFromData({ id: newId, label: label, parent: contextId }, typeName, top, left);
    }

    function addShapeFromData(data, type, top = '100px', left = '100px') {
        const newShape = document.createElement('div');
        newShape.id = data.id;
        newShape.classList.add('diagram-element', type);
        newShape.style.top = top;
        newShape.style.left = left;
        newShape.dataset.parent = data.parent || 'root'; // Set parent context
        const span = document.createElement('span');
        span.textContent = data.label;
        newShape.appendChild(span);
        canvas.appendChild(newShape);
        return newShape;
    }

    function addDataFlow(fromEl, toEl) {
        const existingFlow = document.querySelector(`.data-flow[data-from="${fromEl.id}"][data-to="${toEl.id}"]`);
        if (existingFlow) {
            console.log(`Data flow from ${fromEl.id} to ${toEl.id} already exists. Skipping.`);
            return;
        }

        const newFlow = document.createElement('div');
        const newId = `flow${shapeCounters.flow++}`;
        newFlow.id = newId;
        newFlow.classList.add('data-flow');
        newFlow.dataset.from = fromEl.id;
        newFlow.dataset.to = toEl.id;
        canvas.appendChild(newFlow);
        updateArrows();
    }

    function deleteDataFlow(fromEl, toEl) {
        const flowToDelete = document.querySelector(`.data-flow[data-from="${fromEl.id}"][data-to="${toEl.id}"]`);
        if (flowToDelete) {
            flowToDelete.remove();
        }
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

        if (!target) return;

        if (currentMode === 'drawing-flow-end' && target && target !== flowStartElement) {
            addDataFlow(flowStartElement, target);
            setMode('normal');
            return;
        }

        if (currentMode === 'deleting-flow-end' && target && target !== flowStartElement) {
            deleteDataFlow(flowStartElement, target);
            setMode('normal');
            return;
        }

        if (currentMode === 'normal') {
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
        const exportData = { context: { description: "○○システムについて", process: [], "external-entity": [], "data-store": [], "data-flow": [] } };
        const elements = {};

        document.querySelectorAll('.diagram-element').forEach(el => {
            const item = { 
                id: el.id, 
                label: el.querySelector('span').textContent || '', 
                description: "",
                parent: el.dataset.parent || 'root'
            };
            
            if (el.classList.contains('process')) {
                item.process = [];
                elements[item.id] = item;
            } else if (el.classList.contains('entity')) {
                delete item.parent;
                exportData.context['external-entity'].push(item);
            } else if (el.classList.contains('datastore')) {
                delete item.parent;
                exportData.context['data-store'].push(item);
            }
        });

        const processTree = [];
        Object.values(elements).forEach(item => {
            const parentId = item.parent;
            delete item.parent;
            if (parentId && elements[parentId]) {
                elements[parentId].process.push(item);
            } else {
                processTree.push(item);
            }
        });
        exportData.context.process = processTree;


        const flowsByFrom = new Map();
        document.querySelectorAll('.data-flow').forEach(el => {
            const from = el.dataset.from;
            const to = el.dataset.to;
            if (!flowsByFrom.has(from)) {
                flowsByFrom.set(from, { to: [], label: "", description: "" });
            }
            flowsByFrom.get(from).to.push(to);
        });

        for (const [from, flowData] of flowsByFrom.entries()) {
            exportData.context['data-flow'].push({
                from: from,
                to: flowData.to,
                label: flowData.label,
                description: flowData.description
            });
        }

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

    function clearCanvas() {
        canvas.querySelectorAll('.diagram-element, .data-flow').forEach(el => el.remove());
    }

    function loadDiagram(data) {
        clearCanvas();
        
        const allShapes = [
            ...(data.context.process || []),
            ...(data.context['external-entity'] || []),
            ...(data.context['data-store'] || [])
        ];

        // Reset and update counters
        shapeCounters = { process: 1, datastore: 1, entity: 1, flow: 1 };
        const recursivelyFindShapes = (processes) => {
            processes.forEach(shape => {
                const type = shape.id.charAt(0);
                const num = parseInt(shape.id.substring(1), 10);
                if (type === 'p' && num >= shapeCounters.process) shapeCounters.process = num + 1;
                if (shape.process && shape.process.length > 0) {
                    recursivelyFindShapes(shape.process);
                }
            });
        };
        recursivelyFindShapes(data.context.process || []);

        allShapes.forEach(shape => {
            const type = shape.id.charAt(0);
            const num = parseInt(shape.id.substring(1), 10);
            if (type === 'e' && num >= shapeCounters.entity) shapeCounters.entity = num + 1;
            if (type === 's' && num >= shapeCounters.datastore) shapeCounters.datastore = num + 1;
        });

        let currentX = 50;
        let currentY = 50;
        const x_spacing = 200;
        const y_spacing = 150;
        const canvasWidth = canvas.clientWidth;

        const placeShape = (shapeData, type, parentId) => {
            shapeData.parent = parentId;
            addShapeFromData(shapeData, type, `${currentY}px`, `${currentX}px`);
            currentX += x_spacing;
            if (currentX + x_spacing > canvasWidth) {
                currentX = 50;
                currentY += y_spacing;
            }
        };

        const placeProcesses = (processes, parentId) => {
            processes.forEach(p => {
                placeShape(p, 'process', parentId);
                if (p.process && p.process.length > 0) {
                    placeProcesses(p.process, p.id);
                }
            });
        };

        placeProcesses(data.context.process || [], 'root');
        (data.context['external-entity'] || []).forEach(e => placeShape(e, 'entity', 'root'));
        (data.context['data-store'] || []).forEach(s => placeShape(s, 'datastore', 'root'));

        (data.context['data-flow'] || []).forEach(flow => {
            const fromEl = document.getElementById(flow.from);
            if (fromEl) {
                flow.to.forEach(toId => {
                    const toEl = document.getElementById(toId);
                    if (toEl) {
                        addDataFlow(fromEl, toEl);
                    }
                });
            }
        });

        currentLevel = 0;
        processContextStack = ['root'];
        renderCanvasForLevel();
    }

    function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data && data.context) {
                    loadDiagram(data);
                } else {
                    alert('無効なファイル形式です。');
                }
            } catch (error) {
                console.error('インポートエラー:', error);
                alert('ファイルの読み込みまたは解析中にエラーが発生しました。');
            }
        };
        reader.readAsText(file);
        // Reset file input to allow importing the same file again
        event.target.value = '';
    }

    function showContextMenu(e) {
        if (!isEditMode()) return;
        e.preventDefault();
        if (currentMode !== 'normal') return;
        contextTarget = e.target.closest('.diagram-element');
        if (contextTarget) {
            const isProcess = contextTarget.classList.contains('process');
            detailLevelContextBtn.style.display = isProcess ? 'block' : 'none';
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

    function updateLevelDisplay() {
        const contextId = processContextStack[processContextStack.length - 1];
        levelDisplay.textContent = `Level ${currentLevel}`;
        if (contextId !== 'root') {
            const contextShape = document.getElementById(contextId);
            const label = contextShape ? contextShape.querySelector('span').textContent : '';
            levelDisplay.textContent += `: ${label}`;
        }
        levelUpBtn.style.display = currentLevel > 0 ? 'inline-block' : 'none';
    }

    function renderCanvasForLevel() {
        const contextId = processContextStack[processContextStack.length - 1];
        const visibleElements = new Set();

        document.querySelectorAll('.diagram-element').forEach(el => {
            const elContext = el.dataset.parent || 'root';
            if (elContext === contextId) {
                el.style.display = '';
                visibleElements.add(el.id);
            } else {
                el.style.display = 'none';
            }
        });

        document.querySelectorAll('.data-flow').forEach(flow => {
            const fromVisible = visibleElements.has(flow.dataset.from);
            const toVisible = visibleElements.has(flow.dataset.to);
            if (fromVisible && toVisible) {
                flow.style.display = '';
            } else {
                flow.style.display = 'none';
            }
        });

        updateArrows();
        updateLevelDisplay();
    }

    function goToDetailLevel(processId) {
        currentLevel++;
        processContextStack.push(processId);
        renderCanvasForLevel();
    }

    function goToParentLevel() {
        if (currentLevel > 0) {
            currentLevel--;
            processContextStack.pop();
            renderCanvasForLevel();
        }
    }

    function handleEditLabel() {
        if (!contextTarget) return;
        const span = contextTarget.querySelector('span');
        if (!span) return;
        const oldLabel = span.textContent;
        const newText = prompt('新しいラベルを入力してください:', oldLabel);
        if (newText !== null) {
            span.textContent = newText.trim();
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

    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', handleImport);
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

    deleteDataflowContextBtn.addEventListener('click', () => {
        if (contextTarget) {
            flowStartElement = contextTarget;
            setMode('deleting-flow-end');
            hideContextMenu();
        }
    });

    editLabelBtn.addEventListener('click', handleEditLabel);
    deleteShapeBtn.addEventListener('click', handleDeleteShape);
    modeSwitch.addEventListener('change', updateEditorControls);
    detailLevelContextBtn.addEventListener('click', () => {
        if (contextTarget && contextTarget.classList.contains('process')) {
            goToDetailLevel(contextTarget.id);
        }
        hideContextMenu();
    });
    levelUpBtn.addEventListener('click', goToParentLevel);
    
    updateEditorControls(); // Set initial state
    renderCanvasForLevel(); // Initial render
});
