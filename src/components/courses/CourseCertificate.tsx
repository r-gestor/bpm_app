import React from 'react';
import {
  Page, Text, View, Document, StyleSheet, Image,
  Svg, Defs, LinearGradient, Stop, Rect,
} from '@react-pdf/renderer';

// ── Palette ──────────────────────────────────────────────────────────────
const NAVY  = '#0B1D45';
const GOLD  = '#B8940A';
const GOLD2 = '#D4AA20';
const WHITE = '#FFFFFF';
const SLATE = '#2D3F5C';
const MUTED = '#5A6E8A';
const RED   = '#B91C1C';

// ── Styles ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: WHITE,
  },

  // Outer navy border
  frame: {
    margin: 14,
    flex: 1,
    borderWidth: 3,
    borderColor: NAVY,
    position: 'relative',
  },

  // Inner thin gold border
  innerFrame: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    borderWidth: 1,
    borderColor: GOLD2,
  },

  // ── HEADER (WHITE — logo looks clean here) ──────────────────────────────
  header: {
    backgroundColor: WHITE,
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 14,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    height: 52,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 9,
    color: NAVY,
    letterSpacing: 4,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 7.5,
    color: MUTED,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 3,
  },

  // QR in header top-right (white bg, gold border)
  qrFrame: {
    borderWidth: 1.5,
    borderColor: GOLD2,
    padding: 3,
    backgroundColor: WHITE,
  },
  qrImg: {
    width: 56,
    height: 56,
  },

  // ── SEPARATORS ──────────────────────────────────────────────────────────
  goldBar: {
    height: 4,
    backgroundColor: GOLD,
  },
  thinGoldBar: {
    height: 1.5,
    backgroundColor: GOLD2,
    marginLeft: 22,
    marginRight: 22,
  },

  // ── CONTENT ──────────────────────────────────────────────────────────────
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 55,
    paddingTop: 6,
    paddingBottom: 6,
  },

  eyebrow: {
    fontSize: 10,
    color: GOLD,
    letterSpacing: 5,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 7,
    textAlign: 'center',
  },

  // ── ● ── ornament
  ornRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  ornLine: {
    height: 1,
    width: 60,
    backgroundColor: GOLD2,
  },
  ornDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
    marginLeft: 9,
    marginRight: 9,
  },

  certLabel: {
    fontSize: 11,
    color: SLATE,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 2,
  },
  certLabel2: {
    fontSize: 13,
    color: NAVY,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 14,
  },

  // ── NAME — hero ──────────────────────────────────────────────────────────
  name: {
    fontSize: 42,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },

  nameAccRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  nameAccLine: {
    height: 2.5,
    width: 200,
    backgroundColor: GOLD,
  },
  nameAccDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GOLD,
    marginLeft: 8,
    marginRight: 8,
  },

  docId: {
    fontSize: 13,
    color: SLATE,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },

  award: {
    fontSize: 10,
    color: MUTED,
    lineHeight: 1.75,
    textAlign: 'center',
    maxWidth: 520,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // ── FOOTER ───────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingLeft: 30,
    paddingRight: 30,
    paddingTop: 10,
    paddingBottom: 10,
  },

  // Left — dates
  dateBlock: {
    width: 160,
  },
  dateLabel: {
    fontSize: 8,
    color: GOLD,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  dateVal: {
    fontSize: 11,
    color: SLATE,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  expiryVal: {
    fontSize: 9,
    color: RED,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Center — signature
  sigBlock: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 10,
  },
  sigImg: {
    width: 140,
    height: 44,
    marginBottom: 3,
  },
  sigLine: {
    width: 180,
    height: 1,
    backgroundColor: NAVY,
    marginBottom: 5,
  },
  sigName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    textAlign: 'center',
  },
  sigTitle: {
    fontSize: 8.5,
    color: MUTED,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 2,
  },

  // Right — cert info
  infoBlock: {
    width: 160,
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 8,
    color: GOLD,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
  },
  infoVal: {
    fontSize: 8.5,
    color: MUTED,
    textAlign: 'right',
    letterSpacing: 0.5,
  },

  // ── RESOLUTION STRIP ─────────────────────────────────────────────────────
  resStrip: {
    backgroundColor: NAVY,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 24,
    paddingRight: 24,
    alignItems: 'center',
  },
  resText: {
    fontSize: 7.5,
    color: GOLD2,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
});

