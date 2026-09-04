import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { transportistaService } from '../services/transportistaService';

export const useTransportistas = () => {
  const [transportistas, setTransportistas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const cargarTransportistas = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const data = await transportistaService.listar(page, search);
      setTransportistas(data.results || data);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los transportistas', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const guardarTransportista = async (datos, id = null) => {
    setLoading(true);
    let resultData = null;
    try {
      if (id) {
        resultData = await transportistaService.actualizar(id, datos);
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Transportista actualizado exitosamente',
          didOpen: () => {
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '9999';
          }
        });
      } else {
        resultData = await transportistaService.crear(datos);
        Swal.fire({
          icon: 'success',
          title: 'Creado',
          text: 'Transportista registrado exitosamente',
          didOpen: () => {
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '9999';
          }
        });
      }
      return resultData || true;
    } catch (error) {
      console.error(error);
      let errorMessage = 'Ocurrió un error al guardar el transportista';
      
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

  const eliminarTransportista = async (id) => {
    try {
      await transportistaService.eliminar(id);
      Swal.fire('Eliminado', 'Transportista eliminado exitosamente', 'success');
      return true;
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo eliminar el transportista', 'error');
      return false;
    }
  };

  const consultarDocumento = async (tipo, documento, signal) => {
    try {
      const result = await transportistaService.consultarDocumento(tipo, documento, signal);
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
    transportistas,
    loading,
    totalCount,
    cargarTransportistas,
    guardarTransportista,
    eliminarTransportista,
    consultarDocumento
  };
};
