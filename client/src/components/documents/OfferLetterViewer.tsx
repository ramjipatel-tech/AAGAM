import React, { useRef } from 'react';
import { Download, Printer, ShieldCheck, CheckCircle2, Lock, QrCode } from 'lucide-react';
import { OfferLetter } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface OfferLetterViewerProps {
  offer: OfferLetter & {
    fee_amount?: number;
    fee_reason?: string;
    is_paid?: number;
    provisioning_status?: string;
  };
  onAccept?: () => void;
  isStudentView?: boolean;
}

export const OfferLetterViewer: React.FC<OfferLetterViewerProps> = ({
  offer,
  onAccept,
  isStudentView = false,
}) => {
  const offerRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    try {
      // 1. Use server vector PDF endpoint which generates on-the-fly if needed
      const downloadUrl = `/api/offers/${offer.offer_id}/pdf`;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `AAGAM_Offer_Letter_${offer.offer_id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('[PDF DOWNLOAD ERROR]', err);
      // Fallback to client canvas
      if (!offerRef.current) return;
      const canvas = await html2canvas(offerRef.current, { scale: 3, useCORS: true, backgroundColor: '#FFFFFF' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${offer.offer_id}.pdf`);
    }
  };

  const handlePrint = () => {
    if (!offerRef.current) {
      window.print();
      return;
    }

    const offerHtml = offerRef.current.outerHTML;
    const printWin = window.open('', '_blank', 'width=950,height=1000');
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
          <title>AAGAM Offer Letter - ${offer.offer_id}</title>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap">
          ${styles}
          <style>
            @page {
              size: A4 portrait;
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
              width: 210mm;
              box-sizing: border-box;
              padding: 8mm;
              background-color: #FFFFFF !important;
              margin: auto;
            }
            .print-wrapper > div {
              box-shadow: none !important;
              border: none !important;
              width: 100% !important;
              max-width: 100% !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          </style>
        </head>
        <body>
          <div class="print-wrapper">
            ${offerHtml}
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

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
              offer.status === 'Accepted'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : offer.status === 'Issued'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            Status: {offer.status}
          </span>
          <span className="text-slate-400 font-mono">Ref: {offer.offer_id}</span>
          {offer.fee_amount !== undefined && offer.fee_amount > 0 && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              Fee: ₹{offer.fee_amount} ({offer.is_paid ? 'Paid' : 'Pending'})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            Print
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Download Official PDF
          </button>

          {isStudentView && offer.status === 'Issued' && onAccept && (
            <button
              onClick={onAccept}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-lg shadow-lg shadow-emerald-900/40 transition-all transform hover:scale-105"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accept Offer
            </button>
          )}
        </div>
      </div>

      {/* Offer Letter A4 Sheet (Portrait) */}
      <div
        ref={offerRef}
        className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-200 max-w-3xl mx-auto space-y-6 font-sans relative overflow-hidden"
      >
        {/* Top Gradient Stripe */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-600 via-sky-400 to-amber-500" />

        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <img src="/aagam-logo.jpg" alt="Watermark" className="w-[500px] h-[500px] object-contain grayscale" />
        </div>

        {/* Executive Letterhead Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-sky-600 to-amber-500 shadow-md">
              <img src="/aagam-logo.jpg" alt="AAGAM Logo" className="w-full h-full rounded-full object-cover bg-white" />
            </div>
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-slate-950 uppercase tracking-tight">
                AAGAM DIGITAL TECHNOLOGY
              </h1>
              <div className="text-[11px] font-bold text-sky-800 tracking-widest uppercase flex items-center gap-2">
                <span>Learn • Build • Innovate</span>
                <span>•</span>
                <span className="text-slate-500 font-normal">CIN: Reg. Enterprise Portal</span>
              </div>
              <div className="text-[10px] text-slate-600 mt-0.5">
                Patna, Bihar, India | Email: AAGAMDigitaltech@gmail.com | Helpline: +91 9693335499
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block px-2.5 py-1 bg-sky-50 border border-sky-200 rounded text-xs font-mono font-bold text-sky-900">
              {offer.offer_id}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Date: {offer.issued_at ? offer.issued_at.split('T')[0] : new Date().toISOString().split('T')[0]}
            </div>
          </div>
        </div>

        {/* Addressee Info */}
        <div className="space-y-1 text-sm bg-slate-50/80 p-4 rounded-xl border border-slate-100">
          <div className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Candidate Details:</div>
          <div className="font-bold text-slate-900 text-base">{offer.student_name}</div>
          <div className="text-slate-700 text-xs">{offer.college_name}</div>
          <div className="text-slate-600 text-xs">{offer.course}</div>
        </div>

        {/* Letter Body */}
        <div className="space-y-3.5 text-sm text-slate-800 leading-relaxed">
          <p className="font-bold text-slate-950 border-b border-slate-200 pb-1">
            Subject: Official Offer of Internship for <span className="text-sky-800">{offer.internship_title}</span>
          </p>

          <p>
            Dear <b>{offer.student_name}</b>,
          </p>

          <p>
            On behalf of <b>AAGAM DIGITAL TECHNOLOGY PRIVATE LIMITED</b>, we are pleased to offer you the appointment of <b>{offer.internship_title}</b>. Following a rigorous evaluation of your academic profile, application, and institutional submission, our executive review committee is confident in your ability to contribute effectively to our engineering sprints.
          </p>

          {/* Program Matrix */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block font-medium">Duration:</span>
              <span className="font-bold text-slate-900">{offer.duration || '6 Months'}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Commencement:</span>
              <span className="font-bold text-slate-900">{offer.start_date}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Completion Target:</span>
              <span className="font-bold text-slate-900">{offer.end_date}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-medium">Stipend / Benefits:</span>
              <span className="font-bold text-sky-800">{offer.stipend_fee_text || 'Performance-based + LOR'}</span>
            </div>
          </div>

          {/* Transparent Fee & Breakdown (if applicable) */}
          {offer.fee_amount !== undefined && offer.fee_amount > 0 && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-950 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>Program Onboarding & Verification Fee: ₹{offer.fee_amount}</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-200 font-extrabold uppercase">
                  {offer.is_paid ? 'Status: Paid' : 'Status: Payable Upon Acceptance'}
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                <strong>Fee Purpose / Terms:</strong> {offer.fee_reason || 'Covers cloud workspace infrastructure, digital verification registry, and dedicated 1-on-1 industry mentor guidance.'}
              </p>
            </div>
          )}

          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5">
              Terms of Engagement & Professional Code:
            </h4>
            <div className="text-xs text-slate-700 whitespace-pre-line bg-slate-50/80 p-3.5 rounded-lg border border-slate-200 leading-relaxed font-sans text-justify">
              {offer.terms_conditions ||
                `1. The intern shall maintain utmost confidentiality regarding intellectual property, proprietary tools, and source code.
2. Regular milestone updates, weekly sprint check-ins, and adherence to engineering guidelines are mandatory.
3. Successful completion grants an official verifiable QR Certificate and an Executive Letter of Recommendation (LOR).
4. The appointment is subject to code of conduct policies of AAGAM Digital Technology.`}
            </div>
          </div>
        </div>

        {/* Executive Signatures & Central Verification QR */}
        <div className="pt-6 border-t-2 border-slate-900 flex items-end justify-between">
          <div className="space-y-1">
            <div className="font-serif italic text-lg text-slate-900 font-bold tracking-wider">Ayush Raj</div>
            <div className="text-xs font-bold text-slate-900">Ayush Raj</div>
            <div className="text-[11px] text-sky-800 font-semibold">Chief Executive Officer</div>
            <div className="text-[10px] text-slate-500">AAGAM Digital Technology</div>
          </div>

          <div className="space-y-1 text-center">
            {offer.qr_code_data ? (
              <img src={offer.qr_code_data} alt="Verification QR" className="w-16 h-16 mx-auto border border-slate-300 p-0.5 rounded shadow-sm bg-white" />
            ) : (
              <div className="w-16 h-16 mx-auto border border-slate-300 rounded flex items-center justify-center bg-slate-50 text-slate-400">
                <QrCode className="w-8 h-8" />
              </div>
            )}
            <div className="text-[9px] font-mono text-slate-600 font-semibold uppercase">Scan to Verify</div>
          </div>

          <div className="space-y-1 text-right">
            <div className="font-serif italic text-lg text-slate-900 font-bold tracking-wider">Akash Verma</div>
            <div className="text-xs font-bold text-slate-900">Akash Verma</div>
            <div className="text-[11px] text-sky-800 font-semibold">Head of HR & Talent Acquisition</div>
            <div className="text-[10px] text-slate-500">Contact: +91 9693335499</div>
          </div>
        </div>

        {/* Letter Footer */}
        <div className="border-t border-slate-200 pt-3 text-center text-[9px] text-slate-400">
          AAGAM DIGITAL TECHNOLOGY PRIVATE LIMITED • Learn • Build • Innovate | Developed by Zyvionex Technologies
        </div>
      </div>
    </div>
  );
};
