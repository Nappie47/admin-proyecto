import React, { useEffect, useState } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  Polygon,
  useMap,
} from '@vis.gl/react-google-maps';

const toGooglePosition = ([lat, lng]) => ({ lat: Number(lat), lng: Number(lng) });

function CameraTarget({ position }) {
  const map = useMap();

  useEffect(() => {
    if (map && position) {
      map.panTo(toGooglePosition(position));
      map.setZoom(19);
    }
  }, [map, position]);

  return null;
}

function markerIcon(color, symbol) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="${color}" stroke="white" stroke-width="3"/><text x="16" y="20" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="white">${symbol}</text></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: { width: 32, height: 32 },
    anchor: { x: 16, y: 16 },
  };
}

function graveMarkerColor(grave, selectedGrave) {
  if (selectedGrave?.id === grave.id) return ['#2563eb', '★'];
  if (grave.estado === 'Disponible') return ['#0284c7', '•'];
  if (grave.estado === 'En Mantenimiento') return ['#d97706', '!'];
  return ['#2d6a4f', '✝'];
}

export default function GoogleCemeteryMap({
  apiKey,
  mapTypeId,
  center,
  zoom,
  mapTarget,
  editingPatio,
  onMapClick,
  patios,
  sepulturas,
  mausoleos,
  showPatios,
  showSepulturas,
  showMausoleos,
  selectedGrave,
  editorOpen,
  drawingPoints,
  drawingColor,
  onSelectGrave,
  onStartEditPatio,
  onMapLoadError,
  isLoadingRecords,
  dataLoadError,
}) {
  const [loadError, setLoadError] = useState(false);

  if (loadError) {
    return (
      <div
        role="alert"
        style={{
          display: 'grid',
          placeItems: 'center',
          height: '100%',
          padding: '1rem',
          textAlign: 'center',
          color: '#991b1b',
          background: '#fff7ed',
        }}
      >
        Google Maps no pudo cargarse. Comprueba que la clave de demostración esté habilitada para Maps JavaScript API.
      </div>
    );
  }

  const patiosWithGeometry = patios.filter(
    patio => patio.geometry?.type === 'Polygon' && patio.geometry.coordinates?.[0]?.length
  );

  return (
    <APIProvider
      apiKey={apiKey}
      language="es"
      region="CL"
      onError={(error) => {
        console.error('No se pudo cargar Google Maps:', error);
        setLoadError(true);
        onMapLoadError?.();
      }}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <Map
          defaultCenter={toGooglePosition(mapTarget || center)}
          defaultZoom={mapTarget ? 19 : zoom}
          mapTypeId={mapTypeId}
          maxZoom={20}
          gestureHandling="greedy"
          draggableCursor={editingPatio ? 'crosshair' : undefined}
          scaleControl
          streetViewControl={false}
          mapTypeControl={false}
          onClick={(event) => {
            const position = event.detail?.latLng;
            if (editingPatio && position) {
              onMapClick([position.lat, position.lng]);
            }
          }}
          style={{ width: '100%', height: '100%' }}
        >
        {mapTarget && <CameraTarget position={mapTarget} />}

        {showPatios && patiosWithGeometry.map(patio => {
          const path = patio.geometry.coordinates[0].map(
            ([lng, lat]) => ({ lat: Number(lat), lng: Number(lng) })
          );
          const labelPoint = path.reduce(
            (sum, point) => ({ lat: sum.lat + point.lat / path.length, lng: sum.lng + point.lng / path.length }),
            { lat: 0, lng: 0 }
          );

          return (
            <React.Fragment key={`google-patio-${patio.id}`}>
              <Polygon
                paths={path}
                options={{
                  strokeColor: patio.color_hex || '#2d6a4f',
                  strokeOpacity: 0.9,
                  strokeWeight: 2,
                  fillColor: patio.color_hex || '#2d6a4f',
                  fillOpacity: 0.22,
                  clickable: editorOpen && !editingPatio,
                }}
                onClick={() => {
                  if (editorOpen && !editingPatio) onStartEditPatio(patio);
                }}
              />
              <Marker
                position={labelPoint}
                clickable={!editingPatio}
                title={`Patio ${patio.numero}: ${patio.nombre}`}
                icon={{
                  path: 'M 0,0',
                  fillOpacity: 0,
                  strokeOpacity: 0,
                  scale: 0,
                }}
                label={{
                  text: `Patio ${patio.numero}`,
                  color: '#173b2b',
                  fontSize: '13px',
                  fontWeight: '700',
                }}
              />
            </React.Fragment>
          );
        })}

        {editingPatio && drawingPoints.length >= 3 && (
          <Polygon
            paths={drawingPoints.map(toGooglePosition)}
            options={{
              strokeColor: drawingColor || '#ef4444',
              strokeOpacity: 1,
              strokeWeight: 3,
              fillColor: drawingColor || '#ef4444',
              fillOpacity: 0.35,
              clickable: false,
            }}
          />
        )}

        {editingPatio && drawingPoints.map((point, index) => (
          <Marker
            key={`google-vertex-${index}`}
            position={toGooglePosition(point)}
            title={`Vértice #${index + 1}: ${point[0].toFixed(5)}, ${point[1].toFixed(5)}`}
            icon={markerIcon('#ef4444', String(index + 1))}
          />
        ))}

        {showSepulturas && sepulturas.map(grave => {
          const [color, symbol] = graveMarkerColor(grave, selectedGrave);
          return (
            <Marker
              key={`google-grave-${grave.id}`}
              position={{ lat: Number(grave.latitud), lng: Number(grave.longitud) }}
              clickable={!editingPatio}
              title={`Sepultura #${grave.numero}${grave.nombre_completo ? ` · ${grave.nombre_completo}` : ''}`}
              icon={markerIcon(color, symbol)}
              onClick={() => {
                if (!editingPatio) onSelectGrave(grave);
              }}
            />
          );
        })}

        {showMausoleos && mausoleos.map(mausoleum => (
          <Marker
            key={`google-mausoleum-${mausoleum.id}`}
            position={{ lat: Number(mausoleum.latitud), lng: Number(mausoleum.longitud) }}
            clickable={!editingPatio}
            title={mausoleum.nombre}
            icon={markerIcon('#b45309', 'M')}
            onClick={() => {
              if (!editingPatio) {
                onSelectGrave({
                  id: `m-${mausoleum.id}`,
                  numero: `M-${mausoleum.id}`,
                  patio_numero: mausoleum.patio_numero || 1,
                  sector: 'Histórico',
                  tipo: 'Mausoleo Histórico',
                  estado: 'Ocupada',
                  nombre_completo: mausoleum.nombre,
                  fecha_fallecimiento: `Construido en ${mausoleum.ano_construccion}`,
                  ubicacion_detalle: mausoleum.estilo_arquitectonico,
                  observaciones: mausoleum.resena_historica,
                  latitud: mausoleum.latitud,
                  longitud: mausoleum.longitud,
                  isMausoleo: true,
                  foto_url: mausoleum.foto_url,
                });
              }
            }}
          />
        ))}
        </Map>
        {!isLoadingRecords && dataLoadError && (
          <div
            role="alert"
            style={{
              position: 'absolute',
              top: '1.25rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1,
              padding: '0.85rem 1.1rem',
              backgroundColor: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: '12px',
              color: '#9a3412',
              boxShadow: '0 8px 24px rgba(15, 45, 30, 0.12)',
            }}
          >
            {dataLoadError}
          </div>
        )}
      </div>
    </APIProvider>
  );
}
