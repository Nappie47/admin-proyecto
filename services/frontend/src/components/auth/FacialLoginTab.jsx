import React, { useRef, useEffect } from 'react';
import { CameraOff, Scan, RefreshCw, Upload } from 'lucide-react';

export const FacialLoginTab = ({
  cameraActive,
  cameraStream,
  availableCameras,
  selectedCameraId,
  onSelectCamera,
  startCamera,
  stopCamera,
  cameraError,
  capturedImage,
  setCapturedImage,
  loading,
  onFacialScan,
  onFileUpload,
  videoRef,
  fileInputRef
}) => {
  return (
    <div>
      {/* Selector de cámara si hay más de un dispositivo (ej. DroidCam + Webcam) */}
      {availableCameras.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.65rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Cámara:</label>
          <select
            value={selectedCameraId}
            onChange={(e) => onSelectCamera(e.target.value)}
            style={{
              flex: 1,
              fontSize: '0.75rem',
              padding: '0.35rem 0.5rem',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              backgroundColor: 'white'
            }}
          >
            {availableCameras.map((cam, idx) => (
              <option key={cam.deviceId || idx} value={cam.deviceId}>
                {cam.label || `Cámara ${idx + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ 
        position: 'relative', 
        width: '100%', 
        height: '240px', 
        backgroundColor: '#0f172a', 
        borderRadius: '12px', 
        overflow: 'hidden',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {capturedImage ? (
          <img 
            src={capturedImage} 
            alt="Captura facial" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : cameraActive ? (
          <>
            <video 
              ref={(el) => {
                videoRef.current = el;
                if (el && cameraStream && el.srcObject !== cameraStream) {
                  el.srcObject = cameraStream;
                  el.play().catch((e) => console.warn('play error:', e));
                }
              }} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            {/* Visor / Target overlay para centrar rostro */}
            <div style={{
              position: 'absolute',
              width: '140px',
              height: '170px',
              border: '2px dashed #4ade80',
              borderRadius: '50%',
              boxShadow: '0 0 15px rgba(74, 222, 128, 0.4)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              bottom: '8px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: '#e2e8f0',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '0.72rem',
              pointerEvents: 'none'
            }}>
              Centra tu rostro en el óvalo
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
            <CameraOff size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.6 }} />
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Cámara inactiva</p>
            {cameraError && (
              <p style={{ fontSize: '0.75rem', color: '#f87171', marginTop: '0.3rem' }}>
                {cameraError}
              </p>
            )}
            <button
              type="button"
              onClick={() => startCamera()}
              style={{
                marginTop: '0.6rem',
                padding: '0.35rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid #475569',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Activar Cámara
            </button>
          </div>
        )}
      </div>

      {/* Botones de acción facial */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={onFacialScan}
          disabled={loading || (!cameraActive && !capturedImage)}
          className="btn-primary"
          style={{
            flex: 1,
            justifyContent: 'center',
            padding: '0.7rem',
            fontSize: '0.92rem',
            gap: '0.5rem'
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={17} className="animate-spin" />
              Analizando con IA...
            </>
          ) : (
            <>
              <Scan size={17} />
              Escanear e Ingresar
            </>
          )}
        </button>

        {capturedImage && (
          <button
            type="button"
            onClick={() => { setCapturedImage(null); startCamera(); }}
            style={{
              padding: '0.7rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              cursor: 'pointer',
              color: '#475569'
            }}
            title="Tomar otra captura"
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {/* Alternativa: Subir foto o reintentar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileUpload}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: 'none',
            border: 'none',
            color: '#2d6a4f',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem',
            padding: 0
          }}
        >
          <Upload size={14} />
          Subir foto desde archivo
        </button>

        <span>Microservicio IA: OpenCV + Spatial</span>
      </div>
    </div>
  );
};

