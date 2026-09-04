import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { proveedorService } from '../services/proveedorService';

export const useProveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const cargarProveedores = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const data = await proveedorService.listar(page, search);
      setProveedores(data.results || data);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los proveedores', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const guardarProveedor = async (datos, id = null) => {
    setLoading(true);
    let resultData = null;
    try {
      if (id) {
        resultData = await proveedorService.actualizar(id, datos);
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Proveedor actualizado exitosamente',
          didOpen: () => {
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '9999';
          }
        });
      } else {
        resultData = await proveedorService.crear(datos);
        Swal.fire({
          icon: 'success',
          title: 'Creado',
          text: 'Proveedor registrado exitosamente',
          didOpen: () => {
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '9999';
          }
        });
      }
      return resultData || true;
    } catch (error) {
      console.error(error);
      let errorMessage = 'Ocurrió un error al guardar el proveedor';
      
      if (error.response && error.response.data) {
        const errData = error.response.data.errores || error.response.data;
        if (errData.numero_documento) {
          errorMessage = errData.numero_documento[0];
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

  const eliminarProveedor = async (id) => {
    try {
      await proveedorService.eliminar(id);
      Swal.fire('Eliminado', 'Proveedor eliminado exitosamente', 'success');
      return true;
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo eliminar el proveedor', 'error');
      return false;
    }
  };

  const consultarDocumento = async (tipo, documento, signal) => {
    try {
      const result = await proveedorService.consultarDocumento(tipo, documento, signal);
      if (result && result.data) {
        if (result.origen === 'local') {
          Swal.fire({
            icon: 'info',
            title: 'Datos Locales',
            text: `Se encontraron datos en registros locales`,
            timer: 3000,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            icon: 'success',
            title: 'Datos Encontrados',
            text: `Datos obtenidos exitosamente de la API externa`,
            timer: 3000,
            showConfirmButton: false
          });
        }
        return result.data;
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') return null;
      
      const msg = error.response?.data?.error || `Error al consultar ${tipo}`;
      Swal.fire({
        icon: 'warning',
        title: 'Error',
        text: msg,
        didOpen: () => {
          const container = document.querySelector('.swal2-container');
          if (container) container.style.zIndex = '9999';
        }
      });
    }
    return null;
  };

  return {
    proveedores,
    loading,
    totalCount,
    cargarProveedores,
    guardarProveedor,
    eliminarProveedor,
    consultarDocumento
  };
};
