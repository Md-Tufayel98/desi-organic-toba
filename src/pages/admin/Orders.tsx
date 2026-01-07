import { useState, useEffect, useCallback } from "react";
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
  Link,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useOrders, useUpdateOrder } from "@/hooks/useAdminData";
import { useSendToSteadfast, useSteadfastBalance, useCheckSteadfastStatus } from "@/hooks/useSteadfast";
import { useCourierCheck, type ParsedCourierResult } from "@/hooks/useBDCourier";
import { OrderDialog } from "@/components/admin/dialogs/OrderDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { bn } from "date-fns/locale";
import { toast } from "sonner";
import { createChargeClientSide } from "@/lib/uddoktapay";

// Risk badge component for cached fraud data
interface RiskBadge {
  label: string;
  className: string;
}

const getRiskBadgeFromResult = (result: ParsedCourierResult | null): RiskBadge => {
  if (!result || result.status !== "success" || !result.summary) {
    return { label: "নতুন", className: "bg-gray-100 text-gray-600" };
  }
  
  if (result.summary.total_parcel === 0) {
    return { label: "নতুন", className: "bg-gray-100 text-gray-600" };
  }
  
  const rate = result.summary.success_ratio;
  if (rate >= 80) {
    return { label: "নিরাপদ", className: "bg-green-100 text-green-700" };
  } else if (rate >= 50) {
    return { label: "সতর্ক", className: "bg-yellow-100 text-yellow-700" };
  } else {
    return { label: "ঝুঁকিপূর্ণ", className: "bg-red-100 text-red-700" };
  }
};

