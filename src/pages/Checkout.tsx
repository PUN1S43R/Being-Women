import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { paymentApi, couponsApi } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck, CreditCard, Truck, Tag, Ticket, X, Loader2 } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const Checkout = () => {
  const { cart, total, clearCart, syncCartPricesAndStock } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'COD'>('Razorpay');
  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    syncCartPricesAndStock();
  }, []);

  // Coupon application states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponFreeDelivery, setCouponFreeDelivery] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  // Available coupons list
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const fetchAvailableCoupons = async () => {
    if (!user) return;
    setLoadingCoupons(true);
    try {
      const { data } = await couponsApi.getAvailable(total);
      setAvailableCoupons(data || []);
    } catch (error) {
      console.error('Error fetching available coupons:', error);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    fetchAvailableCoupons();
  }, [user, total]);

  useEffect(() => {
    // Load Razorpay Script
    const razorpayScript = document.createElement('script');
    razorpayScript.src = "https://checkout.razorpay.com/v1/checkout.js";
    razorpayScript.async = true;
    document.body.appendChild(razorpayScript);

    return () => {
      document.body.removeChild(razorpayScript);
    };
  }, []);

  const applySelectedCoupon = async (codeToApply: string) => {
    setCouponLoading(true);
    try {
      const { data } = await couponsApi.apply(codeToApply.trim().toUpperCase(), total);
      if (data.valid || data.success) {
        setAppliedCoupon(data.coupon);
        setCouponCode(codeToApply.trim().toUpperCase());
        setCouponDiscount(data.discount || 0);
        setCouponFreeDelivery(!!data.freeDelivery);
        toast.success(data.message || 'Coupon applied successfully!');
      } else {
        toast.error(data.message || 'Coupon is not valid');
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponFreeDelivery(false);
      }
    } catch (error: any) {
      console.error('Error applying coupon:', error);
      toast.error(error.response?.data?.error || 'Failed to apply coupon');
      setAppliedCoupon(null);
      setCouponDiscount(0);
      setCouponFreeDelivery(false);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    await applySelectedCoupon(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponDiscount(0);
    setCouponFreeDelivery(false);
    toast.success('Coupon removed');
  };

  const handlePaymentAndOrderAndRedirect = async () => {
    if (!user) {
      toast.error('Please login to place an order');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);
    try {
      const hasFreeDelivery = couponFreeDelivery || total > 2000;
      const shippingCharge = hasFreeDelivery ? 0 : 99;
      const discountedSubtotal = Math.max(0, total - couponDiscount);
      const tax = Math.round(discountedSubtotal * 0.05);
      const finalTotal = discountedSubtotal + shippingCharge + tax;
      const requiredAmount = paymentMethod === 'COD' ? 150 : finalTotal;

      const orderPayload = {
        amount: requiredAmount,
        shipping_address: `${address.fullName}, ${address.phone}, ${address.street}, ${address.city}, ${address.state} - ${address.pincode}`,
        phone: address.phone,
        payment_method: paymentMethod,
        full_name: address.fullName,
        email: user.email,
        coupon_code: appliedCoupon ? appliedCoupon.code : null,
        items: cart.map(item => ({
          product_id: item.productId,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
          color: item.color
        }))
      };

      // 1. Create order on secure backend to get Razorpay Order ID
      const { data: orderData } = await paymentApi.createRazorpayOrder(orderPayload);

      // 2. Open Razorpay Checkout modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Being Women",
        description: paymentMethod === 'COD' ? "COD Advance Payment" : "Order Payment",
        order_id: orderData.id,
        handler: async function (response: any) {
          setLoading(true);
          try {
            // 3. Verify signature on backend securely
            const verifyPayload = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };

            const verifyRes = await paymentApi.verifyRazorpaySignature(verifyPayload);

            if (verifyRes.data && verifyRes.data.success) {
              toast.success("Payment Verified & Order Placed!");
              // Only clear cart after backend success is verified!
              clearCart();
              navigate(`/order-success/${verifyRes.data.orderId}`);
            } else {
              toast.error("Payment Verification Failed");
              navigate('/order-failed');
            }
          } catch (err: any) {
            console.error("Verification Error:", err);
            toast.error(err.response?.data?.error || "Payment verification failed");
            navigate('/order-failed');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: address.fullName,
          email: user?.email,
          contact: address.phone
        },
        theme: {
          color: "#000000"
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            toast.error("Payment cancelled by customer");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setLoading(false);
        console.error("Razorpay Failure Response:", response.error);
        toast.error("Payment Failed");
        navigate('/order-failed');
      });
      rzp.open();
    } catch (error: any) {
      setLoading(false);
      console.error("Razorpay Order Creation Flow Error:", error);
      toast.error(error.response?.data?.error || "Failed to initiate payment. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handlePaymentAndOrderAndRedirect();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      <h1 className="text-3xl font-black uppercase tracking-widest mb-12">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Shipping Details */}
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">1</div>
              <h2 className="text-xl font-black uppercase tracking-widest">Shipping Address</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                required
                placeholder="Full Name"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.fullName}
                onChange={e => setAddress({...address, fullName: e.target.value})}
              />
              <input 
                required
                placeholder="Phone Number"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.phone}
                onChange={e => setAddress({...address, phone: e.target.value})}
              />
              <input 
                required
                placeholder="Street Address"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black md:col-span-2"
                value={address.street}
                onChange={e => setAddress({...address, street: e.target.value})}
              />
              <input 
                required
                placeholder="City"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.city}
                onChange={e => setAddress({...address, city: e.target.value})}
              />
              <input 
                required
                placeholder="State"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.state}
                onChange={e => setAddress({...address, state: e.target.value})}
              />
              <input 
                required
                placeholder="Pincode"
                className="w-full bg-gray-50 border-none rounded-xl px-6 py-4 focus:ring-2 focus:ring-black"
                value={address.pincode}
                onChange={e => setAddress({...address, pincode: e.target.value})}
              />
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center font-bold">2</div>
              <h2 className="text-xl font-black uppercase tracking-widest">Payment Method</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => setPaymentMethod('Razorpay')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${paymentMethod === 'Razorpay' ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-black'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <CreditCard className="w-6 h-6" />
                  {paymentMethod === 'Razorpay' && <ShieldCheck className="w-5 h-5" />}
                </div>
                <p className="font-black uppercase tracking-widest">Razorpay Online</p>
                <p className={`text-xs mt-1 ${paymentMethod === 'Razorpay' ? 'text-gray-400' : 'text-gray-500'}`}>UPI / Cards / Netbanking</p>
              </button>
              <button 
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`p-6 rounded-xl border-2 text-left transition-all ${paymentMethod === 'COD' ? 'border-black bg-black text-white' : 'border-gray-100 hover:border-black'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <Truck className="w-6 h-6" />
                  {paymentMethod === 'COD' && <ShieldCheck className="w-5 h-5" />}
                </div>
                <p className="font-black uppercase tracking-widest">COD with Advance</p>
                <p className={`text-xs mt-1 ${paymentMethod === 'COD' ? 'text-gray-400' : 'text-gray-500'}`}>₹150 Advance Paid Online</p>
              </button>
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="space-y-8">
          <div className="bg-gray-50 p-8 rounded-xl space-y-6 sticky top-24">
            <h2 className="font-black uppercase tracking-widest text-lg">Order Summary</h2>
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-500">{item.name} x {item.quantity}</span>
                  <span className="font-bold">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Promo / Coupon Block */}
            <div className="pt-6 border-t border-gray-200 space-y-4">
              <h3 className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                <Tag className="w-4 h-4 text-brand-pink" /> Use Coupon Code
              </h3>
              {appliedCoupon ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between animate-fadeIn">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">APPLIED</span>
                    <p className="font-mono font-black text-xs text-black tracking-widest uppercase">{appliedCoupon.code}</p>
                    <p className="text-[10px] text-gray-500 font-semibold">{appliedCoupon.title}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="p-1.5 bg-white hover:bg-emerald-100 rounded-full border border-emerald-100 text-emerald-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Coupon Code" 
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-black uppercase font-mono font-black tracking-wider text-xs"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value)}
                  />
                  <button 
                    type="button"
                    disabled={couponLoading || !couponCode.trim()}
                    onClick={handleApplyCoupon}
                    className="bg-black hover:bg-neutral-800 text-white disabled:opacity-50 px-5 rounded-xl font-black uppercase text-xs tracking-widest transition-colors flex items-center justify-center min-w-[80px]"
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              )}

              {/* Available and Eligible Coupons list */}
              {availableCoupons && availableCoupons.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5 text-brand-pink" /> Eligible Coupons For You
                    </span>
                  </div>

                  {availableCoupons.filter((coupon) => coupon.checkResult?.valid).length > 0 ? (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {availableCoupons
                        .filter((coupon) => coupon.checkResult?.valid)
                        .map((coupon) => {
                          const isAlreadyApplied = appliedCoupon && appliedCoupon.code === coupon.code;
                          const discountText = coupon.discount_type === 'flat' 
                            ? `₹${coupon.discount_value} OFF`
                            : coupon.discount_type === 'percentage'
                              ? `${coupon.discount_value}% OFF`
                              : 'FREE SHIPPING';

                          return (
                            <div 
                              key={coupon.id} 
                              className={`border rounded-xl p-3 transition-all duration-150 relative overflow-hidden ${
                                isAlreadyApplied 
                                  ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300'
                                  : 'bg-white hover:bg-neutral-50 border-gray-200 cursor-pointer hover:border-black'
                              }`}
                              onClick={() => {
                                if (isAlreadyApplied) {
                                  handleRemoveCoupon();
                                } else {
                                  applySelectedCoupon(coupon.code);
                                }
                              }}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-black text-xs text-[#1D1D1F] tracking-widest uppercase bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                                      {coupon.code}
                                    </span>
                                    {isAlreadyApplied && (
                                      <span className="text-[8px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded uppercase">
                                        Applied
                                      </span>
                                    )}
                                    {!isAlreadyApplied && (
                                      <span className="text-[8px] font-black text-brand-pink bg-pink-50 px-1.5 py-0.5 rounded uppercase">
                                        Eligible
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-black text-gray-800 line-clamp-1">{coupon.title}</p>
                                  {coupon.description && (
                                    <p className="text-[10px] text-gray-400 font-medium line-clamp-1">{coupon.description}</p>
                                  )}
                                </div>
                                
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-black text-brand-pink uppercase tracking-wider block">
                                    {discountText}
                                  </span>
                                  {coupon.min_order_amount > 0 && (
                                    <span className="text-[8px] text-gray-400 font-bold block mt-0.5">
                                      Min: ₹{coupon.min_order_amount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-4 px-2 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                      <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">No Eligible Coupons Available</p>
                      <p className="text-[9px] text-gray-400 mt-1 font-semibold">Your current cart subtotal or user details do not meet any active coupon conditions.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-gray-200 space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold">₹{total}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-brand-pink font-bold">
                  <span>Discount ({appliedCoupon?.code})</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-bold text-emerald-600">
                  {couponFreeDelivery ? (
                    <span className="flex items-center gap-1">
                      FREE <span className="text-[10px] font-normal text-gray-400 font-mono">(Coupon)</span>
                    </span>
                  ) : total > 2000 ? (
                    'FREE'
                  ) : (
                    `₹99`
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (5%)</span>
                <span className="font-bold">₹{Math.round(Math.max(0, total - couponDiscount) * 0.05)}</span>
              </div>
              {paymentMethod === 'COD' && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>COD Advance</span>
                  <span>₹150</span>
                </div>
              )}
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-black uppercase tracking-widest">Total</span>
                <span className="text-2xl font-black">
                  ₹{Math.max(0, total - couponDiscount) + (couponFreeDelivery || total > 2000 ? 0 : 99) + Math.round(Math.max(0, total - couponDiscount) * 0.05)}
                </span>
              </div>
            </div>
            <button 
              disabled={loading}
              className="w-full bg-black text-white py-5 rounded-xl font-black uppercase tracking-widest hover:bg-gray-900 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : paymentMethod === 'COD' ? 'Pay ₹150 & Place Order' : `Pay via ${paymentMethod} & Place Order`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
