import React from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Receipt, 
  Building2, 
  User, 
  Calendar, 
  FileText,
  DollarSign
} from 'lucide-react';
import { MedicalClaim, formatCurrency, isTotalAccurate, getDiscrepancy } from '../types/claim';

interface ClaimDetailModalProps {
  claim: MedicalClaim | null;
  onClose: () => void;
  onEdit: (claim: MedicalClaim) => void;
  onFix: (id: string) => void;
}

export const ClaimDetailModal: React.FC<ClaimDetailModalProps> = ({
  claim,
  onClose,
  onEdit,
  onFix,
}) => {
  if (!claim) return null;

  const accurate = isTotalAccurate(claim.subTotal, claim.gst, claim.grandTotal);
  const discrepancy = getDiscrepancy(claim.subTotal, claim.gst, claim.grandTotal);
  const calculatedGrandTotal = Math.round((claim.subTotal + claim.gst) * 100) / 100;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Receipt className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-base font-bold tracking-tight">Medical Expense Voucher</h3>
              <p className="text-xs text-slate-300 font-mono">Reference #{claim.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher Body */}
        <div className="p-6 space-y-5 text-sm">
          {/* Status Alert */}
          <div className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            accurate 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div className="flex items-center gap-2">
              {accurate ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <div>
                <span className="font-bold">
                  {accurate ? 'Grand Total Verified Match' : 'Discrepancy Warning'}
                </span>
                <p className="text-[11px] opacity-90">
                  {accurate 
                    ? 'Sub-Total ($) + GST ($) equals Grand Total ($).'
                    : `Entered Total differs from Sub-Total + GST by ${discrepancy > 0 ? `+${formatCurrency(discrepancy)}` : formatCurrency(discrepancy)}.`}
                </p>
              </div>
            </div>
            {!accurate && (
              <button
                type="button"
                onClick={() => {
                  onFix(claim.id);
                  onClose();
                }}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs shrink-0"
              >
                Auto-Fix
              </button>
            )}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3" /> Claimant
              </span>
              <p className="font-semibold text-slate-900 mt-0.5">{claim.employeeName}</p>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Consultation Date
              </span>
              <p className="font-semibold text-slate-900 mt-0.5">{claim.claimDate}</p>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Clinic
              </span>
              <p className="font-semibold text-slate-900 mt-0.5">{claim.clinicName}</p>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Receipt No.
              </span>
              <p className="font-mono text-slate-700 mt-0.5">{claim.receiptNumber || 'N/A'}</p>
            </div>
          </div>

          {/* Illness Summary */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Diagnosis / Summary of Illness:
            </span>
            <div className="mt-1.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed text-xs">
              {claim.illnessSummary}
            </div>
            {claim.notes && (
              <p className="text-xs text-slate-400 italic mt-1.5">
                Internal Remarks: {claim.notes}
              </p>
            )}
          </div>

          {/* Financial Breakdown Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2.5 text-slate-600">Sub-Total (Net Medical Charge)</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-800">
                    {formatCurrency(claim.subTotal)}
                  </td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-2.5 text-slate-600">Goods & Services Tax (GST)</td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-slate-800">
                    {formatCurrency(claim.gst)}
                  </td>
                </tr>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <td className="px-4 py-2 text-slate-500 italic">Expected Total (Sub-Total + GST)</td>
                  <td className="px-4 py-2 text-right font-mono text-slate-600">
                    {formatCurrency(calculatedGrandTotal)}
                  </td>
                </tr>
                <tr className="bg-sky-50/70 font-bold text-slate-900">
                  <td className="px-4 py-3 text-sm flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-sky-700" />
                    Final Grand Total Payable
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-base text-sky-800">
                    {formatCurrency(claim.grandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Voucher
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onEdit(claim);
                onClose();
              }}
              className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold transition"
            >
              Edit Claim
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
