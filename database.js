// Глобальные переменные для базы данных
let db = null;
let isDatabaseLoaded = false;
let databaseSystems = [];

// Инициализация загрузки базы данных
document.addEventListener('DOMContentLoaded', () => {
    const loadDbButton = document.getElementById('loadDbButton');
    const dbFileInput = document.getElementById('dbFileInput');
    const dbStatus = document.getElementById('dbStatus');

    // При клике на кнопку открываем диалог выбора файла
    loadDbButton.addEventListener('click', () => {
        dbFileInput.click();
    });

    // Обработчик выбора файла
    dbFileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.db')) {
            showStatus('Пожалуйста, выберите файл базы данных SQLite (.db)', 'error');
            return;
        }

        showStatus('Загрузка базы данных...', 'info');
        loadDbButton.disabled = true;

        try {
            await loadDatabase(file);
        } catch (error) {
            console.error('Ошибка загрузки базы данных:', error);
            showStatus('Ошибка загрузки базы данных: ' + error.message, 'error');
            loadDbButton.disabled = false;
        }
    });
});

// Функция для отображения статуса
function showStatus(message, type = 'info') {
    const dbStatus = document.getElementById('dbStatus');
    dbStatus.textContent = message;
    dbStatus.className = 'db-status ' + type;
}

// Функция загрузки базы данных
async function loadDatabase(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                // Инициализация SQL.js с WASM
                const SQL = await initSqlJs({
                    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
                });

                // Загрузка базы данных
                const data = new Uint8Array(e.target.result);
                db = new SQL.Database(data);
                
                // Чтение данных из таблицы tbl_srs
                await readCoordinateSystemsFromDB();
                
                showStatus(`База данных загружена. Найдено ${databaseSystems.length} систем координат`, 'success');
                loadDbButton.disabled = false;
                loadDbButton.textContent = '📁 База данных загружена';
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = (error) => {
            reject(new Error('Ошибка чтения файла'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

// Функция чтения систем координат из базы данных
async function readCoordinateSystemsFromDB() {
    if (!db) return;

    try {
        // Получаем все системы координат из таблицы tbl_srs
        const query = `
            SELECT srs_id, description, projection_acronym, ellipsoid_acronym, 
                   parameters, auth_name, auth_id, is_geo, deprecated, wkt
            FROM tbl_srs
            ORDER BY description
        `;
        
        const results = db.exec(query);
        
        if (results && results.length > 0) {
            const rows = results[0].values;
            const columns = results[0].columns;
            
            databaseSystems = rows.map(row => {
                const system = {};
                columns.forEach((col, index) => {
                    system[col] = row[index];
                });
                
                // Создаем форматированное название
                let name = system.description || '';
                if (system.auth_name && system.auth_id) {
                    name += ` (${system.auth_name}:${system.auth_id})`;
                }
                
                return {
                    id: `db_${system.srs_id}`,
                    name: name,
                    code: system.auth_name ? `${system.auth_name}:${system.auth_id}` : `DB:${system.srs_id}`,
                    description: `Из базы данных QGIS - ${system.projection_acronym || 'Неизвестная проекция'}`,
                    type: system.is_geo === 1 ? 'географическая' : 'проекционная',
                    area: 'Из базы данных',
                    datum: 'Из базы данных',
                    parameters: system.parameters,
                    wkt: system.wkt,
                    source: 'database'
                };
            });
            
            console.log('Загружено систем координат из базы данных:', databaseSystems.length);
            
            // Обновляем автодополнение с новыми данными
            if (window.sourceAutocomplete && window.targetAutocomplete) {
                // Добавляем системы из базы данных в общий массив
                window.allSystems = [...window.coordinateSystems || [], ...databaseSystems];
                
                // Обновляем фильтрацию в автодополнении
                window.sourceAutocomplete.allSystems = window.allSystems;
                window.targetAutocomplete.allSystems = window.allSystems;
            }
        }
    } catch (error) {
        console.error('Ошибка чтения из базы данных:', error);
        throw error;
    }
}

// Экспортируем данные для использования в autocomplete.js
window.databaseSystems = databaseSystems;
window.isDatabaseLoaded = isDatabaseLoaded;