import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  shipping_area?: string;
  shipping_city: string;
  total_amount: number;
  payment_method: string;
  payment_status: string;
  notes?: string;
}

interface SteadfastConsignment {
  consignment_id: string;
  tracking_code: string;
  status: string;
}

export const useSendToSteadfast = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: Order) => {
      const { data, error } = await supabase.functions.invoke("steadfast-courier", {
        body: { action: "create-order", order },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data as { success: boolean; consignment: SteadfastConsignment; message: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(`অর্ডার স্টেডফাস্ট এ পাঠানো হয়েছে! ট্র্যাকিং: ${data.consignment.consignment_id}`);
    },
    onError: (error: Error) => {
      console.error("Steadfast error:", error);
      toast.error(`স্টেডফাস্ট এ পাঠাতে সমস্যা: ${error.message}`);
    },
  });
};

export const useCheckSteadfastStatus = () => {
  return useMutation({
    mutationFn: async ({ consignmentId, invoiceNumber }: { consignmentId?: string; invoiceNumber?: string }) => {
      const { data, error } = await supabase.functions.invoke("steadfast-courier", {
        body: { action: "check-status", consignmentId, invoiceNumber },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      return data as { success: boolean; delivery_status: string };
    },
    onError: (error: Error) => {
      toast.error(`স্ট্যাটাস চেক করতে সমস্যা: ${error.message}`);
    },
  });
};

export const useSteadfastBalance = () => {
  return useQuery({
    queryKey: ["steadfast-balance"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("steadfast-courier", {
        body: { action: "check-balance" },
      });

      if (error) {
        console.error("Steadfast balance error:", error);
        return null; // Return null instead of throwing to prevent UI errors
      }
      if (data?.error) {
        console.error("Steadfast balance API error:", data.error);
        return null;
      }

      return data.balance as number;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on failure
    refetchOnWindowFocus: false,
  });
};