document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const fileInput = document.getElementById('fileInput');
    const customButton = document.getElementById('customButton');
    const manualButton = document.getElementById('manualButton');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const fileType = document.getElementById('fileType');
    const fileModified = document.getElementById('fileModified');
    const previewButton = document.getElementById('previewButton');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const tableContainer = document.getElementById('tableContainer');
    const tableWrapper = document.getElementById('tableWrapper');
    const coordinateSystemsContainer = document.getElementById('coordinateSystemsContainer');
    
    // Элементы модального окна
    const modalOverlay = document.getElementById('modalOverlay');
    const modalTitle = document.getElementById('modalTitle');
    const closeModal = document.getElementById('closeModal');
    const cancelMapping = document.getElementById('cancelMapping');
    const applyMapping = document.getElementById('applyMapping');
    const pointColumnSelect = document.getElementById('pointColumnSelect');
    const xColumnSelect = document.getElementById('xColumnSelect');
    const yColumnSelect = document.getElementById('yColumnSelect');
    const dataframePreview = document.getElementById('dataframePreview');
    
    // Элементы управления таблицей
    const addRowButton = document.getElementById('addRowButton');
    const deleteRowButton = document.getElementById('deleteRowButton');
    const swapTableButton = document.getElementById('swapTableButton');
    const swapCoordinatesButton = document.getElementById('swapCoordinatesButton');
    const transformButton = document.getElementById('transformButton');
    
    // Глобальные переменные
    let selectedFile = null;
    let fileData = null;
    let columns = [];
    let tableData = [];
    let originalTableData = []; // Сохраняем оригинальные данные для сброса
    let isManualCreation = false;
    let coordinateConverter = null;
    let resultsTableContainer = null;
    
    // Проверяем наличие proj4
    if (typeof proj4 === 'undefined') {
        console.error('Proj4 не загружен! Добавьте <script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.8.0/proj4.js"></script> в HTML');
        showError('Библиотека Proj4 не загружена. Функция преобразования координат недоступна.');
    } else {
        coordinateConverter = new CoordinateConverter();
    }
    
    // Инициализация - скрываем модальное окно, таблицу и контейнер систем координат
    modalOverlay.style.display = 'none';
    tableContainer.style.display = 'none';
    coordinateSystemsContainer.style.display = 'none';
    transformButton.style.display = 'none'; // Скрываем кнопку преобразования по умолчанию
    
    // Скрываем сообщение об ошибке при загрузке
    hideError();
    
    // Инициализируем контейнер для результатов
    initializeResultsContainer();
    
    // При клике на кастомную кнопку активируем скрытый input
    customButton.addEventListener('click', function() {
        fileInput.click();
    });
    
    // При изменении выбора файла
    fileInput.addEventListener('change', function() {
        if (this.files && this.files.length > 0) {
            selectedFile = this.files[0];
            isManualCreation = false;
            
            // Проверяем расширение файла
            const fileName = selectedFile.name.toLowerCase();
            const allowedExtensions = ['.csv', '.txt'];
            const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
            
            if (!hasValidExtension) {
                showError('Пожалуйста, выберите файл с одним из разрешенных расширений: .csv, .txt');
                hideFileInfo();
                return;
            }
            
            // Проверяем размер файла (максимум 5 МБ)
            const maxSize = 5 * 1024 * 1024; // 5 МБ в байтах
            if (selectedFile.size > maxSize) {
                showError('Размер файла превышает максимально допустимый (5 МБ)');
                hideFileInfo();
                return;
            }
            
            // Скрываем сообщение об ошибке
            hideError();
            
            // Отображаем информацию о файле
            displayFileInfo(selectedFile);
            
            // Скрываем таблицу
            tableContainer.style.display = 'none';
            
            // Скрываем контейнер систем координат
            coordinateSystemsContainer.style.display = 'none';
            
            // Скрываем кнопку преобразования
            transformButton.style.display = 'none';
            
            // Скрываем контейнер результатов
            if (resultsTableContainer) {
                resultsTableContainer.style.display = 'none';
            }
            
            // Активируем кнопку предпросмотра
            previewButton.disabled = false;
            
            // Сбрасываем табличные данные
            tableData = [];
            originalTableData = [];
        }
    });
    
    // Кнопка "Создать вручную"
    manualButton.addEventListener('click', function() {
        isManualCreation = true;
        selectedFile = null;
        
        // Скрываем информацию о файле
        hideFileInfo();
        
        // Скрываем ошибки
        hideError();
        
        // Создаем пустую таблицу с одной строкой
        createEmptyTable();
        
        // Показываем таблицу
        tableContainer.style.display = 'block';
        
        // Показываем контейнер систем координат
        coordinateSystemsContainer.style.display = 'block';
        
        // Показываем кнопку преобразования
        transformButton.style.display = 'inline-flex';
        
        // Скрываем контейнер результатов
        if (resultsTableContainer) {
            resultsTableContainer.style.display = 'none';
        }
        
        // Сбрасываем поля систем координат
        resetCoordinateSystems();
    });
    
    // Показать модальное окно для назначения столбцов
    previewButton.addEventListener('click', async function() {
        if (!selectedFile) {
            showError('Сначала выберите файл');
            return;
        }
        
        try {
            // Показываем индикатор загрузки
            showLoadingIndicator(true, 'Загрузка файла...');
            previewButton.disabled = true;
            
            // Загружаем и парсим файл
            await loadAndParseFile(selectedFile);
            
            // Скрываем индикатор загрузки
            showLoadingIndicator(false);
            previewButton.disabled = false;
            
            // Показываем модальное окно
            showModal();
            
        } catch (error) {
            // Скрываем индикатор загрузки в случае ошибки
            showLoadingIndicator(false);
            previewButton.disabled = false;
            
            console.error('Ошибка при обработке файла:', error);
            showError(`Не удалось обработать файл: ${error.message}`);
        }
    });
    
    // Закрыть модальное окно
    closeModal.addEventListener('click', closeModalWindow);
    cancelMapping.addEventListener('click', closeModalWindow);
    
    // Применить назначение столбцов
    applyMapping.addEventListener('click', function() {
        const pointColumn = pointColumnSelect.value;
        const xColumn = xColumnSelect.value;
        const yColumn = yColumnSelect.value;
        
        if (!pointColumn || !xColumn || !yColumn) {
            alert('Пожалуйста, назначьте все три столбца (Точка, X, Y)');
            return;
        }
        
        // Проверяем, чтобы столбцы не повторялись
        if (pointColumn === xColumn || pointColumn === yColumn || xColumn === yColumn) {
            alert('Каждый столбец должен быть уникальным. Пожалуйста, выберите разные столбцы.');
            return;
        }
        
        // Создаем таблицу на основе выбранных столбцов
        createTableFromData(pointColumn, xColumn, yColumn);
        
        // Закрываем модальное окно
        closeModalWindow();
    });
    
    // Закрыть модальное окно при клике на оверлей
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) {
            closeModalWindow();
        }
    });
    
    // Добавить строку в таблицу
    addRowButton.addEventListener('click', function() {
        addRowToTable();
    });
    
    // Удалить выбранные строки
    deleteRowButton.addEventListener('click', function() {
        deleteSelectedRows();
    });
    
    // Кнопка замены координат в таблице
    swapTableButton.addEventListener('click', function() {
        swapCoordinatesInTable();
    });
    
    // Кнопка замены систем координат
    if (swapCoordinatesButton) {
        swapCoordinatesButton.addEventListener('click', function() {
            swapCoordinateSystems();
        });
    }
    
    // Кнопка преобразования координат
    transformButton.addEventListener('click', transformCoordinates);
    
    // Функция для создания пустой таблицы
    function createEmptyTable() {
        tableData = [{
            id: 1,
            point: '',
            x: '',
            y: '',
            selected: false
        }];
        
        originalTableData = JSON.parse(JSON.stringify(tableData));
        renderTable();
    }
    
    // Функция для замены координат X и Y местами
    function swapCoordinatesInTable() {
        if (tableData.length === 0) {
            alert('Таблица пуста. Нет данных для замены.');
            return;
        }
        
        // Сохраняем текущие данные как оригинальные, если еще не сохранены
        if (originalTableData.length === 0) {
            originalTableData = JSON.parse(JSON.stringify(tableData));
        }
        
        // Меняем местами X и Y
        tableData.forEach(row => {
            const temp = row.x;
            row.x = row.y;
            row.y = temp;
        });
        
        // Обновляем отображение таблицы
        renderTable();
        
        // Добавляем анимацию к кнопке swapTableButton (только для таблицы)
        swapTableButton.classList.add('swap-animation');
        
        // Убираем класс анимации после завершения
        setTimeout(() => {
            swapTableButton.classList.remove('swap-animation');
        }, 500);
    }
    
    // УПРОЩЕННАЯ И ТОЧНАЯ ФУНКЦИЯ ЗАМЕНЫ
