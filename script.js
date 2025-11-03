
const API_BASE = 'https://rickandmortyapi.com/api';

const resultsDiv = document.getElementById('results');
const messageDiv = document.getElementById('message');
const getAllBtn = document.getElementById('getAllBtn');
const filterBtn = document.getElementById('filterBtn');
const paginationDiv = document.getElementById('pagination');

const state = {
    characters: [],
    currentPage: 1,
    pageSize: 20
};
let hideAnimationTimeout = null;



function showMessage(text, type) {
    if (hideAnimationTimeout) {
        clearTimeout(hideAnimationTimeout);
        hideAnimationTimeout = null;
    }

    messageDiv.classList.remove('hide', 'success', 'error');
    messageDiv.style.display = 'block';
    messageDiv.innerHTML = '';

    const textSpan = document.createElement('span');
    textSpan.className = 'message-text';
    textSpan.textContent = text;

    const closeButton = document.createElement('button');
    closeButton.className = 'message-close';
    closeButton.setAttribute('aria-label', 'Cerrar notificación');
    closeButton.innerHTML = '&times;';

    messageDiv.appendChild(textSpan);
    messageDiv.appendChild(closeButton);
    messageDiv.classList.add(type);
}

function hideMessage() {
    if (messageDiv.style.display === 'none') {
        return;
    }

    messageDiv.classList.add('hide');

    hideAnimationTimeout = setTimeout(() => {
        messageDiv.style.display = 'none';
        messageDiv.classList.remove('hide', 'success', 'error');
        messageDiv.innerHTML = '';
        hideAnimationTimeout = null;
    }, 400);
}




function showLoading() {
    resultsDiv.innerHTML = '<div class="loading">Abriendo portal dimensional</div>';
}

function translateStatus(status) {
    const translations = {
        'Alive': 'Vivo',
        'Dead': 'Muerto',
        'unknown': 'Desconocido'
    };
    return translations[status] || status;
}

function translateGender(gender) {
    const translations = {
        'Male': 'Masculino',
        'Female': 'Femenino',
        'Genderless': 'Sin género',
        'unknown': 'Desconocido'
    };
    return translations[gender] || gender;
}
function setCharacters(characters) {
    state.characters = Array.isArray(characters) ? characters : [];
    state.currentPage = 1;
    renderCurrentPage();
}

function renderCurrentPage() {
    const totalCharacters = state.characters.length;
    const totalPages = Math.ceil(totalCharacters / state.pageSize) || 0;

    if (totalCharacters === 0) {
        renderCharacterCards([]);
        clearPagination();
        return;
    }

    if (state.currentPage > totalPages) {
        state.currentPage = totalPages;
    }

    const startIndex = (state.currentPage - 1) * state.pageSize;
    const paginatedCharacters = state.characters.slice(startIndex, startIndex + state.pageSize);

    renderCharacterCards(paginatedCharacters);
    renderPagination(totalPages);
}

function renderPagination(totalPages) {
    if (!paginationDiv) {
        return;
    }

    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        paginationDiv.style.display = 'none';
        return;
    }

    const buttons = Array.from({ length: totalPages }, (_, index) => {
        const pageNumber = index + 1;
        const isActive = pageNumber === state.currentPage ? 'active' : '';
        return `<button class="page-btn ${isActive}" data-page="${pageNumber}">${pageNumber}</button>`;
    }).join('');

    paginationDiv.innerHTML = `
        <button class="page-btn nav ${state.currentPage === 1 ? 'disabled' : ''}" data-page="${state.currentPage - 1}" ${state.currentPage === 1 ? 'disabled' : ''}>Anterior</button>
        <div class="page-numbers">${buttons}</div>
        <button class="page-btn nav ${state.currentPage === totalPages ? 'disabled' : ''}" data-page="${state.currentPage + 1}" ${state.currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
    `;
    paginationDiv.style.display = 'flex';
}

function clearPagination() {
    if (!paginationDiv) {
        return;
    }

    paginationDiv.innerHTML = '';
    paginationDiv.style.display = 'none';
}

function handlePaginationClick(event) {
    const target = event.target;

    if (!target || !target.classList || !target.classList.contains('page-btn') || target.disabled) {
        return;
    }

    const totalPages = Math.ceil(state.characters.length / state.pageSize);
    const page = Number(target.getAttribute('data-page'));

    if (!Number.isFinite(page) || page < 1 || page > totalPages || page === state.currentPage) {
        return;
    }

    state.currentPage = page;
    renderCurrentPage();
}

