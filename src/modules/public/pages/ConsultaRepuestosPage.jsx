import { useEffect, useMemo, useState } from 'react';
import { Car, CheckCircle2, Clock, Search, ShieldCheck, Wrench, XCircle } from 'lucide-react';
import api from '../../../core/api/axios';
import { inventarioService } from '../../inventario/services/inventarioService';

const formatoMoneda = (value) => `S/ ${Number(value || 0).toFixed(2)}`;

const normalizarVehiculo = (data) => ({
  ...data,
  placa: data?.placa || '',
  marca: data?.marca || '',
  modelo: data?.modelo || '',
  anio: data?.anio_fabricacion || data?.anio || '',
  tipoCombustible: data?.tipo_combustible || '',
});

export default function ConsultaRepuestosPage() {
  const [placa, setPlaca] = useState('');
  const [search, setSearch] = useState('');
  const [vehiculo, setVehiculo] = useState(null);
  const [repuestos, setRepuestos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingFiltro, setLoadingFiltro] = useState(false);
  const [error, setError] = useState('');
  const [consultado, setConsultado] = useState(false);
  const [empresaNombre, setEmpresaNombre] = useState('OMEGA AUTOMOTRIZ');

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const res = await api.get('/seguridad/empresa/');
        const razonSocial = res.data?.data?.razon_social;
        if (razonSocial) setEmpresaNombre(razonSocial);
      } catch (err) {
        console.error('Error al obtener la configuracion de empresa', err);
      }
    };

    fetchEmpresa();
  }, []);

  const vehiculoParams = useMemo(() => {
    if (!vehiculo?.marca) return null;
    return {
      marca: vehiculo.marca,
      modelo: vehiculo.modelo,
      anio: vehiculo.anio,
      tipoCombustible: vehiculo.tipoCombustible,
    };
  }, [vehiculo]);

  const buscarCompatibles = async (params, filtro = '') => {
    const data = await inventarioService.getCompatiblesPublicos({
      ...params,
      search: filtro,
      page: 1,
      pageSize: 50,
    });
    setRepuestos(data.results || []);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const placaLimpia = placa.trim().replaceAll('-', '').replaceAll(' ', '').toUpperCase();
    if (placaLimpia.length < 6) {
      setError('Ingresa una placa valida.');
      return;
    }

    setLoading(true);
    setError('');
    setVehiculo(null);
    setRepuestos([]);
    setSearch('');
    setConsultado(false);

    try {
      const res = await api.get(`/vehiculos/kiosko/buscar-vehiculo/?placa=${encodeURIComponent(placaLimpia)}`);
      const normalizado = normalizarVehiculo(res.data?.data || {});
      setVehiculo(normalizado);
      setConsultado(true);
      if (!normalizado.marca) {
        setError('Encontramos la placa, pero no tenemos datos suficientes para comparar repuestos.');
        return;
      }
      await buscarCompatibles({
        marca: normalizado.marca,
        modelo: normalizado.modelo,
        anio: normalizado.anio,
        tipoCombustible: normalizado.tipoCombustible,
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo consultar la placa.');
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = async (event) => {
    event.preventDefault();
    if (!vehiculoParams) return;
    setLoadingFiltro(true);
    try {
      await buscarCompatibles(vehiculoParams, search);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo filtrar los repuestos.');
    } finally {
      setLoadingFiltro(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100 font-sans overflow-hidden">
      <div className="hidden lg:flex w-2/5 flex-col relative bg-black border-r border-slate-800">
        <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40" style={{ backgroundImage: "url('/bg-taller.jpg')" }} />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0b0f19]/80 via-transparent to-[#0b0f19]" />

        <div className="relative z-10 flex flex-col h-full p-12 2xl:p-14">
          <div className="flex items-center gap-3 mb-12 2xl:mb-14">
            <span className="text-3xl 2xl:text-4xl font-black italic tracking-tighter text-white uppercase">{empresaNombre}</span>
          </div>

          <div className="mt-12 2xl:mt-16">
            <h1 className="text-4xl 2xl:text-5xl font-black italic mb-4 2xl:mb-5 leading-tight">REPUESTOS PARA <br /><span className="text-[#e50914] uppercase">TU VEHICULO</span></h1>
            <p className="text-xl 2xl:text-2xl text-slate-300 font-light max-w-sm 2xl:max-w-lg">Consulta si tenemos repuestos compatibles publicados para tu vehiculo.</p>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-6 2xl:gap-8 text-sm 2xl:text-base text-slate-400">
            <div className="flex flex-col gap-2 2xl:gap-3">
              <ShieldCheck className="text-[#e50914] w-6 h-6 2xl:w-8 2xl:h-8" />
              <span className="font-bold text-white">Precio de Lista</span>
              <span className="leading-relaxed">El cliente solo visualiza el precio publico disponible.</span>
            </div>
            <div className="flex flex-col gap-2 2xl:gap-3">
              <Clock className="text-[#e50914] w-6 h-6 2xl:w-8 2xl:h-8" />
              <span className="font-bold text-white">Consulta Rapida</span>
              <span className="leading-relaxed">Busca por placa y revisa compatibilidad al instante.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative bg-[#0b0f19] p-8 lg:p-12 2xl:p-14 h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="max-w-5xl 2xl:max-w-[1180px] mx-auto w-full">
          <div className="lg:hidden mb-8 text-center">
            <h2 className="text-2xl font-black italic text-white uppercase">{empresaNombre}</h2>
            <p className="text-slate-400 mt-2">Consulta de Repuestos</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] 2xl:grid-cols-[390px_1fr] gap-8 2xl:gap-9">
            <div className="bg-[#111827] rounded-3xl p-8 2xl:p-9 border border-slate-800 shadow-2xl flex flex-col items-center h-fit xl:sticky xl:top-12 2xl:top-14">
              <div className="w-16 h-16 2xl:w-20 2xl:h-20 rounded-full bg-[#1f2937] flex items-center justify-center text-[#e50914] mb-6 2xl:mb-7">
                <Search className="w-8 h-8 2xl:w-10 2xl:h-10" />
              </div>
              <h3 className="text-2xl 2xl:text-3xl font-bold text-white mb-2 2xl:mb-3 text-center">Busca por Placa</h3>
              <p className="text-slate-400 mb-8 2xl:mb-9 text-center text-sm 2xl:text-base">Ingresa la placa de tu vehiculo</p>

              <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5 2xl:gap-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 2xl:pl-5 flex items-center pointer-events-none text-slate-400">
                    <Car className="w-5 h-5 2xl:w-6 2xl:h-6" />
                  </div>
                  <input
                    value={placa}
                    onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                    placeholder="PLACA DEL VEHICULO"
                    className="w-full bg-[#1f2937] border border-slate-700 rounded-xl py-4 2xl:py-5 pl-12 2xl:pl-14 pr-4 2xl:pr-5 text-white placeholder-slate-500 focus:outline-none focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] transition-all uppercase font-black tracking-[0.16em] text-base 2xl:text-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#e50914] hover:bg-red-700 text-white font-bold py-4 2xl:py-5 rounded-xl transition-all flex items-center justify-center gap-2 2xl:gap-3 disabled:opacity-60 disabled:cursor-not-allowed text-sm 2xl:text-lg"
                >
                  <Search className="w-5 h-5 2xl:w-6 2xl:h-6" />
                  {loading ? 'Consultando...' : 'Consultar Repuestos'}
                </button>
              </form>

              {error && (
                <div className="mt-5 w-full rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-100">
                  {error}
                </div>
              )}

              {vehiculo && (
                <div className="mt-5 2xl:mt-6 w-full rounded-xl border border-slate-800 bg-[#0b0f19] p-4 2xl:p-5">
                  <p className="text-xs 2xl:text-sm font-bold uppercase text-slate-500">Vehiculo consultado</p>
                  <p className="mt-1 2xl:mt-2 text-lg 2xl:text-2xl font-black text-white">{vehiculo.marca || '-'} {vehiculo.modelo || ''}</p>
                  <div className="mt-3 2xl:mt-4 grid grid-cols-2 gap-3 2xl:gap-4 text-sm 2xl:text-base">
                    <span className="text-slate-400">Placa<br /><strong className="text-white">{vehiculo.placa || placa}</strong></span>
                    <span className="text-slate-400">Anio<br /><strong className="text-white">{vehiculo.anio || '-'}</strong></span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h3 className="flex items-center gap-2 2xl:gap-3 text-white font-bold mb-4 2xl:mb-5 text-base 2xl:text-2xl">
                <Wrench className="text-[#e50914] w-5 h-5 2xl:w-7 2xl:h-7" />
                Resultado de la Consulta
              </h3>

              <div className="bg-[#111827] rounded-2xl border border-slate-800 shadow-2xl p-6 2xl:p-7 min-h-[360px] 2xl:min-h-[430px]">
                <div className="mb-5 2xl:mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {consultado ? (
                    repuestos.length > 0 ? (
                      <p className="flex items-center gap-2 text-emerald-300 text-sm 2xl:text-base"><CheckCircle2 className="w-[18px] h-[18px] 2xl:w-5 2xl:h-5" /> Si tenemos repuestos compatibles publicados.</p>
                    ) : (
                      <p className="flex items-center gap-2 text-slate-400 text-sm 2xl:text-base"><XCircle className="w-[18px] h-[18px] 2xl:w-5 2xl:h-5" /> No encontramos repuestos publicados para esta consulta.</p>
                    )
                  ) : (
                    <p className="text-slate-500 text-sm 2xl:text-base">Ingresa una placa para ver repuestos compatibles.</p>
                  )}

                  {vehiculoParams && (
                    <form onSubmit={handleFiltrar} className="flex w-full gap-2 md:w-auto">
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar repuesto..."
                        className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-[#0b0f19] px-4 2xl:px-5 py-3 2xl:py-4 text-white outline-none focus:border-[#e50914] md:w-72 2xl:w-80 2xl:text-base"
                      />
                      <button disabled={loadingFiltro} className="rounded-xl bg-slate-800 px-4 2xl:px-6 font-bold text-white hover:bg-slate-700 disabled:opacity-60 2xl:text-base">
                        Buscar
                      </button>
                    </form>
                  )}
                </div>

                {!consultado ? (
                  <div className="grid min-h-[260px] 2xl:min-h-[330px] place-items-center rounded-2xl border border-dashed border-slate-700 bg-[#0b0f19]/70 text-center text-slate-500">
                    <div>
                      <Search className="mx-auto mb-4 2xl:mb-5 w-14 h-14 2xl:w-16 2xl:h-16" />
                      <p className="2xl:text-lg">Ingresa una placa para ver repuestos compatibles.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 2xl:gap-5 md:grid-cols-2">
                    {repuestos.map((item) => (
                      <article key={item.id} className="rounded-xl border border-slate-800 bg-[#0b0f19] p-5 2xl:p-6">
                        <div className="mb-3 2xl:mb-4 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs 2xl:text-sm font-bold uppercase text-[#e50914]">{item.codigo}</p>
                            <h4 className="mt-1 font-black text-white 2xl:text-xl">{item.nombre}</h4>
                          </div>
                          <span className={`rounded-full px-3 2xl:px-4 py-1 text-xs 2xl:text-sm font-bold ${item.disponible ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-300'}`}>
                            {item.disponible ? 'Disponible' : 'Consultar'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs 2xl:text-sm text-slate-300">
                          <span className="rounded-full bg-slate-800 px-3 2xl:px-4 py-1">{item.categoria_nombre || 'Sin categoria'}</span>
                          <span className="rounded-full bg-slate-800 px-3 2xl:px-4 py-1">{item.marca_nombre || 'Sin marca'}</span>
                        </div>
                        <div className="mt-5 2xl:mt-6 border-t border-slate-800 pt-4 2xl:pt-5">
                          <p className="text-xs 2xl:text-sm text-slate-500">Precio lista</p>
                          <p className="text-2xl 2xl:text-3xl font-black text-white">{formatoMoneda(item.precio_lista)}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
