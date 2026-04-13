import { useState } from "react";
import { useApp } from "../context/app-context";
import { supabase } from "../../lib/supabase";
import { getNextNumericId } from "../../lib/db-utils";
import { SaleRecord } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { Plus, TrendingDown, DollarSign, Printer, Trash2, TrendingUp, ShoppingCart, Calendar } from "lucide-react";
import { Badge } from "./ui/badge";

export function Sales() {
  const { products, setProducts, salesRecords, setSalesRecords, currentUser, users } = useApp();

  console.log("Sales component - currentUser:", currentUser);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
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

    let nextId = await getNextNumericId("sales_records");
    const salesToInsert: any[] = [];
    let hasErrors = false;

    for (let i = 0; i < saleItems.length; i++) {
      const item = saleItems[i];
      if (!item.productId) continue;

      const product = products.find((p) => p.id.toString() === item.productId.toString());
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

      if (!currentUser) {
        toast.error("Unable to identify the current user. Please log in again.");
        return;
      }

      salesToInsert.push({
        id: nextId,
        product_id: parseInt(item.productId),
        quantity_sold_pcs: quantitySoldPcs,
        quantity_sold_tray: quantitySoldTray,
        total_amount: totalAmount,
        sale_date: formData.saleDate,
        user_id: parseInt(currentUser.id, 10),
      });
      nextId++;
    }

    if (hasErrors) return;

    const { data: salesData, error: salesError } = await supabase
      .from("sales_records")
      .insert(salesToInsert)
      .select();

    if (salesError || !salesData || salesData.length === 0) {
      console.error("Sales insert error:", salesError);
      toast.error(`Failed to record sale: ${salesError?.message || 'Unknown error'}`);
      return;
    }

    // Update stock in database
    for (const p of products) {
      const soldQty = salesToInsert
        .filter((s) => s.product_id === p.id)
        .reduce((sum, s) => sum + s.quantity_sold_pcs + (s.quantity_sold_tray * 30), 0);

      if (soldQty > 0) {
        console.log(`Updating stock for product ${p.id}: ${p.stockQuantity} - ${soldQty} = ${p.stockQuantity - soldQty}`);
        const { error: updateError } = await supabase
          .from("products")
          .update({ stock_quantity: p.stockQuantity - soldQty })
          .eq("id", p.id);

        if (updateError) {
          console.error("Stock update error:", updateError);
          toast.error(`Failed to update stock for ${p.name}: ${updateError.message}`);
          // Continue anyway? Or return?
          // For now, return to prevent inconsistent state
          return;
        } else {
          console.log(`Stock updated successfully for product ${p.id}`);
        }
      }
    }

    const newSales: SaleRecord[] = salesData.map((sale: any) => ({
      id: sale.id.toString(),
      productId: sale.product_id.toString(),
      quantitySoldPcs: sale.quantity_sold_pcs,
      quantitySoldTray: sale.quantity_sold_tray,
      totalAmount: sale.total_amount,
      saleDate: sale.sale_date,
      userId: sale.user_id.toString(),
    }));

    setSalesRecords([...newSales, ...salesRecords]);
    const updatedProducts = products.map((p) => {
      const soldQty = salesToInsert
        .filter((s) => s.product_id === p.id)
        .reduce((sum, s) => sum + s.quantity_sold_pcs + (s.quantity_sold_tray * 30), 0);

      return {
        ...p,
        stockQuantity: p.stockQuantity - soldQty,
      };
    });

    setProducts(updatedProducts);
    toast.success("Sale recorded successfully");
    setIsDialogOpen(false);
    setSaleItems([{ productId: "", quantitySoldPcs: "", quantitySoldTray: "" }]);
    setFormData({ saleDate: new Date().toISOString().split("T")[0] });
  };

  const getProductName = (productId: string) => {
    return products.find((p) => p.id.toString() === productId.toString())?.name || "Unknown";
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id.toString() === userId.toString())?.name || "Unknown";
  };

  const handleDeleteSale = async (saleId: string) => {
    // First, get the sale record to restore stock
    const saleToDelete = salesRecords.find(s => s.id === saleId);
    if (!saleToDelete) {
      toast.error("Sale record not found");
      return;
    }

    const { error: deleteError } = await supabase
      .from("sales_records")
      .delete()
      .eq("id", parseInt(saleId, 10));

    if (deleteError) {
      console.error("Delete error:", deleteError);
      toast.error("Failed to delete sale record");
      return;
    }

    // Restore stock in database
    const product = products.find(p => p.id.toString() === saleToDelete.productId);
    if (product) {
      const restoreQty = saleToDelete.quantitySoldPcs + (saleToDelete.quantitySoldTray * 30);
      console.log(`Restoring stock for product ${product.id}: ${product.stockQuantity} + ${restoreQty} = ${product.stockQuantity + restoreQty}`);
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: product.stockQuantity + restoreQty })
        .eq("id", product.id);

      if (updateError) {
        console.error("Stock restore error:", updateError);
        toast.error("Sale deleted but failed to restore stock");
        return;
      } else {
        console.log(`Stock restored successfully for product ${product.id}`);
      }

      // Update local state
      setProducts(products.map(p =>
        p.id === product.id
          ? { ...p, stockQuantity: p.stockQuantity + restoreQty }
          : p
      ));
    }

    setSalesRecords(salesRecords.filter((s) => s.id !== saleId));
    toast.success("Sale deleted successfully");
    setSaleToDelete(null);
  };

  const filteredRecords = salesRecords.filter((sale) => sale.saleDate === selectedDate);

  // Calculate statistics
  const totalSalesAmount = salesRecords.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalRecordsCount = salesRecords.length;
  const currentDaySalesAmount = filteredRecords.reduce((sum, s) => sum + s.totalAmount, 0);
  const currentDayRecordsCount = filteredRecords.length;

  const handlePrint = () => {
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
              <div style="font-size: 24px; font-weight: bold; color: #28a745;">₱${salesRecords.reduce((sum, s) => sum + s.totalAmount, 0).toFixed(2)}</div>
              <div style="color: #6c757d; font-size: 14px;">Total Sales</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; border: 1px solid #dee2e6;">
              <div style="font-size: 24px; font-weight: bold; color: #007bff;">${salesRecords.length}</div>
              <div style="color: #6c757d; font-size: 14px;">Total Records</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Sales Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: 600; color: #495057;">Product</th>
                <th style="border: 1px solid #dee2e6; padding: 12px; text-align: center; font-weight: 600; color: #495057;">Qty (pcs)</th>
                <th style="border: 1px solid #dee2e6; padding: 12px; text-align: center; font-weight: 600; color: #495057;">Qty (tray)</th>
                <th style="border: 1px solid #dee2e6; padding: 12px; text-align: right; font-weight: 600; color: #495057;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${salesRecords.map((sale, idx) => `
                <tr style="background: ${idx % 2 === 0 ? '#fff' : '#f8f9fa'};">
                  <td style="border: 1px solid #dee2e6; padding: 12px;">${getProductName(sale.productId)}</td>
                  <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center;">${sale.quantitySoldPcs}</td>
                  <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center;">${sale.quantitySoldTray}</td>
                  <td style="border: 1px solid #dee2e6; padding: 12px; text-align: right; font-weight: 600; color: #28a745;">₱${sale.totalAmount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="text-align: center; font-size: 12px; color: #6c757d; margin-top: 40px; border-top: 1px solid #dee2e6; padding-top: 20px;">
          <p style="margin: 5px 0;">This is a computer-generated report.</p>
        </div>
      </div>
    `;

    const printWindow = window.open("", "", "height=800,width=1000");
    if (printWindow) {
      printWindow.document.write(reportContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Sales</h1>
          <p className="text-gray-500">Record and manage sales transactions</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record New Sale</DialogTitle>
                <DialogDescription>
                  Enter sale details. You can add multiple products in one sale.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRecordSale} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="saleDate">Sale Date</Label>
                  <Input
                    id="saleDate"
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {saleItems.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Product {index + 1}</Label>
                        {saleItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSaleItems(saleItems.filter((_, i) => i !== index))}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <Select
                        value={item.productId}
                        onValueChange={(value) => {
                          const newItems = [...saleItems];
                          newItems[index].productId = value;
                          setSaleItems(newItems);
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} (Stock: {product.stockQuantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor={`pcs-${index}`} className="text-sm">Qty (pcs)</Label>
                          <Input
                            id={`pcs-${index}`}
                            type="number"
                            min="0"
                            value={item.quantitySoldPcs}
                            onChange={(e) => {
                              const newItems = [...saleItems];
                              newItems[index].quantitySoldPcs = e.target.value;
                              setSaleItems(newItems);
                            }}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`tray-${index}`} className="text-sm">Qty (tray)</Label>
                          <Input
                            id={`tray-${index}`}
                            type="number"
                            min="0"
                            value={item.quantitySoldTray}
                            onChange={(e) => {
                              const newItems = [...saleItems];
                              newItems[index].quantitySoldTray = e.target.value;
                              setSaleItems(newItems);
                            }}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSaleItems([...saleItems, { productId: "", quantitySoldPcs: "", quantitySoldTray: "" }])}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>

                {saleItems.some(item => item.productId) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <h4 className="font-semibold text-sm text-blue-900">Order Summary</h4>
                    {saleItems.map((item, index) => {
                      if (!item.productId) return null;
                      const product = products.find((p) => p.id.toString() === item.productId.toString());
                      if (!product) return null;
                      const quantitySoldPcs = parseInt(item.quantitySoldPcs) || 0;
                      const quantitySoldTray = parseInt(item.quantitySoldTray) || 0;
                      const itemTotal = (product.price * quantitySoldPcs) + (product.trayPrice * quantitySoldTray);
                      return (
                        <div key={index} className="flex justify-between text-sm text-blue-800">
                          <span>{product.name} ({quantitySoldPcs} pcs, {quantitySoldTray} tray)</span>
                          <span className="font-medium">₱{itemTotal.toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-blue-200 pt-2 flex justify-between font-semibold text-blue-900">
                      <span>Total Amount:</span>
                      <span className="text-lg">₱{saleItems.reduce((sum, item) => {
                        if (!item.productId) return sum;
                        const product = products.find((p) => p.id.toString() === item.productId.toString());
                        if (!product) return sum;
                        const quantitySoldPcs = parseInt(item.quantitySoldPcs) || 0;
                        const quantitySoldTray = parseInt(item.quantitySoldTray) || 0;
                        return sum + (product.price * quantitySoldPcs) + (product.trayPrice * quantitySoldTray);
                      }, 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}

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
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">₱{totalSalesAmount.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalRecordsCount}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">₱{currentDaySalesAmount.toFixed(2)}</div>
            <p className="text-xs text-gray-500 mt-1">{selectedDate}</p>
          </CardContent>
        </Card>

        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Records</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{currentDayRecordsCount}</div>
            <p className="text-xs text-gray-500 mt-1">{selectedDate}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Sales Records</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="saleDate" className="text-sm">Date</Label>
            <Input
              id="saleDate"
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
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No sales records for this date
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Sold pcs</TableHead>
                    <TableHead>Sold per tray</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Sale Date</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((sale) => (
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
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSaleToDelete(sale.id)}
                          className="hover:text-red-600"
                          title="Delete sale"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sale Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sale record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => saleToDelete && handleDeleteSale(saleToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}