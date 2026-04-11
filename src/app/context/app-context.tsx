import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Product, StockInRecord, SaleRecord } from "../types";
import { supabase } from "../../lib/supabase";

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
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockInRecords, setStockInRecords] = useState<StockInRecord[]>([]);
  const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadSupabaseData = async () => {
      const [{ data: usersData, error: usersError }, { data: productsData, error: productsError }, { data: stockData, error: stockError }, { data: salesData, error: salesError }] = await Promise.all([
        supabase.from("users").select("*") as Promise<any>,
        supabase.from("products").select("*") as Promise<any>,
        supabase.from("stock_in_records").select("*") as Promise<any>,
        supabase.from("sales_records").select("*") as Promise<any>,
      ]);

      if (!usersError && usersData) {
        setUsers(
          usersData.map((user: any) => ({
            id: user.id.toString(),
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
          })) as User[],
        );
      }

      if (!productsError && productsData) {
        setProducts(
          productsData.map((product: any) => ({
            ...product,
            price: Number(product.price),
            trayPrice: Number(product.tray_price),
            stockQuantity: Number(product.stock_quantity),
            dateAdded: product.date_added,
          })) as Product[],
        );
      }

      if (!stockError && stockData) {
        setStockInRecords(
          stockData.map((record: any) => ({
            ...record,
            quantityAdded: Number(record.quantity_added),
            missingQuantity: Number(record.missing_quantity),
            crackedQuantity: Number(record.cracked_quantity),
            dateReceived: record.date_received,
            userId: record.user_id.toString(),
            productId: record.product_id.toString(),
          })) as StockInRecord[],
        );
      }

      if (!salesError && salesData) {
        setSalesRecords(
          salesData.map((record: any) => ({
            ...record,
            quantitySoldPcs: Number(record.quantity_sold_pcs),
            quantitySoldTray: Number(record.quantity_sold_tray),
            totalAmount: Number(record.total_amount),
            saleDate: record.sale_date,
            userId: record.user_id.toString(),
            productId: record.product_id.toString(),
          })) as SaleRecord[],
        );
      }
    };

    void loadSupabaseData();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("currentUser", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("currentUser");
    }
  }, [currentUser]);

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
