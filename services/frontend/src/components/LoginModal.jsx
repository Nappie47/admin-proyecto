import React, { useState, useRef, useEffect } from 'react';
import { 
  X, AlertCircle, Shield, KeyRound, Camera, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FacialLoginTab } from './auth/FacialLoginTab';
import { PasswordLoginTab } from './auth/PasswordLoginTab';

export const LoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { login, facialLogin } = useAuth();
  
  // Tab: 'password' | 'facial'
  const [activeTab, setActiveTab] = useState('facial');
  
  // Traditional form state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Facial Recognition state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [facialSuccess, setFacialSuccess] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Stop camera when modal is closed or unmounted
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraStream(null);
    setCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setError(null);
      setFacialSuccess(null);
      setCapturedImage(null);
    } else if (activeTab === 'facial') {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  // Sincronizar stream con el elemento video una vez montado
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((e) => console.warn('Video play error:', e));
    }
  }, [cameraStream, cameraActive]);

  const startCamera = async (overrideDeviceId = null) => {
    setCameraError(null);
    setError(null);
    const targetDevId = overrideDeviceId !== null ? overrideDeviceId : selectedCameraId;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = devices.filter((d) => d.kind === 'videoinput');
          setAvailableCameras(videoDevs);
        } catch (e) {
          console.warn('No se pudieron listar dispositivos:', e);
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        let stream = null;
        try {
          const constraints = {
            video: targetDevId
              ? { deviceId: { exact: targetDevId }, width: { ideal: 640 }, height: { ideal: 480 } }
              : { width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (errConstraint) {
          console.warn('Reintentando cámara con restricciones mínimas:', errConstraint);
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        streamRef.current = stream;
        setCameraStream(stream);
        setCameraActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.warn('play err:', e));
        }
      } else {
        setCameraError('Tu navegador no soporta acceso directo a la cámara web.');
      }
    } catch (err) {
      console.warn('Error accediendo a la cámara:', err);
      setCameraError('No se pudo acceder a la cámara. Revisa permisos o sube una fotografía.');
      setCameraActive(false);
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.92);
  };

  const handleFacialScan = async () => {
    setError(null);
    setFacialSuccess(null);
    setLoading(true);

    let base64Image = capturedImage;
    if (!base64Image && cameraActive) {
      base64Image = captureFrame();
      setCapturedImage(base64Image);
    }

    if (!base64Image) {
      setError('Enfoque su rostro a la cámara o suba una fotografía');
      setLoading(false);
      return;
    }

    const res = await facialLogin(base64Image);
    setLoading(false);

    if (res.success) {
      setFacialSuccess({
        nombre: res.user.nombre_completo,
        rol: res.user.rol,
        confidence: res.confidence
      });
      setTimeout(() => {
        stopCamera();
        if (onSuccess) onSuccess();
        onClose();
      }, 1600);
    } else {
      setError(res.error || 'Rostro no reconocido');
      setCapturedImage(null);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setCapturedImage(base64);
      stopCamera();
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setError(res.error);
    }
  };

  const handleDemoFill = (role) => {
    if (role === 'admin') {
      setIdentifier('admin@losangeles.cl');
      setPassword('Admin123!');
    } else {
      setIdentifier('funcionario@losangeles.cl');
      setPassword('Funcionario123!');
    }
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '480px', padding: '1.75rem', borderRadius: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={22} color="#2d6a4f" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#0f2d1e', margin: 0 }}>
                Acceso al Sistema
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>
                Plataforma SIG Municipal - Cementerio General
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs de Modo de Acceso */}
        <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '10px', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('facial'); setError(null); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'facial' ? '600' : '500',
              backgroundColor: activeTab === 'facial' ? 'white' : 'transparent',
              color: activeTab === 'facial' ? '#2d6a4f' : '#64748b',
              boxShadow: activeTab === 'facial' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Camera size={16} />
            <span>Biometría Facial IA</span>
            <span style={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '6px', fontWeight: '700' }}>IA</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('password'); stopCamera(); setError(null); }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.5rem',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'password' ? '600' : '500',
              backgroundColor: activeTab === 'password' ? 'white' : 'transparent',
              color: activeTab === 'password' ? '#2d6a4f' : '#64748b',
              boxShadow: activeTab === 'password' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <KeyRound size={16} />
            <span>Contraseña</span>
          </button>
        </div>

        {/* Feedback de Error */}
        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Feedback de Éxito Facial */}
        {facialSuccess && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.85rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
            <CheckCircle2 size={20} color="#16a34a" />
            <div>
              <div style={{ fontWeight: '700' }}>¡Identidad Confirmada!</div>
              <div style={{ fontSize: '0.8rem', color: '#15803d' }}>
                Bienvenido {facialSuccess.nombre} ({facialSuccess.rol}) - Confianza: {facialSuccess.confidence}%
              </div>
            </div>
          </div>
        )}

        {/* Canvas oculto para extraer frame de la cámara */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* PESTAÑA: RECONOCIMIENTO FACIAL (IA) */}
        {activeTab === 'facial' && (
          <FacialLoginTab
            cameraActive={cameraActive}
            cameraStream={cameraStream}
            availableCameras={availableCameras}
            selectedCameraId={selectedCameraId}
            onSelectCamera={(id) => {
              setSelectedCameraId(id);
              startCamera(id);
            }}
            startCamera={startCamera}
            stopCamera={stopCamera}
            cameraError={cameraError}
            capturedImage={capturedImage}
            setCapturedImage={setCapturedImage}
            loading={loading}
            onFacialScan={handleFacialScan}
            onFileUpload={handleFileUpload}
            videoRef={videoRef}
            fileInputRef={fileInputRef}
          />
        )}

        {/* PESTAÑA: CONTRASEÑA TRADICIONAL */}
        {activeTab === 'password' && (
          <PasswordLoginTab
            identifier={identifier}
            setIdentifier={setIdentifier}
            password={password}
            setPassword={setPassword}
            loading={loading}
            onSubmit={handleSubmit}
            onDemoFill={handleDemoFill}
          />
        )}
      </div>
    </div>
  );
};
