import { useState } from "react";
import { useApp } from "../context/app-context";
import { supabase } from "../../lib/supabase";
import { getNextNumericId } from "../../lib/db-utils";
import { StockInRecord } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { Plus, TrendingUp, Trash2, Printer } from "lucide-react";

export function StockIn() {
  const { products, setProducts, stockInRecords, setStockInRecords, currentUser, users } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [formData, setFormData] = useState({
    productId: "",
    quantityAdded: "",
    missingQuantity: "",
    crackedQuantity: "",
    dateReceived: new Date().toISOString().split("T")[0],
  });

  const canAdd = currentUser?.role === "Admin" || currentUser?.role === "Owner" || currentUser?.role === "Staff";

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    // Insert stock in record
    const product = products.find((p) => p.id.toString() === formData.productId.toString());
    if (!product) {
      toast.error("Selected product not found.");
      return;
    }

    const quantityAdded = parseInt(formData.quantityAdded, 10);
    const missingQuantity = parseInt(formData.missingQuantity, 10) || 0;
    const crackedQuantity = parseInt(formData.crackedQuantity, 10) || 0;
    const actualStockAdded = quantityAdded - missingQuantity - crackedQuantity;

    if (!formData.productId || isNaN(quantityAdded) || quantityAdded <= 0 || actualStockAdded < 0) {
      toast.error("Please enter a valid stock quantity and select a product.");
      return;
    }

    if (!currentUser) {
      toast.error("Unable to identify the current logged-in user. Please log in again.");
      return;
    }

    const stockInData = {
      id: await getNextNumericId("stock_in_records"),
      product_id: parseInt(formData.productId, 10),
      quantity_added: quantityAdded,
      missing_quantity: missingQuantity,
      cracked_quantity: crackedQuantity,
      date_received: formData.dateReceived,
      user_id: parseInt(currentUser.id, 10),
    };

    console.log("Attempting stock insert with:", stockInData);

    const { data: stockData, error: stockError } = await supabase
      .from("stock_in_records")
      .insert([stockInData])
      .select();

    if (stockError || !stockData || stockData.length === 0) {
      console.error("Stock insert error:", stockError);
      console.error("Stock data:", stockData);
      console.error("Current user:", currentUser);
      console.error("Stock data to insert:", stockInData);
      toast.error(`Failed to add stock record: ${stockError?.message || 'Unknown error'}`);
      return;
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: product.stockQuantity + actualStockAdded })
      .eq("id", parseInt(formData.productId, 10))
      .select();

    if (updateError) {
      console.error("Product stock update error:", updateError);
      toast.error(`Stock record saved, but failed to update product stock: ${updateError.message}`);
      return;
    }

    if (updateError) {
      console.error(updateError);
    }

    const newRecord: StockInRecord = {
      id: stockData[0].id.toString(),
      productId: formData.productId,
      quantityAdded: parseInt(formData.quantityAdded),
      missingQuantity: parseInt(formData.missingQuantity) || 0,
      crackedQuantity: parseInt(formData.crackedQuantity) || 0,
      dateReceived: formData.dateReceived,
      userId: currentUser.id,
    };

    setStockInRecords([newRecord, ...stockInRecords]);
    const updatedProducts = products.map((p) =>
      p.id.toString() === formData.productId.toString()
        ? { ...p, stockQuantity: p.stockQuantity + actualStockAdded }
        : p
    );
    setProducts(updatedProducts);

    toast.success("Stock added successfully");
    setIsDialogOpen(false);
    setFormData({
      productId: "",
      quantityAdded: "",
      missingQuantity: "",
      crackedQuantity: "",
      dateReceived: new Date().toISOString().split("T")[0],
    });
  };

  const getProductName = (productId: string) => {
    return products.find((p) => p.id.toString() === productId.toString())?.name || "Unknown";
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id.toString() === userId.toString())?.name || "Unknown"
  };

  const handleDeleteRecord = async (recordId: string) => {
    // First, get the record to restore stock
    const recordToDelete = stockInRecords.find(r => r.id === recordId);
    if (!recordToDelete) {
      toast.error("Stock record not found");
      return;
    }

    const { error: deleteError } = await supabase
      .from("stock_in_records")
      .delete()
      .eq("id", parseInt(recordId, 10));

    if (deleteError) {
      console.error("Delete error:", deleteError);
      toast.error("Failed to delete record");
      return;
    }

    // Restore stock in database
    const product = products.find(p => p.id.toString() === recordToDelete.productId);
    if (product) {
      const actualStockAdded = recordToDelete.quantityAdded - recordToDelete.missingQuantity - recordToDelete.crackedQuantity;
      const { error: updateError } = await supabase
        .from("products")
        .update({ stock_quantity: product.stockQuantity - actualStockAdded })
        .eq("id", product.id);

      if (updateError) {
        console.error("Stock restore error:", updateError);
        toast.error("Record deleted but failed to restore stock");
        return;
      }

      // Update local state
      setProducts(products.map(p =>
        p.id === product.id
          ? { ...p, stockQuantity: p.stockQuantity - actualStockAdded }
          : p
      ));
    }

    setStockInRecords(stockInRecords.filter((r) => r.id !== recordId));
    toast.success("Record deleted successfully");
    setRecordToDelete(null);
  };

  const handlePrint = () => {
    // Generate stock in report content
    const reportContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0; color: #333;">Egg Management System</h1>
          <h2 style="margin: 5px 0; color: #666;">Stock In Report</h2>
          <p style="margin: 5px 0; color: #888;">Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
        </div>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin-top: 0; color: #333;">Report Summary</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 15px;">
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; border: 1px solid #dee2e6;">
              <div style="font-size: 24px; font-weight: bold; color: #28a745;">${filteredRecords.reduce((sum, r) => sum + r.quantityAdded, 0)}</div>
              <div style="color: #6c757d; font-size: 14px;">Total Stock Received</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; border: 1px solid #dee2e6;">
              <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${filteredRecords.reduce((sum, r) => sum + r.missingQuantity, 0)}</div>
              <div style="color: #6c757d; font-size: 14px;">Missing Units</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; border: 1px solid #dee2e6;">
              <div style="font-size: 24px; font-weight: bold; color: #ffc107;">${filteredRecords.reduce((sum, r) => sum + r.crackedQuantity, 0)}</div>
              <div style="color: #6c757d; font-size: 14px;">Cracked Units</div>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; text-align: center; border: 1px solid #dee2e6;">
              <div style="font-size: 24px; font-weight: bold; color: #007bff;">${filteredRecords.length}</div>
              <div style="color: #6c757d; font-size: 14px;">Total Records</div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #333; border-bottom: 1px solid #dee2e6; padding-bottom: 10px;">Stock In Details for ${selectedDate}</h3>
          ${filteredRecords.length === 0 ? 
            '<p style="text-align: center; color: #6c757d; font-style: italic; padding: 40px;">No stock records found for this date.</p>' :
            `<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: 600; color: #495057;">Product</th>
                  <th style="border: 1px solid #dee2e6; padding: 12px; text-align: center; font-weight: 600; color: #495057;">Quantity Added</th>
                  <th style="border: 1px solid #dee2e6; padding: 12px; text-align: center; font-weight: 600; color: #495057;">Missing</th>
                  <th style="border: 1px solid #dee2e6; padding: 12px; text-align: center; font-weight: 600; color: #495057;">Cracked</th>
                  <th style="border: 1px solid #dee2e6; padding: 12px; text-align: left; font-weight: 600; color: #495057;">Recorded By</th>
                </tr>
              </thead>
              <tbody>
                ${filteredRecords.map((record, index) => `
                  <tr style="background: ${index % 2 === 0 ? '#fff' : '#f8f9fa'};">
                    <td style="border: 1px solid #dee2e6; padding: 12px; font-weight: 500;">${getProductName(record.productId)}</td>
                    <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center; color: #28a745; font-weight: 600;">+${record.quantityAdded}</td>
                    <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center; color: #dc3545; font-weight: 600;">${record.missingQuantity}</td>
                    <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center; color: #ffc107; font-weight: 600;">${record.crackedQuantity}</td>
                    <td style="border: 1px solid #dee2e6; padding: 12px;">${getUserName(record.userId)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr style="background: #e9ecef; font-weight: bold;">
                  <td style="border: 1px solid #dee2e6; padding: 12px; text-align: right; font-weight: 600;">Totals:</td>
                  <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center; font-weight: 600; color: #28a745;">+${filteredRecords.reduce((sum, r) => sum + r.quantityAdded, 0)}</td>
                  <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center; font-weight: 600; color: #dc3545;">${filteredRecords.reduce((sum, r) => sum + r.missingQuantity, 0)}</td>
                  <td style="border: 1px solid #dee2e6; padding: 12px; text-align: center; font-weight: 600; color: #ffc107;">${filteredRecords.reduce((sum, r) => sum + r.crackedQuantity, 0)}</td>
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
          <title>Stock In Report - ${selectedDate}</title>
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

  // Sort records by date (newest first)
  const sortedRecords = [...stockInRecords].sort(
    (a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime()
  );

  // Filter records by selected date
  const filteredRecords = sortedRecords.filter((record) => record.dateReceived === selectedDate);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Stock In</h1>
          <p className="text-gray-500">Record incoming inventory</p>
        </div>
        {canAdd && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Record Stock Receipt</DialogTitle>
                <DialogDescription>Enter the details of the stock received.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddStock} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, productId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.productId && (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-700">
                    {(() => {
                      const selectedProduct = products.find((p) => p.id.toString() === formData.productId.toString());
                      if (!selectedProduct) return null;
                      return (
                        <div className="space-y-1">
                          <p className="font-medium">Selected product</p>
                          <p>Name: {selectedProduct.name}</p>
                          <p>Stock: {selectedProduct.stockQuantity} pcs</p>
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity Received</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantityAdded}
                    onChange={(e) =>
                      setFormData({ ...formData, quantityAdded: e.target.value })
                    }
                    required
                    placeholder="0"
                    min="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="missing">Missing Quantity</Label>
                  <Input
                    id="missing"
                    type="number"
                    value={formData.missingQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, missingQuantity: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cracked">Cracked Quantity</Label>
                  <Input
                    id="cracked"
                    type="number"
                    value={formData.crackedQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, crackedQuantity: e.target.value })
                    }
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date Received</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.dateReceived}
                    onChange={(e) =>
                      setFormData({ ...formData, dateReceived: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Record Stock
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
        )}
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            Stock In Records
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
                  <TableHead>Quantity Added</TableHead>
                  <TableHead>Missing</TableHead>
                  <TableHead>Cracked</TableHead>
                  <TableHead>Date Received</TableHead>
                  <TableHead>Recorded By</TableHead>
                  {(currentUser?.role === "Admin" || currentUser?.role === "Owner") && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={currentUser?.role === "Admin" || currentUser?.role === "Owner" ? 7 : 6} className="text-center text-gray-500 py-8">
                      No stock records for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {getProductName(record.productId)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                          +{record.quantityAdded}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600">
                          {record.missingQuantity || 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-orange-600">
                          {record.crackedQuantity || 0}
                        </span>
                      </TableCell>
                      <TableCell>{record.dateReceived}</TableCell>
                      <TableCell className="text-gray-500">
                        {getUserName(record.userId)}
                      </TableCell>
                      {(currentUser?.role === "Admin" || currentUser?.role === "Owner") && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRecordToDelete(record.id)}
                            className="hover:text-red-600"
                            title="Delete record"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>



      <AlertDialog open={!!recordToDelete} onOpenChange={(open) => !open && setRecordToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stock record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => recordToDelete && handleDeleteRecord(recordToDelete)}
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