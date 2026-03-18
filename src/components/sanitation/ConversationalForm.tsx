"use client";

import React, { useState, useRef } from "react";
import { 
 Building2, 
 MapPin, 
 Fingerprint, 
 Store, 
 Package, 
 Image as ImageIcon, 
 Hammer, 
 Layout, 
 Truck, 
 Beef, 
 CheckCircle2, 
 ArrowRight, 
 ArrowLeft, 
 Trash2, 
 Loader2, 
 Sparkles,
 Upload
} from "lucide-react";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AuthModal from "@/components/auth/AuthModal";

interface StepProps {
 formData: any;
 setFormData: (data: any) => void;
 onNext: () => void;
 onBack?: () => void;
}

export default function ConversationalForm({ onComplete }: { onComplete: (plan: any) => void }) {
 const { data: session } = useSession();
 const router = useRouter();
 const [step, setStep] = useState(1);
 const [loading, setLoading] = useState(false);
 const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    address: "",
    nit: "",
    establishmentType: "",
    products: "",
    logo: null as File | null,
    logoPreview: "",
    equipment: "",
    spaces: "",
    hasDelivery: null as boolean | null,
    hasHighRiskFoods: null as string | null,
  });

 const handleNext = () => setStep(prev => prev + 1);
 const handleBack = () => setStep(prev => prev - 1);

 const handleSubmit = async () => {
 if (!session?.user) {
 setIsAuthModalOpen(true);
 return;
 }

 setLoading(true);
 try {
 // Enviar ownerId si es necesario, aunque el API lo obtendrá de la sesión
 const res = await fetch("/api/sanitation/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(formData),
 });
 const data = await res.json();
 
 // En lugar de completar inmediatamente, redirigir a checkout
 router.push(`/checkout/plan-saneamiento-iav?planId=${data.id}`);
 } catch (error) {
 console.error("Error generating plan:", error);
 } finally {
 setLoading(false);
 }
 };

 const renderStep = () => {
 switch(step) {
 case 1: return <Step1 formData={formData} setFormData={setFormData} onNext={handleNext} />;
 case 2: return <Step2 formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
 case 3: return <Step3 formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
 case 4: return <Step4 formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
 case 5: return <Step5 formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />;
 case 6: return <Step6 formData={formData} setFormData={setFormData} onSubmit={handleSubmit} onBack={handleBack} loading={loading} />;
 default: return null;
 }
 };

 return (
 <div className="max-w-3xl mx-auto">
 {/* Progress Bar */}
 <div className="mb-12">
 <div className="flex justify-between items-center mb-2">
 <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Paso {step} de 6</span>
 <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{Math.round((step / 6) * 100)}% Completado</span>
 </div>
 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
 <div 
 className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-700 ease-out"
 style={{ width: `${(step / 6) * 100}%` }}
 />
 </div>
 </div>

 <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-8 sm:p-12 relative overflow-hidden">
 {/* Decorative elements */}
 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 blur-[100px] -ml-32 -mb-32 pointer-events-none" />
 
 <div className="relative z-10 transition-all duration-500">
 {renderStep()}
 </div>
 </div>

 <AuthModal 
 isOpen={isAuthModalOpen} 
 onClose={() => setIsAuthModalOpen(false)} 
 onSuccess={handleSubmit}
 />
 </div>
 );
}

// --- Steps Components ---

