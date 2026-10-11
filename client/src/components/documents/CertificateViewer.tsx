import React, { useRef, useState, useEffect } from 'react';
import { Download, Printer, Award, Loader2, ExternalLink, X, User, CheckCircle2, ShieldCheck, Sparkles, LayoutTemplate } from 'lucide-react';
import { Certificate } from '../../types';
import { api } from '../../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CertificateViewerProps {
  certificate: Certificate;
  onClose?: () => void;
}

export type CertificateDesignType = 'classic_ribbon' | 'sovereign_gold' | 'modern_tech';

export const CertificateViewer: React.FC<CertificateViewerProps> = ({ certificate, onClose }) => {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<CertificateDesignType>('modern_tech');

  const [settings, setSettings] = useState<any>({
    cert_company_name: 'AAGAM DIGITAL TECHNOLOGY PVT. LTD.',
    cert_tagline: 'LEARN • BUILD • INNOVATE',
    cert_iso_text: 'An ISO 9001: 2015 certified',
    cert_mca_text: 'Registered Under Ministry of Corporate Affairs, Govt. of India',
    cert_cin_number: 'Corporate Identification No. : U80904BR2021PTC054517',
    cert_ribbon_title: 'CERTIFICATE OF INDUSTRIAL INTERNSHIP EXCELLENCE',
    cert_corporate_office: 'Corporate office: Dak Bunglow Chauraha Near Biscoman Tower Patna',
    cert_director_name: 'Ayush Raj',
    cert_director_title: 'Director',
    cert_instructor_name: 'Akash Verma',
    cert_instructor_title: 'Course Instructor',
    cert_template_style: 'modern_tech',
  });

  useEffect(() => {
    let isMounted = true;
    api.getCertificateSettings()
      .then((res) => {
        if (isMounted && res.success && res.settings) {
          setSettings((prev: any) => ({ ...prev, ...res.settings }));
          if (res.settings.cert_template_style) {
            setSelectedDesign(res.settings.cert_template_style as CertificateDesignType);
          }
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveThemeAsDefault = async () => {
    setSavingTheme(true);
    try {
      await api.updateAdminCertificateSettings({
        ...settings,
        cert_template_style: selectedDesign,
      });
      setSettings((prev: any) => ({ ...prev, cert_template_style: selectedDesign }));
      alert(`Success! "${selectedDesign.replace('_', ' ').toUpperCase()}" has been set as the default certificate template for all users.`);
    } catch (err) {
      console.error('[SAVE THEME ERROR]', err);
    } finally {
      setSavingTheme(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // High-res Client Canvas Generation (Scale 3 for crisp 300DPI print resolution)
      if (!certRef.current) return;
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`${certificate.certificate_id}.pdf`);
    } catch (err) {
      console.error('[PDF DOWNLOAD ERROR]', err);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!certRef.current) {
      window.print();
      return;
    }

    const certHtml = certRef.current.outerHTML;
    const printWin = window.open('', '_blank', 'width=1200,height=840');
    if (!printWin) {
      window.print();
      return;
    }

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join('\n');

    printWin.document.open();
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AAGAM Certificate - ${certificate.certificate_id}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&family=Great+Vibes&family=Alex+Brush&display=swap">
          ${styles}
          <style>
            @page {
              size: A4 landscape;
              margin: 0;
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #FFFFFF !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            }
            .print-wrapper {
              width: 297mm;
              height: 210mm;
              box-sizing: border-box;
              padding: 5mm;
              background-color: #FFFFFF !important;
              margin: auto;
            }
            .print-wrapper > div {
              box-shadow: none !important;
              border-width: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${certHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.focus();
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWin.document.close();
  };

  const verifyUrl = `http://127.0.0.1:5173/?view=verify&id=${certificate.certificate_id}`;
  const rollNo = certificate.roll_no || (certificate as any).student_roll_no || (certificate as any).registration_no || '311151824062';
  const branchName = certificate.branch || (certificate as any).department || 'Computer Science & Engineering';
  const startDate = certificate.start_date || '02 June 2025';
  const endDate = certificate.end_date || '30 June 2025';
  const awardDate = certificate.issue_date || new Date().toISOString().split('T')[0];
  const directorName = settings.cert_director_name || (certificate.signatory_ceo ? certificate.signatory_ceo.split(',')[0] : 'Ayush Raj');
  const instructorName = settings.cert_instructor_name || (certificate as any).instructor_name || (certificate.signatory_hr ? certificate.signatory_hr.split(',')[0] : 'Akash Verma');

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. TOP INTERACTIVE ACTION & DESIGN SELECTOR TOOLBAR */}
      <div className="no-print bg-slate-900 border border-slate-800 p-4 rounded-3xl text-xs shadow-2xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-white text-base">
                  Interactive Certificate Studio & Live Theme Switcher
                </span>
                <span className="px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {certificate.status || 'Verified'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Credential Ledger ID: <strong className="text-amber-400">{certificate.certificate_id}</strong> • Pick any design below to preview & set as permanent default:
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSaveThemeAsDefault}
              disabled={savingTheme}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer"
              title="Save current selected design as default for all students"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{savingTheme ? 'Saving Theme...' : 'Set Selected Theme As Default'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all cursor-pointer"
              title="Print Certificate (A4 Landscape Clean Paper)"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors"
                title="Close Studio"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* DESIGN SELECTOR BUTTONS */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mr-2">
            <LayoutTemplate className="w-4 h-4 text-amber-400" />
            <span>Select Design Variation:</span>
          </div>

          <button
            onClick={() => setSelectedDesign('classic_ribbon')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
              selectedDesign === 'classic_ribbon'
                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>Design 1: Classical Govt Ribbon (Aapke Reference Jaisa)</span>
            {selectedDesign === 'classic_ribbon' && <span className="w-2 h-2 rounded-full bg-amber-300"></span>}
          </button>

          <button
            onClick={() => setSelectedDesign('sovereign_gold')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
              selectedDesign === 'sovereign_gold'
                ? 'bg-amber-600 border-amber-500 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>Design 2: Imperial Sovereign Gold &amp; Royal Navy</span>
            {selectedDesign === 'sovereign_gold' && <span className="w-2 h-2 rounded-full bg-white"></span>}
          </button>

          <button
            onClick={() => setSelectedDesign('modern_tech')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
              selectedDesign === 'modern_tech'
                ? 'bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span>Design 3: Modern Corporate ISO-Tech</span>
            {selectedDesign === 'modern_tech' && <span className="w-2 h-2 rounded-full bg-emerald-300"></span>}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRINTABLE CANVAS CONTAINER                                                */}
      {/* ========================================================================= */}
      <div
        id="certificate-print-area"
        ref={certRef}
        className="relative bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-300 overflow-hidden select-none p-3 sm:p-5"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* ===================================================================== */}
        {/* VARIATION 1: CLASSICAL GOVERNMENT ACCREDITED (REFERENCE IMAGE MATCH) */}
        {/* ===================================================================== */}
        {selectedDesign === 'classic_ribbon' && (
          <div className="relative border-[6px] sm:border-[8px] border-[#1E3A8A] p-4 sm:p-6 rounded-2xl bg-white overflow-hidden">
            {/* Fine Inner Security Guilloche Border */}
            <div className="absolute inset-1.5 border-[2px] border-[#3B82F6] rounded-xl pointer-events-none"></div>

            {/* Corner Filigrees in Deep Royal Navy */}
            <div className="absolute top-2.5 left-2.5 w-8 h-8 border-t-[3px] border-l-[3px] border-[#1E3A8A] pointer-events-none"></div>
            <div className="absolute top-2.5 right-2.5 w-8 h-8 border-t-[3px] border-r-[3px] border-[#1E3A8A] pointer-events-none"></div>
            <div className="absolute bottom-2.5 left-2.5 w-8 h-8 border-b-[3px] border-l-[3px] border-[#1E3A8A] pointer-events-none"></div>
            <div className="absolute bottom-2.5 right-2.5 w-8 h-8 border-b-[3px] border-r-[3px] border-[#1E3A8A] pointer-events-none"></div>

            {/* Watermark Logo Background (Subtle 3.5% Opacity) */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
              <img src="/aagam-logo.jpg" alt="Watermark" className="w-[420px] h-[420px] object-contain grayscale" />
            </div>

            {/* 1. TOP HEADER SECTION */}
            <div className="relative z-10 flex items-center justify-between gap-3 pb-2 border-b border-slate-100">
              {/* Left: Company Logo (Ornate Golden Shield Roundel) */}
              <div className="w-20 sm:w-24 shrink-0 flex flex-col items-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-white border-2 border-[#1E3A8A] shadow-md flex items-center justify-center">
                  <img
                    src="/aagam-logo.jpg"
                    alt="AAGAM Logo"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
              </div>

              {/* Center: Legal Corporate Identity */}
              <div className="flex-1 text-center space-y-1">
                <div className="text-[11px] sm:text-xs font-semibold text-slate-800 tracking-wide font-sans">
                  {settings.cert_iso_text || 'An ISO 9001: 2015 certified'}
                </div>

                {/* Bold Red & Blue Company Name (Matching Authentic Reference Image) */}
                <h1 className="font-heading font-black text-xl sm:text-3xl tracking-tight leading-none drop-shadow-sm uppercase">
                  <span className="text-[#C91D11]">
                    {(settings.cert_company_name || 'AAGAM DIGITAL TECHNOLOGY PVT. LTD.').replace(/\s*PVT\.?\s*LTD\.?/i, '')}
                  </span>
                  <span className="text-[#1E3A8A] ml-2">PVT. LTD.</span>
                </h1>

                {/* Blue Subtitle / Tagline */}
                <div className="text-xs sm:text-sm font-black text-[#1E3A8A] tracking-[0.25em] uppercase">
                  {settings.cert_tagline || 'LEARN • BUILD • INNOVATE'}
                </div>

                {/* Green Rounded Capsule Pill */}
                <div className="pt-0.5">
                  <span className="inline-block bg-[#15803D] text-white text-[9px] sm:text-[10px] font-bold px-4 py-0.5 rounded-full shadow-sm tracking-wide">
                    {settings.cert_mca_text || 'Registered Under Ministry of Corporate Affairs, Govt. of India'}
                  </span>
                </div>

                {/* Red CIN Number */}
                <div className="text-[10px] sm:text-xs font-bold text-[#C91D11] tracking-wider font-mono">
                  {settings.cert_cin_number || 'Corporate Identification No. : U80904BR2021PTC054517'}
                </div>
              </div>

              {/* Right: Certificate Number */}
              <div className="w-24 sm:w-28 shrink-0 text-right space-y-0.5">
                <div className="text-[10px] text-slate-600 font-semibold">Certificate. No :</div>
                <div className="text-xs sm:text-sm font-black font-mono text-[#0F172A]">{certificate.certificate_id}</div>
              </div>
            </div>

            {/* 2. CENTER RED RIBBON BANNER */}
            <div className="relative z-10 text-center my-3">
              <div className="inline-flex flex-col items-center justify-center bg-gradient-to-r from-[#991B1B] via-[#C91D11] to-[#991B1B] text-white px-8 sm:px-14 py-2 rounded-md shadow-lg border border-amber-300/40 relative">
                {/* 3D Ribbon Swallowtail tips */}
                <div className="absolute -left-3 top-1 bottom-1 w-3 bg-[#7F1D1D] rounded-l-sm shadow-sm hidden sm:block"></div>
                <div className="absolute -right-3 top-1 bottom-1 w-3 bg-[#7F1D1D] rounded-r-sm shadow-sm hidden sm:block"></div>
                <div className="font-heading font-black text-lg sm:text-2xl tracking-[0.18em] uppercase text-white drop-shadow-sm">
                  CERTIFICATE
                </div>
                <div className="text-[8px] sm:text-[9.5px] font-bold tracking-widest text-amber-200 uppercase -mt-0.5">
                  {settings.cert_ribbon_title || 'OF INDUSTRIAL INTERNSHIP EXCELLENCE'}
                </div>
              </div>
            </div>

            {/* 3. ROW: QR CODE (LEFT) + STUDENT PASSPORT PHOTO (RIGHT) */}
            <div className="relative z-10 flex items-center justify-between px-2 sm:px-4 -mt-1 mb-2">
              {/* Left: Verifiable QR Code + Regd No */}
              <div className="flex flex-col items-start gap-1">
                <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-sm">
                  {certificate.qr_code_data ? (
                    <img
                      src={certificate.qr_code_data}
                      alt="QR Verification"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-mono">
                      QR CODE
                    </div>
                  )}
                </div>
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-800 font-mono">
                  Regd. No : <span className="font-black text-[#0F172A]">{rollNo}</span>
                </div>
              </div>

              {/* Right: Candidate Passport Photo in Clean Frame */}
              <div className="flex flex-col items-end gap-1">
                <div className="w-20 h-24 sm:w-24 sm:h-28 bg-white border-[2.5px] border-[#1E3A8A] rounded-lg overflow-hidden shadow-md flex items-center justify-center relative">
                  {certificate.photo_url ? (
                    <img
                      src={certificate.photo_url}
                      alt={certificate.student_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-2 text-center">
                      <User className="w-8 h-8 text-slate-400 mb-1" />
                      <span className="text-[8px] font-bold uppercase leading-tight">Passport Photo</span>
                    </div>
                  )}
                  {/* Verified Ribbon Tag */}
                  <div className="absolute bottom-0 inset-x-0 bg-[#1E3A8A]/90 text-white text-[7px] font-bold text-center py-0.5 tracking-wider uppercase">
                    Verified
                  </div>
                </div>
              </div>
            </div>

            {/* 4. MAIN CERTIFICATE BODY CITATION */}
            <div className="relative z-10 px-2 sm:px-6 my-2 text-justify leading-relaxed text-slate-800 text-xs sm:text-sm">
              <p className="indent-4 leading-loose font-normal">
                This is to Certify that <strong className="font-extrabold text-[#0F172A] text-sm sm:text-base">Mr./Mrs. {certificate.student_name}</strong> Board Roll No/Reg.No - <strong className="font-extrabold text-[#0F172A] font-mono">{rollNo}</strong> Student of <strong className="font-extrabold text-[#0F172A]">{certificate.college_name || 'Government Polytechnic / Accredited University'}</strong> of <strong className="font-extrabold text-[#0F172A]">{branchName}</strong> has undergone <strong className="font-extrabold text-[#0F172A]">{certificate.duration || 'four weeks'}</strong> in internship training in our organization on <strong className="font-extrabold text-[#1E3A8A] uppercase">{certificate.program_title || 'Software Engineering'}</strong> Period from <strong className="font-extrabold text-[#0F172A]">{startDate}</strong> To <strong className="font-extrabold text-[#0F172A]">{endDate}</strong>. This Certificate Was Awarded On <strong className="font-extrabold text-[#0F172A]">{awardDate}</strong>. He/She has done a good job in the training and found to be sincere, hardworking with positive approach, We wish all the in his/her career endeavors.
              </p>
            </div>

            {/* 5. BOTTOM SECTION: SIGNATORIES & GOVT BADGES */}
            <div className="relative z-10 mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 items-end gap-2 text-center">
              {/* Director Signatory (Left) */}
              <div className="space-y-1 text-center sm:text-left pl-2">
                <div className="font-serif italic text-lg sm:text-2xl font-bold text-[#0F172A] tracking-wider" style={{ fontFamily: "'Great Vibes', 'Alex Brush', cursive" }}>
                  {directorName}
                </div>
                <div className="h-[1.5px] w-28 sm:w-36 bg-[#0F172A] mx-auto sm:mx-0"></div>
                <div className="text-xs sm:text-sm font-black text-[#0F172A] uppercase">
                  {settings.cert_director_title || 'Director'}
                </div>
              </div>

              {/* 3 Government Accreditation Badges: MSME, IAF, AICTE (Center) */}
              <div className="space-y-1 text-center flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 sm:gap-3 bg-white p-1 rounded-xl">
                  <img
                    src="/images/msme-logo.png"
                    alt="MSME"
                    className="h-11 sm:h-13 object-contain"
                    title="Ministry of Micro, Small and Medium Enterprises"
                  />
                  <img
                    src="/images/iaf-logo.png"
                    alt="IAF"
                    className="h-11 sm:h-13 object-contain"
                    title="International Accreditation Forum"
                  />
                  <img
                    src="/images/aicte-logo.png"
                    alt="AICTE"
                    className="h-11 sm:h-13 object-contain"
                    title="All India Council for Technical Education"
                  />
                </div>
              </div>

              {/* Course Instructor Signatory (Right) */}
              <div className="space-y-1 text-center sm:text-right pr-2">
                <div className="font-serif italic text-lg sm:text-2xl font-bold text-[#0F172A] tracking-wider ml-auto" style={{ fontFamily: "'Great Vibes', 'Alex Brush', cursive" }}>
                  {instructorName}
                </div>
                <div className="h-[1.5px] w-28 sm:w-36 bg-[#0F172A] ml-auto"></div>
                <div className="text-xs sm:text-sm font-black text-[#0F172A] uppercase">
                  {settings.cert_instructor_title || 'Course Instructor'}
                </div>
              </div>
            </div>

            {/* Corporate Office Address Capsule (Dedicated Center Row with Zero Collision) */}
            <div className="relative z-10 flex justify-center mt-3">
              <div className="bg-slate-50 border border-[#1E3A8A] rounded-full px-5 py-0.5 text-[8.5px] sm:text-[10px] font-bold text-[#0C2340] shadow-sm max-w-xl text-center">
                {settings.cert_corporate_office || 'Corporate office: Dak Bunglow Chauraha Near Biscoman Tower Patna'}
              </div>
            </div>

            {/* 6. IMMUTABLE FOOTER HASH */}
            <div className="relative z-10 text-center text-[8px] sm:text-[9px] text-slate-400 mt-2 font-mono">
              Publicly verifiable worldwide at {verifyUrl} • Ledger ID: {certificate.certificate_id}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VARIATION 2: IMPERIAL SOVEREIGN GOLD & ROYAL NAVY                     */}
        {/* ===================================================================== */}
        {selectedDesign === 'sovereign_gold' && (
          <div className="relative border-[8px] border-[#0C2340] p-6 sm:p-8 rounded-2xl bg-[#FDFAF4] overflow-hidden text-slate-900">
            {/* Double Gold Filigree Inset */}
            <div className="absolute inset-2 border-2 border-[#C59B27] rounded-xl pointer-events-none"></div>
            <div className="absolute inset-3 border border-[#E5C158]/50 rounded-lg pointer-events-none"></div>

            {/* Baroque Corner Ornaments in Polished Gold */}
            <div className="absolute top-4 left-4 w-9 h-9 border-t-2 border-l-2 border-[#C59B27] pointer-events-none"></div>
            <div className="absolute top-4 right-4 w-9 h-9 border-t-2 border-r-2 border-[#C59B27] pointer-events-none"></div>
            <div className="absolute bottom-4 left-4 w-9 h-9 border-b-2 border-l-2 border-[#C59B27] pointer-events-none"></div>
            <div className="absolute bottom-4 right-4 w-9 h-9 border-b-2 border-r-2 border-[#C59B27] pointer-events-none"></div>

            {/* Top Brand Header */}
            <div className="relative z-10 text-center space-y-1.5 pb-3 border-b border-[#C59B27]/40">
              <div className="flex items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#0C2340] via-[#C59B27] to-[#E5C158] shadow-md">
                  <img src="/aagam-logo.jpg" alt="Logo" className="w-full h-full rounded-full object-contain bg-white" />
                </div>
              </div>

              <div className="text-[11px] font-bold text-[#854D0E] tracking-[0.25em] uppercase">
                {settings.cert_iso_text || 'An ISO 9001: 2015 certified'}
              </div>

              <h1 className="font-serif font-black text-2xl sm:text-4xl text-[#0C2340] tracking-wide uppercase drop-shadow-sm">
                {settings.cert_company_name || 'AAGAM DIGITAL TECHNOLOGY PVT. LTD.'}
              </h1>

              <div className="text-xs font-black text-[#C59B27] tracking-[0.35em] uppercase">
                {settings.cert_tagline || 'LEARN • BUILD • INNOVATE'}
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                <span className="bg-[#15803D] text-white text-[9px] font-bold px-3 py-0.5 rounded-full shadow-xs">
                  {settings.cert_mca_text || 'Registered Under Ministry of Corporate Affairs, Govt. of India'}
                </span>
                <span className="text-[10px] font-mono font-bold text-[#854D0E]">
                  {settings.cert_cin_number || 'CIN: U80904BR2021PTC054517'}
                </span>
              </div>
            </div>

            {/* Title & Citation Header */}
            <div className="relative z-10 text-center my-4 space-y-2">
              <div className="inline-block px-8 py-1.5 rounded-full bg-[#0C2340] text-[#E5C158] font-heading font-black text-sm sm:text-base tracking-[0.2em] uppercase border border-[#C59B27] shadow-md">
                Certificate of Industrial Excellence &amp; Completion
              </div>

              <p className="text-xs sm:text-sm text-slate-500 italic font-serif">
                This credential is formally and proudly conferred upon
              </p>

              {/* Student Name */}
              <h2 className="font-serif font-black text-3xl sm:text-5xl text-[#0C2340] tracking-wide py-1 drop-shadow-sm">
                {certificate.student_name}
              </h2>
            </div>

            {/* Symmetrical Left QR, Center Body & Right Photo */}
            <div className="relative z-10 flex items-center justify-between gap-4 px-2 my-2">
              {/* Left QR */}
              <div className="w-24 shrink-0 flex flex-col items-center gap-1">
                <div className="p-1.5 bg-white border-2 border-[#C59B27] rounded-xl shadow-sm">
                  {certificate.qr_code_data ? (
                    <img src={certificate.qr_code_data} alt="QR" className="w-16 h-16 object-contain" />
                  ) : (
                    <div className="w-16 h-16 bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">QR</div>
                  )}
                </div>
                <div className="text-[9px] font-mono font-bold text-slate-700">Regd: {rollNo}</div>
              </div>

              {/* Center Body Citation */}
              <div className="flex-1 text-center text-xs sm:text-sm text-slate-700 leading-relaxed max-w-xl mx-auto">
                <p>
                  from <strong className="text-slate-900 font-bold">{certificate.college_name || 'Accredited University'}</strong> (Branch: <strong className="text-slate-900 font-bold">{branchName}</strong>) in recognition of successfully completing the intensive industrial curriculum in <strong className="text-[#0C2340] font-black uppercase text-sm sm:text-base">{certificate.program_title || 'Software Engineering'}</strong> spanning <strong className="text-slate-900 font-bold">{certificate.duration || '4 Weeks'}</strong> from <strong className="text-slate-900 font-bold">{startDate}</strong> to <strong className="text-slate-900 font-bold">{endDate}</strong>.
                </p>
              </div>

              {/* Right Photo */}
              <div className="w-24 shrink-0 flex flex-col items-center gap-1">
                <div className="w-20 h-24 bg-white border-2 border-[#C59B27] rounded-xl overflow-hidden shadow-md flex items-center justify-center">
                  {certificate.photo_url ? (
                    <img src={certificate.photo_url} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="text-[8px] font-bold text-[#854D0E] uppercase">Conferred: {awardDate}</div>
              </div>
            </div>

            {/* Bottom Signatories & Gold Seal */}
            <div className="relative z-10 mt-5 pt-3 border-t border-[#C59B27]/40 grid grid-cols-3 items-end gap-3 text-center">
              {/* Director */}
              <div className="space-y-1 text-left pl-2">
                <div className="font-serif italic text-lg sm:text-2xl font-bold text-[#0C2340]" style={{ fontFamily: "'Great Vibes', cursive" }}>
                  {directorName}
                </div>
                <div className="h-[1.5px] w-32 bg-[#0C2340]"></div>
                <div className="text-xs font-black text-[#0C2340] uppercase">{settings.cert_director_title || 'Director'}</div>
              </div>

              {/* Center 3 Govt Logos */}
              <div className="space-y-1 flex flex-col items-center">
                <div className="flex items-center justify-center gap-3">
                  <img src="/images/msme-logo.png" alt="MSME" className="h-10 sm:h-12 object-contain" />
                  <img src="/images/iaf-logo.png" alt="IAF" className="h-10 sm:h-12 object-contain" />
                  <img src="/images/aicte-logo.png" alt="AICTE" className="h-10 sm:h-12 object-contain" />
                </div>
              </div>

              {/* Course Instructor */}
              <div className="space-y-1 text-right pr-2">
                <div className="font-serif italic text-lg sm:text-2xl font-bold text-[#0C2340] ml-auto" style={{ fontFamily: "'Great Vibes', cursive" }}>
                  {instructorName}
                </div>
                <div className="h-[1.5px] w-32 bg-[#0C2340] ml-auto"></div>
                <div className="text-xs font-black text-[#0C2340] uppercase">{settings.cert_instructor_title || 'Course Instructor'}</div>
              </div>
            </div>

            {/* Corporate Office Capsule (Dedicated Row) */}
            <div className="relative z-10 flex justify-center mt-3">
              <div className="bg-white border border-[#C59B27] rounded-full px-5 py-0.5 text-[8.5px] sm:text-[9.5px] font-bold text-[#0C2340] max-w-xl text-center shadow-xs">
                {settings.cert_corporate_office || 'Corporate office: Patna, Bihar'}
              </div>
            </div>

            {/* Ledger ID */}
            <div className="relative z-10 text-center text-[8px] text-slate-400 mt-2 font-mono">
              Immutable Certificate ID: <span className="text-[#0C2340] font-bold">{certificate.certificate_id}</span> • Public Verification: {verifyUrl}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* VARIATION 3: MODERN CORPORATE ISO-TECH EXCELLENCE                     */}
        {/* ===================================================================== */}
        {selectedDesign === 'modern_tech' && (
          <div className="relative border-4 border-slate-900 p-6 sm:p-8 rounded-2xl bg-white overflow-hidden text-slate-900">
            {/* Geometric Top Accent Stripe */}
            <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-sky-600 via-indigo-600 to-rose-600"></div>

            {/* Modern Header Bar */}
            <div className="relative z-10 flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-900 p-1 flex items-center justify-center shadow-md">
                  <img src="/aagam-logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900 uppercase tracking-tight">
                    {settings.cert_company_name || 'AAGAM DIGITAL TECHNOLOGY PVT. LTD.'}
                  </h1>
                  <div className="text-[11px] font-bold text-sky-600 tracking-wider">
                    {settings.cert_tagline || 'LEARN • BUILD • INNOVATE'}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                      {settings.cert_mca_text || 'MCA Govt. Registered'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono text-slate-600 bg-slate-100">
                      {settings.cert_cin_number || 'CIN: U80904BR2021PTC054517'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold bg-sky-50 text-sky-700 border border-sky-200 mb-1">
                  {settings.cert_iso_text || 'ISO 9001:2015'}
                </span>
                <div className="text-[11px] font-mono text-slate-500 font-bold">
                  ID: <span className="text-slate-900 font-black">{certificate.certificate_id}</span>
                </div>
              </div>
            </div>

            {/* Split Content: Left Credential Card, Right Citation */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-6 my-6 items-center">
              {/* Left Column: Photo & QR Badge Card */}
              <div className="md:col-span-1 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center gap-3 text-center">
                <div className="w-24 h-28 bg-white rounded-xl border border-slate-300 overflow-hidden shadow-sm flex items-center justify-center">
                  {certificate.photo_url ? (
                    <img src={certificate.photo_url} alt="Candidate" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <div className="space-y-0.5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase">Board Roll No</div>
                  <div className="text-xs font-black font-mono text-slate-900">{rollNo}</div>
                </div>
                <div className="w-16 h-16 p-1 bg-white rounded-lg border border-slate-200 shadow-xs">
                  {certificate.qr_code_data ? (
                    <img src={certificate.qr_code_data} alt="QR" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px]">QR</div>
                  )}
                </div>
              </div>

              {/* Right Column: Full Commendation */}
              <div className="md:col-span-3 space-y-3 pl-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
                    Industrial Internship Completion
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-black text-slate-900 font-heading">
                    {certificate.student_name}
                  </h2>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Has successfully satisfied all industrial program requirements and practical engineering milestones from <strong className="text-slate-900 font-bold">{certificate.college_name || 'Accredited Institution'}</strong> in <strong className="text-slate-900 font-bold">{branchName}</strong>.
                </p>

                <div className="p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-1">
                  <div className="text-xs text-sky-900 font-bold">
                    Specialization: <span className="text-sky-700 font-black">{certificate.program_title || 'Software Engineering'}</span>
                  </div>
                  <div className="text-[11px] text-slate-600 flex flex-wrap gap-3 font-medium">
                    <span>Duration: <strong className="text-slate-800">{certificate.duration || '4 Weeks'}</strong></span>
                    <span>•</span>
                    <span>Timeline: <strong className="text-slate-800">{startDate} to {endDate}</strong></span>
                    <span>•</span>
                    <span>Award Date: <strong className="text-slate-800">{awardDate}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Accreditation & Signatures */}
            <div className="relative z-10 pt-4 border-t border-slate-200 grid grid-cols-3 items-end gap-3 text-center">
              {/* Director */}
              <div className="space-y-1 text-left">
                <div className="font-serif italic text-lg sm:text-xl font-bold text-slate-900">
                  {directorName}
                </div>
                <div className="h-[1.5px] w-28 bg-slate-900"></div>
                <div className="text-xs font-bold text-slate-700 uppercase">{settings.cert_director_title || 'Director'}</div>
              </div>

              {/* Center 3 Govt Logos */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center justify-center gap-2">
                  <img src="/images/msme-logo.png" alt="MSME" className="h-9 sm:h-11 object-contain" />
                  <img src="/images/iaf-logo.png" alt="IAF" className="h-9 sm:h-11 object-contain" />
                  <img src="/images/aicte-logo.png" alt="AICTE" className="h-9 sm:h-11 object-contain" />
                </div>
              </div>

              {/* Course Instructor */}
              <div className="space-y-1 text-right">
                <div className="font-serif italic text-lg sm:text-xl font-bold text-slate-900 ml-auto">
                  {instructorName}
                </div>
                <div className="h-[1.5px] w-28 bg-slate-900 ml-auto"></div>
                <div className="text-xs font-bold text-slate-700 uppercase">{settings.cert_instructor_title || 'Course Instructor'}</div>
              </div>
            </div>

            {/* Corporate Office Capsule (Dedicated Row) */}
            <div className="relative z-10 flex justify-center mt-3">
              <div className="bg-slate-50 border border-slate-300 rounded-full px-5 py-0.5 text-[8px] sm:text-[9px] text-slate-600 font-mono text-center">
                {settings.cert_corporate_office || 'Corporate Office: Patna, Bihar'}
              </div>
            </div>

            <div className="relative z-10 text-center text-[8px] text-slate-400 mt-3 font-mono">
              Public Ledger Hash: {certificate.certificate_id} • Verified Online: {verifyUrl}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


