import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import OrganizationClient from "./OrganizationClient";

export default async function OrganizationPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const role = session.user.role as "owner" | "admin" | "editer" | "viewer";
  if (role !== "owner") {
    redirect("/dashboard");
  }

  return <OrganizationClient />;
}
