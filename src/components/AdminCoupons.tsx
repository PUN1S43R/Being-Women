import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit, Trash2, Calendar, Percent, 
  Tag, Ticket, Users, Check, X, ShieldCheck, 
  RefreshCw, ChevronRight, Loader2, ArrowLeft, History, 
  DollarSign, Clock, HelpCircle
} from 'lucide-react';
import { couponsApi } from '../lib/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from './ConfirmModal';
import { motion, AnimatePresence } from 'motion/react';

export const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Form & view states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<number | null>(null);
  const [couponDetails, setCouponDetails] = useState<any>(null);

  // Confirm delete state
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Coupon form inputs
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(true);
  const [discountType, setDiscountType] = useState('flat'); // 'flat', 'percentage', 'free_delivery'
  const [discountValue, setDiscountValue] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState<number | ''>('');
  const [minOrderAmount, setMinOrderAmount] = useState(0);

  // Eligibility sub-inputs
  const [eligAllUsers, setEligAllUsers] = useState(true);
  const [eligNewUsers, setEligNewUsers] = useState(false);
  const [eligExistingUsers, setEligExistingUsers] = useState(false);
  const [eligNeverUsedCoupon, setEligNeverUsedCoupon] = useState(false);
  const [eligPremiumMembers, setEligPremiumMembers] = useState(false);
  const [eligUserIds, setEligUserIds] = useState('');
  const [eligRoles, setEligRoles] = useState('');
  const [eligCities, setEligCities] = useState('');
  const [eligStates, setEligStates] = useState('');
  const [eligCountries, setEligCountries] = useState('');

  // Usage Limits
  const [userUsageLimit, setUserUsageLimit] = useState(1);
  const [totalUsageLimit, setTotalUsageLimit] = useState<number | ''>('');
  const [oneCouponPerOrder, setOneCouponPerOrder] = useState(true);

  // Validity
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch Coupons
  useEffect(() => {
    fetchCoupons();
  }, [search, statusFilter, typeFilter]);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await couponsApi.getAll({
        search,
        status: statusFilter,
        discount_type: typeFilter
      });
      setCoupons(data || []);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  // Auto Generate Coupon Code
  const generateCouponCode = () => {
    const prefixes = ['BW', 'SALE', 'FEST', 'WOMEN', 'LUXE', 'OFF'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    setCode(`${randomPrefix}${randomDigits}`);
  };

  // Reset coupon form
  const resetForm = () => {
    setTitle('');
    setCode('');
    setDescription('');
    setStatus(true);
    setDiscountType('flat');
    setDiscountValue(0);
    setMaxDiscount('');
    setMinOrderAmount(0);

    // Reset eligibility
    setEligAllUsers(true);
    setEligNewUsers(false);
    setEligExistingUsers(false);
    setEligNeverUsedCoupon(false);
    setEligPremiumMembers(false);
    setEligUserIds('');
    setEligRoles('');
    setEligCities('');
    setEligStates('');
    setEligCountries('');

    setUserUsageLimit(1);
    setTotalUsageLimit('');
    setOneCouponPerOrder(true);
    setStartDate('');
    setEndDate('');

    setEditingId(null);
  };

  // Open Edit Form
  const handleEditClick = (coupon: any) => {
    setEditingId(coupon.id);
    setTitle(coupon.title);
    setCode(coupon.code);
    setDescription(coupon.description || '');
    setStatus(coupon.status === 1);
    setDiscountType(coupon.discount_type);
    setDiscountValue(coupon.discount_value);
    setMaxDiscount(coupon.max_discount || '');
    setMinOrderAmount(coupon.min_order_amount || 0);

    const rules = coupon.eligibility || {};
    setEligAllUsers(rules.all_users ?? true);
    setEligNewUsers(rules.new_users ?? false);
    setEligExistingUsers(rules.existing_users ?? false);
    setEligNeverUsedCoupon(rules.never_used_coupon ?? false);
    setEligPremiumMembers(rules.premium_members ?? false);

    setEligUserIds((rules.specific_user_ids || []).join(', '));
    setEligRoles((rules.specific_user_roles || []).join(', '));
    setEligCities((rules.specific_cities || []).join(', '));
    setEligStates((rules.specific_states || []).join(', '));
    setEligCountries((rules.specific_countries || []).join(', '));

    setUserUsageLimit(coupon.user_usage_limit ?? 1);
    setTotalUsageLimit(coupon.total_usage_limit || '');
    setOneCouponPerOrder(coupon.one_coupon_per_order === 1);

    // Format ISO string back to datetime-local values
    if (coupon.start_date) {
      setStartDate(new Date(coupon.start_date).toISOString().slice(0, 16));
    } else {
      setStartDate('');
    }
    if (coupon.end_date) {
      setEndDate(new Date(coupon.end_date).toISOString().slice(0, 16));
    } else {
      setEndDate('');
    }

    setIsFormOpen(true);
  };

  // Create or Update Coupon
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !code.trim() || !discountType) {
      toast.error('Title, Code and Discount Type are required');
      return;
    }

    const cleanList = (str: string) => {
      return str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
    };

    const eligibilityPayload = {
      all_users: eligAllUsers,
      new_users: eligNewUsers,
      existing_users: eligExistingUsers,
      never_used_coupon: eligNeverUsedCoupon,
      premium_members: eligPremiumMembers,
      specific_user_ids: cleanList(eligUserIds),
      specific_user_roles: cleanList(eligRoles),
      specific_cities: cleanList(eligCities),
      specific_states: cleanList(eligStates),
      specific_countries: cleanList(eligCountries),
    };

    const payload = {
      title,
      code: code.trim().toUpperCase(),
      description,
      status: status ? 1 : 0,
      discount_type: discountType,
      discount_value: Number(discountValue) || 0,
      max_discount: maxDiscount !== '' ? Number(maxDiscount) : null,
      min_order_amount: Number(minOrderAmount) || 0,
      eligibility: eligibilityPayload,
      user_usage_limit: Number(userUsageLimit) || 1,
      total_usage_limit: totalUsageLimit !== '' ? Number(totalUsageLimit) : null,
      one_coupon_per_order: oneCouponPerOrder ? 1 : 0,
      start_date: startDate || null,
      end_date: endDate || null
    };

    try {
      if (editingId) {
        await couponsApi.update(editingId, payload);
        toast.success('Coupon updated successfully');
      } else {
        await couponsApi.create(payload);
        toast.success('Coupon created successfully');
      }
      resetForm();
      setIsFormOpen(false);
      fetchCoupons();
    } catch (error: any) {
      console.error('Error saving coupon:', error);
      toast.error(error.response?.data?.error || 'Failed to save coupon');
    }
  };

  // Toggle Active/Inactive status
  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await couponsApi.toggle(id, !currentStatus);
      toast.success(`Coupon status updated`);
      // Update local state to avoid full re-render flickering
      setCoupons(prev => prev.map(c => c.id === id ? { ...c, status: currentStatus ? 0 : 1 } : c));
    } catch (error: any) {
      toast.error('Failed to toggle status');
    }
  };

  // Delete Coupon
  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await couponsApi.delete(deleteId);
      toast.success('Coupon deleted successfully');
      setDeleteId(null);
      fetchCoupons();
    } catch (error: any) {
      toast.error('Failed to delete coupon');
    }
  };

  // View Coupon Details & History
  const handleViewHistory = async (id: number) => {
    try {
      setViewingHistoryId(id);
      const { data } = await couponsApi.getById(id);
      setCouponDetails(data);
    } catch (error) {
      toast.error('Failed to load coupon history');
      setViewingHistoryId(null);
    }
  };

  const getDiscountDisplay = (coupon: any) => {
    if (coupon.discount_type === 'flat') {
      return `₹${coupon.discount_value} OFF`;
    } else if (coupon.discount_type === 'percentage') {
      return `${coupon.discount_value}% OFF`;
    } else if (coupon.discount_type === 'free_delivery') {
      return 'FREE DELIVERY';
    }
    return '';
  };

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      {/* Upper Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-widest text-[#1D1D1F] font-sans">
            Coupon Management
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Build, distribute, and track elegant e-commerce discount campaigns
          </p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => { resetForm(); setIsFormOpen(true); }}
            className="flex items-center justify-center gap-3 bg-black text-white hover:bg-neutral-800 transition-colors px-6 py-4 rounded-xl font-black uppercase text-xs tracking-widest self-start sm:self-auto shadow-lg shadow-black/10 active:scale-95 duration-150"
          >
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        )}
      </div>

      {isFormOpen ? (
        /* Create/Edit Coupon Form */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden"
        >
          <div className="bg-[#241815] text-white p-8 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-pink">Campaign Form</span>
              <h3 className="text-xl font-black uppercase tracking-wider font-sans mt-1">
                {editingId ? 'Edit Campaign Details' : 'Design New Promotion'}
              </h3>
            </div>
            <button 
              onClick={() => { setIsFormOpen(false); resetForm(); }}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-12">
            {/* Row 1: Basic Information */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#1D1D1F] border-b border-gray-100 pb-3 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-brand-pink" /> 1. Basic Campaign Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Coupon Title</label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. Festival Season Kickoff Offer"
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-semibold text-sm"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center justify-between">
                    <span>Coupon Code</span>
                    <button 
                      type="button" 
                      onClick={generateCouponCode}
                      className="text-[10px] font-black text-brand-pink hover:underline uppercase tracking-wider"
                    >
                      Auto-Generate Code
                    </button>
                  </label>
                  <input 
                    required
                    type="text"
                    placeholder="e.g. FESTIVAL500"
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-black tracking-widest uppercase text-sm"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Description</label>
                  <textarea 
                    rows={2}
                    placeholder="Provide a description of this coupon campaign so users and administrators can understand benefits easily..."
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-semibold text-sm resize-none"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</span>
                  <button 
                    type="button"
                    onClick={() => setStatus(!status)}
                    className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${status ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${status ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                  <span className="text-xs font-bold text-gray-600">{status ? 'Active Campaign' : 'Inactive / Paused'}</span>
                </div>
              </div>
            </div>

            {/* Row 2: Discount Logic */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#1D1D1F] border-b border-gray-100 pb-3 flex items-center gap-2">
                <Percent className="w-4 h-4 text-brand-pink" /> 2. Discount Rules & Calculation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-2 md:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Discount Type</label>
                  <select 
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-semibold text-sm"
                    value={discountType}
                    onChange={e => {
                      setDiscountType(e.target.value);
                      if (e.target.value === 'free_delivery') setDiscountValue(0);
                    }}
                  >
                    <option value="flat">Flat Cash Discount (₹)</option>
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="free_delivery">Free Shipping Delivery</option>
                  </select>
                </div>
                
                {discountType !== 'free_delivery' && (
                  <div className="space-y-2 md:col-span-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Discount Value</label>
                    <input 
                      type="number"
                      min={0}
                      className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-semibold text-sm"
                      value={discountValue}
                      onChange={e => setDiscountValue(Math.max(0, Number(e.target.value)))}
                    />
                  </div>
                )}

                {discountType === 'percentage' && (
                  <div className="space-y-2 md:col-span-1">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Max Discount Limit (₹)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 500 (Optional)"
                      className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-semibold text-sm"
                      value={maxDiscount}
                      onChange={e => setMaxDiscount(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Min Order Total (₹)</label>
                  <input 
                    type="number"
                    min={0}
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-semibold text-sm"
                    value={minOrderAmount}
                    onChange={e => setMinOrderAmount(Math.max(0, Number(e.target.value)))}
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Eligibility Matrix */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#1D1D1F] border-b border-gray-100 pb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-pink" /> 3. Target Audience & Eligibility Constraints
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-8 rounded-2xl border border-gray-100">
                <div className="space-y-4">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Configure Target Group</span>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-black rounded border-gray-300"
                      checked={eligAllUsers}
                      onChange={e => {
                        setEligAllUsers(e.target.checked);
                        if (e.target.checked) {
                          setEligNewUsers(false);
                          setEligExistingUsers(false);
                          setEligNeverUsedCoupon(false);
                          setEligPremiumMembers(false);
                        }
                      }}
                    />
                    <span className="text-sm font-bold text-gray-700">All Registered Users</span>
                  </label>

                  {!eligAllUsers && (
                    <div className="pl-6 space-y-4 animate-fadeIn">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-black rounded border-gray-300"
                          checked={eligNewUsers}
                          onChange={e => setEligNewUsers(e.target.checked)}
                        />
                        <span className="text-xs font-semibold text-gray-600">New Users (First Order Only)</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-black rounded border-gray-300"
                          checked={eligExistingUsers}
                          onChange={e => setEligExistingUsers(e.target.checked)}
                        />
                        <span className="text-xs font-semibold text-gray-600">Existing Users (Repeat Buyers)</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-black rounded border-gray-300"
                          checked={eligNeverUsedCoupon}
                          onChange={e => setEligNeverUsedCoupon(e.target.checked)}
                        />
                        <span className="text-xs font-semibold text-gray-600">Users who have never redeemed this coupon before</span>
                      </label>

                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-black rounded border-gray-300"
                          checked={eligPremiumMembers}
                          onChange={e => setEligPremiumMembers(e.target.checked)}
                        />
                        <span className="text-xs font-semibold text-gray-600">Premium Members Only</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-200/50 pt-6 md:pt-0 md:pl-8">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Specific Filters (Comma Separated Lists)</span>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Specific User IDs or Emails</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 5, admin@test.com, 12"
                        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold"
                        value={eligUserIds}
                        onChange={e => setEligUserIds(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Specific User Roles</label>
                      <input 
                        type="text" 
                        placeholder="e.g. premium, agent, superadmin"
                        className="w-full bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-semibold"
                        value={eligRoles}
                        onChange={e => setEligRoles(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Cities</label>
                        <input 
                          type="text" 
                          placeholder="Mumbai"
                          className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-semibold"
                          value={eligCities}
                          onChange={e => setEligCities(e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">States</label>
                        <input 
                          type="text" 
                          placeholder="MH, Delhi"
                          className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-semibold"
                          value={eligStates}
                          onChange={e => setEligStates(e.target.value)}
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[9px] font-black uppercase text-gray-400 mb-1">Countries</label>
                        <input 
                          type="text" 
                          placeholder="India, UAE"
                          className="w-full bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-xs font-semibold"
                          value={eligCountries}
                          onChange={e => setEligCountries(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Limits & Usage Policies */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#1D1D1F] border-b border-gray-100 pb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-pink" /> 4. Usage Rules & Safeguards
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Usage Limit per User</label>
                  <input 
                    type="number"
                    min={1}
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-semibold text-sm"
                    value={userUsageLimit}
                    onChange={e => setUserUsageLimit(Math.max(1, Number(e.target.value)))}
                  />
                  <span className="text-[10px] text-gray-400 font-bold block italic">Maximum times a single customer can redeem. Default: 1</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Total Campaign Redemption Cap</label>
                  <input 
                    type="number"
                    placeholder="Unlimited (Optional)"
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-semibold text-sm"
                    value={totalUsageLimit}
                    onChange={e => setTotalUsageLimit(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                  />
                  <span className="text-[10px] text-gray-400 font-bold block italic">Overall usage threshold across all clients</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">One Coupon Per Order Policy</label>
                  <div className="flex items-center space-x-4 pt-2">
                    <button 
                      type="button"
                      onClick={() => setOneCouponPerOrder(true)}
                      className={`px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${oneCouponPerOrder ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-black'}`}
                    >
                      Yes (Exclusive)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setOneCouponPerOrder(false)}
                      className={`px-5 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${!oneCouponPerOrder ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-black'}`}
                    >
                      No (Stackable)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 5: Validity Period */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-[#1D1D1F] border-b border-gray-100 pb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-pink" /> 5. Campaign Validity Period
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Start Date & Time</label>
                  <input 
                    type="datetime-local"
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-semibold text-sm"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                  <span className="text-[10px] text-gray-400 block italic">Campaign is invalid prior to this timestamp</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">Expiration Date & Time</label>
                  <input 
                    type="datetime-local"
                    className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black font-semibold text-sm"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                  <span className="text-[10px] text-gray-400 block italic">Campaign automatically deactivates after this timestamp</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-8 border-t border-gray-100">
              <button 
                type="button"
                onClick={() => { setIsFormOpen(false); resetForm(); }}
                className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-[#1D1D1F] font-black uppercase text-xs tracking-widest rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-8 py-4 bg-black hover:bg-neutral-800 text-white font-black uppercase text-xs tracking-widest rounded-xl transition-colors shadow-lg shadow-black/10"
              >
                {editingId ? 'Update Campaign' : 'Publish Campaign'}
              </button>
            </div>
          </form>
        </motion.div>
      ) : (
        /* Coupons List View */
        <div className="space-y-8">
          {/* Filters Bar */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search coupons by code or title..." 
                className="w-full bg-gray-50 border-none rounded-xl pl-12 pr-6 py-3 focus:ring-2 focus:ring-black font-semibold text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div>
              <select 
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-3 focus:ring-2 focus:ring-black font-semibold text-xs"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">Filter by Campaign Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div>
              <select 
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-3 focus:ring-2 focus:ring-black font-semibold text-xs"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="">Filter by Discount Type</option>
                <option value="flat">Flat Cash Discount</option>
                <option value="percentage">Percentage Discount</option>
                <option value="free_delivery">Free Delivery</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-black mb-3" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Loading active campaigns...</p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="bg-white rounded-2xl p-16 border border-gray-100 text-center space-y-4">
              <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-widest text-[#1D1D1F]">No Coupons Found</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto font-medium">
                Establish creative marketing campaigns, seasonal codes, and specific member rewards.
              </p>
              <button 
                onClick={() => setIsFormOpen(true)}
                className="bg-black text-white hover:bg-neutral-800 transition-colors px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Your First Coupon
              </button>
            </div>
          ) : (
            /* Bento-style Coupons Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {coupons.map((coupon) => {
                const isActive = coupon.status === 1;
                const isExpired = coupon.end_date && new Date(coupon.end_date) < new Date();
                const isUpcoming = coupon.start_date && new Date(coupon.start_date) > new Date();

                return (
                  <div 
                    key={coupon.id} 
                    className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div className="p-8 space-y-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <span className={`text-[9px] font-black px-3 py-1.5 rounded-full tracking-wider uppercase ${
                            isExpired ? 'bg-red-50 text-red-600 border border-red-100' :
                            isUpcoming ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {isExpired ? 'Expired' : isUpcoming ? 'Scheduled' : isActive ? 'Active' : 'Paused'}
                          </span>
                          <h3 className="text-lg font-black text-[#1D1D1F] tracking-tight pt-2">
                            {coupon.title}
                          </h3>
                        </div>
                        <div className="bg-[#FFF8FA] border border-[#fceef2] rounded-2xl px-5 py-4 text-center">
                          <span className="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Discount</span>
                          <span className="text-xs font-black text-brand-pink uppercase tracking-wider block">
                            {getDiscountDisplay(coupon)}
                          </span>
                        </div>
                      </div>

                      {/* Coupon Code Card */}
                      <div className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-dashed border-gray-200">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">PROMO CODE</span>
                          <p className="font-mono font-black text-sm text-black tracking-widest uppercase">{coupon.code}</p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            toast.success('Code copied to clipboard!');
                          }}
                          className="text-[9px] font-black text-black hover:underline uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-gray-100"
                        >
                          Copy
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 font-medium line-clamp-2">
                        {coupon.description || 'No description supplied.'}
                      </p>

                      {/* Campaign Limits & Stats */}
                      <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                        <div className="text-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider">REDEEMED</span>
                          <span className="text-sm font-black text-black block mt-1">{coupon.total_usage_count}</span>
                          {coupon.total_usage_limit && (
                            <span className="text-[8px] text-gray-400 font-bold block">of {coupon.total_usage_limit} cap</span>
                          )}
                        </div>
                        <div className="text-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider">ELIGIBLE</span>
                          <span className="text-sm font-black text-[#241815] block mt-1">{coupon.eligible_user_count}</span>
                          <span className="text-[8px] text-gray-400 font-bold block">active users</span>
                        </div>
                        <div className="text-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <span className="block text-[8px] font-black uppercase text-gray-400 tracking-wider">MIN PURCHASE</span>
                          <span className="text-sm font-black text-gray-600 block mt-1">₹{coupon.min_order_amount}</span>
                        </div>
                      </div>

                      {/* Date bounds */}
                      {(coupon.start_date || coupon.end_date) && (
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span>
                            {coupon.start_date ? new Date(coupon.start_date).toLocaleDateString() : 'Start'}
                            {' - '}
                            {coupon.end_date ? new Date(coupon.end_date).toLocaleDateString() : 'Expiry'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom controls */}
                    <div className="bg-gray-50/70 border-t border-gray-100 px-8 py-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleToggleStatus(coupon.id, isActive)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-[9px] font-black uppercase tracking-wider text-gray-500">
                          {isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleViewHistory(coupon.id)}
                          title="View Usage Log"
                          className="p-2 text-gray-500 hover:text-[#241815] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100 shadow-sm"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(coupon)}
                          title="Edit Coupon"
                          className="p-2 text-[#1D1D1F] hover:text-[#241815] hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100 shadow-sm"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteId(coupon.id)}
                          title="Delete Coupon"
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-red-100 shadow-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Slide-over Usage History Detail Modal */}
      <AnimatePresence>
        {viewingHistoryId && couponDetails && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setViewingHistoryId(null); setCouponDetails(null); }}
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ translateX: '100%' }}
              animate={{ translateX: 0 }}
              exit={{ translateX: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-full max-w-2xl h-full bg-white shadow-2xl flex flex-col justify-between"
            >
              <div className="p-8 overflow-y-auto flex-1 space-y-8">
                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#241815]">History log</span>
                    <h3 className="text-xl font-black uppercase tracking-wider font-sans mt-1">
                      Campaign Analytics
                    </h3>
                  </div>
                  <button 
                    onClick={() => { setViewingHistoryId(null); setCouponDetails(null); }}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-1">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Total Usage Count</span>
                    <p className="text-2xl font-black text-black">{couponDetails.total_usage_count}</p>
                    <p className="text-[9px] font-semibold text-gray-400">Total discount claims committed</p>
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-1">
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider">Eligible Audience</span>
                    <p className="text-2xl font-black text-brand-pink">{couponDetails.eligible_user_count}</p>
                    <p className="text-[9px] font-semibold text-gray-400">Users currently fitting requirements</p>
                  </div>
                </div>

                {/* Campaign Config Summary */}
                <div className="bg-[#FFF8FA] rounded-2xl p-6 border border-[#fceef2] space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-pink flex items-center gap-2">
                    <Ticket className="w-4 h-4" /> Coupon Configuration Specs
                  </h4>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs font-bold text-gray-700">
                    <div className="flex justify-between border-b border-gray-200/50 pb-2">
                      <span className="text-gray-400">Code:</span>
                      <span className="font-mono text-black">{couponDetails.code}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/50 pb-2">
                      <span className="text-gray-400">Reward:</span>
                      <span className="text-black">{getDiscountDisplay(couponDetails)}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/50 pb-2">
                      <span className="text-gray-400">Min Purchase:</span>
                      <span className="text-black">₹{couponDetails.min_order_amount}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200/50 pb-2">
                      <span className="text-gray-400">User Usage Cap:</span>
                      <span className="text-black">{couponDetails.user_usage_limit} times</span>
                    </div>
                  </div>
                </div>

                {/* Usage History Log Table */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#1D1D1F] border-b border-gray-100 pb-3 flex items-center gap-2">
                    <History className="w-4 h-4 text-brand-pink" /> 6. Customer Redemption Records
                  </h4>
                  
                  {couponDetails.usages && couponDetails.usages.length > 0 ? (
                    <div className="space-y-4">
                      {couponDetails.usages.map((use: any) => (
                        <div key={use.id} className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm flex items-center justify-between">
                          <div className="space-y-1">
                            <p className="text-xs font-black text-black">{use.user_name || 'Customer'}</p>
                            <p className="text-[10px] font-bold text-gray-400">{use.user_email}</p>
                            <span className="inline-block text-[8px] font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded px-2 py-0.5">
                              Order #{String(use.order_id).padStart(5, '0')}
                            </span>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="text-xs font-black text-brand-pink block">
                              -₹{use.discount_applied}
                            </span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider block">
                              {new Date(use.used_at).toLocaleDateString()} {new Date(use.used_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-100 text-gray-400 space-y-1">
                      <History className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                      <p className="text-xs font-bold uppercase tracking-wider">No Redemptions Yet</p>
                      <p className="text-[10px]">When customers place orders with this coupon, logs will register here.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => { setViewingHistoryId(null); setCouponDetails(null); }}
                  className="px-6 py-3 bg-black hover:bg-neutral-800 text-white rounded-xl font-black uppercase text-xs tracking-widest"
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deleteId !== null && (
        <ConfirmModal 
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Coupon Campaign"
          message="Are you absolutely sure you want to permanently delete this coupon campaign? This action is irreversible and all recorded redemption associations will be removed from logs."
        />
      )}
    </div>
  );
};
