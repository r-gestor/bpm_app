import React from "react";
import { verifyDocument } from "@/lib/services/verification.service";
import { XCircle, ShieldCheck, Calendar, Hash, User, GraduationCap, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

interface Props {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Verificación - ${code}`,
    description: "Sistema público de verificación de autenticidad de documentos.",
  };
}

export default async function VerificationPage({ params }: Props) {
  const { code } = await params;
  // Use the unified verification service
  const result = await verifyDocument(code);
  const document = result?.data;
  const isPlan = result?.type === 'SANITATION_PLAN';

  return (
    <div className="min-h-screen bg-slate-50 py-20 px-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-slate-900 mb-8 transition-colors font-bold group">
          <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Volver al Inicio
        </Link>

        {!result ? (
          <div className="bg-white rounded-[40px] p-12 shadow-2xl border-2 border-red-500/20 text-center animate-in fade-in zoom-in duration-500">
            <XCircle className="text-red-500 mx-auto mb-6" size={80} />
            <h1 className="text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight">
              Documento No Encontrado
            </h1>
            <p className="text-slate-500 text-lg">
              El código de verificación <strong>{code}</strong> no corresponde a un documento válido emitido por nuestra plataforma.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header Status */}
            <div className={`py-6 text-center font-black uppercase tracking-[0.2em] text-sm ${
              result.valid ? "bg-green-500 text-white" : "bg-orange-500 text-white"
            }`}>
              {result.valid 
                ? (isPlan ? "Plan de Saneamiento Válido" : "Certificado Válido") 
                : "En Proceso / No Válido"}
            </div>

            <div className="p-12">
              <div className="flex justify-center mb-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                  <ShieldCheck size={100} className="text-blue-600 relative z-10" />
                </div>
              </div>

              <h2 className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-10">
                Detalles del {isPlan ? "Plan de Saneamiento" : "Certificado"}
              </h2>

              <div className="space-y-8">
                {/* Titular / Establecimiento */}
                <div className="flex items-start gap-6">
                  <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
                    <User size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {isPlan ? "Establecimiento" : "Titular"}
                    </span>
                    <p className="text-xl font-bold text-slate-900 ">
                      {isPlan ? (document as any).businessName : (document as any).studentName}
                    </p>
                  </div>
                </div>

                {/* Tipo / Curso */}
                <div className="flex items-start gap-6">
                  <div className="bg-purple-50 p-4 rounded-2xl text-purple-600">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      {isPlan ? "Tipo de Establecimiento" : "Curso Realizado"}
                    </span>
                    <p className="text-xl font-bold text-slate-900 ">
                      {isPlan ? (document as any).businessType : (document as any).courseName}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
                  {/* Fecha */}
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl text-slate-400">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        {isPlan ? "Fecha de Generación" : "Fecha de Emisión"}
                      </span>
                      <p className="font-bold text-slate-700 ">
                        {new Date(document!.issuedAt || (document as any).generatedAt || Date.now()).toLocaleDateString("es-ES", { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Código */}
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl text-slate-400">
                      <Hash size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Código Único</span>
                      <p className="font-mono font-bold text-blue-600">{document!.uniqueCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-10 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4">
                  Autenticidad Digital Garantizada
                </p>
                <p className="text-[10px] font-mono text-slate-300 break-all select-all hover:text-blue-400 transition-colors uppercase">
                  {document!.documentHash}
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-slate-400 text-xs mt-12 pb-20">
          © {new Date().getFullYear()} BPM Platform Health Services. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
