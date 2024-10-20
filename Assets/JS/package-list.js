// Initialize variables and constants
let packages = []; // This will store the packages fetched from the API
let filteredPackages = [];
const packagesPerPage = 10;
let currentPage = 1;

// Tag classes and icons for various tags
const tagInfo = {
    'documentation': { class: 'tag-info', icon: 'fas fa-book', description: 'Related to documentation generation and management.' },
    'security': { class: 'tag-danger', icon: 'fas fa-shield-alt', description: 'Security-related tools and utilities.' },
    'utilities': { class: 'tag-success', icon: 'fas fa-toolbox', description: 'Utilities and helper tools.' },
    'git': { class: 'tag-dark', icon: 'fab fa-git-alt', description: 'Git integration and tools.' },
    'ai': { class: 'tag-warning', icon: 'fas fa-robot', description: 'Artificial Intelligence related packages.' },
    'api': { class: 'tag-primary', icon: 'fas fa-code', description: 'APIs and integrations.' },
    'jwt': { class: 'tag-gradient', icon: 'fas fa-key', description: 'JSON Web Token utilities.' },
    'openai': { class: 'tag-primary', icon: 'fas fa-brain', description: 'Packages related to OpenAI integration.' },
    // Additional tag definitions...
};

// Function to fetch packages from the server
function fetchPackages() {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch('/v1/packages?info=1', {
                headers: {
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            packages = data.map(pkg => ({
                name: pkg.name,
                group: pkg.group,
                description: pkg.desc,
                versions: pkg.version,
                author: pkg.group,  // Assuming group as author for simplicity
                date: parseDate(pkg.date),
                license: pkg.license,
                tags: pkg.tags ? pkg.tags.split(',') : [],
                os: pkg.supports ? pkg.supports.split(',').map(s => s.trim().toLowerCase()) : [],
                projURL: pkg.projURL
            }));
            filteredPackages = packages; // Initial filtering includes all packages
            resolve();
        } catch (error) {
            console.error('There has been a problem with your fetch operation:', error);
            reject(error);
        }
    });
}

// Utility functions to get tag attributes
function getTagClass(tagName) {
    const tag = tagName.toLowerCase();
    return tagInfo[tag]?.class || 'tag-default';
}

function getTagIcon(tagName) {
    const tag = tagName.toLowerCase();
    return tagInfo[tag]?.icon || '';
}

function getTagDescription(tagName) {
    const tag = tagName.toLowerCase();
    return tagInfo[tag]?.description || '';
}

// Function to display packages on the current page
function displayPackages(page) {
    const packageList = document.getElementById('package-list');
    packageList.innerHTML = '';
    page--;
    const start = page * packagesPerPage;
    const end = start + packagesPerPage;
    const paginatedPackages = filteredPackages.slice(start, end);
    if (paginatedPackages.length === 0) {
        packageList.innerHTML = '<p class="text-center">No packages found.</p>';
    } else {
        paginatedPackages.forEach(pkg => {
            const packageCol = document.createElement('div');
            packageCol.className = 'col-md-6';
            const packageCard = document.createElement('div');
            packageCard.className = 'card package-card';
            const tagElements = pkg.tags.map(tag => {
                const tagClass = getTagClass(tag);
                const tagIcon = getTagIcon(tag);
                const tagDescription = getTagDescription(tag);
                return `
                    <span class="tag ${tagClass}" data-bs-toggle="tooltip" title="${tagDescription}">
                        ${tagIcon ? `<i class="${tagIcon}"></i>` : ''}${tag}
                    </span>
                `;
            }).join(' ');
            packageCard.innerHTML = `
                <div class="card-body">
                    <h5 class="package-title">${pkg.group}-${pkg.name}</h5>
                    <p class="package-description">${pkg.description}</p>
                    <div class="mb-2">
                        ${tagElements}
                    </div>
                    <p class="package-meta">
                        <strong>Versions:</strong> ${pkg.versions} &nbsp; | &nbsp;
                        <strong>Author:</strong> ${pkg.author} &nbsp; | &nbsp;
                        <strong>Date:</strong> ${pkg.date.toLocaleDateString()}
                    </p>
                    <a href="${pkg.projURL}" target="_blank" class="btn btn-primary">View Package</a>
                </div>
            `;
            packageCol.appendChild(packageCard);
            packageList.appendChild(packageCol);
        });
    }
    displayPagination();

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function(tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Function to display pagination
function displayPagination() {
    const pagination = document.querySelector('.pagination');
    pagination.innerHTML = '';
    const pageCount = Math.ceil(filteredPackages.length / packagesPerPage);
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pageCount, startPage + maxVisiblePages - 1);
    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    if (currentPage > 1) {
        const prevLi = document.createElement('li');
        prevLi.className = 'page-item';
        prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
        prevLi.addEventListener('click', function(e) {
            e.preventDefault();
            currentPage--;
            displayPackages(currentPage);
        });
        pagination.appendChild(prevLi);
    }
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = 'page-item' + (i === currentPage ? ' active' : '');
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', function(e) {
            e.preventDefault();
            currentPage = i;
            displayPackages(currentPage);
        });
        pagination.appendChild(li);
    }
    if (currentPage < pageCount) {
        const nextLi = document.createElement('li');
        nextLi.className = 'page-item';
        nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
        nextLi.addEventListener('click', function(e) {
            e.preventDefault();
            currentPage++;
            displayPackages(currentPage);
        });
        pagination.appendChild(nextLi);
    }
}

