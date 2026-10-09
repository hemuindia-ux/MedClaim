import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Building2, 
  User, 
  DollarSign, 
  FileText, 
  Calendar, 
  Tag, 
  Receipt,
  RotateCcw
} from 'lucide-react';
import { 
  MedicalClaim, 
  CLAIM_CATEGORIES, 
  COMMON_ILLNESS_TEMPLATES, 
  isTotalAccurate, 
  getDiscrepancy, 
  formatCurrency 
} from '../types/claim';

interface ClaimFormProps {
  onAddClaim: (claim: Omit<MedicalClaim, 'id' | 'createdAt'>) => void;
  onUpdateClaim?: (id: string, updated: Partial<MedicalClaim>) => void;
  editingClaim?: MedicalClaim | null;
  onCancelEdit?: () => void;
}

export const ClaimForm: React.FC<ClaimFormProps> = ({
  onAddClaim,
  onUpdateClaim,
  editingClaim,
  onCancelEdit,
}) => {
  // Form fields
  const [employeeName, setEmployeeName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [subTotalStr, setSubTotalStr] = useState('');
  const [gstStr, setGstStr] = useState('');
  const [grandTotalStr, setGrandTotalStr] = useState('');
  const [illnessSummary, setIllnessSummary] = useState('');
  const [claimDate, setClaimDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(CLAIM_CATEGORIES[0]);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Auto-calculation toggle
  const [autoComputeTotal, setAutoComputeTotal] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showIllnessSuggestions, setShowIllnessSuggestions] = useState(false);

  // Sync state if editing an existing claim
  useEffect(() => {
    if (editingClaim) {
      setEmployeeName(editingClaim.employeeName);
      setClinicName(editingClaim.clinicName);
      setSubTotalStr(editingClaim.subTotal.toFixed(2));
      setGstStr(editingClaim.gst.toFixed(2));
      setGrandTotalStr(editingClaim.grandTotal.toFixed(2));
      setIllnessSummary(editingClaim.illnessSummary);
      setClaimDate(editingClaim.claimDate);
      setCategory(editingClaim.category as any || CLAIM_CATEGORIES[0]);
      setReceiptNumber(editingClaim.receiptNumber || '');
      setNotes(editingClaim.notes || '');
      // If the editing claim already has an intentional discrepancy, don't auto-overwrite
      const matches = isTotalAccurate(editingClaim.subTotal, editingClaim.gst, editingClaim.grandTotal);
      setAutoComputeTotal(matches);
    } else {
      resetForm();
    }
  }, [editingClaim]);

  // Numeric values
  const subTotalNum = parseFloat(subTotalStr) || 0;
  const gstNum = parseFloat(gstStr) || 0;
  const calculatedGrandTotal = Math.round((subTotalNum + gstNum) * 100) / 100;
  const grandTotalNum = parseFloat(grandTotalStr) || 0;

  // Auto-calculate grand total when subTotal or gst changes, if autoCompute is active
  useEffect(() => {
    if (autoComputeTotal) {
      if (subTotalStr !== '' || gstStr !== '') {
        setGrandTotalStr(calculatedGrandTotal.toFixed(2));
      }
    }
  }, [subTotalStr, gstStr, autoComputeTotal]);

  const hasNumbersEntered = subTotalStr !== '' && grandTotalStr !== '';
  const isAccurate = isTotalAccurate(subTotalNum, gstNum, grandTotalNum);
  const discrepancy = getDiscrepancy(subTotalNum, gstNum, grandTotalNum);

  const resetForm = () => {
    setEmployeeName('');
    setClinicName('');
    setSubTotalStr('');
    setGstStr('');
    setGrandTotalStr('');
    setIllnessSummary('');
    setClaimDate(new Date().toISOString().slice(0, 10));
    setCategory(CLAIM_CATEGORIES[0]);
    setReceiptNumber('');
    setNotes('');
    setAutoComputeTotal(true);
    setErrors({});
  };

  // Helper to quickly apply GST rate percentage
  const applyGstRate = (percentage: number) => {
    const calculatedGst = Math.round(subTotalNum * (percentage / 100) * 100) / 100;
    setGstStr(calculatedGst.toFixed(2));
    if (autoComputeTotal) {
      setGrandTotalStr((subTotalNum + calculatedGst).toFixed(2));
    }
  };

  const handleFixGrandTotal = () => {
    setGrandTotalStr(calculatedGrandTotal.toFixed(2));
    setAutoComputeTotal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!employeeName.trim()) {
      newErrors.employeeName = 'Employee name is required';
    }
    if (!clinicName.trim()) {
      newErrors.clinicName = 'Clinic name is required';
    }
    if (subTotalStr === '' || isNaN(subTotalNum) || subTotalNum < 0) {
      newErrors.subTotal = 'Valid Sub-Total is required (>= 0)';
    }
    if (gstStr === '' || isNaN(gstNum) || gstNum < 0) {
      newErrors.gst = 'Valid GST amount is required (>= 0)';
    }
    if (grandTotalStr === '' || isNaN(grandTotalNum) || grandTotalNum < 0) {
      newErrors.grandTotal = 'Valid Grand Total is required (>= 0)';
    }
    if (!illnessSummary.trim()) {
      newErrors.illnessSummary = 'Summary of illness / treatment is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const claimPayload = {
      employeeName: employeeName.trim(),
      clinicName: clinicName.trim(),
      subTotal: Number(subTotalNum.toFixed(2)),
      gst: Number(gstNum.toFixed(2)),
      grandTotal: Number(grandTotalNum.toFixed(2)),
      illnessSummary: illnessSummary.trim(),
      claimDate,
      category,
      receiptNumber: receiptNumber.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (editingClaim && onUpdateClaim) {
      onUpdateClaim(editingClaim.id, claimPayload);
    } else {
      onAddClaim(claimPayload);
      resetForm();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Form Header */}
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Receipt className="w-5 h-5 text-sky-400" />
            {editingClaim ? 'Edit Medical Claim Record' : 'Submit Medical Cost Record'}
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Key in claim details, clinic info, and financial breakdown for verification and export.
          </p>
        </div>
        {editingClaim && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Core Employee & Clinic Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* 1. Name of Employee */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              1. Name of Employee <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => {
                setEmployeeName(e.target.value);
                if (errors.employeeName) setErrors((prev) => ({ ...prev, employeeName: '' }));
              }}
              placeholder="e.g. Sarah Jenkins"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                errors.employeeName
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-white'
              }`}
            />
            {errors.employeeName && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.employeeName}</p>
            )}
          </div>

          {/* 2. Clinic Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              2. Clinic Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => {
                setClinicName(e.target.value);
                if (errors.clinicName) setErrors((prev) => ({ ...prev, clinicName: '' }));
              }}
              placeholder="e.g. Raffles Medical / Silver Cross Clinic"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                errors.clinicName
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-white'
              }`}
            />
            {errors.clinicName && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.clinicName}</p>
            )}
          </div>

          {/* Date of Visit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Date of Consultation
            </label>
            <input
              type="date"
              value={claimDate}
              onChange={(e) => setClaimDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white"
            />
          </div>
        </div>

        {/* Financial Section: Sub-Total, GST, Grand Total */}
        <div className="bg-slate-50/70 p-5 rounded-xl border border-slate-200/90 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-sky-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Financial Cost Breakdown & Tax Audit
              </span>
            </div>

            {/* Auto-compute toggle */}
            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 select-none">
              <input
                type="checkbox"
                checked={autoComputeTotal}
                onChange={(e) => {
                  setAutoComputeTotal(e.target.checked);
                  if (e.target.checked) {
                    setGrandTotalStr(calculatedGrandTotal.toFixed(2));
                  }
                }}
                className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
              />
              <span>Auto-Calculate Grand Total (Sub-Total + GST)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 3. Sub-Total */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                3. Sub-Total ($) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={subTotalStr}
                  onChange={(e) => {
                    setSubTotalStr(e.target.value);
                    if (errors.subTotal) setErrors((prev) => ({ ...prev, subTotal: '' }));
                  }}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 transition ${
                    errors.subTotal
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-white'
                  }`}
                />
              </div>
              {errors.subTotal && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.subTotal}</p>
              )}
            </div>

            {/* 4. GST */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-500" />
                  4. GST ($) <span className="text-rose-500">*</span>
                </label>
                {/* Quick GST rate helpers */}
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span>Quick:</span>
                  <button
                    type="button"
                    onClick={() => applyGstRate(9)}
                    className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 font-medium transition"
                    title="Calculate 9% GST"
                  >
                    9%
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGstRate(0)}
                    className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium transition"
                    title="0% Tax exempt"
                  >
                    0%
                  </button>
                  <button
                    type="button"
                    onClick={() => applyGstRate(5)}
                    className="px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-medium transition"
                    title="5% GST"
                  >
                    5%
                  </button>
                </div>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={gstStr}
                  onChange={(e) => {
                    setGstStr(e.target.value);
                    if (errors.gst) setErrors((prev) => ({ ...prev, gst: '' }));
                  }}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 transition ${
                    errors.gst
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-white'
                  }`}
                />
              </div>
              {errors.gst && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.gst}</p>
              )}
            </div>

            {/* 5. Grand Total */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                  5. Grand Total ($) <span className="text-rose-500">*</span>
                </span>
                {!autoComputeTotal && (
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    Manual Input
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-sm font-semibold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={grandTotalStr}
                  onChange={(e) => {
                    setGrandTotalStr(e.target.value);
                    setAutoComputeTotal(false); // User typed manually
                    if (errors.grandTotal) setErrors((prev) => ({ ...prev, grandTotal: '' }));
                  }}
                  placeholder="0.00"
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-lg border text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 transition ${
                    errors.grandTotal
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                      : hasNumbersEntered && !isAccurate
                      ? 'border-amber-400 bg-amber-50/30 focus:border-amber-500 focus:ring-amber-100'
                      : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-white'
                  }`}
                />
              </div>
              {errors.grandTotal && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.grandTotal}</p>
              )}
            </div>
          </div>

          {/* Audit Verification Result Bar (Feature: Check if Total amount is correct) */}
          {hasNumbersEntered && (
            <div className={`p-3.5 rounded-lg border text-xs transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              isAccurate
                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/90 border-amber-300 text-amber-900'
            }`}>
              <div className="flex items-center gap-2.5">
                {isAccurate ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 animate-pulse" />
                )}
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {isAccurate ? (
                      <span>Arithmetic Verified: Sub-Total + GST = Grand Total</span>
                    ) : (
                      <span>Arithmetic Discrepancy Detected!</span>
                    )}
                  </div>
                  <div className="text-xs opacity-90 mt-0.5">
                    Sub-Total ({formatCurrency(subTotalNum)}) + GST ({formatCurrency(gstNum)}) = <strong className="font-bold underline">{formatCurrency(calculatedGrandTotal)}</strong>.
                    {!isAccurate && (
                      <span className="ml-1">
                        Entered total is {formatCurrency(grandTotalNum)} (difference: {discrepancy > 0 ? `+${formatCurrency(discrepancy)}` : formatCurrency(discrepancy)}).
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {!isAccurate && (
                <button
                  type="button"
                  onClick={handleFixGrandTotal}
                  className="px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition flex items-center gap-1.5 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Fix to {formatCurrency(calculatedGrandTotal)}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 6. Summary of Illness & Category Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              Claim Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
            >
              {CLAIM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                Receipt / Tax Invoice No.
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g. REC-2026-904"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500"
              />
            </div>
          </div>

          {/* 6. Summary of Illness (2 cols wide) */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                6. Summary of Illness / Diagnosis <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowIllnessSuggestions(!showIllnessSuggestions)}
                className="text-xs text-sky-600 hover:text-sky-800 font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-sky-500" />
                {showIllnessSuggestions ? 'Hide Templates' : 'Common Diagnosis Templates'}
              </button>
            </div>

            {/* Quick Templates Drawer */}
            {showIllnessSuggestions && (
              <div className="mb-2 p-2.5 bg-sky-50/70 border border-sky-100 rounded-lg flex flex-wrap gap-1.5 text-xs">
                {COMMON_ILLNESS_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl}
                    type="button"
                    onClick={() => {
                      setIllnessSummary(tmpl);
                      setShowIllnessSuggestions(false);
                      if (errors.illnessSummary) setErrors((prev) => ({ ...prev, illnessSummary: '' }));
                    }}
                    className="px-2 py-1 rounded bg-white hover:bg-sky-100 text-slate-700 border border-slate-200 text-left transition text-[11px]"
                  >
                    + {tmpl}
                  </button>
                ))}
              </div>
            )}

            <textarea
              rows={3}
              value={illnessSummary}
              onChange={(e) => {
                setIllnessSummary(e.target.value);
                if (errors.illnessSummary) setErrors((prev) => ({ ...prev, illnessSummary: '' }));
              }}
              placeholder="e.g. Acute upper respiratory infection with high fever; prescribed paracetamol, antibiotics, and cough syrup"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                errors.illnessSummary
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100 bg-white'
              }`}
            />
            {errors.illnessSummary && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{errors.illnessSummary}</p>
            )}

            {/* Internal Notes optional */}
            <div className="mt-2">
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes: e.g. Accompanied by 2-day Medical Certificate (MC)"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 bg-slate-50/60 focus:outline-none focus:bg-white focus:border-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {editingClaim ? (
              <span>Modifying existing claim record <strong className="font-mono text-slate-700">{editingClaim.id}</strong></span>
            ) : (
              <span>Claims are automatically validated for arithmetic accuracy and stored to session table.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Clear Fields
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold text-sm shadow-sm transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {editingClaim ? 'Save Claim Changes' : 'Add Medical Claim Record'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
