import React from "react";
import {
  CheckCircle2,
  Clock,
  Monitor,
  Headphones,
  ArrowRight,
  ShieldCheck,
  Zap,
  Star
} from "lucide-react";
import Link from "next/link";
import CountdownBanner from "@/components/ui/CountdownBanner";

export default function ManipulacionAlimentosInfo() {
  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary/30 selection:text-primary-dark">
      {/* Banner de descuento con temporizador — fixed justo bajo el navbar (h-20 = 80px) */}
      <CountdownBanner />

      {/* Hero Section — pt-44 para clearar navbar (80px) + banner (~52px) + espacio */}
      <section className="relative pt-44 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="container mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary-dark text-sm font-bold uppercase tracking-widest mb-8 animate-fade-in">
            <Star className="w-4 h-4 fill-current" /> Curso 100% Virtual
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight uppercase leading-none">
            Curso de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Manipulación de Alimentos
            </span>
          </h1>
          <p className="text-text-muted max-w-2xl mx-auto text-lg md:text-xl font-medium mb-10">
            Obtén tu certificación oficial sin salir de casa. Nuestra plataforma está diseñada para ofrecerte la mejor experiencia de aprendizaje a tu propio ritmo.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/checkout/manipulacion-alimentos"
              className="group relative px-8 py-5 bg-accent rounded-2xl font-black text-lg text-white transition-all hover:scale-105 hover:bg-accent-light active:scale-95 shadow-xl shadow-brand flex items-center gap-3"
            >
              COMPRAR AHORA
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-tight">
              Precios y <span className="text-primary">Planes</span>
            </h2>
            <p className="text-text-muted font-medium text-lg max-w-2xl mx-auto">
              Ahorra con nuestros precios especiales por volumen. Obtén la mejor capacitación al mejor precio del mercado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan 1 */}
            <div className="relative group p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-brand hover:border-primary/30 transition-all duration-500 flex flex-col items-center text-center">
              <div className="mb-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-dark text-[10px] font-black uppercase tracking-widest">
                Plan Individual / Pequeño
              </div>
              <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">1 a 3 Personas</h3>
              <div className="mb-6">
                <span className="text-text-muted line-through text-lg font-bold block mb-1">$54.000</span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-black text-accent">$45.000</span>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/20">
                    -17%
                  </span>
                </div>
                <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-2 block">Por persona</span>
              </div>
              <Link 
                href="/checkout/manipulacion-alimentos"
                className="w-full py-4 bg-primary-light text-primary-dark rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-accent hover:text-white group-hover:scale-[1.02] active:scale-95 mb-4"
              >
                Inscribir trabajadores
              </Link>
            </div>

            {/* Plan 2 */}
            <div className="relative group p-10 rounded-[2.5rem] bg-white border-2 border-primary hover:border-primary-dark transition-all duration-500 flex flex-col items-center text-center shadow-2xl shadow-brand scale-105 z-10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                Más Popular
              </div>
              <div className="mb-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-dark text-[10px] font-black uppercase tracking-widest">
                Plan Mediano
              </div>
              <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">4 a 9 Personas</h3>
              <div className="mb-6">
                <span className="text-text-muted line-through text-lg font-bold block mb-1">$50.000</span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-black text-accent">$42.000</span>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/20">
                    -16%
                  </span>
                </div>
                <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-2 block">Por persona</span>
              </div>
              <Link 
                href="/checkout/manipulacion-alimentos"
                className="w-full py-4 bg-accent text-text rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-accent-light group-hover:scale-[1.02] active:scale-95 mb-4"
              >
                Inscribir trabajadores
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="relative group p-10 rounded-[2.5rem] bg-white border border-slate-100 shadow-brand hover:border-primary/30 transition-all duration-500 flex flex-col items-center text-center">
              <div className="mb-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary-dark text-[10px] font-black uppercase tracking-widest">
                Plan Corporativo
              </div>
              <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">10 o más Personas</h3>
              <div className="mb-6">
                <span className="text-text-muted line-through text-lg font-bold block mb-1">$47.000</span>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-black text-accent">$39.000</span>
                  <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/20">
                    -17%
                  </span>
                </div>
                <span className="text-text-muted text-[10px] font-bold uppercase tracking-widest mt-2 block">Por persona</span>
              </div>
              <Link 
                href="/checkout/manipulacion-alimentos"
                className="w-full py-4 bg-primary-light text-primary-dark rounded-2xl font-black text-sm uppercase tracking-widest transition-all hover:bg-accent hover:text-white group-hover:scale-[1.02] active:scale-95 mb-4"
              >
                Inscribir trabajadores
              </Link>
            </div>
          </div>

          <div className="text-center mt-12 bg-primary-light border border-primary/20 rounded-2xl py-6 px-8 max-w-3xl mx-auto">
            <p className="text-text-muted text-sm font-medium">
              💡 <span className="text-primary font-bold uppercase tracking-wider text-xs">Nota:</span> Contamos con un <span className="text-text font-bold">código de descuento adicional</span> que podrás aplicar al momento de realizar tu pago en la pasarela.
            </p>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-24 bg-bg-section">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-primary-dark/20 transition-all group">
              <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <Monitor className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Totalmente Virtual</h3>
              <p className="text-text-muted leading-relaxed font-medium">
                No tienes que desplazarte. Realiza todo el proceso desde tu celular, tablet o computadora, desde cualquier lugar del país.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-primary-dark/20 transition-all group">
              <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mb-6 text-accent group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Acceso Inmediato</h3>
              <p className="text-text-muted leading-relaxed font-medium">
                Una vez termines el proceso de inscripción y pago, podrás acceder inmediatamente a todo el contenido del curso.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-primary-dark/20 transition-all group">
              <div className="w-14 h-14 bg-success/10 rounded-2xl flex items-center justify-center mb-6 text-success group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Sin Restricciones</h3>
              <p className="text-text-muted leading-relaxed font-medium">
                Accede en el horario que quieras. La plataforma está activa las 24 horas del día, los 7 días de la semana para tu comodidad.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-primary-dark/20 transition-all group md:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 bg-primary-light rounded-2xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <Headphones className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Soporte 24/7</h3>
              <p className="text-text-muted leading-relaxed font-medium">
                Contamos con asesoria y soporte técnico constante. Si tienes alguna duda, estamos aquí para ayudarte en cualquier momento.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-[2rem] bg-white border border-slate-100 hover:border-primary-dark/20 transition-all group md:col-span-2 lg:col-span-2">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="w-20 h-20 bg-accent-light/10 rounded-3xl flex items-center justify-center text-accent-light shrink-0">
                  <ShieldCheck className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-text">Certificación Garantizada</h3>
                  <p className="text-text-muted font-medium">
                    Nuestros certificados cumplen con toda la normatividad vigente y son válidos a nivel nacional para cualquier trámite legal o laboral.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="relative overflow-hidden bg-primary rounded-[3rem] p-12 md:p-20 text-center shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <h2 className="text-4xl md:text-5xl font-black mb-6 relative z-10 uppercase tracking-tight text-white">
              ¿Listo para empezar?
            </h2>
            <p className="text-white/90 text-lg md:text-xl font-medium mb-10 max-w-xl mx-auto relative z-10 opacity-90">
              Inscríbete ahora y obtén tu certificado de manipulador de alimentos de forma rápida y profesional.
            </p>
            <div className="relative z-10">
              <Link 
                href="/checkout/manipulacion-alimentos"
                className="inline-flex items-center gap-3 px-10 py-5 bg-white text-primary rounded-2xl font-black text-xl transition-all hover:scale-105 hover:bg-slate-100 active:scale-95 shadow-xl"
              >
                COMPRAR AHORA
                <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-12 border-t border-slate-100 text-center">
        <div className="container mx-auto px-6">
          <p className="text-text-muted text-sm font-medium uppercase tracking-widest">
            &copy; {new Date().getFullYear()} BPM Salud Tech - Todos los derechos reservados
          </p>
        </div>
      </footer>
    </div>
  );
}
