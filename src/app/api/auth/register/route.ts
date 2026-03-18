import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son requeridos" }, { status: 400 });
    }

    // 1. Verificar si ya existe
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: "El usuario ya existe" }, { status: 400 });
    }

    // 2. Hash de contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Crear usuario
    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        email,
        passwordHash,
        name: name || email.split("@")[0],
        role: "BUYER",
        isActive: true
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error("Registration Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
