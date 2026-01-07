import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourierData {
  name: string;
  logo: string;
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number;
}

interface SummaryData {
  total_parcel: number;
  success_parcel: number;
  cancelled_parcel: number;
  success_ratio: number;
}

interface CourierCheckResponse {
  status: string;
  data?: {
    [key: string]: CourierData | SummaryData;
  };
  reports?: unknown[];
  error?: string;
}

export interface ParsedCourierResult {
  status: string;
  couriers: CourierData[];
  summary: SummaryData | null;
  error?: string;
}

export const useCourierCheck = () => {
  return useMutation({
    mutationFn: async (phone: string): Promise<ParsedCourierResult> => {
      const { data, error } = await supabase.functions.invoke("bdcourier-check", {
        body: { action: "courier-check", phone },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const response = data as CourierCheckResponse;
      
      // Parse the response to extract couriers with actual orders
      const couriers: CourierData[] = [];
      let summary: SummaryData | null = null;

      if (response.status === "success" && response.data) {
        Object.entries(response.data).forEach(([key, value]) => {
          if (key === "summary") {
            summary = value as SummaryData;
          } else {
            const courier = value as CourierData;
            // Only include couriers that have actual parcels
            if (courier.total_parcel > 0) {
              couriers.push(courier);
            }
          }
        });
      }

      return {
        status: response.status,
        couriers,
        summary,
      };
    },
    onError: (error: Error) => {
      console.error("BD Courier check error:", error);
      toast.error(`ফ্রড চেক করতে সমস্যা: ${error.message}`);
    },
  });
};

export const useCheckBDCourierConnection = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("bdcourier-check", {
        body: { action: "check-connection" },
      });

      if (error) throw error;
      return data;
    },
  });
};
