"use client";

import React, { useState } from "react";
import { Building2, Users, LayoutGrid, Trash2, ArrowRight, ArrowLeft, Loader2, Sparkles } from "lucide-react";

const ESTABLISHMENT_TYPES = [
 { id: "PREPARACION", label: "Preparación / Restaurante" },
 { id: "ALMACENAMIENTO", label: "Almacenamiento / Bodega" },
 { id: "FRUVER", label: "Fruver / Frutas y Verduras" },
 { id: "CARNICERIA", label: "Carnicería" },
 { id: "GRANDE_SUPERFICIE", label: "Grande Superficie" },
];

export default function BusinessForm({ onComplete }: { onComplete: (plan: any) => void }) {
 const [step, setStep] = useState(1);
 const [loading, setLoading] = useState(false);
 const [formData, setFormData] = useState({
 businessName: "",
 type: "PREPARACION",
 employeeCount: 1,
 kitchenArea: "",
 areas: [] as string[],
 equipment: [] as string[],
 wasteHandling: "Separación básica",
 });

 const handleNext = () => setStep(step + 1);
 const handleBack = () => setStep(step - 1);

 const handleSubmit = async () => {
 setLoading(true);
 try {
 const res = await fetch("/api/sanitation/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(formData),
 });
 const data = await res.json();
 onComplete(data);
 } catch (error) {
 console.error("Error generating plan:", error);
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="max-w-3xl mx-auto bg-white rounded-[40px] shadow-2xl border border-slate-100 p-10 overflow-hidden relative">
 <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 ">
 <div 
 className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500" 
 style={{ width: `${(step / 3) * 100}%` }}
 ></div>
 </div>

 {step === 1 && (
 <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
 <div>
 <h2 className="text-3xl font-black text-slate-900 mb-2">Identidad del Negocio</h2>
 <p className="text-slate-500">Comencemos con lo básico para personalizar su plan.</p>
 </div>

 <div className="space-y-6">
 <div className="space-y-2">
 <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nombre del Establecimiento</label>
 <input 
 className="w-full bg-slate-50 p-4 rounded-2xl border border-transparent focus:border-blue-500 outline-none transition-all font-bold"
 value={formData.businessName}
 onChange={(e) => setFormData({...formData, businessName: e.target.value})}
 placeholder="Ej. Restaurante Gran Sabor"
 />
 </div>

 <div className="space-y-2">
 <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tipo de Negocio</label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {ESTABLISHMENT_TYPES.map((t) => (
 <button
 key={t.id}
 onClick={() => setFormData({...formData, type: t.id})}
 className={`p-4 rounded-xl border-2 text-left transition-all ${
 formData.type === t.id 
 ? "border-blue-600 bg-blue-50 text-blue-700 " 
 : "border-slate-50 text-slate-500"
 }`}
 >
 <span className="font-bold">{t.label}</span>
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>
 )}

 {step === 2 && (
 <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
 <div>
 <h2 className="text-3xl font-black text-slate-900 mb-2">Infraestructura</h2>
 <p className="text-slate-500">Detalles sobre su espacio y equipo de trabajo.</p>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-2">
 <label className="text-xs font-black uppercase tracking-widest text-slate-400">Empleados</label>
 <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
 <button onClick={() => setFormData({...formData, employeeCount: Math.max(1, formData.employeeCount - 1)})} className="p-3 bg-white rounded-xl shadow">-</button>
 <span className="flex-1 text-center font-bold">{formData.employeeCount}</span>
 <button onClick={() => setFormData({...formData, employeeCount: formData.employeeCount + 1})} className="p-3 bg-white rounded-xl shadow">+</button>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-black uppercase tracking-widest text-slate-400">Área de Cocina (m2)</label>
 <input 
 type="number"
 className="w-full bg-slate-50 p-4 rounded-2xl border border-transparent focus:border-blue-500 outline-none transition-all font-bold text-center"
 value={formData.kitchenArea}
 onChange={(e) => setFormData({...formData, kitchenArea: e.target.value})}
 placeholder="0"
 />
 </div>
 </div>

 <div className="space-y-2">
 <label className="text-xs font-black uppercase tracking-widest text-slate-400">Equipos Disponibles</label>
 <div className="flex flex-wrap gap-2">
 {["Neveras", "Estufas Industriales", "Congeladores", "Hornos", "Mesas Inox"].map((item) => {
 const isSelected = formData.equipment.includes(item);
 return (
 <button
 key={item}
 onClick={() => {
 const newEq = isSelected 
 ? formData.equipment.filter(e => e !== item)
 : [...formData.equipment, item];
 setFormData({...formData, equipment: newEq});
 }}
 className={`px-4 py-2 rounded-full border-2 transition-all font-bold text-sm ${
 isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-100 text-slate-500"
 }`}
 >
 {item}
 </button>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {step === 3 && (
 <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
 <div className="text-center">
 <Sparkles className="mx-auto text-blue-600 mb-6" size={64} />
 <h2 className="text-3xl font-black text-slate-900 mb-2 uppercase">¡Todo listo!</h2>
 <p className="text-slate-500 max-w-sm mx-auto">Nuestro agente de IA generará un documento 100% ajustado a las normativas de salud vigentes.</p>
 </div>

 <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 ">
 <div className="flex justify-between items-center mb-4">
 <span className="font-bold text-blue-800 ">Resumen del negocio</span>
 <button onClick={() => setStep(1)} className="text-xs font-black uppercase text-blue-600 hover:underline">Editar</button>
 </div>
 <p className="text-sm text-blue-600/80 leading-relaxed font-medium">
 Establecimiento de {formData.type} con {formData.employeeCount} empleados y {formData.equipment.length} equipos principales.
 </p>
 </div>
 </div>
 )}

 <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-100 ">
 {step > 1 ? (
 <button onClick={handleBack} className="flex items-center gap-2 font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest text-xs">
 <ArrowLeft size={16} /> Atrás
 </button>
 ) : <div />}

 {step < 3 ? (
 <button 
 disabled={!formData.businessName}
 onClick={handleNext} 
 className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black transition-all hover:scale-105 shadow-xl disabled:opacity-50"
 >
 Siguiente <ArrowRight size={20} />
 </button>
 ) : (
 <button 
 onClick={handleSubmit} 
 disabled={loading}
 className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-2xl font-black transition-all hover:scale-110 shadow-2xl shadow-blue-500/30"
 >
 {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
 {loading ? "Generando..." : "Generar Plan con IA"}
 </button>
 )}
 </div>
 </div>
 );
}
