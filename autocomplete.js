// Данные систем координат
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
        description: 'Проекция Гаусса-Крюгера',
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

// Класс для управления автодополнением
class Autocomplete {
    constructor(inputElement, dropdownElement, infoElement, placeholder) {
        this.input = inputElement;
        this.dropdown = dropdownElement;
        this.infoElement = infoElement;
        this.placeholder = placeholder;
        this.selectedIndex = -1;
        this.filteredSystems = [];
        this.input.selectedSystem = null;
        
        this.init();
    }
    
    init() {
        // Изначально скрываем блок с информацией
        if (this.infoElement) {
            this.infoElement.style.display = 'none';
            this.infoElement.innerHTML = `<p class="info-placeholder">${this.placeholder}</p>`;
        }
        
        // Обработчики событий
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.input.addEventListener('blur', () => {
            setTimeout(() => this.hideDropdown(), 200);
        });
        this.input.addEventListener('focus', () => this.handleFocus());
        this.input.addEventListener('click', () => this.handleClick());
    }
    
    handleInput(e) {
        const query = e.target.value.toLowerCase().trim();
        
        if (query === '') {
            this.input.selectedSystem = null;
            // Скрываем информацию при очистке поля
            if (this.infoElement) {
                this.infoElement.style.display = 'none';
                this.infoElement.innerHTML = `<p class="info-placeholder">${this.placeholder}</p>`;
            }
            this.showAllSystems();
            return;
        }
        
        // Фильтрация систем по запросу
        this.filteredSystems = coordinateSystems.filter(system => {
            return system.name.toLowerCase().includes(query) ||
                   system.code.toLowerCase().includes(query) ||
                   system.description.toLowerCase().includes(query);
        });
        
        this.updateDropdown();
    }
    
    handleKeyDown(e) {
        if (this.dropdown.style.display !== 'block') return;
        
        const items = this.dropdown.querySelectorAll('.autocomplete-item:not(.no-results)');
        if (items.length === 0) return;
        
        const currentActive = this.dropdown.querySelector('.autocomplete-item.active');
        let currentIndex = currentActive ? Array.from(items).indexOf(currentActive) : -1;
        
        switch (e.key) {
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
                const activeItem = this.dropdown.querySelector('.autocomplete-item.active');
                if (activeItem) {
                    const systemId = activeItem.dataset.systemId;
                    const system = coordinateSystems.find(s => s.id === systemId);
                    if (system) {
                        this.selectSystem(system);
                    }
                }
                break;
                
            case 'Escape':
                this.hideDropdown();
                break;
        }
    }
    
    handleFocus() {
        if (this.input.value.trim() === '') {
            this.showAllSystems();
        } else {
            this.handleInput({ target: this.input });
        }
    }
    
    handleClick() {
        if (this.input.value.trim() === '' || this.dropdown.style.display === 'none') {
            this.showAllSystems();
        }
    }
    
    showAllSystems() {
        this.filteredSystems = [...coordinateSystems];
        this.updateDropdown();
    }
    
