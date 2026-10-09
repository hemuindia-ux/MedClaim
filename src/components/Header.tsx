import React from 'react';
import { 
  HeartPulse, 
  FileSpreadsheet, 
  FileText, 
  RotateCcw, 
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  Building
} from 'lucide-react';
import { MedicalClaim } from '../types/claim';
import { exportClaimsToXLSX, exportClaimsToPDF } from '../utils/exportUtils';

interface HeaderProps {
  claims: MedicalClaim[];
  onLoadSamples: () => void;
  onClearAll: () => void;
  onScrollToForm: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  claims,
  onLoadSamples,
  onClearAll,
  onScrollToForm,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-900/30">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">MedClaim</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded-full">
                Portal v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Medical Cost Submission & Arithmetic Tax Verification
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Scroll to add new */}
          <button
            type="button"
            onClick={onScrollToForm}
            className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Claim</span>
          </button>

          {/* Quick XLSX Export */}
          <button
            type="button"
            onClick={() => exportClaimsToXLSX(claims)}
            disabled={claims.length === 0}
            className="px-3.5 py-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Export all claims to Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden md:inline">Download</span> XLSX
          </button>

          {/* Quick PDF Export */}
          <button
            type="button"
            onClick={() => exportClaimsToPDF(claims)}
            disabled={claims.length === 0}
            className="px-3.5 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Download official reimbursement report (.pdf)"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">Download</span> PDF
          </button>

          {/* Load Sample / Reset button */}
          <div className="border-l border-slate-700 pl-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={onLoadSamples}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
              title="Load demo medical claims"
            >
              Demo Data
            </button>
            {claims.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 text-xs font-medium border border-slate-700 hover:border-rose-800 transition"
                title="Clear all records"
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
