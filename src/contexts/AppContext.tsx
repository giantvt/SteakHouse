import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'mozo' | 'cocina' | 'cliente';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  estado: 'libre' | 'ocupada' | 'reservada' | 'limpieza';
  clienteId?: string;
  mozoId?: string;
  pedidoActivo?: string;
  qrCode?: string; // Código QR único para la mesa
}

export interface Plato {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categoria: string;
  imagen: string;
  disponible: boolean;
  ingredientes: string[];
  tiempoPreparacion: number;
}

export interface PedidoItem {
  platoId: string;
  cantidad: number;
  observaciones?: string;
  precio: number;
  estadoCocina?: 'pendiente' | 'preparando' | 'listo';
  tiempoIniciado?: Date;
  tiempoFinalizado?: Date;
}

export interface Pedido {
  id: string;
  mesaId: number;
  clienteId: string;
  mozoId?: string;
  items: PedidoItem[];
  total: number;
  estado: 'nuevo' | 'pago_pendiente' | 'pago_validado' | 'confirmado' | 'preparando' | 'listo' | 'mozo_en_camino' | 'entregado' | 'pagado';
  metodoPago?: 'yape' | 'transferencia' | 'efectivo' | 'tarjeta';
  pagoValidado?: boolean;
  observaciones?: string;
  fechaCreacion: Date;
  fechaActualizacion: Date;
  prioridad?: 'normal' | 'urgente'; // Para pedidos que llevan mucho tiempo
}

export interface Venta {
  id: string;
  pedidoId: string;
  total: number;
  metodoPago: string;
  fecha: Date;
}

export interface Notificacion {
  id: string;
  tipo: 'nuevo_pedido' | 'pedido_listo' | 'pago_pendiente' | 'mozo_en_camino' | 'pedido_entregado' | 'item_listo' | 'pago_validado';
  mensaje: string;
  pedidoId?: string;
  mesaId?: number;
  destinatario: UserRole | 'all';
  timestamp: Date;
  leida: boolean;
  prioridad?: 'normal' | 'alta' | 'critica';
  sonido?: boolean; // Para notificaciones con sonido
}

export interface InventarioItem {
  id: string;
  nombre: string;
  categoria: string;
  stock: number;
  minimo: number;
  unidad: string;
  precio: number;
  proveedor?: string;
}

export interface Empleado {
  id: string;
  nombre: string;
  rol: UserRole;
  email: string;
  telefono?: string;
  fechaIngreso: Date;
  activo: boolean;
  horario?: string;
  enLinea?: boolean; // Para saber si está conectado
}

interface AppContextType {
  // Usuario actual
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // Mesas
  mesas: Mesa[];
  actualizarMesa: (mesaId: number, datos: Partial<Mesa>) => void;
  obtenerMesaPorQR: (qrCode: string) => Mesa | null;
  
  // Platos
  platos: Plato[];
  actualizarPlato: (platoId: string, datos: Partial<Plato>) => void;
  agregarPlato: (plato: Omit<Plato, 'id'>) => void;
  eliminarPlato: (platoId: string) => void;
  
  // Pedidos
  pedidos: Pedido[];
  crearPedido: (pedido: Omit<Pedido, 'id' | 'fechaCreacion' | 'fechaActualizacion'>) => string;
  actualizarPedido: (pedidoId: string, datos: Partial<Pedido>) => void;
  actualizarItemPedido: (pedidoId: string, itemIndex: number, datos: Partial<PedidoItem>) => void;
  validarPago: (pedidoId: string) => void;
  marcarItemPreparando: (pedidoId: string, itemIndex: number) => void;
  marcarItemListo: (pedidoId: string, itemIndex: number) => void;
  
  // Ventas
  ventas: Venta[];
  registrarVenta: (venta: Omit<Venta, 'id'>) => void;
  
  // Inventario
  inventario: InventarioItem[];
  actualizarInventario: (itemId: string, datos: Partial<InventarioItem>) => void;
  agregarInventario: (item: Omit<InventarioItem, 'id'>) => void;
  
  // Empleados
  empleados: Empleado[];
  agregarEmpleado: (empleado: Omit<Empleado, 'id'>) => void;
  actualizarEmpleado: (empleadoId: string, datos: Partial<Empleado>) => void;
  
