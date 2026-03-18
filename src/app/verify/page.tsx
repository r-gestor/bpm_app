"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  QrCode, 
  Camera, 
  Upload, 
  History as HistoryIcon, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Vibrate,
  Loader2,
  Trash2,
  ChevronRight
} from "lucide-react";
import jsQR from "jsqr";

type VerificationResult = {
  valid: boolean;
  type?: 'CERTIFICATE' | 'SANITATION_PLAN';
  name?: string;
  course?: string;
  businessName?: string;
  representativeName?: string;
  nit?: string;
  issued_at?: string;
  expires_at?: string;
  status: "active" | "expired" | "already_used" | "invalid" | "processing";
  certificateCode?: string;
  scannedAt: string;
};

export default function VerifyPage() {
  const [activeTab, setActiveTab] = useState<"camera" | "upload">("camera");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [history, setHistory] = useState<VerificationResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedCode = useRef<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("qr_verify_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Error parsing history", e);
      }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    localStorage.setItem("qr_verify_history", JSON.stringify(history));
  }, [history]);

  // Camera logic
  useEffect(() => {
    if (activeTab === "camera" && !result) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, result]);

  const startCamera = async () => {
    try {
      if (streamRef.current) stopCamera(); // Cleanup previous if exists

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        setScanning(true);
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error("Error accessing camera", err);
      setError("No se pudo acceder a la cámara. Por favor permite los permisos.");
    }
  };

  const stopCamera = () => {
    setScanning(false);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const tick = () => {
    if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      if (!video) return; // Add explicit null check to fix lints
      
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data && code.data !== lastScannedCode.current) {
          lastScannedCode.current = code.data;
          handleVerify(code.data, "camera");
          return; // Stop animation loop once a code is found
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  const handleVerify = async (code: string, method: "camera" | "upload") => {
    setLoading(true);
    setError(null);
    stopCamera();

    try {
      const res = await fetch("/api/verify/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, method }),
      });
      const data = await res.json();

      const verificationResult: VerificationResult = {
        ...data,
        scannedAt: new Date().toLocaleString()
      };

      setResult(verificationResult);
      setHistory(prev => [verificationResult, ...prev.slice(0, 9)]);

      // Vibrate on result
      if (navigator.vibrate) {
        navigator.vibrate(data.valid ? 200 : [100, 50, 100]);
      }

    } catch (err) {
      setError("Error al verificar el código. Intenta de nuevo.");
      lastScannedCode.current = null;
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code) {
            handleVerify(code.data, "upload");
          } else {
            setError("No se encontró ningún código QR en la imagen.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const resetResult = () => {
    setResult(null);
    lastScannedCode.current = null;
    setError(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("qr_verify_history");
  };

  return (
    <div className="min-h-screen bg-bg-section pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-6 py-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <QrCode size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-accent uppercase tracking-tight">Verificación</h1>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">SOPORTE DE VALIDACIÓN</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-6 space-y-6">
        
        {/* Tabs */}
        {!result && (
          <div className="flex bg-white p-1.5 rounded-[1.5rem] shadow-brand border border-slate-100">
            <button 
              onClick={() => setActiveTab("camera")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all ${
                activeTab === "camera" ? "bg-accent text-white shadow-lg" : "text-text-muted hover:bg-slate-50"
              }`}
            >
              <Camera size={18} /> Cámara
            </button>
            <button 
              onClick={() => setActiveTab("upload")}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold transition-all ${
                activeTab === "upload" ? "bg-accent text-white shadow-lg" : "text-text-muted hover:bg-slate-50"
              }`}
            >
              <Upload size={18} /> Subir
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="relative bg-white rounded-[2.5rem] shadow-brand border border-slate-100 overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-6 text-center">
          
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4">
              <Loader2 size={48} className="animate-spin text-primary" />
              <p className="font-bold text-accent uppercase tracking-widest text-xs">Verificando en base de datos...</p>
            </div>
          )}

          {error && !result && (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mx-auto">
                <AlertCircle size={32} />
              </div>
              <p className="text-text font-medium px-4">{error}</p>
              <button 
                onClick={activeTab === "camera" ? startCamera : resetResult}
                className="px-6 py-2 bg-accent text-white rounded-xl font-bold text-xs uppercase"
              >
                Reintentar
              </button>
            </div>
          )}

          {result ? (
            <div className={`w-full space-y-8 animate-in slide-in-from-bottom-6 duration-500`}>
              {/* Result Status */}
              <div className={`p-8 rounded-[2rem] border-2 ${
                result.valid ? "bg-success/5 border-success/20 text-success" : "bg-red-500/5 border-red-500/20 text-red-500"
              }`}>
                <div className="mb-4">
                  {result.valid ? <CheckCircle2 size={64} className="mx-auto" /> : <XCircle size={64} className="mx-auto" />}
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">
                  {result.valid ? (result.type === 'SANITATION_PLAN' ? "Plan Válido" : "Certificado Válido") : "Documento Inválido"}
                </h2>
                <div className={`mt-2 inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                  result.status === 'active' ? 'bg-success text-white' : result.status === 'processing' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  ESTADO: {result.status === 'active' ? 'ACTIVO' : result.status === 'processing' ? 'PROCESANDO' : result.status.toUpperCase()}
                </div>
              </div>

              {/* Data Table */}
              {result.valid && (
                <div className="text-left space-y-4 px-2">
                  {result.type === 'SANITATION_PLAN' ? (
                    <>
                      <div className="border-b border-slate-100 pb-3">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Nombre del Establecimiento</p>
                        <p className="text-lg font-black text-accent">{result.businessName}</p>
                      </div>
                      <div className="border-b border-slate-100 pb-3">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Representante Legal</p>
                        <p className="font-bold text-text">{result.representativeName}</p>
                      </div>
                      <div className="border-b border-slate-100 pb-3">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">NIT</p>
                        <p className="font-bold text-text">{result.nit}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="border-b border-slate-100 pb-3">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Nombre del Estudiante</p>
                        <p className="text-lg font-black text-accent">{result.name}</p>
                      </div>
                      <div className="border-b border-slate-100 pb-3">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Curso Completado</p>
                        <p className="font-bold text-text">{result.course}</p>
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Fecha Emisión</p>
                      <p className="font-bold text-text text-sm">{new Date(result.issued_at!).toLocaleDateString()}</p>
                    </div>
                    {result.type !== 'SANITATION_PLAN' && (
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Válido Hasta</p>
                        <p className="font-bold text-sm text-text">{result.expires_at ? new Date(result.expires_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Código de Verificación</p>
                    <p className="font-mono text-xs text-primary font-bold">{result.certificateCode}</p>
                  </div>
                </div>
              )}

              {!result.valid && (
                <p className="text-text-muted text-sm px-4">
                  El código QR escaneado no coincide con ningún registro válido en nuestro sistema central.
                </p>
              )}

              <button 
                onClick={resetResult}
                className="w-full py-4 bg-accent hover:bg-accent-light text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand"
              >
                Volver a Escanear
              </button>
            </div>
          ) : (
            <>
              {activeTab === "camera" ? (
                <div className="relative w-full aspect-square max-w-[300px] overflow-hidden rounded-[2rem] bg-slate-100">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Overlay Guide */}
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="w-full h-full border-4 border-white/40 border-dashed rounded-3xl animate-pulse flex flex-col items-center justify-center gap-4">
                      <QrCode size={40} className="text-white/20" />
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Apunta al código QR</p>
                    </div>
                  </div>

                  {/* Corners */}
                  <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                  <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                  <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                  
                  {!scanning && !error && (
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
                      <Loader2 size={32} className="animate-spin text-primary/40" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full space-y-6">
                  <div className="w-24 h-24 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mx-auto">
                    <Upload size={40} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-accent">Cargar Imagen</h3>
                    <p className="text-text-muted text-xs mt-1">Sube una foto del certificado desde tu galería.</p>
                  </div>
                  <label className="block">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleFileUpload}
                    />
                    <div className="cursor-pointer py-4 px-6 border-2 border-dashed border-slate-200 hover:border-primary hover:bg-primary/5 rounded-2xl transition-all flex items-center justify-center gap-3">
                      <HistoryIcon size={18} className="text-text-muted" />
                      <span className="font-bold text-text">Seleccionar archivo</span>
                    </div>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {/* History Section */}
        {history.length > 0 && (
          <div className="space-y-4 animate-in fade-in duration-500 delay-300">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-black text-accent uppercase tracking-widest flex items-center gap-2">
                <HistoryIcon size={14} /> Historial Local
              </h3>
              <button 
                onClick={clearHistory}
                className="text-red-500/60 hover:text-red-500 transition-colors p-2 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {history.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 group hover:border-primary/20 transition-all cursor-pointer"
                  onClick={() => setResult(item)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.valid ? "bg-success/10 text-success" : "bg-red-500/10 text-red-500"
                  }`}>
                    {item.valid ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-accent text-sm truncate">{item.valid ? item.name : "Inválido"}</p>
                    <p className="text-[10px] text-text-muted font-medium truncate italic">{item.valid ? item.course : "Error de verificación"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[9px] font-black text-slate-300 uppercase">{item.scannedAt.split(",")[0]}</p>
                    <ChevronRight size={14} className="text-slate-300 ml-auto mt-0.5 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 text-center">
        <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest">
           VALIDEZ SEGURIZADA VÍA MANIPULADORCAPACITADO.COM
        </p>
      </div>

    </div>
  );
}