    updateDropdown() {
        this.dropdown.innerHTML = '';
        
        if (this.filteredSystems.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'autocomplete-item no-results';
            noResults.textContent = 'Системы не найдены';
            this.dropdown.appendChild(noResults);
        } else {
            this.filteredSystems.forEach((system, index) => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.dataset.systemId = system.id;
                item.tabIndex = 0;
                
                if (index === this.selectedIndex) {
                    item.classList.add('active');
                }
                
                item.innerHTML = `
                    <div class="system-name">${system.name}</div>
                    <div class="system-code">${system.code}</div>
                    <div class="system-description">${system.description}</div>
                `;
                
                // Простой обработчик клика
                item.addEventListener('click', () => {
                    this.selectSystem(system);
                });
                
                // Обработчик наведения мыши
                item.addEventListener('mouseenter', () => {
                    // Убираем активный класс со всех элементов
                    this.dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
                        el.classList.remove('active');
                    });
                    // Добавляем активный класс текущему элементу
                    item.classList.add('active');
                    this.selectedIndex = index;
                });
                
                // Обработчик нажатия клавиши на элементе
                item.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.selectSystem(system);
                    }
                });
                
                this.dropdown.appendChild(item);
            });
        }
        
        this.dropdown.style.display = 'block';
    }
    
    selectSystem(system) {
        // Устанавливаем значение в input
        this.input.value = system.name;
        
        // Сохраняем выбранную систему
        this.input.selectedSystem = system;
        
        // Показываем и обновляем информацию о системе
        this.updateInfo(system);
        
        // Скрываем dropdown
        this.hideDropdown();
        
        // Устанавливаем фокус обратно на input
        this.input.focus();
        
        console.log('Выбрана система:', system.name);
    }
    
    updateInfo(system) {
        if (!this.infoElement) return;
        
        if (!system) {
            this.infoElement.style.display = 'none';
            this.infoElement.innerHTML = `<p class="info-placeholder">${this.placeholder}</p>`;
        } else {
            this.infoElement.innerHTML = `
                <div class="info-name">${system.name}</div>
                <div class="info-tags">
                    <span class="tag">${system.code}</span>
                    <span class="tag">${system.type}</span>
                </div>
                <div class="info-meta">
                    <span><strong>Эллипсоид:</strong> ${system.ellipsoid}</span>
                    <span><strong>Регион:</strong> ${system.area}</span>
                    <span><strong>Датум:</strong> ${system.datum}</span>
                </div>
                <p class="info-desc">${system.description}</p>
            `;
            this.infoElement.style.display = 'block';
            this.infoElement.classList.add('visible');
        }
    }
    
    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.selectedIndex = -1;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Создаем экземпляры автодополнения для каждого поля
    const sourceAutocomplete = new Autocomplete(
        document.getElementById('sourceSystemInput'),
        document.getElementById('sourceDropdown'),
        document.getElementById('sourceSystemInfo'),
        'Выберите исходную систему'
    );
    
    const targetAutocomplete = new Autocomplete(
        document.getElementById('targetSystemInput'),
        document.getElementById('targetDropdown'),
        document.getElementById('targetSystemInfo'),
        'Выберите целевую систему'
    );
    
    // Обработчик для кнопки замены
    const swapButton = document.getElementById('swapCoordinatesButton');
    swapButton.addEventListener('click', () => {
        const sourceInput = document.getElementById('sourceSystemInput');
        const targetInput = document.getElementById('targetSystemInput');
        const sourceInfo = document.getElementById('sourceSystemInfo');
        const targetInfo = document.getElementById('targetSystemInfo');
        
        // Сохраняем текущие значения
        const sourceValue = sourceInput.value;
        const targetValue = targetInput.value;
        const sourceSystem = sourceInput.selectedSystem;
        const targetSystem = targetInput.selectedSystem;
        
        // Меняем значения местами
        sourceInput.value = targetValue;
        targetInput.value = sourceValue;
        
        // Меняем выбранные системы местами
        sourceInput.selectedSystem = targetSystem;
        targetInput.selectedSystem = sourceSystem;
        
        // Обновляем информацию в блоках
        if (targetSystem) {
            sourceAutocomplete.updateInfo(targetSystem);
        } else {
            // Если целевая система была пуста, скрываем блок информации
            sourceInfo.style.display = 'none';
            sourceInfo.innerHTML = '<p class="info-placeholder">Выберите исходную систему</p>';
        }
        
        if (sourceSystem) {
            targetAutocomplete.updateInfo(sourceSystem);
        } else {
            // Если исходная система была пуста, скрываем блок информации
            targetInfo.style.display = 'none';
            targetInfo.innerHTML = '<p class="info-placeholder">Выберите целевую систему</p>';
        }
        
        // Анимация кнопки
        swapButton.classList.add('swap-animation');
        setTimeout(() => {
            swapButton.classList.remove('swap-animation');
        }, 500);
        
        // Фокусируемся на исходном поле после обмена
        sourceInput.focus();
    });
    
    // Закрытие выпадающих списков при клике вне их
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-with-dropdown')) {
            sourceAutocomplete.hideDropdown();
            targetAutocomplete.hideDropdown();
        }
    });
});