import { createClient } from "@/lib/supabase/client";

export const binService = {
  async getBinByQr(qrCode: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("waste_bins")
      .select("*, waste_stations (name, location)")
      .eq("qr_code", qrCode)
      .single();
    if (error) throw error;
    return data;
  },

  async updateBinCapacity(id: string, capacity: number, weight: number) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("waste_bins")
      .update({
        capacity_percentage: capacity,
        current_weight: weight,
        needs_attention: capacity >= 80,
      })
      .eq("id", id);
    if (error) throw error;
    return data;
  },

  async emptyBin(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("waste_bins")
      .update({
        capacity_percentage: 0,
        current_weight: 0,
        needs_attention: false,
      })
      .eq("id", id);
    if (error) throw error;
    return data;
  },
};
export default binService;
