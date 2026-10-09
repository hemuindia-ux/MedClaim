/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  MedicalClaim, 
  isTotalAccurate, 
  getDiscrepancy 
} from './types/claim';
import { INITIAL_SAMPLE_CLAIMS } from './data/sampleClaims';
import { Header } from './components/Header';
import { ClaimStats } from './components/ClaimStats';
import { ClaimForm } from './components/ClaimForm';
import { ClaimsTable } from './components/ClaimsTable';
import { ClaimDetailModal } from './components/ClaimDetailModal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  FileSpreadsheet, 
  FileText, 
  Calculator,
  HelpCircle,
  X
} from 'lucide-react';

const STORAGE_KEY = 'medclaim_submissions_v2';

export default function App() {
  const [claims, setClaims] = useState<MedicalClaim[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load claims from localStorage', e);
    }
    return INITIAL_SAMPLE_CLAIMS;
  });

  const [editingClaim, setEditingClaim] = useState<MedicalClaim | null>(null);
  const [viewingClaim, setViewingClaim] = useState<MedicalClaim | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formSectionRef = useRef<HTMLDivElement>(null);

  // Sync with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [claims]);

  // Toast timer
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
  };

  // Generate next unique claim reference ID
  const generateNextId = () => {
    const year = new Date().getFullYear();
    const count = claims.length + 1;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `MC-${year}-${String(count).padStart(3, '0')}-${randomSuffix}`;
  };

  // Add new claim
  const handleAddClaim = (newClaimData: Omit<MedicalClaim, 'id' | 'createdAt'>) => {
    const newClaim: MedicalClaim = {
      ...newClaimData,
      id: generateNextId(),
      createdAt: new Date().toISOString(),
    };

    setClaims((prev) => [newClaim, ...prev]);

    const isAccurate = isTotalAccurate(newClaim.subTotal, newClaim.gst, newClaim.grandTotal);
    if (isAccurate) {
      showToast(`Claim ${newClaim.id} added and verified mathematically!`, 'success');
    } else {
      showToast(`Claim ${newClaim.id} added with Grand Total discrepancy noted.`, 'warning');
    }
  };

  // Update existing claim
  const handleUpdateClaim = (id: string, updatedData: Partial<MedicalClaim>) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedData } : c))
    );
    setEditingClaim(null);
    showToast(`Claim ${id} updated successfully!`, 'success');
  };

  // Delete single claim
  const handleDeleteClaim = (id: string) => {
    setClaims((prev) => prev.filter((c) => c.id !== id));
    showToast(`Claim ${id} removed.`, 'info');
  };

  // Delete multiple claims
  const handleDeleteMultiple = (ids: string[]) => {
    setClaims((prev) => prev.filter((c) => !ids.includes(c.id)));
    showToast(`${ids.length} claim(s) removed.`, 'info');
  };

  // Auto-fix single claim discrepancy
  const handleFixClaim = (id: string) => {
    setClaims((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const expected = Math.round((c.subTotal + c.gst) * 100) / 100;
          return { ...c, grandTotal: expected };
        }
        return c;
      })
    );
    showToast(`Grand Total for ${id} corrected to match Sub-Total + GST!`, 'success');
  };

  // Auto-fix all discrepancies in table
  const handleFixAllDiscrepancies = () => {
    let fixCount = 0;
    setClaims((prev) =>
      prev.map((c) => {
        if (!isTotalAccurate(c.subTotal, c.gst, c.grandTotal)) {
          fixCount++;
          const expected = Math.round((c.subTotal + c.gst) * 100) / 100;
          return { ...c, grandTotal: expected };
        }
        return c;
      })
    );
    showToast(`Successfully corrected ${fixCount} claim(s) to match Sub-Total + GST!`, 'success');
  };

  // Duplicate an existing claim for fast repeat entry
  const handleDuplicateClaim = (claim: MedicalClaim) => {
    const duplicated: MedicalClaim = {
      ...claim,
      id: generateNextId(),
      createdAt: new Date().toISOString(),
      receiptNumber: claim.receiptNumber ? `${claim.receiptNumber}-COPY` : undefined,
    };
    setClaims((prev) => [duplicated, ...prev]);
    showToast(`Duplicated record as ${duplicated.id}`, 'info');
  };

  // Load sample dataset
  const handleLoadSamples = () => {
    setClaims(INITIAL_SAMPLE_CLAIMS);
    showToast('Demo medical claims loaded.', 'info');
  };

  // Clear all
  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    setClaims([]);
    setShowClearConfirm(false);
    showToast('All medical claims cleared from table.', 'info');
  };

  // Scroll to form
  const handleScrollToForm = () => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header & Global Actions */}
      <Header
        claims={claims}
        onLoadSamples={handleLoadSamples}
        onClearAll={handleClearAll}
        onScrollToForm={handleScrollToForm}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero & Intro Section */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="max-w-3xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Corporate Expense & Tax Audit Compliant
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              Employee Medical Cost Submission & Expense Audit
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Submit clinic receipts and medical claims with automatic GST and Grand Total verification.
              Export complete claims anytime into <strong className="font-semibold text-slate-800">Microsoft Excel (.xlsx)</strong> spreadsheets or <strong className="font-semibold text-slate-800">Corporate PDF Reports</strong> ready for reimbursement approval.
            </p>

            {/* Required details pills */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="font-medium text-slate-500 py-1">Required Details:</span>
              {[
                '1. Employee Name',
                '2. Clinic Name',
                '3. Sub-Total',
                '4. GST',
                '5. Grand Total (Audit Check)',
                '6. Summary of Illness',
              ].map((item) => (
                <span
                  key={item}
                  className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Background subtle decoration */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-linear-to-l from-sky-50 to-transparent pointer-events-none hidden lg:block" />
        </section>

        {/* Claim Statistics Overview Cards */}
        <section>
          <ClaimStats
            claims={claims}
            onFixAllDiscrepancies={handleFixAllDiscrepancies}
          />
        </section>

        {/* Entry Form Section */}
        <section ref={formSectionRef}>
          <ClaimForm
            onAddClaim={handleAddClaim}
            onUpdateClaim={handleUpdateClaim}
            editingClaim={editingClaim}
            onCancelEdit={() => setEditingClaim(null)}
          />
        </section>

        {/* Data Table Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Submitted Medical Claims Records
              </h3>
              <p className="text-xs text-slate-500">
                All claims stored in your session. Filter, audit, and download into Excel (.xlsx) or PDF.
              </p>
            </div>
          </div>

          <ClaimsTable
            claims={claims}
            onEditClaim={(claim) => {
              setEditingClaim(claim);
              handleScrollToForm();
            }}
            onDeleteClaim={handleDeleteClaim}
            onDeleteMultipleClaims={handleDeleteMultiple}
            onFixClaim={handleFixClaim}
            onViewVoucher={(claim) => setViewingClaim(claim)}
            onDuplicateClaim={handleDuplicateClaim}
          />
        </section>
      </main>

      {/* Claim Detail / Voucher Modal */}
      <ClaimDetailModal
        claim={viewingClaim}
        onClose={() => setViewingClaim(null)}
        onEdit={(claim) => {
          setEditingClaim(claim);
          handleScrollToForm();
        }}
        onFix={handleFixClaim}
      />

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h4 className="text-base font-bold text-slate-900">Clear All Records?</h4>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove all {claims.length} medical claims from the table? This cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearAll}
                className="flex-1 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2.5 max-w-md ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : toastMessage.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-800'
              : 'bg-sky-900 text-white border-sky-800'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />}
            {toastMessage.type === 'info' && <Info className="w-4 h-4 text-sky-300 shrink-0" />}
            <span className="flex-1">{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            MedClaim Portal &copy; {new Date().getFullYear()} &bull; Medical Cost Claims & Tax Reconciliation
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Arithmetic Engine &bull; Sub-Total + GST = Grand Total</span>
            <span>&bull;</span>
            <span>XLSX & PDF Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
