var loadedData = [];
var currentData = [];

document.addEventListener("DOMContentLoaded", function() {
    readFile('https://frenteobrero.es/wp-content/uploads/2023/07/data.json', (data) => {
        loadedData = data;
        showData(data, true);
        setBreadcrumb(data, "España");
    });

    let headerCells = document.querySelectorAll('.table-header .table-cell')
    headerCells.forEach(headerCell => {
        headerCell.addEventListener('click', (e) => {
            const key = e.currentTarget.dataset.key;

            e.currentTarget.isAscending = !e.currentTarget.isAscending;

            if(e.currentTarget.isAscending){
                e.currentTarget.classList.add('ascending');
            }else{
                e.currentTarget.classList.remove('ascending');
            }

            let orderedData = orderBy(key, !e.currentTarget.isAscending);
            
            showData(orderedData, true);
        });
    });

    let headerLogo = document.querySelector('.header-logo');
    headerLogo.addEventListener('click', () => {
        showData(loadedData, true);
    });

    let searcher = document.querySelector('.searcher-input');
    searcher.addEventListener('input', (e) => {
        let filteredData = [...currentData].filter(r => r.name.toLowerCase().includes(e.currentTarget.value.toLowerCase()));
        showData(filteredData, false)
    });
});

function setBreadcrumb(data, regionName){
    let parent = document.querySelector('.breadcrumb');
    let elements = parent.querySelectorAll('.breadcrumb-option');
    elements.forEach(e => e.classList.remove('current-option'));
    regionName = regionName || `> ${data.name}`;
    let element = createHtmlElement(` <span class="breadcrumb-option current-option" data-step="${elements.length}">${regionName} </span>`);
    element.data = data;
    
    parent.appendChild(element)

    element.addEventListener('click', (e) => {
        updateBreadcrumb(e.currentTarget)
    });
}

function updateBreadcrumb(element){
    let parent = document.querySelector('.breadcrumb');
    let options = parent.querySelectorAll('.breadcrumb-option');
    options.forEach(op => {
        if(op.dataset.step > element.dataset.step){ 
            op.remove();
        }
    });

    element.classList.add('current-option')
    showData(getOutputData(element.data, true));
}

function showData(data, updateCurrentData){

    if(updateCurrentData){
        currentData = data;
    }

    let parent = document.querySelector('.table-body');
    parent.innerHTML = '';

    data.forEach(region => {
        const element = createTableRow(region);
        element.data = region;
        parent.appendChild(element);

        if(Object.values(region).some(valor => Array.isArray(valor))){
            element.addEventListener('click', (e) => {
            parent = document.querySelector('.table-body');

            let outputData = getOutputData(e.currentTarget.data);

            setBreadcrumb(region);

            showData(outputData, true);
        });
        }
    });
}

function getOutputData(data){
    let outputData = data;

    if(data.hasOwnProperty('provinces')){
        outputData = data.provinces
    }else if(data.hasOwnProperty('towns')){
        outputData = data.towns;
    }
    
    return outputData;
}

function createTableRow(data) {
    return createHtmlElement(`
        <div class="table-row">
            <div class="table-cell" data-column="name">${data.name}</div>
            <div class="table-cell" data-column="votes">${data.votos}</div>
            <div class="table-cell" data-column="totalVotes">${data.votosTotales}</div>
            <div class="table-cell" data-column="votePercentage">${data.porcentajeDeVoto}</div>
        </div>`);
}

function createHtmlElement(template) {
    let elementTemplate = document.createElement('template');
    elementTemplate.innerHTML = template;

    return elementTemplate.content.childNodes[1];
}

function readFile(file, callback) {
    fetch(file)
    .then(response => response.json())
    .then(data => {
        callback(data);
    });
}

function orderBy(property, isAscending){
    let orderedData = [];
    if(property === "name" || property === 'porcentaje'){
        orderedData = [...currentData].sort((a, b) => isAscending ? a[property].toString().localeCompare(b[property].toString()) : b[property].toString().localeCompare(a[property].toString()));
    }else{
        orderedData = [...currentData].sort((a, b) => isAscending ? b[property] - a[property] : a[property] - b[property]);
    }

    return orderedData;
}