  // Notificaciones en tiempo real
  notificaciones: Notificacion[];
  agregarNotificacion: (notificacion: Omit<Notificacion, 'id' | 'timestamp' | 'leida'>) => void;
  marcarNotificacionLeida: (notificacionId: string) => void;
  obtenerNotificacionesPorRol: (rol: UserRole) => Notificacion[];
  
  // Mesa actual (para clientes)
  mesaActual: number | null;
  setMesaActual: (mesa: number | null) => void;
  
  // Estado en tiempo real
  estadoTiempoReal: {
    pedidosEnCocina: number;
    pedidosListos: number;
    mesasOcupadas: number;
    tiempoPromedioPreparacion: number;
  };
  
  // Funciones de utilidad
  obtenerEstadisticas: () => any;
  exportarReporte: (tipo: string, filtros: any) => void;
  limpiarNotificaciones: () => void;
  reproducirSonidoNotificacion: (tipo: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Datos mock iniciales expandidos con QR codes
const mesasIniciales: Mesa[] = [
  { id: 1, numero: 1, capacidad: 4, estado: 'libre', qrCode: 'QR_MESA_001' },
  { id: 2, numero: 2, capacidad: 2, estado: 'ocupada', clienteId: 'cliente1', mozoId: 'mozo1', qrCode: 'QR_MESA_002' },
  { id: 3, numero: 3, capacidad: 6, estado: 'libre', qrCode: 'QR_MESA_003' },
  { id: 4, numero: 4, capacidad: 4, estado: 'reservada', qrCode: 'QR_MESA_004' },
  { id: 5, numero: 5, capacidad: 8, estado: 'libre', qrCode: 'QR_MESA_005' },
  { id: 6, numero: 6, capacidad: 2, estado: 'ocupada', clienteId: 'cliente2', mozoId: 'mozo2', qrCode: 'QR_MESA_006' },
];

const platosIniciales: Plato[] = [
  {
    id: '1',
    nombre: 'Lomo Saltado',
    descripcion: 'Clásico peruano con carne de res, papas fritas y arroz',
    precio: 32.90,
    categoria: 'Segundos',
    imagen: 'https://images.pexels.com/photos/8705814/pexels-photo-8705814.jpeg?auto=compress&cs=tinysrgb&w=400',
    disponible: true,
    ingredientes: ['Carne de res', 'Papas', 'Cebolla', 'Tomate', 'Arroz'],
    tiempoPreparacion: 15
  },
  {
    id: '2',
    nombre: 'Ají de Gallina',
    descripcion: 'Pollo deshilachado en crema de ají amarillo',
    precio: 28.90,
    categoria: 'Segundos',
    imagen: 'https://images.pexels.com/photos/9609866/pexels-photo-9609866.jpeg?auto=compress&cs=tinysrgb&w=400',
    disponible: true,
    ingredientes: ['Pollo', 'Ají amarillo', 'Pan', 'Leche', 'Nueces'],
    tiempoPreparacion: 20
  },
  {
    id: '3',
    nombre: 'Anticuchos',
    descripcion: 'Brochetas de corazón de res a la parrilla',
    precio: 18.90,
    categoria: 'Entradas',
    imagen: 'https://images.pexels.com/photos/12737774/pexels-photo-12737774.jpeg?auto=compress&cs=tinysrgb&w=400',
    disponible: true,
    ingredientes: ['Corazón de res', 'Ají panca', 'Comino', 'Vinagre'],
    tiempoPreparacion: 12
  },
  {
    id: '4',
    nombre: 'Ceviche Mixto',
    descripcion: 'Pescado y mariscos frescos en leche de tigre',
    precio: 35.90,
    categoria: 'Entradas',
    imagen: 'https://images.pexels.com/photos/11265842/pexels-photo-11265842.jpeg?auto=compress&cs=tinysrgb&w=400',
    disponible: true,
    ingredientes: ['Pescado', 'Camarones', 'Limón', 'Cebolla', 'Ají'],
    tiempoPreparacion: 10
  },
  {
    id: '5',
    nombre: 'Chicha Morada',
    descripcion: 'Bebida tradicional peruana refrescante',
    precio: 8.90,
    categoria: 'Bebidas',
    imagen: 'https://images.pexels.com/photos/7525104/pexels-photo-7525104.jpeg?auto=compress&cs=tinysrgb&w=400',
    disponible: true,
    ingredientes: ['Maíz morado', 'Piña', 'Canela', 'Clavo'],
    tiempoPreparacion: 5
  },
  {
    id: '6',
    nombre: 'Pisco Sour',
    descripcion: 'Cóctel bandera del Perú',
    precio: 15.90,
    categoria: 'Bebidas',
    imagen: 'https://images.pexels.com/photos/5531265/pexels-photo-5531265.jpeg?auto=compress&cs=tinysrgb&w=400',
    disponible: true,
    ingredientes: ['Pisco', 'Limón', 'Clara de huevo', 'Jarabe'],
    tiempoPreparacion: 3
  }
];

const inventarioInicial: InventarioItem[] = [
  { id: '1', nombre: 'Carne de Res', categoria: 'Proteínas', stock: 25, minimo: 10, unidad: 'kg', precio: 35.00 },
  { id: '2', nombre: 'Pollo', categoria: 'Proteínas', stock: 8, minimo: 15, unidad: 'kg', precio: 12.00 },
  { id: '3', nombre: 'Papas', categoria: 'Verduras', stock: 2, minimo: 20, unidad: 'kg', precio: 3.50 },
  { id: '4', nombre: 'Arroz', categoria: 'Cereales', stock: 50, minimo: 10, unidad: 'kg', precio: 4.20 },
  { id: '5', nombre: 'Ají Amarillo', categoria: 'Condimentos', stock: 12, minimo: 5, unidad: 'kg', precio: 8.00 },
  { id: '6', nombre: 'Limones', categoria: 'Frutas', stock: 0, minimo: 30, unidad: 'kg', precio: 2.50 },
];

const empleadosIniciales: Empleado[] = [
  {
    id: 'mozo1',
    nombre: 'Ana García',
    rol: 'mozo',
    email: 'ana@steakhouse.pe',
    telefono: '987654321',
    fechaIngreso: new Date('2023-01-15'),
    activo: true,
    horario: 'Mañana (8:00-16:00)',
    enLinea: true
  },
  {
    id: 'mozo2',
    nombre: 'Carlos Mendoza',
    rol: 'mozo',
    email: 'carlos@steakhouse.pe',
    telefono: '987654322',
    fechaIngreso: new Date('2023-02-01'),
    activo: true,
    horario: 'Noche (16:00-24:00)',
    enLinea: true
  },
  {
    id: 'cocina1',
    nombre: 'José Ramirez',
    rol: 'cocina',
    email: 'jose@steakhouse.pe',
    telefono: '987654323',
    fechaIngreso: new Date('2022-11-10'),
    activo: true,
    horario: 'Mañana (8:00-16:00)',
    enLinea: true
  },
  {
    id: 'cocina2',
    nombre: 'María López',
    rol: 'cocina',
    email: 'maria@steakhouse.pe',
    telefono: '987654324',
    fechaIngreso: new Date('2023-03-20'),
    activo: true,
    horario: 'Noche (16:00-24:00)',
    enLinea: true
  }
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mesas, setMesas] = useState<Mesa[]>(mesasIniciales);
  const [platos, setPlatos] = useState<Plato[]>(platosIniciales);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [inventario, setInventario] = useState<InventarioItem[]>(inventarioInicial);
  const [empleados, setEmpleados] = useState<Empleado[]>(empleadosIniciales);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [mesaActual, setMesaActual] = useState<number | null>(null);

  // Estado en tiempo real calculado
  const estadoTiempoReal = {
    pedidosEnCocina: pedidos.filter(p => ['confirmado', 'preparando'].includes(p.estado)).length,
    pedidosListos: pedidos.filter(p => p.estado === 'listo').length,
    mesasOcupadas: mesas.filter(m => m.estado === 'ocupada').length,
    tiempoPromedioPreparacion: 18 // Mock - en producción sería calculado
  };

  // Generar datos de ventas mock para demostración
  useEffect(() => {
    if (ventas.length === 0) {
      const ventasMock: Venta[] = [];
      for (let i = 0; i < 7; i++) {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() - i);
        
        const numVentas = Math.floor(Math.random() * 15) + 5;
        for (let j = 0; j < numVentas; j++) {
          ventasMock.push({
            id: `venta-${i}-${j}`,
            pedidoId: `pedido-${i}-${j}`,
            total: Math.floor(Math.random() * 100) + 20,
            metodoPago: ['yape', 'efectivo', 'tarjeta', 'transferencia'][Math.floor(Math.random() * 4)],
            fecha: new Date(fecha.getTime() + Math.random() * 24 * 60 * 60 * 1000)
          });
        }
      }
      setVentas(ventasMock);
    }
  }, [ventas.length]);

