import { useState } from "react";
import { useApp } from "../context/app-context";
import { Product } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Badge } from "./ui/badge";

export function Products() {
  const { products, setProducts, currentUser } = useApp();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    trayPrice: "",
    stockQuantity: "",
  });

  const canModify = currentUser?.role === "Admin" || currentUser?.role === "Staff";

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name,
      price: parseFloat(formData.price),
      trayPrice: parseFloat(formData.trayPrice),
      stockQuantity: parseInt(formData.stockQuantity),
      dateAdded: new Date().toISOString().split("T")[0],
    };

    setProducts([...products, newProduct]);
    toast.success("Product added successfully");
    setIsAddDialogOpen(false);
    setFormData({ name: "", price: "", trayPrice: "", stockQuantity: "" });
  };

  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;

    const updatedProducts = products.map((p) =>
      p.id === editingProduct.id
        ? {
            ...p,
            name: formData.name,
            price: parseFloat(formData.price),
            trayPrice: parseFloat(formData.trayPrice),
            stockQuantity: parseInt(formData.stockQuantity),
          }
        : p
    );

    setProducts(updatedProducts);
    toast.success("Product updated successfully");
    setIsEditDialogOpen(false);
    setEditingProduct(null);
    setFormData({ name: "", price: "", trayPrice: "", stockQuantity: "" });
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== productId));
      toast.success("Product deleted successfully");
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      trayPrice: product.trayPrice.toString(),
      stockQuantity: product.stockQuantity.toString(),
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold mb-2">Products</h1>
          <p className="text-gray-500">Manage your egg products</p>
        </div>
        {canModify && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new egg product to your inventory.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Extra Large Eggs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (pcs)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="trayPrice">Price (tray)</Label>
                  <Input
                    id="trayPrice"
                    type="number"
                    step="0.01"
                    value={formData.trayPrice}
                    onChange={(e) => setFormData({ ...formData, trayPrice: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Initial Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, stockQuantity: e.target.value })
                    }
                    required
                    placeholder="0"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Add Product</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
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
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Price (pcs)</TableHead>
                  <TableHead>Price (tray)</TableHead>
                  <TableHead>Stock Quantity</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Status</TableHead>
                  {canModify && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>₱{product.price.toFixed(2)}</TableCell>
                    <TableCell>₱{product.trayPrice.toFixed(2)}</TableCell>
                    <TableCell>{product.stockQuantity}</TableCell>
                    <TableCell>{product.dateAdded}</TableCell>
                    <TableCell>
                      {product.stockQuantity === 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : product.stockQuantity <= 50 ? (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Limited</Badge>
                      ) : (
                        <Badge className="bg-green-500 hover:bg-green-600">Available</Badge>
                      )}
                    </TableCell>
                    {canModify && (
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price (pcs)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-trayPrice">Price (tray)</Label>
              <Input
                id="edit-trayPrice"
                type="number"
                step="0.01"
                value={formData.trayPrice}
                onChange={(e) => setFormData({ ...formData, trayPrice: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock Quantity</Label>
              <Input
                id="edit-stock"
                type="number"
                value={formData.stockQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, stockQuantity: e.target.value })
                }
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Save Changes</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}