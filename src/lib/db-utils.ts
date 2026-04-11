import { supabase } from "./supabase";

export async function getNextNumericId(tableName: string) {
  const { data, error } = await supabase
    .from(tableName)
    .select("id")
    .order("id", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return 1;
  }

  const highestId = Number(data[0].id);
  return Number.isNaN(highestId) ? 1 : highestId + 1;
}
