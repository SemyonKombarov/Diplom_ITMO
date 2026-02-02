// coordinateConverter.js

// Подключение proj4 через CDN (должен быть добавлен в HTML)
// В реальном проекте используйте: npm install proj4

/**
 * Основной класс для преобразования координат между системами
 */
class CoordinateConverter {
    constructor() {
        // Инициализация популярных систем координат (проекции)
        this.coordinateSystems = {
            // WGS 84 (широта/долгота)
            'WGS 84': '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs',
            'EPSG:4326': '+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs',
            
            // Пулково 1942
            'Пулково 1942': '+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=0 +y_0=0 +ellps=krass +towgs84=25,-141,-78.5,0,0.35,0.736,0 +units=m +no_defs',
            'СК-42': '+proj=tmerc +lat_0=0 +lon_0=30 +k=1 +x_0=0 +y_0=0 +ellps=krass +towgs84=25,-141,-78.5,0,0.35,0.736,0 +units=m +no_defs',
            'EPSG:4284': '+proj=longlat +ellps=krass +towgs84=25,-141,-78.5,0,0.35,0.736,0 +no_defs',
            
            // МСК (пример для Москвы)
            'МСК': '+proj=tmerc +lat_0=55.6666666666667 +lon_0=37.5 +k=1 +x_0=0 +y_0=0 +ellps=krass +towgs84=25,-141,-78.5,0,0.35,0.736,0 +units=m +no_defs',
            'МСК-52': '+proj=tmerc +lat_0=55.6666666666667 +lon_0=37.5 +k=1 +x_0=0 +y_0=0 +ellps=krass +towgs84=25,-141,-78.5,0,0.35,0.736,0 +units=m +no_defs',
            
            // UTM зоны (пример для 36N)
            'UTM 36N': '+proj=utm +zone=36 +ellps=WGS84 +datum=WGS84 +units=m +no_defs',
            'EPSG:32636': '+proj=utm +zone=36 +ellps=WGS84 +datum=WGS84 +units=m +no_defs',
            
            // Web Mercator
            'Web Mercator': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs',
            'EPSG:3857': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs'
        };
        
        // Кэш для преобразователей
        this.transformers = {};
    }

    /**
     * Получить определение системы координат по имени
     */
    getSystemDefinition(systemName) {
        // Попробовать найти точное совпадение
        if (this.coordinateSystems[systemName]) {
            return this.coordinateSystems[systemName];
        }
        
        // Попробовать найти по части имени (регистронезависимо)
        const lowerName = systemName.toLowerCase();
        for (const [key, value] of Object.entries(this.coordinateSystems)) {
            if (key.toLowerCase().includes(lowerName)) {
                return value;
            }
        }
        
        // Если не найдено, вернуть null
        return null;
    }

    /**
     * Создать или получить из кэша преобразователь координат
     */
    getTransformer(sourceSystem, targetSystem) {
        const cacheKey = `${sourceSystem}->${targetSystem}`;
        
        if (!this.transformers[cacheKey]) {
            const sourceDef = this.getSystemDefinition(sourceSystem);
            const targetDef = this.getSystemDefinition(targetSystem);
            
            if (!sourceDef || !targetDef) {
                throw new Error(`Неизвестная система координат: ${!sourceDef ? sourceSystem : targetSystem}`);
            }
            
            // Создаем функцию преобразования с помощью proj4
            this.transformers[cacheKey] = proj4(sourceDef, targetDef);
        }
        
        return this.transformers[cacheKey];
    }