function Step1({ formData, setFormData, onNext }: StepProps) {
  const isComplete = formData.businessName && formData.ownerName && formData.address && formData.nit;

 return (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
 <div className="space-y-2">
 <h2 className="text-3xl font-black text-slate-900 leading-tight">
 ¡Hola! Comencemos con los <span className="text-blue-600">datos de tu negocio</span>
 </h2>
 <p className="text-slate-500 font-medium">Esta información aparecerá en los encabezados de tu plan.</p>
 </div>

 <div className="space-y-6">
 <div className="relative group">
 <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Nombre Comercial</label>
 <div className="relative">
 <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
 <input 
 className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold text-slate-900 "
 value={formData.businessName}
 onChange={(e) => setFormData({...formData, businessName: e.target.value})}
 placeholder="Ej: Panadería El Sol"
 />
 </div>
 </div>

 <div className="relative group">
 <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Representante Legal</label>
 <div className="relative">
 <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
 <input 
 className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold text-slate-900 "
 value={formData.ownerName}
 onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
 placeholder="Nombre Completo del Responsable"
 />
 </div>
 </div>

 <div className="relative group">
 <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Dirección Exacta</label>
 <div className="relative">
 <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
 <input 
 className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold text-slate-900 "
 value={formData.address}
 onChange={(e) => setFormData({...formData, address: e.target.value})}
 placeholder="Ej: Calle 123 # 45-67"
 />
 </div>
 </div>

 <div className="relative group">
 <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">NIT o Identificación</label>
 <div className="relative">
 <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
 <input 
 className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold text-slate-900 "
 value={formData.nit}
 onChange={(e) => setFormData({...formData, nit: e.target.value})}
 placeholder="Ej: 900.123.456-7"
 />
 </div>
 </div>
 </div>

 <button 
 disabled={!isComplete}
 onClick={onNext}
 className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
 >
 Continuar <ArrowRight size={18} />
 </button>
 </div>
 );
}

function Step2({ formData, setFormData, onNext, onBack }: StepProps) {
 const isComplete = formData.establishmentType && formData.products;

 return (
 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
 <div className="space-y-2">
 <h2 className="text-3xl font-black text-slate-900 leading-tight">
 Cuéntanos sobre la <span className="text-indigo-600">identidad</span> de tu negocio
 </h2>
 <p className="text-slate-500 font-medium">¿Qué tipo de establecimiento eres y qué vendes?</p>
 </div>

 <div className="space-y-6">
 <div className="relative group">
 <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Tipo de Establecimiento</label>
 <div className="relative">
 <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
 <input 
 className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/20 focus:bg-white rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold text-slate-900 "
 value={formData.establishmentType}
 onChange={(e) => setFormData({...formData, establishmentType: e.target.value})}
 placeholder="Ej: Restaurante, Panadería, Minimercado..."
 />
 </div>
 </div>

 <div className="relative group">
 <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Productos que comercializa</label>
 <div className="relative">
 <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
 <input 
 className="w-full bg-slate-50 border-2 border-transparent focus:border-indigo-600/20 focus:bg-white rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold text-slate-900 "
 value={formData.products}
 onChange={(e) => setFormData({...formData, products: e.target.value})}
 placeholder="Ej: Almuerzos, Jugos, Panes, Carnes frescas..."
 />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <button onClick={onBack} className="py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
 <ArrowLeft size={16} /> Atrás
 </button>
 <button 
 disabled={!isComplete}
 onClick={onNext}
 className="bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
 >
 Siguiente <ArrowRight size={18} />
 </button>
 </div>
 </div>
 );
}