  // Función para reproducir sonidos de notificación
  const reproducirSonidoNotificacion = (tipo: string) => {
    // En un entorno real, aquí se reproduciría un sonido
    console.log(`🔊 Sonido de notificación: ${tipo}`);
  };

  const obtenerMesaPorQR = (qrCode: string): Mesa | null => {
    return mesas.find(mesa => mesa.qrCode === qrCode) || null;
  };

  const actualizarMesa = (mesaId: number, datos: Partial<Mesa>) => {
    setMesas(prev => prev.map(mesa => 
      mesa.id === mesaId ? { ...mesa, ...datos } : mesa
    ));
  };

  const actualizarPlato = (platoId: string, datos: Partial<Plato>) => {
    setPlatos(prev => prev.map(plato => 
      plato.id === platoId ? { ...plato, ...datos } : plato
    ));
  };

  const agregarPlato = (platoData: Omit<Plato, 'id'>) => {
    const nuevoPlato: Plato = {
      ...platoData,
      id: `plato-${Date.now()}`
    };
    setPlatos(prev => [...prev, nuevoPlato]);
  };

  const eliminarPlato = (platoId: string) => {
    setPlatos(prev => prev.filter(plato => plato.id !== platoId));
  };

  const actualizarInventario = (itemId: string, datos: Partial<InventarioItem>) => {
    setInventario(prev => prev.map(item => 
      item.id === itemId ? { ...item, ...datos } : item
    ));
  };

