import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Save, AlertCircle, UserCheck, Camera, CameraOff, 
  Upload, Trash2, CheckCircle2, RefreshCw, Shield
} from 'lucide-react';
import { userService, biometricsService } from '../services/api';

export const UserModal = ({ isOpen, onClose, user, onSaved }) => {
  const isEditing = Boolean(user && user.id);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nombre_completo: '',
    rol: 'funcionario',
    activo: true,
  });

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  // Biometrics State
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [biometricImage, setBiometricImage] = useState(null);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        nombre_completo: user.nombre_completo || '',
        rol: user.rol || 'funcionario',
        activo: user.activo ?? true,
      });
      setHasBiometrics(Boolean(user.has_biometrics));
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        nombre_completo: '',
        rol: 'funcionario',
        activo: true,
      });
      setHasBiometrics(false);
    }
    setError(null);
    setSuccessMsg(null);
    setBiometricImage(null);
    stopCamera();
  }, [user, isOpen]);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  if (!isOpen) return null;

  const startCamera = async () => {
    setError(null);
    setShowCamera(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360, facingMode: 'user' },
          audio: false
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }
    } catch (err) {
      setError('No se pudo acceder a la cámara. Puedes subir una imagen desde archivo.');
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setBiometricImage(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBiometricImage(event.target.result);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  const handleEnrollBiometricsDirectly = async () => {
    if (!isEditing || !user?.id || !biometricImage) return;
    setBiometricLoading(true);
    setError(null);
    try {
      const res = await biometricsService.register(user.id, biometricImage);
      if (res.data.success) {
        setHasBiometrics(true);
        setSuccessMsg('¡Rostro biométrico registrado correctamente!');
        setBiometricImage(null);
        setTimeout(() => setSuccessMsg(null), 3500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enrolar rostro en el microservicio de IA');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleDeleteBiometrics = async () => {
    if (!isEditing || !user?.id) return;
    if (!window.confirm('¿Seguro que deseas eliminar los datos biométricos de este usuario?')) return;
    setBiometricLoading(true);
    setError(null);
    try {
      await biometricsService.delete(user.id);
      setHasBiometrics(false);
      setSuccessMsg('Biometría facial eliminada');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar biometría');
    } finally {
      setBiometricLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = { ...formData };
      if (biometricImage && !isEditing) {
        payload.biometric_image = biometricImage;
      }

      if (isEditing) {
        await userService.update(user.id, payload);
      } else {
        if (!formData.password) {
          setError('La contraseña es obligatoria para nuevos usuarios');
          setLoading(false);
          return;
        }
        await userService.create(payload);
      }
      stopCamera();
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px', padding: '1.5rem 2rem', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#0f2d1e', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <UserCheck size={20} color="#2d6a4f" />
            {isEditing ? `Editar Usuario: ${user.username}` : 'Registrar Nuevo Usuario Interno (RF03)'}
          </h3>
          <button onClick={() => { stopCamera(); onClose(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Nombre Completo *</label>
            <input
              type="text"
              required
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              className="form-input"
              placeholder="Ej. Juan Pérez González"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Usuario *</label>
              <input
                type="text"
                required
                disabled={isEditing}
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="form-input"
                placeholder="jperez"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Rol (RF02) *</label>
              <select
                value={formData.rol}
                onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                className="form-select"
                style={{ width: '100%' }}
              >
                <option value="funcionario">Funcionario Municipal</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>Correo Electrónico *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="form-input"
              placeholder="jperez@losangeles.cl"
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', marginBottom: '0.3rem' }}>
              {isEditing ? 'Nueva Contraseña (dejar en blanco para conservar)' : 'Contraseña *'}
            </label>
            <input
              type="password"
              required={!isEditing}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="form-input"
              placeholder="••••••••"
            />
          </div>

          {/* ============================================================================== */}
          {/* SECCIÓN BIOMETRÍA FACIAL IA */}
          {/* ============================================================================== */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.86rem', fontWeight: '700', color: '#1e293b' }}>
                <Camera size={16} color="#2d6a4f" />
                <span>Reconocimiento Facial (IA)</span>
              </div>
              <span style={{
                fontSize: '0.72rem',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: hasBiometrics ? '#dcfce7' : '#f1f5f9',
                color: hasBiometrics ? '#166534' : '#64748b'
              }}>
                {hasBiometrics ? '✓ Biometría Enrolada' : 'Sin enrolar'}
              </span>
            </div>

            <p style={{ fontSize: '0.76rem', color: '#64748b', margin: '0 0 0.75rem 0' }}>
              Permite el acceso instantáneo al sistema escaneando el rostro mediante el microservicio de IA.
            </p>

            {/* Video stream para captura */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {showCamera && (
              <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.75rem' }}>
                <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={capturePhoto}
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#2d6a4f',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Capturar Foto
                </button>
              </div>
            )}

            {/* Preview de foto tomada o cargada */}
            {biometricImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', backgroundColor: '#ffffff', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <img src={biometricImage} alt="Rostro" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '6px' }} />
                <div style={{ flex: 1, fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: '600', color: '#166534' }}>✓ Rostro listo para enrolar</div>
                  <div style={{ color: '#64748b' }}>Se procesará vector biométrico de 128x128</div>
                </div>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleEnrollBiometricsDirectly}
                    disabled={biometricLoading}
                    style={{
                      backgroundColor: '#2d6a4f',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    {biometricLoading ? 'Guardando...' : 'Guardar Rostro'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setBiometricImage(null)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Quitar
                  </button>
                )}
              </div>
            )}

            {/* Botones para activar cámara o subir foto */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {!showCamera && (
                <button
                  type="button"
                  onClick={startCamera}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    padding: '0.45rem',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <Camera size={14} />
                  Usar Cámara
                </button>
              )}
              {showCamera && (
                <button
                  type="button"
                  onClick={stopCamera}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.3rem',
                    padding: '0.45rem',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <CameraOff size={14} />
                  Cerrar Cámara
                </button>
              )}

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
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                  padding: '0.45rem',
                  fontSize: '0.78rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: 'white',
                  cursor: 'pointer'
                }}
              >
                <Upload size={14} />
                Subir Archivo
              </button>

              {isEditing && hasBiometrics && (
                <button
                  type="button"
                  onClick={handleDeleteBiometrics}
                  disabled={biometricLoading}
                  style={{
                    padding: '0.45rem 0.6rem',
                    borderRadius: '6px',
                    border: '1px solid #fecaca',
                    backgroundColor: '#fff5f5',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                  title="Eliminar biometría del usuario"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          {isEditing && (
            <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="activo"
                checked={formData.activo}
                onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
              />
              <label htmlFor="activo" style={{ fontSize: '0.88rem', fontWeight: '500', cursor: 'pointer' }}>
                Usuario Activo
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={() => { stopCamera(); onClose(); }} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              <Save size={16} />
              {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Usuario')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
