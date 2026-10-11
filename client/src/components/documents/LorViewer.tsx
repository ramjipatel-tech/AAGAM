import React, { useRef } from 'react';
import { Download, Printer, ShieldCheck } from 'lucide-react';
import { LetterOfRecommendation } from '../../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface LorViewerProps {
  lor: LetterOfRecommendation;
}

export const LorViewer: React.FC<LorViewerProps> = ({ lor }) => {
  const lorRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = async () => {
    if (!lorRef.current) return;
    try {
      const canvas = await html2canvas(lorRef.current, { scale: 2.5, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const width = pdf.internal.pageSize.getWidth();
      const height = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, 'PNG', 0, 0, width, height);
      pdf.save(`${lor.lor_id}.pdf`);
    } catch (err) {
      console.error('[PDF ERROR]', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Status: {lor.status}
          </span>
          <span className="text-slate-400">LOR ID: {lor.lor_id}</span>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-lg shadow-md transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download PDF
        </button>
      </div>

      <div
        ref={lorRef}
        className="bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-2xl border border-slate-200 max-w-3xl mx-auto space-y-6 font-sans select-none"
      >
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
          <div className="flex items-center gap-3.5">
            <img src="/aagam-logo.jpg" alt="AAGAM Logo" className="w-14 h-14 rounded-full border border-slate-200" />
            <div>
              <h1 className="font-heading font-extrabold text-2xl text-slate-950 uppercase">
                AAGAM DIGITAL TECHNOLOGY
              </h1>
              <div className="text-[11px] font-bold text-sky-700 tracking-widest uppercase">
                Learn • Build • Innovate
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-bold text-slate-900 font-mono">{lor.lor_id}</div>
            <div className="text-[11px] text-slate-500">{lor.issued_at ? lor.issued_at.split('T')[0] : 'Today'}</div>
          </div>
        </div>

        <div className="text-center py-2">
          <h2 className="font-heading font-bold text-xl text-slate-950 underline decoration-sky-500 underline-offset-8">
            LETTER OF RECOMMENDATION
          </h2>
          <div className="text-xs text-slate-500 mt-2 font-serif italic">To Whom It May Concern</div>
        </div>

        <div className="text-sm text-slate-800 leading-relaxed space-y-4">
          <p className="whitespace-pre-line font-serif text-base">{lor.recommendation_body}</p>

          <div className="bg-sky-50 p-4 rounded-xl border border-sky-100 text-xs">
            <span className="font-bold text-slate-900 block mb-1">Performance Assessment:</span>
            <span className="text-sky-900 font-medium">{lor.performance_rating}</span>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex items-end justify-between">
          <div className="space-y-1">
            <div className="font-serif italic text-base text-slate-900 font-semibold">Ayush Raj</div>
            <div className="text-xs font-bold text-slate-900">Ayush Raj</div>
            <div className="text-[10px] text-slate-500">CEO, AAGAM Digital Technology</div>
          </div>

          {lor.qr_code_data && (
            <div className="text-center">
              <img src={lor.qr_code_data} alt="QR" className="w-14 h-14 mx-auto border border-slate-200 p-0.5" />
              <div className="text-[8px] text-slate-400 font-mono mt-0.5">Verify ID</div>
            </div>
          )}

          <div className="space-y-1 text-right">
            <div className="font-serif italic text-base text-slate-900 font-semibold">Akash Verma</div>
            <div className="text-xs font-bold text-slate-900">Akash Verma</div>
            <div className="text-[10px] text-slate-500">Head of HR & Talent</div>
          </div>
        </div>
      </div>
    </div>
  );
};
