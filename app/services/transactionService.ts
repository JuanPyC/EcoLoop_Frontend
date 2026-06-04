import { createClient } from "@/lib/supabase/client";

export const transactionService = {
  async getTransactions(userId?: string) {
    const supabase = createClient();
    let query = supabase
      .from("transactions")
      .select("*, profiles (full_name, email), waste_bins (*, waste_stations (*))")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async createTransaction(transaction: {
    user_id: string;
    bin_id: string;
    points_earned: number;
    waste_type: string;
  }) {
    const supabase = createClient();
    const { data, error } = await supabase.from("transactions").insert(transaction);
    if (error) throw error;
    return data;
  },
};
export default transactionService;
