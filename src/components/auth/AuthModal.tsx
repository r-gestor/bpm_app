"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { Mail, Lock, AlertCircle, X, ShieldCheck } from "lucide-react";

interface AuthModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
 const [isNewUser, setIsNewUser] = useState(true);
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [error, setError] = useState("");
 const [loading, setLoading] = useState(false);

 if (!isOpen) return null;

 const handleAuth = async (e: React.FormEvent) => {
 e.preventDefault();
 setError("");
 setLoading(true);

 if (!email || !password) {
 setError("Email y contraseña son obligatorios");
 setLoading(false);
 return;
 }

 try {
 if (isNewUser) {
 const regRes = await fetch("/api/auth/register", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email, password }),
 });
 const regData = await regRes.json();
 if (regData.error) {
 setError(regData.error);
 setLoading(false);
 return;
 }
 }

 const loginResult = await signIn("credentials", {
 email,
 password,
 redirect: false,
 });

 if (loginResult?.error) {
 setError("Credenciales incorrectas o error al iniciar sesión");
 setLoading(false);
 return;
 }

 if (onSuccess) onSuccess();
 onClose();
 } catch (err) {
 setError("Error en la autenticación");
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-text/80 backdrop-blur-sm animate-in fade-in duration-300">
 <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-brand p-8 border border-white/10 animate-in zoom-in-95 duration-300 relative overflow-hidden">
 {/* Background blobs */}
 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16" />
 <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/10 blur-3xl -ml-16 -mb-16" />

 <button 
 onClick={onClose}
 className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"
 >
 <X size={24} />
 </button>

 <div className="relative z-10">
 <div className="text-center mb-8">
 <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-brand">
 <ShieldCheck className="text-white" size={32} />
 </div>
 <h3 className="text-2xl font-black text-slate-900 leading-tight">
 {isNewUser ? "Crea tu cuenta" : "Inicia sesión"}
 </h3>
 <p className="text-slate-500 text-sm mt-2 font-medium">
 Necesario para guardar y gestionar tus <br /> Planes de Saneamiento.
 </p>
 </div>

 <form onSubmit={handleAuth} className="space-y-4">
 {/* Google Login */}
 <button
 type="button"
 onClick={() => signIn("google")}
 className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 py-3.5 rounded-2xl font-black text-slate-700 hover:bg-slate-50 transition-all mb-4 text-xs uppercase tracking-widest"
 >
 <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
 Continuar con Google
 </button>

 <div className="relative flex items-center py-2">
 <div className="flex-grow border-t border-slate-100 "></div>
 <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">o tu correo</span>
 <div className="flex-grow border-t border-slate-100 "></div>
 </div>

 <div className="space-y-4">
 <div className="relative group">
 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
 <input
 type="email"
 placeholder="Email"
 className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-slate-900 font-bold outline-none transition-all placeholder:text-slate-400"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 />
 </div>

 <div className="relative group">
 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
 <input
 type="password"
 placeholder="Contraseña"
 className="w-full bg-slate-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl pl-12 pr-4 py-4 text-slate-900 font-bold outline-none transition-all placeholder:text-slate-400"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 />
 </div>
 </div>

 {error && (
 <p className="text-red-500 text-[11px] flex items-center font-bold bg-red-500/5 p-4 rounded-2xl border border-red-500/10 animate-in slide-in-from-top-2">
 <AlertCircle size={14} className="mr-2 shrink-0" />
 {error}
 </p>
 )}

 <button
 disabled={loading}
 className="w-full bg-accent hover:bg-accent-light text-white font-black py-5 rounded-2xl transition-all shadow-brand hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
 >
 {loading ? "Procesando..." : (isNewUser ? "Registrarse y continuar" : "Entrar y continuar")}
 </button>

 <div className="text-center pt-4">
 <button 
 type="button"
 onClick={() => setIsNewUser(!isNewUser)}
 className="text-primary hover:text-primary-dark text-xs font-black uppercase tracking-widest hover:underline"
 >
 {isNewUser ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>
 );
}
