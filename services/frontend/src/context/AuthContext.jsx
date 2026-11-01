import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('cementerio_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('cementerio_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authService.me();
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem('cementerio_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.error("Session verification failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    try {
      const res = await authService.login({ username: usernameOrEmail, password });
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('cementerio_token', newToken);
        localStorage.setItem('cementerio_user', JSON.stringify(newUser));
        return { success: true };
      }
      return { success: false, error: res.data.error || 'Error de inicio de sesión' };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Error al conectar con el servidor'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('cementerio_token');
    localStorage.removeItem('cementerio_user');
  };

  const role = user ? user.rol : 'publico';
  const isAdmin = role === 'administrador';
  const isFuncionario = role === 'funcionario' || isAdmin;

  return (
    <AuthContext.Provider value={{
      user,
      token,
      role,
      isAdmin,
      isFuncionario,
      isAuthenticated: !!token,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
