'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { FilterMenu, FilterGroup, FilterValue } from '../components/ui/FilterMenu';
import { useToast } from '../context/ToastContext';
import { usePayment } from '../context/PaymentContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { PaymentSubmission } from '../types';
import { AdminLoginGate } from '../components/AdminLoginGate';
import { SmsConsole } from '../components/admin/SmsConsole';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  Send,
  Eye,
  Check,
  Smartphone,
  FileText,
  RefreshCw,
  History,
  AlertCircle,
  Trash2,
  ExternalLink,
  Users,
  XCircle,
  Copy,
  CheckCheck,
  CheckSquare,
  ArrowLeft,
  Sun,
  Moon,
  Globe,
  LogOut,
  Lock,
  Settings,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  Square,
  ListFilter,
  Download,
  FileSpreadsheet,
  Calendar,
  Layers,
  CircleDollarSign,
  TrendingUp,
  User,
  CreditCard,
} from 'lucide-react';

interface SmsLogItem {
  id: string;
  recipientPhone: string;
  recipientName: string;
  messageText: string;
  sentAt: string;
  status: 'Delivered' | 'Queued' | 'Failed';
  segmentCount: number;
}

interface AdminDashboardViewProps {
  onExitAdmin?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onExitAdmin }) => {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const token =
        sessionStorage.getItem('nazazi_admin_token') ||
        localStorage.getItem('nazazi_admin_token');
      return !!token;
    }
    return false;
  });

  const {
    submissions,
    isLoading,
    connectionInfo,
    fetchRegistrations,
    approvePayment,
    rejectPayment,
    deletePayment,
    resetAllData,
  } = usePayment();

  const { success, info, error } = useToast();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nazazi_admin_token');
      localStorage.removeItem('nazazi_admin_token');
      localStorage.removeItem('nazazi_admin_auth_at');
    }
    setIsAuthenticated(false);
    info('Logged Out', 'Admin console has been locked securely.');
  };

  // 3 Main Purposes Tab Selection
  const [activeTab, setActiveTab] = useState<'approvals' | 'send_sms' | 'logs'>('approvals');

  // Search & Filter for Approvals
  const [paymentSearch, setPaymentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterValue, setFilterValue] = useState<FilterValue>({});
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const [previewSubmission, setPreviewSubmission] = useState<PaymentSubmission | null>(null);

  useEffect(() => {
    const handleClickOutsideFilter = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
    };
    if (isFilterMenuOpen) {
      document.addEventListener('mousedown', handleClickOutsideFilter);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideFilter);
    };
  }, [isFilterMenuOpen]);

  // Pagination for Registrations
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Selection Mode (shows modern select boxes only when activated or when items are selected)
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Single Item Delete Confirmation Modal
  const [itemToDelete, setItemToDelete] = useState<PaymentSubmission | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // Batch Selection & Batch Delete State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Reset Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Export Loading States
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Copy Approved Phone Numbers State & Spacing Formats
  const [isCopyApprovedModalOpen, setIsCopyApprovedModalOpen] = useState(false);
  const [copyFormat, setCopyFormat] = useState<
    'ordered_spaced' | 'ordered_extra_spaced' | 'ordered_with_name' | 'ordered_compact' | 'comma'
  >('ordered_spaced');
  const [hasCopiedApproved, setHasCopiedApproved] = useState(false);

  // PDF Export Dropdown State
  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);
  const pdfDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutsidePdf = (event: MouseEvent) => {
      if (pdfDropdownRef.current && !pdfDropdownRef.current.contains(event.target as Node)) {
        setIsPdfDropdownOpen(false);
      }
    };
    if (isPdfDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutsidePdf);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsidePdf);
    };
  }, [isPdfDropdownOpen]);

  // SMS target phone selection state
  const [selectedSmsPhone, setSelectedSmsPhone] = useState<string>('');

  // Settings Menu Popover State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen]);

  // SMS Sent History Logs
  const [smsLogs, setSmsLogs] = useState<SmsLogItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('nazazi_sms_logs');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // Auto-sync registrations on mount
  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nazazi_sms_logs', JSON.stringify(smsLogs));
    }
  }, [smsLogs]);

  // Derived counts & revenue statistics
  const approvedSubmissions = submissions.filter((s) => s.status === 'approved');
  const pendingCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedCount = approvedSubmissions.length;
  const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;

  const totalCollectedRevenue = approvedSubmissions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
  const totalPotentialRevenue = submissions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  // Grouped Filters definition for FilterMenu
  const filterGroups: FilterGroup[] = useMemo(() => {
    // Dynamic plan extraction
    const planCounts = new Map<string, number>();
    submissions.forEach((s) => {
      const p = s.planName || 'Standard';
      planCounts.set(p, (planCounts.get(p) || 0) + 1);
    });

    const planOptions = Array.from(planCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([plan, count]) => ({
        id: plan,
        label: `${plan} (${count})`,
      }));

    // Method counts
    const telebirrCount = submissions.filter((s) => (s.bank || '').toLowerCase().includes('telebirr')).length;
    const cbeCount = submissions.filter((s) => (s.bank || '').toLowerCase().includes('cbe')).length;
    const otherBankCount = submissions.length - telebirrCount - cbeCount;

    // Verification counts
    const verifyEtCount = submissions.filter((s) => s.verificationMethod === 'verify_et').length;
    const manualCount = submissions.filter((s) => s.verificationMethod === 'manual' || (!s.verificationMethod && !s.verifiedAt)).length;
    const withScreenshotCount = submissions.filter((s) => !!s.screenshotUrl).length;

    return [
      {
        id: 'status',
        label: 'Status',
        chipPrefix: 'Status: ',
        options: [
          { id: 'pending', label: `Pending Review (${pendingCount})` },
          { id: 'approved', label: `Approved (${approvedCount})` },
          { id: 'rejected', label: `Rejected (${rejectedCount})` },
        ],
      },
      {
        id: 'bank',
        label: 'Payment Method',
        chipPrefix: 'Method: ',
        options: [
          { id: 'telebirr', label: `Telebirr (${telebirrCount})` },
          { id: 'cbe', label: `Commercial Bank (${cbeCount})` },
          ...(otherBankCount > 0 ? [{ id: 'other', label: `Other / Direct (${otherBankCount})` }] : []),
        ],
      },
      ...(planOptions.length > 0
        ? [
            {
              id: 'plan',
              label: 'Subscription Plan',
              chipPrefix: 'Plan: ',
              options: planOptions,
            },
          ]
        : []),
      {
        id: 'verification',
        label: 'Verification Type',
        chipPrefix: 'Verify: ',
        options: [
          { id: 'verify_et', label: `Verify.et Auto (${verifyEtCount})` },
          { id: 'manual', label: `Manual Review (${manualCount})` },
          { id: 'screenshot', label: `With Receipt (${withScreenshotCount})` },
        ],
      },
    ];
  }, [submissions, pendingCount, approvedCount, rejectedCount]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filterValue).reduce((acc, curr) => acc + (Array.isArray(curr) ? curr.length : 0), 0);
  }, [filterValue]);

  // Filtered Payments for table with multi-faceted grouping
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const query = paymentSearch.toLowerCase().trim();
      const matchesSearch =
        !query ||
        sub.userName.toLowerCase().includes(query) ||
        sub.userPhone.toLowerCase().includes(query) ||
        sub.planName.toLowerCase().includes(query) ||
        (sub.transactionId && sub.transactionId.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Group 1: Status (FilterMenu takes precedence; falls back to statusFilter pill)
      const pickedStatus = filterValue.status || [];
      if (pickedStatus.length > 0) {
        if (!pickedStatus.includes(sub.status)) return false;
      } else if (statusFilter !== 'all') {
        if (sub.status !== statusFilter) return false;
      }

      // Group 2: Bank / Method
      const pickedBanks = filterValue.bank || [];
      if (pickedBanks.length > 0) {
        const bankStr = (sub.bank || '').toLowerCase();
        const matchesBank = pickedBanks.some((b) => {
          if (b === 'telebirr') return bankStr.includes('telebirr');
          if (b === 'cbe') return bankStr.includes('cbe');
          if (b === 'other') return !bankStr.includes('telebirr') && !bankStr.includes('cbe');
          return false;
        });
        if (!matchesBank) return false;
      }

      // Group 3: Plan
      const pickedPlans = filterValue.plan || [];
      if (pickedPlans.length > 0 && !pickedPlans.includes(sub.planName)) {
        return false;
      }

      // Group 4: Verification
      const pickedVerification = filterValue.verification || [];
      if (pickedVerification.length > 0) {
        const matchesVerif = pickedVerification.some((v) => {
          if (v === 'verify_et') return sub.verificationMethod === 'verify_et';
          if (v === 'manual') return sub.verificationMethod === 'manual' || !sub.verificationMethod;
          if (v === 'screenshot') return Boolean(sub.screenshotUrl);
          return false;
        });
        if (!matchesVerif) return false;
      }

      return true;
    });
  }, [submissions, paymentSearch, filterValue, statusFilter]);

  // Reset to page 1 if query or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [paymentSearch, statusFilter, filterValue, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredSubmissions.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredSubmissions.length);
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  const handleConfirmSingleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeletingItem(true);
    try {
      await deletePayment(itemToDelete.id, itemToDelete.userPhone);
      setSelectedIds((prev) => prev.filter((id) => id !== itemToDelete.id));
      success('Record Deleted', `Removed ${itemToDelete.userName} (${itemToDelete.userPhone})`);
      if (previewSubmission?.id === itemToDelete.id) {
        setPreviewSubmission(null);
      }
      setItemToDelete(null);
    } catch {
      error('Delete Failed', 'Could not delete the record. Please try again.');
    } finally {
      setIsDeletingItem(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (next.length === 0) {
        setIsSelectionMode(false);
      } else {
        setIsSelectionMode(true);
      }
      return next;
    });
  };

  const handleSelectPage = () => {
    const pageIds = paginatedSubmissions.map((s) => s.id);
    const allPageSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allPageSelected) {
      const next = selectedIds.filter((id) => !pageIds.includes(id));
      setSelectedIds(next);
      if (next.length === 0) setIsSelectionMode(false);
    } else {
      setIsSelectionMode(true);
      const combined = Array.from(new Set([...selectedIds, ...pageIds]));
      setSelectedIds(combined);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSubmissions.length && filteredSubmissions.length > 0) {
      setSelectedIds([]);
      setIsSelectionMode(false);
    } else {
      setIsSelectionMode(true);
      setSelectedIds(filteredSubmissions.map((s) => s.id));
    }
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBatchDeleting(true);
    try {
      const targets = submissions.filter((s) => selectedIds.includes(s.id));
      for (const sub of targets) {
        await deletePayment(sub.id, sub.userPhone);
      }
      success('Batch Deleted', `Permanently deleted ${selectedIds.length} registration(s).`);
      setSelectedIds([]);
      setShowBatchDeleteModal(false);
    } catch {
      error('Batch Delete Failed', 'Could not delete all selected items.');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Export to CSV with full registration information
  const exportToCSV = () => {
    if (filteredSubmissions.length === 0) {
      info('No Data to Export', 'There are no registered users matching your filter.');
      return;
    }

    setIsExportingCsv(true);
    try {
      const headers = [
        '#',
        'Registration ID',
        'Full Name',
        'Phone Number',
        'Email Address',
        'Plan Tier',
        'Amount (ETB)',
        'Currency',
        'Payer Name',
        'Transaction ID',
        'Status',
        'Registration Date',
        'Registration Time',
        'Receipt Screenshot URL',
        'Notes',
      ];

      const rows = filteredSubmissions.map((sub, index) => {
        const subDate = new Date(sub.submittedAt);
        const formattedDate = !isNaN(subDate.getTime()) ? subDate.toLocaleDateString() : 'N/A';
        const formattedTime = !isNaN(subDate.getTime()) ? subDate.toLocaleTimeString() : 'N/A';

        return [
          index + 1,
          `"${(sub.id || '').replace(/"/g, '""')}"`,
          `"${(sub.userName || '').replace(/"/g, '""')}"`,
          `"${(sub.userPhone || '').replace(/"/g, '""')}"`,
          `"${(sub.userEmail || '').replace(/"/g, '""')}"`,
          `"${(sub.planName || '').replace(/"/g, '""')}"`,
          sub.amount || 0,
          `"${(sub.currency || 'ETB').replace(/"/g, '""')}"`,
          `"${(sub.payerName || '').replace(/"/g, '""')}"`,
          `"${(sub.transactionId || '').replace(/"/g, '""')}"`,
          `"${(sub.status || '').toUpperCase()}"`,
          `"${formattedDate}"`,
          `"${formattedTime}"`,
          `"${(sub.screenshotUrl || '').replace(/"/g, '""')}"`,
          `"${(sub.notes || '').replace(/"/g, '""')}"`,
        ];
      });

      // UTF-8 BOM for spreadsheet application compatibility with Amharic / Ethiopian names
      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateSlug = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `nazazi_registered_users_${statusFilter}_${dateSlug}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      success('CSV Exported', `Successfully exported ${filteredSubmissions.length} user record(s) to CSV.`);
    } catch (err) {
      console.error('CSV Export Error:', err);
      error('Export Error', 'Failed to generate CSV export file.');
    } finally {
      setIsExportingCsv(false);
    }
  };

  // Export to PDF with professional summary report and table
  const exportToPDF = async () => {
    if (filteredSubmissions.length === 0) {
      info('No Data to Export', 'There are no registered users matching your filter.');
      return;
    }

    setIsExportingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Header Banner
      doc.setFillColor(24, 24, 27); // #18181b
      doc.rect(0, 0, 210, 24, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('NAZAZI SPIRITUAL SMS SERVICE', 14, 11);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(212, 212, 216);
      doc.text('Registered Users Master Report & Subscriptions List', 14, 18);

      // Meta details block
      const exportDate = new Date().toLocaleString();
      const totalAmount = filteredSubmissions.reduce((sum, s) => sum + (s.amount || 0), 0);
      const approvedTotal = filteredSubmissions.filter((s) => s.status === 'approved').length;
      const pendingTotal = filteredSubmissions.filter((s) => s.status === 'pending').length;
      const rejectedTotal = filteredSubmissions.filter((s) => s.status === 'rejected').length;

      doc.setTextColor(60, 60, 65);
      doc.setFontSize(8);
      doc.text(`Generated: ${exportDate}`, 14, 30);
      doc.text(`Status Filter: ${statusFilter.toUpperCase()}`, 14, 34.5);
      doc.text(
        `Total Records: ${filteredSubmissions.length} (${approvedTotal} Approved, ${pendingTotal} Pending, ${rejectedTotal} Rejected)`,
        14,
        39
      );

      doc.text(`Total Subscription Value: ${totalAmount.toLocaleString()} ETB`, 122, 30);
      doc.text(`Admin System: Nazazi SMS Portal`, 122, 34.5);

      // Subtle Divider
      doc.setDrawColor(225, 225, 230);
      doc.line(14, 43, 196, 43);

      const tableData = filteredSubmissions.map((sub, idx) => {
        const subDate = new Date(sub.submittedAt);
        const dateStr = !isNaN(subDate.getTime()) ? subDate.toLocaleDateString() : 'N/A';
        return [
          idx + 1,
          sub.userName || 'N/A',
          sub.userPhone || 'N/A',
          sub.planName || '1 Month Access',
          `${Number(sub.amount || 0).toLocaleString()} ETB`,
          (sub.status || 'PENDING').toUpperCase(),
          dateStr,
        ];
      });

      autoTable(doc, {
        startY: 46,
        head: [['#', 'Member Name', 'Phone Number', 'Plan Tier', 'Amount', 'Status', 'Date']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [39, 39, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
          halign: 'left',
        },
        styles: {
          fontSize: 7.5,
          cellPadding: 2.5,
          valign: 'middle',
          overflow: 'linebreak',
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 },
          1: { cellWidth: 42, fontStyle: 'bold' },
          2: { cellWidth: 32 },
          3: { cellWidth: 38 },
          4: { cellWidth: 22, halign: 'right' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 22, halign: 'center' },
        },
        alternateRowStyles: {
          fillColor: [248, 248, 250],
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5) {
            const status = String(data.cell.raw).toUpperCase();
            if (status === 'APPROVED') {
              data.cell.styles.textColor = [16, 149, 106];
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'PENDING') {
              data.cell.styles.textColor = [217, 119, 6];
              data.cell.styles.fontStyle = 'bold';
            } else if (status === 'REJECTED') {
              data.cell.styles.textColor = [225, 29, 72];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        foot: [
          [
            '',
            `Total: ${filteredSubmissions.length} user(s)`,
            '',
            '',
            `${totalAmount.toLocaleString()} ETB`,
            '',
            '',
          ],
        ],
        footStyles: {
          fillColor: [240, 240, 243],
          textColor: [24, 24, 27],
          fontStyle: 'bold',
          fontSize: 8,
        },
      });

      // Add footer to each page
      const totalDocPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalDocPages; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(140, 140, 145);
        doc.text(
          `Nazazi Spiritual Services | Confidential Admin Report | Page ${i} of ${totalDocPages}`,
          14,
          290
        );
      }

      const dateSlug = new Date().toISOString().split('T')[0];
      doc.save(`nazazi_registered_users_${statusFilter}_${dateSlug}.pdf`);
      success('PDF Exported', `Generated PDF report with ${filteredSubmissions.length} user record(s).`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      error('Export Error', 'Failed to generate PDF document.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Normalize phone numbers for consistent export and copying
  const formatPhoneForList = (phone: string): string => {
    if (!phone) return '';
    const trimmed = phone.trim();
    let cleaned = trimmed.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+251')) {
      cleaned = '0' + cleaned.slice(4);
    } else if (cleaned.startsWith('251')) {
      cleaned = '0' + cleaned.slice(3);
    }
    return cleaned || trimmed;
  };

  // Generate formatted text with order numbers in front and plenty space between them
  const getFormattedApprovedText = (format = copyFormat): string => {
    if (approvedSubmissions.length === 0) return '';

    switch (format) {
      case 'ordered_spaced':
        // Primary requested format: Order number in front, plenty of space (empty line) between phone numbers
        return approvedSubmissions
          .map((sub, idx) => `${idx + 1}. ${formatPhoneForList(sub.userPhone)}`)
          .join('\n\n');

      case 'ordered_extra_spaced':
        // Extra generous spacing (2 blank lines between entries)
        return approvedSubmissions
          .map((sub, idx) => `${idx + 1}. ${formatPhoneForList(sub.userPhone)}`)
          .join('\n\n\n');

      case 'ordered_with_name':
        // Ordered with member name & plan with blank line separation
        return approvedSubmissions
          .map(
            (sub, idx) =>
              `${idx + 1}. ${sub.userName || 'Subscriber'} — ${formatPhoneForList(sub.userPhone)} (${sub.planName || 'Standard'})`
          )
          .join('\n\n');

      case 'ordered_compact':
        // Single line break
        return approvedSubmissions
          .map((sub, idx) => `${idx + 1}. ${formatPhoneForList(sub.userPhone)}`)
          .join('\n');

      case 'comma':
        // Comma separated list for bulk gateways
        return approvedSubmissions
          .map((sub) => formatPhoneForList(sub.userPhone))
          .join(', ');

      default:
        return approvedSubmissions
          .map((sub, idx) => `${idx + 1}. ${formatPhoneForList(sub.userPhone)}`)
          .join('\n\n');
    }
  };

  const executeCopyApprovedToClipboard = async (
    customFormat?: 'ordered_spaced' | 'ordered_extra_spaced' | 'ordered_with_name' | 'ordered_compact' | 'comma'
  ) => {
    if (approvedSubmissions.length === 0) {
      info('No Approved Users', 'There are no approved users to copy.');
      return;
    }
    const textToCopy = getFormattedApprovedText(customFormat || copyFormat);
    let isCopied = false;

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        isCopied = true;
      } catch {
        isCopied = false;
      }
    }

    if (!isCopied && typeof document !== 'undefined') {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        isCopied = document.execCommand('copy');
        document.body.removeChild(textarea);
      } catch {
        isCopied = false;
      }
    }

    if (isCopied) {
      setHasCopiedApproved(true);
      setTimeout(() => setHasCopiedApproved(false), 2500);
      success(
        'Copied to Clipboard!',
        `Copied ${approvedSubmissions.length} approved phone numbers with ordering (#) and plenty of space.`
      );
    } else {
      error('Copy Failed', 'Please select and copy manually from the preview box.');
    }
  };

  // Export dedicated PDF directory of only approved phone numbers & subscribers
  const exportApprovedPhonesPDF = async () => {
    if (approvedSubmissions.length === 0) {
      info('No Approved Users', 'There are no approved users to export.');
      return;
    }

    setIsExportingPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Dark sleek header banner
      doc.setFillColor(24, 24, 27); // #18181b
      doc.rect(0, 0, 210, 26, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('NAZAZI - APPROVED SUBSCRIBERS DIRECTORY', 14, 11);

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(212, 212, 216);
      doc.text('Verified Contact Directory & Active Subscribers for SMS Dispatch', 14, 18);

      // Meta details block
      const exportDate = new Date().toLocaleString();
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text(`Generated: ${exportDate}`, 14, 33);
      doc.text(`Total Approved Contacts: ${approvedSubmissions.length}`, 14, 38);

      const tableRows = approvedSubmissions.map((sub, index) => [
        String(index + 1),
        sub.userName || 'Subscriber',
        formatPhoneForList(sub.userPhone),
        sub.planName || 'Standard',
        sub.amount ? `${sub.amount} ETB` : '-',
        sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : 'Approved',
      ]);

      autoTable(doc, {
        startY: 43,
        head: [['#', 'Subscriber Name', 'Phone Number', 'Plan', 'Amount', 'Date']],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [24, 24, 27],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8.5,
          halign: 'left',
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 55 },
          2: { cellWidth: 42, fontStyle: 'bold' },
          3: { cellWidth: 42 },
          4: { cellWidth: 20, halign: 'right' },
          5: { cellWidth: 21, halign: 'center', fontSize: 7.5 },
        },
        styles: {
          fontSize: 8,
          cellPadding: 2.8,
          textColor: [39, 39, 42],
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
      });

      const dateSlug = new Date().toISOString().split('T')[0];
      doc.save(`nazazi_approved_phones_${dateSlug}.pdf`);
      success('Approved Phones PDF Exported', `Generated PDF directory with ${approvedSubmissions.length} approved phone numbers.`);
    } catch (err) {
      console.error('Approved PDF Export Error:', err);
      error('Export Error', 'Failed to generate approved phones PDF document.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExecuteReset = async () => {
    setIsResetting(true);
    try {
      await resetAllData();
      setSmsLogs([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('nazazi_sms_logs');
      }
      setShowResetModal(false);
      success('Reset Complete', 'All registrations, submissions, and SMS logs have been cleared.');
    } catch {
      error('Reset Error', 'Failed to complete reset.');
    } finally {
      setIsResetting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AdminLoginGate
        onSuccess={() => {
          setIsAuthenticated(true);
          success('Welcome Admin', 'Authenticated successfully.');
          fetchRegistrations();
        }}
        onCancel={() => {
          if (onExitAdmin) {
            onExitAdmin();
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* 1. Header Bar with Settings Popover */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-dashed border-[#DDD7CF] dark:border-[#2C2825]">
        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-[#24211F] dark:text-[#FAF8F5] leading-tight">
            Nazazi Admin
          </h1>
        </div>

        <div className="flex items-center gap-2">

          {/* Settings Menu Popover */}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-[5px] border transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-2xs ${
                isSettingsOpen
                  ? 'bg-[#981C00] text-white border-[#981C00]'
                  : 'bg-white dark:bg-[#181615] text-[#24211F] dark:text-[#FAF8F5] border-[#E8E4DF] dark:border-[#2C2825] hover:bg-[#FAF8F5] dark:hover:bg-[#201D1B]'
              }`}
              title="Admin Settings & Actions"
            >
              {isSettingsOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Settings className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90 text-[#706A65]" />
              )}
              <span className="hidden sm:inline">Settings</span>
            </button>

            <AnimatePresence>
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-72 sm:w-80 rounded-[5px] bg-white dark:bg-[#181615] border border-[#E8E4DF] dark:border-[#2C2825] shadow-2xl p-2.5 z-50 space-y-1 divide-y divide-[#E8E4DF]/60 dark:divide-[#2C2825]/60"
                >
                  {/* Popover Header */}
                  <div className="pb-2 px-2.5 flex items-center justify-between text-[11px] font-bold text-[#706A65] dark:text-[#A8A19A] uppercase tracking-wider">
                    <span>Admin Settings</span>
                    <Settings className="w-3.5 h-3.5" />
                  </div>

                  <div className="pt-2 space-y-1">
                    {/* Public Site Return Option */}
                    {onExitAdmin && (
                      <button
                        onClick={() => {
                          setIsSettingsOpen(false);
                          onExitAdmin();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-[5px] hover:bg-[#FAF8F5] dark:hover:bg-[#201D1B] transition-colors cursor-pointer text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-[5px] bg-[#FAF8F5] dark:bg-[#221F1D] text-[#24211F] dark:text-[#FAF8F5] flex items-center justify-center font-bold text-sm border border-[#E8E4DF] dark:border-[#2C2825]">
                            <ArrowLeft className="w-4 h-4 text-[#706A65] dark:text-[#A8A19A]" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[#24211F] dark:text-[#FAF8F5]">
                              Public Site
                            </p>
                            <p className="text-[11px] text-[#706A65] dark:text-[#A8A19A]">
                              Return to public website
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#706A65] group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}

                    {/* 1. Language Switcher */}
                    <button
                      onClick={() => {
                        toggleLanguage();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-[5px] hover:bg-[#FAF8F5] dark:hover:bg-[#201D1B] transition-colors cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[5px] bg-[#FAF8F5] dark:bg-[#221F1D] text-[#24211F] dark:text-[#FAF8F5] flex items-center justify-center font-bold text-sm border border-[#E8E4DF] dark:border-[#2C2825]">
                          <Globe className="w-4 h-4 text-[#706A65] dark:text-[#A8A19A]" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#24211F] dark:text-[#FAF8F5]">
                            {language === 'en' ? 'Language Switcher' : 'ቋንቋ ቀይር'}
                          </p>
                          <p className="text-[11px] text-[#706A65] dark:text-[#A8A19A]">
                            {language === 'en' ? '🇺🇸 English (Switch to አማርኛ)' : '🇪🇹 አማርኛ (Switch to English)'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#706A65] uppercase px-2 py-0.5 rounded-[5px] bg-[#FAF8F5] dark:bg-[#221F1D] border border-[#E8E4DF] dark:border-[#2C2825]">
                        {language.toUpperCase()}
                      </span>
                    </button>

                    {/* 2. Theme Changer */}
                    <button
                      onClick={() => {
                        toggleTheme();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-[5px] hover:bg-[#FAF8F5] dark:hover:bg-[#201D1B] transition-colors cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[5px] bg-[#FAF8F5] dark:bg-[#221F1D] text-[#24211F] dark:text-[#FAF8F5] flex items-center justify-center font-bold text-sm border border-[#E8E4DF] dark:border-[#2C2825]">
                          {theme === 'dark' ? (
                            <Moon className="w-4 h-4 text-[#E89382]" />
                          ) : (
                            <Sun className="w-4 h-4 text-[#981C00]" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#24211F] dark:text-[#FAF8F5]">
                            {language === 'en' ? 'Theme Changer' : 'ገጽታ ቀይር'}
                          </p>
                          <p className="text-[11px] text-[#706A65] dark:text-[#A8A19A]">
                            {theme === 'dark' ? 'Dark Mode (Switch to Light)' : 'Light Mode (Switch to Dark)'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#706A65] capitalize px-2 py-0.5 rounded-[5px] bg-[#FAF8F5] dark:bg-[#221F1D] border border-[#E8E4DF] dark:border-[#2C2825]">
                        {theme}
                      </span>
                    </button>

                    {/* 3. Sync Database */}
                    <button
                      onClick={() => {
                        fetchRegistrations();
                        info('Refreshed', 'Synced latest registrations from Supabase.');
                        setIsSettingsOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-[5px] hover:bg-[#FAF8F5] dark:hover:bg-[#201D1B] transition-colors cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[5px] bg-[#FAF8F5] dark:bg-[#221F1D] text-[#24211F] dark:text-[#FAF8F5] flex items-center justify-center font-bold text-sm border border-[#E8E4DF] dark:border-[#2C2825]">
                          <RefreshCw className={`w-4 h-4 text-[#706A65] dark:text-[#A8A19A] ${isLoading ? 'animate-spin' : ''}`} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#24211F] dark:text-[#FAF8F5]">
                            Sync Database
                          </p>
                          <p className="text-[11px] text-[#706A65] dark:text-[#A8A19A]">
                            Refresh registrations from database
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#706A65] group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* 4. Clear Data */}
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        setShowResetModal(true);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-[5px] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[5px] bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-sm border border-rose-200 dark:border-rose-900/50">
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">
                            Clear Data
                          </p>
                          <p className="text-[11px] text-rose-500/80 dark:text-rose-400/80">
                            Reset all registrations & logs
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* 5. Lock Console */}
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-[5px] hover:bg-[#FAF8F5] dark:hover:bg-[#201D1B] transition-colors cursor-pointer text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[5px] bg-[#981C00] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#24211F] dark:text-[#FAF8F5]">
                            Lock Console
                          </p>
                          <p className="text-[11px] text-[#706A65] dark:text-[#A8A19A]">
                            Securely lock admin session
                          </p>
                        </div>
                      </div>
                      <LogOut className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards - Clean, Type-First App-Screen Layout */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => {
            setActiveTab('approvals');
            setStatusFilter('pending');
            setFilterValue({ status: ['pending'] });
          }}
          className={`p-4 sm:p-5 rounded-[5px] border transition-all cursor-pointer bg-white dark:bg-[#181615] ${
            activeTab === 'approvals' && (statusFilter === 'pending' || (filterValue.status?.includes('pending') && filterValue.status.length === 1))
              ? 'border-[#981C00] dark:border-[#C43214] ring-1 ring-[#981C00]/30 shadow-xs'
              : 'border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#981C00]/40 dark:hover:border-[#C43214]/40 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#706A65] dark:text-[#A8A19A]">
              Pending Approvals
            </span>
            {pendingCount > 0 && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[5px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Action
              </span>
            )}
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#24211F] dark:text-[#FAF8F5] mt-2.5">
            {pendingCount}
          </p>
          <p className="text-[11px] text-[#706A65] dark:text-[#A8A19A] mt-1 truncate">
            Requires verification
          </p>
        </div>

        <div
          onClick={() => {
            setActiveTab('send_sms');
          }}
          className={`p-4 sm:p-5 rounded-[5px] border transition-all cursor-pointer bg-white dark:bg-[#181615] ${
            activeTab === 'send_sms'
              ? 'border-[#981C00] dark:border-[#C43214] ring-1 ring-[#981C00]/30 shadow-xs'
              : 'border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#981C00]/40 dark:hover:border-[#C43214]/40 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#706A65] dark:text-[#A8A19A]">
              Approved Members
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[5px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#24211F] dark:text-[#FAF8F5] mt-2.5">
            {approvedCount}
          </p>
          <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-dashed border-[#DDD7CF] dark:border-[#2C2825] text-[11px]">
            <span className="text-[#706A65] dark:text-[#A8A19A] truncate">Ready for SMS</span>
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => executeCopyApprovedToClipboard('ordered_spaced')}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] bg-[#FAF4F2] hover:bg-[#F3E6E2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#E89382] font-semibold text-[10px] transition-colors cursor-pointer border border-[#E8DCD9] dark:border-[#3A2420]"
                title="Quick copy ordered phone list (1. 09...)"
              >
                <Copy className="w-3 h-3" />
                <span>{hasCopiedApproved ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab('approvals');
            setStatusFilter('approved');
            setFilterValue({ status: ['approved'] });
          }}
          className={`p-4 sm:p-5 rounded-[5px] border transition-all cursor-pointer bg-white dark:bg-[#181615] ${
            activeTab === 'approvals' && (statusFilter === 'approved' || (filterValue.status?.includes('approved') && filterValue.status.length === 1))
              ? 'border-[#981C00] dark:border-[#C43214] ring-1 ring-[#981C00]/30 shadow-xs'
              : 'border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#981C00]/40 dark:hover:border-[#C43214]/40 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#706A65] dark:text-[#A8A19A]">
              Verified Revenue
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[5px] bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#E89382] border border-[#E8DCD9] dark:border-[#3A2420]">
              ETB
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#24211F] dark:text-[#FAF8F5] mt-2.5 truncate">
            {totalCollectedRevenue.toLocaleString()}
          </p>
          <p className="text-[11px] text-[#706A65] dark:text-[#A8A19A] mt-1 truncate">
            Total collected
          </p>
        </div>

        <div
          onClick={() => setActiveTab('logs')}
          className={`p-4 sm:p-5 rounded-[5px] border transition-all cursor-pointer bg-white dark:bg-[#181615] ${
            activeTab === 'logs'
              ? 'border-[#981C00] dark:border-[#C43214] ring-1 ring-[#981C00]/30 shadow-xs'
              : 'border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#981C00]/40 dark:hover:border-[#C43214]/40 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#706A65] dark:text-[#A8A19A]">
              Dispatched SMS
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[5px] bg-[#FAF8F5] dark:bg-[#221F1D] text-[#706A65] dark:text-[#A8A19A] border border-[#E8E4DF] dark:border-[#2C2825]">
              Logs
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#24211F] dark:text-[#FAF8F5] mt-2.5">
            {smsLogs.length}
          </p>
          <p className="text-[11px] text-[#706A65] dark:text-[#A8A19A] mt-1 truncate">
            Audit history
          </p>
        </div>
      </div>

      {/* 3. Purpose Tab Navigation - Clean Segmented Pill */}
      <div className="w-full overflow-x-auto pb-0.5 no-scrollbar">
        <div className="inline-flex items-center gap-1 p-1 bg-[#F3EFEA] dark:bg-[#1E1B19] rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825] min-w-max">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'approvals'
                ? 'bg-white dark:bg-[#141211] text-[#24211F] dark:text-[#FAF8F5] shadow-xs'
                : 'text-[#706A65] hover:text-[#24211F] dark:text-[#A8A19A] dark:hover:text-[#FAF8F5]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#981C00] dark:text-[#E89382]" />
            <span>Approvals</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-[#981C00] text-white text-[10px] font-bold rounded-[5px]">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('send_sms')}
            className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'send_sms'
                ? 'bg-white dark:bg-[#141211] text-[#24211F] dark:text-[#FAF8F5] shadow-xs'
                : 'text-[#706A65] hover:text-[#24211F] dark:text-[#A8A19A] dark:hover:text-[#FAF8F5]'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-[#706A65] dark:text-[#A8A19A]" />
            <span>SMS Console</span>
            <span className="px-1.5 py-0.2 bg-[#E8E4DF] dark:bg-[#2C2825] text-[#24211F] dark:text-[#FAF8F5] text-[10px] font-bold rounded-[5px]">
              {approvedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-[5px] text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-white dark:bg-[#141211] text-[#24211F] dark:text-[#FAF8F5] shadow-xs'
                : 'text-[#706A65] hover:text-[#24211F] dark:text-[#A8A19A] dark:hover:text-[#FAF8F5]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#706A65] dark:text-[#A8A19A]" />
            <span>Audit Logs</span>
            <span className="px-1.5 py-0.2 bg-[#E8E4DF] dark:bg-[#2C2825] text-[#24211F] dark:text-[#FAF8F5] text-[10px] font-bold rounded-[5px]">
              {smsLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PURPOSE 1: PAYMENT APPROVALS */}
      {/* ========================================================================= */}
      {activeTab === 'approvals' && (
        <Card className="p-4 sm:p-6 space-y-4 sm:space-y-5 border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] rounded-[5px] shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E4DF] dark:border-[#2C2825]">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#24211F] dark:text-[#FAF8F5] tracking-tight">
                Payment Approvals
              </h2>
              <p className="text-xs text-[#706A65] dark:text-[#A8A29D] mt-0.5">
                Verify member payments, approve subscriptions, and manage verified directories.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="inline-flex items-center gap-1 p-1 bg-[#F3EFEA] dark:bg-[#1E1B19] rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825] text-xs font-medium overflow-x-auto no-scrollbar">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setFilterValue((prev) => {
                    const next = { ...prev };
                    delete next.status;
                    return next;
                  });
                }}
                className={`px-2.5 py-1 rounded-[5px] transition-all cursor-pointer whitespace-nowrap text-xs font-semibold ${
                  statusFilter === 'all' && (!filterValue.status || filterValue.status.length === 0)
                    ? 'bg-white dark:bg-[#2A2624] text-[#24211F] dark:text-[#FAF8F5] shadow-2xs'
                    : 'text-[#706A65] dark:text-[#A8A29D] hover:text-[#24211F] dark:hover:text-[#FAF8F5]'
                }`}
              >
                All ({submissions.length})
              </button>
              <button
                onClick={() => {
                  setStatusFilter('pending');
                  setFilterValue((prev) => ({ ...prev, status: ['pending'] }));
                }}
                className={`px-2.5 py-1 rounded-[5px] transition-all cursor-pointer whitespace-nowrap text-xs font-semibold flex items-center gap-1.5 ${
                  statusFilter === 'pending' || (filterValue.status?.includes('pending') && filterValue.status.length === 1)
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800/80 shadow-2xs'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span>Pending ({pendingCount})</span>
              </button>
              <button
                onClick={() => {
                  setStatusFilter('approved');
                  setFilterValue((prev) => ({ ...prev, status: ['approved'] }));
                }}
                className={`px-2.5 py-1 rounded-[5px] transition-all cursor-pointer whitespace-nowrap text-xs font-semibold flex items-center gap-1.5 ${
                  statusFilter === 'approved' || (filterValue.status?.includes('approved') && filterValue.status.length === 1)
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800/80 shadow-2xs'
                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                <span>Approved ({approvedCount})</span>
              </button>
              <button
                onClick={() => {
                  setStatusFilter('rejected');
                  setFilterValue((prev) => ({ ...prev, status: ['rejected'] }));
                }}
                className={`px-2.5 py-1 rounded-[5px] transition-all cursor-pointer whitespace-nowrap text-xs font-semibold flex items-center gap-1.5 ${
                  statusFilter === 'rejected' || (filterValue.status?.includes('rejected') && filterValue.status.length === 1)
                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800/80 shadow-2xs'
                    : 'text-rose-700 dark:text-rose-400 hover:bg-rose-500/10'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>Rejected ({rejectedCount})</span>
              </button>
            </div>
          </div>

          {/* Search Input, Grouped Filter Menu & Batch Selection Controls Bar */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2 w-full sm:max-w-md">
                <div className="flex-1">
                  <Input
                    placeholder="Search member, phone, plan..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    leftIcon={<Search className="w-3.5 h-3.5 text-[#706A65]" />}
                    className="rounded-[5px] border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#181615] focus:border-[#981C00] focus:ring-[#981C00]/20 text-xs"
                  />
                </div>

                {/* Filter Menu Popover Button */}
                <div className="relative shrink-0" ref={filterMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsFilterMenuOpen((prev) => !prev)}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-[5px] text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                      isFilterMenuOpen || activeFilterCount > 0
                        ? 'bg-[#FAF4F2] dark:bg-[#2A1D1A] text-[#981C00] dark:text-[#E89382] border-[#981C00]/40 dark:border-[#C43214]/40 ring-1 ring-[#981C00]/20'
                        : 'bg-white dark:bg-[#1E1B19] text-[#24211F] dark:text-[#FAF8F5] border-[#E8E4DF] dark:border-[#2C2825] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2624]'
                    }`}
                    aria-expanded={isFilterMenuOpen}
                    title="Open Grouped Filters (FilterMenu)"
                  >
                    <ListFilter className="w-3.5 h-3.5 text-[#981C00] dark:text-[#E89382]" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-[#981C00] text-white text-[10px] font-bold font-mono">
                        {activeFilterCount}
                      </span>
                    )}
                    <ChevronDown
                      className={`w-3 h-3 text-[#706A65] dark:text-[#A8A19A] transition-transform duration-200 ${
                        isFilterMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Filter Menu Popover Dropdown */}
                  {isFilterMenuOpen && (
                    <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-40 w-[330px] sm:w-[380px] max-w-[90vw] shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                      <FilterMenu
                        groups={filterGroups}
                        value={filterValue}
                        onChange={(next) => {
                          setFilterValue(next);
                          if (next.status && next.status.length === 1) {
                            setStatusFilter(next.status[0] as any);
                          } else if (!next.status || next.status.length === 0) {
                            setStatusFilter('all');
                          }
                        }}
                        title="Filter Registrations"
                        hints={true}
                      />
                    </div>
                  )}
                </div>
              </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap justify-end">
              {/* Copy Approved Phone Numbers Button */}
              <button
                type="button"
                onClick={() => setIsCopyApprovedModalOpen(true)}
                title="Copy approved phone numbers with ordering (#) and plenty of space"
                className="inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-[5px] text-xs font-semibold border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 transition-all cursor-pointer shadow-2xs"
              >
                {hasCopiedApproved ? (
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                )}
                <span>Copy Approved</span>
                <span className="px-1.5 py-0.5 rounded-[5px] bg-emerald-200/80 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 text-[10px] font-mono font-bold">
                  {approvedCount}
                </span>
              </button>

              {/* Export to CSV Button */}
              <button
                type="button"
                onClick={exportToCSV}
                disabled={isExportingCsv}
                aria-label="Export to CSV"
                title="Export list as CSV"
                className="inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-[5px] text-xs font-semibold border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#1E1B19] text-[#24211F] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2624] disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              {/* Export to PDF Dropdown Menu */}
              <div className="relative" ref={pdfDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsPdfDropdownOpen((prev) => !prev)}
                  disabled={isExportingPdf}
                  aria-label="Export to PDF options"
                  title="Export PDF reports"
                  className="inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-[5px] text-xs font-semibold border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#1E1B19] text-[#24211F] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#2A2624] disabled:opacity-50 transition-all cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-[#981C00] dark:text-[#E89382]" />
                  <span className="hidden sm:inline">PDF</span>
                  <ChevronDown className="w-3 h-3 text-[#706A65]" />
                </button>

                {isPdfDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-60 rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] shadow-xl py-1.5 z-30 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPdfDropdownOpen(false);
                        exportToPDF();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#FAF8F5] dark:hover:bg-[#24211F] flex items-center gap-2.5 cursor-pointer text-[#24211F] dark:text-[#FAF8F5]"
                    >
                      <FileText className="w-4 h-4 text-[#981C00] shrink-0" />
                      <div>
                        <p className="font-semibold text-xs leading-tight">Master Report PDF</p>
                        <p className="text-[10px] text-[#706A65] dark:text-[#A8A29D] mt-0.5">All currently filtered rows</p>
                      </div>
                    </button>
                    <div className="border-t border-[#E8E4DF] dark:border-[#2C2825] my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsPdfDropdownOpen(false);
                        exportApprovedPhonesPDF();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#FAF8F5] dark:hover:bg-[#24211F] flex items-center gap-2.5 cursor-pointer text-[#24211F] dark:text-[#FAF8F5]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <p className="font-semibold text-xs leading-tight">Approved Phones Only PDF</p>
                        <p className="text-[10px] text-[#706A65] dark:text-[#A8A29D] mt-0.5">
                          Verified directory ({approvedCount} phones)
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Toggle Select Mode Button */}
              {filteredSubmissions.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (isSelectionMode && selectedIds.length === 0) {
                      setIsSelectionMode(false);
                    } else if (isSelectionMode && selectedIds.length > 0) {
                      setSelectedIds([]);
                      setIsSelectionMode(false);
                    } else {
                      setIsSelectionMode(true);
                    }
                  }}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 h-9 rounded-[5px] text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                    isSelectionMode || selectedIds.length > 0
                      ? 'bg-[#24211F] text-[#FAF8F5] dark:bg-[#FAF8F5] dark:text-[#24211F] border-[#24211F] dark:border-[#FAF8F5] shadow-xs'
                      : 'bg-white dark:bg-[#1E1B19] text-[#24211F] dark:text-[#FAF8F5] border-[#E8E4DF] dark:border-[#2C2825] hover:bg-[#FAF8F5] dark:hover:bg-[#24211F]'
                  }`}
                  aria-label="Select items"
                  title="Toggle multi-item select mode"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{isSelectionMode || selectedIds.length > 0 ? 'Selection Active' : 'Select'}</span>
                </button>
              )}

              {/* Active Selection Floating Pill */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F3EFEA] dark:bg-[#1E1B19] p-1 px-2.5 rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825] text-xs">
                  <span className="font-bold text-[#24211F] dark:text-[#FAF8F5] font-mono text-[11px]">
                    {selectedIds.length}
                  </span>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setShowBatchDeleteModal(true)}
                    leftIcon={<Trash2 className="w-3 h-3" />}
                    className="text-xs py-0.5 h-6.5 px-2 rounded-[5px]"
                  >
                    <span className="hidden sm:inline">Delete Selected</span>
                    <span className="sm:hidden">Delete</span>
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIds([]);
                      setIsSelectionMode(false);
                    }}
                    className="text-[#706A65] hover:text-[#24211F] dark:hover:text-[#FAF8F5] text-[11px] underline cursor-pointer px-0.5"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

            {/* Active Filter Chips Bar (Quick remove & summary) */}
            {activeFilterCount > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-dashed border-[#E8E4DF] dark:border-[#2C2825]">
                <span className="text-[11px] font-semibold text-[#706A65] dark:text-[#A8A19A] mr-1">
                  Active filters:
                </span>
                {filterGroups.flatMap((g) =>
                  (filterValue[g.id] || []).map((valId) => {
                    const opt = g.options.find((o) => o.id === valId);
                    const label = `${g.chipPrefix || ''}${opt ? opt.label.replace(/\s*\(\d+\)/, '') : valId}`;
                    return (
                      <span
                        key={`${g.id}-${valId}`}
                        className="inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-[5px] bg-[#FAF4F2] dark:bg-[#2A1D1A] border border-[#E8DCD9] dark:border-[#3A2420] text-[#981C00] dark:text-[#E89382] text-[11px] font-medium animate-in fade-in duration-150"
                      >
                        <span>{label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const cur = filterValue[g.id] || [];
                            const next = cur.filter((x) => x !== valId);
                            const updated = { ...filterValue, [g.id]: next };
                            if (next.length === 0) delete updated[g.id];
                            setFilterValue(updated);
                            if (g.id === 'status') {
                              if (next.length === 1) setStatusFilter(next[0] as any);
                              else setStatusFilter('all');
                            }
                          }}
                          className="hover:bg-[#F3E6E2] dark:hover:bg-[#3A2420] rounded-[3px] p-0.5 transition-colors cursor-pointer"
                          aria-label={`Remove filter ${label}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFilterValue({});
                    setStatusFilter('all');
                  }}
                  className="text-[11px] font-semibold text-[#706A65] hover:text-[#981C00] dark:text-[#A8A19A] dark:hover:text-[#E89382] underline ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Registrations List - Mobile Cards View + Desktop Table View */}
          {filteredSubmissions.length === 0 ? (
            <div className="py-14 text-center text-xs text-[#706A65] dark:text-[#A8A29D] space-y-3 bg-[#FAF8F5]/60 dark:bg-[#1A1816]/40 rounded-[5px] border border-dashed border-[#DDD7CF] dark:border-[#2C2825]">
              <AlertCircle className="w-9 h-9 mx-auto text-[#706A65]/50" />
              <div>
                <p className="font-bold text-[#24211F] dark:text-[#FAF8F5] text-sm">No registrations found</p>
                <p className="text-[#706A65] dark:text-[#A8A29D] text-xs mt-0.5">
                  Submissions from the registration form will appear here in real-time.
                </p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => fetchRegistrations()}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                className="rounded-[5px]"
              >
                Refresh
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mobile View: High-Efficiency Two-Column Card Layout (Info on Left, Receipt on Right) */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {paginatedSubmissions.map((sub, pageIndex) => {
                  const absoluteIndex = startIndex + pageIndex + 1;
                  const isSelected = selectedIds.includes(sub.id);

                  return (
                    <div
                      key={`m-${sub.id}`}
                      onClick={() => {
                        if (isSelectionMode) handleToggleSelect(sub.id);
                      }}
                      className={`p-3 rounded-[5px] border transition-all ${
                        isSelected
                          ? 'bg-[#F3EFEA] dark:bg-[#24211F] border-[#24211F] dark:border-[#FAF8F5] shadow-2xs'
                          : 'bg-white dark:bg-[#181615] border-[#E8E4DF] dark:border-[#2C2825]'
                      }`}
                    >
                      {/* Main Card Layout: Left Info & Actions, Right Receipt Thumbnail */}
                      <div className="flex items-stretch gap-3">
                        {/* LEFT COLUMN: User Info, Plan Selector, Status, & Quick Actions */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                          {/* Header: Select Checkbox, #Index, Name & Status */}
                          <div>
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {(isSelectionMode || selectedIds.length > 0) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleToggleSelect(sub.id);
                                    }}
                                    className={`w-5 h-5 rounded-[5px] flex items-center justify-center transition-all cursor-pointer border shrink-0 ${
                                      isSelected
                                        ? 'bg-[#24211F] text-[#FAF8F5] dark:bg-[#FAF8F5] dark:text-[#24211F] border-[#24211F] dark:border-[#FAF8F5] shadow-2xs'
                                        : 'border-[#DDD7CF] dark:border-[#3D3834] bg-white dark:bg-[#1E1B19]'
                                    }`}
                                    aria-label={isSelected ? 'Deselect member' : 'Select member'}
                                  >
                                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                  </button>
                                )}
                                <span className="text-[11px] font-mono font-bold text-[#706A65] shrink-0">
                                  #{absoluteIndex}
                                </span>
                                <h3 className="font-bold text-[#24211F] dark:text-[#FAF8F5] text-sm leading-tight truncate" title={sub.userName}>
                                  {sub.userName}
                                </h3>
                              </div>

                              <div className="shrink-0">
                                {sub.status === 'pending' && <Badge variant="amber" dot>Pending</Badge>}
                                {sub.status === 'approved' && <Badge variant="emerald" dot>Approved</Badge>}
                                {sub.status === 'rejected' && <Badge variant="danger">Rejected</Badge>}
                              </div>
                            </div>

                            {/* Phone & Date */}
                            <div className="flex items-center justify-between text-[11px] font-mono text-[#4A443F] dark:text-[#D1CBC5] font-semibold gap-1">
                              <span className="flex items-center gap-1 truncate">
                                <Smartphone className="w-3 h-3 text-[#706A65] shrink-0" />
                                {sub.userPhone}
                              </span>
                              <span className="text-[10px] text-[#706A65] font-normal shrink-0">
                                {new Date(sub.submittedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                              </span>
                            </div>

                            {/* Verify.ET Auto-Verified Badge / TxID */}
                            {(sub.verificationMethod === 'verify_et' || sub.transactionId) && (
                              <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  <span>Verify.ET</span>
                                  {sub.bank && <span className="uppercase font-mono text-[9px]">{sub.bank}</span>}
                                </span>
                                {sub.transactionId && (
                                  <span className="font-mono text-[10px] text-[#706A65] truncate max-w-[140px]" title={sub.transactionId}>
                                    Tx: {sub.transactionId}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Plan Badge & Amount Display */}
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] text-xs font-semibold tracking-tight border border-[#E8E4DF] dark:border-[#2C2825] bg-[#F3EFEA] dark:bg-[#201D1B] text-[#24211F] dark:text-[#FAF8F5]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#981C00] dark:bg-[#E89382]" />
                              <span>
                                {sub.amount >= 1000 || sub.planName.toLowerCase().includes('6')
                                  ? '6 Months'
                                  : sub.amount >= 600 || sub.planName.toLowerCase().includes('3')
                                  ? '3 Months'
                                  : '1 Month'}
                              </span>
                            </span>
                            <span className="text-xs font-mono font-bold text-[#24211F] dark:text-[#FAF8F5]">
                              {Number(sub.amount).toLocaleString()} ETB
                            </span>
                          </div>

                          {/* Quick Action Buttons on Left */}
                          <div className="flex items-center gap-1.5 pt-1">
                            {sub.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    approvePayment(sub.id, sub.userPhone);
                                    success('Approved!', `Activated for ${sub.userPhone}`);
                                  }}
                                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-[5px] text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-all cursor-pointer shadow-2xs"
                                  title="Approve registration"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    rejectPayment(sub.id, sub.userPhone);
                                    info('Rejected', `Marked ${sub.userPhone} as rejected`);
                                  }}
                                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-[5px] text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 transition-all cursor-pointer border border-rose-300 dark:border-rose-900"
                                  title="Reject registration"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {sub.status === 'approved' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSmsPhone(sub.userPhone);
                                  setActiveTab('send_sms');
                                }}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-[5px] text-xs font-bold text-[#24211F] dark:text-[#FAF8F5] bg-[#FAF8F5] hover:bg-[#F3EFEA] dark:bg-[#1E1B19] dark:hover:bg-[#2C2825] transition-colors cursor-pointer border border-[#E8E4DF] dark:border-[#2C2825]"
                              >
                                <Send className="w-3 h-3 text-[#981C00] dark:text-[#E89382]" /> Send SMS
                              </button>
                            )}

                            {sub.status === 'rejected' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  approvePayment(sub.id, sub.userPhone);
                                  success('Approved', `Status updated to active for ${sub.userPhone}`);
                                }}
                                className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-[5px] text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 transition-colors cursor-pointer border border-emerald-300 dark:border-emerald-800"
                              >
                                <Check className="w-3 h-3" /> Re-Approve
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setItemToDelete(sub);
                              }}
                              className="p-1.5 text-[#706A65] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-[5px] transition-colors cursor-pointer shrink-0"
                              title="Delete this record"
                              aria-label="Delete registration"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Direct Visible Receipt Image / Thumbnail */}
                        <div className="w-24 sm:w-28 shrink-0 flex flex-col items-center justify-center">
                          {sub.screenshotUrl ? (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewSubmission(sub);
                              }}
                              className="relative w-full h-full min-h-[112px] rounded-[5px] overflow-hidden border border-[#E8E4DF] dark:border-[#2C2825] bg-[#141211] cursor-pointer group shadow-xs flex items-center justify-center"
                              title="Tap to enlarge receipt"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={sub.screenshotUrl}
                                alt={`Receipt for ${sub.userName}`}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-end p-1.5">
                                <div className="w-full py-0.5 px-1 rounded-[5px] bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold flex items-center justify-center gap-1">
                                  <Eye className="w-2.5 h-2.5" /> View
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full min-h-[112px] rounded-[5px] border border-dashed border-[#DDD7CF] dark:border-[#2C2825] bg-[#FAF8F5]/80 dark:bg-[#1E1B19]/40 flex flex-col items-center justify-center p-2 text-center text-[#706A65]">
                              <FileText className="w-5 h-5 text-[#706A65]/50 mb-1" />
                              <span className="text-[10px] italic">No receipt</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop View: Full-featured Table (Visible only on >= md screens) */}
              <div className="hidden md:block overflow-x-auto rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] dark:bg-[#1A1816] text-[#706A65] font-semibold uppercase tracking-wider border-b border-[#E8E4DF] dark:border-[#2C2825]">
                    <tr>
                      {/* Selection Column Header - shown when Selection Mode is on or items are selected */}
                      {(isSelectionMode || selectedIds.length > 0) && (
                        <th className="py-3 px-3 pl-4 w-10 text-center transition-all animate-fadeIn">
                          <button
                            type="button"
                            onClick={handleSelectPage}
                            className={`w-5 h-5 rounded-[5px] flex items-center justify-center transition-all cursor-pointer border ${
                              paginatedSubmissions.length > 0 &&
                              paginatedSubmissions.every((s) => selectedIds.includes(s.id))
                                ? 'bg-[#24211F] text-[#FAF8F5] dark:bg-[#FAF8F5] dark:text-[#24211F] border-[#24211F] dark:border-[#FAF8F5] shadow-2xs'
                                : 'border-[#DDD7CF] dark:border-[#3D3834] bg-white dark:bg-[#1E1B19] hover:border-[#706A65]'
                            }`}
                            title="Select / Deselect all on this page"
                          >
                            {paginatedSubmissions.length > 0 &&
                            paginatedSubmissions.every((s) => selectedIds.includes(s.id)) ? (
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            ) : paginatedSubmissions.some((s) => selectedIds.includes(s.id)) ? (
                              <div className="w-2 h-0.5 bg-[#24211F] dark:bg-[#FAF8F5] rounded-full" />
                            ) : null}
                          </button>
                        </th>
                      )}
                      <th className={`py-3 px-3 w-12 text-center text-[11px] font-mono text-[#706A65] ${!(isSelectionMode || selectedIds.length > 0) ? 'pl-4' : ''}`}>#</th>
                      <th className="py-3 px-3">Member Name & Phone</th>
                      <th className="py-3 px-3">Plan / Amount</th>
                      <th className="py-3 px-3">Receipt Image</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DF] dark:divide-[#2C2825]">
                    {paginatedSubmissions.map((sub, pageIndex) => {
                      const absoluteIndex = startIndex + pageIndex + 1;
                      const isSelected = selectedIds.includes(sub.id);

                      return (
                        <tr
                          key={sub.id}
                          onClick={(e) => {
                            const target = e.target as HTMLElement;
                            if (
                              isSelectionMode &&
                              !target.closest('button') &&
                              !target.closest('select') &&
                              !target.closest('a') &&
                              !target.closest('img')
                            ) {
                              handleToggleSelect(sub.id);
                            }
                          }}
                          className={`hover:bg-[#FAF8F5]/80 dark:hover:bg-[#201D1B]/60 transition-colors ${
                            isSelected
                              ? 'bg-[#F3EFEA] dark:bg-[#24211F]'
                              : ''
                          } ${isSelectionMode ? 'cursor-pointer select-none' : ''}`}
                        >
                          {/* Modern Select Checkbox Cell */}
                          {(isSelectionMode || selectedIds.length > 0) && (
                            <td className="py-3 px-3 pl-4 w-10 text-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleSelect(sub.id);
                                }}
                                className={`w-5 h-5 rounded-[5px] flex items-center justify-center transition-all cursor-pointer border ${
                                  isSelected
                                    ? 'bg-[#24211F] text-[#FAF8F5] dark:bg-[#FAF8F5] dark:text-[#24211F] border-[#24211F] dark:border-[#FAF8F5] shadow-2xs'
                                    : 'border-[#DDD7CF] dark:border-[#3D3834] bg-white dark:bg-[#1E1B19] hover:border-[#706A65]'
                                }`}
                                title={isSelected ? 'Deselect member' : 'Select member'}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                            </td>
                          )}

                          {/* Index Number */}
                          <td className={`py-3 px-3 w-12 text-center text-xs font-mono font-bold text-[#706A65] ${!(isSelectionMode || selectedIds.length > 0) ? 'pl-4' : ''}`}>
                            {absoluteIndex}
                          </td>

                          {/* Member Name & Phone */}
                          <td className="py-3 px-3">
                            <div className="space-y-0.5">
                              <p className="font-bold text-[#24211F] dark:text-[#FAF8F5]">{sub.userName}</p>
                              <p className="text-[11px] font-mono text-[#4A443F] dark:text-[#D1CBC5] font-bold flex items-center gap-1">
                                <Smartphone className="w-3 h-3 text-[#706A65]" /> {sub.userPhone}
                              </p>
                              {(sub.verificationMethod === 'verify_et' || sub.transactionId) && (
                                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>Verify.ET</span>
                                    {sub.bank && <span className="uppercase font-mono text-[9px]">{sub.bank}</span>}
                                  </span>
                                  {sub.transactionId && (
                                    <span className="font-mono text-[10px] text-[#706A65] truncate max-w-[130px]" title={sub.transactionId}>
                                      {sub.transactionId}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Plan / Amount */}
                          <td className="py-3 px-3">
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[5px] text-xs font-semibold tracking-tight border border-[#E8E4DF] dark:border-[#2C2825] bg-[#F3EFEA] dark:bg-[#201D1B] text-[#24211F] dark:text-[#FAF8F5]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#981C00] dark:bg-[#E89382]" />
                                <span>
                                  {sub.amount >= 1000 || sub.planName.toLowerCase().includes('6')
                                    ? '6 Months'
                                    : sub.amount >= 600 || sub.planName.toLowerCase().includes('3')
                                    ? '3 Months'
                                    : '1 Month'}
                                </span>
                              </span>
                              <p className="text-xs font-mono font-bold text-[#24211F] dark:text-[#FAF8F5] pl-0.5">
                                {Number(sub.amount).toLocaleString()} ETB
                              </p>
                            </div>
                          </td>

                          {/* Receipt Image */}
                          <td className="py-3 px-3">
                            {sub.screenshotUrl ? (
                              <div
                                onClick={() => setPreviewSubmission(sub)}
                                className="relative h-11 w-18 rounded-[5px] overflow-hidden border border-[#E8E4DF] dark:border-[#2C2825] bg-[#141211] cursor-pointer group shadow-xs"
                                title="Click to view full receipt image"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={sub.screenshotUrl}
                                  alt="Payment Screenshot"
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200 opacity-90"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[#706A65] text-[11px] italic">No image</span>
                            )}
                          </td>

                          {/* Date */}
                          <td className="py-3 px-3 text-[#706A65] font-mono text-[11px]">
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3">
                            {sub.status === 'pending' && <Badge variant="amber" dot>Pending</Badge>}
                            {sub.status === 'approved' && <Badge variant="emerald" dot>Approved</Badge>}
                            {sub.status === 'rejected' && <Badge variant="danger">Rejected</Badge>}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                              {sub.status === 'pending' && (
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      approvePayment(sub.id, sub.userPhone);
                                      success('Approved!', `Activated SMS subscription for ${sub.userPhone}`);
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[5px] text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-2xs transition-all cursor-pointer"
                                    title="Approve and activate"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      rejectPayment(sub.id, sub.userPhone);
                                      info('Rejected', `Marked ${sub.userPhone} as rejected`);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[5px] text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all cursor-pointer border border-rose-300 dark:border-rose-900"
                                    title="Reject registration"
                                  >
                                    <X className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </div>
                              )}

                              {sub.status === 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSmsPhone(sub.userPhone);
                                    setActiveTab('send_sms');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[5px] text-xs font-semibold text-[#24211F] dark:text-[#FAF8F5] bg-[#FAF8F5] hover:bg-[#F3EFEA] dark:bg-[#1E1B19] dark:hover:bg-[#2C2825] transition-colors cursor-pointer border border-[#E8E4DF] dark:border-[#2C2825]"
                                >
                                  <Send className="w-3 h-3 text-[#981C00] dark:text-[#E89382]" /> Send SMS
                                </button>
                              )}

                              {sub.status === 'rejected' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    approvePayment(sub.id, sub.userPhone);
                                    success('Approved', `Status updated to active for ${sub.userPhone}`);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[5px] text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer border border-emerald-300 dark:border-emerald-800"
                                >
                                  <Check className="w-3 h-3" /> Re-Approve
                                </button>
                              )}

                              <button
                                type="button"
                                id={`delete-btn-${sub.id}`}
                                onClick={() => setItemToDelete(sub)}
                                className="p-1.5 text-[#706A65] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-[5px] transition-colors cursor-pointer ml-1"
                                title="Delete this record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 20 Per Page Pagination Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 pt-2 px-1 text-xs text-[#706A65]">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <span className="font-mono text-[11px] sm:text-xs">
                    Showing <strong className="text-[#24211F] dark:text-[#FAF8F5]">{startIndex + 1}</strong>–
                    <strong className="text-[#24211F] dark:text-[#FAF8F5]">{endIndex}</strong> of{' '}
                    <strong className="text-[#24211F] dark:text-[#FAF8F5]">{filteredSubmissions.length}</strong>
                  </span>

                  {/* Page Size Selector */}
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-[#706A65]">per page:</span>
                    <select
                      value={pageSize}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      className="py-0.5 px-1.5 rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#1E1B19] text-[#24211F] dark:text-[#FAF8F5] font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>

                {/* Page Navigation Buttons */}
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <button
                    type="button"
                    disabled={validCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#1E1B19] font-semibold text-[#24211F] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#2C2825] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs text-xs"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <span className="px-2.5 sm:px-3 py-1.5 font-mono font-bold text-[#24211F] dark:text-[#FAF8F5] bg-[#F3EFEA] dark:bg-[#1E1B19] rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825] text-[11px] sm:text-xs">
                    {validCurrentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={validCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#1E1B19] font-semibold text-[#24211F] dark:text-[#FAF8F5] hover:bg-[#FAF8F5] dark:hover:bg-[#2C2825] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs text-xs"
                    aria-label="Next page"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* PURPOSE 2: SEND SMS TO APPROVED MEMBERS (SEAMLESS CHUNKED & SCHEDULED) */}
      {/* ========================================================================= */}
      {activeTab === 'send_sms' && (
        <SmsConsole
          submissions={submissions}
          approvedCount={approvedCount}
          smsLogs={smsLogs}
          setSmsLogs={setSmsLogs}
          initialSelectedPhone={selectedSmsPhone}
        />
      )}

      {/* ========================================================================= */}
      {/* PURPOSE 3: SMS DELIVERY LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <Card className="p-3.5 sm:p-6 space-y-4 border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] rounded-[5px] shadow-sm">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#E8E4DF] dark:border-[#2C2825]">
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#24211F] dark:text-[#FAF8F5] flex items-center gap-2">
                SMS Dispatch History
              </h2>
              <p className="text-[11px] sm:text-xs text-[#706A65] dark:text-[#A8A29D] mt-0.5">
                Audit log of sent encouragement and spiritual messages.
              </p>
            </div>
            {smsLogs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSmsLogs([]);
                  if (typeof window !== 'undefined') localStorage.removeItem('nazazi_sms_logs');
                  info('Cleared SMS logs');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[5px] text-xs font-semibold text-[#706A65] hover:text-[#24211F] dark:text-[#A8A29D] dark:hover:text-[#FAF8F5] bg-[#FAF8F5] hover:bg-[#F3EFEA] dark:bg-[#1E1B19] dark:hover:bg-[#2C2825] transition-colors cursor-pointer border border-[#E8E4DF] dark:border-[#2C2825]"
                title="Clear all logs"
                aria-label="Clear all logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear History</span>
              </button>
            )}
          </div>

          {smsLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#706A65] dark:text-[#A8A29D] space-y-2 bg-[#FAF8F5]/60 dark:bg-[#1A1816]/40 rounded-[5px] border border-dashed border-[#DDD7CF] dark:border-[#2C2825]">
              <History className="w-8 h-8 mx-auto text-[#706A65]/50" />
              <p className="font-bold text-[#24211F] dark:text-[#FAF8F5]">No SMS messages sent yet</p>
              <p>Dispatched messages from the SMS Console will appear here with delivery timestamps.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Mobile Logs Cards (< md) */}
              <div className="grid grid-cols-1 gap-2.5 md:hidden">
                {smsLogs.map((log) => (
                  <div
                    key={`m-log-${log.id}`}
                    className="p-3 rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-[#24211F] dark:text-[#FAF8F5] text-sm leading-tight">{log.recipientName}</p>
                        <p className="text-[11px] font-mono text-[#4A443F] dark:text-[#D1CBC5] font-semibold">{log.recipientPhone}</p>
                      </div>
                      <Badge variant="zinc" dot>
                        {log.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-[#24211F] dark:text-[#FAF8F5] bg-[#FAF8F5] dark:bg-[#1E1B19] p-2.5 rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825] leading-relaxed font-sans">
                      {log.messageText}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-[#706A65] font-mono pt-1">
                      <span>{new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      <span>{log.segmentCount} segment(s)</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Logs Table (>= md) */}
              <div className="hidden md:block overflow-x-auto rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] dark:bg-[#1A1816] text-[#706A65] font-semibold uppercase tracking-wider border-b border-[#E8E4DF] dark:border-[#2C2825]">
                    <tr>
                      <th className="p-3.5 pl-4">Recipient</th>
                      <th className="p-3.5">Dispatched Message</th>
                      <th className="p-3.5">Time</th>
                      <th className="p-3.5">Segments</th>
                      <th className="p-3.5 pr-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DF] dark:divide-[#2C2825]">
                    {smsLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#201D1B]/60">
                        <td className="p-3.5 pl-4">
                          <p className="font-bold text-[#24211F] dark:text-[#FAF8F5]">{log.recipientName}</p>
                          <p className="text-[11px] font-mono text-[#4A443F] dark:text-[#D1CBC5] font-semibold">
                            {log.recipientPhone}
                          </p>
                        </td>

                        <td className="p-3.5 max-w-xs sm:max-w-md">
                          <p className="text-xs text-[#24211F] dark:text-[#FAF8F5] leading-relaxed truncate" title={log.messageText}>
                            {log.messageText}
                          </p>
                        </td>

                        <td className="p-3.5 text-[#706A65]">
                          {new Date(log.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="p-3.5 font-mono text-[#706A65]">
                          {log.segmentCount}
                        </td>

                        <td className="p-3.5 pr-4 text-right">
                          <Badge variant="zinc" dot>
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Receipt Inspection Modal - Compact, Modern & Zero Wasted Whitespace */}
      <Modal
        isOpen={!!previewSubmission}
        onClose={() => setPreviewSubmission(null)}
        maxWidth="md"
        noPadding
      >
        {previewSubmission && (
          <div className="flex flex-col">
            {/* Header: Name, Plan & Close Button */}
            <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#1E1B19]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-xs text-[#706A65] dark:text-[#A8A29D] truncate">
                    Name: <strong className="text-[#24211F] dark:text-[#FAF8F5] font-bold text-sm">{previewSubmission.userName}</strong>
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1 text-xs text-[#706A65] dark:text-[#A8A29D]">
                  <span>Plan:</span>
                  <span className="px-2 py-0.5 rounded-[5px] bg-[#24211F] text-[#FAF8F5] dark:bg-[#FAF8F5] dark:text-[#24211F] font-bold font-mono text-xs">
                    {previewSubmission.amount || (previewSubmission.planName.toLowerCase().includes('1000') || previewSubmission.planName.toLowerCase().includes('1,000') ? 1000 : previewSubmission.planName.toLowerCase().includes('600') ? 600 : 200)} Birr
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewSubmission(null)}
                className="text-[#706A65] hover:text-[#24211F] dark:hover:text-[#FAF8F5] p-1.5 rounded-[5px] hover:bg-[#F3EFEA] dark:hover:bg-[#2C2825] transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Verify.ET Details Banner */}
            {(previewSubmission.verificationMethod === 'verify_et' || previewSubmission.transactionId) && (
              <div className="px-4 py-2.5 bg-emerald-500/10 dark:bg-emerald-950/40 border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-bold text-emerald-800 dark:text-emerald-300">
                    Verify.ET Automated Bank Verification
                  </span>
                  {previewSubmission.bank && (
                    <span className="uppercase text-[10px] px-2 py-0.5 rounded-[5px] bg-emerald-700 text-white font-mono font-bold">
                      {previewSubmission.bank}
                    </span>
                  )}
                </div>
                {previewSubmission.transactionId && (
                  <div className="font-mono text-[11px] text-emerald-900 dark:text-emerald-200 bg-white/70 dark:bg-[#1E1B19]/70 px-2 py-0.5 rounded-[5px] border border-emerald-500/20">
                    TxID: <span className="font-bold select-all">{previewSubmission.transactionId}</span>
                  </div>
                )}
              </div>
            )}

            {/* Receipt Image (Maximal view area, minimal margins) */}
            <div className="p-2.5 sm:p-3 bg-[#141211] flex items-center justify-center min-h-[200px] max-h-[58vh] sm:max-h-[64vh]">
              {previewSubmission.screenshotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSubmission.screenshotUrl}
                  alt={`Receipt for ${previewSubmission.userName}`}
                  referrerPolicy="no-referrer"
                  className="max-h-[54vh] sm:max-h-[60vh] w-auto max-w-full object-contain rounded-[5px] select-none"
                />
              ) : (
                <div className="py-12 text-center text-[#706A65] text-xs space-y-2">
                  <AlertCircle className="w-8 h-8 mx-auto text-[#706A65]/50" />
                  <p>No receipt image uploaded</p>
                </div>
              )}
            </div>

            {/* Compact Action Footer */}
            <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 border-t border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPreviewSubmission(null)}
                className="text-xs h-8 px-3 rounded-[5px]"
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                {previewSubmission.status !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => {
                      rejectPayment(previewSubmission.id, previewSubmission.userPhone);
                      info('Rejected', 'Marked transaction as rejected');
                      setPreviewSubmission(null);
                    }}
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-[5px] text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 transition-colors cursor-pointer h-8"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                )}

                {previewSubmission.status !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => {
                      approvePayment(previewSubmission.id, previewSubmission.userPhone);
                      success('Approved', `Activated for ${previewSubmission.userName}`);
                      setPreviewSubmission(null);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[5px] text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-all cursor-pointer h-8"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Single Item Delete Confirmation Modal */}
      <Modal
        isOpen={!!itemToDelete}
        onClose={() => !isDeletingItem && setItemToDelete(null)}
        title="Delete Member Registration?"
        description={itemToDelete ? `${itemToDelete.userName} • ${itemToDelete.userPhone}` : ''}
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#4A443F] dark:text-[#D1CBC5] leading-relaxed">
            Are you sure you want to permanently delete the registration record for{' '}
            <strong className="text-[#24211F] dark:text-[#FAF8F5] font-bold">
              {itemToDelete?.userName}
            </strong>{' '}
            ({itemToDelete?.userPhone})? This action removes the entry from the database and approval queue.
          </p>

          <div className="flex justify-end items-center gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setItemToDelete(null)}
              disabled={isDeletingItem}
              className="rounded-[5px]"
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmSingleDelete}
              isLoading={isDeletingItem}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              className="rounded-[5px]"
            >
              Delete Record
            </Button>
          </div>
        </div>
      </Modal>

      {/* Batch Delete Confirmation Modal */}
      <Modal
        isOpen={showBatchDeleteModal}
        onClose={() => !isBatchDeleting && setShowBatchDeleteModal(false)}
        title={`Delete ${selectedIds.length} Selected Registrations?`}
        description="Permanently delete multiple registration entries at once."
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#4A443F] dark:text-[#D1CBC5] leading-relaxed">
            Are you sure you want to permanently delete{' '}
            <strong className="text-[#24211F] dark:text-[#FAF8F5] font-bold">
              {selectedIds.length} registration(s)
            </strong>
            ? This action cannot be undone.
          </p>

          <div className="flex justify-end items-center gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowBatchDeleteModal(false)}
              disabled={isBatchDeleting}
              className="rounded-[5px]"
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmBatchDelete}
              isLoading={isBatchDeleting}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              className="rounded-[5px]"
            >
              Yes, Delete Selected
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear / Reset Data Modal */}
      <Modal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Clear All Registrations & Logs?"
        description="This will clear all registered members and SMS history."
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#4A443F] dark:text-[#D1CBC5] leading-relaxed">
            Are you sure you want to clear all registrations? This deletes test submissions and gives you a fresh start for real subscribers.
          </p>

          <div className="flex justify-end items-center gap-2.5 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowResetModal(false)} disabled={isResetting} className="rounded-[5px]">
              Cancel
            </Button>

            <Button variant="danger" size="sm" onClick={handleExecuteReset} isLoading={isResetting} className="rounded-[5px]">
              Yes, Clear All Data
            </Button>
          </div>
        </div>
      </Modal>

      {/* Copy Approved Phone Numbers Modal with Ordering and Plenty of Space */}
      <Modal
        isOpen={isCopyApprovedModalOpen}
        onClose={() => setIsCopyApprovedModalOpen(false)}
        title="Copy Approved Phone Numbers"
        description="Extract and copy verified subscriber phone numbers with ordering (# in front) and plenty of space."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Format Selector Pills */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#706A65] dark:text-[#A8A29D] text-[11px] uppercase tracking-wider">
              Select Output Format
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCopyFormat('ordered_spaced')}
                className={`p-2.5 rounded-[5px] border text-left transition-all cursor-pointer ${
                  copyFormat === 'ordered_spaced'
                    ? 'border-[#981C00] dark:border-[#E89382] bg-[#FAF8F5] dark:bg-[#1E1B19] text-[#24211F] dark:text-[#FAF8F5] ring-1 ring-[#981C00]/20 shadow-xs'
                    : 'border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] hover:border-[#DDD7CF] text-[#706A65] dark:text-[#A8A29D]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs">1. 09... (Spaced)</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-[5px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold uppercase">
                    Default
                  </span>
                </div>
                <p className="text-[10px] opacity-75 mt-1">Number in front with empty line between each</p>
              </button>

              <button
                type="button"
                onClick={() => setCopyFormat('ordered_extra_spaced')}
                className={`p-2.5 rounded-[5px] border text-left transition-all cursor-pointer ${
                  copyFormat === 'ordered_extra_spaced'
                    ? 'border-[#981C00] dark:border-[#E89382] bg-[#FAF8F5] dark:bg-[#1E1B19] text-[#24211F] dark:text-[#FAF8F5] ring-1 ring-[#981C00]/20 shadow-xs'
                    : 'border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] hover:border-[#DDD7CF] text-[#706A65] dark:text-[#A8A29D]'
                }`}
              >
                <span className="font-bold text-xs block">Extra Spaced</span>
                <p className="text-[10px] opacity-75 mt-1">Double blank lines between each phone</p>
              </button>

              <button
                type="button"
                onClick={() => setCopyFormat('ordered_with_name')}
                className={`p-2.5 rounded-[5px] border text-left transition-all cursor-pointer ${
                  copyFormat === 'ordered_with_name'
                    ? 'border-[#981C00] dark:border-[#E89382] bg-[#FAF8F5] dark:bg-[#1E1B19] text-[#24211F] dark:text-[#FAF8F5] ring-1 ring-[#981C00]/20 shadow-xs'
                    : 'border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] hover:border-[#DDD7CF] text-[#706A65] dark:text-[#A8A29D]'
                }`}
              >
                <span className="font-bold text-xs block">Name + Phone</span>
                <p className="text-[10px] opacity-75 mt-1">1. Name — 09... with blank lines</p>
              </button>

              <button
                type="button"
                onClick={() => setCopyFormat('ordered_compact')}
                className={`p-2.5 rounded-[5px] border text-left transition-all cursor-pointer ${
                  copyFormat === 'ordered_compact'
                    ? 'border-[#981C00] dark:border-[#E89382] bg-[#FAF8F5] dark:bg-[#1E1B19] text-[#24211F] dark:text-[#FAF8F5] ring-1 ring-[#981C00]/20 shadow-xs'
                    : 'border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] hover:border-[#DDD7CF] text-[#706A65] dark:text-[#A8A29D]'
                }`}
              >
                <span className="font-bold text-xs block">Compact (1, 2, 3...)</span>
                <p className="text-[10px] opacity-75 mt-1">Single line per phone number</p>
              </button>

              <button
                type="button"
                onClick={() => setCopyFormat('comma')}
                className={`p-2.5 rounded-[5px] border text-left transition-all cursor-pointer col-span-2 sm:col-span-2 ${
                  copyFormat === 'comma'
                    ? 'border-[#981C00] dark:border-[#E89382] bg-[#FAF8F5] dark:bg-[#1E1B19] text-[#24211F] dark:text-[#FAF8F5] ring-1 ring-[#981C00]/20 shadow-xs'
                    : 'border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] hover:border-[#DDD7CF] text-[#706A65] dark:text-[#A8A29D]'
                }`}
              >
                <span className="font-bold text-xs block">Comma Separated</span>
                <p className="text-[10px] opacity-75 mt-1">0911..., 0922... (For SMS Gateways)</p>
              </button>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-[#706A65] dark:text-[#A8A29D] text-[11px] uppercase tracking-wider">
                Clipboard Preview ({approvedSubmissions.length} Approved)
              </label>
              <span className="text-[10px] font-mono text-[#706A65]">
                {copyFormat.includes('spaced') ? 'Plenty of space applied' : 'Standard spacing'}
              </span>
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={getFormattedApprovedText()}
                rows={9}
                className="w-full font-mono text-xs p-3.5 rounded-[5px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#141211] text-[#24211F] dark:text-[#FAF8F5] leading-relaxed focus:outline-none select-all"
                placeholder="No approved users found to copy."
              />
            </div>
          </div>

          {/* Helper note */}
          <div className="p-3 rounded-[5px] bg-[#FAF8F5] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] flex items-start gap-2.5 text-[#4A443F] dark:text-[#D1CBC5] text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Formatted with sequential order numbers in front (<code className="font-mono text-[#981C00] dark:text-[#E89382]">1.</code>, <code className="font-mono text-[#981C00] dark:text-[#E89382]">2.</code>, <code className="font-mono text-[#981C00] dark:text-[#E89382]">3.</code>) and an empty line between each phone number for clear readability and separation.
            </p>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-[#E8E4DF] dark:border-[#2C2825]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCopyApprovedModalOpen(false)}
              className="w-full sm:w-auto rounded-[5px]"
            >
              Close
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => executeCopyApprovedToClipboard()}
              disabled={approvedSubmissions.length === 0}
              leftIcon={
                hasCopiedApproved ? (
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )
              }
              className="w-full sm:w-auto rounded-[5px] bg-[#981C00] hover:bg-[#7A1D28] text-white font-bold"
            >
              {hasCopiedApproved ? 'Copied to Clipboard!' : `Copy ${approvedSubmissions.length} Numbers`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