  const agregarInventario = (itemData: Omit<InventarioItem, 'id'>) => {
    const nuevoItem: InventarioItem = {
      ...itemData,
      id: `inv-${Date.now()}`
    };
    setInventario(prev => [...prev, nuevoItem]);
  };

  const agregarEmpleado = (empleadoData: Omit<Empleado, 'id'>) => {
    const nuevoEmpleado: Empleado = {
      ...empleadoData,
      id: `emp-${Date.now()}`
    };
    setEmpleados(prev => [...prev, nuevoEmpleado]);
  };

  const actualizarEmpleado = (empleadoId: string, datos: Partial<Empleado>) => {
    setEmpleados(prev => prev.map(emp => 
      emp.id === empleadoId ? { ...emp, ...datos } : emp
    ));
  };

  const crearPedido = (pedidoData: Omit<Pedido, 'id' | 'fechaCreacion' | 'fechaActualizacion'>): string => {
    const mesa = mesas.find(m => m.id === pedidoData.mesaId);
    const mozoAsignado = mesa?.mozoId || empleados.find(e => e.rol === 'mozo' && e.activo && e.enLinea)?.id;

    const nuevoPedido: Pedido = {
      ...pedidoData,
      id: `pedido-${Date.now()}`,
      fechaCreacion: new Date(),
      fechaActualizacion: new Date(),
      mozoId: mozoAsignado,
      items: pedidoData.items.map(item => ({
        ...item,
        estadoCocina: 'pendiente'
      })),
      estado: pedidoData.metodoPago === 'efectivo' ? 'pago_pendiente' : 'pago_validado',
      pagoValidado: pedidoData.metodoPago !== 'efectivo'
    };
    
    setPedidos(prev => [...prev, nuevoPedido]);
    
    // Actualizar estado de la mesa
    actualizarMesa(pedidoData.mesaId, { 
      estado: 'ocupada',
      pedidoActivo: nuevoPedido.id,
      mozoId: mozoAsignado
    });

    // 🔔 NOTIFICACIONES EN TIEMPO REAL
    
    // 1. Notificar a COCINA inmediatamente
    agregarNotificacion({
      tipo: 'nuevo_pedido',
      mensaje: `🍽️ NUEVO PEDIDO - Mesa ${pedidoData.mesaId}`,
      pedidoId: nuevoPedido.id,
      mesaId: pedidoData.mesaId,
      destinatario: 'cocina',
      prioridad: 'alta',
      sonido: true
    });

    // 2. Notificar al MOZO asignado
    if (mozoAsignado) {
      agregarNotificacion({
        tipo: 'nuevo_pedido',
        mensaje: `📱 Pedido recibido Mesa ${pedidoData.mesaId} - Total: S/ ${nuevoPedido.total.toFixed(2)}`,
        pedidoId: nuevoPedido.id,
        mesaId: pedidoData.mesaId,
        destinatario: 'mozo',
        prioridad: 'alta',
        sonido: true
      });
    }

    // 3. Si es pago en efectivo, notificar al mozo para validación
    if (pedidoData.metodoPago === 'efectivo') {
      agregarNotificacion({
        tipo: 'pago_pendiente',
        mensaje: `💰 VALIDAR PAGO - Mesa ${pedidoData.mesaId}: S/ ${nuevoPedido.total.toFixed(2)} (Efectivo)`,
        pedidoId: nuevoPedido.id,
        mesaId: pedidoData.mesaId,
        destinatario: 'mozo',
        prioridad: 'critica',
        sonido: true
      });
    }

    // 4. Notificar al ADMIN (opcional)
    agregarNotificacion({
      tipo: 'nuevo_pedido',
      mensaje: `📊 Nuevo pedido registrado - Mesa ${pedidoData.mesaId}`,
      pedidoId: nuevoPedido.id,
      mesaId: pedidoData.mesaId,
      destinatario: 'admin',
      prioridad: 'normal'
    });

    // Reproducir sonido
    reproducirSonidoNotificacion('nuevo_pedido');

    return nuevoPedido.id;
  };

