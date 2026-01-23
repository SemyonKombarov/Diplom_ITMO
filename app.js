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
    
    // Переменные для управления сворачиванием
    let isFileInputSectionCollapsed = false;
    let isCoordinateSystemsCollapsed = false;
    
    // ======================= ОБЪЯВЛЕНИЕ ВСПОМОГАТЕЛЬНЫХ ФУНКЦИЙ =======================
    
    // Функция для отображения ошибки
    function showError(message) {
        if (errorText && errorMessage) {
            errorText.textContent = message;
            errorMessage.style.display = 'block';
            
            // Автоматически скрываем ошибку через 5 секунд
            setTimeout(() => {
                hideError();
            }, 5000);
        } else {
            console.error('Error elements not found:', message);
        }
    }
    
    // Функция для скрытия ошибки
    function hideError() {
        if (errorMessage) {
            errorMessage.style.display = 'none';
        }
    }
    
    // Функция для отображения индикатора загрузки
    function showLoadingIndicator(show, message = 'Загрузка...') {
        if (loadingIndicator) {
            if (show) {
                const span = loadingIndicator.querySelector('span');
                if (span) span.textContent = message;
                loadingIndicator.style.display = 'flex';
            } else {
                loadingIndicator.style.display = 'none';
            }
        }
    }
    
    // Функция для экранирования HTML
    function escapeHtml(text) {
        if (text === null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Функция для получения расширения файла
    function getFileExtension(filename) {
        if (!filename) return 'Неизвестно';
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2) || 'Неизвестно';
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
    
    // Функция для закрытия модального окна
    function closeModalWindow() {
        if (modalOverlay) {
            modalOverlay.querySelector('.modal').classList.remove('visible');
            setTimeout(() => {
                modalOverlay.style.display = 'none';
            }, 300);
        }
    }
    
    // Функция для сброса полей систем координат
    function resetCoordinateSystems() {
        const sourceSystemInput = document.getElementById('sourceSystemInput');
        const targetSystemInput = document.getElementById('targetSystemInput');
        const sourceSystemInfo = document.getElementById('sourceSystemInfo');
        const targetSystemInfo = document.getElementById('targetSystemInfo');
        
        if (sourceSystemInput) sourceSystemInput.value = '';
        if (targetSystemInput) targetSystemInput.value = '';
        
        if (sourceSystemInfo) {
            sourceSystemInfo.style.display = 'none';
            sourceSystemInfo.innerHTML = '<p class="info-placeholder">Выберите исходную систему</p>';
        }
        
        if (targetSystemInfo) {
            targetSystemInfo.style.display = 'none';
            targetSystemInfo.innerHTML = '<p class="info-placeholder">Выберите целевую систему</p>';
        }
    }
    
    // Функция для скрытия информации о файле
    function hideFileInfo() {
        if (fileInfo) {
            fileInfo.style.display = 'none';
        }
        selectedFile = null;
    }
    
    // ======================= КЛАСС CoordinateConverter =======================
    
    class CoordinateConverter {
        constructor() {
            if (typeof proj4 !== 'undefined') {
                this.proj4 = proj4;
                this.initCoordinateSystems();
            } else {
                console.error('Proj4 не загружен!');
                throw new Error('Proj4 библиотека не загружена');
            }
        }
        
        initCoordinateSystems() {
            try {
                // WGS84 (широта/долгота)
                proj4.defs("EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +units=degrees");
                
                // Пулково 1942
                proj4.defs("EPSG:4284", "+title=Pulkovo 1942 +proj=longlat +ellps=krass +towgs84=23.92,-141.27,-80.9,-0,0.35,0.82,-0.12 +no_defs");
                
                // UTM зона 37N
                proj4.defs("EPSG:32637", "+proj=utm +zone=37 +datum=WGS84 +units=m +no_defs");
                
                // ГСК-2011
                proj4.defs("EPSG:7683", "+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs");
                
                console.log('Инициализированы системы координат');
            } catch (error) {
                console.error('Ошибка инициализации систем координат:', error);
            }
        }
        
        isSystemSupported(systemCode) {
            try {
                const def = proj4.defs(systemCode);
                return def !== undefined;
            } catch (error) {
                return false;
            }
        }
        
        transformCoordinates(x, y, sourceSystem, targetSystem) {
            try {
                const transformed = proj4(sourceSystem, targetSystem, [x, y]);
                return {
                    x: transformed[0],
                    y: transformed[1]
                };
            } catch (error) {
                console.error('Ошибка преобразования координат:', error);
                throw new Error(`Ошибка преобразования: ${error.message}`);
            }
        }
        
        transformBatch(data, sourceSystem, targetSystem) {
            const results = [];
            
            for (const point of data) {
                try {
                    const transformed = this.transformCoordinates(point.x, point.y, sourceSystem, targetSystem);
                    results.push({
                        ...point,
                        x_original: point.x,
                        y_original: point.y,
                        x_transformed: transformed.x,
                        y_transformed: transformed.y,
                        status: 'success',
                        error: null
                    });
                } catch (error) {
                    results.push({
                        ...point,
                        x_original: point.x,
                        y_original: point.y,
                        x_transformed: null,
                        y_transformed: null,
                        status: 'error',
                        error: error.message
                    });
                }
            }
            
            return results;
        }
        
        getTransformationStats(data) {
            const total = data.length;
            const success = data.filter(p => p.status === 'success').length;
            const errors = data.filter(p => p.status === 'error').length;
            const successRate = total > 0 ? ((success / total) * 100).toFixed(2) : 0;
            
            return {
                total,
                success,
                errors,
                successRate
            };
        }
    }
    
    // ======================= ОСНОВНОЙ КОД =======================
    
    // Проверяем наличие proj4 и инициализируем конвертер
    if (typeof proj4 === 'undefined') {
        console.error('Proj4 не загружен! Добавьте <script src="https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.8.0/proj4.js"></script> в HTML');
        showError('Библиотека Proj4 не загружена. Функция преобразования координат недоступна.');
    } else {
        try {
            coordinateConverter = new CoordinateConverter();
        } catch (error) {
            console.error('Ошибка инициализации конвертера координат:', error);
        }
    }
    
    // Инициализация - скрываем модальное окно, таблицу и контейнер систем координат
    if (modalOverlay) modalOverlay.style.display = 'none';
    if (tableContainer) tableContainer.style.display = 'none';
    if (coordinateSystemsContainer) coordinateSystemsContainer.style.display = 'none';
    if (transformButton) transformButton.style.display = 'none'; // Скрываем кнопку преобразования по умолчанию
    
    // Скрываем сообщение об ошибке при загрузке
    hideError();
    
    // Инициализируем контейнер для результатов
    initializeResultsContainer();
    
    // Инициализируем кнопки сворачивания
    initializeCollapseButtons();
    
    // При клике на кастомную кнопку активируем скрытый input
    if (customButton && fileInput) {
        customButton.addEventListener('click', function() {
            fileInput.click();
        });
    }
    
    // При изменении выбора файла
    if (fileInput) {
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
                if (tableContainer) tableContainer.style.display = 'none';
                
                // Скрываем контейнер систем координат
                if (coordinateSystemsContainer) coordinateSystemsContainer.style.display = 'none';
                
                // Скрываем кнопку преобразования
                if (transformButton) transformButton.style.display = 'none';
                
                // Скрываем контейнер результатов
                if (resultsTableContainer) {
                    resultsTableContainer.style.display = 'none';
                }
                
                // Активируем кнопку предпросмотра
                if (previewButton) previewButton.disabled = false;
                
                // Сбрасываем табличные данные
                tableData = [];
                originalTableData = [];
            }
        });
    }
    
    // Кнопка "Создать вручную"
    if (manualButton) {
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
            if (tableContainer) tableContainer.style.display = 'block';
            
            // Показываем контейнер систем координат
            if (coordinateSystemsContainer) coordinateSystemsContainer.style.display = 'block';
            
            // Показываем кнопку преобразования
            if (transformButton) transformButton.style.display = 'inline-flex';
            
            // Скрываем контейнер результатов
            if (resultsTableContainer) {
                resultsTableContainer.style.display = 'none';
            }
            
            // Сбрасываем поля систем координат
            resetCoordinateSystems();
        });
    }
    
    // Показать модальное окно для назначения столбцов
    if (previewButton) {
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
    }
    
    // Закрыть модальное окно
    if (closeModal) closeModal.addEventListener('click', closeModalWindow);
    if (cancelMapping) cancelMapping.addEventListener('click', closeModalWindow);
    
    // Применить назначение столбцов
    if (applyMapping) {
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
    }
    
    // Закрыть модальное окно при клике на оверлей
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModalWindow();
            }
        });
    }
    
    // Добавить строку в таблицу
    if (addRowButton) {
        addRowButton.addEventListener('click', function() {
            addRowToTable();
        });
    }
    
    // Удалить выбранные строки
    if (deleteRowButton) {
        deleteRowButton.addEventListener('click', function() {
            deleteSelectedRows();
        });
    }
    
    // Кнопка замены координат в таблице
    if (swapTableButton) {
        swapTableButton.addEventListener('click', function() {
            swapCoordinatesInTable();
        });
    }
    
    // Кнопка замены систем координат
    if (swapCoordinatesButton) {
        swapCoordinatesButton.addEventListener('click', swapCoordinateSystems);
    }
    
    // Кнопка преобразования координат
    if (transformButton) {
        transformButton.addEventListener('click', transformCoordinates);
    }
    
    // Функция для инициализации кнопок сворачивания
    function initializeCollapseButtons() {
        // Создаем кнопку сворачивания для блока выбора файла
        const fileInputSection = document.querySelector('.file-input-section');
        if (fileInputSection) {
            // Находим основной контент для сворачивания
            const contentToCollapse = fileInputSection.querySelector('.selection-options');
            if (!contentToCollapse) return;
            
            // Сохраняем оригинальные стили контента
            const originalContentStyles = {
                display: contentToCollapse.style.display || 'block',
                height: contentToCollapse.style.height || 'auto',
                overflow: contentToCollapse.style.overflow || 'visible',
                opacity: contentToCollapse.style.opacity || '1',
                marginTop: contentToCollapse.style.marginTop || '0',
                marginBottom: contentToCollapse.style.marginBottom || '0'
            };
            
            const collapseButton = document.createElement('button');
            collapseButton.className = 'collapse-button';
            collapseButton.innerHTML = '▲';
            collapseButton.title = 'Свернуть/развернуть';
            collapseButton.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 16px;
                cursor: pointer;
                color: #666;
                z-index: 10;
                padding: 5px;
                border-radius: 3px;
                transition: all 0.3s ease;
            `;
            
            collapseButton.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f0f0f0';
            });
            
            collapseButton.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'transparent';
            });
            
            collapseButton.addEventListener('click', function() {
                if (isFileInputSectionCollapsed) {
                    // Разворачиваем
                    contentToCollapse.style.display = originalContentStyles.display;
                    contentToCollapse.style.height = originalContentStyles.height;
                    contentToCollapse.style.overflow = originalContentStyles.overflow;
                    contentToCollapse.style.opacity = '1';
                    contentToCollapse.style.marginTop = originalContentStyles.marginTop;
                    contentToCollapse.style.marginBottom = originalContentStyles.marginBottom;
                    this.innerHTML = '▲';
                    this.style.transform = 'rotate(0deg)';
                    isFileInputSectionCollapsed = false;
                } else {
                    // Сворачиваем
                    contentToCollapse.style.display = 'block';
                    contentToCollapse.style.height = '0';
                    contentToCollapse.style.overflow = 'hidden';
                    contentToCollapse.style.opacity = '0';
                    contentToCollapse.style.marginTop = '0';
                    contentToCollapse.style.marginBottom = '0';
                    this.innerHTML = '▼';
                    this.style.transform = 'rotate(180deg)';
                    isFileInputSectionCollapsed = true;
                }
            });
            
            fileInputSection.style.position = 'relative';
            fileInputSection.appendChild(collapseButton);
        }
        
        // Создаем кнопку сворачивания для блока систем координат
        const coordinateHeader = coordinateSystemsContainer ? coordinateSystemsContainer.querySelector('h3') : null;
        if (coordinateHeader) {
            // Находим основной контент для сворачивания
            const contentToCollapse = coordinateSystemsContainer.querySelector('.coordinate-systems');
            if (!contentToCollapse) return;
            
            // Сохраняем оригинальные стили контента
            const originalContentStyles = {
                display: contentToCollapse.style.display || 'block',
                height: contentToCollapse.style.height || 'auto',
                overflow: contentToCollapse.style.overflow || 'visible',
                opacity: contentToCollapse.style.opacity || '1',
                marginTop: contentToCollapse.style.marginTop || '0',
                marginBottom: contentToCollapse.style.marginBottom || '0'
            };
            
            const collapseButton = document.createElement('button');
            collapseButton.className = 'collapse-button';
            collapseButton.innerHTML = '▲';
            collapseButton.title = 'Свернуть/развернуть';
            collapseButton.style.cssText = `
                margin-left: 10px;
                background: none;
                border: none;
                font-size: 14px;
                cursor: pointer;
                color: #666;
                padding: 2px 5px;
                border-radius: 3px;
                transition: all 0.3s ease;
                vertical-align: middle;
            `;
            
            collapseButton.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#f0f0f0';
            });
            
            collapseButton.addEventListener('mouseleave', function() {
                this.style.backgroundColor = 'transparent';
            });
            
            collapseButton.addEventListener('click', function() {
                if (isCoordinateSystemsCollapsed) {
                    // Разворачиваем
                    contentToCollapse.style.display = originalContentStyles.display;
                    contentToCollapse.style.height = originalContentStyles.height;
                    contentToCollapse.style.overflow = originalContentStyles.overflow;
                    contentToCollapse.style.opacity = '1';
                    contentToCollapse.style.marginTop = originalContentStyles.marginTop;
                    contentToCollapse.style.marginBottom = originalContentStyles.marginBottom;
                    this.innerHTML = '▲';
                    this.style.transform = 'rotate(0deg)';
                    isCoordinateSystemsCollapsed = false;
                } else {
                    // Сворачиваем
                    contentToCollapse.style.display = 'block';
                    contentToCollapse.style.height = '0';
                    contentToCollapse.style.overflow = 'hidden';
                    contentToCollapse.style.opacity = '0';
                    contentToCollapse.style.marginTop = '0';
                    contentToCollapse.style.marginBottom = '0';
                    this.innerHTML = '▼';
                    this.style.transform = 'rotate(180deg)';
                    isCoordinateSystemsCollapsed = true;
                }
            });
            
            coordinateHeader.appendChild(collapseButton);
        }
    }
    
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
        if (swapTableButton) {
            swapTableButton.classList.add('swap-animation');
            setTimeout(() => {
                swapTableButton.classList.remove('swap-animation');
            }, 500);
        }
    }
    
    // Функция для замены систем координат местами (исправленная версия)
    function swapCoordinateSystems() {
        console.log('Кнопка замены систем координат нажата');
        
        const sourceSystemInput = document.getElementById('sourceSystemInput');
        const targetSystemInput = document.getElementById('targetSystemInput');
        const sourceSystemInfo = document.getElementById('sourceSystemInfo');
        const targetSystemInfo = document.getElementById('targetSystemInfo');
        
        // Проверяем наличие элементов
        if (!sourceSystemInput || !targetSystemInput || !sourceSystemInfo || !targetSystemInfo) {
            console.error('Не все элементы найдены для замены систем координат');
            return;
        }
        
        // Получаем текущие значения
        const sourceValue = sourceSystemInput.value;
        const targetValue = targetSystemInput.value;
        
        // Получаем текущую информацию
        const sourceInfo = sourceSystemInfo.innerHTML;
        const targetInfo = targetSystemInfo.innerHTML;
        
        // Меняем значения местами
        sourceSystemInput.value = targetValue;
        targetSystemInput.value = sourceValue;
        
        // Меняем информацию о системах
        sourceSystemInfo.innerHTML = targetInfo;
        targetSystemInfo.innerHTML = sourceInfo;
        
        // Обновляем отображение информации
        updateSystemInfoDisplay(sourceSystemInfo);
        updateSystemInfoDisplay(targetSystemInfo);
        
        // Добавляем анимацию к кнопке swapCoordinatesButton
        if (swapCoordinatesButton) {
            swapCoordinatesButton.classList.add('swap-animation');
            setTimeout(() => {
                swapCoordinatesButton.classList.remove('swap-animation');
            }, 500);
        }
        
        console.log('Системы координат успешно заменены местами:', {
            source: targetValue,
            target: sourceValue
        });
    }
    
    // Вспомогательная функция для обновления отображения информации о системе
    function updateSystemInfoDisplay(systemInfoElement) {
        if (!systemInfoElement) return;
        
        if (systemInfoElement.innerHTML.includes('info-placeholder')) {
            systemInfoElement.style.display = 'none';
        } else {
            systemInfoElement.style.display = 'block';
        }
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
        if (!dataframePreview || !data) return;
        
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
        if (!pointColumnSelect || !xColumnSelect || !yColumnSelect) return;
        
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
        if (!pointColumnSelect || !xColumnSelect || !yColumnSelect) return;
        
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
        if (!modalTitle || !modalOverlay) return;
        
        modalTitle.textContent = `Назначение столбцов: ${selectedFile.name}`;
        modalOverlay.style.display = 'flex';
        
        // Добавляем класс для анимации
        setTimeout(() => {
            const modal = modalOverlay.querySelector('.modal');
            if (modal) modal.classList.add('visible');
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
            if (tableContainer) tableContainer.style.display = 'block';
            
            // Показываем контейнер систем координат
            if (coordinateSystemsContainer) coordinateSystemsContainer.style.display = 'block';
            
            // Показываем кнопку преобразования
            if (transformButton) transformButton.style.display = 'inline-flex';
            
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
        if (!tableWrapper) return;
        
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
            if (tableContainer) tableContainer.style.display = 'none';
            if (coordinateSystemsContainer) coordinateSystemsContainer.style.display = 'none';
            if (transformButton) transformButton.style.display = 'none';
            alert(`Удалено ${deletedCount} строк. Таблица пуста.`);
        } else {
            renderTable();
            alert(`Удалено ${deletedCount} строк. Осталось ${afterCount} строк.`);
        }
    }
    
    // Функция для отображения информации о файле
    function displayFileInfo(file) {
        if (!fileName || !fileSize || !fileType || !fileModified || !fileInfo) return;
        
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
    
    // Функция для инициализации контейнера для результатов
    function initializeResultsContainer() {
        // Проверяем, не создан ли уже контейнер
        if (document.getElementById('resultsTableContainer')) {
            resultsTableContainer = document.getElementById('resultsTableContainer');
            return;
        }
        
        // Создаем контейнер для результатов
        resultsTableContainer = document.createElement('div');
        resultsTableContainer.className = 'table-container results-container';
        resultsTableContainer.id = 'resultsTableContainer';
        resultsTableContainer.style.cssText = `
            display: none;
            margin-top: 30px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        `;
        
        // Создаем заголовок
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 15px 20px;
            background: #4CAF50;
            color: white;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        header.innerHTML = '<h3 style="margin: 0;">Результаты преобразования</h3>';
        
        const closeResultsButton = document.createElement('button');
        closeResultsButton.innerHTML = '×';
        closeResultsButton.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.3s;
        `;
        
        closeResultsButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(255,255,255,0.2)';
        });
        
        closeResultsButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });
        
        closeResultsButton.addEventListener('click', function() {
            resultsTableContainer.style.display = 'none';
        });
        
        header.appendChild(closeResultsButton);
        
        // Создаем контейнер для контента
        const resultsContent = document.createElement('div');
        resultsContent.id = 'resultsContent';
        resultsContent.style.cssText = `
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
        `;
        
        resultsTableContainer.appendChild(header);
        resultsTableContainer.appendChild(resultsContent);
        
        // Добавляем контейнер результатов после основной таблицы
        if (tableContainer) {
            tableContainer.parentNode.insertBefore(resultsTableContainer, tableContainer.nextSibling);
        }
    }
    
    // Получить данные из основной таблицы (упрощенная версия)
    function getTableData() {
        const data = [];
        
        tableData.forEach((row, index) => {
            // Пытаемся преобразовать координаты в числа
            let x, y;
            
            try {
                x = parseFloat(row.x.replace(',', '.'));
                y = parseFloat(row.y.replace(',', '.'));
            } catch (e) {
                x = NaN;
                y = NaN;
            }
            
            data.push({
                id: index + 1,
                name: row.point || `Точка ${index + 1}`,
                x: x,
                y: y
            });
        });
        
        console.log('Получены данные таблицы:', data.length, 'точек');
        return data;
    }
    
    // Преобразовать координаты
    async function transformCoordinates() {
        try {
            if (!coordinateConverter) {
                showError('Конвертер координат не инициализирован');
                return;
            }
            
            const sourceSystemInput = document.getElementById('sourceSystemInput');
            const targetSystemInput = document.getElementById('targetSystemInput');
            
            if (!sourceSystemInput || !targetSystemInput) {
                showError('Элементы систем координат не найдены');
                return;
            }
            
            const sourceSystem = sourceSystemInput.value.trim();
            const targetSystem = targetSystemInput.value.trim();
            
            // Проверка ввода
            if (!sourceSystem || !targetSystem) {
                showError('Пожалуйста, выберите исходную и целевую системы координат');
                return;
            }
            
            if (sourceSystem === targetSystem) {
                showError('Исходная и целевая системы координат должны быть разными');
                return;
            }
            
            // Проверяем поддержку систем координат
            if (!coordinateConverter.isSystemSupported(sourceSystem)) {
                showError(`Исходная система координат "${sourceSystem}" не поддерживается`);
                return;
            }
            
            if (!coordinateConverter.isSystemSupported(targetSystem)) {
                showError(`Целевая система координат "${targetSystem}" не поддерживается`);
                return;
            }
            
            // Отключаем кнопку на время преобразования
            if (transformButton) {
                transformButton.disabled = true;
                transformButton.innerHTML = '⏳ Преобразование...';
            }
            
            // Показываем индикатор загрузки
            showLoadingIndicator(true, 'Преобразование координат...');
            
            // Получаем данные из таблицы
            const tableData = getTableData();
            
            if (tableData.length === 0) {
                showError('Таблица пуста. Добавьте данные для преобразования.');
                showLoadingIndicator(false);
                if (transformButton) {
                    transformButton.disabled = false;
                    transformButton.innerHTML = '🔄 Преобразовать координаты';
                }
                return;
            }
            
            // Валидируем данные перед преобразованием
            const validatedData = [];
            const validationErrors = [];
            
            tableData.forEach((point, index) => {
                if (isNaN(point.x) || isNaN(point.y)) {
                    validationErrors.push({
                        point: point.name || `Точка ${index + 1}`,
                        error: 'Некорректные координаты (должны быть числами)'
                    });
                } else {
                    validatedData.push(point);
                }
            });
            
            if (validatedData.length === 0) {
                showError('Нет валидных координат для преобразования. Проверьте данные в таблице.');
                showLoadingIndicator(false);
                if (transformButton) {
                    transformButton.disabled = false;
                    transformButton.innerHTML = '🔄 Преобразовать координаты';
                }
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
            
            // Отображаем результаты
            displayTransformationResults(transformedData, sourceSystem, targetSystem);
            
            // Показываем уведомление
            let notificationMessage = `Преобразовано ${stats.success} из ${stats.total} точек (${stats.successRate}% успешно)`;
            
            if (validationErrors.length > 0) {
                notificationMessage += `. Пропущено ${validationErrors.length} некорректных точек`;
            }
            
            // Показываем всплывающее сообщение
            setTimeout(() => {
                alert(notificationMessage);
            }, 100);
            
        } catch (error) {
            console.error('Ошибка преобразования координат:', error);
            showError(`Ошибка преобразования: ${error.message}`);
        } finally {
            // Включаем кнопку обратно
            if (transformButton) {
                transformButton.disabled = false;
                transformButton.innerHTML = '🔄 Преобразовать координаты';
            }
            showLoadingIndicator(false);
        }
    }
    
    // Отобразить результаты преобразования
    function displayTransformationResults(data, sourceSystem, targetSystem) {
        const resultsContent = document.getElementById('resultsContent');
        if (!resultsContent) return;
        
        let resultsHTML = `
            <div style="margin-bottom: 20px;">
                <p><strong>Исходная система:</strong> ${sourceSystem}</p>
                <p><strong>Целевая система:</strong> ${targetSystem}</p>
                <p><strong>Преобразовано точек:</strong> ${data.filter(p => p.status === 'success').length} из ${data.length}</p>
            </div>
        `;
        
        // Таблица результатов
        resultsHTML += `
            <div class="preview-table-container">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 8px; border: 1px solid #ddd;">ID</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Название</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">X (${sourceSystem})</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Y (${sourceSystem})</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">X (${targetSystem})</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Y (${targetSystem})</th>
                            <th style="padding: 8px; border: 1px solid #ddd;">Статус</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        data.forEach((point, index) => {
            const bgColor = point.status === 'error' ? '#ffe6e6' : (index % 2 === 0 ? '#f0f8ff' : '#f9f9f9');
            const statusBadge = point.status === 'success' ? 
                '<span style="color: green; font-weight: bold;">✓</span>' : 
                '<span style="color: red; font-weight: bold;">✗</span>';
            
            resultsHTML += `
                <tr style="background-color: ${bgColor};">
                    <td style="padding: 8px; border: 1px solid #ddd;">${point.id}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(point.name)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${formatCoordinate(point.x_original)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${formatCoordinate(point.y_original)}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${point.status === 'success' ? formatCoordinate(point.x_transformed, 6) : '-'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${point.status === 'success' ? formatCoordinate(point.y_transformed, 6) : '-'}</td>
                    <td style="padding: 8px; border: 1px solid #ddd;">${statusBadge}</td>
                </tr>
            `;
        });
        
        resultsHTML += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Кнопка для экспорта
        resultsHTML += `
            <div style="margin-top: 20px; display: flex; gap: 10px;">
                <button id="exportResultsBtn" class="action-button" style="background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer;">
                    💾 Сохранить в CSV
                </button>
            </div>
        `;
        
        resultsContent.innerHTML = resultsHTML;
        
        // Показываем контейнер с результатами
        resultsTableContainer.style.display = 'block';
        
        // Прокручиваем к результатам
        resultsTableContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Добавляем обработчик для кнопки экспорта
        const exportBtn = document.getElementById('exportResultsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function() {
                saveResultsToCSV(data, sourceSystem, targetSystem);
            });
        }
    }
    
    // Форматировать координату для отображения
    function formatCoordinate(value, decimals = 4) {
        if (value === null || value === undefined || value === '' || isNaN(parseFloat(value))) return '-';
        const num = parseFloat(value);
        return num.toFixed(decimals);
    }
    
    // Сохранить результаты в CSV
    function saveResultsToCSV(data, sourceSystem, targetSystem) {
        if (!data || data.length === 0) {
            alert('Нет данных для сохранения');
            return;
        }
        
        try {
            // Создаем заголовки CSV
            let csvContent = "ID;Название;Исходная система;Исходный X;Исходный Y;Целевая система;Преобразованный X;Преобразованный Y;Статус\n";
            
            // Добавляем данные
            data.forEach(point => {
                const row = [
                    point.id,
                    point.name,
                    sourceSystem,
                    point.x_original,
                    point.y_original,
                    targetSystem,
                    point.status === 'success' ? point.x_transformed : '',
                    point.status === 'success' ? point.y_transformed : '',
                    point.status
                ].map(value => `"${value}"`).join(';');
                
                csvContent += row + "\n";
            });
            
            // Создаем Blob и скачиваем файл
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `преобразованные_координаты_${sourceSystem}_to_${targetSystem}_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            alert('Результаты успешно экспортированы в CSV файл!');
            
        } catch (error) {
            console.error('Ошибка при экспорте:', error);
            alert('Ошибка при экспорте результатов');
        }
    }
    
    // Добавляем необходимые стили
    const style = document.createElement('style');
    style.textContent = `
        .swap-animation {
            animation: swapEffect 0.5s ease;
        }
        
        @keyframes swapEffect {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .loading-indicator {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .loading-content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            text-align: center;
        }
        
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .notification {
            display: none;
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: #2196F3;
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        }
        
        .notification.error {
            background: #f44336;
        }
        
        .notification.success {
            background: #4CAF50;
        }
        
        .notification.warning {
            background: #ff9800;
        }
        
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
    `;
    document.head.appendChild(style);
});