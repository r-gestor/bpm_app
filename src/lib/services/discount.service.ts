import { supabase } from "@/lib/supabase";

export class DiscountService {
  static async validateDiscountCode(code: string) {
    const { data: discount, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code)
      .eq('active', true)
      .maybeSingle();

    if (error || !discount) return null;

    // Verificar si el cupón ha expirado
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return null;
    }

    return discount;
  }
}
