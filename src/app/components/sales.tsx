import { useState } from "react";
import { useApp } from "../context/app-context";
import { supabase } from "../../lib/supabase";
import { SaleRecord } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { Plus, TrendingDown, DollarSign, Printer } from "lucide-react";
import { Badge } from "./ui/badge";

export function Sales() {
  const { products, setProducts, salesRecords, setSalesRecords, currentUser, users } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saleItems, setSaleItems] = useState([{
    productId: "",
    quantitySoldPcs: "",
    quantitySoldTray: "",
  }]);
  const [formData, setFormData] = useState({
    saleDate: new Date().toISOString().split("T")[0],
  });

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    if (saleItems.length === 0 || saleItems.every(item => !item.productId)) {
      toast.error("Please select at least one product");
      return;
    }

    const salesToInsert: any[] = [];
    let hasErrors = false;

    for (const item of saleItems) {
      if (!item.productId) continue;

      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        toast.error(`Product not found for one of the items`);
        hasErrors = true;
        break;
      }

      const quantitySoldPcs = parseInt(item.quantitySoldPcs) || 0;
      const quantitySoldTray = parseInt(item.quantitySoldTray) || 0;
      const totalQuantity = quantitySoldPcs + (quantitySoldTray * 30);
      
      if (totalQuantity <= 0) {
        toast.error("Please enter valid quantities for all products");
        hasErrors = true;
        break;
      }

      if (totalQuantity > product.stockQuantity) {
        toast.error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
        hasErrors = true;
        break;
      }

      const totalAmount = (product.price * quantitySoldPcs) + (product.trayPrice * quantitySoldTray);

      salesToInsert.push({
        product_id: parseInt(item.productId),
        quantity_sold_pcs: quantitySoldPcs,
        quantity_sold_tray: quantitySoldTray,
        total_amount: totalAmount,
        sale_date: formData.saleDate,
        user_id: currentUser.id,
      });
    }

    if (hasErrors) return;

    const { data: salesData, error: salesError } = await supabase
      .from("sales_records")
      .insert(salesToInsert)
      .select();

    if (salesError || !salesData) {
      console.error(salesError);
      toast.error("Failed to record sales");
      return;
    }

    const newSales: SaleRecord[] = salesData.map((sale: any) => ({
      id: sale.id.toString(),
      productId: sale.product_id.toString(),
      quantitySoldPcs: sale.quantity_sold_pcs,
      quantitySoldTray: sale.quantity_sold_tray,
      totalAmount: sale.total_amount,
      saleDate: sale.sale_date,
      userId: sale.user_id,
    }));

    const updatedProducts = products.map((product) => {
      const totalSold = newSales
        .filter(sale => sale.productId === product.id)
        .reduce((sum, sale) => sum + sale.quantitySoldPcs + (sale.quantitySoldTray * 30), 0);
      
      return {
        ...product,
        stockQuantity: product.stockQuantity - totalSold
      };
    });

    setProducts(updatedProducts);
    setSalesRecords([...newSales, ...salesRecords]);
    
    const totalAmount = newSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    toast.success(`Sale recorded: ₱${totalAmount.toFixed(2)} (${newSales.length} items)`);
    
    setIsDialogOpen(false);
    setSaleItems([{
      productId: "",
      quantitySoldPcs: "",
      quantitySoldTray: "",
    }]);
    setFormData({
      saleDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleAddSaleItem = () => {
    setSaleItems([...saleItems, {
      productId: "",
      quantitySoldPcs: "",
      quantitySoldTray: "",
    }]);
  };

  const handleRemoveSaleItem = (index: number) => {
    if (saleItems.length > 1) {
      setSaleItems(saleItems.filter((_, i) => i !== index));
    }
  };

  const handleUpdateSaleItem = (index: number, field: string, value: string) => {
    const updatedItems = saleItems.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    setSaleItems(updatedItems);
  };

  const getProductName = (productId: string) => {
    return products.find((p) => p.id === productId)?.name || "Unknown";
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || "Unknown";
  };

  const handlePrint = () => {
    // Generate sales report content
    const reportContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0; color: #333;">Egg Management System</h1>
          <h2 style="margin: 5px 0; color: #666;">Sales Report</h2>
          <p style="margin: 5px 0; color: #888;">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin-top: 0; color: #333;">Report Summary</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; border: 1px solid #dee2e6;">
              <div style="font-size: 24px; font-weight: bold; color: #28a745;">₱${filteredRevenue.toFixed(2)}</div>
              <div style="color: #6c757d; font-size: 14px;">Today's Sales Revenue</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; border: 1px solid #dee2e6;">
              <div style="font-size: 24px; font-weight: bold; color: #007bff;">${filteredItems}</div>
              <div style="color: #6c757d; font-size: 14px;">Items Sold Today</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; border: 1px solid #dee2e6;">
              <div style="font-size: 24px; font-weight: bold; color: #6c757d;">${filteredSales.length}</div>
              <div style="color: #6c757d; font-size: 14px;">Total Transactions</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Sales Details for ${selectedDate}</h3>
          ${filteredSales.length === 0 ? 
            '<p style="text-align: center; color: #6c757d; font-style: italic; padding: 40px;">No sales records found for this date.</p>' :
            `<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: 600; color: #495057;">Product</th>
                  <th style="border: 1px solid #dee2e6; padding: 12px; text-align: center; font-weight: 600; color: #495057;">Pieces</th>
                  <th style="border: 1px solid #dee2e6; padding: 12px; text-align: center; font-weight: 600; color: #495057;">Trays</th>
                  <th style="border: 1px solid #dee2e6; padding: 12px; text-align: right; font-weight: 600; color: #495057;">Amount</th>
                  <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: 600; color: #495057;">Cashier</th>
                </tr>
              </thead>
              <tbody>
                ${filteredSales.map((sale, index) => `
                  <tr style="background: ${index % 2 === 0 ? '#fff' : '#f8f9fa'};">
                    <td style="border: 1px solid #dee2e6; padding: 12px; font-weight: 500;">${getProductName(sale.productId)}</td>
                    <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center;">${sale.quantitySoldPcs}</td>
                    <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center;">${sale.quantitySoldTray}</td>
                    <td style="border: 1px solid #dee2e6; padding: 12px; text-align: right; font-weight: 600; color: #28a745;">₱${sale.totalAmount.toFixed(2)}</td>
                    <td style="border: 1px solid #dee2e6; padding: 12px;">${getUserName(sale.userId)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background: #e9ecef; font-weight: bold;">
                  <td colspan="3" style="border: 1px solid #dee2e6; padding: 12px; text-align: right; font-weight: 600;">Total:</td>
                  <td style="border: 1px solid #dee2e6; padding: 12px; text-align: right; font-weight: 600; color: #28a745;">₱${filteredRevenue.toFixed(2)}</td>
                  <td style="border: 1px solid #dee2e6; padding: 12px;"></td>
                </tr>
              </tfoot>
            </table>`
          }
        </div>

        <div style="text-align: center; color: #6c757d; font-size: 12px; border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 40px;">
          <p>This report was generated automatically by the Egg Management System</p>
        </div>
      </div>
    `;

    // Create a temporary print window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      alert('Please allow popups for this website to print reports');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Report - ${selectedDate}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          ${reportContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  // Sort sales by date (newest first)
  const sortedSales = [...salesRecords].sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  );

  // Calculate statistics
  const totalSales = salesRecords.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalItemsSold = salesRecords.reduce((sum, s) => sum + s.quantitySoldPcs + (s.quantitySoldTray * 30), 0);

  // Date filter for sales record view
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const filteredSales = sortedSales.filter((s) => s.saleDate === selectedDate);
  const filteredRevenue = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const filteredItems = filteredSales.reduce(
    (sum, s) => sum + s.quantitySoldPcs + (s.quantitySoldTray * 30),
    0
  );

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Sales</h1>
          <p className="text-gray-500">Record and track sales transactions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[70vh] overflow-y-auto bg-white">
            <DialogHeader>
              <DialogTitle>Record Sale</DialogTitle>
              <DialogDescription>Enter the details of the sale</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRecordSale} className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Products</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSaleItem}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>

                {saleItems.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Product {index + 1}</Label>
                      {saleItems.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveSaleItem(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Select
                        value={item.productId}
                        onValueChange={(value) => handleUpdateSaleItem(index, 'productId', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - ₱{product.price.toFixed(2)} pcs / ₱{product.trayPrice.toFixed(2)} tray (Stock: {product.stockQuantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`quantityPcs-${index}`}>Sold pcs</Label>
                        <Input
                          id={`quantityPcs-${index}`}
                          type="number"
                          value={item.quantitySoldPcs}
                          onChange={(e) => handleUpdateSaleItem(index, 'quantitySoldPcs', e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`quantityTray-${index}`}>Sold per tray</Label>
                        <Input
                          id={`quantityTray-${index}`}
                          type="number"
                          value={item.quantitySoldTray}
                          onChange={(e) => handleUpdateSaleItem(index, 'quantitySoldTray', e.target.value)}
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    {item.productId && (
                      <p className="text-sm text-gray-500">
                        Available stock: {products.find((p) => p.id === item.productId)?.stockQuantity || 0} pcs
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Sale Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) =>
                    setFormData({ ...formData, saleDate: e.target.value })
                  }
                  required
                />
              </div>

              {(() => {
                const itemsWithTotals = saleItems
                  .map((item, index) => {
                    if (!item.productId) return null;
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;
                    const pcs = parseInt(item.quantitySoldPcs) || 0;
                    const trays = parseInt(item.quantitySoldTray) || 0;
                    const subtotal = (product.price * pcs) + (product.trayPrice * trays);
                    return { index, product, pcs, trays, subtotal };
                  })
                  .filter(Boolean);
                
                const totalAmount = itemsWithTotals.reduce((sum, item) => sum + item.subtotal, 0);
                
                return itemsWithTotals.length > 0 && (
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-emerald-900">Sale Summary</h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {itemsWithTotals.map((item) => (
                          <div key={item.index} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                            <span className="text-gray-700">
                              {item.product.name}
                              {item.pcs > 0 && <span className="ml-1">• {item.pcs} pcs @ ₱{item.product.price.toFixed(2)}</span>}
                              {item.trays > 0 && <span className="ml-1">• {item.trays} tray @ ₱{item.product.trayPrice.toFixed(2)}</span>}
                            </span>
                            <span className="font-semibold text-emerald-700">₱{item.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-emerald-300 pt-2 mt-2">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-900">Total Amount:</span>
                          <span className="text-2xl font-bold text-emerald-700">
                            ₱{totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Record Sale
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">₱{totalSales.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items Sold</CardTitle>
            <TrendingDown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalItemsSold}</div>
            <p className="text-xs text-gray-500 mt-1">{salesRecords.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">₱{filteredRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{filteredSales.length} transactions</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold Today</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{filteredItems}</div>
            <p className="text-xs text-gray-500 mt-1">{selectedDate}</p>
          </CardContent>
        </Card>
      </div>


      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            Sales Records
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="recordDate" className="text-sm">Date</Label>
            <Input
              id="recordDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-44"
            />
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Sold pcs</TableHead>
                  <TableHead>Sold per tray</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Sale Date</TableHead>
                  <TableHead>Cashier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No sales records for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        {getProductName(sale.productId)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sale.quantitySoldPcs}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{sale.quantitySoldTray}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        ₱{sale.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>{sale.saleDate}</TableCell>
                      <TableCell className="text-gray-500">
                        {getUserName(sale.userId)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}