function swapCoordinateSystemsSimple() {
    console.log('🔁 Замена систем координат...');
    
    // ТОЧНО находим элементы по ID
    const sourceInput = document.getElementById('sourceSystemInput');
    const targetInput = document.getElementById('targetSystemInput');
    
    // Проверяем, что элементы найдены и это действительно input элементы
    if (!sourceInput || !targetInput) {
        console.error('❌ Элементы не найдены! Проверьте ID элементов в HTML.');
        alert('Ошибка: поля систем координат не найдены!');
        return;
    }
    
    if (sourceInput.tagName !== 'INPUT' || targetInput.tagName !== 'INPUT') {
        console.error('❌ Элементы не являются input полями!');
        console.log('sourceInput.tagName:', sourceInput.tagName);
        console.log('targetInput.tagName:', targetInput.tagName);
        return;
    }
    
    // Показываем значения ДО замены
    console.log('📊 ДО замены:');
    console.log('  sourceSystemInput.value:', sourceInput.value);
    console.log('  targetSystemInput.value:', targetInput.value);
    
    // ПРОСТО МЕНЯЕМ ЗНАЧЕНИЯ МЕСТАМИ
    const temp = sourceInput.value;
    sourceInput.value = targetInput.value;
    targetInput.value = temp;
    
    // Показываем значения ПОСЛЕ замены
    console.log('📊 ПОСЛЕ замены:');
    console.log('  sourceSystemInput.value:', sourceInput.value);
    console.log('  targetSystemInput.value:', targetInput.value);
    
    // Обновляем информационные блоки если они есть
    updateInfoBlocks(sourceInput.value, targetInput.value);
    
    // Анимация
    if (swapCoordinatesButton) {
        swapCoordinatesButton.classList.add('swap-animation');
        setTimeout(() => {
            swapCoordinatesButton.classList.remove('swap-animation');
        }, 500);
    }
    
    console.log('✅ Замена выполнена успешно!');
}

// Обновляем информационные блоки
function updateInfoBlocks(sourceValue, targetValue) {
    const sourceInfo = document.getElementById('sourceSystemInfo');
    const targetInfo = document.getElementById('targetSystemInfo');
    
    if (sourceInfo) {
        if (sourceValue) {
            sourceInfo.innerHTML = `<p>Выбрана система: <strong>${sourceValue}</strong></p>`;
            sourceInfo.style.display = 'block';
        } else {
            sourceInfo.innerHTML = '<p class="info-placeholder">Выберите исходную систему</p>';
            sourceInfo.style.display = 'none';
        }
    }
    
    if (targetInfo) {
        if (targetValue) {
            targetInfo.innerHTML = `<p>Выбрана система: <strong>${targetValue}</strong></p>`;
            targetInfo.style.display = 'block';
        } else {
            targetInfo.innerHTML = '<p class="info-placeholder">Выберите целевую систему</p>';
            targetInfo.style.display = 'none';
        }
    }
}

