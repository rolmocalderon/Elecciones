var loadedData = [];
var currentData = [];
var barrios = [];
var barriosResult = [];

document.addEventListener("DOMContentLoaded", function() {
    readFile('https://raw.githubusercontent.com/rolmocalderon/Elecciones/main/data.json', (data) => {
        loadedData = data;
        showData(data, true);
        setBreadcrumb(data, "España");
    });

    readFile('./pais.json', async (data) => {
        let config = await getConfig();
        barrios = data.features.filter(f => f.properties.NMUN == "Barcelona").map(b => b.properties);
        config.districts.forEach(d => {
            // let ddata = barrios.filter(b => b.CDIS === d.district).map(d => d.parties).flat(1).filter(p => p.c === "FO");
            // console.log(d.name, ddata.map(p => p.v).reduce((a, b) => a + b, 0), ddata.map(p => p.p).reduce((a, b) => a + b, 0).toFixed(2))
            d.neighbourhoods && d.neighbourhoods.forEach(n => {
                let districtData = barrios.filter(b => b.CDIS === d.district);
                let sectionData = districtData.filter(dis => n.sections.includes(dis.CSEC));
                let sectionPartyData = sectionData.map(d => d.parties).flat(1).filter(p => p.c === "FO");
                let sectionVotes = sectionPartyData.map(p => p.v).reduce((a, b) => a + b, 0);
                let sectionVotePercent = sectionPartyData.map(p => p.p).reduce((a, b) => a + b, 0).toFixed(4);
                barriosResult.push({
                    "distrito": d.name,
                    "barrio": n.name,
                    "votos": sectionVotes,
                    "porcentaje": sectionVotePercent
                });
            })
        });

        console.log(barriosResult)
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

function getConfig(){
    return new Promise((resolve, reject) => {
        fetch("./config.json")
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.json();
          })
          .then(data => resolve(data))
          .catch(error => reject(error));
      });
}

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
    showData(getOutputData(element.data), true);
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

function createTableRow(data) {
    let typeClass = "town";

    if(data.hasOwnProperty('provinces')){
        typeClass = "region";
    }else if(data.hasOwnProperty('towns')){
        typeClass = "province";
    }

    return createHtmlElement(`
        <div class="table-row ${typeClass}">
            <div class="table-cell" data-column="name">${data.name}</div>
            <div class="table-cell" data-column="votes">${data.votos}</div>
            <div class="table-cell" data-column="totalVotes">${data.votosTotales}</div>
            <div class="table-cell" data-column="votePercentage">${data.porcentajeDeVoto}</div>
        </div>`);
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
