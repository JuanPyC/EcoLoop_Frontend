import { createClient } from "@/lib/supabase/client";

export const stationService = {
  async getStations() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("waste_stations")
      .select("*, waste_bins (*)")
      .order("name");
    if (error) throw error;
    return data;
  },

  async getStationById(id: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("waste_stations")
      .select("*, waste_bins (*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },
};
export default stationService;
