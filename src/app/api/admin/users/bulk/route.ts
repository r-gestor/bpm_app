import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { AdminService } from "@/lib/services/admin.service";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { buyer, students, productId, includeBuyerAsStudent } = body;

    if (!productId || !buyer || !Array.isArray(students)) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    const result = await AdminService.bulkRegisterUsers(
      session.user.id,
      buyer,
      students,
      productId,
      !!includeBuyerAsStudent
    );

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Error al cargar usuarios" },
      { status: 500 }
    );
  }
}
