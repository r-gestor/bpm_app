"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  GraduationCap,
  Plus,
  Search,
  Mail,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ChevronRight,
  Edit,
  Copy,
  User,
  Download,
  UserCog,
  KeyRound
} from "lucide-react";
import Link from "next/link";
import { ORDER_STATUSES } from "@/config/constants";

interface Student {
  id: string;
  name: string;
  email: string;
  documentType: string;
  documentNumber: string;
  isActive: boolean;
  activationToken?: string | null;
  hasCertificate: boolean;
  certificateId?: string | null;
  progressPercent?: number;
  createdAt: string;
}

interface SanitationPlan {
  id: string;
  businessName: string;
  establishmentType: string;
  status: string;
  createdAt: string;
  certificateCode: string;
  content: { pdfUrl?: string } | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<Student[]>([]);
  const [sanitationPlans, setSanitationPlans] = useState<SanitationPlan[]>([]);
  const [quota, setQuota] = useState({ totalSlots: 0, usedSlots: 0, remainingSlots: 0 });
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [hasEnrollment, setHasEnrollment] = useState(false);
  const [certifiedCount, setCertifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [retryingPdf, setRetryingPdf] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    documentType: "CC",
    documentNumber: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastActivationLink, setLastActivationLink] = useState("");
  const [shouldBounce, setShouldBounce] = useState(false);
  const [showEnrollGuide, setShowEnrollGuide] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({ name: "", documentType: "CC", documentNumber: "" });
  const [profileHasCertificate, setProfileHasCertificate] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const userRole = (session?.user as any)?.role || "BUYER";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchStudents();
      fetchSanitationPlans();
      fetchProfile();
    }
  }, [status, router]);

  useEffect(() => {
    // Check if user has dismissed the guide before
    const isDismissed = localStorage.getItem("enroll_guide_dismissed");
    if (!isDismissed) {
      setShowEnrollGuide(true);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get("enroll_required") === "true") {
      setShouldBounce(true);
      setShowEnrollGuide(true);
      
      // Auto-scroll to the top to see the buttons
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Stop bouncing after ~5 seconds
      setTimeout(() => {
        setShouldBounce(false);
      }, 5000);

      // Remove param without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const dismissGuide = () => {
    setShowEnrollGuide(false);
    localStorage.setItem("enroll_guide_dismissed", "true");
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (res.ok) {
        setProfileData({
          name: data.name || "",
          documentType: data.documentType || "CC",
          documentNumber: data.documentNumber || ""
        });
        setProfileHasCertificate(data.hasCertificate || false);
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  };

  const handleRetryPdf = async (planId: string) => {
    setRetryingPdf(planId);
    try {
      const res = await fetch(`/api/admin/plans/${planId}/generate-pdf`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await fetchSanitationPlans(); // refrescar para mostrar el nuevo pdfUrl
      } else {
        console.error("Error al generar PDF:", data.error);
      }
    } catch (err) {
      console.error("Error al reintentar PDF:", err);
    } finally {
      setRetryingPdf(null);
    }
  };

  const fetchSanitationPlans = async () => {
    try {
      const res = await fetch("/api/sanitation/plans");
      const data = await res.json();
      if (Array.isArray(data)) {
        setSanitationPlans(data);
      }
    } catch (err) {
      console.error("Error fetching sanitation plans:", err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      
      if (data.role) {
        setCurrentRole(data.role);
      }
      
      setStudents(data.students || []);
      setQuota(data.quota || { totalSlots: 0, usedSlots: 0, remainingSlots: 0 });
      setHasEnrollment(data.hasEnrollment || false);
      setCertifiedCount(data.certifiedCount || 0);
    } catch (err) {
      console.error("Error fetching students:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setSuccess("Estudiante registrado con éxito. Se ha generado su cuenta.");
      setLastActivationLink(data.activationLink);
      setFormData({ name: "", email: "", documentType: "CC", documentNumber: "", password: "" });
      fetchStudents();
      // Ya no cerramos el modal automáticamente tan rápido para que puedan ver el link
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setFormLoading(true);
    setError("");

    try {
      const res = await fetch("/api/students/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedStudent.id,
          ...formData
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess("Estudiante actualizado exitosamente.");
      fetchStudents();
      setTimeout(() => {
        setEditModal(false);
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfileSuccess("Datos actualizados exitosamente.");
      fetchProfile();
    } catch (err: any) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSelfEnroll = async () => {
    if (!confirm("¿Deseas inscribirte a ti mismo como estudiante? Esto consumirá 1 cupo de tu cuenta.")) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/students/enroll-self", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSuccess("Te has inscrito exitosamente.");
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg pt-32 pb-20">
      <div className="container mx-auto px-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-accent tracking-tight uppercase">
              {(currentRole || userRole) === "BUYER" ? "Panel de Comprador" : "Mi Aprendizaje"}
            </h1>
            <p className="text-text-muted mt-2 font-medium">
              Bienvenido de nuevo, <span className="text-primary">{session?.user?.name}</span>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => { setProfileError(""); setProfileSuccess(""); setShowProfileModal(true); }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:border-primary/40 text-text rounded-2xl font-bold transition-all shadow-sm"
            >
              <UserCog size={20} /> Mis Datos
            </button>
          </div>

          {(currentRole || userRole) === "BUYER" && (
            <div className="flex flex-wrap gap-4">
              <div className="bg-primary-light border border-primary/20 px-6 py-3.5 rounded-2xl flex flex-col justify-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-dark">Cupos Disponibles</p>
                <div className="flex items-center gap-4">
                  <p className="text-xl font-black text-accent">{quota.remainingSlots}</p>
                  <Link 
                    href="/checkout/manipulacion-alimentos"
                    className="text-[10px] font-bold uppercase tracking-widest bg-primary hover:bg-primary-dark text-text px-3 py-1 rounded-lg transition-colors"
                  >
                    Agregar más cupos
                  </Link>
                </div>
              </div>

              <button 
                onClick={handleSelfEnroll}
                disabled={quota.remainingSlots === 0 || hasEnrollment}
                className={`flex items-center justify-center gap-2 px-6 py-3.5 bg-accent hover:bg-accent-light disabled:bg-slate-200 disabled:text-text-muted text-white rounded-2xl font-bold transition-all shadow-brand ${
                  shouldBounce && quota.remainingSlots > 0 ? "animate-bounce ring-4 ring-primary ring-offset-2 ring-offset-bg" : ""
                }`}
              >
                <User size={20} /> {hasEnrollment ? "Ya estás Inscrito" : "Inscribirme como Estudiante"}
              </button>

              {hasEnrollment && (
                <Link 
                  href="/course-content"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-dark text-text rounded-2xl font-bold transition-all shadow-brand"
                >
                  <GraduationCap size={20} /> Ir a mi Curso
                </Link>
              )}

              <button 
                onClick={() => {
                  setFormData({ name: "", email: "", documentType: "CC", documentNumber: "", password: "" });
                  setShowModal(true);
                }}
                disabled={quota.remainingSlots === 0}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary hover:bg-primary-dark disabled:bg-slate-200 disabled:text-text-muted text-text rounded-2xl font-bold transition-all shadow-brand"
              >
                <Plus size={20} /> Registrar Trabajador
              </button>
            </div>
          )}
        </div>
  
        {/* Main Dashboard Content */}
        <>
          {showEnrollGuide && (
            <div className="mb-12 p-8 bg-primary/5 border-2 border-primary/20 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shrink-0 animate-pulse">
                <GraduationCap size={40} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-black text-accent uppercase tracking-tight mb-2">Pasos para comenzar</h3>
                <p className="text-text-muted font-medium max-w-xl">
                  Para acceder a las clases, primero debes asignar tus cupos: puedes <span className="text-accent font-bold">"Inscribirme como Estudiante"</span> (para ti mismo) o <span className="text-accent font-bold">"Registrar Trabajador"</span> (para otra persona).
                </p>
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-2 text-primary-dark font-bold text-sm bg-primary-light/50 px-4 py-2 rounded-xl inline-flex">
                    <AlertCircle size={16} />
                    Recordatorio: Debes tener cupos disponibles para completar esta acción.
                  </div>
                </div>
              </div>
              <button 
                onClick={dismissGuide}
                className="bg-accent hover:bg-accent-light text-white font-black text-xs uppercase tracking-[0.2em] px-8 py-4 rounded-2xl shadow-lg transition-all active:scale-95 border border-white/20"
              >
                ¡Entendido!
              </button>
            </div>
          )}

          {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white border-t-4 border-primary p-6 rounded-3xl shadow-brand group transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <Users className="text-primary w-6 h-6" />
                </div>
                <p className="text-text-muted text-xs font-bold uppercase tracking-widest">Estudiantes Registrados</p>
                <p className="text-3xl font-black text-accent mt-1">
                  {quota.usedSlots} <span className="text-slate-400 text-xl font-medium">/ {quota.totalSlots}</span>
                </p>
              </div>
              
              <div className="bg-white border-t-4 border-primary p-6 rounded-3xl shadow-brand group transition-all">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                  <GraduationCap className="text-primary group-hover:scale-110 transition-transform" size={24} />
                </div>
                <p className="text-text-muted text-sm font-bold uppercase tracking-widest mb-1">Usuarios Certificados</p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-3xl font-black text-accent">{certifiedCount}</h4>
                </div>
              </div>
              <div className="bg-white border-t-4 border-accent p-6 rounded-3xl shadow-brand group transition-all">
                <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mb-4">
                  <Clock className="text-accent w-6 h-6" />
                </div>
                <p className="text-text-muted text-xs font-bold uppercase tracking-widest">Usuarios sin certificación</p>
                <p className="text-3xl font-black text-accent mt-1">{quota.usedSlots - certifiedCount}</p>
              </div>
            </div>

            {/* Students List */}
            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-brand">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-xl font-bold text-accent uppercase tracking-tighter">Listado de Estudiantes</h2>
                <div className="relative hidden md:block">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre o email..." 
                    className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-sm text-text placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-64"
                  />
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-text-muted text-xs font-bold uppercase tracking-widest border-b border-slate-100 bg-slate-50">
                      <th className="px-8 py-5">Estudiante</th>
                      <th className="px-8 py-5 text-center">Progreso</th>
                      <th className="px-8 py-5">Identificación</th>
                      <th className="px-8 py-5">Registro</th>
                      <th className="px-8 py-5">Estado</th>
                      <th className="px-8 py-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.length > 0 ? (
                      students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center font-bold text-primary">
                                {student.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-text font-bold">{student.name}</p>
                                <p className="text-text-muted text-xs">{student.email}</p>
                              </div>
                            </div>
                          </td>
                           <td className="px-8 py-6">
                             <div className="flex flex-col gap-2 min-w-[120px]">
                               <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight text-text-muted">
                                 <span>{student.progressPercent}% completado</span>
                               </div>
                               <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                 <div 
                                   className="bg-primary h-full rounded-full transition-all duration-500"
                                   style={{ width: `${student.progressPercent}%` }}
                                 ></div>
                               </div>
                             </div>
                           </td>
                           <td className="px-8 py-6 text-sm text-text-muted">
                              <span className="font-bold text-text mr-2">{student.documentType}</span>
                              {student.documentNumber}
                           </td>
                           <td className="px-8 py-6 text-sm text-text-muted font-medium">
                             {new Date(student.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                           </td>
                           <td className="px-8 py-6">
                             <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                               student.isActive 
                               ? "bg-success/10 text-success border border-success/20" 
                               : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                             }`}>
                               {student.isActive ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                               {student.isActive ? "Activo" : "Pendiente"}
                             </div>
                           </td>
                           <td className="px-8 py-6 text-right">
                             <div className="flex items-center justify-end gap-2">
                               {!student.isActive && student.activationToken && (
                                 <a
                                   href={`${window.location.origin}/activate?token=${student.activationToken}`}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 rounded-xl transition-all flex items-center gap-2"
                                   title="Abrir enlace de activación"
                                 >
                                   <KeyRound size={18} />
                                   <span className="text-[10px] font-bold uppercase tracking-widest">Autenticar Usuario</span>
                                 </a>
                               )}
                               {student.hasCertificate && (
                                 <Link 
                                   href={`/api/certificates/${student.certificateId}`}
                                   className="p-2.5 bg-success/10 hover:bg-emerald-500/20 text-success border border-success/20 rounded-xl transition-all"
                                   title="Descargar Certificado"
                                   target="_blank"
                                 >
                                    <Download size={18} />
                                 </Link>
                               )}
                               <button 
                                 onClick={() => {
                                   setSelectedStudent(student);
                                   setFormData({
                                     name: student.name,
                                     email: student.email,
                                     documentType: student.documentType || "CC",
                                     documentNumber: student.documentNumber || ""
                                   });
                                   setEditModal(true);
                                 }}
                                 className="p-2.5 bg-white/5 hover:bg-blue-500/10 text-text-muted hover:text-primary border border-slate-100 hover:border-blue-500/20 rounded-xl transition-all"
                                 title="Editar Estudiante"
                               >
                                  <Edit size={18} />
                               </button>
                             </div>
                           </td>         
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                           <div className="flex flex-col items-center">
                              <Users size={48} className="text-primary/20 mb-4" />
                              <p className="text-text-muted font-medium">No has registrado ningún estudiante todavía.</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* NEW SECTION: Sanitation Plans */}
            <div className="mt-16 bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-brand">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success border border-success/20">
                    <FileText size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-accent uppercase tracking-tighter">Plan de Saneamiento</h2>
                </div>
                <Link 
                  href="/plan-de-saneamiento"
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-dark transition-colors"
                >
                  Solicitar nuevo plan
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-text-muted text-xs font-bold uppercase tracking-widest border-b border-slate-100 bg-slate-50">
                      <th className="px-8 py-5">Negocio</th>
                      <th className="px-8 py-5">Código / Ref</th>
                      <th className="px-8 py-5">Fecha</th>
                      <th className="px-8 py-5">Estado</th>
                      <th className="px-8 py-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sanitationPlans.length > 0 ? (
                      sanitationPlans.map((plan) => (
                        <tr key={plan.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-6">
                            <div>
                              <p className="text-accent font-bold">{plan.businessName}</p>
                              <p className="text-text-muted text-xs uppercase tracking-wider">{plan.establishmentType}</p>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm font-mono text-slate-400">
                            {plan.certificateCode}
                          </td>
                          <td className="px-8 py-6 text-sm text-text-muted font-medium">
                            {new Date(plan.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-8 py-6">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              (plan.status === 'COMPLETED' || plan.status === ORDER_STATUSES.APPROVED)
                              ? "bg-success/10 text-success border border-success/20" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}>
                              {(plan.status === 'COMPLETED' || plan.status === ORDER_STATUSES.APPROVED) ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                              {(plan.status === 'COMPLETED' || plan.status === ORDER_STATUSES.APPROVED) ? "Aprobado" : "Por Aprobar / Pago Pendiente"}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                             {(plan.status === 'COMPLETED' || plan.status === ORDER_STATUSES.APPROVED) ? (
                               <div className="flex flex-col items-end gap-1">
                                 {plan.content?.pdfUrl ? (
                                   <a
                                     href={plan.content.pdfUrl}
                                     target="_blank"
                                     rel="noopener noreferrer"
                                     className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-primary border border-blue-500/20 rounded-xl transition-all flex items-center gap-2"
                                     title="Descargar Plan"
                                   >
                                     <Download size={18} />
                                     <span className="text-[10px] font-bold uppercase tracking-widest">Descargar Plan</span>
                                   </a>
                                 ) : (
                                   <div className="flex flex-col items-end gap-1">
                                     <button
                                       onClick={() => handleRetryPdf(plan.id)}
                                       disabled={retryingPdf === plan.id}
                                       className="p-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/20 rounded-xl flex items-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                     >
                                       {retryingPdf === plan.id ? (
                                         <Loader2 size={18} className="animate-spin" />
                                       ) : (
                                         <Download size={18} />
                                       )}
                                       <span className="text-[10px] font-bold uppercase tracking-widest">
                                         {retryingPdf === plan.id ? "Generando PDF..." : "Generar PDF"}
                                       </span>
                                     </button>
                                     <span className="text-[8px] text-text-muted uppercase font-bold italic">Listo — clic para generar</span>
                                   </div>
                                 )}
                               </div>
                             ) : (
                               <Link 
                                 href={`/checkout/plan-saneamiento-iav?planId=${plan.id}`}
                                 className="text-[10px] font-bold uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
                               >
                                 Pagar para Activar
                               </Link>
                             )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                           <div className="flex flex-col items-center">
                              <FileText size={48} className="text-primary/20 mb-4" />
                              <p className="text-text-muted font-medium">No has solicitado ningún Plan de Saneamiento todavía.</p>
                              <Link 
                                href="/plan-de-saneamiento"
                                className="mt-4 px-6 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-primary rounded-xl text-xs font-bold transition-all border border-blue-500/20"
                              >
                                Empezar mi Plan Gratis
                              </Link>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-text/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 w-full max-w-lg rounded-[2.5rem] shadow-brand overflow-hidden relative animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 bg-bg-section">
              <h3 className="text-2xl font-black text-accent uppercase tracking-tight">Mis Datos Personales</h3>
              <p className="text-text-muted text-sm mt-1">Actualiza tu nombre e identificación.</p>
            </div>

            <div className="p-8 space-y-6">
              {/* Nota de advertencia */}
              <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <p className="text-amber-700 text-sm leading-relaxed">
                  <strong>Importante:</strong> Sus datos personales deben ser precisos debido a que con estos se generará su Certificado de Manipulación de Alimentos y una vez se expida no podrá corregirlos.
                </p>
              </div>

              {profileHasCertificate ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3 text-slate-500 text-sm font-bold">
                    <CheckCircle2 size={20} className="text-success" />
                    Ya tienes un Certificado de Manipulación de Alimentos emitido.
                  </div>
                  <p className="text-text-muted text-xs leading-relaxed">
                    Tus datos no pueden ser modificados porque ya se emitió un certificado a tu nombre. Si necesitas una corrección, contacta al soporte.
                  </p>
                  <div className="space-y-2 pt-2 text-sm text-text-muted">
                    <p><span className="font-bold text-text">Nombre:</span> {profileData.name}</p>
                    <p><span className="font-bold text-text">Documento:</span> {profileData.documentType} {profileData.documentNumber}</p>
                  </div>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-text-muted rounded-xl font-bold transition-all"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  {profileError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                      <AlertCircle size={18} /> {profileError}
                    </div>
                  )}
                  {profileSuccess && (
                    <div className="p-4 bg-success/10 border border-success/20 rounded-2xl flex items-center gap-3 text-success text-sm font-bold">
                      <CheckCircle2 size={18} /> {profileSuccess}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-text text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Tipo Doc.</label>
                      <select
                        value={profileData.documentType}
                        onChange={(e) => setProfileData({ ...profileData, documentType: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-text text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                      >
                        <option value="CC">CC</option>
                        <option value="CE">CE</option>
                        <option value="NIT">NIT</option>
                        <option value="PP">PP</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Número de Documento</label>
                      <input
                        type="text"
                        value={profileData.documentNumber}
                        onChange={(e) => setProfileData({ ...profileData, documentNumber: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-text text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowProfileModal(false)}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-text-muted rounded-2xl font-bold transition-all border border-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="flex-[2] py-4 bg-accent hover:bg-accent-light disabled:opacity-50 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {profileLoading ? <Loader2 size={20} className="animate-spin" /> : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-text/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 w-full max-w-lg rounded-[2.5rem] shadow-brand overflow-hidden relative animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 bg-bg-section">
               <h3 className="text-2xl font-black text-accent uppercase tracking-tight">Registrar Nuevo Trabajador</h3>
               <p className="text-text-muted text-sm mt-1">Crea una cuenta para tu estudiante y deja que se capacite.</p>
            </div>

            <form onSubmit={handleRegister} className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle size={20} /> {error}
                </div>
              )}
              {success && (
                <div className="p-6 bg-success/10 border border-success/20 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3 text-success text-sm font-bold">
                    <CheckCircle2 size={20} /> {success}
                  </div>
                  
                  {lastActivationLink && (
                    <div className="space-y-3 pt-2">
                       <p className="text-xs text-slate-400 font-medium italic">Enlace de activación manual (mientras se configura el envío de correos):</p>
                       <div className="flex items-center gap-2">
                          <input 
                            readOnly
                            value={lastActivationLink}
                            className="flex-1 bg-slate-950 border border-slate-100 rounded-xl py-2 px-4 text-[10px] text-primary font-mono focus:outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => navigator.clipboard.writeText(lastActivationLink)}
                            className="bg-blue-600/20 hover:bg-blue-600/30 text-primary text-[10px] font-bold px-3 py-2 rounded-xl transition-all"
                          >
                            Copiar
                          </button>
                       </div>
                    </div>
                  )}

                  <button 
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setSuccess("");
                      setLastActivationLink("");
                    }}
                    className="w-full py-3 bg-success/10 hover:bg-emerald-500/20 text-success rounded-xl text-sm font-bold transition-all border border-success/20"
                  >
                    Cerrar
                  </button>
                </div>
              )}

              {!success && (
                <>
                  <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Nombre Completo</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Ej. Juan Pérez"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-text text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Correo Electrónico</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="estudiante@empresa.com"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-text text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Tipo Doc.</label>
                    <select
                      value={formData.documentType}
                      onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-text text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="NIT">NIT</option>
                      <option value="PP">PP</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Número de Documento</label>
                    <input
                      type="text"
                      value={formData.documentNumber}
                      onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                      placeholder="12345678"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-text text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Contraseña</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-text text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    required
                  />
                  <p className="text-[11px] text-text-muted mt-2 ml-1">El trabajador usará esta contraseña para iniciar sesión. Compártela con él de forma segura.</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-text-muted rounded-2xl font-bold transition-all border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={formLoading}
                  className="flex-[2] py-4 bg-accent hover:bg-accent-light disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-xl shadow-brand flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 size={20} className="animate-spin" /> : "Crear Estudiante"}
                </button>
              </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-text/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-100 w-full max-w-lg rounded-[2.5rem] shadow-brand overflow-hidden relative animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 bg-bg-section">
               <h3 className="text-2xl font-black text-accent uppercase tracking-tight">Editar Estudiante</h3>
               <p className="text-text-muted text-sm mt-1">Actualiza la información de tu trabajador.</p>
            </div>

            <form onSubmit={handleUpdate} className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
                  <AlertCircle size={20} /> {error}
                </div>
              )}
              {success ? (
                <div className="p-6 bg-success/10 border border-success/20 rounded-2xl flex items-center gap-3 text-success text-sm font-bold">
                  <CheckCircle2 size={20} /> {success}
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Nombre Completo</label>
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        disabled={selectedStudent?.hasCertificate}
                        className={`w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-text text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none ${selectedStudent?.hasCertificate ? "opacity-50 cursor-not-allowed" : ""}`}
                        required
                      />
                      {selectedStudent?.hasCertificate && (
                        <p className="text-[10px] text-amber-500 mt-2 ml-1 flex items-center gap-1 font-bold italic">
                           <AlertCircle size={10} /> El nombre no puede cambiarse porque ya tiene un certificado emitido.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Correo Electrónico (No se puede cambiar)</label>
                      <input 
                        type="email"
                        value={formData.email}
                        disabled
                        className="w-full bg-slate-950/20 border border-slate-100 rounded-2xl py-4 px-6 text-text-muted text-sm outline-none cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Tipo Doc.</label>
                        <select 
                          value={formData.documentType}
                          onChange={(e) => setFormData({...formData, documentType: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-4 text-text text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none appearance-none"
                        >
                          <option value="CC">CC</option>
                          <option value="CE">CE</option>
                          <option value="NIT">NIT</option>
                          <option value="PP">PP</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">Número de Documento</label>
                        <input 
                          type="text"
                          value={formData.documentNumber}
                          onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
                          disabled={selectedStudent?.hasCertificate}
                          className={`w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 text-text text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none ${selectedStudent?.hasCertificate ? "opacity-50 cursor-not-allowed" : ""}`}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="button"
                      onClick={() => setEditModal(false)}
                      className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-text-muted rounded-2xl font-bold transition-all border border-slate-200"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={formLoading}
                      className="flex-[2] py-4 bg-accent hover:bg-accent-light disabled:opacity-50 text-accent rounded-2xl font-bold transition-all shadow-xl shadow-brand flex items-center justify-center gap-2"
                    >
                      {formLoading ? <Loader2 size={20} className="animate-spin" /> : "Guardar Cambios"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
