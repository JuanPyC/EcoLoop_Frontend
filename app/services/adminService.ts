import { createClient } from "@/lib/supabase/client";

export const adminService = {
  async getAnalyticsData() {
    const supabase = createClient();

    // Get profiles count for role = 'user'
    const { count: totalUsers, error: usersErr } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");
    if (usersErr) throw usersErr;

    // Get total transactions count
    const { count: totalTransactions, error: txsCountErr } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true });
    if (txsCountErr) throw txsCountErr;

    // Get transactions list
    const { data: transactions, error: txsErr } = await supabase
      .from("transactions")
      .select("waste_type, points_earned, created_at")
      .order("created_at", { ascending: true });
    if (txsErr) throw txsErr;

    // Get waste bins
    const { data: wasteBins, error: binsErr } = await supabase
      .from("waste_bins")
      .select("waste_type, capacity_percentage, current_weight, needs_attention, waste_stations(name)");
    if (binsErr) throw binsErr;

    // Get recent redemptions
    const { data: recentRedemptions, error: redemptionsErr } = await supabase
      .from("redemptions")
      .select("*, profiles(full_name, email), products(name)")
      .order("created_at", { ascending: false })
      .limit(10);
    if (redemptionsErr) throw redemptionsErr;

    // Get all redemptions to calculate total points spent
    const { data: redemptions, error: allRedemptionsErr } = await supabase
      .from("redemptions")
      .select("points_spent");
    if (allRedemptionsErr) throw allRedemptionsErr;

    const totalPointsRedeemed = redemptions?.reduce((sum, r) => sum + r.points_spent, 0) || 0;

    return {
      stats: {
        totalUsers: totalUsers || 0,
        totalTransactions: totalTransactions || 0,
        totalPointsRedeemed,
      },
      transactions: transactions || [],
      wasteBins: wasteBins || [],
      recentRedemptions: recentRedemptions || [],
    };
  }
};
export default adminService;
