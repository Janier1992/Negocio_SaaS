
// --- Importaciones ---
// Importamos componentes de interfaz visual (Botones, Inputs, Selectores) desde nuestra librería UI.
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Iconos para mejorar la experiencia visual (Signo más, Basura para borrar)
import { Plus, Trash2 } from "lucide-react";
// Cliente de conexión a la base de datos Supabase
import { supabase } from "@/integrations/supabase/client";
// Sistema de notificaciones tipo "toast" (mensajes emergentes)
import { toast } from "sonner";
// Hooks personalizados para obtener datos del usuario y productos
import { useUserProfile } from "@/hooks/useUserProfile";
import { useProducts } from "@/hooks/useProducts";
import { validateEmail } from "@/services/users";
import { sendSaleConfirmationWithRetry } from "@/services/salesEmail";

// --- Interfaces (Definición de tipos de datos) ---
// Define qué propiedades recibe este componente (en este caso, una función para recargar la lista al terminar).
interface VentaDialogProps {
  onVentaAdded: () => void;
}

// Estructura de un Producto dentro de la venta (qué datos necesitamos manejar en memoria)
interface ProductoVenta {
  producto_id: string; // ID para seleccionar en la lista visual
  variant_id: string;  // ID técnico de la variante (esencial para la base de datos y stock)
  nombre: string;      // Nombre para mostrar
  cantidad: number;    // Cuántos lleva el cliente
  precio_unitario: number; // Precio al momento de la venta
  subtotal: number;    // Cálculo (cantidad * precio)
}

// Customers interface
interface Customer {
  id: string;
  full_name: string;
  email: string;
}

