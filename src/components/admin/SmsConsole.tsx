'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PaymentSubmission,
  SmsGatewayConfig,
  SmsScheduledCampaign,
  SmsTargetPlan,
  SmsScheduleDuration,
  SmsBatchDispatchProgress,
  SmsProviderType,
} from '@/types';
import { normalizePlanAndAmount } from '@/lib/planUtils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { useToast } from '@/context/ToastContext';
import {
  Send,
  Calendar,
  Clock,
  Settings,
  History,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  XCircle,
  Smartphone,
  Users,
  Layers,
  Sparkles,
  Zap,
  ShieldCheck,
  RefreshCw,
  FileText,
  Copy,
  Trash2,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Radio,
  Sliders,
  Filter,
  ArrowRight,
  ExternalLink,
  Check,
  BookOpen,
  Crown,
  Heart,
  MessageSquare,
  RotateCcw,
  Plus,
  Pencil,
  BookmarkPlus,
  X,
} from 'lucide-react';

export interface SmsLogItem {
  id: string;
  recipientPhone: string;
  recipientName: string;
  messageText: string;
  sentAt: string;
  status: 'Delivered' | 'Queued' | 'Failed';
  segmentCount: number;
}

export interface SmsCustomTemplate {
  id: string;
  title: string;
  tag: string;
  text: string;
  createdAt: string;
}

interface SmsConsoleProps {
  submissions: PaymentSubmission[];
  approvedCount: number;
  smsLogs: SmsLogItem[];
  setSmsLogs: React.Dispatch<React.SetStateAction<SmsLogItem[]>>;
  initialSelectedPhone?: string;
}

