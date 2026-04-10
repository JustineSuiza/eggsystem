import { useState } from "react";
import { useApp } from "../context/app-context";
import { supabase } from "../../lib/supabase";
import { StockInRecord } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { Plus, TrendingUp } from "lucide-react";

export function StockIn() {
  const { products, setProducts, stockInRecords, setStockInRecords, currentUser, users } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    quantityAdded: "",
    missingQuantity: "",
    crackedQuantity: "",
    dateReceived: new Date().toISOString().split("T")[0],
  });

  const canAdd = currentUser?.role === "Admin" || currentUser?.role === "Staff";

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    const actualStockAdded = parseInt(formData.quantityAdded) - (parseInt(formData.missingQuantity) || 0) - (parseInt(formData.crackedQuantity) || 0);

    // Insert stock in record
    const stockInData = {
      product_id: parseInt(formData.productId),
      quantity_added: parseInt(formData.quantityAdded),
      missing_quantity: parseInt(formData.missingQuantity) || 0,
      cracked_quantity: parseInt(formData.crackedQuantity) || 0,
      date_received: formData.dateReceived,
      user_id: currentUser.id,
    };

    const { data: stockData, error: stockError } = await supabase
      .from("stock_in_records")
      .insert([stockInData])
      .select();

    if (stockError || !stockData || stockData.length === 0) {
      console.error(stockError);
      toast.error("Failed to add stock record");
      return;
    }

    // Update product stock quantity
    const { error: updateError } = await supabase
      .from("products")
      .update({ stock_quantity: null })
      .eq("id", parseInt(formData.productId))
      .select();

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
      p.id === formData.productId
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
    return products.find((p) => p.id === productId)?.name || "Unknown";
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.name || "Unknown";
  };

  // Sort records by date (newest first)
  const sortedRecords = [...stockInRecords].sort(
    (a, b) => new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime()
  );

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
        <CardHeader>
          <CardTitle>Stock In Records</CardTitle>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                      No stock records yet
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedRecords.map((record) => (
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