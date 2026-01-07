import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STEADFAST_API_URL = "https://portal.steadfast.com.bd/api/v1";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("STEADFAST_API_KEY");
    const secretKey = Deno.env.get("STEADFAST_SECRET_KEY");

    if (!apiKey || !secretKey) {
      console.error("Steadfast API credentials not configured", { 
        hasApiKey: !!apiKey, 
        hasSecretKey: !!secretKey 
      });
      return new Response(
        JSON.stringify({ error: "Steadfast API credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, order, consignmentId, invoiceNumber } = await req.json();
    console.log(`Steadfast action: ${action}`, { orderId: order?.id, consignmentId, invoiceNumber });

    const steadfastHeaders = {
      "Api-Key": apiKey,
      "Secret-Key": secretKey,
      "Content-Type": "application/json",
    };

    // Helper function to safely parse API response
    const parseApiResponse = async (response: Response, endpoint: string) => {
      const text = await response.text();
      console.log(`Steadfast ${endpoint} raw response (status ${response.status}):`, text.substring(0, 500));
      
      try {
        return JSON.parse(text);
      } catch {
        console.error(`Failed to parse Steadfast response as JSON. Got HTML/text response.`);
        throw new Error(`Steadfast API returned invalid response. Status: ${response.status}`);
      }
    };

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case "create-order": {
        if (!order) {
          return new Response(
            JSON.stringify({ error: "Order data is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Build full address
        const fullAddress = [
          order.shipping_address,
          order.shipping_area,
          order.shipping_city,
        ].filter(Boolean).join(", ");

        // Determine COD amount (only for COD orders that are unpaid)
        const codAmount = order.payment_method === "cod" && order.payment_status !== "paid" 
          ? Number(order.total_amount) 
          : 0;

        const payload = {
          invoice: order.order_number,
          recipient_name: order.customer_name,
          recipient_phone: order.customer_phone,
          recipient_address: fullAddress,
          cod_amount: codAmount,
          note: order.notes || "",
        };

        console.log("Creating Steadfast consignment:", payload);

        const response = await fetch(`${STEADFAST_API_URL}/create_order`, {
          method: "POST",
          headers: steadfastHeaders,
          body: JSON.stringify(payload),
        });

        const result = await parseApiResponse(response, "create_order");
        console.log("Steadfast create response:", result);

        if (result.status === 200 && result.consignment) {
          // Update order in database with Steadfast info
          const { error: updateError } = await supabase
            .from("orders")
            .update({
              steadfast_consignment_id: result.consignment.consignment_id,
              steadfast_status: result.consignment.status || "pending",
              courier_sent_at: new Date().toISOString(),
              order_status: "shipped",
            })
            .eq("id", order.id);

          if (updateError) {
            console.error("Error updating order:", updateError);
          }

          // Also add to order_tracking table
          await supabase.from("order_tracking").insert({
            order_id: order.id,
            status: "shipped",
            courier_name: "Steadfast Courier",
            tracking_number: result.consignment.consignment_id,
            tracking_url: `https://steadfast.com.bd/t/${result.consignment.tracking_code}`,
            notes: `Steadfast consignment created. Invoice: ${order.order_number}`,
          });

          return new Response(
            JSON.stringify({
              success: true,
              consignment: result.consignment,
              message: "Order sent to Steadfast successfully",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          console.error("Steadfast API error:", result);
          return new Response(
            JSON.stringify({
              error: result.message || "Failed to create consignment",
              details: result.errors || result,
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      case "check-status": {
        if (!consignmentId && !invoiceNumber) {
          return new Response(
            JSON.stringify({ error: "Consignment ID or invoice number is required" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        let response;
        if (consignmentId) {
          response = await fetch(
            `${STEADFAST_API_URL}/status_by_cid/${consignmentId}`,
            { headers: steadfastHeaders }
          );
        } else {
          response = await fetch(
            `${STEADFAST_API_URL}/status_by_invoice/${invoiceNumber}`,
            { headers: steadfastHeaders }
          );
        }

        const result = await parseApiResponse(response, "check-status");
        console.log("Steadfast status response:", result);

        if (result.status === 200) {
          return new Response(
            JSON.stringify({ success: true, delivery_status: result.delivery_status }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: result.message || "Failed to get status" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      case "check-balance": {
        const response = await fetch(`${STEADFAST_API_URL}/get_balance`, {
          headers: steadfastHeaders,
        });

        const result = await parseApiResponse(response, "get_balance");
        console.log("Steadfast balance response:", result);

        if (result.status === 200) {
          return new Response(
            JSON.stringify({ success: true, balance: result.current_balance }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: result.message || "Failed to get balance" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Steadfast courier error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});