export const VentaDialog = ({ onVentaAdded }: VentaDialogProps) => {
  // 1. Obtener datos de la empresa del usuario actual (para guardar la venta en el negocio correcto)
  const { data: userProfile } = useUserProfile();
  const empresaId = userProfile?.business_id;

  // 2. Cargar el catálogo de productos disponibles desde la base de datos
  const { productos, isLoading: loadingProducts } = useProducts();

  // --- Estados de la Interfaz (Memoria temporal del formulario) ---
  const [open, setOpen] = useState(false); // ¿El diálogo está abierto o cerrado?
  const [loading, setLoading] = useState(false); // ¿Se está procesando/guardando la venta?

  // Lista de clientes y cliente seleccionado
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [newCustomerMode, setNewCustomerMode] = useState(false); // Modo: ¿Crear nuevo cliente o seleccionar uno existente?

  // Datos del formulario de venta
  const [clienteName, setClienteName] = useState(""); // Nombre del cliente (para nuevo cliente)
  const [clienteEmail, setClienteEmail] = useState(""); // Email del cliente
  const [clienteDireccion, setClienteDireccion] = useState(""); // Dirección del cliente (opcional, no siempre usada en ventas)
  const [metodoPago, setMetodoPago] = useState(""); // Método de pago seleccionado
  const [items, setItems] = useState<ProductoVenta[]>([]); // Lista de productos agregados al carrito (Shopping Cart)
  const [errors, setErrors] = useState<Record<string, string>>({}); // Almacén de errores de validación

  // Efecto: Cargar clientes cada vez que se abre la ventana
  useEffect(() => {
    if (open && empresaId) {
      fetchCustomers();
    }
  }, [open, empresaId]);

  // Función asíncrona para consultar clientes en Supabase
  const fetchCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, full_name, email')
      .eq('business_id', empresaId);
    setCustomers(data || []);
  };

  // Agregar una línea vacía al carrito de compras
  const addItem = () => {
    setItems([...items, { producto_id: "", variant_id: "", nombre: "", cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
  };

  // Eliminar un ítem específico del carrito por su índice
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Actualizar datos de un ítem (ej. cuando cambian la cantidad o seleccionan otro producto)
  const updateItem = (index: number, field: keyof ProductoVenta, value: any) => {
    const newItems = [...items];
    // Actualizamos el campo específico
    newItems[index] = { ...newItems[index], [field]: value };

    // Si cambiaron el producto, buscamos sus datos (precio, id de variante)
    if (field === "producto_id") {
      const producto = productos.find((p) => p.id === value);
      if (producto) {
        newItems[index].precio_unitario = producto.precio;
        newItems[index].variant_id = producto.variant_id; // CRUCIAL: Usamos el ID de la variante para el inventario
        newItems[index].nombre = producto.nombre;
      }
    }
    // Recalcular subtotal (Cantidad x Precio) automáticamente
    newItems[index].subtotal = newItems[index].cantidad * newItems[index].precio_unitario;

    setItems(newItems);
  };

  // Calcular el gran total de la venta
  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.cantidad * item.precio_unitario, 0);
  };

  // --- Función PRINCIPAL: Procesar y Guardar la Venta ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evitar recarga de página estándar
    setErrors({});

    if (!empresaId) {
      toast.error("Error de sesión: No se identifica la empresa");
      return;
    }

    // Validaciones iniciales del formulario
    const newErrors: Record<string, string> = {};
    if (newCustomerMode && !clienteName) newErrors.cliente = "El nombre del cliente es requerido";
    if (!newCustomerMode && !selectedCustomerId) newErrors.cliente = "Selecciona un cliente";

    if (!metodoPago) newErrors.metodoPago = "El método de pago es requerido";

    const emailTrim = clienteEmail.trim();
    if (emailTrim && !validateEmail(emailTrim)) {
      newErrors.cliente_email = "Email inválido";
    }

    if (items.length === 0) newErrors.items = "Agrega al menos un producto";

    // Validar stock y selección de productos
    for (const item of items) {
      const prod = productos.find(p => p.id === item.producto_id);
      if (prod && item.cantidad > prod.stock) {
        newErrors.stock = `Stock insuficiente para ${prod.nombre}`;
      }
      if (!item.producto_id) newErrors.items = "Selecciona un producto";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Corrige los errores");
      return;
    }

    setLoading(true); // Activar estado de carga (blockear botones)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      let finalClientId = selectedCustomerId;

      // PASO 1: Crear Cliente si está en modo "Nuevo"
      if (newCustomerMode) {
        const { data: newClient, error: clientError } = await supabase
          .from('customers')
          .insert({
            business_id: empresaId,
            full_name: clienteName,
            email: emailTrim || null,
            address: clienteDireccion || null // Asumiendo que la tabla de clientes tiene dirección
            // doc_number es opcional
          })
          .select()
          .single();

        if (clientError) throw clientError;
        finalClientId = newClient.id; // Usar el ID del nuevo cliente
      }

      // PASO 2: Crear registro en tabla Maestra de Ventas ('sales')
      const { data: venta, error: ventaError } = await supabase
        .from("sales")
        .insert({
          // No hay user_id en el esquema de la tabla 'sales' que mostraste, pero sí 'seller_id'.
          // Esquema: business_id, client_id, total, status, payment_method.
          // Opcional: seller_id.
          business_id: empresaId,
          client_id: finalClientId,
          payment_method: metodoPago,
          status: 'completed', // Estado por defecto
          total: getTotal(),
          seller_id: user.id
        })
        .select()
        .single();

      if (ventaError) throw ventaError;

      // PASO 3: Guardar los Detalles/Items ('sale_items')
      // Mapeamos los datos de memoria al formato de la base de datos
      const detalles = items.map(item => ({
        sale_id: venta.id, // Vinculamos con la venta padre
        variant_id: item.variant_id, // CRÍTICO: usando variant_id para el inventario
        quantity: item.cantidad,
        unit_price: item.precio_unitario,
        subtotal: item.subtotal
      }));

      const { error: detallesError } = await supabase
        .from("sale_items")
        .insert(detalles);

      if (detallesError) throw detallesError;

      // PASO 4: Actualizar Stock (Descontar inventario)
      // Recorremos cada ítem vendido y restamos la cantidad de la base de datos
      // Asumo que necesitamos decrementar manualmente el stock.
      for (const item of items) {
        // Opción A: Usar RPC (Recomendado si existe y maneja concurrencia)
        // await supabase.rpc('decrement_stock', { p_variant_id: item.variant_id, p_quantity: item.cantidad });

        // Opción B: Actualización directa (Usada actualmente por simplicidad, pero puede tener problemas de concurrencia)
        const prod = productos.find(p => p.id === item.producto_id);
        if (prod) {
          await supabase.from('product_variants')
            .update({ stock_level: prod.stock - item.cantidad }) // Stock actual - Cantidad vendida
            .eq('id', item.variant_id);
        }
      }

      // PASO 5: Enviar confirmación por correo (si aplica)
      if (emailTrim) {
        // ... Lógica de envío de correo
      }

      toast.success("Venta registrada exitosamente");
      setOpen(false); // Cerrar ventana
      onVentaAdded(); // Notificar al componente padre para que actualice el historial

      // Limpiar formulario para la próxima venta
      setNewCustomerMode(false);
      setClienteName("");
      setClienteEmail("");
      setItems([]);
      fetchCustomers(); // Recargar lista de clientes

    } catch (error: any) {
      console.error(error);
      toast.error("Error al registrar venta: " + error.message);
    } finally {
      setLoading(false); // Desactivar carga
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <Plus className="h-4 w-4" />
          Nueva Venta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Venta</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Customer Selection */}
            <div className="space-y-2">
              <Label>Cliente</Label>
              <div className="flex gap-2">
                {!newCustomerMode ? (
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar Cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Nombre Completo"
                    value={clienteName}
                    onChange={e => setClienteName(e.target.value)}
                    required
                  />
                )}
                <Button type="button" variant="outline" onClick={() => setNewCustomerMode(!newCustomerMode)}>
                  {newCustomerMode ? "Listar" : "Nuevo"}
                </Button>
              </div>
              {errors.cliente && <p className="text-sm text-red-500">{errors.cliente}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="metodo_pago">Método de Pago</Label>
              <Select value={metodoPago} onValueChange={setMetodoPago} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
              {errors.metodoPago && <p className="text-sm text-red-500">{errors.metodoPago}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente_email">Email (Opcional)</Label>
              <Input
                id="cliente_email"
                type="email"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                placeholder="cliente@ejemplo.com"
              />
            </div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Productos</h3>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" /> Agregar Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-end flex-wrap sm:flex-nowrap border-b pb-2">
                <div className="w-full sm:flex-1">
                  <Label className="text-xs mb-1 block">Producto</Label>
                  <Select
                    value={item.producto_id}
                    onValueChange={(val) => updateItem(index, "producto_id", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} (${p.precio}) - Stock: {p.stock}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24">
                  <Label className="text-xs mb-1 block">Cant.</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => updateItem(index, "cantidad", parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="w-24">
                  <Label className="text-xs mb-1 block">$$</Label>
                  <Input value={item.precio_unitario} disabled className="bg-slate-100" />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {errors.items && <p className="text-sm text-red-500">{errors.items}</p>}
            {errors.stock && <p className="text-sm text-red-500">{errors.stock}</p>}
          </div>

          <div className="flex justify-between items-center text-xl font-bold border-t pt-4">
            <span>Total:</span>
            <span>${getTotal().toLocaleString()}</span>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Procesando..." : "Registrar Venta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
