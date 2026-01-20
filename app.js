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
    const saveTableButton = document.getElementById('saveTableButton');
    const swapTableButton = document.getElementById('swapTableButton');
    
    // Элементы контейнера систем координат
    const swapCoordinatesButton = document.getElementById('swapCoordinatesButton');
    const transformButton = document.getElementById('transformButton');
    const resetButton = document.getElementById('resetButton');

    // Переменные для систем координат
    const sourceSystemInput = document.getElementById('sourceSystemInput');
    const targetSystemInput = document.getElementById('targetSystemInput');
    const sourceDropdown = document.getElementById('sourceDropdown');
    const targetDropdown = document.getElementById('targetDropdown');
    const sourceSystemInfo = document.getElementById('sourceSystemInfo');
    const targetSystemInfo = document.getElementById('targetSystemInfo');
    
    // Глобальные переменные
    let selectedFile = null;
    let fileData = null;
    let columns = [];
    let tableData = [];
    let originalTableData = []; // Сохраняем оригинальные данные для сброса
    let isManualCreation = false;
    const coordinateSystems = [
        {
            id: 'wgs84',
            name: 'WGS 84',
            code: 'EPSG:4326',
            description: 'Всемирная геодезическая система 1984 года',
            type: 'географическая',
            ellipsoid: 'WGS 84',
            area: 'Весь мир',
            datum: 'WGS84'
        },
        {
            id: 'sk42',
            name: 'СК-42',
            code: 'EPSG:4284',
            description: 'Система координат 1942 года',
            type: 'географическая',
            ellipsoid: 'Красовского',
            area: 'СССР/Россия',
            datum: 'Пулково 1942'
        },
        {
            id: 'pulkovo42',
            name: 'Пулково 1942',
            code: 'EPSG:4284',
            description: 'Пулковская система координат 1942 года',
            type: 'географическая',
            ellipsoid: 'Красовского',
            area: 'СССР/Россия',
            datum: 'Пулково 1942'
        },
        {
            id: 'msk',
            name: 'МСК',
            code: 'Местная СК',
            description: 'Местная система координат',
            type: 'плоская прямоугольная',
            ellipsoid: 'Красовского',
            area: 'Локальная зона',
            datum: 'Местный'
        },
        {
            id: 'msk52',
            name: 'МСК-52',
            code: 'СК-52',
            description: 'Московская система координат 1952 года',
            type: 'плоская прямоугольная',
            ellipsoid: 'Красовского',
            area: 'Московская область',
            datum: 'Пулково 1942'
        },
        {
            id: 'msk63',
            name: 'МСК-63',
            code: 'СК-63',
            description: 'Московская система координат 1963 года',
            type: 'плоская прямоугольная',
            ellipsoid: 'Красовского',
            area: 'Московская область',
            datum: 'Пулково 1942'
        },
        {
            id: 'utmn',
            name: 'UTM Северное',
            code: 'EPSG:326XX',
            description: 'Универсальная поперечная проекция Меркатора',
            type: 'проекционная',
            ellipsoid: 'WGS 84',
            area: 'Зональная',
            datum: 'WGS84'
        },
        {
            id: 'utms',
            name: 'UTM Южное',
            code: 'EPSG:327XX',
            description: 'Универсальная поперечная проекция Меркатора',
            type: 'проекционная',
            ellipsoid: 'WGS 84',
            area: 'Зональная',
            datum: 'WGS84'
        },
        {
            id: 'gauss',
            name: 'Гаусс-Крюгер',
            code: 'СК-42 ГК',
            description: 'Проекция ГауссаКрюгера',
            type: 'проекционная',
            ellipsoid: 'Красовского',
            area: 'СССР/Россия',
            datum: 'Пулково 1942'
        },
        {
            id: 'cgcs2000',
            name: 'CGCS 2000',
            code: 'EPSG:4490',
            description: 'Китайская геодезическая система координат 2000',
            type: 'географическая',
            ellipsoid: 'CGCS2000',
            area: 'Китай',
            datum: 'CGCS2000'
        },
        {
            id: 'nad83',
            name: 'NAD83',
            code: 'EPSG:4269',
            description: 'Североамериканская система 1983 года',
            type: 'географическая',
            ellipsoid: 'GRS 80',
            area: 'Северная Америка',
            datum: 'NAD83'
        },
        {
            id: 'ed50',
            name: 'ED50',
            code: 'EPSG:4230',
            description: 'Европейская система 1950 года',
            type: 'географическая',
            ellipsoid: 'International 1924',
            area: 'Европа',
            datum: 'European 1950'
        }
    ];
    
    // Инициализация - скрываем модальное окно, таблицу и контейнер систем координат
    modalOverlay.style.display = 'none';
    tableContainer.style.display = 'none';
    coordinateSystemsContainer.style.display = 'none';
    
    // // При клике на кастомную кнопку активируем скрытый input
    // customButton.addEventListener('click', function() {
    //     fileInput.click();
    // });
    
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
            
            // Скрываем таблицу и контейнер систем координат
            tableContainer.style.display = 'none';
            coordinateSystemsContainer.style.display = 'none';
            
            // Активируем кнопку предпросмотра
            previewButton.disabled = false;
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
    });
    
    // Показать модальное окно для назначения столбцов
    previewButton.addEventListener('click', async function() {
        if (!selectedFile) {
            showError('Сначала выберите файл');
            return;
        }
        
        try {
            // Показываем индикатор загрузки
            loadingIndicator.style.display = 'block';
            previewButton.disabled = true;
            
            // Загружаем и парсим файл
            await loadAndParseFile(selectedFile);
            
            // Скрываем индикатор загрузки
            loadingIndicator.style.display = 'none';
            previewButton.disabled = false;
            
            // Показываем модальное окно
            showModal();
            
        } catch (error) {
            // Скрываем индикатор загрузки в случае ошибки
            loadingIndicator.style.display = 'none';
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
    
    // Сохранить таблицу как CSV
    saveTableButton.addEventListener('click', function() {
        saveTableDataAsCSV();
    });
    
    // Кнопка замены координат в таблице
    swapTableButton.addEventListener('click', function() {
        swapCoordinatesInTable();
    });
    
    // Кнопка замены систем координат
    swapCoordinatesButton.addEventListener('click', function() {
        swapCoordinateSystems();
    });
    
    // Кнопка применения преобразования
    transformButton.addEventListener('click', function() {
        applyCoordinateTransformation();
    });
    
    // Кнопка сброса к исходным данным
    resetButton.addEventListener('click', function() {
        resetToOriginalData();
    });
    
    // Обработчики для автодополнения систем координат
    sourceSystemInput.addEventListener('input', function() {
        handleAutocomplete(this, sourceDropdown, sourceSystemInfo);
    });
    
    targetSystemInput.addEventListener('input', function() {
        handleAutocomplete(this, targetDropdown, targetSystemInfo);
    });
    
    sourceSystemInput.addEventListener('focus', function() {
        if (this.value.trim() !== '') {
            handleAutocomplete(this, sourceDropdown, sourceSystemInfo);
        }
    });
    
    targetSystemInput.addEventListener('focus', function() {
        if (this.value.trim() !== '') {
            handleAutocomplete(this, targetDropdown, targetSystemInfo);
        }
    });
    
    // Закрытие выпадающих списков при клике вне их
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.input-with-dropdown')) {
            sourceDropdown.style.display = 'none';
            targetDropdown.style.display = 'none';
        }
    });
    
    // Навигация с клавиатуры в выпадающих списках
    sourceSystemInput.addEventListener('keydown', function(e) {
        handleDropdownNavigation(e, sourceDropdown, this);
    });
    
    targetSystemInput.addEventListener('keydown', function(e) {
        handleDropdownNavigation(e, targetDropdown, this);
    });
    
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
    
    // Функция для замены систем координат местами
    // Функция для замены систем координат местами
