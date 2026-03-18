import { NextResponse } from "next/server";
import { StudentService } from "@/lib/services/student.service";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token y contraseña son requeridos" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await StudentService.activateAccount(token, passwordHash);

    return NextResponse.json({ message: "Cuenta activada exitosamente" });
  } catch (error: any) {
    console.error("Activation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
