/*const geoserverUrl = "http://localhost:8080/geoserver";
let selectedPoint = null,
  source = null,
  target = null;

// empty geojson layer for the shortes path result
let pathLayer = L.geoJSON(null);

// initialize our map
var map = L.map("map", {
  center: [32.7784, -96.78946], //center map to jkuat
  zoom: 17, //set the zoom level
});

//add openstreet baselayer to the map
var OpenStreetMap = L.tileLayer(
  "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
).addTo(map);

const sourceMarker = L.marker([32.7778316, -96.7912601], { draggable: true })
  .on("dragend", (e) => {
    selectedPoint = e.target.getLatLng();
    getVertex(selectedPoint);
    getRoute();
  })
  .addTo(map);

const targetMarker = L.marker([32.779, -96.79], { draggable: true })
  .on("dragend", (e) => {
    selectedPoint = e.target.getLatLng();
    getVertex(selectedPoint);
    getRoute();
  })
  .addTo(map);

const getVertex = (selectedPoint) => {
  const { lat, lng } = selectedPoint;
  const wmsUrl = `${geoserverUrl}/routed/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routed:nearest_vertex&outputformat=application/json&viewparams=x:${lng};y:${lat};`;

  $.ajax({
    url: wmsUrl,
    async: false,
    success: (data) => {
      console.log(data);
      loadVertex(
        data,
        selectedPoint.toString() === sourceMarker.getLatLng().toString()
      );
    },
  });
};

// function to update the source and target nodes as returned from geoserver for later querying
const loadVertex = (response, isSource) => {
  if (response.features) {
    let features = response.features;
    console.log("Features:", features);
    map.removeLayer(pathLayer);
    if (isSource) {
      source = features[0].properties.id;
    } else {
      target = features[0].properties.id;
    }
  } else {
    console.error("Response does not contain features array.");
  }
};

// function to get the shortest path from the give source and target nodes
function getRoute() {
  let url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routed:shortest_path&outputformat=application/json&viewparams=source:${source};target:${target};`;

  $.getJSON(url, function (data) {
    map.removeLayer(pathLayer);
    pathLayer = L.geoJSON(data);
    map.addLayer(pathLayer);
  });
}

getVertex(sourceMarker.getLatLng());
getVertex(targetMarker.getLatLng());
getRoute();*/

const geoserverUrl = "http://localhost:8080/geoserver";
let selectedPoint = null,
  source = null,
  target = null;

// empty geojson layer for the shortest path result
let pathLayer = L.geoJSON(null);

// initialize our map
var map = L.map("map", {
  center: [32.7784, -96.78946], // center map to jkuat
  zoom: 17, // set the zoom level
});

// add openstreet baselayer to the map
var OpenStreetMap = L.tileLayer(
  "http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }
).addTo(map);

const sourceMarker = L.marker([32.7778316, -96.7912601], { draggable: true })
  .on("dragend", (e) => {
    selectedPoint = e.target.getLatLng();
    getVertex(selectedPoint);
    getRoute();
  })
  .addTo(map);

const targetMarker = L.marker([32.779, -96.79], { draggable: true })
  .on("dragend", (e) => {
    selectedPoint = e.target.getLatLng();
    getVertex(selectedPoint);
    getRoute();
  })
  .addTo(map);

// Function to create popup content
function createPopupContent(properties) {
  let popupContent = "<table>";
  for (let key in properties) {
    if (properties.hasOwnProperty(key)) {
      popupContent += `<tr><td>${key}</td><td>${properties[key]}</td></tr>`;
    }
  }
  popupContent += "</table>";
  return popupContent;
}

// function to get the shortest path from the give source and target nodes
function getRoute() {
  let url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routed:shortest_path&outputformat=application/json&viewparams=source:${source};target:${target};`;

  $.getJSON(url, function (data) {
    map.removeLayer(pathLayer);
    pathLayer = L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        layer.bindPopup(createPopupContent(feature.properties)); // Bind popup with attribute data
      },
    });
    map.addLayer(pathLayer);
  });
}

const getVertex = (selectedPoint) => {
  const { lat, lng } = selectedPoint;
  const wmsUrl = `${geoserverUrl}/routed/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=routed:nearest_vertex&outputformat=application/json&viewparams=x:${lng};y:${lat};`;

  $.ajax({
    url: wmsUrl,
    async: false,
    success: (data) => {
      console.log(data);
      loadVertex(
        data,
        selectedPoint.toString() === sourceMarker.getLatLng().toString()
      );
    },
  });
};

// function to update the source and target nodes as returned from geoserver for later querying
const loadVertex = (response, isSource) => {
  if (response.features) {
    let features = response.features;
    console.log("Features:", features);
    map.removeLayer(pathLayer);
    if (isSource) {
      source = features[0].properties.id;
      sourceMarker.bindPopup(createPopupContent(features[0].properties)); // Bind popup with attribute data
    } else {
      target = features[0].properties.id;
      targetMarker.bindPopup(createPopupContent(features[0].properties)); // Bind popup with attribute data
    }
  } else {
    console.error("Response does not contain features array.");
  }
};

// Function to handle click events on pathLayer
pathLayer.on("click", function (event) {
  event.layer.openPopup();
});

getVertex(sourceMarker.getLatLng());
getVertex(targetMarker.getLatLng());
getRoute();