export const SmsConsole: React.FC<SmsConsoleProps> = ({
  submissions,
  approvedCount,
  smsLogs,
  setSmsLogs,
  initialSelectedPhone,
}) => {
  const { success, error, info } = useToast();

  // Primary Tab within SMS Console
  const [activeSubTab, setActiveSubTab] = useState<'dispatcher' | 'schedules' | 'gateway' | 'logs'>('dispatcher');

  // Targeting: 'all' | '200' | '600' | '1000' | 'single'
  const [targetPlan, setTargetPlan] = useState<SmsTargetPlan>(initialSelectedPhone ? 'single' : 'all');
  const [selectedPlans, setSelectedPlans] = useState<string[]>(() => {
    if (initialSelectedPhone) return ['single'];
    return ['all', '200', '600', '1000'];
  });
  const [singlePhone, setSinglePhone] = useState<string>(initialSelectedPhone || '');
  const [customPhone, setCustomPhone] = useState<string>('');
  const [showRecipientList, setShowRecipientList] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [quickTestPhone, setQuickTestPhone] = useState('');
  const [isSendingQuickTest, setIsSendingQuickTest] = useState(false);

  // Unified Menu dropdown accordions (closed by default)
  const [openMenuSections, setOpenMenuSections] = useState<{
    audience: boolean;
    mode: boolean;
    gateway: boolean;
  }>({
    audience: false,
    mode: false,
    gateway: false,
  });

  const toggleMenuSection = (section: 'audience' | 'mode' | 'gateway') => {
    setOpenMenuSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (initialSelectedPhone) {
      setTargetPlan('single');
      setSelectedPlans(['single']);
      setSinglePhone(initialSelectedPhone);
    }
  }, [initialSelectedPhone]);

  // Mode: Instant Dispatch vs Scheduled Campaign
  const [dispatchMode, setDispatchMode] = useState<'instant' | 'schedule'>('instant');

  // Custom Saved Sample Texts
  const [customTemplates, setCustomTemplates] = useState<SmsCustomTemplate[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nazazi_sms_custom_templates');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch (e) {
        console.error('Error reading custom templates from storage', e);
      }
    }
    return [];
  });

  // Sync custom templates to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('nazazi_sms_custom_templates', JSON.stringify(customTemplates));
      } catch (e) {
        console.error('Error saving custom templates to storage', e);
      }
    }
  }, [customTemplates]);

  // Message Composer
  const [messageText, setMessageText] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('nazazi_sms_custom_templates');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.text) {
            return parsed[0].text;
          }
        }
      } catch {}
    }
    return '';
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Template Modal State (Create / Edit)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [modalTag, setModalTag] = useState('Scripture');
  const [modalText, setModalText] = useState('');
  const modalTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Chunking / Batch Settings
  const [batchSize, setBatchSize] = useState<number>(50);
  const [batchDelayMs, setBatchDelayMs] = useState<number>(500);

  // Live Batch Progress State
  const [progress, setProgress] = useState<SmsBatchDispatchProgress>({
    isDispatching: false,
    totalRecipients: 0,
    totalBatches: 0,
    currentBatch: 0,
    sentCount: 0,
    failedCount: 0,
    statusText: '',
    isPaused: false,
  });

  const isPausedRef = useRef(false);
  const isCancelledRef = useRef(false);

  // Scheduled Campaign Creation State
  const [scheduleDuration, setScheduleDuration] = useState<SmsScheduleDuration>('1_month');
  const [customDurationDays, setCustomDurationDays] = useState<number>(30);
  const [scheduleDailyTime, setScheduleDailyTime] = useState<string>('07:00');
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [campaignTitle, setCampaignTitle] = useState<string>('');
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);

  // Scheduled Campaigns List
  const [campaigns, setCampaigns] = useState<SmsScheduledCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // Gateway Settings State
  const [gatewayConfig, setGatewayConfig] = useState<SmsGatewayConfig>({
    provider: 'generic_http',
    apiUrl: '',
    apiKey: '',
    senderId: 'NAZAZI',
    authHeader: 'Bearer',
    batchSize: 50,
    batchDelayMs: 500,
  });
  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isSavingGateway, setIsSavingGateway] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isTestingGateway, setIsTestingGateway] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Get Admin auth token from browser storage
  const getAdminToken = (): string => {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem('nazazi_admin_token') || localStorage.getItem('nazazi_admin_token') || '';
  };

  // 1. Group Approved Submissions by Plan
  const { approvedAll, plan200Members, plan600Members, plan1000Members } = useMemo(() => {
    const approved = submissions.filter((s) => s.status === 'approved');
    const p200: PaymentSubmission[] = [];
    const p600: PaymentSubmission[] = [];
    const p1000: PaymentSubmission[] = [];

    for (const sub of approved) {
      const norm = normalizePlanAndAmount(sub.planName, sub.amount, sub.notes);
      if (norm.amount >= 900 || norm.planName.toLowerCase().includes('1000') || norm.planName.toLowerCase().includes('6 month') || norm.planName.toLowerCase().includes('vip')) {
        p1000.push(sub);
      } else if (norm.amount >= 500 || norm.planName.toLowerCase().includes('600') || norm.planName.toLowerCase().includes('3 month')) {
        p600.push(sub);
      } else {
        p200.push(sub);
      }
    }

    return {
      approvedAll: approved,
      plan200Members: p200,
      plan600Members: p600,
      plan1000Members: p1000,
    };
  }, [submissions]);

  // Handle Plan Checkbox Toggling
  const handleTogglePlan = (planKey: 'all' | '200' | '600' | '1000' | 'single') => {
    if (planKey === 'single') {
      setTargetPlan('single');
      setSelectedPlans(['single']);
      return;
    }

    if (planKey === 'all') {
      if (selectedPlans.includes('all')) {
        setSelectedPlans([]);
        setTargetPlan('200');
      } else {
        setSelectedPlans(['all', '200', '600', '1000']);
        setTargetPlan('all');
      }
      return;
    }

    let next = selectedPlans.filter((p) => p !== 'all' && p !== 'single');
    if (next.includes(planKey)) {
      next = next.filter((p) => p !== planKey);
    } else {
      next.push(planKey);
    }

    if (next.length === 3) {
      setSelectedPlans(['all', '200', '600', '1000']);
      setTargetPlan('all');
    } else if (next.length === 0) {
      setSelectedPlans([]);
      setTargetPlan('all');
    } else {
      setSelectedPlans(next);
      setTargetPlan(next[0] as SmsTargetPlan);
    }
  };

  // 2. Compute Active Recipient List based on Plan Target & Multi-Checkboxes
  const activeRecipients = useMemo(() => {
    if (selectedPlans.includes('single') || targetPlan === 'single') {
      const targetP = singlePhone || customPhone;
      if (!targetP) return [];
      const found = approvedAll.find((s) => s.userPhone === targetP || s.userPhone.includes(targetP));
      if (found) return [found];
      return [{
        id: 'manual',
        userId: 'manual',
        userName: 'Member',
        userEmail: '',
        userPhone: targetP,
        planName: 'Daily Devotional',
        amount: 200,
        currency: 'ETB',
        payerName: '',
        transactionId: '',
        screenshotUrl: '',
        status: 'approved',
        submittedAt: new Date().toISOString(),
      } as PaymentSubmission];
    }

    if (selectedPlans.includes('all')) {
      return approvedAll;
    }

    const list: PaymentSubmission[] = [];
    const seenIds = new Set<string>();

    if (selectedPlans.includes('200')) {
      for (const m of plan200Members) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          list.push(m);
        }
      }
    }
    if (selectedPlans.includes('600')) {
      for (const m of plan600Members) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          list.push(m);
        }
      }
    }
    if (selectedPlans.includes('1000')) {
      for (const m of plan1000Members) {
        if (!seenIds.has(m.id)) {
          seenIds.add(m.id);
          list.push(m);
        }
      }
    }

    return list;
  }, [selectedPlans, targetPlan, approvedAll, plan200Members, plan600Members, plan1000Members, singlePhone, customPhone]);

  // Quick Test SMS Handler
  const handleSendQuickTest = async () => {
    const phone = quickTestPhone.trim();
    if (!phone) {
      error('Phone Required', 'Please enter a test phone number (e.g. 0911223344).');
      return;
    }
    if (!messageText.trim()) {
      error('Empty Message', 'Please enter your message in Step 3 before sending a test.');
      return;
    }
    setIsSendingQuickTest(true);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipients: [{ name: 'Admin Test', phone, planName: 'Test SMS' }],
          message: messageText,
          gatewayConfig: {
            ...gatewayConfig,
            batchSize: 1,
            batchDelayMs: 0,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        success('Test SMS Delivered!', `Preview message dispatched to ${phone}.`);
      } else {
        error('Test Failed', data.error || 'Gateway returned an error.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error.';
      error('Test Failed', msg);
    } finally {
      setIsSendingQuickTest(false);
    }
  };

  // 3. Load Gateway Config & Schedules on Mount
  useEffect(() => {
    fetchGatewayConfig();
    fetchScheduledCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGatewayConfig = async () => {
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/sms/config', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setGatewayConfig((prev) => ({
            ...prev,
            ...data.config,
            apiKey: data.config.apiKey || prev.apiKey,
          }));
          if (data.config.batchSize) setBatchSize(data.config.batchSize);
          if (data.config.batchDelayMs) setBatchDelayMs(data.config.batchDelayMs);
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchScheduledCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      const token = getAdminToken();
      const res = await fetch('/api/admin/sms/schedules', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.campaigns)) {
          setCampaigns(data.campaigns);
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  // Helper to insert placeholders into textarea cleanly with smart spacing
  const insertPlaceholder = (tag: string) => {
    if (!textareaRef.current) {
      setMessageText((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
      return;
    }
    const el = textareaRef.current;
    const start = el.selectionStart ?? messageText.length;
    const end = el.selectionEnd ?? messageText.length;

    // Check surrounding characters to avoid squishing tags together
    const prevChar = start > 0 ? messageText[start - 1] : '';
    const nextChar = end < messageText.length ? messageText[end] : '';

    const needLeadingSpace = prevChar && !/\s/.test(prevChar);
    const needTrailingSpace = nextChar && !/\s/.test(nextChar);

    const insertion = `${needLeadingSpace ? ' ' : ''}${tag}${needTrailingSpace ? ' ' : ' '}`;
    const next = messageText.substring(0, start) + insertion + messageText.substring(end);
    setMessageText(next);
    setTimeout(() => {
      el.focus();
      const nextPos = start + insertion.length;
      el.setSelectionRange(nextPos, nextPos);
    }, 50);
  };

  // Template Management Handlers
  const handleOpenNewTemplateModal = (initialText?: string) => {
    setEditingTemplateId(null);
    setModalTitle('');
    setModalTag('Scripture');
    setModalText(initialText ?? (messageText || ''));
    setIsTemplateModalOpen(true);
  };

  const handleOpenEditTemplateModal = (tmpl: SmsCustomTemplate) => {
    setEditingTemplateId(tmpl.id);
    setModalTitle(tmpl.title);
    setModalTag(tmpl.tag);
    setModalText(tmpl.text);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = (andUseInComposer = false) => {
    if (!modalTitle.trim()) {
      error('Title Required', 'Please enter a name or label for this sample text.');
      return;
    }
    if (!modalText.trim()) {
      error('Content Required', 'Please enter the message body for this sample text.');
      return;
    }

    if (editingTemplateId) {
      setCustomTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplateId
            ? {
                ...t,
                title: modalTitle.trim(),
                tag: modalTag.trim() || 'Custom',
                text: modalText.trim(),
              }
            : t
        )
      );
      success('Template Updated', `"${modalTitle.trim()}" has been updated.`);
    } else {
      const newTmpl: SmsCustomTemplate = {
        id: `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: modalTitle.trim(),
        tag: modalTag.trim() || 'Custom',
        text: modalText.trim(),
        createdAt: new Date().toISOString(),
      };
      setCustomTemplates((prev) => [newTmpl, ...prev]);
      success('Sample Text Saved', `"${newTmpl.title}" is saved and ready for instant broadcast or schedules.`);
    }

    if (andUseInComposer) {
      setMessageText(modalText.trim());
    }

    setIsTemplateModalOpen(false);
  };

  const handleDeleteTemplate = (id: string, title: string) => {
    setCustomTemplates((prev) => prev.filter((t) => t.id !== id));
    info('Sample Text Removed', `"${title}" has been deleted.`);
  };

  const handleUseTemplateInSchedule = (tmpl: SmsCustomTemplate) => {
    setMessageText(tmpl.text);
    setCampaignTitle(`${tmpl.title} Campaign`);
    setDispatchMode('schedule');
    setOpenMenuSections((prev) => ({ ...prev, mode: true }));
    success('Loaded for Schedule', `"${tmpl.title}" is ready in the Campaign Scheduler.`);
    const step2El = document.getElementById('step-2-dispatch-mode');
    if (step2El) {
      step2El.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const insertModalPlaceholder = (token: string) => {
    const textarea = modalTextareaRef.current;
    if (!textarea) {
      setModalText((prev) => (prev ? `${prev.trim()} ${token} ` : `${token} `));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const prev = modalText;

    const needsSpaceBefore = start > 0 && prev[start - 1] !== ' ' && prev[start - 1] !== '\n';
    const needsSpaceAfter = end < prev.length && prev[end] !== ' ' && prev[end] !== '\n';
    const insertion = `${needsSpaceBefore ? ' ' : ''}${token}${needsSpaceAfter ? ' ' : ' '}`;

    const updated = prev.substring(0, start) + insertion + prev.substring(end);
    setModalText(updated);

    setTimeout(() => {
      textarea.focus();
      const newCursor = start + insertion.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  // 4. CHUNKED BATCH DISPATCH ENGINE
  const handleStartBatchDispatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageText.trim()) {
      error('Empty Message', 'Please provide scripture text or message content before sending.');
      return;
    }

    if (activeRecipients.length === 0) {
      error('No Recipients', 'There are no approved numbers matching the selected audience plan.');
      return;
    }

    // Split recipient list into safe chunks
    const safeChunkSize = Math.max(10, Math.min(200, batchSize));
    const chunks: PaymentSubmission[][] = [];
    for (let i = 0; i < activeRecipients.length; i += safeChunkSize) {
      chunks.push(activeRecipients.slice(i, i + safeChunkSize));
    }

    const totalRecipients = activeRecipients.length;
    const totalBatches = chunks.length;

    // Reset loop control flags
    isPausedRef.current = false;
    isCancelledRef.current = false;

    setProgress({
      isDispatching: true,
      totalRecipients,
      totalBatches,
      currentBatch: 0,
      sentCount: 0,
      failedCount: 0,
      statusText: `Preparing ${totalBatches} chunks for ${totalRecipients} subscribers...`,
      isPaused: false,
      startTime: Date.now(),
    });

    const token = getAdminToken();
    let overallSent = 0;
    let overallFailed = 0;
    const newLogs: SmsLogItem[] = [];

    for (let bIndex = 0; bIndex < chunks.length; bIndex++) {
      // Check cancellation
      if (isCancelledRef.current) {
        info('Dispatch Stopped', 'SMS transmission was stopped by administrator.');
        break;
      }

      // Handle pause loop
      while (isPausedRef.current) {
        await new Promise((r) => setTimeout(r, 400));
        if (isCancelledRef.current) break;
      }
      if (isCancelledRef.current) break;

      const currentChunk = chunks[bIndex];
      const batchNumber = bIndex + 1;

      setProgress((prev) => ({
        ...prev,
        currentBatch: batchNumber,
        statusText: `Dispatching Batch ${batchNumber} of ${totalBatches} (${currentChunk.length} numbers)...`,
      }));

      try {
        const res = await fetch('/api/admin/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            recipients: currentChunk.map((r) => ({
              name: r.userName,
              phone: r.userPhone,
              planName: r.planName,
              amount: r.amount,
            })),
            message: messageText,
            batchIndex: batchNumber,
            totalBatches,
            gatewayConfig: {
              ...gatewayConfig,
              batchSize,
              batchDelayMs,
            },
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          const sentInBatch = Number(data.sentCount) || currentChunk.length;
          overallSent += sentInBatch;

          // Record logs
          const segments = Math.ceil(messageText.length / 160) || 1;
          for (const recipient of currentChunk) {
            newLogs.unshift({
              id: `sms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              recipientPhone: recipient.userPhone,
              recipientName: recipient.userName,
              messageText,
              sentAt: new Date().toISOString(),
              status: 'Delivered',
              segmentCount: segments,
            });
          }
        } else {
          overallFailed += currentChunk.length;
          console.warn(`Batch ${batchNumber} gateway error:`, data.error);
        }
      } catch (err: unknown) {
        overallFailed += currentChunk.length;
        console.error(`Batch ${batchNumber} transmission exception:`, err);
      }

      setProgress((prev) => ({
        ...prev,
        sentCount: overallSent,
        failedCount: overallFailed,
      }));

      // Throttle delay between chunks to protect gateway socket limits
      if (bIndex < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, Math.max(150, batchDelayMs)));
      }
    }

    // Persist logs in state and local storage
    if (newLogs.length > 0) {
      setSmsLogs((prev) => {
        const combined = [...newLogs, ...prev].slice(0, 500);
        if (typeof window !== 'undefined') {
          localStorage.setItem('nazazi_sms_logs', JSON.stringify(combined));
        }
        return combined;
      });
    }

    setProgress((prev) => ({
      ...prev,
      isDispatching: false,
      statusText: `Transmission Completed: ${overallSent} delivered successfully, ${overallFailed} failed.`,
    }));

    if (overallSent > 0) {
      success(
        'Batch SMS Dispatch Complete!',
        `Successfully delivered to ${overallSent} approved members in ${totalBatches} chunks.`
      );
    } else {
      error('Dispatch Incomplete', 'Could not transmit messages through the selected gateway.');
    }
  };

  const handleTogglePause = () => {
    const nextState = !progress.isPaused;
    isPausedRef.current = nextState;
    setProgress((prev) => ({
      ...prev,
      isPaused: nextState,
      statusText: nextState ? 'Transmission paused by user.' : 'Resuming batch transmission...',
    }));
  };

  const handleCancelDispatch = () => {
    isCancelledRef.current = true;
    isPausedRef.current = false;
    setProgress((prev) => ({
      ...prev,
      isDispatching: false,
      isPaused: false,
      statusText: 'Transmission cancelled.',
    }));
  };

  // 5. SCHEDULE RECURRING CAMPAIGN CREATION
  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      error('Empty Template', 'Please enter scripture or devotional text for the scheduled campaign.');
      return;
    }

    setIsCreatingSchedule(true);
    const token = getAdminToken();

    const planLabel =
      targetPlan === '200'
        ? '200 ETB (Monthly)'
        : targetPlan === '600'
        ? '600 ETB (Quarterly)'
        : targetPlan === '1000'
        ? '1000 ETB (VIP)'
        : 'All Approved';

    const defaultTitle =
      campaignTitle.trim() ||
      `${planLabel} Morning Scripture (${scheduleDuration.replace('_', ' ')})`;

    try {
      const res = await fetch('/api/admin/sms/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: defaultTitle,
          targetPlan,
          targetCount: activeRecipients.length,
          duration: scheduleDuration,
          dailyTime: scheduleDailyTime,
          startDate: scheduleStartDate,
          messageTemplate: messageText,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success('Campaign Scheduled!', data.message || 'Scheduled campaign activated.');
        setCampaignTitle('');
        setActiveSubTab('schedules');
        fetchScheduledCampaigns();
      } else {
        error('Scheduling Failed', data.error || 'Could not schedule campaign.');
      }
    } catch {
      error('Network Error', 'Could not reach server to schedule campaign.');
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  // Campaign Actions (Trigger now, Pause, Delete)
  const handleToggleCampaignStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    const token = getAdminToken();
    try {
      const res = await fetch('/api/admin/sms/schedules', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setCampaigns((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus as any } : c)));
        info(`Campaign ${newStatus === 'active' ? 'Resumed' : 'Paused'}`);
      }
    } catch {
      error('Update Failed', 'Could not update campaign status.');
    }
  };

  const handleRunCampaignNow = async (campaign: SmsScheduledCampaign) => {
    const token = getAdminToken();
    try {
      info('Running Broadcast...', `Sending today's scheduled batch for "${campaign.title}"`);
      // Update run counter
      await fetch('/api/admin/sms/schedules', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: campaign.id, runNow: true }),
      });

      // Execute broadcast to matching recipients
      const recipients =
        campaign.targetPlan === '200'
          ? plan200Members
          : campaign.targetPlan === '600'
          ? plan600Members
          : campaign.targetPlan === '1000'
          ? plan1000Members
          : approvedAll;

      await fetch('/api/admin/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipients: recipients.map((r) => ({
            name: r.userName,
            phone: r.userPhone,
            planName: r.planName,
            amount: r.amount,
          })),
          message: campaign.messageTemplate,
          batchIndex: 1,
          totalBatches: 1,
        }),
      });

      success('Broadcast Sent!', `Executed broadcast for ${recipients.length} members.`);
      fetchScheduledCampaigns();
    } catch {
      error('Execution Failed', 'Could not run scheduled campaign now.');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    const token = getAdminToken();
    try {
      const res = await fetch(`/api/admin/sms/schedules?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        success('Campaign Removed', 'Scheduled campaign was deleted successfully.');
      }
    } catch {
      error('Delete Failed', 'Could not remove scheduled campaign.');
    }
  };

  // 6. SAVE GATEWAY SETTINGS
  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGateway(true);
    const token = getAdminToken();

    try {
      const res = await fetch('/api/admin/sms/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          provider: gatewayConfig.provider,
          apiUrl: gatewayConfig.apiUrl,
          apiKey: gatewayConfig.apiKey,
          senderId: gatewayConfig.senderId,
          authHeader: gatewayConfig.authHeader,
          batchSize,
          batchDelayMs,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        success('Gateway Saved', 'SMS API Gateway configuration updated.');
      } else {
        error('Save Failed', data.error || 'Could not save gateway settings.');
      }
    } catch {
      error('Error', 'Could not reach server to save gateway settings.');
    } finally {
      setIsSavingGateway(false);
    }
  };

  // Test Connection
  const handleTestGateway = async () => {
    if (!testPhone.trim()) {
      error('Phone Required', 'Please enter a test phone number (e.g. 0912345678).');
      return;
    }
    setIsTestingGateway(true);
    setTestResult(null);
    const token = getAdminToken();

    try {
      const res = await fetch('/api/admin/sms/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          testPhone: testPhone.trim(),
          testMessage: `Nazazi SMS Gateway Verification: Connected to ${gatewayConfig.senderId || 'NAZAZI'}. Test delivered successfully.`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Success! Test message dispatched via ${data.provider} to ${testPhone}.`,
        });
        success('Connection Verified', `Test SMS dispatched successfully via ${data.provider}.`);
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Gateway returned an error. Check API URL and Key.',
        });
        error('Test Failed', data.error || 'Gateway returned failure.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error during test';
      setTestResult({ success: false, message: msg });
      error('Test Error', msg);
    } finally {
      setIsTestingGateway(false);
    }
  };

  // Unicode-aware character and segment calculator (Amharic uses 70 chars/segment, Latin uses 160 chars)
  const isUnicodeMessage = /[^\u0000-\u00ff]/.test(messageText);
  const charsPerSegment = isUnicodeMessage ? 70 : 160;
  const currentSegmentCount = Math.ceil(messageText.length / charsPerSegment) || 1;
  const charsRemainingInSegment =
    messageText.length === 0
      ? charsPerSegment
      : charsPerSegment - (messageText.length % charsPerSegment || charsPerSegment);

  // Live Phone Preview Formatter
  const previewMessage = useMemo(() => {
    const sampleName =
      targetPlan === 'single' && (singlePhone || customPhone)
        ? approvedAll.find((s) => s.userPhone === (singlePhone || customPhone))?.userName || 'Abebe Kebede'
        : 'Abebe Kebede';
    const sampleDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return (
      messageText
        .replace(/{name}/g, sampleName)
        .replace(/{date}/g, sampleDate) || 'Good morning! Nazazi blessing...'
    );
  }, [messageText, targetPlan, singlePhone, customPhone, approvedAll]);

  const dispatchPercentage =
    progress.totalRecipients > 0
      ? Math.round(((progress.sentCount + progress.failedCount) / progress.totalRecipients) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Clean Sub-Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-[15px] bg-[#F3EFEA] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825]">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('dispatcher')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[15px] text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'dispatcher'
                ? 'bg-white dark:bg-[#2A2624] text-[#24211F] dark:text-[#FAF8F5] shadow-xs'
                : 'text-[#706A65] dark:text-[#A8A29D] hover:text-[#24211F] dark:hover:text-[#FAF8F5] hover:bg-white/50 dark:hover:bg-[#24211F]'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Compose SMS</span>
            <span className="px-1.5 py-0.5 rounded-[15px] bg-[#FAF8F5] dark:bg-[#1E1B19] font-mono text-[10px]">
              {approvedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('schedules')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[15px] text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'schedules'
                ? 'bg-white dark:bg-[#2A2624] text-[#24211F] dark:text-[#FAF8F5] shadow-xs'
                : 'text-[#706A65] dark:text-[#A8A29D] hover:text-[#24211F] dark:hover:text-[#FAF8F5] hover:bg-white/50 dark:hover:bg-[#24211F]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Scheduled Campaigns</span>
            {campaigns.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-[15px] bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                {campaigns.filter((c) => c.status === 'active').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('gateway')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[15px] text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'gateway'
                ? 'bg-white dark:bg-[#2A2624] text-[#24211F] dark:text-[#FAF8F5] shadow-xs'
                : 'text-[#706A65] dark:text-[#A8A29D] hover:text-[#24211F] dark:hover:text-[#FAF8F5] hover:bg-white/50 dark:hover:bg-[#24211F]'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Gateway Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('logs')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[15px] text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'logs'
                ? 'bg-white dark:bg-[#2A2624] text-[#24211F] dark:text-[#FAF8F5] shadow-xs'
                : 'text-[#706A65] dark:text-[#A8A29D] hover:text-[#24211F] dark:hover:text-[#FAF8F5] hover:bg-white/50 dark:hover:bg-[#24211F]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Logs</span>
            <span className="px-1.5 py-0.5 rounded-[15px] bg-[#FAF8F5] dark:bg-[#1E1B19] font-mono text-[10px]">
              {smsLogs.length}
            </span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-[#706A65] dark:text-[#A8A29D] pr-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>Gateway Ready ({gatewayConfig.provider === 'generic_http' ? 'Custom API' : gatewayConfig.provider})</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: BULK DISPATCHER & SCHEDULER */}
      {/* ========================================================================= */}
      {activeSubTab === 'dispatcher' && (
        <div className="space-y-6">
          {/* Real-Time Live Dispatch Progress Card (When Active) */}
          {progress.isDispatching && (
            <Card className="p-6 bg-[#141211] text-[#FAF8F5] border-[#2C2825] rounded-[15px] shadow-xl space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                      Live Chunked SMS Transmission
                    </h3>
                    <Badge variant="emerald" className="text-[10px] rounded-[15px]">
                      Batch {progress.currentBatch} of {progress.totalBatches}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#A8A29D] font-mono">{progress.statusText}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleTogglePause}
                    className="border-[#2C2825] text-[#FAF8F5] hover:bg-[#1E1B19] text-xs rounded-[15px]"
                    leftIcon={progress.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  >
                    {progress.isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={handleCancelDispatch}
                    className="text-xs rounded-[15px]"
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#D1CBC5]">
                  <span>
                    Delivered: <strong>{progress.sentCount}</strong> / {progress.totalRecipients}
                  </span>
                  <span>{dispatchPercentage}%</span>
                </div>
                <div className="w-full h-2 rounded-[15px] bg-[#2C2825] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                    style={{ width: `${Math.max(3, dispatchPercentage)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#2C2825] text-center">
                <div className="p-2 rounded-[15px] bg-[#1E1B19] border border-[#2C2825]">
                  <p className="text-[10px] text-[#A8A29D] uppercase font-semibold">Current Batch</p>
                  <p className="text-sm font-bold text-[#FAF8F5]">
                    {progress.currentBatch} / {progress.totalBatches}
                  </p>
                </div>
                <div className="p-2 rounded-[15px] bg-[#1E1B19] border border-[#2C2825]">
                  <p className="text-[10px] text-emerald-400 uppercase font-semibold">Sent Successfully</p>
                  <p className="text-sm font-bold text-emerald-400">{progress.sentCount}</p>
                </div>
                <div className="p-2 rounded-[15px] bg-[#1E1B19] border border-[#2C2825]">
                  <p className="text-[10px] text-rose-400 uppercase font-semibold">Failed / Dropped</p>
                  <p className="text-sm font-bold text-rose-400">{progress.failedCount}</p>
                </div>
                <div className="p-2 rounded-[15px] bg-[#1E1B19] border border-[#2C2825]">
                  <p className="text-[10px] text-[#A8A29D] uppercase font-semibold">Batch Chunk Size</p>
                  <p className="text-sm font-bold text-[#FAF8F5]">{batchSize} / req</p>
                </div>
              </div>
            </Card>
          )}

          {/* Main 2-Column Command Grid: Left Menu (Steps 1, 2, 4) & Right Message Studio (Step 3) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ========================================================================= */}
            {/* LEFT COLUMN: COMMAND MENU & WORKFLOW (Steps 1, 2, 4) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              {/* ----------------------------------------------------------------------- */}
              {/* UNIFIED MENU: DROPDOWN ACCORDIONS (Audience, Mode, Gateway & Dispatch) */}
              {/* ----------------------------------------------------------------------- */}
              <Card className="bg-white dark:bg-[#181615] border border-[#E8E4DF] dark:border-[#2C2825] rounded-[15px] shadow-xs overflow-hidden">
                {/* Menu Header */}
                <div className="p-4 sm:p-5 border-b border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5]/80 dark:bg-[#1C1A18]/80 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[15px] bg-[#981C00]/10 dark:bg-[#981C00]/25 text-[#981C00] dark:text-[#E89382] flex items-center justify-center font-bold text-xs">
                      <Sliders className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-serif font-bold text-[#24211F] dark:text-[#FAF8F5]">
                        Menu
                      </h2>
                      <p className="text-[11px] text-[#706A65] dark:text-[#A8A29D]">
                        Configure audience, dispatch mode & gateway
                      </p>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[15px] text-[11px] font-bold border ${
                    activeRecipients.length > 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-[#F3EFEA] dark:bg-[#1E1B19] text-[#706A65] dark:text-[#A8A29D] border-[#E8E4DF] dark:border-[#2C2825]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${activeRecipients.length > 0 ? 'bg-emerald-600' : 'bg-[#706A65]'}`} />
                    {activeRecipients.length} Selected
                  </span>
                </div>

                {/* Dropdown Accordion Sections */}
                <div className="divide-y divide-[#E8E4DF] dark:divide-[#2C2825]">
                  {/* =================================================================== */}
                  {/* DROPDOWN 1: AUDIENCE & PLANS */}
                  {/* =================================================================== */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleMenuSection('audience')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-[15px] bg-[#F3EFEA] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] text-[#981C00] dark:text-[#E89382] flex items-center justify-center font-bold text-xs">
                          1
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-serif font-bold text-[#24211F] dark:text-[#FAF8F5]">
                              Audience & Plans
                            </span>
                          </div>
                          <p className="text-[11px] text-[#706A65] dark:text-[#A8A29D]">
                            {selectedPlans.length === 0
                              ? 'No plans selected'
                              : `${selectedPlans.length} target group${selectedPlans.length > 1 ? 's' : ''} active`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-[#981C00] dark:text-[#E89382] px-2 py-0.5 rounded-[15px] bg-[#F3EFEA] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825]">
                          {activeRecipients.length}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[#706A65] dark:text-[#A8A29D] transition-transform duration-200 ${openMenuSections.audience ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {openMenuSections.audience && (
                      <div className="p-4 pt-2 sm:p-5 sm:pt-2 space-y-3 animate-in fade-in">
                        {/* Plan Checkbox Menu List */}
                        <div className="space-y-1">
                          {/* 1. All Approved Members Checkbox */}
                          <Checkbox
                            checked={selectedPlans.includes('all')}
                            indeterminate={selectedPlans.length > 0 && selectedPlans.length < 4 && !selectedPlans.includes('all')}
                            onCheckedChange={() => handleTogglePlan('all')}
                            label="All Approved Members"
                            description="Broadcast to all active subscribers across all tiers"
                            icon={<Users className="w-3.5 h-3.5" />}
                            badge={
                              <span className="text-[11px] font-mono font-bold text-[#981C00] dark:text-[#E89382] px-1.5 py-0.5 rounded-[2px] bg-[#F3EFEA] dark:bg-[#201D1B]">
                                {approvedAll.length}
                              </span>
                            }
                          />

                          {/* 2. 200 ETB Plan Checkbox */}
                          <Checkbox
                            checked={selectedPlans.includes('200')}
                            onCheckedChange={() => handleTogglePlan('200')}
                            label="200 ETB Plan"
                            description="Tier 1 standard members"
                            icon={<BookOpen className="w-3.5 h-3.5" />}
                            badge={
                              <span className="text-[11px] font-mono font-bold text-[#706A65] dark:text-[#A8A29D] px-1.5 py-0.5 rounded-[2px] bg-[#F3EFEA] dark:bg-[#201D1B]">
                                {plan200Members.length}
                              </span>
                            }
                          />

                          {/* 3. 600 ETB Plan Checkbox */}
                          <Checkbox
                            checked={selectedPlans.includes('600')}
                            onCheckedChange={() => handleTogglePlan('600')}
                            label="600 ETB Plan"
                            description="Tier 2 supporter members"
                            icon={<Heart className="w-3.5 h-3.5" />}
                            badge={
                              <span className="text-[11px] font-mono font-bold text-[#706A65] dark:text-[#A8A29D] px-1.5 py-0.5 rounded-[2px] bg-[#F3EFEA] dark:bg-[#201D1B]">
                                {plan600Members.length}
                              </span>
                            }
                          />

                          {/* 4. 1,000 ETB VIP Checkbox */}
                          <Checkbox
                            checked={selectedPlans.includes('1000')}
                            onCheckedChange={() => handleTogglePlan('1000')}
                            label="1,000 ETB VIP"
                            description="Tier 3 patron members"
                            icon={<Crown className="w-3.5 h-3.5" />}
                            badge={
                              <span className="text-[11px] font-mono font-bold text-[#706A65] dark:text-[#A8A29D] px-1.5 py-0.5 rounded-[2px] bg-[#F3EFEA] dark:bg-[#201D1B]">
                                {plan1000Members.length}
                              </span>
                            }
                          />

                          {/* 5. Single Direct Phone Option */}
                          <Checkbox
                            checked={selectedPlans.includes('single')}
                            onCheckedChange={() => handleTogglePlan('single')}
                            label="Single Direct Phone"
                            description="Send to one specific member or phone number"
                            icon={<Smartphone className="w-3.5 h-3.5" />}
                            badge={
                              <span className="text-[10px] text-[#706A65] dark:text-[#A8A29D]">
                                {selectedPlans.includes('single') ? 'Active' : 'Direct'}
                              </span>
                            }
                          />
                        </div>

                        {/* Single Member Direct Input Area */}
                        {selectedPlans.includes('single') && (
                          <div className="pt-2 space-y-2.5 animate-in fade-in">
                            <div>
                              <label className="block text-[11px] font-semibold text-[#706A65] dark:text-[#A8A29D] mb-1">
                                Choose Approved Member ({approvedAll.length})
                              </label>
                              <select
                                value={singlePhone}
                                onChange={(e) => {
                                  setSinglePhone(e.target.value);
                                  setCustomPhone('');
                                }}
                                className="w-full p-2 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] text-xs text-[#24211F] dark:text-[#FAF8F5] focus:ring-1 focus:ring-[#981C00]"
                              >
                                <option value="">-- Choose Member ({approvedAll.length}) --</option>
                                {approvedAll.map((sub) => (
                                  <option key={sub.id} value={sub.userPhone}>
                                    {sub.userName} ({sub.userPhone})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-[#706A65] dark:text-[#A8A29D] mb-1">
                                Or Type Direct Phone Number
                              </label>
                              <input
                                type="tel"
                                placeholder="0911223344"
                                value={customPhone}
                                onChange={(e) => {
                                  setCustomPhone(e.target.value);
                                  setSinglePhone('');
                                }}
                                className="w-full p-2 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] text-xs text-[#24211F] dark:text-[#FAF8F5] font-mono focus:ring-1 focus:ring-[#981C00]"
                              />
                            </div>
                          </div>
                        )}

                        {/* Quick Action Buttons */}
                        <div className="flex items-center justify-between gap-2 pt-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPlans(['all', '200', '600', '1000']);
                                setTargetPlan('all');
                              }}
                              className="px-2 py-1 rounded-[15px] text-[11px] font-semibold bg-[#F3EFEA] dark:bg-[#1E1B19] hover:bg-[#E8E4DF] dark:hover:bg-[#2C2825] text-[#24211F] dark:text-[#FAF8F5] transition-colors cursor-pointer"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPlans([]);
                                setTargetPlan('200');
                              }}
                              className="px-2 py-1 rounded-[15px] text-[11px] font-semibold text-[#706A65] dark:text-[#A8A29D] hover:text-rose-600 transition-colors cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowRecipientList(!showRecipientList)}
                            className="text-[11px] font-bold text-[#981C00] dark:text-[#E89382] hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>{showRecipientList ? 'Hide List' : `View List (${activeRecipients.length})`}</span>
                          </button>
                        </div>

                        {/* Expandable Recipient List Preview */}
                        {showRecipientList && (
                          <div className="pt-2 space-y-2 animate-in fade-in">
                            <input
                              type="text"
                              placeholder="Filter selected recipients..."
                              value={recipientSearch}
                              onChange={(e) => setRecipientSearch(e.target.value)}
                              className="w-full p-1.5 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#141211] text-xs text-[#24211F] dark:text-[#FAF8F5]"
                            />
                            <div className="max-h-40 overflow-y-auto divide-y divide-[#E8E4DF] dark:divide-[#2C2825] rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615]">
                              {activeRecipients
                                .filter((r) =>
                                  !recipientSearch
                                    ? true
                                    : r.userName.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                                      r.userPhone.includes(recipientSearch)
                                )
                                .map((r, i) => (
                                  <div key={r.id || i} className="p-2 flex items-center justify-between text-[11px]">
                                    <div>
                                      <span className="font-bold text-[#24211F] dark:text-[#FAF8F5] block line-clamp-1">
                                        {r.userName}
                                      </span>
                                      <span className="font-mono text-[#706A65] dark:text-[#A8A29D]">{r.userPhone}</span>
                                    </div>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[2px] bg-[#F3EFEA] dark:bg-[#201D1B] text-[#706A65] dark:text-[#A8A29D]">
                                      {r.planName || 'Member'}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* =================================================================== */}
                  {/* DROPDOWN 2: DISPATCH MODE */}
                  {/* =================================================================== */}
                  <div id="step-2-dispatch-mode">
                    <button
                      type="button"
                      onClick={() => toggleMenuSection('mode')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-[15px] bg-[#F3EFEA] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] text-[#981C00] dark:text-[#E89382] flex items-center justify-center font-bold text-xs">
                          2
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-serif font-bold text-[#24211F] dark:text-[#FAF8F5]">
                              Dispatch Mode
                            </span>
                          </div>
                          <p className="text-[11px] text-[#706A65] dark:text-[#A8A29D]">
                            {dispatchMode === 'instant' ? 'Instant broadcast mode' : `Scheduled for ${scheduleDailyTime}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-[#706A65] dark:text-[#A8A29D] px-2 py-0.5 rounded-[15px] bg-[#F3EFEA] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] capitalize">
                          {dispatchMode}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[#706A65] dark:text-[#A8A29D] transition-transform duration-200 ${openMenuSections.mode ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {openMenuSections.mode && (
                      <div className="p-4 pt-2 sm:p-5 sm:pt-2 space-y-3.5 animate-in fade-in">
                        {/* Mode Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDispatchMode('instant')}
                            className={`p-2.5 rounded-[15px] border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                              dispatchMode === 'instant'
                                ? 'bg-[#FAF8F5] dark:bg-[#1E1B19] border-2 border-[#981C00] dark:border-[#E89382] shadow-2xs'
                                : 'bg-white dark:bg-[#181615] border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#DDD7CF]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <Zap className="w-4 h-4 text-[#981C00] dark:text-[#E89382]" />
                              {dispatchMode === 'instant' && <Check className="w-3.5 h-3.5 text-[#981C00] dark:text-[#E89382] stroke-[3]" />}
                            </div>
                            <p className="text-xs font-bold text-[#24211F] dark:text-[#FAF8F5]">Instant Send</p>
                            <p className="text-[10px] text-[#706A65] dark:text-[#A8A29D]">Right now in safe chunks</p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDispatchMode('schedule')}
                            className={`p-2.5 rounded-[15px] border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1 ${
                              dispatchMode === 'schedule'
                                ? 'bg-[#FAF8F5] dark:bg-[#1E1B19] border-2 border-[#981C00] dark:border-[#E89382] shadow-2xs'
                                : 'bg-white dark:bg-[#181615] border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#DDD7CF]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <Calendar className="w-4 h-4 text-[#981C00] dark:text-[#E89382]" />
                              {dispatchMode === 'schedule' && <Check className="w-3.5 h-3.5 text-[#981C00] dark:text-[#E89382] stroke-[3]" />}
                            </div>
                            <p className="text-xs font-bold text-[#24211F] dark:text-[#FAF8F5]">Schedule</p>
                            <p className="text-[10px] text-[#706A65] dark:text-[#A8A29D]">Daily morning cycle</p>
                          </button>
                        </div>

                        {/* Scheduled Mode Form Inputs */}
                        {dispatchMode === 'schedule' && (
                          <div className="pt-2 space-y-3 animate-in fade-in">
                            <div>
                              <label className="block text-[11px] font-semibold text-[#706A65] dark:text-[#A8A29D] mb-1">
                                Campaign Duration
                              </label>
                              <select
                                value={scheduleDuration}
                                onChange={(e) => setScheduleDuration(e.target.value as any)}
                                className="w-full p-2 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] text-xs font-semibold text-[#24211F] dark:text-[#FAF8F5]"
                              >
                                <option value="1_week">1 Week (7 Days)</option>
                                <option value="3_weeks">3 Weeks (21 Days)</option>
                                <option value="1_month">1 Month (30 Days - Recommended)</option>
                              </select>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[11px] font-semibold text-[#706A65] dark:text-[#A8A29D] mb-1">
                                  Morning Time
                                </label>
                                <input
                                  type="time"
                                  value={scheduleDailyTime}
                                  onChange={(e) => setScheduleDailyTime(e.target.value)}
                                  className="w-full p-2 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] text-xs text-[#24211F] dark:text-[#FAF8F5] font-mono"
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-semibold text-[#706A65] dark:text-[#A8A29D] mb-1">
                                  Start Date
                                </label>
                                <input
                                  type="date"
                                  value={scheduleStartDate}
                                  onChange={(e) => setScheduleStartDate(e.target.value)}
                                  className="w-full p-2 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] text-xs text-[#24211F] dark:text-[#FAF8F5] font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-[#706A65] dark:text-[#A8A29D] mb-1">
                                Campaign Title
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. 30-Day Morning Scripture"
                                value={campaignTitle}
                                onChange={(e) => setCampaignTitle(e.target.value)}
                                className="w-full p-2 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] text-xs text-[#24211F] dark:text-[#FAF8F5]"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* =================================================================== */}
                  {/* DROPDOWN 3: GATEWAY & CHUNKING ENGINE */}
                  {/* =================================================================== */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleMenuSection('gateway')}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-[#FAF8F5] dark:hover:bg-[#1C1A18] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-[15px] bg-[#F3EFEA] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] text-[#981C00] dark:text-[#E89382] flex items-center justify-center font-bold text-xs">
                          3
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-serif font-bold text-[#24211F] dark:text-[#FAF8F5]">
                              Gateway & Chunking
                            </span>
                          </div>
                          <p className="text-[11px] text-[#706A65] dark:text-[#A8A29D]">
                            {batchSize} per req · {batchDelayMs}ms throttle
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-[#706A65] dark:text-[#A8A29D] px-2 py-0.5 rounded-[15px] bg-[#F3EFEA] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825]">
                          {batchSize}/req
                        </span>
                        <ChevronDown className={`w-4 h-4 text-[#706A65] dark:text-[#A8A29D] transition-transform duration-200 ${openMenuSections.gateway ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {openMenuSections.gateway && (
                      <div className="p-4 pt-2 sm:p-5 sm:pt-2 space-y-3.5 animate-in fade-in">
                        {/* 4 Chunk Buttons */}
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold text-[#706A65] dark:text-[#A8A29D]">
                            Batch Chunk Size:
                          </label>
                          <div className="grid grid-cols-4 gap-1.5">
                            {[
                              { size: 25, label: 'Safest' },
                              { size: 50, label: '★ Best' },
                              { size: 100, label: 'Fast' },
                              { size: 200, label: 'Bulk' },
                            ].map(({ size, label }) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setBatchSize(size)}
                                className={`p-2 rounded-[15px] border text-center transition-all cursor-pointer ${
                                  batchSize === size
                                    ? 'bg-[#981C00] text-white border-[#981C00] shadow-2xs font-bold'
                                    : 'bg-[#FAF8F5] dark:bg-[#1E1B19] border-[#E8E4DF] dark:border-[#2C2825] text-[#24211F] dark:text-[#FAF8F5] hover:border-[#981C00]/50'
                                }`}
                              >
                                <p className="text-xs font-mono font-bold">{size}</p>
                                <p className="text-[9px] opacity-80">{label}</p>
                              </button>
                            ))}
                          </div>
                          <p className="text-[10px] text-[#706A65] dark:text-[#A8A29D] font-mono pt-1">
                            Math: {activeRecipients.length} recipients ÷ {batchSize} = {Math.ceil((activeRecipients.length || 1) / batchSize)} {Math.ceil((activeRecipients.length || 1) / batchSize) === 1 ? 'batch' : 'batches'}
                          </p>
                        </div>

                        {/* Quick Test SMS Feature */}
                        <div className="pt-2 space-y-1.5">
                          <label className="block text-[11px] font-semibold text-[#706A65] dark:text-[#A8A29D]">
                            Send Quick Test SMS:
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="tel"
                              placeholder="0911223344"
                              value={quickTestPhone}
                              onChange={(e) => setQuickTestPhone(e.target.value)}
                              className="flex-1 p-2 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#181615] text-xs font-mono text-[#24211F] dark:text-[#FAF8F5]"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              isLoading={isSendingQuickTest}
                              onClick={handleSendQuickTest}
                              className="text-xs font-bold rounded-[15px] cursor-pointer"
                            >
                              Test
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Button Pinned at Bottom of Menu */}
                <div className="p-4 sm:p-5 border-t border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5]/60 dark:bg-[#161413]/60">
                  {dispatchMode === 'instant' ? (
                    <Button
                      type="button"
                      size="lg"
                      isLoading={progress.isDispatching}
                      onClick={handleStartBatchDispatch}
                      disabled={activeRecipients.length === 0}
                      className="w-full font-bold bg-[#981C00] text-white hover:bg-[#7A1D28] rounded-[15px] py-3 text-xs sm:text-sm shadow-xs cursor-pointer disabled:opacity-50"
                      leftIcon={<Send className="w-4 h-4" />}
                    >
                      Send Message ({activeRecipients.length})
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="lg"
                      isLoading={isCreatingSchedule}
                      onClick={handleCreateSchedule}
                      disabled={activeRecipients.length === 0}
                      className="w-full font-bold bg-[#981C00] text-white hover:bg-[#7A1D28] rounded-[15px] py-3 text-xs sm:text-sm shadow-xs cursor-pointer disabled:opacity-50"
                      leftIcon={<Calendar className="w-4 h-4" />}
                    >
                      Schedule Campaign ({activeRecipients.length})
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* ========================================================================= */}
            {/* RIGHT COLUMN: STEP 3 (MESSAGE CONTENT, VARIABLES & LIVE PHONE PREVIEW) */}
            {/* ========================================================================= */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
              <Card className="p-5 sm:p-6 bg-white dark:bg-[#181615] border border-[#E8E4DF] dark:border-[#2C2825] rounded-[15px] shadow-xs space-y-5">
                {/* Step Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E8E4DF] dark:border-[#2C2825]">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-[15px] bg-[#981C00]/10 dark:bg-[#981C00]/25 text-[#981C00] dark:text-[#E89382] flex items-center justify-center font-bold text-xs">
                      3
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-serif font-bold text-[#24211F] dark:text-[#F3EFEA]">
                        Step 3. Message Content & Dynamic Variables
                      </h2>
                      <p className="text-xs text-[#706A65] dark:text-[#A8A29D]">
                        Craft or select an inspired faith message. Real-time preview renders dynamic tags automatically.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2-Column Responsive Layout: Left Composer, Right Phone Preview */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  {/* Left Column: Composer (7 cols on XL) */}
                  <div className="xl:col-span-7 space-y-4">
                    {/* Saved Sample Texts & Custom Samples */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="block text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">
                            Sample Texts & Templates:
                          </span>
                          <span className="text-[11px] text-[#706A65] dark:text-[#A8A29D]">
                            {customTemplates.length === 0
                              ? 'Create your own sample texts to use for instant broadcasts or recurring schedules.'
                              : 'Select a sample text below to load it into the composer or campaign scheduler.'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {messageText.trim().length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenNewTemplateModal(messageText)}
                              className="px-2.5 py-1 rounded-[15px] text-xs font-semibold bg-[#FAF8F5] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#981C00] text-[#24211F] dark:text-[#F3EFEA] transition-colors cursor-pointer flex items-center gap-1"
                              title="Save current message as a reusable sample"
                            >
                              <BookmarkPlus className="w-3.5 h-3.5 text-[#981C00] dark:text-[#E89382]" />
                              <span>Save Draft</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenNewTemplateModal()}
                            className="px-3 py-1 rounded-[15px] text-xs font-bold bg-[#981C00] hover:bg-[#7A1D28] text-white shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Sample</span>
                          </button>
                        </div>
                      </div>

                      {customTemplates.length === 0 ? (
                        <div className="p-4 rounded-[15px] border border-dashed border-[#DDD7CF] dark:border-[#2C2825] bg-[#FAF8F5]/60 dark:bg-[#1E1B19]/30 text-center space-y-2">
                          <div className="w-8 h-8 mx-auto rounded-[15px] bg-[#F3EFEA] dark:bg-[#2C2825] flex items-center justify-center text-[#706A65] dark:text-[#A8A29D]">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#24211F] dark:text-[#F3EFEA]">
                              No sample texts saved yet
                            </p>
                            <p className="text-[11px] text-[#706A65] dark:text-[#A8A29D] max-w-sm mx-auto">
                              Add scriptures, devotional greetings, or announcements with dynamic placeholders like &#123;name&#125; and &#123;date&#125; to reuse in instant and scheduled campaigns.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenNewTemplateModal()}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[15px] text-xs font-bold bg-[#981C00] hover:bg-[#7A1D28] text-white cursor-pointer shadow-xs transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add Sample Text</span>
                          </button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {customTemplates.map((tmpl) => {
                            const isSelected = messageText === tmpl.text;
                            return (
                              <div
                                key={tmpl.id}
                                className={`p-3 rounded-[15px] border transition-all flex flex-col justify-between ${
                                  isSelected
                                    ? 'bg-[#FAF8F5] dark:bg-[#1E1B19] border-[#981C00] dark:border-[#E89382] shadow-xs'
                                    : 'border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#DDD7CF] bg-white dark:bg-[#181615]'
                                }`}
                              >
                                <div
                                  onClick={() => setMessageText(tmpl.text)}
                                  className="cursor-pointer group"
                                >
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="font-bold text-xs text-[#24211F] dark:text-[#F3EFEA] group-hover:text-[#981C00] dark:group-hover:text-[#E89382] transition-colors line-clamp-1">
                                      {tmpl.title}
                                    </span>
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[15px] bg-[#F3EFEA] dark:bg-[#2C2825] text-[#706A65] dark:text-[#A8A29D] shrink-0">
                                      {tmpl.tag}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#706A65] dark:text-[#A8A29D] line-clamp-2 leading-relaxed">
                                    {tmpl.text}
                                  </p>
                                </div>

                                <div className="flex items-center justify-between gap-1 pt-2 mt-2 border-t border-[#E8E4DF] dark:border-[#2C2825]">
                                  <button
                                    type="button"
                                    onClick={() => setMessageText(tmpl.text)}
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-[15px] transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#981C00] text-white'
                                        : 'text-[#981C00] dark:text-[#E89382] hover:bg-[#981C00]/10'
                                    }`}
                                  >
                                    {isSelected ? 'In Composer' : 'Use in SMS'}
                                  </button>

                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleUseTemplateInSchedule(tmpl)}
                                      title="Use this sample for a scheduled campaign"
                                      className="p-1 rounded-[15px] text-[#706A65] hover:text-[#981C00] hover:bg-[#FAF8F5] dark:hover:bg-[#1E1B19] cursor-pointer transition-colors"
                                    >
                                      <Calendar className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditTemplateModal(tmpl)}
                                      title="Edit sample text"
                                      className="p-1 rounded-[15px] text-[#706A65] hover:text-[#24211F] dark:hover:text-[#F3EFEA] hover:bg-[#FAF8F5] dark:hover:bg-[#1E1B19] cursor-pointer transition-colors"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTemplate(tmpl.id, tmpl.title)}
                                      title="Delete sample text"
                                      className="p-1 rounded-[15px] text-[#706A65] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Personalization Tag Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-dashed border-[#DDD7CF] dark:border-[#2C2825]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">
                          Personalize:
                        </span>
                        <button
                          type="button"
                          onClick={() => insertPlaceholder('{name}')}
                          className="px-2.5 py-1 rounded-[15px] bg-[#FAF8F5] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#981C00] text-[#24211F] dark:text-[#F3EFEA] font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          + Name
                        </button>
                        <button
                          type="button"
                          onClick={() => insertPlaceholder('{date}')}
                          className="px-2.5 py-1 rounded-[15px] bg-[#FAF8F5] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#981C00] text-[#24211F] dark:text-[#F3EFEA] font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          + Date
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {customTemplates.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setMessageText(customTemplates[0].text)}
                            className="px-2 py-1 rounded-[15px] text-[11px] font-semibold text-[#706A65] hover:text-[#24211F] dark:hover:text-[#F3EFEA] hover:bg-[#FAF8F5] dark:hover:bg-[#1E1B19] cursor-pointer flex items-center gap-1"
                            title="Reset to first saved sample text"
                          >
                            <RotateCcw className="w-3 h-3" />
                            First Sample
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setMessageText('')}
                          className="px-2 py-1 rounded-[15px] text-[11px] font-semibold text-[#706A65] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                          title="Clear message"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Textarea */}
                    <div className="space-y-1.5">
                      <textarea
                        ref={textareaRef}
                        rows={6}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message, morning scripture, or encouragement here (or choose/create a sample text above)..."
                        className="w-full p-3.5 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#141211] text-sm text-[#24211F] dark:text-[#F3EFEA] focus:border-[#981C00] focus:ring-1 focus:ring-[#981C00] focus:outline-hidden resize-none leading-relaxed"
                      />

                      {/* Character & SMS Part Status Bar */}
                      <div className="flex flex-wrap items-center justify-between text-xs px-1 text-[#706A65] dark:text-[#A8A29D] gap-2">
                        <div className="flex items-center gap-2">
                          <span>Include greetings & encouragement</span>
                          {isUnicodeMessage && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-[15px] bg-[#981C00]/10 dark:bg-[#981C00]/25 text-[#981C00] dark:text-[#E89382]">
                              Amharic / Unicode (70 chars/part)
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-right font-bold text-[#24211F] dark:text-[#F3EFEA]">
                          {messageText.length} chars • {currentSegmentCount} SMS {currentSegmentCount === 1 ? 'part' : 'parts'}
                          <span className="text-[11px] text-[#706A65] dark:text-[#A8A29D] ml-1 font-normal">
                            ({charsRemainingInSegment} chars left in part)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Authentic Mobile SMS Preview (5 cols on XL) */}
                  <div className="xl:col-span-5 flex flex-col justify-between space-y-4">
                    <div className="rounded-[15px] border border-[#2C2825] bg-[#141211] p-3.5 shadow-sm space-y-3">
                      {/* Phone Status Bar */}
                      <div className="flex items-center justify-between px-3 pt-1 text-[11px] font-mono text-[#706A65]">
                        <span>06:30 AM</span>
                        <div className="w-12 h-1 bg-[#2C2825] rounded-[2px] mx-auto" />
                        <span>4G LTE</span>
                      </div>

                      {/* Phone App Header */}
                      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2C2825]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-[15px] bg-[#981C00] text-white font-bold text-xs flex items-center justify-center">
                            N
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">NAZAZI SMS</p>
                            <p className="text-[10px] text-[#706A65]">Official Sender ID</p>
                          </div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-[15px] bg-[#1E1B19] text-[#E89382] font-mono">
                          Verified
                        </span>
                      </div>

                      {/* Live SMS Bubble */}
                      <div className="min-h-[160px] p-3 rounded-[15px] bg-[#181615] flex flex-col justify-end space-y-2">
                        <div className="text-center text-[10px] text-[#706A65] font-mono">
                          Today • Ethio Telecom / Safaricom
                        </div>

                        <div className="self-start max-w-[92%] p-3.5 rounded-[15px] bg-[#981C00] text-white text-xs leading-relaxed shadow-xs space-y-1.5">
                          <p className="font-sans whitespace-pre-wrap">{previewMessage}</p>
                          <div className="text-[9px] text-[#E89382] text-right font-mono flex items-center justify-end gap-1">
                            <span>06:30 AM</span>
                            <Check className="w-3 h-3" />
                          </div>
                        </div>
                      </div>

                      {/* Phone Footer Info */}
                      <div className="px-2 pt-1 pb-1 text-center">
                        <p className="text-[10px] text-[#706A65]">
                          {`{name} dynamically becomes recipient's actual registered name`}
                        </p>
                      </div>
                    </div>

                    {/* Summary Box under Preview */}
                    <div className="p-3.5 rounded-[15px] bg-[#FAF8F5] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-[#706A65] dark:text-[#A8A29D]">
                        <span>Target Audience:</span>
                        <strong className="text-[#24211F] dark:text-[#F3EFEA]">
                          {selectedPlans.includes('all')
                            ? 'All Verified Members'
                            : selectedPlans.includes('single')
                            ? 'Single Recipient'
                            : selectedPlans.map((p) => `${p} ETB`).join(' + ')}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between text-[#706A65] dark:text-[#A8A29D]">
                        <span>Recipients:</span>
                        <strong className="text-[#981C00] dark:text-[#E89382] font-bold">
                          {activeRecipients.length} members
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: SCHEDULED CAMPAIGNS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'schedules' && (
        <Card className="p-6 space-y-6 bg-white dark:bg-[#181615] border border-[#E8E4DF] dark:border-[#2C2825] rounded-[15px] shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-dashed border-[#DDD7CF] dark:border-[#2C2825]">
            <div>
              <h2 className="text-base font-bold text-[#24211F] dark:text-[#F3EFEA] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#981C00] dark:text-[#E89382]" />
                Active & Scheduled SMS Campaigns
              </h2>
              <p className="text-xs text-[#706A65] dark:text-[#A8A29D] mt-0.5">
                Manage recurring daily morning broadcasts for 1-Week, 3-Week, and 1-Month subscriber cycles.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleOpenNewTemplateModal()}
                className="rounded-[15px] border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#1E1B19] text-[#24211F] dark:text-[#F3EFEA]"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Sample Text
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setActiveSubTab('dispatcher');
                  setDispatchMode('schedule');
                }}
                className="rounded-[15px] bg-[#981C00] hover:bg-[#7A1D28] text-white"
                leftIcon={<Clock className="w-3.5 h-3.5" />}
              >
                New Scheduled Campaign
              </Button>
            </div>
          </div>

          {isLoadingCampaigns ? (
            <div className="py-12 text-center text-xs text-[#706A65] dark:text-[#A8A29D] space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#981C00] dark:text-[#E89382]" />
              <p>Loading scheduled campaigns...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-14 text-center text-xs text-[#706A65] dark:text-[#A8A29D] space-y-3">
              <div className="w-10 h-10 mx-auto rounded-[15px] bg-[#FAF8F5] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] flex items-center justify-center text-[#706A65]">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-[#24211F] dark:text-[#F3EFEA]">
                  No Scheduled SMS Campaigns Active
                </p>
                <p className="max-w-md mx-auto text-[#706A65] dark:text-[#A8A29D]">
                  Set up a recurring morning scripture broadcast for your 200 Birr subscribers (30 Days), 600 Birr subscribers, or 1000 Birr subscribers.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="rounded-[15px] bg-[#981C00] hover:bg-[#7A1D28] text-white font-bold"
                onClick={() => {
                  setActiveSubTab('dispatcher');
                  setDispatchMode('schedule');
                }}
              >
                Schedule First 30-Day Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="p-4 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5]/60 dark:bg-[#1E1B19]/40 space-y-3 hover:border-[#DDD7CF] dark:hover:border-[#38332E] transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-[#24211F] dark:text-[#F3EFEA]">{camp.title}</h3>
                        <Badge
                          variant={camp.status === 'active' ? 'emerald' : camp.status === 'paused' ? 'amber' : 'zinc'}
                          className="rounded-[15px] text-[10px]"
                        >
                          {camp.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#706A65] dark:text-[#A8A29D] flex items-center gap-2">
                        <span>Target: <strong>{camp.targetPlan === 'all' ? 'All Members' : `${camp.targetPlan} ETB Plan`}</strong></span>
                        <span>•</span>
                        <span>{camp.targetCount || approvedCount} Recipients</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleCampaignStatus(camp.id, camp.status)}
                        className="p-1.5 rounded-[15px] text-[#706A65] hover:text-[#24211F] dark:hover:text-[#F3EFEA] hover:bg-[#F3EFEA] dark:hover:bg-[#2C2825] cursor-pointer"
                        title={camp.status === 'active' ? 'Pause Campaign' : 'Resume Campaign'}
                      >
                        {camp.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCampaign(camp.id)}
                        className="p-1.5 rounded-[15px] text-[#706A65] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        title="Delete Campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Message Snippet */}
                  <div className="p-3 rounded-[15px] bg-white dark:bg-[#141211] border border-[#E8E4DF] dark:border-[#2C2825] text-xs text-[#24211F] dark:text-[#F3EFEA] leading-relaxed font-sans line-clamp-2">
                    &ldquo;{camp.messageTemplate}&rdquo;
                  </div>

                  {/* Campaign Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
                    <div className="p-2 rounded-[15px] bg-white dark:bg-[#141211] border border-[#E8E4DF] dark:border-[#2C2825]">
                      <p className="text-[#706A65] dark:text-[#A8A29D]">Duration</p>
                      <p className="font-bold text-[#24211F] dark:text-[#F3EFEA] mt-0.5">
                        {camp.duration === '1_week' ? '7 Days' : camp.duration === '3_weeks' ? '21 Days' : '30 Days'}
                      </p>
                    </div>
                    <div className="p-2 rounded-[15px] bg-white dark:bg-[#141211] border border-[#E8E4DF] dark:border-[#2C2825]">
                      <p className="text-[#706A65] dark:text-[#A8A29D]">Time</p>
                      <p className="font-bold text-[#24211F] dark:text-[#F3EFEA] mt-0.5">{camp.dailyTime} AM</p>
                    </div>
                    <div className="p-2 rounded-[15px] bg-white dark:bg-[#141211] border border-[#E8E4DF] dark:border-[#2C2825]">
                      <p className="text-[#706A65] dark:text-[#A8A29D]">Progress</p>
                      <p className="font-bold text-[#981C00] dark:text-[#E89382] mt-0.5">
                        Day {camp.runsCompleted} / {camp.totalRuns}
                      </p>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#E8E4DF] dark:border-[#2C2825] text-xs">
                    <span className="text-[11px] text-[#706A65] dark:text-[#A8A29D] font-mono">
                      Next: {new Date(camp.nextRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(camp.nextRunAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>

                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleRunCampaignNow(camp)}
                      className="text-xs rounded-[15px] border-[#E8E4DF] dark:border-[#2C2825]"
                      leftIcon={<Play className="w-3 h-3" />}
                    >
                      Trigger Run Now
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: PAID SMS GATEWAY INTEGRATION SETTINGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'gateway' && (
        <div className="space-y-6">
          <Card className="p-6 sm:p-8 space-y-6 bg-white dark:bg-[#181615] border border-[#E8E4DF] dark:border-[#2C2825] rounded-[15px] shadow-xs">
            <div className="space-y-1 pb-4 border-b border-dashed border-[#DDD7CF] dark:border-[#2C2825]">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-[15px] bg-[#981C00]/10 text-[#981C00] dark:bg-[#981C00]/25 dark:text-[#E89382]">
                  <Settings className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#24211F] dark:text-[#F3EFEA]">
                    Paid SMS API Gateway Integration
                  </h2>
                  <p className="text-xs text-[#706A65] dark:text-[#A8A29D]">
                    Connect your paid SMS service (Generic REST API, SMS Ethio, Twilio, Africa&apos;s Talking, or custom gateway).
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSaveGateway} className="space-y-5">
              {/* Provider Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">
                  1. SMS Gateway Provider
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div
                    onClick={() => setGatewayConfig((p) => ({ ...p, provider: 'generic_http' }))}
                    className={`p-3.5 rounded-[15px] border transition-all cursor-pointer ${
                      gatewayConfig.provider === 'generic_http'
                        ? 'border-[#981C00] bg-[#FAF8F5] dark:bg-[#1E1B19] shadow-xs'
                        : 'border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#DDD7CF] bg-white dark:bg-[#181615]'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">Generic REST API (Custom)</p>
                    <p className="text-[11px] text-[#706A65] dark:text-[#A8A29D] mt-0.5">Compatible with any SMS provider via HTTP POST</p>
                  </div>

                  <div
                    onClick={() => setGatewayConfig((p) => ({ ...p, provider: 'africas_talking' }))}
                    className={`p-3.5 rounded-[15px] border transition-all cursor-pointer ${
                      gatewayConfig.provider === 'africas_talking'
                        ? 'border-[#981C00] bg-[#FAF8F5] dark:bg-[#1E1B19] shadow-xs'
                        : 'border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#DDD7CF] bg-white dark:bg-[#181615]'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">Africa&apos;s Talking</p>
                    <p className="text-[11px] text-[#706A65] dark:text-[#A8A29D] mt-0.5">Pan-African telecom SMS provider</p>
                  </div>

                  <div
                    onClick={() => setGatewayConfig((p) => ({ ...p, provider: 'twilio' }))}
                    className={`p-3.5 rounded-[15px] border transition-all cursor-pointer ${
                      gatewayConfig.provider === 'twilio'
                        ? 'border-[#981C00] bg-[#FAF8F5] dark:bg-[#1E1B19] shadow-xs'
                        : 'border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#DDD7CF] bg-white dark:bg-[#181615]'
                    }`}
                  >
                    <p className="text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">Twilio SMS</p>
                    <p className="text-[11px] text-[#706A65] dark:text-[#A8A29D] mt-0.5">Global SMS & Programmable Messaging</p>
                  </div>
                </div>
              </div>

              {/* Endpoint URL & Sender ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">
                    Gateway API Endpoint URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://api.sms-gateway.com/v1/send"
                    value={gatewayConfig.apiUrl}
                    onChange={(e) => setGatewayConfig((p) => ({ ...p, apiUrl: e.target.value }))}
                    className="w-full p-3 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#141211] text-xs text-[#24211F] dark:text-[#F3EFEA] focus:border-[#981C00] focus:ring-1 focus:ring-[#981C00] focus:outline-hidden font-mono"
                  />
                  <p className="text-[10px] text-[#706A65] dark:text-[#A8A29D]">HTTP POST endpoint provided by your telecom/SMS partner</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">
                    Sender ID / Mask
                  </label>
                  <input
                    type="text"
                    placeholder="NAZAZI"
                    value={gatewayConfig.senderId}
                    onChange={(e) => setGatewayConfig((p) => ({ ...p, senderId: e.target.value }))}
                    className="w-full p-3 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#141211] text-xs text-[#24211F] dark:text-[#F3EFEA] focus:border-[#981C00] focus:ring-1 focus:ring-[#981C00] focus:outline-hidden font-bold"
                  />
                  <p className="text-[10px] text-[#706A65] dark:text-[#A8A29D]">Name shown as the SMS sender on subscriber phones</p>
                </div>
              </div>

              {/* API Key / Token & Auth Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">
                    API Secret Key / Bearer Token
                  </label>
                  <div className="relative">
                    <input
                      type={isApiKeyVisible ? 'text' : 'password'}
                      placeholder="sk_live_..."
                      value={gatewayConfig.apiKey}
                      onChange={(e) => setGatewayConfig((p) => ({ ...p, apiKey: e.target.value }))}
                      className="w-full p-3 pr-10 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#141211] text-xs text-[#24211F] dark:text-[#F3EFEA] focus:border-[#981C00] focus:ring-1 focus:ring-[#981C00] focus:outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setIsApiKeyVisible(!isApiKeyVisible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#706A65] hover:text-[#24211F] dark:hover:text-[#F3EFEA] cursor-pointer"
                    >
                      {isApiKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#706A65] dark:text-[#A8A29D]">Encrypted server-side; never exposed to public browsers</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">
                    Authorization Header Format
                  </label>
                  <select
                    value={gatewayConfig.authHeader}
                    onChange={(e) => setGatewayConfig((p) => ({ ...p, authHeader: e.target.value }))}
                    className="w-full p-3 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#141211] text-xs text-[#24211F] dark:text-[#F3EFEA] focus:border-[#981C00] focus:ring-1 focus:ring-[#981C00] focus:outline-hidden"
                  >
                    <option value="Bearer">Bearer Token (Authorization: Bearer {'<key>'})</option>
                    <option value="Basic">Basic Auth (Authorization: Basic {'<key>'})</option>
                    <option value="X-API-KEY">Header: X-API-KEY</option>
                    <option value="api-key">Header: api-key</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="submit"
                  size="md"
                  isLoading={isSavingGateway}
                  className="rounded-[15px] bg-[#981C00] hover:bg-[#7A1D28] text-white font-bold"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Save Gateway Credentials
                </Button>
              </div>
            </form>

            {/* Test Connection Card */}
            <div className="p-4 sm:p-5 rounded-[15px] bg-[#FAF8F5] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] space-y-3">
              <h3 className="text-xs font-bold text-[#24211F] dark:text-[#F3EFEA] flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-[#981C00] dark:text-[#E89382]" />
                Test Gateway Connection with Real Phone Number
              </h3>
              <p className="text-xs text-[#706A65] dark:text-[#A8A29D]">
                Send a single verification ping to ensure your paid API credentials, sender ID, and format are configured properly before triggering bulk dispatches.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="tel"
                  placeholder="Enter your phone (e.g. 0911223344)"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full sm:w-80 p-2.5 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-white dark:bg-[#141211] text-xs text-[#24211F] dark:text-[#F3EFEA] focus:border-[#981C00] focus:ring-1 focus:ring-[#981C00] focus:outline-hidden font-mono"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  isLoading={isTestingGateway}
                  onClick={handleTestGateway}
                  className="rounded-[15px] border-[#E8E4DF] dark:border-[#2C2825]"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Dispatch Test SMS
                </Button>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-[15px] text-xs font-mono flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800'
                  }`}
                >
                  {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: DELIVERY HISTORY & AUDIT LOGS */}
      {/* ========================================================================= */}
      {activeSubTab === 'logs' && (
        <Card className="p-4 sm:p-6 space-y-4 bg-white dark:bg-[#181615] border border-[#E8E4DF] dark:border-[#2C2825] rounded-[15px] shadow-xs">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-dashed border-[#DDD7CF] dark:border-[#2C2825]">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-[#24211F] dark:text-[#F3EFEA] flex items-center gap-2">
                <History className="w-4 h-4 text-[#981C00] dark:text-[#E89382]" />
                SMS Dispatch History & Delivery Audit
              </h2>
              <p className="text-[11px] sm:text-xs text-[#706A65] dark:text-[#A8A29D] mt-0.5">
                Full delivery audit log of all batch transmissions and encouragement broadcasts.
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
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[15px] text-xs font-semibold text-[#706A65] dark:text-[#A8A29D] bg-[#FAF8F5] hover:bg-[#F3EFEA] dark:bg-[#1E1B19] dark:hover:bg-[#2C2825] transition-colors cursor-pointer border border-[#E8E4DF] dark:border-[#2C2825]"
                title="Clear all logs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear History</span>
              </button>
            )}
          </div>

          {smsLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#706A65] dark:text-[#A8A29D] space-y-2">
              <div className="w-9 h-9 mx-auto rounded-[15px] bg-[#FAF8F5] dark:bg-[#1E1B19] border border-[#E8E4DF] dark:border-[#2C2825] flex items-center justify-center text-[#706A65]">
                <History className="w-4 h-4" />
              </div>
              <p className="font-bold text-[#24211F] dark:text-[#F3EFEA]">No SMS messages sent yet</p>
              <p>Dispatched messages from the SMS Console will appear here with delivery timestamps.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Mobile Logs Cards (< md) */}
              <div className="grid grid-cols-1 gap-2.5 md:hidden">
                {smsLogs.slice(0, 100).map((log) => (
                  <div
                    key={`m-log-${log.id}`}
                    className="p-3 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5]/60 dark:bg-[#1E1B19]/40 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-bold text-[#24211F] dark:text-[#F3EFEA]">{log.recipientName}</p>
                        <p className="text-[11px] font-mono text-[#706A65] dark:text-[#A8A29D]">{log.recipientPhone}</p>
                      </div>
                      <Badge variant={log.status === 'Delivered' ? 'emerald' : 'zinc'} className="rounded-[15px] text-[10px]">
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#706A65] dark:text-[#A8A29D] line-clamp-2 italic">
                      &ldquo;{log.messageText}&rdquo;
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-[#706A65] dark:text-[#A8A29D] border-t border-[#E8E4DF] dark:border-[#2C2825] pt-1.5 font-mono">
                      <span>{new Date(log.sentAt).toLocaleString()}</span>
                      <span>{log.segmentCount} Part(s)</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF8F5] dark:bg-[#1E1B19] text-[#706A65] dark:text-[#A8A29D] font-bold border-b border-[#E8E4DF] dark:border-[#2C2825]">
                    <tr>
                      <th className="p-3.5 pl-4">Recipient</th>
                      <th className="p-3.5">Phone Number</th>
                      <th className="p-3.5">Message Content</th>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Segments</th>
                      <th className="p-3.5 pr-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DF] dark:divide-[#2C2825]">
                    {smsLogs.slice(0, 100).map((log) => (
                      <tr key={log.id} className="hover:bg-[#FAF8F5]/80 dark:hover:bg-[#1E1B19]/40 transition-colors">
                        <td className="p-3.5 pl-4 font-bold text-[#24211F] dark:text-[#F3EFEA]">
                          {log.recipientName}
                        </td>
                        <td className="p-3.5 font-mono text-[#706A65] dark:text-[#A8A29D] font-semibold">
                          {log.recipientPhone}
                        </td>
                        <td className="p-3.5 max-w-xs truncate text-[#706A65] dark:text-[#A8A29D]">
                          {log.messageText}
                        </td>
                        <td className="p-3.5 text-[#706A65] dark:text-[#A8A29D] whitespace-nowrap font-mono text-[11px]">
                          {new Date(log.sentAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3.5 font-mono text-[#706A65] dark:text-[#A8A29D]">{log.segmentCount}</td>
                        <td className="p-3.5 pr-4 text-right">
                          <Badge variant={log.status === 'Delivered' ? 'emerald' : 'zinc'} className="rounded-[15px] text-[10px]">
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

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CUSTOM SAMPLE TEXT */}
      {/* ========================================================================= */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white dark:bg-[#181615] border border-[#E8E4DF] dark:border-[#2C2825] rounded-[15px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E8E4DF] dark:border-[#2C2825] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-[15px] bg-[#981C00]/10 dark:bg-[#981C00]/25 text-[#981C00] dark:text-[#E89382] flex items-center justify-center">
                  <BookmarkPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#24211F] dark:text-[#F3EFEA]">
                    {editingTemplateId ? 'Edit Sample Text' : 'Create Custom Sample Text'}
                  </h3>
                  <p className="text-xs text-[#706A65] dark:text-[#A8A29D]">
                    Save reusable scriptures and messages for broadcasts and schedules.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 rounded-[15px] text-[#706A65] hover:text-[#24211F] dark:hover:text-[#F3EFEA] hover:bg-[#FAF8F5] dark:hover:bg-[#1E1B19] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">
                    Template Title *
                  </label>
                  <input
                    type="text"
                    value={modalTitle}
                    onChange={(e) => setModalTitle(e.target.value)}
                    placeholder="e.g. Morning Grace, Psalm 23"
                    className="w-full p-2.5 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#141211] text-xs text-[#24211F] dark:text-[#F3EFEA] focus:border-[#981C00] focus:ring-1 focus:ring-[#981C00] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={modalTag}
                    onChange={(e) => setModalTag(e.target.value)}
                    placeholder="e.g. Scripture, Devotional"
                    className="w-full p-2.5 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#141211] text-xs text-[#24211F] dark:text-[#F3EFEA] focus:border-[#981C00] focus:ring-1 focus:ring-[#981C00] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Personalization Quick Insert */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">
                  Insert Variables:
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertModalPlaceholder('{name}')}
                    className="px-2.5 py-1 rounded-[15px] text-xs font-bold bg-[#FAF8F5] dark:bg-[#1E1B19] text-[#24211F] dark:text-[#F3EFEA] border border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#981C00] cursor-pointer transition-colors"
                  >
                    + &#123;name&#125;
                  </button>
                  <button
                    type="button"
                    onClick={() => insertModalPlaceholder('{date}')}
                    className="px-2.5 py-1 rounded-[15px] text-xs font-bold bg-[#FAF8F5] dark:bg-[#1E1B19] text-[#24211F] dark:text-[#F3EFEA] border border-[#E8E4DF] dark:border-[#2C2825] hover:border-[#981C00] cursor-pointer transition-colors"
                  >
                    + &#123;date&#125;
                  </button>
                </div>
              </div>

              {/* Message Body */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#24211F] dark:text-[#F3EFEA]">
                  Message Content *
                </label>
                <textarea
                  ref={modalTextareaRef}
                  rows={4}
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                  placeholder="Write your custom sample text here. E.g. Good morning {name}! May God bless your work today..."
                  className="w-full p-3 rounded-[15px] border border-[#E8E4DF] dark:border-[#2C2825] bg-[#FAF8F5] dark:bg-[#141211] text-xs text-[#24211F] dark:text-[#F3EFEA] focus:border-[#981C00] focus:ring-1 focus:ring-[#981C00] focus:outline-hidden leading-relaxed resize-none"
                />
                <div className="flex items-center justify-between text-[11px] text-[#706A65] dark:text-[#A8A29D]">
                  <span>Dynamic tokens are auto-replaced during send.</span>
                  <span className="font-mono font-bold text-[#24211F] dark:text-[#F3EFEA]">{modalText.length} chars</span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-[#FAF8F5] dark:bg-[#1E1B19] border-t border-[#E8E4DF] dark:border-[#2C2825] flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsTemplateModalOpen(false)}
                className="rounded-[15px]"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSaveTemplate(false)}
                className="rounded-[15px] border-[#E8E4DF] dark:border-[#2C2825]"
              >
                Save Sample
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveTemplate(true)}
                className="bg-[#981C00] hover:bg-[#7A1D28] text-white font-bold rounded-[15px]"
              >
                Save & Use Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
