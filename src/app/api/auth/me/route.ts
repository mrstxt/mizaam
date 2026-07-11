import { authorize } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/permissions";

export async function GET(request: Request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;

  return Response.json({
    ok: true,
    user: {
      ...auth.user,
      roleLabel: ROLE_LABELS[auth.user.role],
    },
  });
}
