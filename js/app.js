const geoserverUrl = "http://localhost:8080/geoserver";
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

const sourceMarker = L.marker([32.7784, -96.78946], { draggable: true })
  .on("dragend", (e) => {
    selectedPoint = e.target.getLatLng();
    console.log(selectedPoint);
    getVertex(selectedPoint);
  })
  .addTo(map);

const targetMarker = L.marker([32.779, -96.79], { draggable: true })
  .on("dragend", (e) => {
    selectedPoint = e.target.getLatLng();
    console.log(selectedPoint);
    getVertex(selectedPoint);
  })
  .addTo(map);

const getVertex = (selectedPoint) => {
  const { lat, lng } = selectedPoint;
  const wmsUrl = `${geoserverUrl}/routed/wms?service=WMS&version=1.1.0&request=GetMap&layers=routed%3Anearest_vertex&bbox=${
    lng - 0.01
  },%2C${
    lat - 0.01
  }&width=768&height=768&srs=EPSG%3A4326&styles=&format=application/openlayers`;

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
  var features = response.features;
  map.removeLayer(pathLayer);
  if (isSource) {
    source = features[0].properties.id;
  } else {
    target = features[0].properties.id;
  }
};

// function to get the shortest path from the give source and target nodes
function getRoute() {
  const url = `${geoserverUrl}/routed/wms?service=WMS&version=1.1.0&request=GetMap&layers=routed%3Ashortest_path&bbox=${source}%2C${target}&width=768&height=661&srs=EPSG%3A4326&styles=&format=application/openlayers`;

  $.getJSON(url, (data) => {
    map.removeLayer(pathLayer);
    pathLayer = L.geoJSON(data);
    map.addLayer(pathLayer);
  });
}

getVertex(sourceMarker.getLatLng());
getVertex(targetMarker.getLatLng());
getRoute();

// // define a blank geoJSON Layer
// var buildings = L.geoJSON(null);

// //get the geojson data with ajax, and add it to the blank layer we created
// $.getJSON('../data/bui.geojson',function(data){
// 	buildings.addData(data);
// 	map.fitBounds(buildings.getBounds());
// });

// // finally add the layer to the map
// buildings.addTo(map);

// http://localhost:8080/geoserver/routed/wms?
// service=WMS&version=1.1.0&request=GetMap&layers=routed%3Anearest_vertex&
// bbox=-97.7912601%2C31.7778316%2C-95.7912601%2C33.7778316&width=768&height=768&srs=EPSG%3A4326&
// styles=&format=application/openlayers