// Event listeners for search and filtering
const searchForm = document.getElementById('search-form');
const applyFiltersButton = document.getElementById('apply-filters-button');
const resetButton = document.getElementById('reset-button');

searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    applyFilters();
});

applyFiltersButton.addEventListener('click', function(e) {
    e.preventDefault();
    applyFilters();
    // Close modal
    const advancedSearchModal = bootstrap.Modal.getInstance(document.getElementById('advancedSearchModal'));
    if (advancedSearchModal) {
        advancedSearchModal.hide();
    }
});

resetButton.addEventListener('click', function(e) {
    e.preventDefault();
    resetFilters();
});

function getInputValue(id) {
    const element = document.getElementById(id);
    return element ? element.value.trim().toLowerCase() : '';
}

function setInputValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value;
    }
}

function setSelectValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value;
    }
}

// Function to filter packages based on search criteria
function applyFilters() {
    const query = getInputValue('search-input');
    const authorQuery = getInputValue('author-input');
    const groupQuery = getInputValue('group-input');
    const keywordsQuery = getInputValue('keywords-input');
    const licenseQuery = getInputValue('license-input');
    const osQuery = getInputValue('os-input');
    const sortBy = getInputValue('sort-input');

    // Build the query parameters
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (authorQuery) params.append('author', authorQuery);
    if (groupQuery) params.append('group', groupQuery);
    if (keywordsQuery) params.append('keywords', keywordsQuery);
    if (licenseQuery) params.append('license', licenseQuery);
    if (osQuery) params.append('os', osQuery);
    if (sortBy) params.append('sort', sortBy);

    // Update the URL without reloading the page
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);

    // If all query fields are empty, reset to show all packages
    if (!query && !authorQuery && !groupQuery && !keywordsQuery && !licenseQuery && !osQuery) {
        filteredPackages = [...packages];
    } else {
        filteredPackages = packages.filter(pkg => {
            const matchesQuery = !query || 
                ((pkg.name && pkg.name.toLowerCase().includes(query)) || 
                (pkg.description && pkg.description.toLowerCase().includes(query)));
            const matchesAuthor = !authorQuery || 
                (pkg.author && pkg.author.toLowerCase().includes(authorQuery));
            const matchesGroup = !groupQuery || 
                (pkg.group && pkg.group.toLowerCase().includes(groupQuery));
            const matchesKeywords = !keywordsQuery || 
                (pkg.tags && pkg.tags.some(tag => tag.toLowerCase().includes(keywordsQuery)));
            const matchesLicense = !licenseQuery || 
                (pkg.license && pkg.license.toLowerCase() === licenseQuery);
            const matchesOS = !osQuery || 
                (pkg.os && pkg.os.includes(osQuery));

            return matchesQuery && matchesAuthor && matchesGroup && matchesKeywords && matchesLicense && matchesOS;
        });
    }

    // Sorting
    if (sortBy) {
        filteredPackages.sort((a, b) => {
            if (sortBy === 'date') {
                return b.date - a.date;
            } else {
                const aValue = a[sortBy] ? a[sortBy].toString().toLowerCase() : '';
                const bValue = b[sortBy] ? b[sortBy].toString().toLowerCase() : '';
                return aValue.localeCompare(bValue);
            }
        });
    }

    // Reset to first page and display
    currentPage = 1;
    displayPackages(currentPage);
}

function resetFilters() {
    // Clear all input fields
    setInputValue('search-input', '');
    setInputValue('author-input', '');
    setInputValue('group-input', '');
    setInputValue('keywords-input', '');
    setSelectValue('license-input', '');
    setSelectValue('os-input', '');
    setSelectValue('sort-input', '');

    // Clear query parameters from URL
    window.history.replaceState({}, '', window.location.pathname);

    // Reset filteredPackages to all packages
    filteredPackages = [...packages];

    // Reset to first page and display
    currentPage = 1;
    displayPackages(currentPage);
}

function parseDate(num) {
    // Ensure num is a number
    num = Number(num);
    // Extract the integer (date) and fractional (time) parts
    const datePart = Math.trunc(num).toString();
    const decimalPart = num - Math.trunc(num);

    // Multiply decimal part by 1e6 and round to get time part
    let timeNum = Math.round(decimalPart * 1e6);
    // Handle possible rounding issues
    if (timeNum >= 1000000) {
        timeNum = 999999;
    }
    const timePart = timeNum.toString().padStart(6, '0');

    // Parse date components
    const year = parseInt(datePart.slice(0, 4));
    const month = parseInt(datePart.slice(4, 6)) - 1; // Months are 0-based in JS Date
    const day = parseInt(datePart.slice(6, 8));

    // Parse time components
    const hours = parseInt(timePart.slice(0, 2));
    const minutes = parseInt(timePart.slice(2, 4));
    const seconds = parseInt(timePart.slice(4, 6));

    // Return a new Date object
    return new Date(year, month, day, hours, minutes, seconds);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    fetchPackages().then(() => {
        // Retrieve search parameters from URL
        const params = new URLSearchParams(window.location.search);

        // Populate form fields with parameters
        setInputValue('search-input', params.get('query') || '');
        setInputValue('author-input', params.get('author') || '');
        setInputValue('group-input', params.get('group') || '');
        setInputValue('keywords-input', params.get('keywords') || '');
        setSelectValue('license-input', params.get('license') || '');
        setSelectValue('os-input', params.get('os') || '');
        setSelectValue('sort-input', params.get('sort') || '');

        // Apply filters if any parameters are present
        if (Array.from(params.keys()).length > 0) {
            applyFilters();
        } else {
            // Display all packages
            displayPackages(currentPage);
        }
    });
});