// Заменяем обработчик на упрощенную версию
if (swapCoordinatesButton) {
    // Удаляем старый обработчик если есть
    swapCoordinatesButton.removeEventListener('click', swapCoordinateSystems);
    // Добавляем новый
    swapCoordinatesButton.addEventListener('click', swapCoordinateSystemsSimple);
    console.log('🔄 Обработчик замены систем координат обновлен');
}
    
    // Функция для сброса полей систем координат
    function resetCoordinateSystems() {
        const sourceSystemInput = document.getElementById('sourceSystemInput');
        const targetSystemInput = document.getElementById('targetSystemInput');
        const sourceSystemInfo = document.getElementById('sourceSystemInfo');
        const targetSystemInfo = document.getElementById('targetSystemInfo');
        
        sourceSystemInput.value = '';
        targetSystemInput.value = '';
        sourceSystemInput.selectedSystem = null;
        targetSystemInput.selectedSystem = null;
        sourceSystemInfo.style.display = 'none';
        sourceSystemInfo.innerHTML = '<p class="info-placeholder">Выберите исходную систему</p>';
        targetSystemInfo.style.display = 'none';
        targetSystemInfo.innerHTML = '<p class="info-placeholder">Выберите целевую систему</p>';
    }
    
    // Функция для загрузки и парсинга файла
    async function loadAndParseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    
                    // Парсим CSV файл
                    fileData = parseCSV(content);
                    
                    // Отображаем предпросмотр данных
                    displayDataPreview(fileData);
                    
                    // Заполняем выпадающие списки столбцами
                    populateColumnSelects();
                    
                    resolve();
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = function() {
                reject(new Error('Ошибка при чтении файла. Возможно, файл поврежден.'));
            };
            
            // Читаем файл как текст
            reader.readAsText(file, 'UTF-8');
        });
    }
    
    // Функция для парсинга CSV данных
    function parseCSV(csvText) {
        // Удаляем пустые строки и BOM (Byte Order Mark) если есть
        csvText = csvText.replace(/^\uFEFF/, '');
        const lines = csvText.split(/\r\n|\n|\r/).filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
            throw new Error('Файл пуст');
        }
        
        // Определяем разделитель
        const delimiter = detectDelimiter(lines[0]);
        
        // Получаем заголовки
        const headers = parseCSVLine(lines[0], delimiter);
        
        // Получаем данные
        const rows = [];
        for (let i = 1; i < lines.length; i++) {
            const rowData = parseCSVLine(lines[i], delimiter);
            if (rowData.length > 0) {
                // Если количество колонок не совпадает с заголовками, дополняем пустыми значениями
                while (rowData.length < headers.length) {
                    rowData.push('');
                }
                rows.push(rowData);
            }
        }
        
        console.log('Файл загружен:', { headers, rowsCount: rows.length });
        return { headers, rows };
    }
    
    // Функция для определения разделителя
    function detectDelimiter(firstLine) {
        // Подсчитываем количество запятых и точек с запятой
        const commaCount = (firstLine.match(/,/g) || []).length;
        const semicolonCount = (firstLine.match(/;/g) || []).length;
        const tabCount = (firstLine.match(/\t/g) || []).length;
        
        // Возвращаем наиболее часто встречающийся разделитель
        if (tabCount > commaCount && tabCount > semicolonCount) return '\t';
        if (semicolonCount > commaCount) return ';';
        return ',';
    }
    
    // Функция для парсинга строки CSV с учетом кавычек
    function parseCSVLine(line, delimiter) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                // Проверяем, не экранированная ли это кавычка
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++; // Пропускаем следующую кавычку
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delimiter && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Добавляем последнюю колонку
        result.push(current.trim());
        
        // Убираем кавычки с начала и конца значений
        return result.map(value => {
            if (value.startsWith('"') && value.endsWith('"')) {
                return value.substring(1, value.length - 1);
            }
            return value;
        });
    }
    
    // Функция для отображения предпросмотра данных
    function displayDataPreview(data) {
        const { headers, rows } = data;
        columns = headers;
        
        // Создаем HTML таблицы для предпросмотра
        let previewHTML = '<div class="preview-table-container"><table>';
        
        // Заголовок таблицы
        previewHTML += '<thead><tr>';
        previewHTML += '<th class="row-number">№</th>';
        headers.forEach(header => {
            previewHTML += `<th>${escapeHtml(header)}</th>`;
        });
        previewHTML += '</tr></thead>';
        
        // Тело таблицы (первые 10 строк)
        previewHTML += '<tbody>';
        const rowsToShow = Math.min(rows.length, 10);
        
        for (let i = 0; i < rowsToShow; i++) {
            previewHTML += '<tr>';
            previewHTML += `<td class="row-number">${i + 1}</td>`;
            rows[i].forEach((cell, cellIndex) => {
                // Обрезаем слишком длинные значения для удобства просмотра
                let displayValue = String(cell || '');
                if (displayValue.length > 30) {
                    displayValue = displayValue.substring(0, 27) + '...';
                }
                previewHTML += `<td title="${escapeHtml(String(cell || ''))}">${escapeHtml(displayValue)}</td>`;
            });
            previewHTML += '</tr>';
        }
        
        previewHTML += '</tbody></table></div>';
        
        // Добавляем информацию о количестве строк
        if (rows.length === 0) {
            previewHTML += '<div class="preview-info">Файл не содержит данных</div>';
        } else if (rows.length > 10) {
            previewHTML += `<div class="preview-info">Показано 10 из ${rows.length} строк</div>`;
        } else {
            previewHTML += `<div class="preview-info">Всего строк: ${rows.length}</div>`;
        }
        
        dataframePreview.innerHTML = previewHTML;
    }
    
    // Функция для заполнения выпадающих списков столбцами
    function populateColumnSelects() {
        // Очищаем списки
        pointColumnSelect.innerHTML = '<option value="">-- Выберите столбец --</option>';
        xColumnSelect.innerHTML = '<option value="">-- Выберите столбец --</option>';
        yColumnSelect.innerHTML = '<option value="">-- Выберите столбец --</option>';
        
        // Добавляем опции для каждого столбца
        columns.forEach((column) => {
            const option = document.createElement('option');
            option.value = column;
            option.textContent = column;
            
            // Клонируем опцию для каждого select
            pointColumnSelect.appendChild(option.cloneNode(true));
            xColumnSelect.appendChild(option.cloneNode(true));
            yColumnSelect.appendChild(option.cloneNode(true));
        });
        
        // Пытаемся автоматически определить столбцы по названиям
        autoDetectColumns();
    }
    
    // Функция для автоматического определения столбцов по названиям
    function autoDetectColumns() {
        columns.forEach((column) => {
            const columnLower = column.toLowerCase().trim();
            
            // Определяем столбец "Точка"
            if (columnLower.includes('точк') || columnLower.includes('назван') || 
                columnLower.includes('name') || columnLower.includes('point') ||
                columnLower.includes('ид') || columnLower.includes('id') ||
                columnLower.includes('номер') || columnLower.includes('number') ||
                columnLower.includes('label') || columnLower.includes('метка') ||
                columnLower.includes('обозначение') || columnLower === 'точка') {
                pointColumnSelect.value = column;
            }
            
            // Определяем столбец "X"
            if (columnLower === 'x' || columnLower === 'xcoord' ||
                columnLower.includes('координата x') || columnLower.includes('coord x') ||
                columnLower.includes('ось x') || columnLower.includes('coordx') ||
                columnLower.includes('longitude') || columnLower.includes('долгота') ||
                columnLower.includes('lon') || columnLower.includes('x coordinate')) {
                xColumnSelect.value = column;
            }
            
            // Определяем столбец "Y"
            if (columnLower === 'y' || columnLower === 'ycoord' ||
                columnLower.includes('координата y') || columnLower.includes('coord y') ||
                columnLower.includes('ось y') || columnLower.includes('coordy') ||
                columnLower.includes('latitude') || columnLower.includes('широта') ||
                columnLower.includes('lat') || columnLower.includes('y coordinate')) {
                yColumnSelect.value = column;
            }
        });
        
        console.log('Автоопределение столбцов:', {
            точка: pointColumnSelect.value,
            x: xColumnSelect.value,
            y: yColumnSelect.value
        });
    }
    
    // Функция для отображения модального окна
    function showModal() {
        modalTitle.textContent = `Назначение столбцов: ${selectedFile.name}`;
        modalOverlay.style.display = 'flex';
        
        // Добавляем класс для анимации
        setTimeout(() => {
            modalOverlay.querySelector('.modal').classList.add('visible');
        }, 10);
        
        console.log('Модальное окно открыто');
    }
    
    // Функция для создания таблицы на основе выбранных столбцов
    function createTableFromData(pointCol, xCol, yCol) {
        try {
            // Находим индексы выбранных столбцов
            const pointIndex = columns.indexOf(pointCol);
            const xIndex = columns.indexOf(xCol);
            const yIndex = columns.indexOf(yCol);
            
            if (pointIndex === -1 || xIndex === -1 || yIndex === -1) {
                throw new Error('Один из выбранных столбцов не найден в данных');
            }
            
            // Создаем данные для таблицы
            tableData = [];
            
            fileData.rows.forEach((row, index) => {
                // Проверяем, что индексы столбцов существуют в строке
                if (row.length > Math.max(pointIndex, xIndex, yIndex)) {
                    tableData.push({
                        id: index + 1,
                        point: String(row[pointIndex] || ''),
                        x: String(row[xIndex] || ''),
                        y: String(row[yIndex] || ''),
                        selected: false
                    });
                }
            });
            
            // Сохраняем оригинальные данные
            originalTableData = JSON.parse(JSON.stringify(tableData));
            
            console.log('Создана таблица с', tableData.length, 'строками');
            
            // Отображаем таблицу
            renderTable();
            
            // Показываем контейнер таблицы
            tableContainer.style.display = 'block';
            
            // Показываем контейнер систем координат
            coordinateSystemsContainer.style.display = 'block';
            
            // Показываем кнопку преобразования
            transformButton.style.display = 'inline-flex';
            
            // Скрываем контейнер результатов
            if (resultsTableContainer) {
                resultsTableContainer.style.display = 'none';
            }
            
            // Сбрасываем поля систем координат
            resetCoordinateSystems();
            
        } catch (error) {
            console.error('Ошибка при создании таблицы:', error);
            alert('Не удалось создать таблицу. Пожалуйста, проверьте выбранные столбцы.');
        }
    }
    
    // Функция для отрисовки таблицы
    function renderTable() {
        let tableHTML = `
            <table id="dataTable">
                <thead>
                    <tr>
                        <th class="checkbox-cell">
                            <input type="checkbox" id="selectAllCheckbox">
                        </th>
                        <th>№</th>
                        <th>Точка</th>
                        <th>Координата X</th>
                        <th>Координата Y</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Добавляем строки
        tableData.forEach((row, index) => {
            tableHTML += `
                <tr class="${row.selected ? 'selected' : ''}" data-index="${index}">
                    <td class="checkbox-cell">
                        <input type="checkbox" class="row-checkbox" ${row.selected ? 'checked' : ''}>
                    </td>
                    <td>${row.id}</td>
                    <td>
                        <input type="text" class="editable-cell" value="${escapeHtml(row.point)}" data-field="point">
                    </td>
                    <td>
                        <input type="text" class="editable-cell coordinate-x" value="${escapeHtml(row.x)}" data-field="x">
                    </td>
                    <td>
                        <input type="text" class="editable-cell coordinate-y" value="${escapeHtml(row.y)}" data-field="y">
                    </td>
                </tr>
            `;
        });
        
        tableHTML += `
                </tbody>
            </table>
        `;
        
        tableWrapper.innerHTML = tableHTML;
        
        // Добавляем обработчики событий
        addTableEventListeners();
    }
    
    // Функция для добавления обработчиков событий таблицы
    function addTableEventListeners() {
        // Обработчик для чекбокса "Выбрать все"
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        if (selectAllCheckbox) {
            selectAllCheckbox.addEventListener('change', function() {
                const isChecked = this.checked;
                tableData.forEach(row => {
                    row.selected = isChecked;
                });
                
                // Обновляем отображение
                updateTableSelection();
            });
        }
        
        // Обработчики для чекбоксов строк
        const rowCheckboxes = document.querySelectorAll('.row-checkbox');
        rowCheckboxes.forEach((checkbox, index) => {
            checkbox.addEventListener('change', function() {
                if (index < tableData.length) {
                    tableData[index].selected = this.checked;
                    
                    // Обновляем класс строки
                    const row = this.closest('tr');
                    if (this.checked) {
                        row.classList.add('selected');
                    } else {
                        row.classList.remove('selected');
                        // Снимаем выделение с "Выбрать все"
                        if (selectAllCheckbox) {
                            selectAllCheckbox.checked = false;
                        }
                    }
                }
            });
        });
        
        // Обработчики для редактируемых ячеек
        const editableCells = document.querySelectorAll('.editable-cell');
        editableCells.forEach(cell => {
            cell.addEventListener('change', function() {
                const rowIndex = parseInt(this.closest('tr').dataset.index);
                const field = this.dataset.field;
                const value = this.value;
                
                if (rowIndex >= 0 && rowIndex < tableData.length) {
                    tableData[rowIndex][field] = value;
                }
            });
            
            // Сохраняем изменения при нажатии Enter
            cell.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    this.blur();
                }
            });
        });
    }
    
    // Функция для обновления выделения строк в таблице
    function updateTableSelection() {
        const rows = document.querySelectorAll('#dataTable tbody tr');
        const selectAllCheckbox = document.getElementById('selectAllCheckbox');
        
        rows.forEach((row, index) => {
            const checkbox = row.querySelector('.row-checkbox');
            if (index < tableData.length) {
                checkbox.checked = tableData[index].selected;
                
                if (tableData[index].selected) {
                    row.classList.add('selected');
                } else {
                    row.classList.remove('selected');
                }
            }
        });
        
        // Обновляем состояние чекбокса "Выбрать все"
        if (selectAllCheckbox) {
            const allSelected = tableData.every(row => row.selected);
            const someSelected = tableData.some(row => row.selected);
            
            selectAllCheckbox.checked = allSelected;
            selectAllCheckbox.indeterminate = someSelected && !allSelected;
        }
    }
    
    // Функция для добавления новой строки
    function addRowToTable() {
        const newId = tableData.length > 0 ? Math.max(...tableData.map(row => row.id)) + 1 : 1;
        
        tableData.push({
            id: newId,
            point: '',
            x: '',
            y: '',
            selected: false
        });
        
        renderTable();
    }
    
    // Функция для удаления выбранных строк
    function deleteSelectedRows() {
        // Фильтруем строки, оставляем только невыбранные
        const beforeCount = tableData.length;
        tableData = tableData.filter(row => !row.selected);
        const afterCount = tableData.length;
        const deletedCount = beforeCount - afterCount;
        
        // Перенумеровываем строки
        tableData.forEach((row, index) => {
            row.id = index + 1;
        });
        
        if (tableData.length === 0) {
            tableContainer.style.display = 'none';
            coordinateSystemsContainer.style.display = 'none';
            transformButton.style.display = 'none';
            alert(`Удалено ${deletedCount} строк. Таблица пуста.`);
        } else {
            renderTable();
            alert(`Удалено ${deletedCount} строк. Осталось ${afterCount} строк.`);
        }
    }
    
    // Функция для отображения информации о файле
    function displayFileInfo(file) {
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        fileType.textContent = getFileTypeDescription(file.name);
        
        if (file.lastModified) {
            const modifiedDate = new Date(file.lastModified);
            fileModified.textContent = modifiedDate.toLocaleString('ru-RU');
        } else {
            fileModified.textContent = 'Недоступно';
        }
        
        // Показываем блок с информацией
        fileInfo.style.display = 'block';
    }
    
    // Функция для скрытия информации о файле
    function hideFileInfo() {
        fileInfo.style.display = 'none';
        selectedFile = null;
    }
    
    // Функция для показа ошибки
    function showError(message) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
        
        // Автоматически скрываем ошибку через 5 секунд
        setTimeout(() => {
            hideError();
        }, 5000);
    }
    
    // Функция для скрытия ошибки
    function hideError() {
        errorMessage.style.display = 'none';
    }
    
    // Функция для закрытия модального окна
    function closeModalWindow() {
        modalOverlay.style.display = 'none';
        modalOverlay.querySelector('.modal').classList.remove('visible');
        console.log('Модальное окно закрыто');
    }
    
    // Функция для форматирования размера файла
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Байт';
        
        const sizes = ['Байт', 'КБ', 'МБ', 'ГБ', 'ТБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Функция для получения описания типа файла
    function getFileTypeDescription(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        
        switch(extension) {
            case 'csv': return 'Файл с разделителями (CSV)';
            case 'txt': return 'Текстовый файл';
            default: return 'Неизвестный тип';
        }
    }
    
    // Функция для экранирования HTML
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ============================================
    // ФУНКЦИИ ДЛЯ ПРЕОБРАЗОВАНИЯ КООРДИНАТ
    // ============================================
    
    /**
     * Инициализировать контейнер для результатов
     */
    function initializeResultsContainer() {
        // Создаем контейнер для результатов
        resultsTableContainer = document.createElement('div');
        resultsTableContainer.className = 'table-container results-container';
        resultsTableContainer.id = 'resultsTableContainer';
        resultsTableContainer.style.display = 'none'; // Скрываем по умолчанию
        
        // Создаем заголовок
        const header = document.createElement('div');
        header.className = 'table-header';
        header.innerHTML = `
            <h2>Результаты преобразования координат</h2>
            <div class="table-actions">
                <button class="action-button save" id="saveResultsButton">💾 Сохранить результаты CSV</button>
                <button class="action-button close" id="closeResultsButton">× Скрыть результаты</button>
            </div>
        `;
        
        // Создаем контейнер для таблицы
        const tableWrapper = document.createElement('div');
        tableWrapper.id = 'resultsTableWrapper';
        
        // Создаем контейнер для статистики
        const statsContainer = document.createElement('div');
        statsContainer.className = 'stats-container';
        statsContainer.id = 'statsContainer';
        
        resultsTableContainer.appendChild(header);
        resultsTableContainer.appendChild(statsContainer);
        resultsTableContainer.appendChild(tableWrapper);
        
        // Вставляем после основной таблицы
        const mainTableContainer = document.getElementById('tableContainer');
        if (mainTableContainer && mainTableContainer.parentNode) {
            mainTableContainer.parentNode.insertBefore(resultsTableContainer, mainTableContainer.nextSibling);
        }
        
        // Добавляем обработчики для кнопок в результатах
        setTimeout(() => {
            const saveResultsBtn = document.getElementById('saveResultsButton');
            const closeResultsBtn = document.getElementById('closeResultsButton');
            
            if (saveResultsBtn) {
                saveResultsBtn.onclick = saveResultsToCSV;
            }
            
            if (closeResultsBtn) {
                closeResultsBtn.onclick = function() {
                    resultsTableContainer.style.display = 'none';
                };
            }
        }, 100);
    }
    
    /**
     * Получить данные из основной таблицы (исправленная версия)
     */
    function getTableData() {
        const table = document.querySelector('#tableWrapper table');
        if (!table) {
            throw new Error('Таблица не найдена');
        }
        
        const rows = table.querySelectorAll('tbody tr');
        const data = [];
        
        rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 5) { // 5 ячеек: чекбокс, №, точка, x, y
                // Получаем название точки (ячейка 2, т.к. первая - чекбокс, вторая - №)
                const nameCell = cells[2];
                let name = '';
                if (nameCell.querySelector('input')) {
                    name = nameCell.querySelector('input').value.trim();
                } else {
                    name = nameCell.textContent.trim();
                }
                
                // Получаем координату X (ячейка 3)
                const xCell = cells[3];
                let x = '';
                if (xCell.querySelector('input')) {
                    x = xCell.querySelector('input').value.trim();
                } else {
                    x = xCell.textContent.trim();
                }
                
                // Получаем координату Y (ячейка 4)
                const yCell = cells[4];
                let y = '';
                if (yCell.querySelector('input')) {
                    y = yCell.querySelector('input').value.trim();
                } else {
                    y = yCell.textContent.trim();
                }
                
                // Добавляем только если есть название или координаты
                if (name || x || y) {
                    data.push({
                        id: index + 1,
                        name: name || `Точка ${index + 1}`,
                        x: x,
                        y: y
                    });
                }
            }
        });
        
        console.log('Получены данные таблицы:', data.length, 'точек');
        return data;
    }
    
    /**
     * Преобразовать координаты
     */
    async function transformCoordinates() {
        try {
            if (!coordinateConverter) {
                showNotification('Конвертер координат не инициализирован', 'error');
                return;
            }
            
            const sourceSystem = document.getElementById('sourceSystemInput').value;
            const targetSystem = document.getElementById('targetSystemInput').value;
            
            // Проверка ввода
            if (!sourceSystem || !targetSystem) {
                showNotification('Пожалуйста, выберите исходную и целевую системы координат', 'error');
                return;
            }
            
            if (!coordinateConverter.isSystemSupported(sourceSystem)) {
                showNotification(`Исходная система координат "${sourceSystem}" не поддерживается`, 'error');
                return;
            }
            
            if (!coordinateConverter.isSystemSupported(targetSystem)) {
                showNotification(`Целевая система координат "${targetSystem}" не поддерживается`, 'error');
                return;
            }
            
            // Отключаем кнопку на время преобразования
            transformButton.disabled = true;
            transformButton.innerHTML = '<span class="button-icon">⏳</span> Преобразование...';
            
            // Показываем индикатор загрузки
            showLoadingIndicator(true, 'Преобразование координат...');
            
            // Получаем данные из таблицы
            const tableData = getTableData();
            
            if (tableData.length === 0) {
                showNotification('Таблица пуста. Добавьте данные для преобразования.', 'warning');
                showLoadingIndicator(false);
                transformButton.disabled = false;
                transformButton.innerHTML = '<span class="button-icon">🔄</span> Преобразовать координаты';
                return;
            }
            
            // Валидируем данные перед преобразованием
            const validatedData = [];
            const validationErrors = [];
            
            tableData.forEach((point, index) => {
                const validation = validateCoordinates(point.x, point.y);
                if (validation.isValid) {
                    validatedData.push({
                        ...point,
                        x: validation.x,
                        y: validation.y
                    });
                } else {
                    validationErrors.push({
                        point: point.name || `Точка ${index + 1}`,
                        error: validation.error
                    });
                }
            });
            
            // Показываем предупреждение о невалидных данных
            if (validationErrors.length > 0) {
                console.warn('Найдены некорректные точки:', validationErrors);
            }
            
            if (validatedData.length === 0) {
                showNotification('Нет валидных координат для преобразования. Проверьте данные в таблице.', 'error');
                showLoadingIndicator(false);
                transformButton.disabled = false;
                transformButton.innerHTML = '<span class="button-icon">🔄</span> Преобразовать координаты';
                return;
            }
            
            // Преобразуем координаты
            const transformedData = coordinateConverter.transformBatch(
                validatedData,
                sourceSystem,
                targetSystem
            );
            
            // Получаем статистику
            const stats = coordinateConverter.getTransformationStats(transformedData);
            
            // Добавляем информацию о валидационных ошибках
            if (validationErrors.length > 0) {
                stats.validationErrors = validationErrors.length;
                stats.totalWithErrors = tableData.length;
            }
            
            // Отображаем результаты
            displayTransformationResults(transformedData, stats, sourceSystem, targetSystem, validationErrors);
            
            // Показываем уведомление
            let notificationMessage = `Преобразовано ${stats.success} из ${stats.total} точек (${stats.successRate}% успешно)`;
            
            if (validationErrors.length > 0) {
                notificationMessage += `. Пропущено ${validationErrors.length} некорректных точек`;
            }
            
            showNotification(
                notificationMessage,
                stats.success === stats.total && validationErrors.length === 0 ? 'success' : 'warning'
            );
            
        } catch (error) {
            console.error('Ошибка преобразования координат:', error);
            showNotification(`Ошибка преобразования: ${error.message}`, 'error');
        } finally {
            // Включаем кнопку обратно
            transformButton.disabled = false;
            transformButton.innerHTML = '<span class="button-icon">🔄</span> Преобразовать координаты';
            showLoadingIndicator(false);
        }
    }
    
    /**
     * Проверить валидность координат
     */
    function validateCoordinates(x, y) {
        // Проверяем, что значения не пустые
        if (!x || !y || x.trim() === '' || y.trim() === '') {
            return { isValid: false, error: 'Координаты не могут быть пустыми' };
        }
        
        // Проверяем, что это числа
        const xNum = parseFloat(x);
        const yNum = parseFloat(y);
        
        if (isNaN(xNum) || isNaN(yNum)) {
            return { isValid: false, error: 'Координаты должны быть числами' };
        }
        
        return { 
            isValid: true, 
            x: xNum, 
            y: yNum 
        };
    }
    
    /**
     * Отобразить результаты преобразования
     */
    function displayTransformationResults(data, stats, sourceSystem, targetSystem, validationErrors = []) {
        // Обновляем статистику
        const statsContainer = document.getElementById('statsContainer');
        
        let statsHTML = `
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">Всего точек:</span>
                    <span class="stat-value">${stats.totalWithErrors || stats.total}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Успешно:</span>
                    <span class="stat-value success">${stats.success}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Ошибок преобразования:</span>
                    <span class="stat-value ${stats.errors > 0 ? 'error' : ''}">${stats.errors}</span>
                </div>
        `;
        
        if (stats.validationErrors) {
            statsHTML += `
                <div class="stat-item">
                    <span class="stat-label">Некорректные данные:</span>
                    <span class="stat-value error">${stats.validationErrors}</span>
                </div>
            `;
        }
        
        statsHTML += `
                <div class="stat-item">
                    <span class="stat-label">Успешность:</span>
                    <span class="stat-value">${stats.successRate}%</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Исходная система:</span>
                    <span class="stat-value">${sourceSystem}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Целевая система:</span>
                    <span class="stat-value">${targetSystem}</span>
                </div>
            </div>
        `;
        
        // Добавляем информацию о валидационных ошибках
        if (validationErrors.length > 0) {
            statsHTML += `
                <div class="validation-errors">
                    <strong>⚠️ Некорректные точки (пропущены):</strong>
                    <div class="validation-list">
                        ${validationErrors.slice(0, 5).map(err => 
                            `<div>• ${err.point}: ${err.error}</div>`
                        ).join('')}
                        ${validationErrors.length > 5 ? `<div>... и еще ${validationErrors.length - 5} точек</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        statsContainer.innerHTML = statsHTML;
        
        // Создаем таблицу с результатами
        const tableWrapper = document.getElementById('resultsTableWrapper');
        tableWrapper.innerHTML = '';
        
        const table = document.createElement('table');
        table.className = 'data-table results-table';
        
        // Заголовок таблицы
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>ID</th>
                <th>Название</th>
                <th>X (${sourceSystem})</th>
                <th>Y (${sourceSystem})</th>
                <th>X (${targetSystem})</th>
                <th>Y (${targetSystem})</th>
                <th>Статус</th>
                <th>Ошибка</th>
            </tr>
        `;
        
        // Тело таблицы
        const tbody = document.createElement('tbody');
        
        data.forEach(point => {
            const row = document.createElement('tr');
            row.className = point.status === 'error' ? 'error-row' : '';
            
            row.innerHTML = `
                <td>${point.id}</td>
                <td>${point.name}</td>
                <td>${formatCoordinate(point.x_original)}</td>
                <td>${formatCoordinate(point.y_original)}</td>
                <td>${point.status === 'success' ? formatCoordinate(point.x_transformed, 6) : '-'}</td>
                <td>${point.status === 'success' ? formatCoordinate(point.y_transformed, 6) : '-'}</td>
                <td>
                    <span class="status-badge ${point.status}" title="${point.status === 'success' ? 'Успешно' : 'Ошибка'}">
                        ${point.status === 'success' ? '✓' : '✗'}
                    </span>
                </td>
                <td class="error-message" title="${point.error || ''}">${point.error ? (point.error.length > 30 ? point.error.substring(0, 30) + '...' : point.error) : '-'}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        table.appendChild(thead);
        table.appendChild(tbody);
        tableWrapper.appendChild(table);
        
        // Показываем контейнер с результатами
        resultsTableContainer.style.display = 'block';
        
        // Прокручиваем к результатам
        resultsTableContainer.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Форматировать координату для отображения
     */
    function formatCoordinate(value, decimals = 4) {
        if (value === null || value === undefined || value === '' || isNaN(parseFloat(value))) return '-';
        const num = parseFloat(value);
        return num.toFixed(decimals);
    }
    
    /**
     * Сохранить результаты в CSV
     */
    function saveResultsToCSV() {
        const table = document.querySelector('.results-table');
        if (!table) {
            showNotification('Нет данных для сохранения', 'error');
            return;
        }
        
        const rows = table.querySelectorAll('tr');
        const csvContent = [];
        
        rows.forEach(row => {
            const cols = row.querySelectorAll('th, td');
            const rowData = [];
            
            cols.forEach(col => {
                // Исключаем элементы с классами status-badge
                if (!col.querySelector('.status-badge') && !col.classList.contains('status-badge')) {
                    rowData.push(`"${col.textContent.replace(/"/g, '""')}"`);
                }
            });
            
            csvContent.push(rowData.join(','));
        });
        
        const csvString = csvContent.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        const sourceSystem = document.getElementById('sourceSystemInput').value;
        const targetSystem = document.getElementById('targetSystemInput').value;
        const fileName = `coordinates_transformed_${sourceSystem}_to_${targetSystem}_${new Date().toISOString().slice(0,10)}.csv`;
        
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`Результаты сохранены в файл: ${fileName}`, 'success');
    }
    
    /**
     * Показать индикатор загрузки
     */
    function showLoadingIndicator(show, message = 'Загрузка...') {
        if (loadingIndicator) {
            if (show) {
                loadingIndicator.querySelector('p').textContent = message;
                loadingIndicator.style.display = 'flex';
            } else {
                loadingIndicator.style.display = 'none';
            }
        }
    }
    
    /**
     * Показать уведомление
     */
    function showNotification(message, type = 'info') {
        // Удаляем предыдущее уведомление
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Создаем новое уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="close-notification">&times;</button>
        `;
        
        // Добавляем стили
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 15px;
            animation: slideIn 0.3s ease;
        `;
        
        // Добавляем обработчик закрытия
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        `;
        closeBtn.onclick = () => notification.remove();
        
        document.body.appendChild(notification);
        
        // Автоматически закрываем через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }
    
    // Добавляем анимации и стили в CSS
        // Добавляем анимации и стили в CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        /* Стили для контейнера действий таблицы - ВЫРАВНИВАНИЕ ВПРАВО */
        .table-actions {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: flex-end; /* Выравнивание по правому краю */
            margin-left: auto; /* Автоматический отступ слева для выравнивания вправо */
            width: auto; /* Автоматическая ширина */
        }
        
        .action-button.transform {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
        }
        
        .action-button.transform:hover {
            background: linear-gradient(135deg, #5a0db8 0%, #1c65e8 100%);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(106, 17, 203, 0.3);
        }
        
        .action-button.transform:active {
            transform: translateY(0);
        }
        
        .action-button.transform:disabled {
            background: #cccccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        
        .action-button.transform .button-icon {
            font-size: 16px;
        }
        
        /* Стили для других кнопок в контейнере */
        .action-button.add,
        .action-button.delete,
        .action-button.swap {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }
        
        .action-button.add:hover {
            background: #e8f5e9;
            border-color: #4CAF50;
            color: #2e7d32;
        }
        
        .action-button.delete:hover {
            background: #ffebee;
            border-color: #f44336;
            color: #c62828;
        }
        
        .action-button.swap:hover {
            background: #e3f2fd;
            border-color: #2196F3;
            color: #1565c0;
        }
        
        /* Стили для заголовка таблицы */
        .table-header {
            display: flex;
            justify-content: space-between; /* Разделяем заголовок и кнопки */
            align-items: center;
            padding: 15px 20px;
            background: #f5f5f5;
            border-bottom: 1px solid #ddd;
        }
        
        .table-header h2 {
            margin: 0;
            font-size: 1.4em;
            color: #333;
        }
        
        .results-container {
            margin-top: 30px;
            border: 2px solid #4CAF50;
            background: #f8fff8;
        }
        
        .results-container .table-header {
            background: #4CAF50;
            color: white;
        }
        
        .stats-container {
            padding: 15px;
            background: #f5f5f5;
            border-bottom: 1px solid #ddd;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 12px;
            background: white;
            border-radius: 4px;
            border-left: 4px solid #4CAF50;
        }
        
        .stat-label {
            font-weight: 500;
            color: #555;
        }
        
        .stat-value {
            font-weight: bold;
        }
        
        .stat-value.success {
            color: #4CAF50;
        }
        
        .stat-value.error {
            color: #f44336;
        }
        
        .results-table {
            margin-top: 0;
        }
        
        .results-table th {
            background: #e8f5e9;
            position: sticky;
            top: 0;
        }
        
        .error-row {
            background: #ffebee !important;
        }
        
        .error-row:hover {
            background: #ffcdd2 !important;
        }
        
        .status-badge {
            display: inline-block;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            text-align: center;
            line-height: 24px;
            font-weight: bold;
        }
        
        .status-badge.success {
            background: #4CAF50;
            color: white;
        }
        
        .status-badge.error {
            background: #f44336;
            color: white;
        }
        
        .error-message {
            font-size: 12px;
            color: #f44336;
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .action-button.close {
            background: #f44336;
        }
        
        .action-button.close:hover {
            background: #d32f2f;
        }
        
        .validation-errors {
            margin-top: 15px;
            padding: 10px;
            background: #fff3cd;
            border-radius: 4px;
            border-left: 4px solid #ffc107;
        }
        
        .validation-errors strong {
            color: #856404;
            display: block;
            margin-bottom: 5px;
        }
        
        .validation-list {
            font-size: 12px;
            color: #856404;
            margin-left: 10px;
        }
        
        .swap-animation {
            animation: swapEffect 0.5s ease;
        }
        
        @keyframes swapEffect {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        /* Для мобильных устройств - адаптивность */
        @media (max-width: 768px) {
            .table-header {
                flex-direction: column;
                align-items: stretch;
                gap: 15px;
            }
            
            .table-header h2 {
                text-align: center;
            }
            
            .table-actions {
                justify-content: center; /* Центрируем на мобильных */
                margin-left: 0;
                width: 100%;
            }
            
            .action-button {
                width: 100%;
                justify-content: center;
                margin-bottom: 5px;
            }
        }
        
        /* Для очень маленьких экранов */
        @media (max-width: 480px) {
            .table-actions {
                flex-direction: column;
            }
            
            .action-button {
                font-size: 13px;
                padding: 8px 12px;
            }
        }
    `;
    document.head.appendChild(style);
});