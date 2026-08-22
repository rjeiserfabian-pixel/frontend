import React, { useState } from 'react';
import { ChevronRight, ArrowLeft, Search, Car, Wrench, CheckCircle } from 'lucide-react';
// Asumiendo que SweetAlert2 está instalado globalmente o se importa
import Swal from 'sweetalert2';

// Pantalla 1: Kiosko de Autoservicio
export const KioskoPage = () => {
  const [step, setStep] = useState(1);
  const [dni, setDni] = useState('');
  const [placa, setPlaca] = useState('');
  const [carrito, setCarrito] = useState([]);

  // Simulaciones de datos (Hasta conectar los endpoints en el siguiente refactor)
  const repuestosMock = [
    { id: 1, nombre: "Filtro de Aire Premium", precio: 45.00, stock: 10, img: "🌬️" },
    { id: 2, nombre: "Pastillas de Freno Bosh", precio: 120.00, stock: 5, img: "🛑" },
    { id: 3, nombre: "Aceite Sintético 5W30", precio: 150.00, stock: 20, img: "🛢️" },
    { id: 4, nombre: "Batería 12V 60AH", precio: 280.00, stock: 3, img: "🔋" },
  ];

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const agregarAlCarrito = (producto) => {
    const existe = carrito.find(item => item.id === producto.id);
    if (existe) {
      setCarrito(carrito.map(item => item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
    // Pequeño feedback visual
    Swal.fire({
      icon: 'success',
      title: 'Agregado',
      text: `${producto.nombre} agregado al carrito`,
      timer: 1000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: '#1e293b',
      color: '#fff'
    });
  };

  const generarTicket = () => {
    Swal.fire({
      title: 'Generando Ticket...',
      html: 'Por favor, acerquese a recepción con el código <b>TK-048</b>',
      icon: 'success',
      background: '#1e293b',
      color: '#fff',
      confirmButtonColor: '#3b82f6',
      confirmButtonText: 'Finalizar'
    }).then(() => {
      // Reiniciar
      setStep(1);
      setDni('');
      setPlaca('');
      setCarrito([]);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Decorativo Futurista */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="w-full p-8 flex justify-between items-center z-10 absolute top-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
            <Wrench size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            TallerApp Kiosk
          </h1>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`h-2 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'bg-slate-800'}`}></div>
          ))}
        </div>
      </header>

      {/* Main Content Area (Glassmorphism) */}
      <main className="w-[90%] max-w-5xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-10 z-10 mt-20 transition-all duration-500">
        
        {/* PASO 1: DNI */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
              <Search size={48} className="text-blue-400" />
            </div>
            <h2 className="text-5xl font-semibold mb-4 text-white">Bienvenido</h2>
            <p className="text-xl text-slate-400 mb-12">Por favor, ingresa tu DNI para comenzar</p>
            
            <input 
              type="text" 
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ej: 75733841"
              className="w-full max-w-md bg-slate-800/50 border-2 border-slate-700 text-white text-4xl p-6 rounded-2xl text-center focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
              autoFocus
            />
            
            <button 
              onClick={handleNext}
              disabled={dni.length < 8}
              className="mt-12 group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-2xl font-medium px-12 py-5 rounded-full shadow-lg shadow-blue-500/30 transition-all"
            >
              Continuar 
              <ChevronRight className="group-hover:translate-x-2 transition-transform" size={32} />
            </button>
          </div>
        )}

        {/* PASO 2: PLACA */}
        {step === 2 && (
          <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-right-8 duration-500">
             <div className="w-24 h-24 bg-purple-500/10 rounded-full flex items-center justify-center mb-6">
              <Car size={48} className="text-purple-400" />
            </div>
            <h2 className="text-5xl font-semibold mb-4 text-white">Tu Vehículo</h2>
            <p className="text-xl text-slate-400 mb-12">Ingresa la placa de tu auto para ver repuestos compatibles</p>
            
            <input 
              type="text" 
              value={placa}
              onChange={(e) => setPlaca(e.target.value.toUpperCase())}
              placeholder="ABC-123"
              className="w-full max-w-md bg-slate-800/50 border-2 border-slate-700 text-white text-5xl font-mono tracking-widest p-6 rounded-2xl text-center focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all uppercase"
            />
            
            <div className="flex gap-6 mt-12">
              <button 
                onClick={handleBack}
                className="flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-white text-2xl font-medium px-10 py-5 rounded-full transition-all"
              >
                <ArrowLeft size={32} /> Volver
              </button>
              <button 
                onClick={handleNext}
                disabled={placa.length < 6}
                className="group flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 disabled:opacity-50 text-white text-2xl font-medium px-10 py-5 rounded-full shadow-lg shadow-purple-500/30 transition-all"
              >
                Buscar Repuestos <ChevronRight className="group-hover:translate-x-2 transition-transform" size={32} />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: CATÁLOGO */}
        {step === 3 && (
          <div className="flex flex-col animate-in fade-in zoom-in-95 duration-500 h-[60vh]">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-4xl font-semibold text-white">Catálogo de Repuestos</h2>
                <p className="text-slate-400 mt-2 text-lg">Mostrando repuestos 100% compatibles con <span className="text-purple-400 font-mono font-bold bg-purple-400/10 px-3 py-1 rounded">{placa}</span></p>
              </div>
              <button 
                onClick={handleNext}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xl font-medium px-8 py-4 rounded-full shadow-lg shadow-blue-500/30 transition-all"
              >
                Ver Carrito ({carrito.reduce((acc, item) => acc + item.cantidad, 0)}) <ChevronRight size={28} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-4 custom-scrollbar">
              {repuestosMock.map((producto) => (
                <div key={producto.id} className="bg-slate-800/60 border border-slate-700 hover:border-blue-500/50 p-6 rounded-3xl flex items-center gap-6 transition-all group">
                  <div className="w-24 h-24 bg-slate-700 rounded-2xl flex items-center justify-center text-4xl shadow-inner">
                    {producto.img}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-medium text-white mb-2">{producto.nombre}</h3>
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-bold text-blue-400">S/ {producto.precio.toFixed(2)}</span>
                      <button 
                        onClick={() => agregarAlCarrito(producto)}
                        className="bg-slate-700 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
             <div className="mt-8 flex">
              <button onClick={handleBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xl">
                <ArrowLeft /> Atrás
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: CARRITO Y TICKET */}
        {step === 4 && (
          <div className="flex flex-col animate-in fade-in slide-in-from-right-8 duration-500 h-[60vh]">
             <h2 className="text-4xl font-semibold text-white mb-8">Resumen de tu Pedido</h2>
             
             {carrito.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                 <p className="text-2xl mb-6">Tu carrito está vacío</p>
                 <button onClick={handleBack} className="bg-slate-800 px-8 py-4 rounded-full text-white text-xl">Volver al catálogo</button>
               </div>
             ) : (
               <>
                <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar bg-slate-900/50 rounded-2xl p-6 border border-slate-800">
                  {carrito.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-4 border-b border-slate-700/50 last:border-0">
                      <div className="flex items-center gap-4">
                         <span className="text-3xl">{item.img}</span>
                         <div>
                           <h4 className="text-2xl text-white font-medium">{item.nombre}</h4>
                           <p className="text-slate-400 text-lg">S/ {item.precio.toFixed(2)} x {item.cantidad}</p>
                         </div>
                      </div>
                      <span className="text-3xl font-bold text-white">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 bg-blue-900/20 border border-blue-500/30 p-8 rounded-3xl flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-xl mb-1">Total a Pagar</p>
                    <p className="text-5xl font-bold text-blue-400">
                      S/ {carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0).toFixed(2)}
                    </p>
                  </div>
                  <button 
                    onClick={generarTicket}
                    className="flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white text-2xl font-bold px-12 py-6 rounded-2xl shadow-lg shadow-emerald-500/30 transition-all transform hover:scale-105"
                  >
                    <CheckCircle size={32} /> GENERAR TICKET
                  </button>
                </div>
                <button onClick={handleBack} className="mt-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xl w-fit">
                  <ArrowLeft /> Editar Pedido
                </button>
               </>
             )}
          </div>
        )}
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5); 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.8); 
        }
      `}} />
    </div>
  );
};

export default KioskoPage;
