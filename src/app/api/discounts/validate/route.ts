import { NextResponse } from "next/server";
import { DiscountService } from "@/lib/services/discount.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  try {
    const discount = await DiscountService.validateDiscountCode(code);
    if (!discount) {
      return NextResponse.json({ valid: false, message: "Código inválido o expirado" });
    }

    return NextResponse.json({ 
      valid: true, 
      percentage: discount.percentage,
      code: discount.code 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
