// import zag from "../data/zag.json";

const geoserverUrl = "http://localhost:8080/geoserver";
let selectedPoint = null,
  source = null,
  target = null;

// empty geojson layer for the shortest path result
let pathLayer = L.geoJSON(null);

// initialize our map
var map = L.map("map", {
  center: [30.5904, 31.50673], // center map to jkuat
  zoom: 13, // set the zoom level
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

// display zag points

fetch("../data/zag.json")
  .then((response) => response.json())
  .then((data) => {
    // Now you can use the 'data' object containing your JSON
    initItems(data);
  })
  .catch((error) => {
    console.error("Error fetching JSON:", error);
  });

const initItems = (zag) => {
  const customIconHospital = L.icon({
    iconUrl: "./public/hospital-location-pin.png",

    iconSize: [38, 40], // size of the icon
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
  });

  const customIconPolice = L.icon({
    iconUrl: "./public/police.png",

    iconSize: [38, 35], // size of the icon
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
  });

  const customIconAmbulance = L.icon({
    iconUrl: "./public/ambulance.png",

    iconSize: [38, 35], // size of the icon
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
  });

  const customIconFire = L.icon({
    iconUrl: "./public/fire-station.png",

    iconSize: [40, 35], // size of the icon
    iconAnchor: [22, 94], // point of the icon which will correspond to marker's location
    popupAnchor: [-3, -76], // point from which the popup should open relative to the iconAnchor
  });

  let icon;

  zag.features.map((item) => {
    if (item.properties.type === "hospital") {
      icon = customIconHospital;
    } else if (item.properties.type === "police") {
      icon = customIconPolice;
    } else if (item.properties.type === "Ambulance") {
      icon = customIconAmbulance;
    } else {
      icon = customIconFire;
    }

    return L.marker(
      [item.geometry.coordinates[1], item.geometry.coordinates[0]],
      {
        icon,
      }
    )
      .bindPopup(
        createPopupContent(
          [
            `Type: ${item.properties.type}`,
            `Name: ${item.properties.name}`,
            `Address: ${item.properties.address}`,
          ],
          item.properties.photo.replace("\\", "/")
        )
      )
      .addTo(map);
  });
};

const sourceMarker = L.marker([30.5904, 31.50673], { draggable: true })
  .on("dragend", (e) => {
    selectedPoint = e.target.getLatLng();
    getVertex(selectedPoint);
    getRoute();
  })
  .addTo(map);

const targetMarker = L.marker([30.5904, 31.50673], { draggable: true })
  .on("dragend", (e) => {
    selectedPoint = e.target.getLatLng();
    getVertex(selectedPoint);
    getRoute();
  })
  .addTo(map);

// Function to create popup content
function createPopupContent(properties, pathPhoto) {
  let popupContent = "<table>";

  for (let key in properties) {
    if (properties.hasOwnProperty(key)) {
      popupContent += `<tr><td>${properties[key]}</td></tr>`;
    }
  }

  if (pathPhoto) {
    popupContent += `
      <tr>
        <td style="text-align: center;">
          <img src="./public${pathPhoto}" alt="photo" weidth="250px" style="max-width: 250px; max-height: 100px;">
        </td>
      </tr>`;
  }

  popupContent += "</table>";
  return popupContent;
}

// function to get the shortest path from the give source and target nodes
function getRoute() {
  let url = `${geoserverUrl}/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=emergencyManagment:shortest_path&outputformat=application/json&viewparams=source:${source};target:${target};`;

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
  const wmsUrl = `${geoserverUrl}/emergencyManagment/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=emergencyManagment:nearest_vertex&outputformat=application/json&viewparams=x:${lng};y:${lat};`;

  $.ajax({
    url: wmsUrl,
    async: false,
    success: (data) => {
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
    map.removeLayer(pathLayer);
    if (isSource) {
      source = features[0].properties.id;
      sourceMarker.bindPopup(
        createPopupContent([
          `latitude: ${features[0].geometry.coordinates[0]}`,
          `longitude: ${features[0].geometry.coordinates[1]}`,
        ])
      ); // Bind popup with attribute data
    } else {
      target = features[0].properties.id;
      targetMarker.bindPopup(
        createPopupContent([
          `latitude: ${features[0].geometry.coordinates[0]}`,
          `longitude: ${features[0].geometry.coordinates[1]}`,
        ])
      ); // Bind popup with attribute data
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
