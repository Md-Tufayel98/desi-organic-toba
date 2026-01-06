import { useState } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProducts, useUpdateProduct, useDeleteProduct } from "@/hooks/useAdminData";
import { ProductDialog } from "@/components/admin/dialogs/ProductDialog";
import { Skeleton } from "@/components/ui/skeleton";

const AdminProducts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: products, isLoading } = useProducts();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const filteredProducts = products?.filter((product: any) =>
    product.name_bn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleEdit = (product: any) => {
    setEditProduct(product);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteProduct.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleToggle = async (id: string, field: string, value: boolean) => {
    await updateProduct.mutateAsync({ id, [field]: value });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">পণ্য ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground">সকল পণ্য দেখুন এবং পরিচালনা করুন ({products?.length || 0}টি)</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditProduct(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          নতুন পণ্য যোগ করুন
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="পণ্য খুঁজুন..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>পণ্য</TableHead>
              <TableHead>ক্যাটাগরি</TableHead>
              <TableHead className="text-right">দাম</TableHead>
              <TableHead className="text-center">স্টক</TableHead>
              <TableHead className="text-center">বিশেষ</TableHead>
              <TableHead className="text-center">সক্রিয়</TableHead>
              <TableHead className="text-right">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product: any) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name_bn}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <span className="font-medium">{product.name_bn}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{product.categories?.name_bn || "—"}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {product.sale_price ? (
                    <div>
                      <span className="font-medium text-primary">৳{product.sale_price}</span>
                      <span className="text-sm text-muted-foreground line-through ml-2">৳{product.base_price}</span>
                    </div>
                  ) : (
                    <span className="font-medium">৳{product.base_price}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <span className={`font-medium ${product.stock_quantity <= 10 ? "text-destructive" : "text-foreground"}`}>
                    {product.stock_quantity}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={product.is_featured}
                    onCheckedChange={(v) => handleToggle(product.id, "is_featured", v)}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={product.is_active}
                    onCheckedChange={(v) => handleToggle(product.id, "is_active", v)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(product)}>
                        <Edit className="h-4 w-4 mr-2" />
                        এডিট করুন
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(product.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        মুছে ফেলুন
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editProduct}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>আপনি কি নিশ্চিত?</AlertDialogTitle>
            <AlertDialogDescription>
              এই পণ্যটি স্থায়ীভাবে মুছে ফেলা হবে। এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              মুছে ফেলুন
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminProducts;