  const validarPago = (pedidoId: string) => {
    setPedidos(prev => prev.map(pedido => {
      if (pedido.id === pedidoId) {
        const pedidoActualizado = { 
          ...pedido, 
          pagoValidado: true, 
          estado: 'confirmado' as const, 
          fechaActualizacion: new Date() 
        };

        // Notificar a cocina que el pago fue validado
        agregarNotificacion({
          tipo: 'pago_validado',
          mensaje: `✅ PAGO VALIDADO - Mesa ${pedido.mesaId} - Iniciar preparación`,
          pedidoId,
          mesaId: pedido.mesaId,
          destinatario: 'cocina',
          prioridad: 'alta',
          sonido: true
        });

        // Notificar al cliente
        agregarNotificacion({
          tipo: 'pago_validado',
          mensaje: `✅ Pago confirmado. Tu pedido está siendo preparado.`,
          pedidoId,
          mesaId: pedido.mesaId,
          destinatario: 'cliente',
          prioridad: 'normal'
        });

        return pedidoActualizado;
      }
      return pedido;
    }));
  };

  const marcarItemPreparando = (pedidoId: string, itemIndex: number) => {
    setPedidos(prev => prev.map(pedido => {
      if (pedido.id === pedidoId) {
        const itemsActualizados = pedido.items.map((item, index) => 
          index === itemIndex ? { 
            ...item, 
            estadoCocina: 'preparando' as const,
            tiempoIniciado: new Date()
          } : item
        );
        
        return {
          ...pedido,
          items: itemsActualizados,
          estado: pedido.estado === 'confirmado' ? 'preparando' as const : pedido.estado,
          fechaActualizacion: new Date()
        };
      }
      return pedido;
    }));
  };

