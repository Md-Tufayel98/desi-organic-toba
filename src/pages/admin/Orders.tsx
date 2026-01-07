import { useState } from "react";
import {
  Search,
  Filter,
  Eye,
  MoreHorizontal,
  Plus,
  Truck,
  ExternalLink,
  Loader2,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuSeparator,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrders, useUpdateOrder } from "@/hooks/useAdminData";
import { useSendToSteadfast, useSteadfastBalance, useCheckSteadfastStatus } from "@/hooks/useSteadfast";
import { useCourierCheck } from "@/hooks/useBDCourier";
import { OrderDialog } from "@/components/admin/dialogs/OrderDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { toast } from "sonner";

const AdminOrders = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isBulkSending, setIsBulkSending] = useState(false);

  const [fraudCheckResult, setFraudCheckResult] = useState<any>(null);
  const [fraudCheckPhone, setFraudCheckPhone] = useState("");
  const [fraudDialogOpen, setFraudDialogOpen] = useState(false);

  const { data: orders, isLoading } = useOrders();
  const updateOrder = useUpdateOrder();
  const sendToSteadfast = useSendToSteadfast();
  const { data: steadfastBalance } = useSteadfastBalance();
  const checkStatus = useCheckSteadfastStatus();
  const courierCheck = useCourierCheck();

  const handleFraudCheck = async (phone: string) => {
    setFraudCheckPhone(phone);
    setFraudCheckResult(null);
    setFraudDialogOpen(true);
    
    try {
      const result = await courierCheck.mutateAsync(phone);
      setFraudCheckResult(result);
    } catch (error) {
      // Error is handled in the hook
    }
  };

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

  const getSteadfastBadge = (status: string | null) => {
    if (!status) return null;
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: "পেন্ডিং", className: "bg-orange-100 text-orange-700" },
      in_review: { label: "রিভিউতে", className: "bg-blue-100 text-blue-700" },
      delivered: { label: "ডেলিভার্ড", className: "bg-green-100 text-green-700" },
      partial_delivered: { label: "আংশিক", className: "bg-yellow-100 text-yellow-700" },
      cancelled: { label: "বাতিল", className: "bg-red-100 text-red-700" },
      hold: { label: "হোল্ড", className: "bg-gray-100 text-gray-700" },
    };
    const { label, className } = config[status] || { label: status, className: "bg-gray-100 text-gray-700" };
    return <Badge className={className}>{label}</Badge>;
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

  // Get orders eligible for Steadfast (not already sent, not cancelled/delivered/refunded)
  const eligibleForSteadfast = filteredOrders.filter(
    (order: any) => !order.steadfast_consignment_id && 
    !["delivered", "cancelled", "refunded"].includes(order.order_status)
  );

  // Get selected orders that are eligible
  const selectedEligibleOrders = eligibleForSteadfast.filter(
    (order: any) => selectedOrders.has(order.id)
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrders(new Set(eligibleForSteadfast.map((o: any) => o.id)));
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleEdit = (order: any) => {
    setEditOrder(order);
    setDialogOpen(true);
  };

  const handleStatusChange = async (id: string, order_status: string) => {
    await updateOrder.mutateAsync({ id, order_status });
  };

  const handleSendToSteadfast = async (order: any) => {
    if (order.steadfast_consignment_id) {
      toast.error("এই অর্ডার ইতিমধ্যে স্টেডফাস্ট এ পাঠানো হয়েছে");
      return;
    }
    await sendToSteadfast.mutateAsync(order);
  };

  const handleBulkSendToSteadfast = async () => {
    if (selectedEligibleOrders.length === 0) {
      toast.error("কোনো অর্ডার সিলেক্ট করা হয়নি");
      return;
    }

    setIsBulkSending(true);
    let successCount = 0;
    let failCount = 0;

    for (const order of selectedEligibleOrders) {
      try {
        await sendToSteadfast.mutateAsync(order);
        successCount++;
      } catch (error) {
        console.error(`Failed to send order ${order.order_number}:`, error);
        failCount++;
      }
    }

    setIsBulkSending(false);
    setSelectedOrders(new Set());

    if (successCount > 0 && failCount === 0) {
      toast.success(`${successCount}টি অর্ডার সফলভাবে স্টেডফাস্ট এ পাঠানো হয়েছে`);
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(`${successCount}টি সফল, ${failCount}টি ব্যর্থ`);
    } else {
      toast.error(`সব অর্ডার পাঠাতে ব্যর্থ হয়েছে`);
    }
  };

  const handleTrackOrder = async (order: any) => {
    if (!order.steadfast_consignment_id) {
      toast.error("ট্র্যাকিং তথ্য পাওয়া যায়নি");
      return;
    }
    
    const result = await checkStatus.mutateAsync({ 
      consignmentId: order.steadfast_consignment_id 
    });
    
    if (result.success) {
      toast.info(`ডেলিভারি স্ট্যাটাস: ${result.delivery_status}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const allEligibleSelected = eligibleForSteadfast.length > 0 && 
    eligibleForSteadfast.every((o: any) => selectedOrders.has(o.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">অর্ডার ম্যানেজমেন্ট</h1>
          <p className="text-muted-foreground">সকল অর্ডার দেখুন এবং পরিচালনা করুন ({orders?.length || 0}টি)</p>
        </div>
        <div className="flex items-center gap-3">
          {steadfastBalance !== undefined && steadfastBalance !== null && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">৳{steadfastBalance.toLocaleString()}</span>
            </div>
          )}
          <Button className="gap-2" onClick={() => { setEditOrder(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" />
            নতুন অর্ডার
          </Button>
        </div>
      </div>

      {/* Filters + Bulk Actions */}
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

        {/* Bulk Send Button */}
        {selectedEligibleOrders.length > 0 && (
          <Button 
            className="gap-2" 
            onClick={handleBulkSendToSteadfast}
            disabled={isBulkSending}
          >
            {isBulkSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Truck className="h-4 w-4" />
            )}
            {isBulkSending 
              ? `পাঠানো হচ্ছে...` 
              : `${selectedEligibleOrders.length}টি স্টেডফাস্ট এ পাঠান`}
          </Button>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allEligibleSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="সব সিলেক্ট করুন"
                />
              </TableHead>
              <TableHead>অর্ডার</TableHead>
              <TableHead>কাস্টমার</TableHead>
              <TableHead className="text-center">পণ্য</TableHead>
              <TableHead className="text-right">মোট</TableHead>
              <TableHead className="text-center">স্ট্যাটাস</TableHead>
              <TableHead className="text-center">কুরিয়ার</TableHead>
              <TableHead className="text-center">পেমেন্ট</TableHead>
              <TableHead className="text-center">তারিখ</TableHead>
              <TableHead className="text-right">অ্যাকশন</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  কোনো অর্ডার পাওয়া যায়নি
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order: any) => {
                const isEligible = !order.steadfast_consignment_id && 
                  !["delivered", "cancelled", "refunded"].includes(order.order_status);
                
                return (
                  <TableRow key={order.id}>
                    <TableCell>
                      {isEligible ? (
                        <Checkbox
                          checked={selectedOrders.has(order.id)}
                          onCheckedChange={(checked) => handleSelectOrder(order.id, !!checked)}
                          aria-label={`সিলেক্ট ${order.order_number}`}
                        />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium font-mono">{order.order_number}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{order.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleFraudCheck(order.customer_phone)}
                          title="ফ্রড চেক"
                        >
                          <ShieldCheck className="h-4 w-4 text-orange-500" />
                        </Button>
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
                      {order.steadfast_consignment_id ? (
                        <div className="flex flex-col items-center gap-1">
                          {getSteadfastBadge(order.steadfast_status)}
                          <a
                            href={order.steadfast_tracking_code 
                              ? `https://steadfast.com.bd/t/${order.steadfast_tracking_code}`
                              : `https://steadfast.com.bd/t/${order.steadfast_consignment_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            {order.steadfast_consignment_id}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ) : (
                        // Show Send to Steadfast button if not yet sent
                        !["delivered", "cancelled", "refunded"].includes(order.order_status) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={() => handleSendToSteadfast(order)}
                            disabled={sendToSteadfast.isPending}
                          >
                            {sendToSteadfast.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Truck className="h-3 w-3" />
                            )}
                            পাঠান
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )
                      )}
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleStatusChange(order.id, "confirmed")}>
                            কনফার্ম করুন
                          </DropdownMenuItem>
                          
                          {/* Steadfast Options */}
                          {!order.steadfast_consignment_id && (order.order_status === "confirmed" || order.order_status === "processing") && (
                            <DropdownMenuItem 
                              onClick={() => handleSendToSteadfast(order)}
                              disabled={sendToSteadfast.isPending}
                            >
                              {sendToSteadfast.isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Truck className="h-4 w-4 mr-2" />
                              )}
                              স্টেডফাস্ট এ পাঠান
                            </DropdownMenuItem>
                          )}
                          
                          {order.steadfast_consignment_id && (
                            <DropdownMenuItem onClick={() => handleTrackOrder(order)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              ট্র্যাক করুন
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
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
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {filteredOrders.length}টি অর্ডার দেখানো হচ্ছে
            {selectedOrders.size > 0 && ` • ${selectedOrders.size}টি সিলেক্ট করা হয়েছে`}
          </p>
        </div>
      </div>

      <OrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        order={editOrder}
      />

      {/* Fraud Check Dialog */}
      <Dialog open={fraudDialogOpen} onOpenChange={setFraudDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-orange-500" />
              ফ্রড চেক রেজাল্ট
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ফোন নম্বর: <span className="font-mono font-medium text-foreground">{fraudCheckPhone}</span>
            </p>
            
            {courierCheck.isPending && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {fraudCheckResult && (
              <div className="space-y-3">
                {fraudCheckResult.status === "success" && fraudCheckResult.data?.couriers?.length > 0 ? (
                  <>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm font-medium text-red-700">
                        ⚠️ {fraudCheckResult.data.couriers.length}টি কুরিয়ার এ ইতিহাস পাওয়া গেছে
                      </p>
                    </div>
                    <div className="space-y-2">
                      {fraudCheckResult.data.couriers.map((courier: any, index: number) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                        >
                          {courier.logo && (
                            <img 
                              src={courier.logo} 
                              alt={courier.name} 
                              className="h-8 w-8 object-contain"
                            />
                          )}
                          <div>
                            <p className="font-medium">{courier.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{courier.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : fraudCheckResult.status === "success" ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-700">
                      ✅ এই নম্বরে কোনো কুরিয়ার ইতিহাস পাওয়া যায়নি
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      চেক করতে সমস্যা হয়েছে
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
