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
    constructor(inputElement, dropdownElement) {
        this.input = inputElement;
        this.dropdown = dropdownElement;
        this.selectedIndex = -1;
        this.filteredSystems = [];
        this.isMouseOverDropdown = false;
        
        this.init();
    }
    
    init() {
        // Обработчики событий
        this.input.addEventListener('input', (e) => this.handleInput(e));
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.input.addEventListener('blur', () => this.handleBlur());
        this.input.addEventListener('focus', () => this.handleFocus());
        
        // Отслеживаем наведение мыши на dropdown
        this.dropdown.addEventListener('mouseenter', () => {
            this.isMouseOverDropdown = true;
        });
        
        this.dropdown.addEventListener('mouseleave', () => {
            this.isMouseOverDropdown = false;
        });
    }
    
    handleInput(e) {
        const query = e.target.value.toLowerCase().trim();
        
        if (query === '') {
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
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectNext();
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectPrev();
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredSystems.length) {
                    this.selectSystem(this.filteredSystems[this.selectedIndex]);
                }
                break;
                
            case 'Tab':
                if (this.selectedIndex >= 0 && this.selectedIndex < this.filteredSystems.length) {
                    e.preventDefault();
                    this.selectSystem(this.filteredSystems[this.selectedIndex]);
                } else {
                    this.hideDropdown();
                }
                break;
                
            case 'Escape':
                this.hideDropdown();
                break;
        }
    }
    
    handleBlur() {
        // Используем setTimeout чтобы дать время обработать клик на dropdown
        setTimeout(() => {
            if (!this.isMouseOverDropdown) {
                this.hideDropdown();
            }
        }, 150);
    }
    
    handleFocus() {
        if (this.input.value.trim() === '') {
            this.showAllSystems();
        } else {
            // Показываем dropdown если есть текст в поле
            this.handleInput({ target: this.input });
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
            this.dropdown.style.display = 'block';
            return;
        }
        
        this.filteredSystems.forEach((system, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            if (index === this.selectedIndex) {
                item.classList.add('active');
            }
            
            item.innerHTML = `
                <div class="system-name">${system.name}</div>
                <div class="system-code">${system.code}</div>
                <div class="system-description">${system.description}</div>
            `;
            
            // Используем mousedown вместо click, чтобы обработать раньше blur
            item.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Предотвращаем blur на input
                this.selectSystem(system);
            });
            
            item.addEventListener('mouseenter', () => {
                this.selectedIndex = index;
                this.updateDropdown();
            });
            
            this.dropdown.appendChild(item);
        });
        
        this.dropdown.style.display = 'block';
    }
    
    selectNext() {
        if (this.filteredSystems.length === 0) return;
        
        this.selectedIndex = (this.selectedIndex + 1) % this.filteredSystems.length;
        this.updateDropdown();
        
        // Скролл к выбранному элементу
        const selectedItem = this.dropdown.querySelector('.autocomplete-item.active');
        if (selectedItem) {
            selectedItem.scrollIntoView({ block: 'nearest' });
        }
    }
    
    selectPrev() {
        if (this.filteredSystems.length === 0) return;
        
        this.selectedIndex = this.selectedIndex <= 0 ? 
            this.filteredSystems.length - 1 : 
            this.selectedIndex - 1;
        this.updateDropdown();
        
        // Скролл к выбранному элементу
        const selectedItem = this.dropdown.querySelector('.autocomplete-item.active');
        if (selectedItem) {
            selectedItem.scrollIntoView({ block: 'nearest' });
        }
    }
    
    selectSystem(system) {
        this.input.value = system.name;
        this.hideDropdown();
        // Возвращаем фокус на input
        setTimeout(() => this.input.focus(), 10);
    }
    
    hideDropdown() {
        this.dropdown.style.display = 'none';
        this.selectedIndex = -1;
        this.isMouseOverDropdown = false;
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Создаем экземпляры автодополнения для каждого поля
    const sourceAutocomplete = new Autocomplete(
        document.getElementById('sourceSystemInput'),
        document.getElementById('sourceDropdown')
    );
    
    const targetAutocomplete = new Autocomplete(
        document.getElementById('targetSystemInput'),
        document.getElementById('targetDropdown')
    );
    
    // Обработчик для кнопки замены
    const swapButton = document.getElementById('swapCoordinatesButton');
    swapButton.addEventListener('click', () => {
        // Меняем значения полей ввода
        const sourceValue = document.getElementById('sourceSystemInput').value;
        const targetValue = document.getElementById('targetSystemInput').value;
        
        document.getElementById('sourceSystemInput').value = targetValue;
        document.getElementById('targetSystemInput').value = sourceValue;
        
        // Анимация кнопки
        swapButton.classList.add('swap-animation');
        setTimeout(() => {
            swapButton.classList.remove('swap-animation');
        }, 500);
    });
    
    // Добавляем стиль для анимации кнопки
    const style = document.createElement('style');
    style.textContent = `
        .swap-animation {
            animation: rotateSwap 0.5s ease;
        }
        
        @keyframes rotateSwap {
            0% { transform: rotate(0deg) scale(1); }
            50% { transform: rotate(180deg) scale(1.1); }
            100% { transform: rotate(360deg) scale(1); }
        }
        
        @media (max-width: 1024px) {
            .swap-animation {
                animation: rotateSwapMobile 0.5s ease;
            }
            
            @keyframes rotateSwapMobile {
                0% { transform: rotate(90deg) scale(1); }
                50% { transform: rotate(270deg) scale(1.1); }
                100% { transform: rotate(450deg) scale(1); }
            }
        }
    `;
    document.head.appendChild(style);
    
    // Закрытие выпадающих списков при клике вне их
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-with-dropdown')) {
            sourceAutocomplete.hideDropdown();
            targetAutocomplete.hideDropdown();
        }
    });
});