  const marcarItemListo = (pedidoId: string, itemIndex: number) => {
    setPedidos(prev => prev.map(pedido => {
      if (pedido.id === pedidoId) {
        const itemsActualizados = pedido.items.map((item, index) => 
          index === itemIndex ? { 
            ...item, 
            estadoCocina: 'listo' as const,
            tiempoFinalizado: new Date()
          } : item
        );
        
        // Verificar si todos los items están listos
        const todosListos = itemsActualizados.every(item => item.estadoCocina === 'listo');
        
        const pedidoActualizado = {
          ...pedido,
          items: itemsActualizados,
          estado: todosListos ? 'listo' as const : pedido.estado,
          fechaActualizacion: new Date()
        };

        // Si todos los items están listos, notificar al mozo
        if (todosListos) {
          agregarNotificacion({
            tipo: 'pedido_listo',
            mensaje: `🍽️ PEDIDO LISTO - Mesa ${pedido.mesaId} - Listo para entregar`,
            pedidoId,
            mesaId: pedido.mesaId,
            destinatario: 'mozo',
            prioridad: 'critica',
            sonido: true
          });

          // Notificar al cliente
          agregarNotificacion({
            tipo: 'pedido_listo',
            mensaje: `🎉 ¡Tu pedido está listo! El mozo lo llevará a tu mesa.`,
            pedidoId,
            mesaId: pedido.mesaId,
            destinatario: 'cliente',
            prioridad: 'alta'
          });

          reproducirSonidoNotificacion('pedido_listo');
        } else {
          // Notificar progreso individual
          const plato = platos.find(p => p.id === pedido.items[itemIndex].platoId);
          agregarNotificacion({
            tipo: 'item_listo',
            mensaje: `✅ ${plato?.nombre} listo - Mesa ${pedido.mesaId}`,
            pedidoId,
            mesaId: pedido.mesaId,
            destinatario: 'mozo',
            prioridad: 'normal'
          });
        }
        
        return pedidoActualizado;
      }
      return pedido;
    }));
  };

  const actualizarPedido = (pedidoId: string, datos: Partial<Pedido>) => {
    setPedidos(prev => prev.map(pedido => {
      if (pedido.id === pedidoId) {
        const pedidoActualizado = { ...pedido, ...datos, fechaActualizacion: new Date() };
        
        // Notificaciones según el estado
        if (datos.estado === 'mozo_en_camino') {
          agregarNotificacion({
            tipo: 'mozo_en_camino',
            mensaje: `🚶‍♂️ Tu mozo está en camino a Mesa ${pedido.mesaId}`,
            pedidoId,
            mesaId: pedido.mesaId,
            destinatario: 'cliente',
            prioridad: 'alta'
          });

          // Notificar a cocina que el pedido fue recogido
          agregarNotificacion({
            tipo: 'mozo_en_camino',
            mensaje: `📤 Pedido Mesa ${pedido.mesaId} recogido por mozo`,
            pedidoId,
            mesaId: pedido.mesaId,
            destinatario: 'cocina',
            prioridad: 'normal'
          });
        }
        
        if (datos.estado === 'entregado') {
          agregarNotificacion({
            tipo: 'pedido_entregado',
            mensaje: `🎉 ¡Pedido entregado! ¡Buen provecho!`,
            pedidoId,
            mesaId: pedido.mesaId,
            destinatario: 'cliente',
            prioridad: 'normal'
          });

          // Registrar venta automáticamente
          registrarVenta({
            pedidoId,
            total: pedido.total,
            metodoPago: pedido.metodoPago || 'efectivo',
            fecha: new Date()
          });

          // Notificar al admin
          agregarNotificacion({
            tipo: 'pedido_entregado',
            mensaje: `✅ Venta completada - Mesa ${pedido.mesaId}: S/ ${pedido.total.toFixed(2)}`,
            pedidoId,
            mesaId: pedido.mesaId,
            destinatario: 'admin',
            prioridad: 'normal'
          });
        }
        
        return pedidoActualizado;
      }
      return pedido;
    }));
  };

