"use client";

import React from "react";
import { Upload, Check, AlertCircle, FileText, Download } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
}

interface Row {
  name: string;
  documentType: string;
  documentNumber: string;
  email: string;
  password: string;
}

const HEADERS = [
  "name",
  "documentType",
  "documentNumber",
  "email",
  "password",
] as const;

function parseCSV(text: string): Row[] {
  // Simple CSV parser supporting comma or semicolon delimiters and quoted fields.
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const lines: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;

  // Detect delimiter from first non-quoted line
  const firstLine = normalized.split("\n")[0];
  const delimiter = firstLine.includes(";") && !firstLine.includes(",")
    ? ";"
    : ",";

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"' && normalized[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        cur.push(field);
        field = "";
      } else if (ch === "\n") {
        cur.push(field);
        lines.push(cur);
        cur = [];
        field = "";
      } else {
        field += ch;
      }
    }
  }
  cur.push(field);
  if (cur.length > 1 || cur[0] !== "") lines.push(cur);

  if (lines.length === 0) return [];

  // Detect if first row is a header
  const firstRow = lines[0].map((c) => c.trim().toLowerCase());
  const isHeader = HEADERS.some((h) => firstRow.includes(h.toLowerCase()));

  const dataLines = isHeader ? lines.slice(1) : lines;
  const headerMap: Record<string, number> = {};
  if (isHeader) {
    firstRow.forEach((h, idx) => {
      headerMap[h] = idx;
    });
  }

  return dataLines
    .filter((l) => l.some((c) => c.trim() !== ""))
    .map((l) => {
      const get = (name: string, fallback: number) =>
        (isHeader && headerMap[name.toLowerCase()] !== undefined
          ? l[headerMap[name.toLowerCase()]]
          : l[fallback]) ?? "";
      return {
        name: get("name", 0).trim(),
        documentType: get("documentType", 1).trim() || "CC",
        documentNumber: get("documentNumber", 2).trim(),
        email: get("email", 3).trim(),
        password: get("password", 4).trim(),
      };
    });
}

const TEMPLATE_CSV =
  "name,documentType,documentNumber,email,password\n" +
  "Juan Comprador,CC,1000000000,comprador@ejemplo.com,Clave123\n" +
  "Ana Estudiante,CC,1000000001,ana@ejemplo.com,Clave123\n" +
  "Luis Estudiante,CC,1000000002,luis@ejemplo.com,Clave123\n";

export default function BulkUsersClient({ products }: { products: Product[] }) {
  const [productId, setProductId] = React.useState(products[0]?.id || "");
  const [includeBuyer, setIncludeBuyer] = React.useState(false);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [fileName, setFileName] = React.useState<string>("");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);
  const [error, setError] = React.useState<string | null>(null);

  const onFile = async (file: File) => {
    setError(null);
    setResult(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length < 1) {
        setError("El CSV está vacío.");
        setRows([]);
        return;
      }
      setRows(parsed);
    } catch (e: any) {
      setError("No se pudo leer el archivo: " + e.message);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_cargue_usuarios.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = async () => {
    setError(null);
    setResult(null);
    if (!productId) return setError("Selecciona un curso.");
    if (rows.length < 1)
      return setError("El CSV debe tener al menos la fila del comprador.");

    const [buyer, ...students] = rows;
    if (!buyer.name || !buyer.email)
      return setError("La primera fila (comprador) debe tener nombre y correo.");

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          includeBuyerAsStudent: includeBuyer,
          buyer,
          students,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al procesar");
      setResult(data);
      setRows([]);
      setFileName("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const [buyer, ...students] = rows;

  return (
    <div className="space-y-6">
      {/* Config */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-5">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">
            Curso
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={includeBuyer}
            onChange={(e) => setIncludeBuyer(e.target.checked)}
            className="w-5 h-5 rounded accent-blue-500"
          />
          <span className="text-sm text-slate-300">
            El comprador también tomará el curso (consume 1 cupo y recibe
            acceso a /course-content)
          </span>
        </label>
      </div>

      {/* Upload */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">
              Archivo CSV
            </h3>
            <p className="text-xs text-slate-500">
              Columnas:{" "}
              <code className="text-blue-400">
                name, documentType, documentNumber, email, password
              </code>
              . La <strong>primera fila</strong> es el comprador; las demás
              son los estudiantes inscritos bajo su cuenta.
            </p>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-slate-300 transition-all"
          >
            <Download className="w-4 h-4" /> Plantilla
          </button>
        </div>

        <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-white/10 rounded-2xl p-8 cursor-pointer hover:border-blue-500/40 transition-all">
          <FileText className="w-10 h-10 text-slate-600" />
          <span className="text-sm text-slate-400">
            {fileName ? (
              <>
                <strong className="text-white">{fileName}</strong> —{" "}
                {rows.length} fila{rows.length !== 1 && "s"}
              </>
            ) : (
              "Haz clic para seleccionar un CSV"
            )}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </label>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Vista previa</h3>
            <p className="text-xs text-slate-500 mt-1">
              Comprador:{" "}
              <strong className="text-blue-400">
                {buyer?.name} ({buyer?.email})
              </strong>{" "}
              — {students.length} estudiante{students.length !== 1 && "s"} a
              inscribir
              {includeBuyer && " + el comprador"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">#</th>
                  <th className="px-4 py-3 text-left font-bold">Rol</th>
                  <th className="px-4 py-3 text-left font-bold">Nombre</th>
                  <th className="px-4 py-3 text-left font-bold">Doc.</th>
                  <th className="px-4 py-3 text-left font-bold">Correo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-t border-white/5 ${
                      i === 0 ? "bg-blue-500/5" : ""
                    }`}
                  >
                    <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-2">
                      {i === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400">
                          COMPRADOR
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700/50 text-slate-400">
                          ESTUDIANTE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-300">{r.name}</td>
                    <td className="px-4 py-2 text-slate-400">
                      {r.documentType} {r.documentNumber}
                    </td>
                    <td className="px-4 py-2 text-slate-400">{r.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Errors */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Check className="w-5 h-5" />
            Carga completada
          </div>
          <div className="text-sm text-slate-300 space-y-1">
            <p>
              Comprador: <strong>{result.buyerEmail}</strong>
            </p>
            <p>
              Cupos registrados (pago APROBADO):{" "}
              <strong>{result.totalQuantity}</strong>
            </p>
            <p>
              Estudiantes creados e inscritos:{" "}
              <strong>{result.createdCount}</strong>
            </p>
            {typeof result.reenrolledCount === "number" &&
              result.reenrolledCount > 0 && (
                <p>
                  Estudiantes existentes re-inscritos en este curso:{" "}
                  <strong>{result.reenrolledCount}</strong>
                </p>
              )}
            {result.buyerEnrolled && (
              <p>El comprador también quedó inscrito como estudiante.</p>
            )}
            {result.skippedCount > 0 && (
              <div className="mt-3">
                <p className="text-amber-400 font-bold mb-1">
                  Omitidos ({result.skippedCount}):
                </p>
                <ul className="list-disc list-inside text-xs text-slate-400">
                  {result.skipped.map((s: any, i: number) => (
                    <li key={i}>
                      {s.email || "(sin correo)"} — {s.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={loading || rows.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-bold transition-all"
        >
          <Upload className="w-5 h-5" />
          {loading ? "Procesando..." : "Cargar usuarios"}
        </button>
      </div>
    </div>
  );
}
