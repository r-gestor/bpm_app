import { supabase } from "@/lib/supabase";

export class ProductService {
  static async getActiveProducts() {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        course:courses (
          id,
          title,
          totalLessons,
          passingScore
        )
      `)
      .eq('active', true);

    if (error) throw error;
    return products;
  }

  static async getProductBySlug(slug: string) {
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        course:courses (
          id,
          title,
          description,
          totalLessons,
          passingScore
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return product;
  }
}
