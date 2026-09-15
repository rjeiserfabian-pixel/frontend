import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../core/api/axios';
import { authStorage } from '../../core/auth/authStorage';

// Contexto con los códigos de permiso vigentes del usuario autenticado
// (ej. "INVENTARIO.REPUESTOS.CREAR"), para mostrar/ocultar botones de
// Crear/Editar/Eliminar sin duplicar la lógica de roles: el backend sigue
// siendo la única fuente de verdad y vuelve a validar cada request.
const PermisosContext = createContext();

export const usePermisos = () => useContext(PermisosContext);

export const PermisosProvider = ({ children }) => {
  const [codigos, setCodigos] = useState(new Set());
  const [loadingPermisos, setLoadingPermisos] = useState(true);

  useEffect(() => {
    const token = authStorage.getAccessToken();
    if (!token) {
      setLoadingPermisos(false);
      return;
    }

    const controller = new AbortController();

    const fetchPermisos = async () => {
      try {
        const response = await api.get('seguridad/mis-permisos/', { signal: controller.signal });
        setCodigos(new Set(response.data?.data?.codigos || []));
      } catch (error) {
        if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
          console.error('Error al cargar permisos del usuario:', error);
        }
      } finally {
        setLoadingPermisos(false);
      }
    };

    fetchPermisos();
    return () => controller.abort();
  }, []);

  const tienePermiso = useCallback((codigo) => codigos.has(codigo), [codigos]);

  const value = useMemo(() => ({
    codigos,
    tienePermiso,
    loadingPermisos,
  }), [codigos, tienePermiso, loadingPermisos]);

  return (
    <PermisosContext.Provider value={value}>
      {children}
    </PermisosContext.Provider>
  );
};
