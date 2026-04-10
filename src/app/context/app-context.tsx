import React, { createContext, useContext, useState, ReactNode } from "react";
import { User, Product, StockInRecord, SaleRecord } from "../types";

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  stockInRecords: StockInRecord[];
  setStockInRecords: (records: StockInRecord[]) => void;
  salesRecords: SaleRecord[];
  setSalesRecords: (records: SaleRecord[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  // Initial users with default admin
  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      name: "Admin User",
      username: "admin",
      password: "admin123",
      role: "Admin",
    },
    {
      id: "2",
      name: "John Staff",
      username: "staff",
      password: "staff123",
      role: "Staff",
    },
    {
      id: "3",
      name: "Jane Cashier",
      username: "cashier",
      password: "cashier123",
      role: "Cashier",
    },
  ]);

  // Initial products
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Small Eggs",
      price: 3.99,
      trayPrice: 119.70,
      stockQuantity: 150,
      dateAdded: "2026-03-01",
    },
    {
      id: "2",
      name: "Medium Eggs",
      price: 4.49,
      trayPrice: 134.70,
      stockQuantity: 200,
      dateAdded: "2026-03-01",
    },
    {
      id: "3",
      name: "Large Eggs",
      price: 5.29,
      trayPrice: 158.70,
      stockQuantity: 180,
      dateAdded: "2026-03-01",
    },
    {
      id: "4",
      name: "Jumbo Eggs",
      price: 6.49,
      trayPrice: 194.70,
      stockQuantity: 100,
      dateAdded: "2026-03-01",
    },
  ]);

  // Initial stock in records
  const [stockInRecords, setStockInRecords] = useState<StockInRecord[]>([
    {
      id: "1",
      productId: "1",
      quantityAdded: 50,
      missingQuantity: 0,
      crackedQuantity: 0,
      dateReceived: "2026-03-10",
      userId: "2",
    },
    {
      id: "2",
      productId: "2",
      quantityAdded: 100,
      missingQuantity: 0,
      crackedQuantity: 0,
      dateReceived: "2026-03-11",
      userId: "2",
    },
    {
      id: "3",
      productId: "3",
      quantityAdded: 80,
      missingQuantity: 0,
      crackedQuantity: 0,
      dateReceived: "2026-03-12",
      userId: "2",
    },
  ]);

  // Initial sales records
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([
    {
      id: "1",
      productId: "1",
      quantitySoldPcs: 20,
      quantitySoldTray: 0,
      totalAmount: 79.8,
      saleDate: "2026-03-13",
      userId: "3",
    },
    {
      id: "2",
      productId: "2",
      quantitySoldPcs: 30,
      quantitySoldTray: 0,
      totalAmount: 134.7,
      saleDate: "2026-03-13",
      userId: "3",
    },
    {
      id: "3",
      productId: "3",
      quantitySoldPcs: 25,
      quantitySoldTray: 0,
      totalAmount: 132.25,
      saleDate: "2026-03-13",
      userId: "3",
    },
  ]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        setUsers,
        products,
        setProducts,
        stockInRecords,
        setStockInRecords,
        salesRecords,
        setSalesRecords,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
