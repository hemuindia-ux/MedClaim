import React from 'react';
import { 
  FileCheck2, 
  DollarSign, 
  Receipt, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench,
  Percent
} from 'lucide-react';
import { MedicalClaim, formatCurrency, isTotalAccurate } from '../types/claim';

interface ClaimStatsProps {
  claims: MedicalClaim[];
  onFixAllDiscrepancies: () => void;
}

export const ClaimStats: React.FC<ClaimStatsProps> = ({ claims, onFixAllDiscrepancies }) => {
  const totalClaims = claims.length;
  const totalSubTotal = claims.reduce((sum, c) => sum + (Number(c.subTotal) || 0), 0);
  const totalGst = claims.reduce((sum, c) => sum + (Number(c.gst) || 0), 0);
  const totalGrandTotal = claims.reduce((sum, c) => sum + (Number(c.grandTotal) || 0), 0);

  // Check discrepancies
  const discrepantClaims = claims.filter(c => !isTotalAccurate(c.subTotal, c.gst, c.grandTotal));
  const hasDiscrepancies = discrepantClaims.length > 0;
  const calculatedGrandTotal = Math.round((totalSubTotal + totalGst) * 100) / 100;

  return (
    <div className="space-y-3">
      {/* 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Count */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Claims</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {totalClaims} <span className="text-xs font-normal text-slate-500">records</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Submitted in table</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Sub-Total */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sub-Total</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {formatCurrency(totalSubTotal)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Before GST / Taxes</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total GST */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total GST</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {formatCurrency(totalGst)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Taxes aggregate</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Grand Total */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Grand Total</p>
            <h3 className="text-2xl font-bold text-sky-700 mt-1 font-mono">
              {formatCurrency(totalGrandTotal)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Reimbursement payable</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Audit Banner */}
      {totalClaims > 0 && (
        <div className={`p-3.5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
          hasDiscrepancies 
            ? 'bg-amber-50/90 border-amber-300 text-amber-900' 
            : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-center gap-3">
            {hasDiscrepancies ? (
              <div className="w-8 h-8 rounded-lg bg-amber-200/80 flex items-center justify-center text-amber-800 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-200/80 flex items-center justify-center text-emerald-800 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <span>Total Audit Status:</span>
                {hasDiscrepancies ? (
                  <span className="text-amber-800 font-bold">
                    {discrepantClaims.length} of {totalClaims} record(s) have Grand Total discrepancies
                  </span>
                ) : (
                  <span className="text-emerald-800 font-bold">
                    100% Verified (All Grand Totals match Sub-Total + GST)
                  </span>
                )}
              </div>
              <p className="text-xs opacity-85 mt-0.5">
                Expected sum of (Sub-Total + GST) is <strong className="font-mono">{formatCurrency(calculatedGrandTotal)}</strong>.
                {hasDiscrepancies && (
                  <span className="ml-1">
                    Entered Grand Total sum is <strong className="font-mono">{formatCurrency(totalGrandTotal)}</strong> (Variance: {formatCurrency(Math.abs(totalGrandTotal - calculatedGrandTotal))}).
                  </span>
                )}
              </p>
            </div>
          </div>

          {hasDiscrepancies && (
            <button
              type="button"
              onClick={onFixAllDiscrepancies}
              className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-medium text-xs shadow-xs transition flex items-center gap-1.5 shrink-0"
              title="Automatically update Grand Total = Sub-Total + GST for all discrepant records"
            >
              <Wrench className="w-3.5 h-3.5" />
              Auto-Fix All Discrepancies
            </button>
          )}
        </div>
      )}
    </div>
  );
};
