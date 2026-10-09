import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Eye, 
  Download, 
  Copy,
  ChevronDown,
  Building2,
  User,
  Calendar,
  Layers
} from 'lucide-react';
import { 
  MedicalClaim, 
  formatCurrency, 
  isTotalAccurate, 
  getDiscrepancy 
} from '../types/claim';
import { exportClaimsToXLSX, exportClaimsToPDF, exportClaimsToCSV } from '../utils/exportUtils';

interface ClaimsTableProps {
  claims: MedicalClaim[];
  onEditClaim: (claim: MedicalClaim) => void;
  onDeleteClaim: (id: string) => void;
  onDeleteMultipleClaims: (ids: string[]) => void;
  onFixClaim: (id: string) => void;
  onViewVoucher: (claim: MedicalClaim) => void;
  onDuplicateClaim: (claim: MedicalClaim) => void;
}

export const ClaimsTable: React.FC<ClaimsTableProps> = ({
  claims,
  onEditClaim,
  onDeleteClaim,
  onDeleteMultipleClaims,
  onFixClaim,
  onViewVoucher,
  onDuplicateClaim,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'discrepancy'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    claims.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [claims]);

  // Filtered claims
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      // Search text
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        claim.employeeName.toLowerCase().includes(term) ||
        claim.clinicName.toLowerCase().includes(term) ||
        claim.illnessSummary.toLowerCase().includes(term) ||
        claim.id.toLowerCase().includes(term) ||
        (claim.receiptNumber && claim.receiptNumber.toLowerCase().includes(term));

      if (!matchesSearch) return false;

      // Status filter
      const accurate = isTotalAccurate(claim.subTotal, claim.gst, claim.grandTotal);
      if (statusFilter === 'verified' && !accurate) return false;
      if (statusFilter === 'discrepancy' && accurate) return false;

      // Category filter
      if (categoryFilter !== 'all' && claim.category !== categoryFilter) return false;

      return true;
    });
  }, [claims, searchTerm, statusFilter, categoryFilter]);

  // Calculate totals of visible rows
  const visibleSubTotal = filteredClaims.reduce((sum, c) => sum + (Number(c.subTotal) || 0), 0);
  const visibleGst = filteredClaims.reduce((sum, c) => sum + (Number(c.gst) || 0), 0);
  const visibleGrandTotal = filteredClaims.reduce((sum, c) => sum + (Number(c.grandTotal) || 0), 0);

  // Selection helpers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredClaims.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllSelected =
    filteredClaims.length > 0 && selectedIds.length === filteredClaims.length;

  // Exports
  const handleExportXLSX = (targetClaims = claims) => {
    try {
      setIsExporting('xlsx');
      exportClaimsToXLSX(targetClaims);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPDF = (targetClaims = claims) => {
    try {
      setIsExporting('pdf');
      exportClaimsToPDF(targetClaims);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportCSV = (targetClaims = claims) => {
    try {
      setIsExporting('csv');
      exportClaimsToCSV(targetClaims);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsExporting(null);
    }
  };

  const getSelectedClaims = () => {
    return claims.filter((c) => selectedIds.includes(c.id));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Search & Filter */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employee, clinic, illness..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Verification Status Filter */}
          <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({claims.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('verified')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition flex items-center gap-1 ${
                statusFilter === 'verified'
                  ? 'bg-emerald-700 text-white'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('discrepancy')}
              className={`px-2.5 py-1.5 rounded-md font-medium transition flex items-center gap-1 ${
                statusFilter === 'discrepancy'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              Mismatches
            </button>
          </div>

          {/* Category Dropdown */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right: Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selected items notification */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mr-2 bg-sky-50 text-sky-800 px-3 py-1.5 rounded-lg border border-sky-200 text-xs font-medium">
              <span>{selectedIds.length} selected</span>
              <button
                type="button"
                onClick={() => onDeleteMultipleClaims(selectedIds)}
                className="text-rose-600 hover:text-rose-800 ml-1 font-semibold flex items-center gap-1"
                title="Delete Selected Claims"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}

          {/* Download XLSX Button */}
          <button
            type="button"
            onClick={() => handleExportXLSX(selectedIds.length > 0 ? getSelectedClaims() : claims)}
            disabled={claims.length === 0 || isExporting === 'xlsx'}
            className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download formatted Excel workbook (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {isExporting === 'xlsx' ? 'Exporting...' : selectedIds.length > 0 ? 'Export Selected XLSX' : 'Download XLSX'}
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={() => handleExportPDF(selectedIds.length > 0 ? getSelectedClaims() : claims)}
            disabled={claims.length === 0 || isExporting === 'pdf'}
            className="px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download corporate PDF reimbursement report (.pdf)"
          >
            <FileText className="w-4 h-4" />
            {isExporting === 'pdf' ? 'Exporting...' : selectedIds.length > 0 ? 'Export Selected PDF' : 'Download PDF'}
          </button>

          {/* CSV Download */}
          <button
            type="button"
            onClick={() => handleExportCSV(selectedIds.length > 0 ? getSelectedClaims() : claims)}
            disabled={claims.length === 0}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition border border-slate-300 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200">
              <th className="p-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
              </th>
              <th className="p-3 w-28">Ref ID & Date</th>
              <th className="p-3 min-w-[140px]">1. Employee Name</th>
              <th className="p-3 min-w-[150px]">2. Clinic Name</th>
              <th className="p-3 min-w-[240px]">6. Summary of Illness</th>
              <th className="p-3 text-right min-w-[95px]">3. Sub-Total</th>
              <th className="p-3 text-right min-w-[85px]">4. GST</th>
              <th className="p-3 text-right min-w-[105px]">5. Grand Total</th>
              <th className="p-3 text-center min-w-[125px]">Audit Status</th>
              <th className="p-3 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredClaims.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-400">
                  <div className="max-w-sm mx-auto space-y-2">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600">No matching medical claims</p>
                    <p className="text-xs text-slate-400">
                      {claims.length === 0 
                        ? 'Key in your first medical cost claim in the form above to get started.'
                        : 'No claims match your current filter criteria.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredClaims.map((claim, index) => {
                const accurate = isTotalAccurate(claim.subTotal, claim.gst, claim.grandTotal);
                const discrepancy = getDiscrepancy(claim.subTotal, claim.gst, claim.grandTotal);
                const isSelected = selectedIds.includes(claim.id);

                return (
                  <tr
                    key={claim.id}
                    className={`hover:bg-slate-50/80 transition group ${
                      !accurate
                        ? 'bg-amber-50/30'
                        : isSelected
                        ? 'bg-sky-50/40'
                        : index % 2 === 1
                        ? 'bg-slate-50/30'
                        : 'bg-white'
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(claim.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                    </td>

                    {/* ID & Date */}
                    <td className="p-3">
                      <span className="font-mono font-semibold text-slate-800 text-[11px] block">
                        {claim.id}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {claim.claimDate}
                      </span>
                    </td>

                    {/* 1. Employee Name */}
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{claim.employeeName}</span>
                      </div>
                      {claim.category && (
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          {claim.category}
                        </span>
                      )}
                    </td>

                    {/* 2. Clinic Name */}
                    <td className="p-3">
                      <div className="text-slate-800 flex items-start gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-slate-800">{claim.clinicName}</span>
                          {claim.receiptNumber && (
                            <div className="text-[10px] font-mono text-slate-400">
                              Rcpt: #{claim.receiptNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 6. Summary of Illness */}
                    <td className="p-3">
                      <p className="text-slate-700 leading-snug line-clamp-2 max-w-sm">
                        {claim.illnessSummary}
                      </p>
                      {claim.notes && (
                        <p className="text-[10px] text-slate-400 italic mt-0.5">
                          Note: {claim.notes}
                        </p>
                      )}
                    </td>

                    {/* 3. Sub-Total */}
                    <td className="p-3 text-right font-mono font-medium text-slate-700">
                      {formatCurrency(claim.subTotal)}
                    </td>

                    {/* 4. GST */}
                    <td className="p-3 text-right font-mono font-medium text-slate-700">
                      {formatCurrency(claim.gst)}
                    </td>

                    {/* 5. Grand Total */}
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(claim.grandTotal)}
                    </td>

                    {/* Verification / Accuracy Check */}
                    <td className="p-3 text-center">
                      {accurate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3" />
                            Diff {discrepancy > 0 ? `+${formatCurrency(discrepancy)}` : formatCurrency(discrepancy)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onFixClaim(claim.id)}
                            className="text-[10px] text-amber-700 hover:text-amber-900 underline font-medium mt-0.5 flex items-center gap-0.5"
                            title="Set Grand Total to Sub-Total + GST"
                          >
                            <Wrench className="w-2.5 h-2.5" />
                            Auto-Fix
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition">
                        {/* View Voucher */}
                        <button
                          type="button"
                          onClick={() => onViewVoucher(claim)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                          title="View Voucher"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => onDuplicateClaim(claim)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                          title="Duplicate record"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => onEditClaim(claim)}
                          className="p-1 rounded hover:bg-sky-100 text-sky-600 hover:text-sky-800 transition"
                          title="Edit Claim"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => onDeleteClaim(claim.id)}
                          className="p-1 rounded hover:bg-rose-100 text-rose-500 hover:text-rose-700 transition"
                          title="Delete Claim"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Totals Footer */}
          {filteredClaims.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/95 font-semibold text-slate-800 border-t-2 border-slate-300">
                <td colSpan={5} className="p-3.5 text-right font-bold text-xs">
                  Aggregate Totals ({filteredClaims.length} records):
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-xs">
                  {formatCurrency(visibleSubTotal)}
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-slate-900 text-xs">
                  {formatCurrency(visibleGst)}
                </td>
                <td className="p-3.5 text-right font-mono font-bold text-sky-800 text-sm">
                  {formatCurrency(visibleGrandTotal)}
                </td>
                <td className="p-3.5 text-center text-xs">
                  {Math.abs(visibleSubTotal + visibleGst - visibleGrandTotal) < 0.01 ? (
                    <span className="text-emerald-700 font-semibold text-[11px]">✓ Exact Sum</span>
                  ) : (
                    <span className="text-amber-700 font-semibold text-[11px]">⚠ Sum Variance</span>
                  )}
                </td>
                <td className="p-3.5"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