    /**
     * Преобразовать одну точку координат
     */
    transformPoint(x, y, sourceSystem, targetSystem) {
        try {
            const transformer = this.getTransformer(sourceSystem, targetSystem);
            const result = transformer.forward([parseFloat(x), parseFloat(y)]);
            
            return {
                x: result[0],
                y: result[1],
                success: true,
                error: null
            };
        } catch (error) {
            console.error('Ошибка преобразования координат:', error);
            return {
                x: null,
                y: null,
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Преобразовать pandas DataFrame
     */
    transformDataFrame(df, sourceSystem, targetSystem) {
        if (!df || !sourceSystem || !targetSystem) {
            throw new Error('Необходимо указать датафрейм и системы координат');
        }
        
        // Проверяем наличие необходимых столбцов
        const columns = df.columns;
        if (!columns.includes('x') || !columns.includes('y')) {
            throw new Error('Датафрейм должен содержать столбцы "x" и "y"');
        }
        
        // Создаем копию датафрейма
        const resultDf = df.copy();
        
        // Массивы для новых координат
        const newX = [];
        const newY = [];
        const errors = [];
        const statuses = [];
        
        // Преобразуем каждую точку
        for (let i = 0; i < df.shape[0]; i++) {
            const row = df.iloc(i);
            const x = row.get('x');
            const y = row.get('y');
            
            // Пропускаем пустые значения
            if (x === null || y === null || x === undefined || y === undefined || 
                x === '' || y === '' || isNaN(parseFloat(x)) || isNaN(parseFloat(y))) {
                newX.push(null);
                newY.push(null);
                errors.push('Пустые или некорректные координаты');
                statuses.push('error');
                continue;
            }
            
            const transformed = this.transformPoint(x, y, sourceSystem, targetSystem);
            
            if (transformed.success) {
                newX.push(transformed.x);
                newY.push(transformed.y);
                errors.push(null);
                statuses.push('success');
            } else {
                newX.push(null);
                newY.push(null);
                errors.push(transformed.error);
                statuses.push('error');
            }
        }
        
        // Добавляем новые столбцы
        resultDf['x_transformed'] = newX;
        resultDf['y_transformed'] = newY;
        resultDf['transformation_error'] = errors;
        resultDf['transformation_status'] = statuses;
        
        return resultDf;
    }

    /**
     * Пакетное преобразование массива точек
     */
    transformBatch(points, sourceSystem, targetSystem) {
        return points.map((point, index) => {
            const transformed = this.transformPoint(
                point.x, 
                point.y, 
                sourceSystem, 
                targetSystem
            );
            
            return {
                id: point.id || index + 1,
                name: point.name || `Точка ${index + 1}`,
                x_original: point.x,
                y_original: point.y,
                x_transformed: transformed.x,
                y_transformed: transformed.y,
                status: transformed.success ? 'success' : 'error',
                error: transformed.error,
                source_system: sourceSystem,
                target_system: targetSystem
            };
        });
    }

    /**
     * Получить статистику преобразования
     */
    getTransformationStats(transformedPoints) {
        const total = transformedPoints.length;
        const success = transformedPoints.filter(p => p.status === 'success').length;
        const errors = transformedPoints.filter(p => p.status === 'error').length;
        
        return {
            total,
            success,
            errors,
            successRate: total > 0 ? (success / total * 100).toFixed(2) : 0
        };
    }

    /**
     * Добавить новую систему координат
     */
    addCoordinateSystem(name, definition) {
        this.coordinateSystems[name] = definition;
        // Очищаем кэш преобразователей, так как добавили новую систему
        this.transformers = {};
    }

    /**
     * Получить список всех доступных систем координат
     */
    getAvailableSystems() {
        return Object.keys(this.coordinateSystems);
    }

    /**
     * Проверить, поддерживается ли система координат
     */
    isSystemSupported(systemName) {
        return this.getSystemDefinition(systemName) !== null;
    }

    /**
     * Получить информацию о системе координат
     */
    getSystemInfo(systemName) {
        const definition = this.getSystemDefinition(systemName);
        
        if (!definition) {
            return null;
        }
        
        // Простой парсинг определения для получения информации
        const info = {
            name: systemName,
            definition: definition,
            type: this.getSystemType(definition),
            units: this.getSystemUnits(definition)
        };
        
        return info;
    }

    /**
     * Определить тип системы координат по определению
     */
    getSystemType(definition) {
        if (definition.includes('+proj=longlat')) {
            return 'Географические координаты (широта/долгота)';
        } else if (definition.includes('+proj=tmerc')) {
            return 'Поперечная проекция Меркатора';
        } else if (definition.includes('+proj=utm')) {
            return 'UTM проекция';
        } else if (definition.includes('+proj=merc')) {
            return 'Проекция Меркатора';
        } else {
            return 'Проекция';
        }
    }

    /**
     * Определить единицы измерения системы координат
     */
    getSystemUnits(definition) {
        if (definition.includes('+units=m')) {
            return 'Метры';
        } else if (definition.includes('+proj=longlat')) {
            return 'Градусы';
        } else if (definition.includes('+units=ft')) {
            return 'Футы';
        } else {
            return 'Неизвестно';
        }
    }
}

// Экспорт класса для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CoordinateConverter;
}

// Глобальный экспорт для использования в браузере
if (typeof window !== 'undefined') {
    window.CoordinateConverter = CoordinateConverter;
}