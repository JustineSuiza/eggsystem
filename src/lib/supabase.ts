import { createClient } from "@supabase/supabase-js";

export const supabaseUrl = "https://iaywmuaeptzquxeuqglj.supabase.co";
export const supabaseAnonKey = "sb_publishable_wHomQ1h_xzqiPtlgMW9-mw_k0eUtqJK";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
