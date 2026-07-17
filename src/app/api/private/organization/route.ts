import { jsonOk, jsonError } from "@/lib/apiResponse";
import { requireOwner } from "@/lib/authService";
import { getOrganizations, createOrganization, deleteOrganization } from "@/lib/organizationService";
import type { PostOrganizationBody, DeleteOrganizationBody } from "@/types/organization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireOwner();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }

  try {
    const organizations = await getOrganizations();
    return jsonOk(organizations);
  } catch (err) {
    console.error("GET /api/private/organization error:", err);
    return jsonError("団体取得に失敗しました", 500);
  }
}

export async function POST(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }

  let body: PostOrganizationBody;
  try {
    body = (await req.json()) as PostOrganizationBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  try {
    const result = await createOrganization(body);
    if ("error" in result) {
      return jsonError(result.error ?? "エラーが発生しました", result.status ?? 400);
    }
    return jsonOk(result.data, { status: 201 });
  } catch (err) {
    console.error("POST /api/private/organization error:", err);
    return jsonError("団体登録に失敗しました", 500);
  }
}

export async function DELETE(req: Request) {
  const auth = await requireOwner();
  if ("error" in auth) {
    return jsonError(auth.error, auth.status);
  }

  let body: DeleteOrganizationBody;
  try {
    body = (await req.json()) as DeleteOrganizationBody;
  } catch {
    return jsonError("リクエストボディの解析に失敗しました", 400);
  }

  try {
    const result = await deleteOrganization(body);
    if ("error" in result) {
      return jsonError(result.error ?? "エラーが発生しました", result.status ?? 400);
    }
    return jsonOk(result.data);
  } catch (err) {
    console.error("DELETE /api/private/organization error:", err);
    return jsonError("団体削除に失敗しました", 500);
  }
}
