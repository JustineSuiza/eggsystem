export type UserRole = "Owner" | "Admin" | "Staff" | "Cashier";

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
}

export interface Product {
  id: string;
  name: string;
  price: number; // Price per piece
  trayPrice: number; // Price per tray
  stockQuantity: number;
  dateAdded: string;
}

export interface StockInRecord {
  id: string;
  productId: string;
  quantityAdded: number;
  missingQuantity: number;
  crackedQuantity: number;
  dateReceived: string;
  userId: string;
}

export interface SaleRecord {
  id: string;
  productId: string;
  quantitySoldPcs: number;
  quantitySoldTray: number;
  totalAmount: number;
  saleDate: string;
  userId: string;
}
