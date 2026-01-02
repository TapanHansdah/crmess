'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit2 } from 'lucide-react';

export default function ProductList({ products = [], onDelete = () => {}, onEdit = () => {} }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.category_id || '').toString().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const getCategoryBadge = (categoryId) => {
    const categories = {
      1: 'Software',
      2: 'Services',
      3: 'Hardware',
      4: 'Support',
      5: 'Consulting'
    };
    return categories[categoryId] || 'Other';
  };

  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No products found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Input
          placeholder="Search by product name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Margin</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => {
              const margin = product.price && product.cost 
                ? Math.round(((product.price - product.cost) / product.price) * 100)
                : 0;
              
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <span className="font-medium">{product.name || 'Unnamed'}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.sku || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getCategoryBadge(product.category_id)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    ₹{(product.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    ₹{(product.cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={margin >= 40 ? 'default' : 'secondary'}>
                      {margin}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={product.in_stock > 10 ? 'text-green-600' : 'text-yellow-600'}>
                      {product.in_stock || 0} units
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu 
                      open={openDropdownId === product.id} 
                      onOpenChange={(open) => {
                        setOpenDropdownId(open ? product.id : null);
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                        <DropdownMenuItem onClick={(e) => { 
                          e.stopPropagation(); 
                          setOpenDropdownId(null);
                          onEdit(product); 
                        }}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setOpenDropdownId(null);
                            onDelete(product.id); 
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {filteredProducts.length} of {products.length} products
      </div>
    </div>
  );
}
