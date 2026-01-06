import { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOrders, useUpdateOrder } from "@/hooks/useAdminData";
import { OrderDialog } from "@/components/admin/dialogs/OrderDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { bn } from "date-fns/locale";

const AdminOrders = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<any>(null);

  const { data: orders, isLoading } = useOrders();
  const updateOrder = useUpdateOrder();

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: "পেন্ডিং", className: "bg-yellow-100 text-yellow-700" },
      confirmed: { label: "কনফার্মড", className: "bg-blue-100 text-blue-700" },
      processing: { label: "প্রসেসিং", className: "bg-purple-100 text-purple-700" },
      shipped: { label: "শিপড", className: "bg-indigo-100 text-indigo-700" },
      delivered: { label: "ডেলিভার্ড", className: "bg-green-100 text-green-700" },
      cancelled: { label: "বাতিল", className: "bg-red-100 text-red-700" },
    };
    const { label, className } = config[status] || config.pending;
    return <Badge className={className}>{label}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "outline" | "default" | "secondary" }> = {
      unpaid: { label: "আনপেইড", variant: "outline" },
      partial: { label: "আংশিক", variant: "secondary" },
      paid: { label: "পেইড", variant: "default" },
      refunded: { label: "রিফান্ড", variant: "outline" },
    };
    const { label, variant } = config[status] || config.unpaid;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const filteredOrders = orders?.filter((order: any) => {
    if (statusFilter !== "all" && order.order_status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        order.order_number?.toLowerCase().includes(query) ||
        order.customer_name?.toLowerCase().includes(query) ||
        order.customer_phone?.includes(query)
      );
    }
    return true;
  }) || [];

  const handleEdit = (order: any) => {
    setEditOrder(order);
    setDialogOpen(true);
  };

  const handleStatusChange = async (id: string, order_status: string) => {
    await updateOrder.mutateAsync({ id, order_status });
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
          <h1 className="text-2xl font-bold text-foreground">অর্ডার ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground">সকল অর্ডার দেখুন এবং পরিচালনা করুন ({orders?.length || 0}টি)</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditOrder(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" />
          নতুন অর্ডার
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="নাম, ফোন বা অর্ডার নম্বর দিয়ে খুঁজুন..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="স্ট্যাটাস" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">সব অর্ডার</SelectItem>
            <SelectItem value="pending">পেন্ডিং</SelectItem>
            <SelectItem value="confirmed">কনফার্মড</SelectItem>
            <SelectItem value="processing">প্রসেসিং</SelectItem>
            <SelectItem value="shipped">শিপড</SelectItem>
            <SelectItem value="delivered">ডেলিভার্ড</SelectItem>
            <SelectItem value="cancelled">বাতিল</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>অর্ডার</TableHead>
              <TableHead>কাস্টমার</TableHead>
              <TableHead className="text-center">পণ্য</TableHead>
              <TableHead className="text-right">মোট</TableHead>
              <TableHead className="text-center">স্ট্যাটাস</TableHead>
              <TableHead className="text-center">পেমেন্ট</TableHead>
              <TableHead className="text-center">তারিখ</TableHead>
              <TableHead className="text-right">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  কোনো অর্ডার পাওয়া যায়নি
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order: any) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium font-mono">{order.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{order.order_items?.[0]?.count || 0}টি</TableCell>
                  <TableCell className="text-right font-medium">
                    ৳{Number(order.total_amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(order.order_status)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getPaymentBadge(order.payment_status)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {format(new Date(order.created_at), "dd MMM, yyyy", { locale: bn })}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          বিস্তারিত / এডিট
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, "confirmed")}>
                          কনফার্ম করুন
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, "shipped")}>
                          শিপ করুন
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(order.id, "delivered")}>
                          ডেলিভার্ড
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleStatusChange(order.id, "cancelled")}
                        >
                          অর্ডার বাতিল
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {filteredOrders.length}টি অর্ডার দেখানো হচ্ছে
          </p>
        </div>
      </div>

      <OrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={editOrder}
      />
    </div>
  );
};

export default AdminOrders;
