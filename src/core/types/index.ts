// Interfaz para un producto del inventario
export interface Product {
  id: string;
  name: string;
  barcode: string; // Código de barras escaneado
  category: string;
  costPrice: number; // Precio de costo
  salePrice: number; // Precio de venta
  stock: number; // Cantidad disponible
  minStock: number; // Umbral para alerta de stock bajo
  unit: string; // Pieza, paquete, hoja, etc
  createdAt: Date;
  updatedAt: Date;
}

// Interfaz para un artículo en una nota de venta
export interface SaleItem {
  productId: string;
  name: string;
  qty: number;
  unitPrice: number; // Precio de venta en el momento
  unitCost: number; // Precio de costo en el momento
}

// Interfaz para una nota de venta
export interface Sale {
  id: string;
  date: Date;
  items: SaleItem[];
  total: number; // Suma de qty * unitPrice
  totalCost: number; // Suma de qty * unitCost
  profit: number; // total - totalCost
  notes?: string;
  createdAt: Date;
}

// Interfaz para una inversión/compra
export interface Investment {
  id: string;
  date: Date;
  description: string;
  amount: number;
  relatedProductIds?: string[];
  notes?: string;
  createdAt: Date;
}

// Interfaz para configuración de calculadoras (servicios)
export interface CalculatorConfig {
  id: string; // ej: "copia_bn", "impresion_color"
  label: string; // ej: "Copias B/N"
  pricePerUnit: number;
  unit: string; // ej: "copia", "hoja", "página"
  updatedAt: Date;
}

// Interfaz para el usuario (data en Firestore)
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

// Interfaz para datos de dashboard/analíticos
export interface DashboardMetrics {
  totalSalesToday: number;
  totalSalesWeek: number;
  totalSalesMonth: number;
  profitToday: number;
  profitWeek: number;
  profitMonth: number;
  investmentTotal: number;
  lowStockProducts: Product[];
  topProducts: Array<{
    productId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
}
