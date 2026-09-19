const fs = require('fs');
const path = require('path');

function loadJson(filename) {
  const filePath = path.join(__dirname, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

module.exports = {
  getRoads: () => loadJson('roads.geojson'),
  getIncidents: () => loadJson('incidents.json'),
  getVehicles: () => loadJson('vehicles.json'),
  getDeliveries: () => loadJson('deliveries.json'),
  getWeather: () => loadJson('weather.json'),
  getRiskBaseline: () => loadJson('risk_baseline.json'),
  getScenarios: () => loadJson('scenarios.json')
};