const AdminOrders = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isBulkSending, setIsBulkSending] = useState(false);

  const [fraudCheckResult, setFraudCheckResult] = useState<ParsedCourierResult | null>(null);
  const [fraudCheckPhone, setFraudCheckPhone] = useState("");
  const [fraudDialogOpen, setFraudDialogOpen] = useState(false);

  // Cached risk data for each phone number
  const [riskCache, setRiskCache] = useState<Record<string, ParsedCourierResult>>({});

  // Confirmation warning state
  const [confirmWarningOpen, setConfirmWarningOpen] = useState(false);
  const [pendingConfirmOrder, setPendingConfirmOrder] = useState<any>(null);
  const [confirmFraudResult, setConfirmFraudResult] = useState<ParsedCourierResult | null>(null);
  const [isCheckingForConfirm, setIsCheckingForConfirm] = useState(false);

  // Payment link dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isGeneratingPaymentLink, setIsGeneratingPaymentLink] = useState(false);
  const [generatedPaymentUrl, setGeneratedPaymentUrl] = useState("");

  const { data: orders, isLoading } = useOrders();
  const updateOrder = useUpdateOrder();
  const sendToSteadfast = useSendToSteadfast();
  const { data: steadfastBalance } = useSteadfastBalance();
  const checkStatus = useCheckSteadfastStatus();
  const courierCheck = useCourierCheck();

  // Background check for visible orders
  const checkRiskForPhone = useCallback(async (phone: string) => {
    if (!phone || riskCache[phone]) return;
    
    try {
      const result = await courierCheck.mutateAsync(phone);
      setRiskCache(prev => ({ ...prev, [phone]: result }));
    } catch (error) {
      // Silently fail for background checks
    }
  }, [riskCache, courierCheck]);

  // Check risk for all visible orders on load
  useEffect(() => {
    if (orders && orders.length > 0) {
      const uniquePhones = [...new Set(orders.map((o: any) => o.customer_phone).filter(Boolean))];
      // Check first 10 phones to avoid rate limiting
      uniquePhones.slice(0, 10).forEach(phone => {
        if (!riskCache[phone]) {
          checkRiskForPhone(phone);
        }
      });
    }
  }, [orders]);

  const handleFraudCheck = async (phone: string) => {
    setFraudCheckPhone(phone);
    setFraudCheckResult(null);
    setFraudDialogOpen(true);
    
    try {
      const result = await courierCheck.mutateAsync(phone);
      setFraudCheckResult(result);
      // Update cache
      setRiskCache(prev => ({ ...prev, [phone]: result }));
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

  const handleStatusChange = async (id: string, order_status: string, order?: any) => {
    // If confirming, check fraud first
    if (order_status === "confirmed" && order) {
      setIsCheckingForConfirm(true);
      setPendingConfirmOrder({ id, order });
      setConfirmFraudResult(null);

      try {
        const result = await courierCheck.mutateAsync(order.customer_phone);
        setRiskCache(prev => ({ ...prev, [order.customer_phone]: result }));

        // Check if we should warn (success rate < 70% or cancelled > 5)
        if (
          result.status === "success" && 
          result.summary && 
          result.summary.total_parcel > 0 &&
          (result.summary.success_ratio < 70 || result.summary.cancelled_parcel > 5)
        ) {
          setConfirmFraudResult(result);
          setConfirmWarningOpen(true);
          setIsCheckingForConfirm(false);
          return;
        }
      } catch (error) {
        // If check fails, proceed anyway
      }
      
      setIsCheckingForConfirm(false);
    }

    await updateOrder.mutateAsync({ id, order_status });
  };

  const handleProceedConfirmAnyway = async () => {
    if (pendingConfirmOrder) {
      await updateOrder.mutateAsync({ 
        id: pendingConfirmOrder.id, 
        order_status: "confirmed" 
      });
    }
    setConfirmWarningOpen(false);
    setPendingConfirmOrder(null);
    setConfirmFraudResult(null);
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

  // Payment link generation
  const handleOpenPaymentDialog = (order: any) => {
    setPaymentOrder(order);
    // Default to delivery charge or 10% of total
    const defaultAmount = order.delivery_charge || Math.round(order.total_amount * 0.1);
    setPaymentAmount(defaultAmount.toString());
    setGeneratedPaymentUrl("");
    setPaymentDialogOpen(true);
  };

  const handleGeneratePaymentLink = async () => {
    if (!paymentOrder || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("সঠিক পরিমাণ লিখুন");
      return;
    }

    setIsGeneratingPaymentLink(true);

    try {
      const baseUrl = window.location.origin;
      const result = await createChargeClientSide({
        fullName: paymentOrder.customer_name,
        email: paymentOrder.customer_email || "customer@example.com",
        amount,
        orderId: paymentOrder.id,
        redirectUrl: `${baseUrl}/payment-success?orderId=${paymentOrder.id}`,
        cancelUrl: `${baseUrl}/order-confirmation?orderId=${paymentOrder.id}`,
      });

      if (result.success && result.payment_url) {
        setGeneratedPaymentUrl(result.payment_url);
        toast.success("পেমেন্ট লিংক তৈরি হয়েছে");
      } else {
        toast.error(result.message || "পেমেন্ট লিংক তৈরি করতে ব্যর্থ");
      }
    } catch (error) {
      console.error("Payment link error:", error);
      toast.error("পেমেন্ট লিংক তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setIsGeneratingPaymentLink(false);
    }
  };

  const handleCopyPaymentLink = () => {
    navigator.clipboard.writeText(generatedPaymentUrl);
    toast.success("লিংক কপি হয়েছে");
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
                const cachedRisk = riskCache[order.customer_phone];
                const riskBadge = getRiskBadgeFromResult(cachedRisk);
                
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
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{order.customer_name}</p>
                            {/* Risk Badge */}
                            <Badge className={`text-xs ${riskBadge.className}`}>
                              {riskBadge.label}
                            </Badge>
                          </div>
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
                      <div className="flex flex-col items-center gap-1">
                        {getPaymentBadge(order.payment_status)}
                        {/* Payment link button for unpaid/partial orders */}
                        {(order.payment_status === "unpaid" || order.payment_status === "partial") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs gap-1"
                            onClick={() => handleOpenPaymentDialog(order)}
                          >
                            <Link className="h-3 w-3" />
                            পেমেন্ট লিংক
                          </Button>
                        )}
                      </div>
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
                          <DropdownMenuItem 
                            onClick={() => handleStatusChange(order.id, "confirmed", order)}
                            disabled={isCheckingForConfirm}
                          >
                            {isCheckingForConfirm && pendingConfirmOrder?.id === order.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : null}
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
                {fraudCheckResult.status === "success" && fraudCheckResult.summary && fraudCheckResult.summary.total_parcel > 0 ? (
                  <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <p className="text-lg font-bold text-blue-700">{fraudCheckResult.summary.total_parcel}</p>
                        <p className="text-xs text-blue-600">মোট অর্ডার</p>
                      </div>
                      <div className="p-2 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-700">{fraudCheckResult.summary.success_parcel}</p>
                        <p className="text-xs text-green-600">সফল</p>
                      </div>
                      <div className="p-2 bg-red-50 rounded-lg">
                        <p className="text-lg font-bold text-red-700">{fraudCheckResult.summary.cancelled_parcel}</p>
                        <p className="text-xs text-red-600">বাতিল</p>
                      </div>
                    </div>

                    {/* Success Rate */}
                    <div className={`p-3 rounded-lg border ${
                      fraudCheckResult.summary.success_ratio >= 80 
                        ? "bg-green-50 border-green-200" 
                        : fraudCheckResult.summary.success_ratio >= 50 
                        ? "bg-yellow-50 border-yellow-200"
                        : "bg-red-50 border-red-200"
                    }`}>
                      <p className={`text-sm font-medium ${
                        fraudCheckResult.summary.success_ratio >= 80 
                          ? "text-green-700" 
                          : fraudCheckResult.summary.success_ratio >= 50 
                          ? "text-yellow-700"
                          : "text-red-700"
                      }`}>
                        সাকসেস রেট: {fraudCheckResult.summary.success_ratio}%
                      </p>
                    </div>

                    {/* Courier Breakdown */}
                    {fraudCheckResult.couriers.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">কুরিয়ার বিবরণ:</p>
                        {fraudCheckResult.couriers.map((courier: any, index: number) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-3 bg-muted rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              {courier.logo && (
                                <img 
                                  src={courier.logo} 
                                  alt={courier.name} 
                                  className="h-8 w-8 object-contain"
                                />
                              )}
                              <p className="font-medium">{courier.name}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="text-green-600">{courier.success_parcel}/{courier.total_parcel}</p>
                              <p className="text-xs text-muted-foreground">{courier.success_ratio}% সফল</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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

      {/* Confirmation Warning Dialog */}
      <AlertDialog open={confirmWarningOpen} onOpenChange={setConfirmWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-5 w-5" />
              সতর্কতা: ঝুঁকিপূর্ণ কাস্টমার
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>এই কাস্টমারের কুরিয়ার হিস্ট্রি ঝুঁকিপূর্ণ মনে হচ্ছে:</p>
              
              {confirmFraudResult?.summary && (
                <div className="grid grid-cols-3 gap-2 text-center mt-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm font-bold text-blue-700">{confirmFraudResult.summary.total_parcel}</p>
                    <p className="text-xs text-blue-600">মোট</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <p className="text-sm font-bold text-green-700">{confirmFraudResult.summary.success_parcel}</p>
                    <p className="text-xs text-green-600">সফল</p>
                  </div>
                  <div className="p-2 bg-red-50 rounded-lg">
                    <p className="text-sm font-bold text-red-700">{confirmFraudResult.summary.cancelled_parcel}</p>
                    <p className="text-xs text-red-600">বাতিল</p>
                  </div>
                </div>
              )}

              {confirmFraudResult?.summary && (
                <div className={`p-2 rounded-lg text-center ${
                  confirmFraudResult.summary.success_ratio < 50 
                    ? "bg-red-100 text-red-700" 
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  সাকসেস রেট: {confirmFraudResult.summary.success_ratio}%
                </div>
              )}

              <p className="text-sm">আপনি কি তবুও এই অর্ডার কনফার্ম করতে চান?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setConfirmWarningOpen(false);
              setPendingConfirmOrder(null);
              setConfirmFraudResult(null);
            }}>
              বাতিল করুন
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleProceedConfirmAnyway}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              এগিয়ে যান
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Link Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link className="h-5 w-5 text-primary" />
              পেমেন্ট লিংক তৈরি করুন
            </DialogTitle>
          </DialogHeader>
          {paymentOrder && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">অর্ডার</p>
                <p className="font-medium">{paymentOrder.order_number} - {paymentOrder.customer_name}</p>
                <p className="text-sm text-muted-foreground">মোট: ৳{Number(paymentOrder.total_amount).toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment-amount">পেমেন্ট পরিমাণ (৳)</Label>
                <Input
                  id="payment-amount"
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="পরিমাণ লিখুন"
                />
              </div>

              {generatedPaymentUrl ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-700 mb-2">✅ পেমেন্ট লিংক তৈরি হয়েছে</p>
                    <p className="text-xs text-green-600 break-all">{generatedPaymentUrl}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCopyPaymentLink} className="flex-1">
                      কপি করুন
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => window.open(generatedPaymentUrl, "_blank")}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      খুলুন
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={handleGeneratePaymentLink} 
                  className="w-full"
                  disabled={isGeneratingPaymentLink}
                >
                  {isGeneratingPaymentLink ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  লিংক তৈরি করুন
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;