function swapCoordinateSystems() {
    const tempValue = sourceSystemInput.value;
    const tempInfo = sourceSystemInfo.innerHTML;
    
    sourceSystemInput.value = targetSystemInput.value;
    targetSystemInput.value = tempValue;
    
    sourceSystemInfo.innerHTML = targetSystemInfo.innerHTML;
    targetSystemInfo.innerHTML = tempInfo;
    
    // Обновляем видимость блоков с информацией
    if (sourceSystemInfo.innerHTML.trim() !== '') {
        sourceSystemInfo.classList.add('visible');
    } else {
        sourceSystemInfo.classList.remove('visible');
    }
    
    if (targetSystemInfo.innerHTML.trim() !== '') {
        targetSystemInfo.classList.add('visible');
    } else {
        targetSystemInfo.classList.remove('visible');
    }
    
    // Добавляем анимацию ТОЛЬКО к swapCoordinatesButton
    swapCoordinatesButton.classList.add('swap-animation');
    setTimeout(() => {
        swapCoordinatesButton.classList.remove('swap-animation');
    }, 500);
    
    console.log('Системы координат поменяны местами');
}
    
    // Функция для применения преобразования систем координат
    function applyCoordinateTransformation() {
        if (tableData.length === 0) {
            alert('Таблица пуста. Нет данных для преобразования.');
            return;
        }
        
        const sourceSystemName = sourceSystemInput.value.trim();
        const targetSystemName = targetSystemInput.value.trim();
        
        if (!sourceSystemName || !targetSystemName) {
            alert('Пожалуйста, выберите исходную и целевую системы координат.');
            return;
        }
        
        // Находим выбранные системы в списке
        const sourceSystem = coordinateSystems.find(sys => 
            sys.name.toLowerCase() === sourceSystemName.toLowerCase() ||
            sys.code.toLowerCase() === sourceSystemName.toLowerCase()
        );
        
        const targetSystem = coordinateSystems.find(sys => 
            sys.name.toLowerCase() === targetSystemName.toLowerCase() ||
            sys.code.toLowerCase() === targetSystemName.toLowerCase()
        );
        
        if (!sourceSystem || !targetSystem) {
            alert('Пожалуйста, выберите системы координат из списка.');
            return;
        }
        
        if (sourceSystem.id === targetSystem.id) {
            alert('Исходная и целевая системы координат одинаковые. Преобразование не требуется.');
            return;
        }
        
        // Сохраняем текущие данные как оригинальные, если еще не сохранены
        if (originalTableData.length === 0) {
            originalTableData = JSON.parse(JSON.stringify(tableData));
        }
        
        // В реальном приложении здесь было бы преобразование координат
        // между разными системами. Для демонстрации просто покажем сообщение.
        
        alert(`Преобразование координат из "${sourceSystem.name}" (${sourceSystem.code}) в "${targetSystem.name}" (${targetSystem.code}) применено.\n\nВ реальном приложении здесь будет выполнено математическое преобразование координат с учетом параметров эллипсоидов и проекций.`);
        
        // Обновляем отображение таблицы (в реальном приложении здесь были бы преобразованные координаты)
        renderTable();
    }
    
    // Функция для сброса к исходным данным
    function resetToOriginalData() {
        if (originalTableData.length === 0) {
            alert('Нет сохраненных исходных данных для сброса.');
            return;
        }
        
        tableData = JSON.parse(JSON.stringify(originalTableData));
        renderTable();
        
        // Очищаем поля систем координат
        sourceSystemInput.value = '';
        targetSystemInput.value = '';
        sourceSystemInfo.classList.remove('visible');
        targetSystemInfo.classList.remove('visible');
        
        alert('Данные сброшены к исходным значениям. Выбор систем координат очищен.');
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
                        <input type="text" class="editable-cell" value="${escapeHtml(row.x)}" data-field="x">
                    </td>
                    <td>
                        <input type="text" class="editable-cell" value="${escapeHtml(row.y)}" data-field="y">
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
            alert(`Удалено ${deletedCount} строк. Таблица пуста.`);
        } else {
            renderTable();
            alert(`Удалено ${deletedCount} строк. Осталось ${afterCount} строк.`);
        }
    }
    
    // Функция для сохранения данных таблицы как CSV
    function saveTableDataAsCSV() {
        if (tableData.length === 0) {
            alert('Таблица пуста. Нет данных для сохранения.');
            return;
        }
        
        // Формируем CSV содержимое
        let csvContent = "ID,Точка,X,Y\n";
        
        tableData.forEach(row => {
            // Экранируем кавычки в значениях
            const escapedPoint = row.point.replace(/"/g, '""');
            csvContent += `${row.id},"${escapedPoint}",${row.x},${row.y}\n`;
        });
        
        // Создаем Blob и ссылку для скачивания
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.setAttribute('href', url);
        link.setAttribute('download', `координаты_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Показываем сообщение об успешном сохранении
        alert(`Таблица сохранена в CSV файл. Сохранено ${tableData.length} строк.`);
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
    
    // Функция для обработки автодополнения
    function handleAutocomplete(inputElement, dropdown, infoElement) {
        const query = inputElement.value.toLowerCase().trim();
        
        // Скрываем выпадающий список если запрос пустой
        if (query === '') {
            dropdown.style.display = 'none';
            infoElement.classList.remove('visible');
            return;
        }
        
        // Фильтруем системы по запросу
        const filteredSystems = coordinateSystems.filter(system => 
            system.name.toLowerCase().includes(query) || 
            system.code.toLowerCase().includes(query) ||
            system.description.toLowerCase().includes(query) ||
            (system.type && system.type.toLowerCase().includes(query))
        );
        
        // Обновляем выпадающий список
        updateAutocompleteDropdown(filteredSystems, dropdown, infoElement, inputElement);
    }
    
    // Функция для обновления выпадающего списка
    function updateAutocompleteDropdown(systems, dropdown, infoElement, inputElement) {
        dropdown.innerHTML = '';
        
        if (systems.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'autocomplete-item no-results';
            noResults.textContent = 'Система не найдена';
            dropdown.appendChild(noResults);
        } else {
            systems.forEach(system => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.dataset.systemId = system.id;
                item.tabIndex = 0;
                
                item.innerHTML = `
                    <div class="system-name">${escapeHtml(system.name)}</div>
                    <div class="system-code">${escapeHtml(system.code)}</div>
                    <div class="system-description">${escapeHtml(system.description)}</div>
                `;
                
                item.addEventListener('click', function() {
                    selectSystem(system, dropdown, infoElement, inputElement);
                });
                
                item.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        selectSystem(system, dropdown, infoElement, inputElement);
                    }
                });
                
                dropdown.appendChild(item);
            });
        }
        
        dropdown.style.display = 'block';
        dropdown.style.zIndex = '1000';
    }
    
    // Функция для выбора системы
    function selectSystem(system, dropdown, infoElement, inputElement) {
        inputElement.value = system.name;
        dropdown.style.display = 'none';
        
        // Отображаем информацию о системе
        displaySystemInfo(system, infoElement);
        
        // Фокусируемся на input
        inputElement.focus();
    }
    
    // Функция для отображения информации о системе
    function displaySystemInfo(system, infoElement) {
        infoElement.innerHTML = `
            <div class="system-info-content">
                <div class="system-header">
                    <h4>${escapeHtml(system.name)}</h4>
                    <span class="system-code-badge">${escapeHtml(system.code)}</span>
                </div>
                <p class="system-description">${escapeHtml(system.description)}</p>
                <div class="system-details">
                    <div class="detail-item">
                        <span class="detail-label">Тип:</span>
                        <span class="detail-value">${escapeHtml(system.type)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Эллипсоид:</span>
                        <span class="detail-value">${escapeHtml(system.ellipsoid)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Область:</span>
                        <span class="detail-value">${escapeHtml(system.area)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Датум:</span>
                        <span class="detail-value">${escapeHtml(system.datum)}</span>
                    </div>
                </div>
            </div>
        `;
        infoElement.classList.add('visible');
    }
    
    // Функция для обработки навигации с клавиатуры
    function handleDropdownNavigation(e, dropdown, inputElement) {
        if (dropdown.style.display !== 'block') return;
        
        const items = dropdown.querySelectorAll('.autocomplete-item:not(.no-results)');
        if (items.length === 0) return;
        
        const currentActive = dropdown.querySelector('.autocomplete-item.active');
        let currentIndex = currentActive ? Array.from(items).indexOf(currentActive) : -1;
        
        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                if (currentActive) currentActive.classList.remove('active');
                currentIndex = (currentIndex + 1) % items.length;
                items[currentIndex].classList.add('active');
                items[currentIndex].scrollIntoView({ block: 'nearest' });
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                if (currentActive) currentActive.classList.remove('active');
                currentIndex = (currentIndex - 1 + items.length) % items.length;
                items[currentIndex].classList.add('active');
                items[currentIndex].scrollIntoView({ block: 'nearest' });
                break;
                
            case 'Enter':
                e.preventDefault();
                const activeItem = dropdown.querySelector('.autocomplete-item.active');
                if (activeItem) {
                    const systemId = activeItem.dataset.systemId;
                    const system = coordinateSystems.find(s => s.id === systemId);
                    if (system) {
                        const infoElement = dropdown.id === 'sourceDropdown' ? sourceSystemInfo : targetSystemInfo;
                        selectSystem(system, dropdown, infoElement, inputElement);
                    }
                }
                break;
                
            case 'Escape':
                dropdown.style.display = 'none';
                break;
        }
    }
});