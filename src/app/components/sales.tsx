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
import { Plus, TrendingDown, DollarSign, Printer, Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";

export function Sales() {
  const { products, setProducts, salesRecords, setSalesRecords, currentUser, users } = useApp();

  console.log("Sales component - currentUser:", currentUser);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
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
    const { error } = await supabase
      .from("sales_records")
      .delete()
      .eq("id", parseInt(saleId, 10));

    if (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete sale record");
      return;
    }

    setSalesRecords(salesRecords.filter((s) => s.id !== saleId));
    toast.success("Sale deleted successfully");
    setSaleToDelete(null);
  };

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

          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto">
            {salesRecords.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">
                No sales records found
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
                  {salesRecords.map((sale) => (
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