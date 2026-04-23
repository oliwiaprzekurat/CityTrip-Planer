import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Naprawa ikonek Leaflet (standardowy błąd w React)
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: markerIcon, shadowUrl: markerShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Komponent do centrowania mapy po zmianie miasta
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

const MapComponent = ({ cityCoords, attractions }) => {
  const position = [cityCoords.lat, cityCoords.lon];

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "15px", overflow: "hidden", marginTop: "20px" }}>
      <MapContainer center={position} zoom={13} style={{ height: "100%", width: "100%" }}>
        <ChangeView center={position} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Znacznik miasta */}
        <Marker position={position}>
          <Popup>Centrum miasta</Popup>
        </Marker>

        {/* Znaczniki atrakcji */}
        {attractions.map((place, idx) => (
          <Marker key={idx} position={[place.lat, place.lon]}>
            <Popup>{place.title}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapComponent;