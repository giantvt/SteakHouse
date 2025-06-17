import React from 'react';
import { Clock, ChefHat, CheckCircle, AlertTriangle, Eye, Play, Check, Timer } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function PedidosCocina() {
  const { 
    pedidos, 
    actualizarPedido, 
    marcarItemPreparando, 
    marcarItemListo, 
    platos, 
    obtenerNotificacionesPorRol,
    marcarNotificacionLeida 
  } = useApp();

  // Filtrar pedidos para cocina (confirmados y pagados)
  const pedidosCocina = pedidos.filter(p => 
    ['pago_validado', 'confirmado', 'preparando'].includes(p.estado) && p.pagoValidado
  ).sort((a, b) => a.fechaCreacion.getTime() - b.fechaCreacion.getTime());

  // Obtener notificaciones de cocina no leídas
  const notificacionesCocina = obtenerNotificacionesPorRol('cocina').filter(n => !n.leida);

  const iniciarPreparacionItem = (pedidoId: string, itemIndex: number) => {
    marcarItemPreparando(pedidoId, itemIndex);
    
    // Si es el primer item que se empieza a preparar, cambiar estado del pedido
    const pedido = pedidos.find(p => p.id === pedidoId);
    if (pedido && pedido.estado === 'confirmado') {
      actualizarPedido(pedidoId, { estado: 'preparando' });
    }
  };

  const completarItemPreparacion = (pedidoId: string, itemIndex: number) => {
    marcarItemListo(pedidoId, itemIndex);
  };

  const getPlato = (platoId: string) => {
    return platos.find(p => p.id === platoId);
  };

  const getTiempoTranscurrido = (fecha: Date) => {
    return Math.floor((new Date().getTime() - fecha.getTime()) / 1000 / 60);
  };

  const getTiempoEstimado = (items: any[]) => {
    return items.reduce((max, item) => {
      const plato = getPlato(item.platoId);
      return Math.max(max, (plato?.tiempoPreparacion || 15) * item.cantidad);
    }, 0);
  };

  const esUrgente = (pedido: any) => {
    const tiempoTranscurrido = getTiempoTranscurrido(pedido.fechaCreacion);
    const tiempoEstimado = getTiempoEstimado(pedido.items);
    return tiempoTranscurrido > tiempoEstimado + 5;
  };

  const getEstadoItemColor = (estadoCocina: string) => {
    switch (estadoCocina) {
      case 'pendiente': return 'bg-gray-100 border-gray-300 text-gray-700';
      case 'preparando': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'listo': return 'bg-jungle-100 border-jungle-400 text-jungle-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };

  const getTiempoPreparacionItem = (item: any) => {
    if (!item.tiempoIniciado) return null;
    const tiempoTranscurrido = Math.floor((new Date().getTime() - item.tiempoIniciado.getTime()) / 1000 / 60);
    return tiempoTranscurrido;
  };

  if (pedidosCocina.length === 0) {
    return (
      <div className="space-y-6">
        {/* Notificaciones pendientes */}
        {notificacionesCocina.length > 0 && (
          <div className="card bg-blue-50 border-blue-200">
            <h3 className="text-lg font-bold text-blue-800 mb-4">🔔 Notificaciones Pendientes</h3>
            <div className="space-y-3">
              {notificacionesCocina.slice(0, 3).map((notif) => (
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
          <ChefHat size={64} className="mx-auto text-jungle-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No hay pedidos en cocina</h3>
          <p className="text-gray-600">Los nuevos pedidos aparecerán aquí cuando sean confirmados y pagados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">🍽️ Pedidos en Cocina</h2>
          <p className="text-gray-600">Gestiona la preparación en tiempo real - Ordenados por llegada</p>
        </div>
        
        {/* Indicador de notificaciones */}
        {notificacionesCocina.length > 0 && (
          <div className="bg-red-100 border border-red-300 rounded-lg p-3">
            <p className="text-red-800 font-medium">
              🔔 {notificacionesCocina.length} notificación{notificacionesCocina.length > 1 ? 'es' : ''} nueva{notificacionesCocina.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Notificaciones recientes */}
      {notificacionesCocina.length > 0 && (
        <div className="card bg-orange-50 border-orange-200">
          <h3 className="text-lg font-bold text-orange-800 mb-4">🚨 Alertas de Cocina</h3>
          <div className="space-y-2">
            {notificacionesCocina.slice(0, 2).map((notif) => (
              <div key={notif.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-medium text-orange-800">{notif.mensaje}</p>
                  <p className="text-sm text-orange-600">{notif.timestamp.toLocaleTimeString()}</p>
                </div>
                <button
                  onClick={() => marcarNotificacionLeida(notif.id)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
                >
                  OK
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cola de pedidos mejorada */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pedidosCocina.map((pedido) => {
          const tiempoTranscurrido = getTiempoTranscurrido(pedido.fechaCreacion);
          const tiempoEstimado = getTiempoEstimado(pedido.items);
          const urgente = esUrgente(pedido);
          const itemsListos = pedido.items.filter(item => item.estadoCocina === 'listo').length;
          const totalItems = pedido.items.length;
          const itemsPreparando = pedido.items.filter(item => item.estadoCocina === 'preparando').length;

          return (
            <div 
              key={pedido.id} 
              className={`card transition-all duration-300 ${
                urgente ? 'border-2 border-red-500 shadow-lg animate-pulse bg-red-50' : 
                pedido.estado === 'preparando' ? 'bg-yellow-50 border-yellow-300' : 
                'hover:shadow-xl'
              }`}
            >
              {/* Header del pedido mejorado */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                    urgente ? 'bg-red-500 animate-pulse' : 
                    pedido.estado === 'preparando' ? 'bg-yellow-500' : 'bg-gold-500'
                  }`}>
                    {pedido.mesaId}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Mesa {pedido.mesaId}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{pedido.fechaCreacion.toLocaleTimeString()}</span>
                      <span>•</span>
                      <span>{itemsListos}/{totalItems} listos</span>
                      {itemsPreparando > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-600 font-medium">{itemsPreparando} preparando</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {urgente && (
                    <div className="flex items-center gap-1 text-red-600 mb-1">
                      <AlertTriangle size={16} />
                      <span className="text-xs font-bold">¡URGENTE!</span>
                    </div>
                  )}
                  <div className="w-20 h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        itemsListos === totalItems ? 'bg-jungle-500' : 'bg-yellow-500'
                      }`}
                      style={{ width: `${(itemsListos / totalItems) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((itemsListos / totalItems) * 100)}% completo
                  </p>
                </div>
              </div>

              {/* Tiempo y prioridad */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className={urgente ? 'text-red-600' : 'text-gray-600'} />
                    <span className={`text-sm font-medium ${urgente ? 'text-red-600' : 'text-gray-600'}`}>
                      {tiempoTranscurrido} min transcurridos
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer size={16} className="text-blue-600" />
                    <span className="text-sm text-blue-600 font-medium">
                      Meta: {tiempoEstimado} min
                    </span>
                  </div>
                </div>
                {urgente && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                    PRIORIDAD ALTA
                  </span>
                )}
              </div>

              {/* Items del pedido con estado individual mejorado */}
              <div className="space-y-3 mb-4">
                {pedido.items.map((item, index) => {
                  const plato = getPlato(item.platoId);
                  const estadoColor = getEstadoItemColor(item.estadoCocina || 'pendiente');
                  const tiempoPreparacion = getTiempoPreparacionItem(item);
                  
                  return (
                    <div key={index} className={`border-2 rounded-lg p-4 transition-all duration-300 ${estadoColor}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={plato?.imagen}
                          alt={plato?.nombre}
                          className="w-20 h-20 object-cover rounded-lg shadow-md"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-gray-800">{plato?.nombre}</h4>
                            <div className="flex items-center gap-2">
                              {item.estadoCocina === 'preparando' && tiempoPreparacion !== null && (
                                <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                                  {tiempoPreparacion} min
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                item.estadoCocina === 'listo' ? 'bg-jungle-500 text-white' :
                                item.estadoCocina === 'preparando' ? 'bg-yellow-500 text-white animate-pulse' :
                                'bg-gray-400 text-white'
                              }`}>
                                {item.estadoCocina === 'listo' ? '✓ LISTO' :
                                 item.estadoCocina === 'preparando' ? '🔥 PREPARANDO' :
                                 '⏳ PENDIENTE'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                            <div>
                              <span className="text-gray-600">Cantidad:</span>
                              <span className="font-bold ml-1">{item.cantidad}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Tiempo estimado:</span>
                              <span className="font-bold ml-1">{(plato?.tiempoPreparacion || 15) * item.cantidad} min</span>
                            </div>
                          </div>
                          
                          {item.observaciones && (
                            <div className="bg-orange-100 border border-orange-300 rounded p-2 mb-2">
                              <p className="text-xs text-orange-800 font-medium">
                                <strong>⚠️ OBSERVACIONES:</strong> {item.observaciones}
                              </p>
                            </div>
                          )}
                          
                          {/* Ingredientes principales */}
                          <div className="flex flex-wrap gap-1">
                            {plato?.ingredientes.slice(0, 4).map((ingrediente, i) => (
                              <span key={i} className="text-xs bg-white bg-opacity-70 text-gray-700 px-2 py-1 rounded border">
                                {ingrediente}
                              </span>
                            ))}
                            {plato && plato.ingredientes.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{plato.ingredientes.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Acciones por item mejoradas */}
                      <div className="flex gap-2">
                        {item.estadoCocina === 'pendiente' && (
                          <button
                            onClick={() => iniciarPreparacionItem(pedido.id, index)}
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            <Play size={16} />
                            INICIAR PREPARACIÓN
                          </button>
                        )}
                        
                        {item.estadoCocina === 'preparando' && (
                          <button
                            onClick={() => completarItemPreparacion(pedido.id, index)}
                            className="flex-1 bg-jungle-500 hover:bg-jungle-600 text-white py-3 px-4 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            <Check size={16} />
                            MARCAR LISTO
                          </button>
                        )}
                        
                        {item.estadoCocina === 'listo' && (
                          <div className="flex-1 bg-jungle-100 text-jungle-700 py-3 px-4 rounded-lg font-bold text-center border-2 border-jungle-300">
                            ✅ PLATO COMPLETADO
                          </div>
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
                    <strong>📝 OBSERVACIONES DEL PEDIDO:</strong> {pedido.observaciones}
                  </p>
                </div>
              )}

              {/* Estado general del pedido mejorado */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-700">
                    PROGRESO DEL PEDIDO:
                  </span>
                  <span className="text-sm font-bold text-jungle-600">
                    {itemsListos}/{totalItems} platos completados
                  </span>
                </div>
                
                {itemsListos === totalItems ? (
                  <div className="mt-3 p-3 bg-jungle-100 border-2 border-jungle-300 rounded-lg text-center">
                    <p className="text-jungle-800 font-bold text-lg">
                      🎉 ¡PEDIDO COMPLETO! 
                    </p>
                    <p className="text-jungle-700 text-sm">
                      El mozo será notificado automáticamente para recoger el pedido
                    </p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-yellow-500 to-jungle-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(itemsListos / totalItems) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 text-center">
                      {totalItems - itemsListos} plato{totalItems - itemsListos > 1 ? 's' : ''} pendiente{totalItems - itemsListos > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen de cocina mejorado */}
      <div className="card bg-gradient-to-r from-gold-500 to-orange-500 text-white">
        <h3 className="text-lg font-bold mb-4">📊 Resumen de Cocina en Tiempo Real</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">
              {pedidosCocina.filter(p => p.estado === 'confirmado').length}
            </p>
            <p className="text-gold-100">En Cola</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {pedidosCocina.filter(p => p.estado === 'preparando').length}
            </p>
            <p className="text-gold-100">Preparando</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {pedidosCocina.filter(p => esUrgente(p)).length}
            </p>
            <p className="text-gold-100">Urgentes</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {pedidosCocina.reduce((sum, p) => sum + p.items.filter(i => i.estadoCocina === 'listo').length, 0)}
            </p>
            <p className="text-gold-100">Platos Listos</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">
              {Math.round(pedidosCocina.reduce((sum, p) => {
                const itemsListos = p.items.filter(i => i.estadoCocina === 'listo').length;
                return sum + (itemsListos / p.items.length);
              }, 0) / Math.max(pedidosCocina.length, 1) * 100)}%
            </p>
            <p className="text-gold-100">Eficiencia</p>
          </div>
        </div>
      </div>
    </div>
  );
}