import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CourierInfo {
  name: string;
  logo: string;
  status: string;
}

interface CourierCheckResponse {
  status: string;
  data?: {
    phone: string;
    couriers: CourierInfo[];
  };
  error?: string;
}

export const useCourierCheck = () => {
  return useMutation({
    mutationFn: async (phone: string): Promise<CourierCheckResponse> => {
      const { data, error } = await supabase.functions.invoke("bdcourier-check", {
        body: { action: "courier-check", phone },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return data as CourierCheckResponse;
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
