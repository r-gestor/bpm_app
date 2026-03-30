"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { ShoppingCart, Tag, CheckCircle2, AlertCircle, ArrowLeft, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<any>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isNewUser, setIsNewUser] = useState(true);
  const [discountInfo, setDiscountInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [pollingPayment, setPollingPayment] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    setPlanId(searchParams.get("planId"));
  }, []);

  useEffect(() => {
    // Fetch product details
    fetch(`/api/products/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProduct(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar el producto.");
        setLoading(false);
      });
  }, [slug]);

  const getOriginalUnitPrice = () => {
    if (!product) return 0;
    if (product.slug === 'manipulacion-alimentos') {
      if (quantity >= 10) return 47000;
      if (quantity >= 4) return 50000;
      return 54000;
    }
    if (product.slug === 'plan-saneamiento-iav') {
      return 420000;
    }
    return Number(product.price) * 1.2; // Fallback to 20% more for other products
  };

  const getPlanUnitPrice = () => {
    if (!product) return 0;
    if (product.slug === 'manipulacion-alimentos') {
      if (quantity >= 10) return 39000;
      if (quantity >= 4) return 42000;
      return 45000;
    }
    if (product.slug === 'plan-saneamiento-iav') {
      return 350000;
    }
    return Number(product.price);
  };

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    setApplyingDiscount(true);
    setError("");
    
    try {
      const res = await fetch(`/api/discounts/validate?code=${discountCode}`);
      const data = await res.json();
      
      if (data.valid) {
        setDiscountInfo({
          valid: true,
          discountPercent: data.percentage,
          code: data.code
        });
      } else {
        setError(data.message || "Código de descuento inválido.");
        setDiscountInfo(null);
      }
    } catch (err) {
      setError("Error al validar el código.");
      setDiscountInfo(null);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const removeDiscount = () => {
    setDiscountInfo(null);
    setDiscountCode("");
    setError("");
  };

  const handleCheckout = async () => {
    if (!session?.user) {
      setShowModal(true);
      return;
    }

    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          discountCode: discountInfo?.valid ? discountCode : undefined,
          buyerId: (session.user as any).id,
          planId: planId || undefined,
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      const pollTransactionStatus = async (transactionId: string, reference: string) => {
        let attempts = 0;
        const maxAttempts = 60; // 3 minutes total (polling every 3s)
        const interval = 3000;

        const checkStatus = async () => {
          attempts++;
          console.log(`[Polling] Checking status for ${transactionId}, attempt ${attempts}`);

          try {
            const res = await fetch(`/api/checkout/verify?id=${transactionId}&planId=${planId || ""}`);
            const result = await res.json();

            if (result.status === "APPROVED") {
              setPollingPayment(false);
              router.push(`/checkout/success?ref=${reference}`);
              return;
            } else if (["DECLINED", "ERROR", "VOIDED"].includes(result.status)) {
              setPollingPayment(false);
              setError(`El pago fue ${result.status === "DECLINED" ? "rechazado" : "fallido"}. Por favor verifica los datos e intenta de nuevo.`);
              return;
            }
          } catch (err) {
            // Error de red — seguir reintentando, no parar el polling
            console.error(`[Polling] Network error on attempt ${attempts}, retrying...`, err);
          }

          if (attempts >= maxAttempts) {
            setPollingPayment(false);
            setError("El tiempo de espera se ha agotado (3 min). Tu pago podría estar pendiente; por favor revisa tu correo o el dashboard en unos minutos.");
            return;
          }

          setTimeout(checkStatus, interval);
        };

        checkStatus();
      };

      // Abrir widget de WOMPI
      // publicKey viene del servidor (WOMPI_PUBLIC_KEY en Easypanel runtime), no del bundle del cliente
      const wompiPublicKey = data.publicKey;
      console.log("[Wompi Widget] Inicializando con publicKey:", wompiPublicKey?.substring(0, 15) + "...");
      console.log("[Wompi Widget] Orden:", { orderId: data.orderId, amountInCents: data.amountInCents });

      if (!wompiPublicKey || wompiPublicKey === "placeholder") {
        console.error("[Wompi Widget] ❌ publicKey inválida:", wompiPublicKey);
        setError("Error de configuración del sistema de pagos. Contacta al soporte.");
        return;
      }

      const checkout = new (window as any).WidgetCheckout({
        currency: "COP",
        amountInCents: data.amountInCents,
        reference: data.orderId,
        publicKey: wompiPublicKey,
        signature: { integrity: data.signature },
        customerEmail: session.user.email,
      });

      const isSanitationPlan = product?.slug?.startsWith("plan-saneamiento-");

      checkout.open(async (result: any) => {
        const transaction = result.transaction;
        console.log("[Wompi Callback] Estado recibido:", transaction?.status);
        console.log("[Wompi Callback] transaction.id:", transaction?.id);
        console.log("[Wompi Callback] transaction.reference:", transaction?.reference);

        if (transaction.status === "APPROVED") {
          if (isSanitationPlan) {
            console.log("[Wompi Callback] Plan de saneamiento APPROVED — verificando en background");
            fetch(`/api/checkout/verify?id=${transaction.id}&planId=${planId || ""}`).catch(() => {});
            router.push(`/checkout/success?ref=${transaction.reference}&type=sanitation`);
          } else {
            console.log("[Wompi Callback] Curso APPROVED — llamando verify para actualizar DB");
            setPollingPayment(true);
            try {
              const verifyRes = await fetch(`/api/checkout/verify?id=${transaction.id}&planId=${planId || ""}`);
              const verifyData = await verifyRes.json();
              console.log("[Wompi Callback] Respuesta verify:", verifyData);
              router.push(`/checkout/success?ref=${transaction.reference}`);
            } catch (err) {
              console.error("[Wompi Callback] Error en verify — redirigiendo igual:", err);
              router.push(`/checkout/success?ref=${transaction.reference}`);
            } finally {
              setPollingPayment(false);
            }
          }
        } else if (transaction.status === "PENDING") {
          console.log("[Wompi Callback] PENDING — iniciando polling de 3 minutos");
          setPollingPayment(true);
          pollTransactionStatus(transaction.id, transaction.reference);
        } else {
          console.warn("[Wompi Callback] Estado no manejado:", transaction.status);
          try {
            await fetch(`/api/checkout/verify?id=${transaction.id}&planId=${planId || ""}`);
          } catch (err) {
            console.error("[Wompi Callback] Error actualizando estado fallido:", err);
          }
          setError("El pago no pudo ser completado. Estado: " + transaction.status);
        }
      });
    } catch (err: any) {
      console.error("[Checkout] ❌ Error al iniciar pago:", err?.message, err);
      setError("Error al iniciar el proceso de pago.");
    }
  };

  const handleAuthAndPay = async () => {
    setError("");
    if (!guestEmail || !password) {
      setError("Email y contraseña son obligatorios");
      return;
    }

    try {
      if (isNewUser) {
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: guestEmail, password }),
        });
        const regData = await regRes.json();
        if (regData.error) {
          setError(regData.error);
          return;
        }
      }

      const loginResult = await signIn("credentials", {
        email: guestEmail,
        password,
        redirect: false,
      });

      if (loginResult?.error) {
        setError("Credenciales incorrectas o error al iniciar sesión");
        return;
      }

      setShowModal(false);
    } catch (err) {
      setError("Error en la autenticación");
    }
  };

  if (loading || pollingPayment) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#020617] text-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-blue-400 font-bold tracking-widest uppercase">
          {pollingPayment ? "Verificando tu pago en tiempo real..." : "Cargando..."}
        </p>
        {pollingPayment && <p className="text-slate-500 text-sm mt-2">Por favor no cierres esta ventana.</p>}
      </div>
    );
  }

  if (!product) return <div className="flex h-screen items-center justify-center">{error}</div>;

  const originalUnitPrice = getOriginalUnitPrice();
  const planUnitPrice = getPlanUnitPrice();
  
  const originalSubtotal = originalUnitPrice * quantity;
  const planSavings = (originalUnitPrice - planUnitPrice) * quantity;
  const couponSavings = discountInfo ? (planUnitPrice * quantity * discountInfo.discountPercent) / 100 : 0;
  
  const total = originalSubtotal - planSavings - couponSavings;

  return (
    <div className="min-h-screen bg-bg py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-8 transition-colors">
          <ArrowLeft size={20} className="mr-2" />
          Volver al inicio
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Summary Column */}
          <div className="space-y-8">
            <h1 className="text-3xl font-black text-slate-900 flex items-center">
              <ShoppingCart className="mr-4 text-primary" size={32} />
              Resumen del Pedido
            </h1>
            <div className="bg-white p-8 rounded-[1.5rem] shadow-brand border border-slate-100">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h2 className="text-xl font-bold text-slate-900 ">{product.name}</h2>
                   <p className="text-slate-500 text-sm mt-1">{product.type === "COURSE" ? "Curso Online" : "Servicio Profesional"}</p>
                 </div>
                 <div className="text-right">
                   <span className="text-xl font-bold text-slate-400 line-through block italic">
                     {originalUnitPrice.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                   </span>
                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                     {product.slug.startsWith('plan-saneamiento-') ? 'Precio regular por plan de saneamiento' : 'Precio regular por persona'}
                   </span>
                 </div>
               </div>

               <div className="border-t border-slate-100 pt-6 space-y-4">
                 <div className="flex justify-between items-center text-sm mb-2">
                   <span className="text-slate-500 font-medium">
                     {product.slug.startsWith('plan-saneamiento-') ? 'Precio con descuento:' : 'Precio con descuento por persona:'}
                   </span>
                   <span className="text-slate-900 font-black">
                     {planUnitPrice.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                   </span>
                 </div>

                 <div className="flex justify-between text-emerald-500 font-bold items-center bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10">
                   <span className="flex items-center text-xs">
                     <CheckCircle2 size={14} className="mr-2" />
                     {product.slug.startsWith('plan-saneamiento-') 
                       ? 'Descuento Especial'
                       : `Descuento Plan (${quantity} ${quantity === 1 ? 'persona' : 'personas'}) — ${Math.round((1 - planUnitPrice/originalUnitPrice)*100)}% off`}
                   </span>
                   <span className="text-sm">-{planSavings.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
                 </div>
                 
                 {discountInfo && (
                   <div className="flex justify-between text-emerald-500 font-bold items-center bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10">
                     <span className="flex items-center text-xs">
                       <Tag size={14} className="mr-2" />
                       Cupón {discountInfo.code} (-{discountInfo.discountPercent}%)
                     </span>
                     <span className="text-sm">-{couponSavings.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
                   </div>
                 )}

                 <div className="h-px bg-slate-100 my-4" />

                 <div className="flex justify-between text-3xl font-black text-slate-900 pt-2 font-inter">
                   <span className="tracking-tight uppercase text-lg self-center">Total Final</span>
                   <span className="text-accent">
                     {total.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                   </span>
                 </div>

                 <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-4 duration-500">
                   <span className="text-lg">🎉</span>
                   <p className="text-emerald-700 font-bold text-sm">
                     ¡Estás ahorrando {(planSavings + couponSavings).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })} con tu plan!
                   </p>
                 </div>
               </div>
            </div>
          </div>

          {/* Checkout Column */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[1.5rem] shadow-brand border border-slate-100">
              {!product.slug.startsWith('plan-saneamiento-') && (
                <>
                  <h3 className="text-lg font-bold mb-6 flex items-center text-slate-900">
                    <ShoppingCart className="mr-3 text-primary" size={20} />
                    Cantidad de Personas
                  </h3>
                  
                  <div className="flex items-center gap-4 mb-8 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-xl hover:bg-slate-100 transition-all border border-slate-200"
                    >
                      -
                    </button>
                    <div className="flex-1 text-center font-black text-2xl text-primary">{quantity}</div>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-xl hover:bg-slate-100 transition-all border border-slate-200"
                    >
                      +
                    </button>
                  </div>
                </>
              )}

              <h3 className="text-lg font-bold mb-6 flex items-center text-slate-900">
                <Tag className="mr-3 text-accent" size={20} />
                Código de Descuento
              </h3>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Introduce tu código"
                  className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all uppercase font-bold text-xs tracking-widest disabled:bg-slate-50"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  disabled={!!discountInfo}
                />
                {!discountInfo ? (
                  <button
                    onClick={handleApplyDiscount}
                    disabled={applyingDiscount || !discountCode}
                    className="bg-accent text-white px-5 py-3 rounded-xl font-black hover:bg-accent-light transition-all text-xs uppercase tracking-widest disabled:bg-[#0c4a6e] disabled:text-white sm:w-auto w-full active:scale-[0.98] shadow-lg shadow-accent/20 whitespace-nowrap"
                  >
                    {applyingDiscount ? "..." : "Aplicar"}
                  </button>
                ) : (
                  <button
                    onClick={removeDiscount}
                    className="bg-red-500 text-white px-5 py-3 rounded-xl font-black hover:bg-red-600 transition-all text-xs uppercase tracking-widest sm:w-auto w-full shadow-lg shadow-red-500/20 whitespace-nowrap"
                  >
                    Quitar
                  </button>
                )}
              </div>

              {error && (
                <p className="mt-4 text-red-500 text-sm flex items-center bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                  <AlertCircle size={16} className="mr-2" />
                  {error}
                </p>
              )}

              {discountInfo && (
                <div className="mt-4 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-emerald-500 text-sm flex items-center font-bold">
                    <CheckCircle2 size={16} className="mr-2" />
                    ¡Código {discountInfo.code} aplicado!
                  </p>
                  <p className="text-emerald-500/70 text-xs font-medium mt-1">Has ahorrado {couponSavings.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })} adicionales.</p>
                </div>
              )}
            </div>

            <div className="bg-primary p-1 rounded-2xl shadow-brand">
              <button
                onClick={handleCheckout}
                className="w-full bg-accent text-white rounded-[14px] py-6 text-xl font-black hover:bg-accent-light transition-all duration-300 relative overflow-hidden group uppercase tracking-widest"
              >
                <span className="relative z-10">Pagar ahora de forma segura</span>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
            
            <p className="text-center text-slate-400 text-xs mt-4">
              Pagos procesados de forma segura por WOMPI. Tu información está protegida con encriptación SSL.
            </p>
          </div>
        </div>
      </div>

      {/* Modal de Registro/Login Express */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 border border-white/10 animate-in zoom-in-95 duration-300">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-slate-900 ">
                {isNewUser ? "Crea tu cuenta" : "Inicia sesión"}
              </h3>
              <p className="text-slate-500 text-sm mt-2">Necesario para gestionar tu curso y certificados.</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => signIn("google", { callbackUrl: window.location.href })}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all mb-6"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continuar con Google
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-100 "></div>
                <span className="flex-shrink mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">o con tu correo</span>
                <div className="flex-grow border-t border-slate-100 "></div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 font-inter">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 font-inter">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-xs flex items-center font-medium bg-red-50 p-3 rounded-lg">
                  <AlertCircle size={14} className="mr-2 shrink-0" />
                  {error}
                </p>
              )}

              <button
                onClick={handleAuthAndPay}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl transition-all shadow-xl hover:scale-[1.02]"
              >
                {isNewUser ? "Registrarse y pagar" : "Entrar y pagar"}
              </button>

              <div className="text-center pt-2">
                <button 
                  onClick={() => setIsNewUser(!isNewUser)}
                  className="text-blue-600 text-sm font-bold hover:underline"
                >
                  {isNewUser ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
                </button>
              </div>

              <button 
                onClick={() => setShowModal(false)}
                className="w-full text-slate-400 hover:text-slate-600 text-xs font-medium transition-colors pt-4"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