  const actualizarItemPedido = (pedidoId: string, itemIndex: number, datos: Partial<PedidoItem>) => {
    // Esta función ahora delega a las funciones específicas
    if (datos.estadoCocina === 'preparando') {
      marcarItemPreparando(pedidoId, itemIndex);
    } else if (datos.estadoCocina === 'listo') {
      marcarItemListo(pedidoId, itemIndex);
    } else {
      // Para otros cambios generales
      setPedidos(prev => prev.map(pedido => {
        if (pedido.id === pedidoId) {
          const itemsActualizados = pedido.items.map((item, index) => 
            index === itemIndex ? { ...item, ...datos } : item
          );
          
          return {
            ...pedido,
            items: itemsActualizados,
            fechaActualizacion: new Date()
          };
        }
        return pedido;
      }));
    }
  };

  const registrarVenta = (ventaData: Omit<Venta, 'id'>) => {
    const nuevaVenta: Venta = {
      ...ventaData,
      id: `venta-${Date.now()}`,
    };
    setVentas(prev => [nuevaVenta, ...prev]);
  };

  const agregarNotificacion = (notificacionData: Omit<Notificacion, 'id' | 'timestamp' | 'leida'>) => {
    const nuevaNotificacion: Notificacion = {
      ...notificacionData,
      id: `notif-${Date.now()}`,
      timestamp: new Date(),
      leida: false
    };
    setNotificaciones(prev => [nuevaNotificacion, ...prev.slice(0, 99)]);

    // Reproducir sonido si está habilitado
    if (nuevaNotificacion.sonido) {
      reproducirSonidoNotificacion(nuevaNotificacion.tipo);
    }
  };

  const marcarNotificacionLeida = (notificacionId: string) => {
    setNotificaciones(prev => prev.map(notif => 
      notif.id === notificacionId ? { ...notif, leida: true } : notif
    ));
  };

  const obtenerNotificacionesPorRol = (rol: UserRole): Notificacion[] => {
    return notificaciones.filter(n => n.destinatario === rol || n.destinatario === 'all');
  };

  const limpiarNotificaciones = () => {
    setNotificaciones([]);
  };

  const obtenerEstadisticas = () => {
    const hoy = new Date();
    const inicioDelDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    
    const ventasHoy = ventas.filter(v => v.fecha >= inicioDelDia);
    const pedidosHoy = pedidos.filter(p => p.fechaCreacion >= inicioDelDia);
    
    return {
      ventasHoy: ventasHoy.length,
      ingresosDia: ventasHoy.reduce((sum, v) => sum + v.total, 0),
      pedidosActivos: pedidos.filter(p => ['nuevo', 'confirmado', 'preparando', 'listo'].includes(p.estado)).length,
      mesasOcupadas: mesas.filter(m => m.estado === 'ocupada').length,
      platosAgotados: platos.filter(p => !p.disponible).length,
      inventarioBajo: inventario.filter(i => i.stock <= i.minimo).length
    };
  };

  const exportarReporte = (tipo: string, filtros: any) => {
    // Simulación de exportación
    const datos = {
      ventas: ventas.filter(v => {
        if (filtros.fecha) {
          return v.fecha.toDateString() === filtros.fecha.toDateString();
        }
        return true;
      }),
      pedidos: pedidos.filter(p => {
        if (filtros.estado) {
          return p.estado === filtros.estado;
        }
        return true;
      }),
      inventario: inventario
    };

    // En un sistema real, esto generaría un archivo
    console.log(`Exportando reporte de ${tipo}:`, datos);
    alert(`Reporte de ${tipo} exportado exitosamente. Revisa la consola para ver los datos.`);
  };

  const value: AppContextType = {
    currentUser,
    setCurrentUser,
    mesas,
    actualizarMesa,
    obtenerMesaPorQR,
    platos,
    actualizarPlato,
    agregarPlato,
    eliminarPlato,
    pedidos,
    crearPedido,
    actualizarPedido,
    actualizarItemPedido,
    validarPago,
    marcarItemPreparando,
    marcarItemListo,
    ventas,
    registrarVenta,
    inventario,
    actualizarInventario,
    agregarInventario,
    empleados,
    agregarEmpleado,
    actualizarEmpleado,
    notificaciones,
    agregarNotificacion,
    marcarNotificacionLeida,
    obtenerNotificacionesPorRol,
    limpiarNotificaciones,
    mesaActual,
    setMesaActual,
    estadoTiempoReal,
    obtenerEstadisticas,
    exportarReporte,
    reproducirSonidoNotificacion
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}