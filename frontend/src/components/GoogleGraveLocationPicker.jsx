import React, { useState } from 'react';
import { APIProvider, Map, Marker, Polygon } from '@vis.gl/react-google-maps';

export default function GoogleGraveLocationPicker({
  apiKey,
  center,
  patioGeometry,
  selectedLocation,
  locationConfirmed,
  mapKey,
  onPick,
}) {
  const [loadError, setLoadError] = useState(false);
  const patioPaths = patioGeometry?.type === 'Polygon' && Array.isArray(patioGeometry.coordinates)
    ? patioGeometry.coordinates
      .filter(Array.isArray)
      .map(ring => ring
        .filter(point => Array.isArray(point)
          && Number.isFinite(Number(point[0]))
          && Number.isFinite(Number(point[1])))
        .map(point => ({ lat: Number(point[1]), lng: Number(point[0]) })))
      .filter(path => path.length >= 4)
    : [];

  const handlePick = (event) => {
    const point = event.detail?.latLng || event.latLng;
    if (!point) return;

    const lat = typeof point.lat === 'function' ? point.lat() : point.lat;
    const lng = typeof point.lng === 'function' ? point.lng() : point.lng;
    if (Number.isFinite(lat) && Number.isFinite(lng)) onPick(lat, lng);
  };

  return (
    <APIProvider
      apiKey={apiKey}
      language="es"
      region="CL"
      onError={(error) => {
        console.error('No se pudo cargar Google Maps:', error);
        setLoadError(true);
      }}
    >
      {loadError ? (
        <div role="alert" style={{ display: 'grid', placeItems: 'center', height: '100%', padding: '1rem', textAlign: 'center', color: '#991b1b', fontSize: '0.85rem' }}>
          Google Maps no pudo cargarse. Revisa que la clave de demostración esté habilitada para esta API.
        </div>
      ) : (
        <Map
          key={mapKey}
          defaultCenter={center}
          defaultZoom={20}
          mapTypeId="satellite"
          maxZoom={21}
          gestureHandling="greedy"
          onClick={handlePick}
          style={{ width: '100%', height: '100%' }}
        >
          {patioPaths.length > 0 && (
            <Polygon
              paths={patioPaths}
              onClick={handlePick}
              options={{
                clickable: true,
                fillColor: '#2d6a4f',
                fillOpacity: 0.18,
                strokeColor: '#1b4332',
                strokeOpacity: 0.9,
                strokeWeight: 2,
              }}
            />
          )}
          {locationConfirmed && selectedLocation && <Marker position={selectedLocation} />}
        </Map>
      )}
    </APIProvider>
  );
}
