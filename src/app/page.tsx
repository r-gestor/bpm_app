import React from "react";
import { ProductService } from "@/lib/services/product.service";
import ProductCard from "@/components/products/ProductCard";
import { 
  Rocket, 
  ShieldCheck, 
  GraduationCap, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Search,
  BookOpen
} from "lucide-react";
import HomeActions from "@/components/home/HomeActions";
import CountdownBanner from "@/components/ui/CountdownBanner";

export default async function Home() {
  const products = await ProductService.getActiveProducts().catch(() => []);

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary/30 selection:text-primary-dark">
      <CountdownBanner />
      {/* Header / Brand Section */}
      <section className="relative pt-44 pb-12 overflow-hidden">
        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary-dark text-xs font-bold uppercase tracking-widest mb-8">
            <Sparkles className="w-3 h-3" /> Ecosistema de Salud Alimentaria 
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight uppercase text-accent">
            Plataforma Profesional de <span className="text-primary">Salud</span>
          </h1>
          <p className="text-text-muted max-w-xl mx-auto font-medium">
            Selecciona el servicio que deseas gestionar hoy mismo.
          </p>
        </div>
      </section>

      {/* Main Direct Access Section */}
      <section className="pb-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <HomeActions />
        </div>
      </section>

      {/* Sections removed: Hero Premium, Como Funciona, Servicios */}
      {/* Footer Industrial */}
      <footer className="py-20 border-t border-slate-200 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-brand">
                  <ShieldCheck className="text-white w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-tight text-accent">BPM <span className="text-primary">Salud</span></span>
              </div>
              <p className="text-sm text-text-muted max-w-xs text-center md:text-left">
                Tecnología aplicada a la seguridad alimentaria y el cumplimiento normativo.
              </p>
            </div>
            <div className="flex gap-10 text-text-muted text-sm">
              <a href="#" className="hover:text-primary transition-colors">Privacidad</a>
              <a href="#" className="hover:text-primary transition-colors">Términos</a>
              <a href="#" className="hover:text-primary transition-colors">Contacto</a>
            </div>
            <div className="text-text-muted/70 text-xs font-mono uppercase tracking-widest">
              &copy; {new Date().getFullYear()} BPM Salud Tech / Medellin, CO
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
