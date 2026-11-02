import React, { useState, useRef, useEffect } from 'react';
import { 
  X, LogIn, AlertCircle, Shield, KeyRound, User, Camera, 
  CameraOff, Scan, Sparkles, CheckCircle2, Upload, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

  const startCamera = async () => {
    setCameraError(null);
    setError(null);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setCameraActive(true);
      } else {
        setCameraError('Tu navegador no soporta acceso directo a la cámara web.');
      }
    } catch (err) {
      console.warn('Error accediendo a la cámara:', err);
      setCameraError('No se pudo acceder a la cámara. Puedes subir una foto o usar usuario/contraseña.');
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
          <div>
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
                    ref={videoRef} 
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
                    onClick={startCamera}
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
                onClick={handleFacialScan}
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
                onChange={handleFileUpload}
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
        )}

        {/* PESTAÑA: CONTRASEÑA TRADICIONAL */}
        {activeTab === 'password' && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                Correo electrónico o Usuario
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="admin o usuario@losangeles.cl"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                Contraseña
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: '#94a3b8' }} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '0.7rem', fontSize: '0.95rem', marginBottom: '1rem' }}
            >
              <LogIn size={18} />
              {loading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
            </button>

            {/* Quick Demo Access Pills */}
            <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#64748b', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Credenciales Demo:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleDemoFill('admin')}
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}
                >
                  👤 Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoFill('funcionario')}
                  style={{ flex: 1, padding: '0.35rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer' }}
                >
                  💼 Funcionario
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
