'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import ProductList from '@/components/products/product-list';
import { fetchProducts, deleteProduct, addProduct, updateProduct } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    cost: '',
    in_stock: '',
    category_id: ''
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setError(null);
      const data = await fetchProducts();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const closeDialog = useCallback(() => {
    setShowDialog(false);
    setEditingId(null);
    setFormData({
      name: '',
      sku: '',
      price: '',
      cost: '',
      in_stock: true,
      category_id: ''
    });
  }, []);

  const handleOpenDialog = useCallback((product = null) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        price: product.price || '',
        cost: product.cost || '',
        in_stock: product.in_stock || '',
        category_id: product.category_id || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        sku: '',
        price: '',
        cost: '',
        in_stock: '',
        category_id: ''
      });
    }
    setShowDialog(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const productData = {
        name: formData.name,
        sku: formData.sku,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        in_stock: parseInt(formData.in_stock) || 0,
        category_id: parseInt(formData.category_id) || 1
      };

      let result;
      if (editingId) {
        // Pass userId when updating
        result = await updateProduct(editingId, productData, user?.id);
      } else {
        // Pass userId when adding
        result = await addProduct(productData, user?.id);
      }

      if (result) {
        setShowDialog(false);
        setEditingId(null);
        setFormData({
          name: '',
          sku: '',
          price: '',
          cost: '',
          in_stock: true,
          category_id: ''
        });
        // Wait for dialog to fully close before refetching
        setTimeout(() => loadProducts(), 100);
      } else {
        setError('Failed to save product');
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save product');
    }
  }, [editingId, formData]);

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const success = await deleteProduct(id);
      if (success) {
        // Wait for any pending state updates before refetching
        setTimeout(() => loadProducts(), 100);
      } else {
        setError('Failed to delete product');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete product');
    }
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 p-8" suppressHydrationWarning>
        <div className="flex items-center justify-between" suppressHydrationWarning>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-2">Manage your product catalog</p>
          </div>
          <Button onClick={() => handleOpenDialog()} suppressHydrationWarning>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8" suppressHydrationWarning>
      <div className="flex items-center justify-between" suppressHydrationWarning>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-2">Manage your product catalog</p>
        </div>
        <Button onClick={() => handleOpenDialog()} suppressHydrationWarning>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      <ProductList 
        products={products} 
        onDelete={handleDelete}
        onEdit={handleOpenDialog}
      />

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter product name"
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g., PROD-001"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="cost">Cost *</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.in_stock}
                  onChange={(e) => setFormData({ ...formData, in_stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  type="number"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Update' : 'Create'} Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
