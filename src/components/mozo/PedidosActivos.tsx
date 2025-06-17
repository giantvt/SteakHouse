import React from 'react';
import { Clock, CheckCircle, AlertTriangle, Eye, CreditCard, Truck, Play, Bell } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function PedidosActivos() {
  const { 
    pedidos, 
    actualizarPedido, 
    validarPago, 
    currentUser, 
    platos, 
    mesas, 
    obtenerNotificacionesPorRol, 
    marcarNotificacionLeida 
  } = useApp();

  // Filtrar pedidos activos del mozo
  const pedidosActivos = pedidos.filter(p => 
    p.mozoId === currentUser?.id && 
    ['nuevo', 'pago_pendiente', 'pago_validado', 'confirmado', 'preparando', 'listo', 'mozo_en_camino'].includes(p.estado)
  );

  // Obtener notificaciones del mozo no leídas
  const notificacionesMozo = obtenerNotificacionesPorRol('mozo').filter(n => !n.leida);

  const entregarPedido = (pedidoId: string) => {
    actualizarPedido(pedidoId, { estado: 'mozo_en_camino' });
    
    // Simular tiempo de entrega
    setTimeout(() => {
      actualizarPedido(pedidoId, { estado: 'entregado' });
      
      // Marcar notificaciones relacionadas como leídas
      notificacionesMozo
        .filter(n => n.pedidoId === pedidoId)
        .forEach(n => marcarNotificacionLeida(n.id));
    }, 5000); // 5 segundos para simular el tiempo de entrega
  };

  const confirmarPedido = (pedidoId: string) => {
    actualizarPedido(pedidoId, { estado: 'confirmado' });
    
    // Marcar notificaciones relacionadas como leídas
    notificacionesMozo
      .filter(n => n.pedidoId === pedidoId && n.tipo === 'nuevo_pedido')
      .forEach(n => marcarNotificacionLeida(n.id));
  };

  const validarPagoEfectivo = (pedidoId: string) => {
    validarPago(pedidoId);
    
    // Marcar notificaciones relacionadas como leídas
    notificacionesMozo
      .filter(n => n.pedidoId === pedidoId && n.tipo === 'pago_pendiente')
      .forEach(n => marcarNotificacionLeida(n.id));
  };

  const getEstadoInfo = (estado: string, pagoValidado?: boolean) => {
    if (!pagoValidado && estado === 'nuevo') {
      return { color: 'red', label: 'Pago Pendiente', icon: CreditCard, descripcion: 'Validar pago en efectivo' };
    }
    
    switch (estado) {
      case 'nuevo':
        return { color: 'blue', label: 'Nuevo', icon: AlertTriangle, descripcion: 'Confirmar pedido' };
      case 'pago_validado':
        return { color: 'green', label: 'Pago Confirmado', icon: CheckCircle, descripcion: 'Listo para confirmar' };
      case 'confirmado':
        return { color: 'orange', label: 'En Cocina', icon: Clock, descripcion: 'Siendo preparado' };
      case 'preparando':
        return { color: 'yellow', label: 'Preparando', icon: Clock, descripcion: 'En proceso de cocción' };
      case 'listo':
        return { color: 'jungle', label: 'Listo para Entregar', icon: CheckCircle, descripcion: 'Recoger de cocina' };
      case 'mozo_en_camino':
        return { color: 'blue', label: 'En Camino', icon: Truck, descripcion: 'Entregando al cliente' };
      default:
        return { color: 'gray', label: estado, icon: Clock, descripcion: 'Estado desconocido' };
    }
  };

  const getMesa = (mesaId: number) => {
    return mesas.find(m => m.id === mesaId);
  };

  const getPlato = (platoId: string) => {
    return platos.find(p => p.id === platoId);
  };

  const getPedidosConPagoPendiente = () => {
    return pedidosActivos.filter(p => !p.pagoValidado && p.metodoPago === 'efectivo');
  };

  const getPedidosListos = () => {
    return pedidosActivos.filter(p => p.estado === 'listo');
  };

  const getTiempoTranscurrido = (fecha: Date) => {
    return Math.floor((new Date().getTime() - fecha.getTime()) / 1000 / 60);
  };

  if (pedidosActivos.length === 0) {
    return (
      <div className="space-y-6">
        {/* Notificaciones pendientes */}
        {notificacionesMozo.length > 0 && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4">🔔 Notificaciones Pendientes</h3>
            <div className="space-y-3">
              {notificacionesMozo.slice(0, 3).map((notif) => (
                <div key={notif.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-blue-800">{notif.mensaje}</p>
                    <p className="text-sm text-blue-600">{notif.timestamp.toLocaleTimeString()}</p>
                  </div>
                  <button
                    onClick={() => marcarNotificacionLeida(notif.id)}
                    className="text-blue-700 hover:text-blue-800 text-sm font-medium"
                  >
                    Marcar leída
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center py-12">
          <CheckCircle size={64} className="mx-auto text-jungle-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No tienes pedidos activos</h3>
          <p className="text-gray-600">Los nuevos pedidos aparecerán aquí cuando los clientes los realicen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📱 Pedidos Activos</h2>
          <p className="text-gray-600">Gestiona tus pedidos asignados en tiempo real</p>
        </div>
        
        {/* Alertas de notificaciones */}
        {notificacionesMozo.length > 0 && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-3 animate-pulse">
            <div className="flex items-center gap-2">
              <Bell size={20} className="text-red-600" />
              <p className="text-red-800 font-medium">
                {notificacionesMozo.length} notificación{notificacionesMozo.length > 1 ? 'es' : ''} nueva{notificacionesMozo.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alertas críticas */}
      {getPedidosConPagoPendiente().length > 0 && (
        <div className="card bg-red-50 border-red-200">
          <h3 className="text-lg font-bold text-red-800 mb-4 flex items-center gap-2">
            <CreditCard size={20} />
            🚨 PAGOS PENDIENTES DE VALIDACIÓN
          </h3>
          <div className="space-y-3">
            {getPedidosConPagoPendiente().map((pedido) => (
              <div key={pedido.id} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-red-300 shadow-lg">
                <div>
                  <p className="font-bold text-gray-800 text-lg">Mesa {pedido.mesaId}</p>
                  <p className="text-sm text-gray-600">
                    Total: <span className="font-bold text-red-600 text-lg">S/ {pedido.total.toFixed(2)}</span> • Pago en efectivo
                  </p>
                  <p className="text-xs text-gray-500">
                    Hace {getTiempoTranscurrido(pedido.fechaCreacion)} minutos
                  </p>
                </div>
                <button
                  onClick={() => validarPagoEfectivo(pedido.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  VALIDAR PAGO
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pedidos listos para entregar */}
      {getPedidosListos().length > 0 && (
        <div className="card bg-jungle-50 border-jungle-200">
          <h3 className="text-lg font-bold text-jungle-800 mb-4 flex items-center gap-2">
            <CheckCircle size={20} />
            🍽️ PEDIDOS LISTOS PARA ENTREGAR
          </h3>
          <div className="space-y-3">
            {getPedidosListos().map((pedido) => (
              <div key={pedido.id} className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-jungle-300 shadow-lg">
                <div>
                  <p className="font-bold text-gray-800 text-lg">Mesa {pedido.mesaId}</p>
                  <p className="text-sm text-gray-600">
                    {pedido.items.length} platos • S/ {pedido.total.toFixed(2)}
                  </p>
                  <p className="text-xs text-jungle-600 font-medium">
                    ¡Todos los platos están listos!
                  </p>
                </div>
                <button
                  onClick={() => entregarPedido(pedido.id)}
                  className="bg-jungle-600 hover:bg-jungle-700 text-white px-6 py-3 rounded-lg font-bold transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 animate-pulse"
                >
                  IR A ENTREGAR
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de pedidos activos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pedidosActivos.map((pedido) => {
          const estadoInfo = getEstadoInfo(pedido.estado, pedido.pagoValidado);
          const Icon = estadoInfo.icon;
          const mesa = getMesa(pedido.mesaId);
          const itemsListos = pedido.items?.filter(item => item.estadoCocina === 'listo').length || 0;
          const totalItems = pedido.items?.length || 0;
          const tiempoTranscurrido = getTiempoTranscurrido(pedido.fechaCreacion);

          return (
            <div key={pedido.id} className={`card hover:shadow-xl transition-all duration-300 ${
              !pedido.pagoValidado ? 'border-red-300 bg-red-50' : 
              pedido.estado === 'listo' ? 'border-jungle-300 bg-jungle-50' :
              ''
            }`}>
              {/* Header del pedido */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-earth-500 rounded-full flex items-center justify-center text-white font-bold">
                    {pedido.mesaId}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Mesa {pedido.mesaId}</h3>
                    <p className="text-sm text-gray-600">
                      {pedido.fechaCreacion.toLocaleTimeString()} • {pedido.items.length} items
                    </p>
                    {pedido.estado === 'preparando' && (
                      <p className="text-xs text-yellow-600 font-medium">
                        {itemsListos}/{totalItems} platos listos
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`status-badge bg-${estadoInfo.color}-100 text-${estadoInfo.color}-700 mb-2 block`}>
                    <Icon size={14} className="mr-1" />
                    {estadoInfo.label}
                  </span>
                  <p className="text-lg font-bold text-jungle-600">
                    S/ {pedido.total.toFixed(2)}
                  </p>
                  {pedido.metodoPago && (
                    <p className="text-xs text-gray-500 capitalize">
                      {pedido.metodoPago}
                      {!pedido.pagoValidado && pedido.metodoPago === 'efectivo' && (
                        <span className="text-red-600 font-bold"> - Sin validar</span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Información de estado */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-1">Estado actual:</p>
                <p className="text-sm text-gray-600">{estadoInfo.descripcion}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock size={14} className="text-gray-500" />
                  <span className="text-sm text-gray-500">
                    Hace {tiempoTranscurrido} minutos
                  </span>
                  {tiempoTranscurrido > 30 && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      Tiempo elevado
                    </span>
                  )}
                </div>
              </div>

              {/* Items del pedido */}
              <div className="space-y-3 mb-4">
                {pedido.items.map((item, index) => {
                  const plato = getPlato(item.platoId);
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={plato?.imagen}
                        alt={plato?.nombre}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-800">{plato?.nombre}</p>
                          {item.estadoCocina && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              item.estadoCocina === 'listo' ? 'bg-jungle-100 text-jungle-700' :
                              item.estadoCocina === 'preparando' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.estadoCocina === 'listo' ? '✓ Listo' :
                               item.estadoCocina === 'preparando' ? '🔥 Preparando' :
                               '⏳ Pendiente'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.cantidad} • S/ {item.precio.toFixed(2)}
                        </p>
                        {item.observaciones && (
                          <p className="text-xs text-orange-600 italic">
                            Obs: {item.observaciones}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Observaciones generales */}
              {pedido.observaciones && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                  <p className="text-sm text-orange-800">
                    <strong>Observaciones:</strong> {pedido.observaciones}
                  </p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2">
                {!pedido.pagoValidado && pedido.metodoPago === 'efectivo' && (
                  <button
                    onClick={() => validarPagoEfectivo(pedido.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <CreditCard size={16} />
                    VALIDAR PAGO
                  </button>
                )}
                
                {(pedido.estado === 'nuevo' || pedido.estado === 'pago_validado') && pedido.pagoValidado && (
                  <button
                    onClick={() => confirmarPedido(pedido.id)}
                    className="flex-1 bg-jungle-600 hover:bg-jungle-700 text-white py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Play size={16} />
                    CONFIRMAR PEDIDO
                  </button>
                )}
                
                {pedido.estado === 'listo' && (
                  <button
                    onClick={() => entregarPedido(pedido.id)}
                    className="flex-1 bg-gold-600 hover:bg-gold-700 text-white py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 animate-pulse"
                  >
                    <Truck size={16} />
                    IR A ENTREGAR
                  </button>
                )}
                
                {['confirmado', 'preparando'].includes(pedido.estado) && (
                  <button className="flex-1 bg-gray-100 text-gray-600 py-3 px-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                    <Clock size={16} />
                    EN COCINA...
                  </button>
                )}

                {pedido.estado === 'mozo_en_camino' && (
                  <button className="flex-1 bg-blue-100 text-blue-600 py-3 px-4 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                    <Truck size={16} />
                    EN CAMINO...
                  </button>
                )}

                <button className="px-4 py-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                  <Eye size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen de estados mejorado */}
      <div className="card bg-earth-gradient text-white">
        <h3 className="text-lg font-bold mb-4">📊 Resumen de Estados en Tiempo Real</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {[
            { estado: 'pago_pendiente', label: 'Pago Pendiente', filtro: (p: any) => !p.pagoValidado, color: 'text-red-200' },
            { estado: 'nuevo', label: 'Nuevos', filtro: (p: any) => p.estado === 'nuevo' && p.pagoValidado, color: 'text-blue-200' },
            { estado: 'confirmado', label: 'Confirmados', filtro: (p: any) => p.estado === 'confirmado', color: 'text-orange-200' },
            { estado: 'preparando', label: 'En Cocina', filtro: (p: any) => p.estado === 'preparando', color: 'text-yellow-200' },
            { estado: 'listo', label: 'Listos', filtro: (p: any) => p.estado === 'listo', color: 'text-jungle-200' },
            { estado: 'en_camino', label: 'En Camino', filtro: (p: any) => p.estado === 'mozo_en_camino', color: 'text-blue-200' }
          ].map((item) => {
            const count = pedidosActivos.filter(item.filtro).length;
            return (
              <div key={item.estado} className="text-center">
                <p className="text-3xl font-bold">{count}</p>
                <p className={`text-sm ${item.color}`}>{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}