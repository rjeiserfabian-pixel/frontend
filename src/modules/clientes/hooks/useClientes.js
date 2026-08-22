import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { clienteService } from '../services/clienteService';

export const useClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Regla 2.3: Estabilidad de funciones con useCallback
  const cargarClientes = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const data = await clienteService.listar(page, search);
      setClientes(data.results || data);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los clientes', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const guardarCliente = async (datos, id = null) => {
    setLoading(true);
    try {
      if (id) {
        await clienteService.actualizar(id, datos);
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Cliente actualizado exitosamente',
          didOpen: () => {
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '9999';
          }
        });
      } else {
        await clienteService.crear(datos);
        Swal.fire({
          icon: 'success',
          title: 'Creado',
          text: 'Cliente registrado exitosamente',
          didOpen: () => {
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '9999';
          }
        });
      }
      return true;
    } catch (error) {
      console.error(error);
      let errorMessage = 'Ocurrió un error al guardar el cliente';
      
      if (error.response && error.response.data) {
        const errData = error.response.data.errores || error.response.data;
        if (errData.dni) {
          errorMessage = 'Ya existe un cliente registrado con este DNI.';
        } else if (errData.error) {
          errorMessage = errData.error;
        } else if (typeof errData === 'object') {
          const firstKey = Object.keys(errData)[0];
          if (firstKey && Array.isArray(errData[firstKey])) {
            errorMessage = errData[firstKey][0];
          }
        }
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const consultarDni = async (dni, signal) => {
    try {
      const result = await clienteService.consultarDni(dni, signal);
      return result.data;
    } catch (error) {
      // Ignorar errores de cancelación de AbortController
      if (error.name === 'CanceledError') return null;
      
      const msg = error.response?.data?.error || 'Error al consultar DNI';
      Swal.fire({
        icon: 'warning',
        title: 'Error',
        text: msg,
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
      return null;
    }
  };

  return {
    clientes,
    loading,
    totalCount,
    cargarClientes,
    guardarCliente,
    consultarDni,
  };
};
