import { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  HiPlus, HiMagnifyingGlass, HiPencilSquare, HiTrash, HiXMark,
  HiClipboardDocumentList, HiDocumentArrowDown, HiChevronDown, HiEye,
  HiCheckCircle, HiPencil, HiShieldCheck, HiArrowRightOnRectangle,
  HiLockClosed
} from 'react-icons/hi2';
import api from '../../utils/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = 'newjob' | 'approved' | 'inprogress' | 'jobdone';

interface Customer {
  id: string;
  customerId: string;
  companyName: string;
  companyNameTH?: string;
  address?: string;
  addressTH?: string;
  phone?: string;
  email?: string;
  contactPerson?: string;
}

interface SafetyEquipment {
  shoes?: boolean;
  helmet?: boolean;
  glasses?: boolean;
  otherText?: string;
}

interface WorkplaceType {
  indoor?: boolean;
  production?: boolean;
  lab?: boolean;
  indoorOther?: string;
  outdoor?: boolean;
  outdoorPipeline?: boolean;
  outdoorHazardous?: boolean;
}

interface WorkAssignment {
  id: number;
  documentNo: string;
  receivingNo?: string;
  docType: string;
  status: DocStatus;
  customerId: string;
  customer: { id: string; customerId: string; companyName: string; companyNameTH?: string };
  contactName?: string;
  phone?: string;
  mobile?: string;
  overrideEmail?: string;
  certificateAddressEN?: string;
  testDetails?: string;
  safetyEquipment?: SafetyEquipment;
  safetyTraining?: boolean | null;
  workplaceType?: WorkplaceType;
  staffCount?: number;
  workDays?: number;
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentPlace?: string;
  assignedTo?: string;
  assignedToSig?: string;
  assignedToSignedAt?: string;
  reviewedBy?: string;
  reviewedBySig?: string;
  reviewedBySignedAt?: string;
  receivedBy?: string;
  receivedBySig?: string;
  receivedBySignedAt?: string;
  dueDate?: string;
  notes?: string;
  createdBy: { fullName: string };
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABEL: Record<DocStatus, string> = {
  newjob:    'ใบงานใหม่',
  approved:  'อนุมัติแล้ว',
  inprogress: 'กำลังดำเนินการ',
  jobdone:   'ปิดงานแล้ว',
};
const STATUS_CLASS: Record<DocStatus, string> = {
  newjob:    'bg-yellow-100 text-yellow-700',
  approved:  'bg-blue-100 text-blue-700',
  inprogress: 'bg-purple-100 text-purple-700',
  jobdone:   'bg-green-100 text-green-700',
};
const REMARK_TEXT: Record<DocStatus, string> = {
  newjob:    'รอผู้อนุมัติพิจารณา',
  approved:  'รออนุมัติรับมอบงาน',
  inprogress: 'กำลังดำเนินการ',
  jobdone:   'ปิดงานแล้ว',
};
const REMARK_CLASS: Record<DocStatus, string> = {
  newjob:    'bg-yellow-50 text-yellow-700',
  approved:  'bg-blue-50 text-blue-700',
  inprogress: 'bg-purple-50 text-purple-700',
  jobdone:   'bg-green-50 text-green-700',
};

type SigRole = 'assignedTo' | 'reviewedBy' | 'receivedBy';

const ROLE_LABEL: Record<SigRole, string> = {
  assignedTo: 'ผู้มอบหมายงาน',
  reviewedBy: 'ผู้อนุมัติ',
  receivedBy: 'ผู้รับงาน',
};

// ─── Signature Pad ────────────────────────────────────────────────────────────

const SignaturePad = ({ onReady }: { onReady: (getDataUrl: () => string | null) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStrokes = useRef(false);

  const getCtx = () => {
    const c = canvasRef.current;
    if (!c) return null;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  };

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const src = 'touches' in e ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing.current = true;
      hasStrokes.current = true;
      const ctx = getCtx();
      if (!ctx) return;
      const { x, y } = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const onMove = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!drawing.current) return;
      const ctx = getCtx();
      if (!ctx) return;
      const { x, y } = getPos(e, canvas);
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const onUp = () => { drawing.current = false; };

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);