async function fetchAllCharacterPages(url, notFoundMessage = 'No se encontraron personajes con los criterios proporcionados') {
    const allCharacters = [];
    let nextUrl = url;
    let pageNumber = 1;

    while (nextUrl) {
        const response = await fetch(nextUrl);

        if (!response.ok) {
            if (response.status === 404 && pageNumber === 1) {
                throw new Error(notFoundMessage);
            }
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        allCharacters.push(...data.results);
        nextUrl = data.info.next;
        pageNumber += 1;
    }

    return allCharacters;
}

function renderCharacterCards(characters) {
    if (!characters || characters.length === 0) {
        resultsDiv.innerHTML = `
            <div style="text-align: center; color: #88f7ff; padding: 60px; font-size: 1.2em; font-weight: 700;">
                <p style="font-size: 3em; margin-bottom: 20px;">🛸</p>
                <p>No se encontraron personajes en esta dimensión.</p>
            </div>
        `;
        return;
    }

    const html = `
        <div class="characters-flex">
            ${characters.map(char => `
                <div class="character-card">
                    <img src="${char.image}" alt="${char.name}">
                    <div class="character-info">
                        <div class="character-name">${char.name}</div>
                        <div class="character-detail">
                            <strong>Especie:</strong> ${char.species}
                        </div>
                        <div class="character-detail">
                            <strong>Género:</strong> ${translateGender(char.gender)}
                        </div>
                        ${char.type ? `
                            <div class="character-detail">
                                <strong>Tipo:</strong> ${char.type}
                            </div>
                        ` : ''}
                        <div class="character-detail">
                            <strong>Origen:</strong> ${char.origin.name}
                        </div>
                        <div class="character-detail">
                            <strong>Ubicación:</strong> ${char.location.name}
                        </div>
                        <span class="status ${char.status.toLowerCase()}">
                            ${translateStatus(char.status)}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    resultsDiv.innerHTML = html;
}

async function getAllCharacters() {
    try {
        showLoading();
        clearPagination();

        const characters = await fetchAllCharacterPages(`${API_BASE}/character`, 'No se pudieron recuperar personajes');
        setCharacters(characters);
        showMessage(`Portal abierto: ${characters.length} personajes encontrados. Mostrando ${state.pageSize} por pagina.`, 'success');
    } catch (error) {
        showMessage(`Error al abrir el portal: ${error.message}`, 'error');
        resultsDiv.innerHTML = '';
        clearPagination();
        state.characters = [];
        state.currentPage = 1;
        console.error('Error:', error);
    }
}



async function getFilteredCharacters() {
    try {
        const name = document.getElementById('nameFilter').value.trim();
        const status = document.getElementById('statusFilter').value;
        const species = document.getElementById('speciesFilter').value.trim();
        const type = document.getElementById('typeFilter').value.trim();
        const gender = document.getElementById('genderFilter').value;

        const params = new URLSearchParams();
        if (name) params.append('name', name);
        if (status) params.append('status', status);
        if (species) params.append('species', species);
        if (type) params.append('type', type);
        if (gender) params.append('gender', gender);

        const queryString = params.toString();
        if (!queryString) {
            showMessage('Por favor, ingresa al menos un filtro para buscar', 'error');
            return;
        }

        showLoading();
        clearPagination();

        const baseUrl = `${API_BASE}/character/?${queryString}`;
        const characters = await fetchAllCharacterPages(baseUrl, 'No se encontraron personajes con esos filtros en el multiverso');
        setCharacters(characters);
        showMessage(`Busqueda exitosa: ${characters.length} personajes encontrados. Mostrando ${state.pageSize} por pagina.`, 'success');
    } catch (error) {
        const errorMessage = error.message.includes('No se encontraron')
            ? error.message
            : `Error en la busqueda: ${error.message}`;
        showMessage(errorMessage, 'error');
        resultsDiv.innerHTML = '';
        clearPagination();
        state.characters = [];
        state.currentPage = 1;
        console.error('Error:', error);
    }
}



if (paginationDiv) {
    paginationDiv.addEventListener('click', handlePaginationClick);
}

messageDiv.addEventListener('click', (event) => {
    if (event.target && event.target.classList && event.target.classList.contains('message-close')) {
        hideMessage();
    }
});
getAllBtn.addEventListener('click', getAllCharacters);
filterBtn.addEventListener('click', getFilteredCharacters);

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            getFilteredCharacters();
        }
    });
});

// Mensaje de bienvenida en consola
console.log('%c¡Wubba Lubba Dub Dub!', 'color: #00ff9d; font-size: 20px; font-weight: bold;');
console.log('%cBuscador de Rick and Morty cargado correctamente 🛸', 'color: #88f7ff; font-size: 14px;');
