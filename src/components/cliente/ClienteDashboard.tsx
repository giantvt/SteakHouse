import React, { useState, useEffect } from 'react';
import { QrCode, ShoppingCart, Clock, CheckCircle, Star, LogOut, Wifi } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import CartaDigital from './CartaDigital';
import CarritoCliente from './CarritoCliente';
import EstadoPedido from './EstadoPedido';
import HistorialCliente from './HistorialCliente';

export default function ClienteDashboard() {
  const [vistaActual, setVistaActual] = useState('carta');
  const [carrito, setCarrito] = useState<any[]>([]);
  const { 
    mesaActual, 
    setMesaActual, 
    currentUser, 
    pedidos, 
    setCurrentUser, 
    obtenerMesaPorQR,
    obtenerNotificacionesPorRol,
    marcarNotificacionLeida
  } = useApp();

  const handleLogout = () => {
    if (confirm('¿Estás seguro que deseas salir?')) {
      setCurrentUser(null);
      setMesaActual(null);
    }
  };

  // Simular escaneo de QR y asignación automática de mesa
  useEffect(() => {
    if (!mesaActual) {
      // Simular escaneo de QR - en producción vendría de la URL o parámetro
      const qrCodeSimulado = `QR_MESA_00${Math.floor(Math.random() * 6) + 1}`;
      const mesa = obtenerMesaPorQR(qrCodeSimulado);
      
      if (mesa) {
        setMesaActual(mesa.numero);
        console.log(`🔍 QR Escaneado: ${qrCodeSimulado} - Mesa ${mesa.numero} asignada`);
      }
    }
  }, [mesaActual, setMesaActual, obtenerMesaPorQR]);

  // Obtener notificaciones del cliente
  const notificacionesCliente = obtenerNotificacionesPorRol('cliente').filter(n => !n.leida);

  // Obtener pedido activo del cliente
  const pedidoActivo = pedidos.find(p => 
    p.clienteId === currentUser?.id && 
    ['nuevo', 'pago_pendiente', 'pago_validado', 'confirmado', 'preparando', 'listo', 'mozo_en_camino'].includes(p.estado)
  );

  const menuItems = [
    { id: 'carta', label: 'Carta Digital', icon: QrCode },
    { id: 'carrito', label: `Carrito (${carrito.length})`, icon: ShoppingCart },
    { id: 'estado', label: 'Mi Pedido', icon: Clock, badge: pedidoActivo ? '!' : null },
    { id: 'historial', label: 'Historial', icon: CheckCircle }
  ];

  const agregarAlCarrito = (plato: any, cantidad: number, observaciones?: string) => {
    const itemExistente = carrito.find(item => item.platoId === plato.id);
    
    if (itemExistente) {
      setCarrito(prev => prev.map(item => 
        item.platoId === plato.id 
          ? { ...item, cantidad: item.cantidad + cantidad, observaciones }
          : item
      ));
    } else {
      setCarrito(prev => [...prev, {
        platoId: plato.id,
        nombre: plato.nombre,
        precio: plato.precio,
        cantidad,
        observaciones,
        imagen: plato.imagen
      }]);
    }
  };

  const actualizarCarrito = (platoId: string, cantidad: number) => {
    if (cantidad === 0) {
      setCarrito(prev => prev.filter(item => item.platoId !== platoId));
    } else {
      setCarrito(prev => prev.map(item => 
        item.platoId === platoId ? { ...item, cantidad } : item
      ));
    }
  };

  const limpiarCarrito = () => {
    setCarrito([]);
  };

  const renderContent = () => {
    switch (vistaActual) {
      case 'carta':
        return <CartaDigital onAgregarAlCarrito={agregarAlCarrito} />;
      case 'carrito':
        return (
          <CarritoCliente 
            carrito={carrito}
            onActualizarCarrito={actualizarCarrito}
            onLimpiarCarrito={limpiarCarrito}
            mesaId={mesaActual!}
          />
        );
      case 'estado':
        return <EstadoPedido pedido={pedidoActivo} />;
      case 'historial':
        return <HistorialCliente />;
      default:
        return <CartaDigital onAgregarAlCarrito={agregarAlCarrito} />;
    }
  };

  // Función para obtener el estado de conexión
  const getEstadoConexion = () => {
    return pedidoActivo ? 'Conectado en tiempo real' : 'Conectado';
  };

  return (
    <div className="min-h-screen bg-jungle-50">
      {/* Header mejorado */}
      <div className="bg-jungle-gradient text-white">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">🥩 SteackHouse</h1>
              <p className="text-jungle-100">Experiencia selvática en tiempo real</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <QrCode size={20} />
                  <span className="font-bold">Mesa {mesaActual}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-jungle-200">
                  <Wifi size={14} />
                  <span>{getEstadoConexion()}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                title="Salir"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation mejorada */}
      <div className="bg-white shadow-sm border-b border-jungle-100">
        <div className="px-6 py-4">
          <div className="flex gap-1 overflow-x-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setVistaActual(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap relative ${
                    vistaActual === item.id
                      ? 'bg-jungle-600 text-white'
                      : 'text-gray-600 hover:bg-jungle-50 hover:text-jungle-600'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Barra de estado del pedido mejorada */}
      {pedidoActivo && (
        <div className={`border-b px-6 py-3 ${
          pedidoActivo.estado === 'pago_pendiente' ? 'bg-red-100 border-red-200' :
          pedidoActivo.estado === 'mozo_en_camino' ? 'bg-blue-100 border-blue-200 animate-pulse' :
          pedidoActivo.estado === 'listo' ? 'bg-jungle-100 border-jungle-200' :
          'bg-gold-100 border-gold-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                pedidoActivo.estado === 'pago_pendiente' ? 'bg-red-500' :
                pedidoActivo.estado === 'mozo_en_camino' ? 'bg-blue-500 animate-pulse' :
                pedidoActivo.estado === 'listo' ? 'bg-jungle-500' :
                'bg-gold-500'
              }`}></div>
              <span className={`font-medium ${
                pedidoActivo.estado === 'pago_pendiente' ? 'text-red-800' :
                pedidoActivo.estado === 'mozo_en_camino' ? 'text-blue-800' :
                pedidoActivo.estado === 'listo' ? 'text-jungle-800' :
                'text-gold-800'
              }`}>
                {pedidoActivo.estado === 'pago_pendiente' ? '💰 Esperando validación de pago' :
                 pedidoActivo.estado === 'pago_validado' ? '✅ Pago confirmado - Enviando a cocina' :
                 pedidoActivo.estado === 'confirmado' ? '👨‍🍳 Pedido confirmado - En cola de cocina' :
                 pedidoActivo.estado === 'preparando' ? '🔥 Tu pedido se está preparando' :
                 pedidoActivo.estado === 'listo' ? '🎉 ¡Tu pedido está listo!' :
                 pedidoActivo.estado === 'mozo_en_camino' ? '🚶‍♂️ ¡Tu mozo está en camino!' :
                 'Procesando pedido...'}
              </span>
            </div>
            <button
              onClick={() => setVistaActual('estado')}
              className={`font-medium text-sm hover:underline ${
                pedidoActivo.estado === 'pago_pendiente' ? 'text-red-700' :
                pedidoActivo.estado === 'mozo_en_camino' ? 'text-blue-700' :
                pedidoActivo.estado === 'listo' ? 'text-jungle-700' :
                'text-gold-700'
              }`}
            >
              Ver detalles →
            </button>
          </div>
        </div>
      )}

      {/* Notificaciones en tiempo real */}
      {notificacionesCliente.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="text-blue-800 font-medium">
                {notificacionesCliente[0].mensaje}
              </p>
              {notificacionesCliente.length > 1 && (
                <p className="text-blue-600 text-sm">
                  +{notificacionesCliente.length - 1} notificación{notificacionesCliente.length > 2 ? 'es' : ''} más
                </p>
              )}
            </div>
            <button
              onClick={() => notificacionesCliente.forEach(n => marcarNotificacionLeida(n.id))}
              className="text-blue-700 hover:text-blue-800 text-sm font-medium"
            >
              Marcar como leída
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {renderContent()}
      </div>

      {/* Floating cart button mejorado */}
      {carrito.length > 0 && vistaActual !== 'carrito' && (
        <button
          onClick={() => setVistaActual('carrito')}
          className="fixed bottom-6 right-6 bg-jungle-600 text-white p-4 rounded-full shadow-lg hover:bg-jungle-700 transition-all z-50 hover:scale-110"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
              {carrito.reduce((sum, item) => sum + item.cantidad, 0)}
            </span>
          </div>
        </button>
      )}

      {/* Indicador de conexión en tiempo real */}
      <div className="fixed bottom-6 left-6 bg-white rounded-full shadow-lg p-3 border border-jungle-200">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-jungle-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600 font-medium">En vivo</span>
        </div>
      </div>
    </div>
  );
}