    onReady(() => {
      if (!hasStrokes.current || !canvasRef.current) return null;
      return canvasRef.current.toDataURL('image/png');
    });

    return () => {
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseup', onUp);
      canvas.removeEventListener('touchstart', onDown);
      canvas.removeEventListener('touchmove', onMove);
      canvas.removeEventListener('touchend', onUp);
    };
  }, [onReady]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasStrokes.current = false;
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={460}
        height={140}
        style={{ border: '1px solid #ccc', borderRadius: 6, background: '#fafafa', width: '100%', height: 140, touchAction: 'none', cursor: 'crosshair' }}
      />
      <button type="button" onClick={clear} className="mt-1 text-xs text-gray-500 hover:text-red-500 underline">
        ล้างลายเซ็น
      </button>
    </div>
  );
};

// ─── Sign Modal ───────────────────────────────────────────────────────────────

const SignModal = ({
  isOpen, role, itemId, onClose, onSigned
}: {
  isOpen: boolean;
  role: SigRole | null;
  itemId: number;
  onClose: () => void;
  onSigned: () => void;
}) => {
  const [name, setName] = useState('');
  const [signedDate, setSignedDate] = useState(new Date().toISOString().slice(0, 10));
  const [profileSig, setProfileSig] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const getDataUrlRef = useRef<(() => string | null) | null>(null);

  useEffect(() => {
    if (!isOpen || !role) return;
    setDrawMode(false);
    setProfileSig(null);
    setSignedDate(new Date().toISOString().slice(0, 10));
    setLoadingProfile(true);
    api.get('/users/me/signature')
      .then(res => {
        const d = res.data.data;
        setName(d.fullName || '');
        setProfileSig(d.signatureBase64 || null);
        if (!d.signatureBase64) setDrawMode(true);
      })
      .catch(() => {
        try { setName(JSON.parse(localStorage.getItem('user') || '{}').fullName || ''); } catch {}
        setDrawMode(true);
      })
      .finally(() => setLoadingProfile(false));
  }, [isOpen, role]);

  const handleReady = useCallback((fn: () => string | null) => {
    getDataUrlRef.current = fn;
  }, []);

  if (!isOpen || !role) return null;

  const handleConfirm = async () => {
    const sig = drawMode ? getDataUrlRef.current?.() : profileSig;
    if (!sig) { alert(drawMode ? 'กรุณาวาดลายเซ็นก่อน' : 'ไม่พบลายเซ็น กรุณากด "วาดใหม่"'); return; }
    if (!name.trim()) { alert('กรุณากรอกชื่อ'); return; }
    setSaving(true);
    try {
      await api.post(`/work-assignments/${itemId}/sign`, {
        role,
        signature: sig,
        name: name.trim(),
        signedDate: signedDate || new Date().toISOString().slice(0, 10),
      });
      onSigned();
      onClose();
    } catch (err) {
      console.error('Sign failed:', err);
      alert('ไม่สามารถบันทึกลายเซ็นได้');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2 text-blue-700">
            <HiPencil className="w-5 h-5" />
            <h3 className="font-bold text-base">ลงนาม — {ROLE_LABEL[role]}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ-นามสกุล <span className="text-gray-400 font-normal">(แก้ไขได้)</span>
              </label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">วันที่ลงนาม</label>
              <input type="date" value={signedDate} onChange={e => setSignedDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">ลายเซ็น</label>
              {profileSig && (
                <button type="button" onClick={() => setDrawMode(v => !v)}
                  className="text-xs text-blue-600 hover:underline">
                  {drawMode ? '← ใช้ลายเซ็นจาก Profile' : '✏️ วาดใหม่'}
                </button>
              )}
            </div>
            {loadingProfile ? (
              <div className="flex items-center justify-center h-24 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : drawMode ? (
              <SignaturePad key={`draw-${role}`} onReady={handleReady} />
            ) : profileSig ? (
              <div className="border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center p-3" style={{ minHeight: 110 }}>
                <img src={profileSig} alt="ลายเซ็น" className="max-h-24 max-w-full object-contain" />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-5 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100">
            ยกเลิก
          </button>
          <button onClick={handleConfirm} disabled={saving || loadingProfile}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'กำลังบันทึก...' : 'ยืนยันลายเซ็น'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = () => ({
  customerId: '',
  receivingNo: '',
  contactName: '',
  phone: '',
  mobile: '',
  overrideEmail: '',
  certificateAddressEN: '',
  testDetails: '',
  safetyEquipment: { shoes: false, helmet: false, glasses: false, otherText: '' } as SafetyEquipment,
  safetyTraining: null as boolean | null,
  workplaceType: {
    indoor: false, production: false, lab: false, indoorOther: '',
    outdoor: false, outdoorPipeline: false, outdoorHazardous: false,
  } as WorkplaceType,
  staffCount: '',
  workDays: '',
  appointmentDate: '',
  appointmentTime: '',
  appointmentPlace: '',
  dueDate: '',
  notes: '',
});

type FormState = ReturnType<typeof emptyForm>;

// ─── Searchable Customer Combobox (Portal-based to avoid overflow clipping) ───

const CustomerCombobox = ({
  value, customers, onSelect, inputClass,
}: {
  value: string;
  customers: Customer[];
  onSelect: (c: Customer | null) => void;
  inputClass: string;
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = customers.find(c => c.id === value);

  const filtered = customers.filter(c =>
    !query ||
    c.companyName.toLowerCase().includes(query.toLowerCase()) ||
    c.customerId.toLowerCase().includes(query.toLowerCase())
  );

  const openDropdown = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        !(e.target as Element).closest('[data-combobox-portal]')
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const dropdown = open ? ReactDOM.createPortal(
    <div data-combobox-portal style={dropdownStyle}
      className="bg-white border border-gray-300 rounded-lg shadow-xl max-h-52 overflow-y-auto text-sm">
      {filtered.length === 0
        ? <div className="px-3 py-2 text-gray-400">ไม่พบลูกค้า</div>
        : filtered.map(c => (
          <div key={c.id}
            className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex flex-col"
            onMouseDown={() => { onSelect(c); setOpen(false); setQuery(''); }}>
            <span className="font-medium text-gray-800">{c.companyName}</span>
            <span className="text-xs text-gray-400">{c.customerId}</span>
          </div>
        ))}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        className={inputClass}
        placeholder="พิมพ์ค้นหาบริษัท..."
        value={open ? query : (selected ? selected.companyName : '')}
        onFocus={() => { setQuery(''); openDropdown(); }}
        onChange={e => setQuery(e.target.value)}
        readOnly={!open}
        style={{ cursor: open ? 'text' : 'pointer' }}
      />
      <button
        type="button"
        onClick={() => open ? setOpen(false) : openDropdown()}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        tabIndex={-1}
      >
        <HiChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {dropdown}
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────────────────────────

const WorkAssignmentModal = ({
  isOpen, onClose, onSave, onDelete, editData, customers, saving, isAdmin
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: FormState) => void;
  onDelete?: () => void;
  editData: WorkAssignment | null;
  customers: Customer[];
  saving: boolean;
  isAdmin: boolean;
}) => {
  const [form, setForm] = useState<FormState>(emptyForm());

  useEffect(() => {
    if (!isOpen) return;
    if (editData) {
      const safety = (editData.safetyEquipment as SafetyEquipment) || {};
      const workplace = (editData.workplaceType as WorkplaceType) || {};
      setForm({
        customerId: editData.customerId,
        receivingNo: editData.receivingNo || '',
        contactName: editData.contactName || '',
        phone: editData.phone || '',
        mobile: editData.mobile || '',
        overrideEmail: editData.overrideEmail || '',
        certificateAddressEN: editData.certificateAddressEN || '',
        testDetails: editData.testDetails || '',
        safetyEquipment: {
          shoes: !!safety.shoes,
          helmet: !!safety.helmet,
          glasses: !!safety.glasses,
          otherText: safety.otherText || '',
        },
        safetyTraining: editData.safetyTraining ?? null,
        workplaceType: {
          indoor: !!workplace.indoor,
          production: !!workplace.production,
          lab: !!workplace.lab,
          indoorOther: workplace.indoorOther || '',
          outdoor: !!workplace.outdoor,
          outdoorPipeline: !!workplace.outdoorPipeline,
          outdoorHazardous: !!workplace.outdoorHazardous,
        },
        staffCount: editData.staffCount?.toString() || '',
        workDays: editData.workDays?.toString() || '',
        appointmentDate: editData.appointmentDate ? editData.appointmentDate.slice(0, 10) : '',
        appointmentTime: editData.appointmentTime || '',
        appointmentPlace: editData.appointmentPlace || '',
        dueDate: editData.dueDate ? editData.dueDate.slice(0, 10) : '',
        notes: editData.notes || '',
      });
    } else {
      setForm(emptyForm());
    }
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const set = (field: keyof FormState, value: any) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const setSafety = (field: keyof SafetyEquipment, value: any) =>
    setForm(prev => ({ ...prev, safetyEquipment: { ...(prev.safetyEquipment || {}), [field]: value } }));

  const setWorkplace = (field: keyof WorkplaceType, value: any) =>
    setForm(prev => ({ ...prev, workplaceType: { ...(prev.workplaceType || {}), [field]: value } }));

  const handleSelectCustomer = (c: Customer | null) => {
    if (!c) { set('customerId', ''); return; }
    setForm(prev => ({
      ...prev,
      customerId: c.id,
      contactName: c.contactPerson || '',
      phone: c.phone || '',
      overrideEmail: c.email || '',
      certificateAddressEN: c.address || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) return;
    onSave(form);
  };

  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';
  const lbl = 'block text-sm font-medium text-gray-700 mb-1';
  const sec = 'font-semibold text-blue-700 border-b border-blue-200 pb-1 mb-3 text-sm uppercase tracking-wide';
  const selectedCustomer = customers.find(c => c.id === form.customerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2 text-blue-700">
            <HiClipboardDocumentList className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">{editData ? 'แก้ไขใบมอบหมายงาน' : 'สร้างใบมอบหมายงานใหม่'}</h2>
              <p className="text-xs text-gray-500">ใบมอบหมายงานทดสอบและสอบเทียบนอกสถานที่</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <HiXMark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* ── ข้อมูลเอกสาร ── */}
          <div>
            <p className={sec}>ข้อมูลเอกสาร</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={lbl}>เลขที่ใบสั่งขาย</label>
                <input type="text" className={inp} placeholder="เช่น SO-2026-001"
                  value={form.receivingNo} onChange={e => set('receivingNo', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>วันที่นัดส่งงาน</label>
                <input type="date" className={inp}
                  value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── ลูกค้า ── */}
          <div>
            <p className={sec}>ข้อมูลลูกค้า</p>
            <div className="mb-3">
              <label className={lbl}>ลูกค้า บริษัท/หน่วยงาน <span className="text-red-500">*</span></label>
              <CustomerCombobox
                value={form.customerId}
                customers={customers}
                onSelect={handleSelectCustomer}
                inputClass={inp}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={lbl}>ชื่อผู้ติดต่อ</label>
                <input type="text" className={inp}
                  placeholder={selectedCustomer?.contactPerson || ''}
                  value={form.contactName} onChange={e => set('contactName', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>โทรศัพท์</label>
                <input type="text" className={inp}
                  placeholder={selectedCustomer?.phone || ''}
                  value={form.phone} onChange={e => set('phone', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>มือถือ</label>
                <input type="text" className={inp}
                  value={form.mobile} onChange={e => set('mobile', e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <label className={lbl}>อีเมล์</label>
                <input type="text" className={inp}
                  placeholder={selectedCustomer?.email || ''}
                  value={form.overrideEmail} onChange={e => set('overrideEmail', e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <label className={lbl}>ชื่อ/ที่อยู่สำหรับออกใบรับรองการสอบเทียบ (ภาษาอังกฤษ)</label>
                <textarea className={`${inp} resize-none`} rows={2}
                  value={form.certificateAddressEN} onChange={e => set('certificateAddressEN', e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── รายละเอียดงาน ── */}
          <div>
            <p className={sec}>รายละเอียดงาน</p>
            <div>
              <label className={lbl}>รายละเอียดในการทดสอบ / สอบเทียบ</label>
              <textarea className={`${inp} resize-none`} rows={4}
                placeholder="ระบุรายละเอียดงาน เครื่องมือ ฯลฯ..."
                value={form.testDetails} onChange={e => set('testDetails', e.target.value)} />
            </div>
          </div>

          {/* ── ความปลอดภัย ── */}
          <div>
            <p className={sec}>อุปกรณ์ความปลอดภัย</p>
            <div className="flex flex-wrap gap-4 mb-3">
              {([['shoes','รองเท้าเซฟตี้'],['helmet','หมวกนิรภัย'],['glasses','แว่นตา']] as [keyof SafetyEquipment, string][]).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded"
                    checked={!!form.safetyEquipment?.[k]}
                    onChange={e => setSafety(k, e.target.checked)} />
                  {label}
                </label>
              ))}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-600">อื่นๆ :</span>
                <input type="text" className="border-b border-gray-300 text-sm focus:outline-none focus:border-blue-500 bg-transparent w-32"
                  value={form.safetyEquipment?.otherText || ''}
                  onChange={e => setSafety('otherText', e.target.value)} />
              </div>
            </div>
            <div className="flex gap-6">
              <span className="text-sm text-gray-700 font-medium">การฝึกอบรมความปลอดภัย :</span>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="safetyTraining" checked={form.safetyTraining === true} onChange={() => set('safetyTraining', true)} />
                ต้องการ
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="safetyTraining" checked={form.safetyTraining === false} onChange={() => set('safetyTraining', false)} />
                ไม่ต้องการ
              </label>
            </div>
          </div>

          {/* ── สถานที่ปฏิบัติงาน ── */}
          <div>
            <p className={sec}>สถานที่ปฏิบัติงาน</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4 mb-2">
              {([
                ['production','ในสายการผลิต'],
                ['lab','ในห้องปฏิบัติการ'],
                ['outdoor','ในเขตพื้นที่ปกติ (นอกอาคาร)'],
                ['outdoorHazardous','ในเขตพื้นที่อันตราย'],
              ] as [keyof WorkplaceType, string][]).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" className="rounded"
                    checked={!!form.workplaceType?.[k]}
                    onChange={e => setWorkplace(k, e.target.checked)} />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">อื่นๆ :</span>
              <input type="text" className="border-b border-gray-300 text-sm focus:outline-none focus:border-blue-500 bg-transparent flex-1"
                value={form.workplaceType?.indoorOther || ''}
                onChange={e => setWorkplace('indoorOther', e.target.value)} />
            </div>
          </div>

          {/* ── การนัดหมาย ── */}
          <div>
            <p className={sec}>การนัดหมาย</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <label className={lbl}>จำนวนช่าง (คน)</label>
                <input type="number" min="0" className={inp}
                  value={form.staffCount} onChange={e => set('staffCount', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>จำนวนวัน</label>
                <input type="number" min="0" className={inp}
                  value={form.workDays} onChange={e => set('workDays', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>เวลา</label>
                <input type="time" className={inp}
                  value={form.appointmentTime} onChange={e => set('appointmentTime', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={lbl}>สถานที่นัดหมาย</label>
              <input type="text" className={inp}
                value={form.appointmentPlace} onChange={e => set('appointmentPlace', e.target.value)} />
            </div>
          </div>

          {/* ── หมายเหตุ ── */}
          <div>
            <p className={sec}>หมายเหตุ</p>
            <textarea className={`${inp} resize-none`} rows={3}
              placeholder="หมายเหตุเพิ่มเติม..."
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>

        </form>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <div>
            {isAdmin && editData && (
              <button type="button" onClick={onDelete}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 text-sm font-medium transition-colors">
                <HiTrash className="w-4 h-4" />
                ลบเอกสาร
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100">
              ยกเลิก
            </button>
            <button type="button" onClick={handleSubmit as any} disabled={saving || !form.customerId}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'กำลังบันทึก...' : editData ? 'บันทึกการแก้ไข' : 'สร้างใบงาน'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const WorkAssignmentPage = () => {
  const [assignments, setAssignments] = useState<WorkAssignment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState<WorkAssignment | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState<number | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<WorkAssignment | null>(null);
  const [signRole, setSignRole] = useState<SigRole | null>(null);

  // Table-level action signing
  const [tableSignRole, setTableSignRole] = useState<SigRole | null>(null);
  const [tableSignItemId, setTableSignItemId] = useState<number | null>(null);

  // Finish job confirmation
  const [confirmFinishItem, setConfirmFinishItem] = useState<WorkAssignment | null>(null);
  const [finishing, setFinishing] = useState(false);

  const navigate = useNavigate();

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const isAdmin = currentUser.role === 'admin';
  const isStaff = currentUser.role === 'admin' || currentUser.role === 'technician';

  // Redirect non-Entech users immediately
  useEffect(() => {
    if (!isStaff) navigate('/dashboard', { replace: true });
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/work-assignments');
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch work assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      const list = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setCustomers(list);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    }
  };

  useEffect(() => { fetchAssignments(); fetchCustomers(); }, []);

  const filtered = assignments.filter(a => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        a.documentNo.toLowerCase().includes(q) ||
        (a.receivingNo || '').toLowerCase().includes(q) ||
        a.customer.companyName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSave = async (formData: FormState) => {
    setSaving(true);
    try {
      const payload = {
        customerId: formData.customerId,
        receivingNo: formData.receivingNo || null,
        contactName: formData.contactName || null,
        phone: formData.phone || null,
        mobile: formData.mobile || null,
        overrideEmail: formData.overrideEmail || null,
        certificateAddressEN: formData.certificateAddressEN || null,
        testDetails: formData.testDetails || null,
        safetyEquipment: formData.safetyEquipment || null,
        safetyTraining: formData.safetyTraining ?? null,
        workplaceType: formData.workplaceType || null,
        staffCount: formData.staffCount ? parseInt(formData.staffCount as any) : null,
        workDays: formData.workDays ? parseInt(formData.workDays as any) : null,
        appointmentDate: formData.appointmentDate || null,
        appointmentTime: formData.appointmentTime || null,
        appointmentPlace: formData.appointmentPlace || null,
        notes: formData.notes || null,
      };
      if (editData) {
        await api.put(`/work-assignments/${editData.id}`, payload);
      } else {
        await api.post('/work-assignments', payload);
      }
      setModalOpen(false);
      fetchAssignments();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
      alert(`บันทึกไม่สำเร็จ: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/work-assignments/${deleteId}`);
      setDeleteId(null);
      fetchAssignments();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteFromModal = () => {
    if (!editData) return;
    setDeleteId(editData.id);
    setModalOpen(false);
  };

  const handleFinishJob = async () => {
    if (!confirmFinishItem) return;
    setFinishing(true);
    try {
      await api.put(`/work-assignments/${confirmFinishItem.id}`, { status: 'jobdone' });
      setConfirmFinishItem(null);
      fetchAssignments();
    } catch (err) {
      console.error('Finish job failed:', err);
    } finally {
      setFinishing(false);
    }
  };

  const handleTableSigned = async () => {
    if (!tableSignItemId) return;
    const res = await api.get(`/work-assignments/${tableSignItemId}`);
    const updated: WorkAssignment = res.data.data;
    setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
    setTableSignRole(null);
    setTableSignItemId(null);
  };

  const loadPreview = async (item: WorkAssignment) => {
    const response = await api.get(`/work-assignments/${item.id}/preview`, { responseType: 'blob' });
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    const url = window.URL.createObjectURL(response.data);
    setPreviewUrl(url);
  };

  const handlePreview = async (item: WorkAssignment) => {
    setPreviewLoading(item.id);
    try {
      setPreviewItem(item);
      await loadPreview(item);
    } catch (err) {
      console.error('Preview failed:', err);
      alert('ไม่สามารถแสดง PDF ได้ กรุณาลองใหม่');
    } finally {
      setPreviewLoading(null);
    }
  };

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewItem(null);
  };

  const handleSigned = async () => {
    if (!previewItem) return;
    const res = await api.get(`/work-assignments/${previewItem.id}`);
    const updated: WorkAssignment = res.data.data;
    setPreviewItem(updated);
    setAssignments(prev => prev.map(a => a.id === updated.id ? updated : a));
    await loadPreview(updated);
  };

  const handlePrintPDF = async (item: WorkAssignment) => {
    setPdfLoading(item.id);
    try {
      const res = await api.get(`/work-assignments/${item.id}/pdf`);
      const { pdf, filename } = res.data.data;
      const bytes = Uint8Array.from(atob(pdf), c => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF failed:', err);
      alert('ไม่สามารถสร้าง PDF ได้ กรุณาลองใหม่');
    } finally {
      setPdfLoading(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 text-blue-700">
          <HiClipboardDocumentList className="w-8 h-8" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">Work Assignment</h1>
            <p className="text-sm text-gray-500">ใบมอบหมายงานทดสอบและสอบเทียบ</p>
          </div>
        </div>
        <button
          onClick={() => { setEditData(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <HiPlus className="w-4 h-4" />
          สร้างใบมอบหมายงาน
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 w-full sm:w-auto">
          <option value="all">ทุกสถานะ</option>
          <option value="newjob">ใบงานใหม่</option>
          <option value="approved">อนุมัติแล้ว</option>
          <option value="inprogress">กำลังดำเนินการ</option>
          <option value="jobdone">ปิดงานแล้ว</option>
        </select>
        <div className="relative">
          <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="ค้นหาเลขที่เอกสาร / ใบสั่งขาย / บริษัท..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-blue-50 text-blue-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">เลขที่เอกสาร</th>
                <th className="px-4 py-3 text-left font-semibold">เลขที่ใบสั่งขาย</th>
                <th className="px-4 py-3 text-left font-semibold">ชื่อบริษัทลูกค้า</th>
                <th className="px-4 py-3 text-left font-semibold">วันนัดหมาย</th>
                <th className="px-4 py-3 text-left font-semibold">สถานะ</th>
                <th className="px-4 py-3 text-left font-semibold">Remark</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    กำลังโหลด...
                  </div>
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400">ไม่พบเอกสาร</td></tr>
              ) : (
                filtered.map(item => {
                  const remarkText = REMARK_TEXT[item.status] ?? '';
                  const remarkClass = REMARK_CLASS[item.status] ?? '';
                  const fmtDate = (iso: string) =>
                    new Date(iso).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: '2-digit', timeZone: 'Asia/Bangkok' });
                  return (
                    <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-blue-700 font-medium whitespace-nowrap">
                        {item.documentNo}
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                        {item.receivingNo || <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800 truncate max-w-[160px]">{item.customer.companyName}</div>
                        <div className="text-xs text-gray-400">{item.customer.customerId}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {item.appointmentDate
                          ? fmtDate(item.appointmentDate)
                          : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASS[item.status] ?? 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_LABEL[item.status] ?? item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        {item.status === 'jobdone' ? (
                          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                            ปิดงาน {fmtDate(item.updatedAt)}
                          </span>
                        ) : remarkText ? (
                          <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${remarkClass}`}>
                            {remarkText}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {/* Standard actions */}
                          <button onClick={() => handlePreview(item)} disabled={previewLoading === item.id}
                            className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors disabled:opacity-50" title="Preview PDF">
                            {previewLoading === item.id
                              ? <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                              : <HiEye className="w-4 h-4" />}
                          </button>
                          <button onClick={() => handlePrintPDF(item)} disabled={pdfLoading === item.id}
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50" title="Download PDF">
                            {pdfLoading === item.id
                              ? <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                              : <HiDocumentArrowDown className="w-4 h-4" />}
                          </button>
                          <button onClick={() => { setEditData(item); setModalOpen(true); }}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors" title="แก้ไข">
                            <HiPencilSquare className="w-4 h-4" />
                          </button>

                          {/* Admin action buttons */}
                          {isAdmin && item.status === 'newjob' && (
                            <button
                              onClick={() => { setTableSignRole('reviewedBy'); setTableSignItemId(item.id); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-sm">
                              <HiShieldCheck className="w-4 h-4" />
                              Approve
                            </button>
                          )}
                          {isAdmin && item.status === 'approved' && (
                            <button
                              onClick={() => { setTableSignRole('receivedBy'); setTableSignItemId(item.id); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm">
                              <HiArrowRightOnRectangle className="w-4 h-4" />
                              รับงาน
                            </button>
                          )}
                          {isAdmin && item.status === 'inprogress' && (
                            <button
                              onClick={() => setConfirmFinishItem(item)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-sm">
                              <HiLockClosed className="w-4 h-4" />
                              ปิดงาน
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
            แสดง {filtered.length} รายการ{filtered.length !== assignments.length ? ` จากทั้งหมด ${assignments.length} รายการ` : ''}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <WorkAssignmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDeleteFromModal}
        editData={editData}
        customers={customers}
        saving={saving}
        isAdmin={isAdmin}
      />

      {/* PDF Preview Modal */}
      {previewUrl && previewItem && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/85 p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2 text-white">
              <HiEye className="w-5 h-5 text-purple-300" />
              <span className="font-semibold text-base">PDF Preview — {previewItem.documentNo}</span>
            </div>
            <button onClick={closePreview}
              className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
              <HiXMark className="w-5 h-5" />
            </button>
          </div>

          {/* Sign toolbar */}
          <div className="flex items-center gap-2 mb-2 bg-white/10 rounded-xl px-3 py-2 flex-wrap">
            <span className="text-white/70 text-xs font-medium mr-1">ลงนาม :</span>
            {(['assignedTo', 'reviewedBy', 'receivedBy'] as SigRole[]).map(role => {
              const sigField = `${role}Sig` as keyof WorkAssignment;
              const signed = !!previewItem[sigField];
              return (
                <button key={role} onClick={() => setSignRole(role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    signed ? 'bg-green-500/80 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}>
                  {signed ? <HiCheckCircle className="w-4 h-4" /> : <HiPencil className="w-4 h-4" />}
                  {ROLE_LABEL[role]}
                </button>
              );
            })}
          </div>

          <iframe src={previewUrl} className="flex-1 w-full rounded-xl" title="Work Assignment PDF Preview" />
        </div>
      )}

      {/* Sign Modal — Preview panel */}
      <SignModal
        isOpen={!!signRole}
        role={signRole}
        itemId={previewItem?.id ?? 0}
        onClose={() => setSignRole(null)}
        onSigned={handleSigned}
      />

      {/* Sign Modal — Table action (Approve / รับงาน) */}
      <SignModal
        isOpen={!!tableSignRole && !!tableSignItemId}
        role={tableSignRole}
        itemId={tableSignItemId ?? 0}
        onClose={() => { setTableSignRole(null); setTableSignItemId(null); }}
        onSigned={handleTableSigned}
      />

      {/* Finish Job Confirmation */}
      {confirmFinishItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <HiLockClosed className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">ยืนยันการปิดงาน</h3>
                <p className="text-xs text-gray-500 mt-0.5">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-1">คุณต้องการปิดงานนี้ใช่หรือไม่?</p>
            {confirmFinishItem.receivingNo && (
              <div className="bg-teal-50 rounded-lg px-3 py-2 mb-5 text-sm font-semibold text-teal-800">
                เลขที่ใบสั่งขาย: {confirmFinishItem.receivingNo}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmFinishItem(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={handleFinishJob} disabled={finishing}
                className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 disabled:opacity-50 transition-colors">
                {finishing ? 'กำลังปิดงาน...' : 'ใช่ ปิดงาน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">ยืนยันการลบ</h3>
            <p className="text-sm text-gray-600 mb-6">คุณต้องการลบเอกสารนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50">
                ยกเลิก
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'กำลังลบ...' : 'ลบเอกสาร'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkAssignmentPage;
