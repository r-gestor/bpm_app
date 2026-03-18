"use client";

import React from "react";
import { LucideIcon, BookOpen, BrainCircuit, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ProductCardProps {
 name: string;
 description: string;
 price: number;
 type: "COURSE" | "AI_SERVICE";
 slug: string;
}

export default function ProductCard({ name, description, price, type, slug }: ProductCardProps) {
 const isCourse = type === "COURSE";
 const Icon: LucideIcon = isCourse ? BookOpen : BrainCircuit;

 return (
 <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl border border-slate-100 ">
 {/* Background Gradient Effect */}
 <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10 transition-transform duration-500 group-hover:scale-150 ${
 isCourse ? "bg-blue-500" : "bg-purple-500"
 }`}></div>

 <div className="relative z-10">
 <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-colors duration-300 ${
 isCourse ? "bg-blue-50 text-blue-600 " : "bg-purple-50 text-purple-600 "
 }`}>
 <Icon size={24} />
 </div>

 <h3 className="mb-2 text-xl font-bold text-slate-900 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300">
 {name}
 </h3>

 <p className="mb-6 text-sm leading-relaxed text-slate-600 ">
 {description}
 </p>

 <div className="flex items-center justify-between">
 <div className="flex flex-col">
 <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 ">
 Desde
 </span>
 <span className="text-2xl font-black text-slate-900 ">
 {price.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
 </span>
 </div>

 <Link 
 href={slug === "manipulacion-alimentos" ? "/manipulacion-alimentos" : `/checkout/${slug}`}
 className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition-all duration-300 group-hover:w-32 group-hover:gap-2 ${
 isCourse ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"
 }`}
 >
 <span className="hidden opacity-0 transition-all duration-300 group-hover:block group-hover:opacity-100 whitespace-nowrap text-sm font-semibold">
 Adquirir ahora
 </span>
 <ArrowRight size={20} />
 </Link>
 </div>
 </div>
 </div>
 );
}
