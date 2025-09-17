const mapCenter = [-1.4558, -48.4754];

const initialZoom = 15;

const map = L.map('map').setView(mapCenter, initialZoom)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let startPoint = null;
let endPoint = null;
let startMarker = null;
let endMarker = null;
let routeLine = null;

const infoDiv = document.querySelector('.info p');
const resetButton = document.getElementById('resetButton');

function resetMap() {
    if (startMarker) map.removeLayer(startMarker);
    if (endMarker) map.removeLayer(endMarker);
    if (routeLine) map.removeLayer(routeLine);
    startPoint = null;
    endPoint = null;
    infoDiv.textContent = 'Clique no mapa para definir a Origem e depois o Destino.';
}

resetButton.addEventListener('click', resetMap);
map.on('click', function(e) {
    if (!startPoint) {
        startPoint = e.latlng;
        startMarker = L.marker(startPoint).addTo(map).bindPopup('Ponto de Partida').openPopup();
        infoDiv.textContent = 'Agora clique para definir o Destino.';
    } else if (!endPoint) {
        endPoint = e.latlng;
        endMarker = L.marker(endPoint).addTo(map).bindPopup('Ponto de Chegada').openPopup();
        infoDiv.textContent = 'Calculando a rota...';
        
        fetch('/get_route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start: startPoint, end: endPoint })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                //colocando a distância em metros ou km
                const distanciaMetros = data.distance;
                let distanciaTexto = "";

                if (distanciaMetros < 1000) {
                    distanciaTexto = `${Math.round(distanciaMetros)} metros`;
                } else {
                    const distanciaKm = distanciaMetros / 1000;
                    distanciaTexto = `${distanciaKm.toFixed(2)} km`;
                }

                routeLine = L.polyline(data.route, { color: 'red' }).addTo(map);
                map.fitBounds(routeLine.getBounds());
                infoDiv.textContent = 'Rota calculada! ' + distanciaTexto + ' de distância Clique em Limpar para recomeçar.';
            } else {
                infoDiv.textContent = 'Erro: ' + data.message;
            }
        });
    }
});