function Step3({ formData, setFormData, onNext, onBack }: StepProps) {
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onloadend = () => {
 setFormData({
 ...formData,
 logo: file,
 logoPreview: reader.result as string
 });
 };
 reader.readAsDataURL(file);
 }
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
 <div className="space-y-2">
 <h2 className="text-3xl font-black text-slate-900 leading-tight">
 Dale un toque personal con tu <span className="text-purple-600">Logo</span>
 </h2>
 <p className="text-slate-500 font-medium">Sube el emblema de tu negocio para incluirlo en el plan.</p>
 </div>

 <div 
 onClick={() => fileInputRef.current?.click()}
 className="group relative h-64 w-full border-4 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-purple-600/30 hover:bg-purple-500/5 transition-all overflow-hidden"
 >
 {formData.logoPreview ? (
 <div className="relative w-full h-full p-4 flex items-center justify-center">
 <img src={formData.logoPreview} alt="Preview" className="max-h-56 w-auto object-contain rounded-xl shadow-lg" />
 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
 <span className="text-white font-black uppercase tracking-widest text-xs">Cambiar Imagen</span>
 </div>
 </div>
 ) : (
 <>
 <div className="w-20 h-20 bg-purple-500/10 rounded-3xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
 <Upload size={32} />
 </div>
 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Click para subir archivo</p>
 <p className="text-slate-300 text-[10px] mt-1">PNG, JPG o SVG</p>
 </>
 )}
 <input 
 ref={fileInputRef}
 type="file" 
 accept="image/*" 
 className="hidden" 
 onChange={handleFileChange}
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <button onClick={onBack} className="py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
 <ArrowLeft size={16} /> Atrás
 </button>
 <button 
 onClick={onNext}
 className="bg-purple-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-xl"
 >
 {formData.logo ? "Usar este logo" : "Continuar sin logo"} <ArrowRight size={18} />
 </button>
 </div>
 </div>
 );
}

function Step4({ formData, setFormData, onNext, onBack }: StepProps) {
 const isComplete = formData.equipment && formData.spaces;

 return (
 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
 <div className="space-y-2">
 <h2 className="text-3xl font-black text-slate-900 leading-tight">
 Hablemos de tu <span className="text-emerald-600">espacio y herramientas</span>
 </h2>
 <p className="text-slate-500 font-medium">Describe brevemente cómo está organizado tu local.</p>
 </div>

 <div className="space-y-6">
 <div className="relative group">
 <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Equipos y Utensilios</label>
 <div className="relative">
 <Hammer className="absolute left-4 top-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
 <textarea 
 rows={3}
 className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-600/20 focus:bg-white rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold text-slate-900 resize-none"
 value={formData.equipment}
 onChange={(e) => setFormData({...formData, equipment: e.target.value})}
 placeholder="Ej: Neveras, congeladores, canastillas, mesas de trabajo inox..."
 />
 </div>
 </div>

 <div className="relative group">
 <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 px-1">Distribución de Espacios</label>
 <div className="relative">
 <Layout className="absolute left-4 top-5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
 <textarea 
 rows={3}
 className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-600/20 focus:bg-white rounded-2xl pl-12 pr-6 py-4 outline-none transition-all font-bold text-slate-900 resize-none"
 value={formData.spaces}
 onChange={(e) => setFormData({...formData, spaces: e.target.value})}
 placeholder="Ej: Área de almacenamiento, preparación, servicio, baños..."
 />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <button onClick={onBack} className="py-5 rounded-2xl font-black uppercase tracking-widest text-xs text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
 <ArrowLeft size={16} /> Atrás
 </button>
 <button 
 disabled={!isComplete}
 onClick={onNext}
 className="bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
 >
 Siguiente <ArrowRight size={18} />
 </button>
 </div>
 </div>
 );
}