// ── Props ─────────────────────────────────────────────────────────────────
interface CourseCertificateProps {
  studentName: string;
  documentType: string;
  documentNumber: string;
  completedDate: string;
  qrCodeData: string;
  certificateCode: string;
  logoUrl?: any;
  signatureUrl?: any;
}

// ── Ornament ─────────────────────────────────────────────────────────────
const Ornament = () => (
  <View style={s.ornRow}>
    <View style={s.ornLine} />
    <View style={s.ornDot} />
    <View style={s.ornLine} />
  </View>
);

// ── Certificate ───────────────────────────────────────────────────────────
const CourseCertificate: React.FC<CourseCertificateProps> = ({
  studentName,
  documentType,
  documentNumber,
  completedDate,
  qrCodeData,
  certificateCode,
  logoUrl,
  signatureUrl,
}) => (
  <Document>
    <Page size="A4" orientation="landscape" style={s.page}>

      {/* Background gradient (subtle warm-to-cool diagonal) */}
      <Svg style={{ position: 'absolute', top: 0, left: 0 }} width={842} height={595}>
        <Defs>
          <LinearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor="#EEF3FF" stopOpacity="1" />
            <Stop offset="50%"  stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFF8E8" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width={842} height={595} fill="url(#bg)" />
      </Svg>

      {/* Double border frame */}
      <View style={s.frame}>
        <View style={s.innerFrame} />

        {/* ── HEADER — white background, logo looks correct ─────────── */}
        <View style={s.header}>
          {logoUrl && <Image src={logoUrl} style={s.logo} />}

          <View style={s.headerCenter}>
            <Text style={s.headerTitle}>BPM Salud Tech</Text>
            <Text style={s.headerSub}>Inocuidad · Manipulación de Alimentos</Text>
          </View>

          {/* QR top-right */}
          <View style={s.qrFrame}>
            {qrCodeData && <Image src={qrCodeData} style={s.qrImg} />}
          </View>
        </View>

        {/* Thick gold bar */}
        <View style={s.goldBar} />

        {/* ── CENTRAL CONTENT ───────────────────────────────────────── */}
        <View style={s.content}>

          <Text style={s.eyebrow}>Manipulador Capacitado</Text>

          <Ornament />

          <Text style={s.certLabel}>Otorga el presente certificado como</Text>
          <Text style={s.certLabel2}>Manipulador de Alimentos a:</Text>

          {/* Student name — biggest element */}
          <Text style={s.name}>{studentName}</Text>

          {/* Gold underline with center dot */}
          <View style={s.nameAccRow}>
            <View style={s.nameAccLine} />
            <View style={s.nameAccDot} />
            <View style={s.nameAccLine} />
          </View>

          <Text style={s.docId}>{documentType} No. {documentNumber}</Text>

          <Text style={s.award}>
            Por su gran desempeño y responsabilidad, logrando culminar doce (12) horas de
            estudio en el programa de formación en inocuidad y manipulación segura de alimentos.
          </Text>

        </View>

        {/* ── FOOTER SEPARATOR ──────────────────────────────────────── */}
        <View style={s.thinGoldBar} />

        {/* ── FOOTER ────────────────────────────────────────────────── */}
        <View style={s.footer}>

          {/* Left — date */}
          <View style={s.dateBlock}>
            <Text style={s.dateLabel}>Fecha de expedición</Text>
            <Text style={s.dateVal}>{completedDate}</Text>
            <Text style={s.expiryVal}>Válido por un (1) año</Text>
          </View>

          {/* Center — signature */}
          <View style={s.sigBlock}>
            {signatureUrl && <Image src={signatureUrl} style={s.sigImg} />}
            <View style={s.sigLine} />
            <Text style={s.sigName}>JOSÉ ISMAEL SALDAÑA</Text>
            <Text style={s.sigTitle}>Ingeniero de Alimentos</Text>
          </View>

          {/* Right — cert code */}
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Código de verificación</Text>
            <Text style={s.infoVal}>{certificateCode}</Text>
          </View>

        </View>

        {/* ── RESOLUTION STRIP ──────────────────────────────────────── */}
        <View style={s.resStrip}>
          <Text style={s.resText}>
            Capacitador autorizado · Resolución 30-49-032 (2024) · Alcaldía de Jamundí
          </Text>
        </View>

      </View>
    </Page>
  </Document>
);

export default CourseCertificate;
