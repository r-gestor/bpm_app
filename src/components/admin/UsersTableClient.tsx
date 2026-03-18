"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Calendar,
  ShieldAlert,
  UserCheck,
  Pencil,
  X,
  Loader2,
  Save,
  Award,
  CheckCircle2,
  BookOpen,
} from "lucide-react";

type Certificate = {
  id: string;
  createdAt: string;
  status: string;
  expiresAt: string | null;
};

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone?: string | null;
  documentType?: string | null;
  documentNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  certificates?: Certificate[];
};

type CourseStatus = {
  courseId: string;
  title: string;
  productName: string;
  enrollmentId: string | null;
  certificateId: string | null;
  isApproved: boolean;
};

const ROLES = ["ADMIN", "BUYER", "STUDENT", "PROFESSIONAL"];

const roleBadge: Record<string, string> = {
  ADMIN: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  BUYER: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  STUDENT: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  PROFESSIONAL: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
};

export default function UsersTableClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Partial<User> & { password?: string }>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [downloadingCert, setDownloadingCert] = useState<string | null>(null);

  // Courses section state
  const [courses, setCourses] = useState<CourseStatus[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [approvingCourse, setApprovingCourse] = useState<string | null>(null);

  // Load courses when edit modal opens
  useEffect(() => {
    if (!editing) {
      setCourses([]);
      return;
    }
    setLoadingCourses(true);
    fetch(`/api/admin/users/${editing.id}/courses`)
      .then((r) => r.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]))
      .finally(() => setLoadingCourses(false));
  }, [editing?.id]);

  async function handleApproveCourse(courseId: string) {
    if (!editing) return;
    setApprovingCourse(courseId);
    try {
      const res = await fetch(`/api/admin/users/${editing.id}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Error al aprobar");
      }
      const newCert: Certificate = await res.json();

      // Update courses list
      setCourses((prev) =>
        prev.map((c) =>
          c.courseId === courseId
            ? { ...c, isApproved: true, certificateId: newCert.id }
            : c
        )
      );

      // Update users table so download button appears immediately
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editing.id
            ? {
                ...u,
                certificates: [
                  ...(u.certificates ?? []).filter((c) => c.id !== newCert.id),
                  newCert,
                ],
              }
            : u
        )
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setApprovingCourse(null);
    }
  }

  async function handleDownloadCert(certId: string, studentName: string | null) {
    setDownloadingCert(certId);
    try {
      const res = await fetch(`/api/certificates/${certId}`);
      if (!res.ok) throw new Error("Error al descargar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Certificado_${(studentName || "estudiante").replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail
    } finally {
      setDownloadingCert(null);
    }
  }

  function openEdit(user: User) {
    setEditing(user);
    setForm({
      name: user.name ?? "",
      email: user.email,
      role: user.role,
      phone: user.phone ?? "",
      documentType: user.documentType ?? "",
      documentNumber: user.documentNumber ?? "",
      isActive: user.isActive,
      password: "",
    });
    setError("");
  }

  function closeEdit() {
    setEditing(null);
    setForm({});
    setError("");
    setCourses([]);
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = { ...form };
      if (!body.password) delete body.password;

      const res = await fetch(`/api/admin/users/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      const updated: User = await res.json();
      // Preserve certificates since PUT response doesn't include them
      setUsers((prev) =>
        prev.map((u) =>
          u.id === updated.id ? { ...updated, certificates: u.certificates } : u
        )
      );
      closeEdit();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Usuario</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Rol</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Estado</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Registro</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-blue-400 font-bold shrink-0">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                          {user.name || "Sin nombre"}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${roleBadge[user.role] ?? "bg-slate-500/10 text-slate-400 border border-slate-500/20"}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    {user.isActive ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <UserCheck className="w-4 h-4" /> Activo
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                        <ShieldAlert className="w-4 h-4" /> Inactivo
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                      {/* Download certificate — any user with a valid cert */}
                      {(() => {
                        const validCert = user.certificates?.find((c) => c.status === "VALID");
                        if (!validCert) return null;
                        const isLoading = downloadingCert === validCert.id;
                        return (
                          <button
                            onClick={() => handleDownloadCert(validCert.id, user.name)}
                            disabled={isLoading}
                            title={`Descargar certificado — emitido ${new Date(validCert.createdAt).toLocaleDateString("es-CO")}`}
                            className="p-2 hover:bg-emerald-500/10 rounded-xl transition-all group/cert disabled:opacity-50"
                          >
                            {isLoading
                              ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                              : <Award className="w-4 h-4 text-slate-500 group-hover/cert:text-emerald-400 transition-colors" />
                            }
                          </button>
                        );
                      })()}
                      <button
                        onClick={() => openEdit(user)}
                        className="p-2 hover:bg-blue-500/10 rounded-xl transition-all group/btn"
                        title="Editar usuario"
                      >
                        <Pencil className="w-4 h-4 text-slate-500 group-hover/btn:text-blue-400 transition-colors" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-[2rem] w-full max-w-lg shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
              <div>
                <h3 className="text-lg font-black text-white">Editar Usuario</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editing.email}</p>
              </div>
              <button onClick={closeEdit} className="p-2 hover:bg-white/5 rounded-xl transition-all">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Form */}
            <div className="px-8 py-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <Field label="Nombre">
                <input
                  type="text"
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls}
                  placeholder="Nombre completo"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputCls}
                  placeholder="correo@ejemplo.com"
                />
              </Field>

              <Field label="Rol">
                <select
                  value={form.role ?? "BUYER"}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={inputCls}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>

              <Field label="Teléfono">
                <input
                  type="text"
                  value={form.phone ?? ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inputCls}
                  placeholder="+57 300 000 0000"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Tipo de Documento">
                  <select
                    value={form.documentType ?? ""}
                    onChange={(e) => setForm({ ...form, documentType: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">Sin tipo</option>
                    <option value="CC">Cédula de Ciudadanía</option>
                    <option value="CE">Cédula de Extranjería</option>
                    <option value="NIT">NIT</option>
                    <option value="PP">Pasaporte</option>
                  </select>
                </Field>
                <Field label="Número de Documento">
                  <input
                    type="text"
                    value={form.documentNumber ?? ""}
                    onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
                    className={inputCls}
                    placeholder="123456789"
                  />
                </Field>
              </div>

              <Field label="Nueva Contraseña (opcional)">
                <input
                  type="password"
                  value={form.password ?? ""}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={inputCls}
                  placeholder="Dejar vacío para no cambiar"
                />
              </Field>

              <Field label="Estado">
                <div className="flex items-center gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: true })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      form.isActive
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10"
                    }`}
                  >
                    Activo
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: false })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      !form.isActive
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-white/5 text-slate-500 border border-white/5 hover:bg-white/10"
                    }`}
                  >
                    Inactivo
                  </button>
                </div>
              </Field>

              {/* ── Courses / Approval Section ── */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Aprobación de Cursos
                  </span>
                </div>

                {loadingCourses ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
                    <Loader2 className="w-4 h-4 animate-spin" /> Cargando cursos...
                  </div>
                ) : courses.length === 0 ? (
                  <p className="text-xs text-slate-600 py-2">No hay cursos disponibles.</p>
                ) : (
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <div
                        key={course.courseId}
                        className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">{course.productName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{course.title}</p>
                        </div>

                        {course.isApproved ? (
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 shrink-0">
                            <CheckCircle2 className="w-4 h-4" /> Aprobado
                          </div>
                        ) : (
                          <button
                            onClick={() => handleApproveCourse(course.courseId)}
                            disabled={approvingCourse === course.courseId}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                          >
                            {approvingCourse === course.courseId
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Award className="w-3.5 h-3.5" />
                            }
                            Aprobar
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-white/5">
              <button
                onClick={closeEdit}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-slate-300 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded-2xl text-sm font-bold text-white transition-all flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls =
  "w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