function Step5({ formData, setFormData, onNext, onBack }: StepProps) {
 const [subStep, setSubStep] = useState(1);

 const handleChoiceA = (val: boolean) => {
 setFormData({...formData, hasDelivery: val});
 setSubStep(2);
 };

 const handleChoiceB = (val: string) => {
 setFormData({...formData, hasHighRiskFoods: val});
 onNext();
 };

 return (
 <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 min-h-[400px] flex flex-col justify-center">
 {subStep === 1 ? (
 <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
 <div className="text-center space-y-4">
 <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 mx-auto">
 <Truck size={36} />
 </div>
 <h2 className="text-3xl font-black text-slate-900 leading-tight max-w-sm mx-auto">
 ¿Tu negocio cuenta con <span className="text-amber-600">servicio a domicilio</span>?
 </h2>
 </div>

 <div className="flex gap-4">
 <button 
 onClick={() => handleChoiceA(true)}
 className="flex-1 py-6 bg-slate-50 border-2 border-transparent hover:border-amber-500 hover:bg-white rounded-3xl font-black uppercase tracking-widest text-slate-900 transition-all hover:scale-[1.05]"
 >
 Sí
 </button>
 <button 
 onClick={() => handleChoiceA(false)}
 className="flex-1 py-6 bg-slate-50 border-2 border-transparent hover:border-slate-400 hover:bg-white rounded-3xl font-black uppercase tracking-widest text-slate-900 transition-all hover:scale-[1.05]"
 >
 No
 </button>
 </div>
 </div>
 ) : (
 <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
 <div className="text-center space-y-4">
 <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-600 mx-auto">
 <Beef size={36} />
 </div>
 <h2 className="text-3xl font-black text-slate-900 leading-tight max-w-md mx-auto">
 ¿Manejan alguno de estos <span className="text-rose-600">alimentos</span>?
 </h2>
 <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Carne, pollo, pescado, lácteos o huevo</p>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <button 
 onClick={() => handleChoiceB("Sí")}
 className="py-5 bg-slate-50 border-2 border-transparent hover:border-rose-500 hover:bg-white rounded-3xl font-black uppercase tracking-widest text-slate-900 transition-all hover:scale-[1.05]"
 >
 Sí
 </button>
 <button 
 onClick={() => handleChoiceB("No")}
 className="py-5 bg-slate-50 border-2 border-transparent hover:border-slate-400 hover:bg-white rounded-3xl font-black uppercase tracking-widest text-slate-900 transition-all hover:scale-[1.05]"
 >
 No
 </button>
 </div>
 <button 
 onClick={() => setSubStep(1)}
 className="w-full py-2 font-black uppercase tracking-[0.3em] text-[10px] text-slate-300 hover:text-slate-600 transition-colors"
 >
 ← Volver a la pregunta anterior
 </button>
 </div>
 )}
 </div>
 );
}

function Step6({ formData, setFormData, onSubmit, onBack, loading }: any) {
 return (
 <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
 <div className="text-center space-y-2">
 <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={64} />
 <h2 className="text-3xl font-black text-slate-900 ">¡Plan configurado!</h2>
 <p className="text-slate-500 font-medium">Revisa que todo esté correcto antes de generar el documento final.</p>
 </div>

 <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 space-y-6">
 <div className="grid grid-cols-2 gap-6">
 <div>
 <span className="block text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Negocio</span>
 <p className="font-bold text-slate-900 text-sm">{formData.businessName}</p>
 </div>
 <div>
 <span className="block text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">NIT</span>
 <p className="font-bold text-slate-900 text-sm">{formData.nit}</p>
 </div>
 <div className="col-span-2">
 <span className="block text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Representante Legal</span>
 <p className="font-bold text-slate-900 text-sm">{formData.ownerName}</p>
 </div>
 <div className="col-span-2">
 <span className="block text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Identidad</span>
 <p className="font-bold text-slate-900 text-sm">{formData.establishmentType} - {formData.products}</p>
 </div>
 <div>
 <span className="block text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Logotipo</span>
 <p className="font-bold text-slate-900 text-sm">{formData.logo ? "Adjunto ✅" : "No incluido"}</p>
 </div>
 <div>
 <span className="block text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Domicilios</span>
 <p className="font-bold text-slate-900 text-sm">{formData.hasDelivery ? "Sí ✅" : "No"}</p>
 </div>
 <div className="col-span-2">
 <span className="block text-[8px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Equipos y Espacios</span>
 <p className="text-slate-500 font-medium text-xs leading-relaxed italic">
 {formData.equipment.substring(0, 80)}... / {formData.spaces.substring(0, 80)}...
 </p>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <button 
 disabled={loading}
 onClick={onSubmit}
 className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/30"
 >
 {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
 {loading ? "Generando Plan..." : "Generar Plan Ahora"}
 </button>
 <button onClick={onBack} className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900 transition-all flex items-center justify-center gap-2">
 ← Corregir información
 </button>
 </div>
 </div>
 );
}
