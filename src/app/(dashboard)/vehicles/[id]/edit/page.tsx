import { createClient } from "@/lib/supabase/server";
import { getVehicle } from "@/lib/services/vehicles";
import { redirect, notFound } from "next/navigation";
import { EditVehicleForm } from "./EditVehicleForm";

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const result = await getVehicle(supabase, id);

  if (result.error || !result.data) {
    notFound();
  }

  return <EditVehicleForm vehicle={result.data} />;
}
