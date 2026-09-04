import { useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import { vehiculoTransporteService } from '../services/vehiculoTransporteService';

export const useVehiculosTransporte = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const cargarVehiculos = useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const data = await vehiculoTransporteService.listar(page, search);
      setVehiculos(data.results || data);
      setTotalCount(data.count || 0);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudieron cargar los vehículos', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const guardarVehiculo = async (datos, id = null) => {
    setLoading(true);
    let resultData = null;
    try {
      if (id) {
        resultData = await vehiculoTransporteService.actualizar(id, datos);
        Swal.fire({
          icon: 'success',
          title: 'Actualizado',
          text: 'Vehículo actualizado exitosamente',
          didOpen: () => {
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '9999';
          }
        });
      } else {
        resultData = await vehiculoTransporteService.crear(datos);
        Swal.fire({
          icon: 'success',
          title: 'Creado',
          text: 'Vehículo registrado exitosamente',
          didOpen: () => {
            const container = document.querySelector('.swal2-container');
            if (container) container.style.zIndex = '9999';
          }
        });
      }
      return resultData || true;
    } catch (error) {
      console.error(error);
      let errorMessage = 'Ocurrió un error al guardar el vehículo';
      
      if (error.response && error.response.data) {
        const errData = error.response.data.errores || error.response.data;
        if (errData.placa) {
          errorMessage = errData.placa[0];
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

  const eliminarVehiculo = async (id) => {
    try {
      await vehiculoTransporteService.eliminar(id);
      Swal.fire('Eliminado', 'Vehículo eliminado exitosamente', 'success');
      return true;
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'No se pudo eliminar el vehículo', 'error');
      return false;
    }
  };

  const consultarPlaca = async (placa, signal) => {
    try {
      const result = await vehiculoTransporteService.consultarPlaca(placa, signal);
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
            text: `Datos obtenidos exitosamente de la API (Yupay)`,
            timer: 3000,
            showConfirmButton: false
          });
        }
        return result.data;
      }
    } catch (error) {
      if (error.name === 'CanceledError' || error.message === 'canceled') return null;
      
      const msg = error.response?.data?.error || `Error al consultar la placa`;
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
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
    vehiculos,
    loading,
    totalCount,
    cargarVehiculos,
    guardarVehiculo,
    eliminarVehiculo,
    consultarPlaca
  };
};
