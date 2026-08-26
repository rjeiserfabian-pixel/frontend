import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../../core/api/axios';

const SucursalContext = createContext();

export const useSucursal = () => useContext(SucursalContext);

export const SucursalProvider = ({ children }) => {
  const [sucursales, setSucursales] = useState([]);
  const [activeSucursalId, setActiveSucursalId] = useState(null);
  const [loadingContext, setLoadingContext] = useState(true);

  useEffect(() => {
    // Solo intentar cargar si hay token de acceso (el usuario ha iniciado sesión)
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoadingContext(false);
      return;
    }

    const fetchSucursales = async () => {
      try {
        setLoadingContext(true);
        // Llama al endpoint de sucursales que, en el backend, ahora devuelve solo a las que tiene acceso
        const response = await api.get('inventario/sucursales/');
        const data = response.data.results || response.data || [];
        setSucursales(data);

        // Auto-seleccionar la primera si no hay ninguna seleccionada
        const savedId = localStorage.getItem('activeSucursalId');
        if (savedId && data.find(s => s.id.toString() === savedId)) {
          setActiveSucursalId(savedId);
        } else if (data.length > 0) {
          setActiveSucursalId(data[0].id.toString());
          localStorage.setItem('activeSucursalId', data[0].id.toString());
        }
      } catch (error) {
        console.error('Error al cargar sucursales en el Contexto:', error);
      } finally {
        setLoadingContext(false);
      }
    };

    fetchSucursales();
  }, []);

  const changeSucursal = (id) => {
    setActiveSucursalId(id.toString());
    localStorage.setItem('activeSucursalId', id.toString());
    // Refrescar la página es la manera más sencilla y segura de re-inicializar todos los componentes con la nueva sucursal
    window.location.reload();
  };

  const value = {
    sucursales,
    activeSucursalId,
    changeSucursal,
    loadingContext
  };

  return (
    <SucursalContext.Provider value={value}>
      {children}
    </SucursalContext.Provider>
  );
};
