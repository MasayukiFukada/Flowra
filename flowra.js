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
    const canvasTitle = document.querySelector('.canvas-title'); // 追加
    const clearAllBtn = document.getElementById('clear-all-btn'); // 追加
    const editCanvasTitleBtn = document.getElementById('edit-canvas-title');
    
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
        addDatastoreBtn.disabled = !editModeActive || currentLevel < 1;
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

            if (type === 'process') {

                newShape.classList.add('no-detail'); // Add class by default

            }

            newShape.style.top = top;

            newShape.style.left = left;

            newShape.dataset.parent = data.parent || 'root'; // Set parent context

            const span = document.createElement('span');

            span.textContent = data.label;

            newShape.appendChild(span);

            canvas.appendChild(newShape);

            return newShape;

        }

    

        function addDataFlow(fromEl, toEl, label = "") {

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

    

            const labelSpan = document.createElement('span');

            labelSpan.className = 'data-flow-label';

            labelSpan.textContent = label;

            labelSpan.dataset.flowId = newId; // Link to the flow

            canvas.appendChild(labelSpan); // Add label to canvas

    

            updateArrows();

        }

    

        function deleteDataFlow(fromEl, toEl) {

            const flowToDelete = document.querySelector(`.data-flow[data-from="${fromEl.id}"][data-to="${toEl.id}"]`);

            if (flowToDelete) {

                const labelToDelete = canvas.querySelector(`.data-flow-label[data-flow-id="${flowToDelete.id}"]`);

                if (labelToDelete) {

                    labelToDelete.remove();

                }

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

                    const x1 = startPoint.x - canvasRect.left + window.scrollX;

                    const y1 = startPoint.y - canvasRect.top + window.scrollY;

                    const x2 = endPoint.x - canvasRect.left + window.scrollX;

                    const y2 = endPoint.y - canvasRect.top + window.scrollY;

                    

                    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

                    let angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    

                    flow.style.width = `${length}px`;

                    flow.style.left = `${x1}px`;

                    flow.style.top = `${y1}px`;

                    flow.style.transform = `rotate(${angle}deg)`;

    

                    // Position the label

                    const label = canvas.querySelector(`.data-flow-label[data-flow-id="${flow.id}"]`);

                    if (label) {

                        const midX = x1 + (x2 - x1) / 2;

                        const midY = y1 + (y2 - y1) / 2;

                        label.style.left = `${midX}px`;

                        label.style.top = `${midY}px`;

                    }

                }

            });

        }

    

        function onMouseDown(e) {

            if (e.button !== 0) return; // Only allow left-click drag

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

                    parent: el.dataset.parent || 'root',

                    top: el.style.top,

                    left: el.style.left

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

    

    

            document.querySelectorAll('.data-flow').forEach(el => {

                const label = canvas.querySelector(`.data-flow-label[data-flow-id="${el.id}"]`);

                exportData.context['data-flow'].push({

                    from: el.dataset.from,

                    to: el.dataset.to,

                    label: label ? label.textContent : "",

                    description: "" // description is not editable in the UI yet

                });

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

    

                function clearCanvas() {

    

                    if (confirm('キャンバス上のすべての要素を削除してもよろしいですか？')) {

    

                        canvas.querySelectorAll('.diagram-element, .data-flow, .data-flow-label').forEach(el => el.remove());

    

                    }

    

                }

    

        function loadDiagram(data) {

            clearCanvas();

            

            // --- Shape Counter Update ---

            shapeCounters = { process: 1, datastore: 1, entity: 1, flow: 1 };

            const allShapes = [

                ...(data.context['external-entity'] || []),

                ...(data.context['data-store'] || [])

            ];

            const recursivelyFindShapes = (processes) => {

                processes.forEach(shape => {

                    allShapes.push(shape);

                    if (shape.process && shape.process.length > 0) {

                        recursivelyFindShapes(shape.process);

                    }

                });

            };

            recursivelyFindShapes(data.context.process || []);

            

            allShapes.forEach(shape => {

                const type = shape.id.charAt(0);

                const num = parseInt(shape.id.substring(1), 10);

                if (type === 'p' && num >= shapeCounters.process) shapeCounters.process = num + 1;

                if (type === 'e' && num >= shapeCounters.entity) shapeCounters.entity = num + 1;

                if (type === 's' && num >= shapeCounters.datastore) shapeCounters.datastore = num + 1;

            });

    

            // --- Shape Placement ---

            let autoLayoutX = 50;

            let autoLayoutY = 50;

            const x_spacing = 200;

            const y_spacing = 150;

            const canvasWidth = canvas.clientWidth;

    

            const getAutoLayoutParams = () => {

                const params = { top: `${autoLayoutY}px`, left: `${autoLayoutX}px` };

                autoLayoutX += x_spacing;

                if (autoLayoutX + x_spacing > canvasWidth) {

                    autoLayoutX = 50;

                    autoLayoutY += y_spacing;

                }

                return params;

            };

    

            const placeShape = (shapeData, type, parentId) => {

                shapeData.parent = parentId;

                const top = shapeData.top || getAutoLayoutParams().top;

                const left = shapeData.left || getAutoLayoutParams().left;

                addShapeFromData(shapeData, type, top, left);

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

            (data.context['external-entity'] || []).forEach(e => placeShape(e, 'entity', e.parent || 'root'));

            (data.context['data-store'] || []).forEach(s => placeShape(s, 'datastore', s.parent || 'root'));

    

            // --- Flow Placement ---

            (data.context['data-flow'] || []).forEach(flow => {

                const fromEl = document.getElementById(flow.from);

                if (fromEl) {

                    if (Array.isArray(flow.to)) { // Handle old format (to is an array)

                        flow.to.forEach(toId => {

                            const toEl = document.getElementById(toId);

                            if (toEl) {

                                addDataFlow(fromEl, toEl, flow.label);

                            }

                        });

                    } else { // Handle new format (to is a string)

                        const toEl = document.getElementById(flow.to);

                        if (toEl) {

                            addDataFlow(fromEl, toEl, flow.label);

                        }

                    }

                }

            });

    

            // --- Final Render ---

            currentLevel = 0;

            processContextStack = ['root'];

            renderCanvasForLevel();

            updateProcessStyles();

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

            e.preventDefault();

            if (currentMode !== 'normal') return;

            

            contextTarget = e.target.closest('.diagram-element, .data-flow');
            const isCanvasTitle = e.target === canvasTitle;

            if (contextTarget || isCanvasTitle) {

                const editMode = isEditMode();
                const isProcess = contextTarget && contextTarget.classList.contains('process');
                const isDataFlow = contextTarget && contextTarget.classList.contains('data-flow');

                // Configure menu items based on mode and target
                document.getElementById('add-dataflow-context').style.display = editMode && !isDataFlow && !isCanvasTitle ? 'block' : 'none';
                document.getElementById('delete-dataflow-context').style.display = editMode && !isDataFlow && !isCanvasTitle ? 'block' : 'none';
                document.getElementById('edit-label').style.display = editMode && !isDataFlow && !isCanvasTitle ? 'block' : 'none';
                document.getElementById('delete-shape').style.display = editMode && !isDataFlow && !isCanvasTitle ? 'block' : 'none';
                document.getElementById('detail-level-context').style.display = isProcess && !isCanvasTitle ? 'block' : 'none';
                document.getElementById('edit-flow-label').style.display = editMode && isDataFlow ? 'block' : 'none';
                document.getElementById('edit-canvas-title').style.display = editMode && isCanvasTitle ? 'block' : 'none';
                
                const hasVisibleItems = (isProcess && !editMode) || (editMode); // Simplified logic

                if (!hasVisibleItems && !isCanvasTitle) {

                    hideContextMenu();

                    return;

                }

    

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

    

        function updateProcessStyles() {

            const allProcesses = document.querySelectorAll('.process');

            allProcesses.forEach(procEl => {

                const processId = procEl.id;

                const childElement = document.querySelector(`.diagram-element[data-parent="${processId}"]`);

                if (childElement) {

                    procEl.classList.remove('no-detail');

                } else {

                    procEl.classList.add('no-detail');

                }

            });

        }

    

        function renderCanvasForLevel() {

            const contextId = processContextStack[processContextStack.length - 1];

            const visibleElements = new Set();

    

            document.querySelectorAll('.diagram-element').forEach(el => {

                const elContext = el.dataset.parent || 'root';

                let isVisible = false;

    

                // Rule 1: Is the element defined in the current context?

                if (elContext === contextId) {

                    if (el.classList.contains('datastore') && currentLevel === 0) {

                        isVisible = false;

                    } else {

                        isVisible = true;

                    }

                }

                // Rule 2: Special visibility rules for entities and datastores.

                else if (el.classList.contains('entity')) {

                    // Entities defined at root are visible everywhere.

                    if (elContext === 'root') {

                        isVisible = true;

                    }

                } else if (el.classList.contains('datastore')) {

                    // Datastores are visible from level 1 onwards.

                    if (currentLevel >= 1) {

                        isVisible = true;

                    }

                }

    

                if (isVisible) {

                    el.style.display = '';

                    visibleElements.add(el.id);

                } else {

                    el.style.display = 'none';

                }

            });

    

            document.querySelectorAll('.data-flow').forEach(flow => {

                const fromVisible = visibleElements.has(flow.dataset.from);

                const toVisible = visibleElements.has(flow.dataset.to);

                const label = canvas.querySelector(`.data-flow-label[data-flow-id="${flow.id}"]`);

                if (fromVisible && toVisible) {

                    flow.style.display = '';

                    if (label) label.style.display = '';

                } else {

                    flow.style.display = 'none';

                    if (label) label.style.display = 'none';

                }

            });

    

            updateArrows();

            updateLevelDisplay();

            updateEditorControls();

            updateProcessStyles();

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

    

        function handleEditFlowLabel() {

            if (!contextTarget || !contextTarget.classList.contains('data-flow')) return;

            const label = canvas.querySelector(`.data-flow-label[data-flow-id="${contextTarget.id}"]`);

            if (!label) return;

            const oldLabel = label.textContent;

            const newText = prompt('新しいフローラベルを入力してください:', oldLabel);

            if (newText !== null) {

                label.textContent = newText.trim();

            }

            hideContextMenu();

        }

    

        function handleEditCanvasTitle() {
            const oldTitle = canvasTitle.textContent;
            const newText = prompt('新しいタイトルを入力してください:', oldTitle);
            if (newText !== null) {
                canvasTitle.textContent = newText.trim();
            }
            hideContextMenu();
        }

    

        function handleDeleteShape() {

            if (!contextTarget) return;

            const shapeId = contextTarget.id;

            const flows = document.querySelectorAll(`.data-flow[data-from="${shapeId}"], .data-flow[data-to="${shapeId}"]`);

            flows.forEach(flow => {

                const labelToDelete = canvas.querySelector(`.data-flow-label[data-flow-id="${flow.id}"]`);

                if (labelToDelete) {

                    labelToDelete.remove();

                }

                flow.remove();

            });

            contextTarget.remove();

            hideContextMenu();

        }

    

        canvas.addEventListener('mousedown', onMouseDown);

        canvas.addEventListener('contextmenu', showContextMenu);
        canvasTitle.addEventListener('contextmenu', showContextMenu);

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

        document.getElementById('edit-flow-label').addEventListener('click', handleEditFlowLabel);
        editCanvasTitleBtn.addEventListener('click', handleEditCanvasTitle);

        deleteShapeBtn.addEventListener('click', handleDeleteShape);

        modeSwitch.addEventListener('change', updateEditorControls);

        detailLevelContextBtn.addEventListener('click', () => {

            if (contextTarget && contextTarget.classList.contains('process')) {

                goToDetailLevel(contextTarget.id);

            }

            hideContextMenu();

        });

        levelUpBtn.addEventListener('click', goToParentLevel);
        clearAllBtn.addEventListener('click', clearCanvas);

        

        updateEditorControls(); // Set initial state

        renderCanvasForLevel(); // Initial render

    });
