import React, { useState } from 'react';
import { 
  Search, Car, Wrench, CheckCircle, ArrowLeft, ArrowRight, 
  User, ShieldCheck, Award, Truck, HeadphonesIcon, Delete
} from 'lucide-react';
import Swal from 'sweetalert2';
import { clienteService } from '../../clientes/services/clienteService';
import { vehiculoService } from '../../vehiculos/services/vehiculosService';
import { inventarioService } from '../../inventario/services/inventarioService';

/* ──────────────────────────────────────────────
   TECLADOS VIRTUALES
────────────────────────────────────────────── */

const KeyButton = ({ children, onClick, className = "", variant = "default" }) => {
  const baseClass = "flex items-center justify-center font-bold text-xl rounded-xl transition-all shadow-sm active:scale-95";
  const variants = {
    default: "bg-[#1c2230] text-white hover:bg-[#2a3447] border border-slate-700/50",
    red: "bg-[#e50914] text-white hover:bg-[#b80710] border border-red-600",
    redOutline: "bg-transparent text-[#e50914] border border-[#e50914] hover:bg-[#e50914]/10",
  };
  return (
    <button onClick={onClick} className={`${baseClass} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const TecladoNumerico = ({ onKeyPress, onBackspace, onConfirm }) => {
  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
  ];
  return (
    <div className="flex flex-col gap-3 w-full max-w-xs mx-auto">
      {keys.map((row, i) => (
        <div key={i} className="grid grid-cols-3 gap-3 h-16">
          {row.map(k => (
            <KeyButton key={k} onClick={() => onKeyPress(k)}>{k}</KeyButton>
          ))}
        </div>
      ))}
      <div className="grid grid-cols-3 gap-3 h-16">
        <KeyButton onClick={onBackspace} variant="red"><Delete size={24} /></KeyButton>
        <KeyButton onClick={() => onKeyPress('0')}>0</KeyButton>
        <KeyButton onClick={onConfirm} variant="red"><CheckCircle size={24} /></KeyButton>
      </div>
    </div>
  );
};

const TecladoAlfanumerico = ({ onKeyPress, onBackspace, onConfirm }) => {
  const rows = [
    ['A','B','C','D','E','F','G'],
    ['H','I','J','K','L','M','N'],
    ['O','P','Q','R','S','T','U'],
    ['V','W','X','Y','Z','1','2'],
    ['3','4','5','6','7','8','9']
  ];
  return (
    <div className="flex flex-col gap-2 w-full max-w-xl mx-auto">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-7 gap-2 h-14">
          {row.map(k => (
            <KeyButton key={k} onClick={() => onKeyPress(k)}>{k}</KeyButton>
          ))}
        </div>
      ))}
      <div className="grid grid-cols-7 gap-2 h-14">
        <KeyButton onClick={() => onKeyPress('0')}>0</KeyButton>
        <KeyButton onClick={() => onKeyPress('-')}>-</KeyButton>
        <KeyButton onClick={() => onKeyPress('"')}>"</KeyButton>
        <KeyButton onClick={onBackspace} variant="red" className="col-span-2 flex gap-2"><Delete size={20} /> Borrar</KeyButton>
        <KeyButton onClick={onConfirm} variant="red" className="col-span-2 flex gap-2"><CheckCircle size={20} /> Buscar</KeyButton>
      </div>
    </div>
  );
};


/* ──────────────────────────────────────────────
   COMPONENTE PRINCIPAL
────────────────────────────────────────────── */

export const KioskoPage = () => {
  const [step, setStep] = useState(1);
  const [dni, setDni] = useState('');
  const [placa, setPlaca] = useState('');
  const [vehiculo, setVehiculo] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [repuestosCompatibles, setRepuestosCompatibles] = useState([]);
  const [loadingRepuestos, setLoadingRepuestos] = useState(false);

  // Al entrar al Paso 3, cargar repuestos compatibles con el vehículo encontrado
  React.useEffect(() => {
    if (step === 3 && vehiculo) {
      const marca = vehiculo.marca || '';
      const modelo = vehiculo.modelo || '';
      const anio = vehiculo.anio_fabricacion || vehiculo.anio || vehiculo.año || null;

      if (!marca) return;

      setLoadingRepuestos(true);
      setRepuestosCompatibles([]);
      inventarioService.getRepuestosCompatibles(marca, modelo, anio)
        .then(data => {
          const lista = Array.isArray(data) ? data : (data.results || []);
          setRepuestosCompatibles(lista);
        })
        .catch(err => {
          console.error('Error al cargar repuestos compatibles:', err);
          setRepuestosCompatibles([]);
        })
        .finally(() => setLoadingRepuestos(false));
    }
  }, [step, vehiculo]);

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  // Lógica Paso 1
  const onKeyPressDni = (k) => { if (dni.length < 8) setDni(prev => prev + k); };
  const onBackspaceDni = () => setDni(prev => prev.slice(0, -1));
  const onConfirmDni = () => {
    if (dni.length === 8) consultarCliente();
  };

  const consultarCliente = async () => {
    if (dni.length !== 8) {
      Swal.fire({ icon: 'warning', title: 'DNI Inválido', text: 'El DNI debe tener 8 dígitos.', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#1e293b', color: '#fff' });
      return;
    }
    try {
      setLoading(true);
      const data = await clienteService.buscarPorDni(dni);
      if (data) {
        setCliente(data);
      } else {
        const res = await clienteService.consultarDni(dni);
        const ext = res?.data || res; // Manejar si res.data existe o si es el objeto directo
        
        if (ext && ext.nombres) {
          setCliente({
            nombres: ext.nombres,
            apellidos: `${ext.apellido_paterno || ''} ${ext.apellido_materno || ''}`.trim(),
            dni: ext.numeroDocumento || ext.numero_documento || dni
          });
        } else {
          Swal.fire({ icon: 'error', title: 'No encontrado', text: 'Cliente no encontrado', background: '#1e293b', color: '#fff' });
          setCliente(null);
        }
      }
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Hubo un error al buscar el cliente.', background: '#1e293b', color: '#fff' });
    } finally {
      setLoading(false);
    }
  };

  // Lógica Paso 2
  const onKeyPressPlaca = (k) => { if (placa.length < 7) setPlaca(prev => prev + k); };
  const onBackspacePlaca = () => setPlaca(prev => prev.slice(0, -1));
  const onConfirmPlaca = () => {
    if (placa.length >= 6) consultarVehiculo();
  };

  const consultarVehiculo = async () => {
    if (placa.length < 6) {
      Swal.fire({ icon: 'warning', title: 'Placa Inválida', text: 'La placa debe tener al menos 6 caracteres.', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#1e293b', color: '#fff' });
      return;
    }
    try {
      setLoading(true);
      
      // 1. Buscar en BD Local
      const resLocal = await vehiculoService.getVehiculos(1, placa);
      const lista = Array.isArray(resLocal) ? resLocal : (resLocal.results || []);
      const vehiculoLocal = lista.find(v => (v.placa || '').toUpperCase() === placa.toUpperCase());
      
      if (vehiculoLocal) {
        setVehiculo(vehiculoLocal);
        return;
      }

      // 2. Si no existe, buscar en API Externa
      const data = await vehiculoService.buscarPorPlaca(placa);
      if (data) {
        setVehiculo(data.data || data); // Extrae la data si el backend lo devuelve anidado
      } else {
        Swal.fire({ icon: 'error', title: 'No encontrado', text: 'Vehículo no encontrado', background: '#1e293b', color: '#fff' });
        setVehiculo(null);
      }
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.error || 'No se pudo encontrar información de esta placa.';
      Swal.fire({ icon: 'warning', title: 'No encontrado', text: msg, background: '#1e293b', color: '#fff' });
      setVehiculo(null);
    } finally {
      setLoading(false);
    }
  };


  const renderStepper = () => {
    const steps = [
      { num: 1, label: 'Datos del Cliente' },
      { num: 2, label: 'Vehículo' },
      { num: 3, label: 'Repuestos' },
      { num: 4, label: 'Resumen' },
    ];
    return (
      <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
        {steps.map((s, i) => (
          <React.Fragment key={s.num}>
            <div className={`flex flex-col items-center gap-1 ${step >= s.num ? 'text-[#e50914]' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= s.num ? 'border-[#e50914] bg-[#e50914]/10 text-[#e50914]' : 'border-slate-600 bg-transparent'}`}>
                {s.num}
              </div>
              <span>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-[2px] w-12 ${step > s.num ? 'bg-[#e50914]' : 'bg-slate-700'}`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0b0f19] text-slate-100 font-sans overflow-hidden">
      
      {/* ──────────────────────────────────────────────
          PANEL IZQUIERDO (BRANDING)
      ────────────────────────────────────────────── */}
      <div className="hidden lg:flex w-2/5 flex-col relative bg-black border-r border-slate-800">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: "url('/bg-taller.jpg')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0b0f19]/80 via-transparent to-[#0b0f19]" />
        
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo Superior */}
          <div className="flex items-center gap-3 mb-12">
            <span className="text-4xl font-black italic tracking-tighter text-white">MOTOR</span>
            <span className="text-4xl font-black italic tracking-tighter text-[#e50914]">360°</span>
          </div>

          <div className="mt-12">
            <h1 className="text-5xl font-black italic mb-4 leading-tight">
              BIENVENIDO A <br/>
              <span className="text-[#e50914]">MOTOR</span> 360
            </h1>
            <p className="text-xl text-slate-300 font-light max-w-sm">
              Encuentra los mejores repuestos ideales para tu vehículo en nuestro catálogo interactivo.
            </p>
          </div>
        </div>

        {/* Footer Beneficios */}
        <div className="relative z-10 grid grid-cols-2 gap-6 p-8 bg-[#0b0f19]/80 backdrop-blur-md border-t border-slate-800/50 mt-auto">
          <div className="flex items-start gap-3">
            <ShieldCheck className="text-[#e50914] mt-1" />
            <div>
              <p className="font-bold text-sm text-white">Seguridad Garantizada</p>
              <p className="text-xs text-slate-400">Tus datos protegidos</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Award className="text-[#e50914] mt-1" />
            <div>
              <p className="font-bold text-sm text-white">Repuestos de Calidad</p>
              <p className="text-xs text-slate-400">Las mejores marcas</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="text-[#e50914] mt-1" />
            <div>
              <p className="font-bold text-sm text-white">Entrega Rápida</p>
              <p className="text-xs text-slate-400">A todo el taller</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <HeadphonesIcon className="text-[#e50914] mt-1" />
            <div>
              <p className="font-bold text-sm text-white">Asesoría</p>
              <p className="text-xs text-slate-400">Te ayudamos a elegir</p>
            </div>
          </div>
        </div>
      </div>


      {/* ──────────────────────────────────────────────
          PANEL DERECHO (INTERACTIVO)
      ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col relative z-10 bg-[#0b0f19]">
        
        {/* Header Superior */}
        <div className="flex items-center justify-between p-8 border-b border-slate-800/50 bg-[#0b0f19]/90 backdrop-blur-md">
          {renderStepper()}
          <div className="flex items-center gap-3 text-slate-400 cursor-pointer hover:text-white transition-colors">
            <div className="w-10 h-10 rounded-full border border-slate-700 flex items-center justify-center">?</div>
            <span className="font-medium text-sm">¿Necesitas ayuda?</span>
          </div>
        </div>

        {/* CONTENIDO DEL PASO */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
          
          {/* PASO 1: DNI */}
          {step === 1 && (
            <div className="w-full max-w-5xl flex flex-col xl:flex-row gap-12 items-center justify-center animate-in fade-in slide-in-from-bottom-8 duration-700">
              
              {/* Tarjeta de Ingreso */}
              <div className="w-full xl:w-1/2 bg-[#121826] border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-[#e50914] flex items-center justify-center mb-6 text-[#e50914] bg-[#e50914]/5">
                  <User size={32} />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-white">Ingresa tu DNI</h2>
                <p className="text-slate-400 mb-8 text-center">Consulta tus datos para continuar</p>
                
                <div className="w-full relative mb-8">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    readOnly
                    value={dni}
                    placeholder="Número de DNI"
                    className="w-full bg-[#0b0f19] border-2 border-slate-700 text-white text-3xl font-mono tracking-widest py-4 pl-14 pr-4 rounded-xl text-center focus:outline-none focus:border-[#e50914]"
                  />
                </div>

                <TecladoNumerico onKeyPress={onKeyPressDni} onBackspace={onBackspaceDni} onConfirm={onConfirmDni} />

                <button 
                  onClick={consultarCliente}
                  disabled={dni.length < 8 || loading}
                  className="mt-6 w-full max-w-xs flex items-center justify-center gap-3 bg-[#e50914] hover:bg-[#b80710] disabled:opacity-50 text-white text-xl font-bold px-8 py-4 rounded-xl shadow-lg transition-all"
                >
                  {loading ? 'Consultando...' : <><Search size={24} /> Consultar DNI</>}
                </button>
              </div>

              {/* Resultado */}
              <div className="w-full xl:w-1/2 flex flex-col">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white"><User className="text-[#e50914]" size={20}/> Datos encontrados</h3>
                
                {cliente ? (
                  <div className="bg-[#121826] border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center animate-in zoom-in-95">
                    <div className="w-24 h-24 bg-[#e50914] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                      <User size={48} className="text-white" />
                    </div>
                    <div className="w-full grid grid-cols-[100px_1fr] gap-y-4 text-left border border-slate-800 p-6 rounded-2xl bg-[#0b0f19]">
                      <span className="text-slate-500 font-medium">Nombres:</span>
                      <span className="font-bold text-white uppercase">{cliente.nombres}</span>
                      <span className="text-slate-500 font-medium">Apellidos:</span>
                      <span className="font-bold text-white uppercase">{cliente.apellidos}</span>
                      <span className="text-slate-500 font-medium">DNI:</span>
                      <span className="font-bold text-white">{cliente.dni}</span>
                    </div>
                    
                    <button 
                      onClick={handleNext}
                      className="mt-8 flex items-center gap-3 bg-[#e50914] hover:bg-[#b80710] text-white text-xl font-bold px-10 py-4 rounded-xl shadow-lg transition-all"
                    >
                      Siguiente <ArrowRight size={24} />
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#121826]/50 border border-slate-800 border-dashed p-8 rounded-3xl flex flex-col items-center justify-center text-center h-[350px]">
                    <Search size={48} className="text-slate-600 mb-4" />
                    <p className="text-slate-500">Ingresa el número de DNI del cliente<br/>para consultar sus datos.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: PLACA */}
          {step === 2 && (
            <div className="w-full max-w-5xl flex flex-col xl:flex-row gap-12 items-center justify-center animate-in fade-in slide-in-from-right-8 duration-500">
              
              {/* Tarjeta de Ingreso */}
              <div className="w-full xl:w-1/2 bg-[#121826] border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-[#e50914] flex items-center justify-center mb-6 text-[#e50914] bg-[#e50914]/5">
                  <Car size={32} />
                </div>
                <h2 className="text-3xl font-bold mb-2 text-white">Ingresa la placa</h2>
                <p className="text-slate-400 mb-8 text-center">Te mostraremos los repuestos para tu auto</p>
                
                <div className="w-full relative mb-8">
                  <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    readOnly
                    value={placa}
                    placeholder="ABC-123"
                    className="w-full bg-[#0b0f19] border-2 border-slate-700 text-white text-3xl font-mono tracking-widest py-4 pl-14 pr-4 rounded-xl text-center focus:outline-none uppercase"
                  />
                </div>
                
                <TecladoAlfanumerico onKeyPress={onKeyPressPlaca} onBackspace={onBackspacePlaca} onConfirm={onConfirmPlaca} />

                <div className="flex gap-4 mt-6 w-full max-w-xl">
                  <button onClick={handleBack} className="flex items-center justify-center gap-2 bg-[#1c2230] hover:bg-[#2a3447] text-white px-6 py-4 rounded-xl font-bold transition-all flex-1 shadow-md">
                    <ArrowLeft size={24}/> Volver
                  </button>
                  <button 
                    onClick={consultarVehiculo}
                    disabled={placa.length < 6 || loading}
                    className="flex items-center justify-center gap-2 bg-[#e50914] hover:bg-[#b80710] disabled:opacity-50 text-white px-6 py-4 rounded-xl font-bold shadow-lg transition-all flex-1"
                  >
                    {loading ? 'Buscando...' : <><Search size={24}/> Buscar</>}
                  </button>
                </div>
              </div>

              {/* Resultado Vehículo */}
              <div className="w-full xl:w-1/2 flex flex-col">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white"><Car className="text-[#e50914]" size={20}/> Datos del vehículo</h3>
                
                {vehiculo ? (
                  <div className="bg-[#121826] border border-slate-800 p-8 rounded-3xl shadow-xl flex flex-col items-center text-center animate-in zoom-in-95">
                    <div className="w-24 h-24 bg-[#e50914] rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-500/20">
                      <Car size={48} className="text-white" />
                    </div>
                    <div className="w-full grid grid-cols-2 gap-x-4 gap-y-4 text-left border border-slate-800 p-6 rounded-2xl bg-[#0b0f19] text-sm overflow-y-auto max-h-[300px]">
                      <div className="flex flex-col"><span className="text-slate-500 font-medium">Marca:</span><span className="font-bold text-white uppercase truncate">{vehiculo.marca || '-'}</span></div>
                      <div className="flex flex-col"><span className="text-slate-500 font-medium">Modelo:</span><span className="font-bold text-white uppercase truncate">{vehiculo.modelo || '-'}</span></div>
                      <div className="flex flex-col"><span className="text-slate-500 font-medium">Año:</span><span className="font-bold text-white">{vehiculo.anio_fabricacion || vehiculo.anio || vehiculo.año || '-'}</span></div>
                      <div className="flex flex-col"><span className="text-slate-500 font-medium">Color:</span><span className="font-bold text-white uppercase truncate">{vehiculo.color || '-'}</span></div>
                      <div className="flex flex-col"><span className="text-slate-500 font-medium">Clase:</span><span className="font-bold text-white uppercase truncate">{vehiculo.clase || '-'}</span></div>
                      <div className="flex flex-col"><span className="text-slate-500 font-medium">Tipo:</span><span className="font-bold text-white uppercase truncate">{vehiculo.tipo || '-'}</span></div>
                      <div className="flex flex-col"><span className="text-slate-500 font-medium">Uso:</span><span className="font-bold text-white uppercase truncate">{vehiculo.uso || '-'}</span></div>
                      <div className="flex flex-col"><span className="text-slate-500 font-medium">Asientos:</span><span className="font-bold text-white uppercase">{vehiculo.numero_asientos || '-'}</span></div>
                      <div className="flex flex-col col-span-2"><span className="text-slate-500 font-medium">N° Motor:</span><span className="font-bold text-white uppercase truncate">{vehiculo.numero_motor || '-'}</span></div>
                      <div className="flex flex-col col-span-2"><span className="text-slate-500 font-medium">N° Serie:</span><span className="font-bold text-white uppercase truncate">{vehiculo.numero_serie || '-'}</span></div>
                    </div>
                    
                    <button 
                      onClick={handleNext}
                      className="mt-8 flex items-center gap-3 bg-[#e50914] hover:bg-[#b80710] text-white text-xl font-bold px-10 py-4 rounded-xl shadow-lg transition-all"
                    >
                      Buscar Repuestos <ArrowRight size={24} />
                    </button>
                  </div>
                ) : (
                  <div className="bg-[#121826]/50 border border-slate-800 border-dashed p-8 rounded-3xl flex flex-col items-center justify-center text-center h-[350px]">
                    <Search size={48} className="text-slate-600 mb-4" />
                    <p className="text-slate-500">Ingresa la placa del vehículo<br/>para consultar sus datos.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* PASO 3: CATÁLOGO */}
          {step === 3 && (
            <div className="flex flex-col w-full max-w-5xl animate-in fade-in zoom-in-95 duration-500">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white">Catálogo de Repuestos</h2>
                  <p className="text-slate-400 mt-2">
                    Mostrando repuestos para{' '}
                    <span className="text-[#e50914] font-bold bg-[#e50914]/10 px-2 py-1 rounded">
                      {vehiculo ? `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio_fabricacion || ''}`.trim() : placa}
                    </span>
                  </p>
                </div>
                <button onClick={handleNext} className="flex items-center gap-2 bg-[#e50914] hover:bg-[#b80710] text-white font-bold px-6 py-3 rounded-xl">
                  Ver Carrito ({carrito.length}) <ArrowRight size={20} />
                </button>
              </div>

              {loadingRepuestos ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <div className="w-12 h-12 border-4 border-[#e50914] border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400">Buscando repuestos compatibles...</p>
                </div>
              ) : repuestosCompatibles.length === 0 ? (
                <div className="bg-[#121826]/50 border border-slate-800 border-dashed p-12 rounded-3xl flex flex-col items-center justify-center text-center">
                  <Wrench size={56} className="text-slate-600 mb-4" />
                  <p className="text-slate-400 text-lg font-medium">No encontramos repuestos registrados</p>
                  <p className="text-slate-500 text-sm mt-2">
                    para{' '}
                    <span className="text-white font-bold">{vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : placa}</span>
                    {(vehiculo?.anio_fabricacion) && <span className="text-white font-bold"> ({vehiculo.anio_fabricacion})</span>}
                    .<br/>Consulta con nuestro personal.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2" style={{ maxHeight: '50vh' }}>
                  {repuestosCompatibles.map((producto) => (
                    <div key={producto.id} className="bg-[#121826] border border-slate-800 hover:border-[#e50914]/50 p-6 rounded-2xl flex items-center gap-6 transition-all">
                      <div className="w-20 h-20 bg-[#0b0f19] rounded-xl flex items-center justify-center text-3xl">
                        <Wrench size={32} className="text-[#e50914]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{producto.nombre}</h3>
                        <p className="text-slate-500 text-sm mb-2">{producto.codigo}</p>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-2xl font-bold text-[#e50914]">S/ {parseFloat(producto.precio_lista || 0).toFixed(2)}</span>
                          <button
                            onClick={() => {
                              const yaEnCarrito = carrito.find(c => c.id === producto.id);
                              if (yaEnCarrito) return;
                              setCarrito([...carrito, { ...producto, cantidad: 1 }]);
                            }}
                            disabled={carrito.find(c => c.id === producto.id)}
                            className="bg-[#0b0f19] border border-slate-700 hover:bg-[#e50914] hover:border-[#e50914] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition-all text-sm"
                          >
                            {carrito.find(c => c.id === producto.id) ? 'AGREGADO ✓' : 'AGREGAR'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex">
                <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 hover:text-white">
                  <ArrowLeft size={20}/> Volver al vehículo
                </button>
              </div>
            </div>
          )}

          {/* PASO 4: RESUMEN Y TICKET */}
          {step === 4 && (
            <div className="flex flex-col w-full max-w-3xl animate-in fade-in slide-in-from-right-8 duration-500">
               <h2 className="text-3xl font-bold text-white mb-6">Resumen de tu Pedido</h2>
               <div className="bg-[#121826] border border-slate-800 rounded-3xl p-8 shadow-xl">
                 {carrito.length === 0 ? (
                   <div className="text-center py-12 text-slate-400">
                     <p className="text-xl">No has agregado ningún repuesto.</p>
                   </div>
                 ) : (
                   <div className="flex flex-col gap-4">
                     {carrito.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center border-b border-slate-800 pb-4">
                         <div className="flex items-center gap-4">
                           <Wrench size={24} className="text-[#e50914]" />
                           <span className="text-lg font-medium text-white">{item.nombre}</span>
                         </div>
                         <span className="font-bold text-white">S/ {parseFloat(item.precio_lista || 0).toFixed(2)}</span>
                       </div>
                     ))}
                     <div className="flex justify-between items-center pt-4 mt-4">
                       <span className="text-xl text-slate-400">Total a Pagar</span>
                       <span className="text-4xl font-bold text-[#e50914]">
                         S/ {carrito.reduce((acc, item) => acc + parseFloat(item.precio_lista || 0), 0).toFixed(2)}
                       </span>
                     </div>
                   </div>
                 )}
               </div>

               <div className="flex gap-4 mt-8">
                 <button onClick={handleBack} className="flex-1 bg-[#121826] border border-slate-800 hover:bg-[#0b0f19] text-white px-8 py-4 rounded-xl font-bold text-lg">
                   Volver al Catálogo
                 </button>
                 <button 
                  onClick={() => {
                    Swal.fire({ title: 'Generando Ticket...', icon: 'success', background: '#121826', color: '#fff', confirmButtonColor: '#e50914' })
                    .then(() => { setStep(1); setDni(''); setPlaca(''); setCliente(null); setVehiculo(null); setCarrito([]); setRepuestosCompatibles([]); });
                  }}
                  disabled={carrito.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#e50914] hover:bg-[#b80710] disabled:opacity-50 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-500/20"
                 >
                   <CheckCircle /> Generar Ticket
                 </button>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default KioskoPage;
