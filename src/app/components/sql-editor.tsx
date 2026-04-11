import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Copy, Database, Download, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

const SQL_SCHEMA = `-- Egg Inventory System Supabase Schema with Table-Based Authentication
-- Run this in Supabase SQL Editor to create the application database and security rules.

-- Drop existing app schema tables
DROP TABLE IF EXISTS sales_records CASCADE;
DROP TABLE IF EXISTS stock_in_records CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table for application authentication
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Staff', 'Cashier')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  tray_price NUMERIC(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  date_added DATE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Stock in records table
CREATE TABLE stock_in_records (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_added INTEGER NOT NULL,
  missing_quantity INTEGER NOT NULL DEFAULT 0,
  cracked_quantity INTEGER NOT NULL DEFAULT 0,
  date_received DATE NOT NULL DEFAULT NOW(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Sales records table
CREATE TABLE sales_records (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_sold_pcs INTEGER NOT NULL DEFAULT 0,
  quantity_sold_tray INTEGER NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  sale_date DATE NOT NULL DEFAULT NOW(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Grant the anon/public client permission to use the public schema and access tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE ON SEQUENCES TO anon, authenticated;

-- Example data for testing
INSERT INTO users (username, email, password, name, role) VALUES
  ('admin', 'admin@example.com', 'admin123', 'Admin User', 'Admin'),
  ('staff1', 'staff1@example.com', 'staff123', 'Staff One', 'Staff'),
  ('cashier1', 'cashier1@example.com', 'cashier123', 'Cashier One', 'Cashier');

INSERT INTO products (name, price, tray_price, stock_quantity, date_added) VALUES
  ('Eggs Grade A', 6.50, 120.00, 1000, '2024-01-15'),
  ('Eggs Grade B', 5.50, 100.00, 800, '2024-01-15'),
  ('Eggs Organic', 8.00, 150.00, 500, '2024-01-16');

INSERT INTO stock_in_records (product_id, quantity_added, missing_quantity, cracked_quantity, date_received, user_id) VALUES
  (1, 200, 5, 2, '2024-01-20', 2),
  (2, 150, 3, 1, '2024-01-21', 2),
  (3, 120, 2, 0, '2024-01-22', 3);

INSERT INTO sales_records (product_id, quantity_sold_pcs, quantity_sold_tray, total_amount, sale_date, user_id) VALUES
  (1, 50, 0, 325.00, '2024-01-23', 3),
  (2, 0, 2, 200.00, '2024-01-24', 3),
  (3, 25, 0, 200.00, '2024-01-25', 2);

-- NOTE: Table-based auth with Supabase is not as secure as native auth.
-- For development, this schema stores plain-text passwords; replace with hashing in production.`;

export function SqlEditor() {
  const [sqlContent, setSqlContent] = useState(SQL_SCHEMA);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlContent);
      toast.success("SQL copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownloadSql = () => {
    const blob = new Blob([sqlContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "egg-inventory-schema.sql";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("SQL file downloaded!");
  };

  const handleResetSql = () => {
    setSqlContent(SQL_SCHEMA);
    toast.success("SQL schema reset to the default template.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SQL Editor</h1>
          <p className="text-muted-foreground">
            View and copy the database schema for the Egg Inventory System
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleResetSql} variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset SQL
          </Button>
          <Button onClick={handleCopyToClipboard} variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Copy SQL
          </Button>
          <Button onClick={handleDownloadSql} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Schema
          </CardTitle>
          <CardDescription>
            This SQL creates the complete database structure for the Egg Inventory System.
            Copy and paste this into your Supabase SQL Editor to set up the database.
            The template also includes example data for users, products, stock receipts, and sales.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sqlContent}
            onChange={(e) => setSqlContent(e.target.value)}
            className="min-h-[600px] font-mono text-sm"
            placeholder="SQL schema will appear here..."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">To set up the database:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Go to your Supabase project dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Copy the SQL above</li>
              <li>Paste it into the SQL Editor</li>
              <li>Click "Run" to execute the schema</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">What this creates:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><code>users</code> table for authentication</li>
              <li><code>products</code> table for egg inventory</li>
              <li><code>stock_in_records</code> table for stock receipts</li>
              <li><code>sales_records</code> table for sales transactions</li>
              <li>Example data for users, products, stock receipts, and sales</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}