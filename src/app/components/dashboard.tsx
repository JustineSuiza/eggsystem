import { useApp } from "../context/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Package, TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";

export function Dashboard() {
  const { products, stockInRecords, salesRecords, users } = useApp();

  // Calculate statistics
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);
  const lowStockProducts = products.filter((p) => p.stockQuantity < 50);
  
  const todayDate = "2026-03-13";
  const todaySales = salesRecords.filter((s) => s.saleDate === todayDate);
  const totalSalesToday = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalItemsSoldToday = todaySales.reduce((sum, s) => sum + s.quantitySoldPcs + (s.quantitySoldTray * 30), 0);

  const recentStockIn = stockInRecords
    .sort((a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime())
    .slice(0, 5);

  const recentSales = salesRecords
    .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
    .slice(0, 5);

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name || "Unknown";
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || "Unknown";
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="text-gray-500">Overview of your egg inventory system</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalProducts}</div>
            <p className="text-xs text-gray-500 mt-1">Active product types</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalStock}</div>
            <p className="text-xs text-gray-500 mt-1">Items in inventory</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">₱{totalSalesToday.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{totalItemsSoldToday} items sold</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{lowStockProducts.length}</div>
            <p className="text-xs text-gray-500 mt-1">Products below 50 items</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Current Stock Levels */}
        <Card className="animate-in fade-in slide-in-from-left-4 duration-500">
          <CardHeader>
            <CardTitle>Current Stock Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price (pcs)</TableHead>
                    <TableHead>Price (tray)</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>₱{product.price.toFixed(2)}</TableCell>
                      <TableCell>₱{product.trayPrice.toFixed(2)}</TableCell>
                      <TableCell>{product.stockQuantity}</TableCell>
                      <TableCell>
                        {product.stockQuantity === 0 ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : product.stockQuantity <= 50 ? (
                          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Limited</Badge>
                        ) : (
                          <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Stock In */}
        <Card className="animate-in fade-in slide-in-from-right-4 duration-500">
          <CardHeader>
            <CardTitle>Recent Stock Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentStockIn.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {getProductName(record.productId)}
                      </TableCell>
                      <TableCell>{record.quantityAdded}</TableCell>
                      <TableCell>{record.dateReceived}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {getUserName(record.userId)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Sold pcs</TableHead>
                  <TableHead>Sold tray</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Cashier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {getProductName(sale.productId)}
                    </TableCell>
                    <TableCell>{sale.quantitySoldPcs}</TableCell>
                    <TableCell>{sale.quantitySoldTray}</TableCell>
                    <TableCell>₱{sale.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>{sale.saleDate}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {getUserName(sale.userId)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}