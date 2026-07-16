"use client";

import React, { useState, useEffect } from "react";
import { Search, ShoppingCart, Plus, Minus, CreditCard, Receipt, Barcode } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from "recharts";

const chartData = [
  { name: "8am", revenue: 400 },
  { name: "10am", revenue: 900 },
  { name: "12pm", revenue: 1500 },
  { name: "2pm", revenue: 2100 },
  { name: "4pm", revenue: 3800 },
  { name: "6pm", revenue: 4850 },
];

export default function MockPOSDashboard() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="w-full h-full flex bg-[#050505] text-zinc-300 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-16 border-r border-zinc-800/80 bg-[#020202] flex flex-col items-center py-6 gap-8 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="w-8 h-8 rounded bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(99,102,241,0.4)]">A</div>
        <div className="w-10 h-10 rounded-xl hover:bg-zinc-800/30 flex items-center justify-center text-zinc-500 transition-colors"><ShoppingCart size={20} /></div>
        <div className="w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center text-brand-400 border border-brand-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]"><BarChart2 size={20} /></div>
        <div className="w-10 h-10 rounded-xl hover:bg-zinc-800/30 flex items-center justify-center text-zinc-500 transition-colors"><Search size={20} /></div>
      </div>

      {/* Main Content Area (Analytics & Products) */}
      <div className="flex-1 p-6 flex flex-col bg-[#050505] relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.05)_0%,transparent_50%)]"></div>
        
        <div className="relative z-10 flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Today's Performance</h2>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs text-zinc-400">Main Branch</span>
            <span className="px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-xs text-brand-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span> Live
            </span>
          </div>
        </div>

        {/* Analytics Chart */}
        <div className="relative z-10 h-48 w-full bg-[#0a0a0a] border border-zinc-800/80 rounded-2xl p-4 mb-6 shadow-xl">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Gross Revenue</div>
              <div className="text-3xl font-bold text-white">$4,850.00 <span className="text-sm text-success font-medium ml-2">+14.5%</span></div>
            </div>
          </div>
          <div className="h-28 w-full -ml-4">
            {mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                    animationDuration={2000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="relative z-10 flex justify-between items-center mb-4 mt-2">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Fast-Moving Items</h3>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          <ProductCard name="Michelin Pilot Sport 4S" category="Tires" price="$245.00" stock="12 in stock" />
          <ProductCard name="Bosch S4 Battery" category="Batteries" price="$120.00" stock="5 in stock" />
          <ProductCard name="Castrol EDGE 5W-30" category="Oil" price="$45.00" stock="24 in stock" />
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-80 border-l border-zinc-800/80 bg-[#020202] flex flex-col z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.5)]">
        <div className="p-5 border-b border-zinc-800/80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">Active Cart</h3>
            <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400">Walk-in</span>
          </div>
          
          <div className="flex flex-col gap-3 mt-4">
            <CartItem name="Michelin Pilot Sport 4S" qty={4} price="$980.00" />
            <CartItem name="Bosch S4 Battery" qty={1} price="$120.00" />
          </div>
        </div>

        <div className="p-5 mt-auto bg-zinc-900/30">
          <div className="flex justify-between text-sm mb-2 text-zinc-400">
            <span>Subtotal</span>
            <span>$1,100.00</span>
          </div>
          <div className="flex justify-between text-sm mb-4 text-zinc-400">
            <span>Tax (8%)</span>
            <span>$88.00</span>
          </div>
          <div className="flex justify-between text-lg font-bold mb-6 text-white border-t border-zinc-800 pt-3">
            <span>Total</span>
            <span>$1,188.00</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button className="py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors">
              <CreditCard size={16} /> Card
            </button>
            <button className="py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors">
              <span className="font-serif">$</span> Cash
            </button>
          </div>

          <button className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all">
            <Receipt size={18} /> Complete Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ name, category, price, stock }: { name: string, category: string, price: string, stock: string }) {
  return (
    <div className="bg-[#0a0a0a] border border-zinc-800/80 rounded-xl p-4 hover:border-brand-500/50 cursor-pointer transition-all duration-300 group relative overflow-hidden shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="text-[10px] uppercase tracking-wider text-brand-400 font-bold mb-1">{category}</div>
      <div className="text-sm text-zinc-200 font-semibold leading-tight mb-4 h-10 group-hover:text-white transition-colors">{name}</div>
      <div className="flex justify-between items-end">
        <div className="text-lg font-bold text-white">{price}</div>
        <div className="text-xs text-zinc-500 font-medium">{stock}</div>
      </div>
    </div>
  );
}

function CartItem({ name, qty, price }: { name: string, qty: number, price: string }) {
  return (
    <div className="flex justify-between items-start group">
      <div className="flex-1">
        <div className="text-sm font-medium text-zinc-200 line-clamp-1 group-hover:text-white transition-colors">{name}</div>
        <div className="text-xs text-zinc-500 mt-2 flex items-center gap-2">
          <button className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center hover:bg-zinc-700 transition-colors"><Minus size={12} /></button>
          <span className="text-zinc-300 font-medium w-4 text-center">{qty}</span>
          <button className="w-6 h-6 bg-zinc-800 rounded flex items-center justify-center hover:bg-zinc-700 transition-colors"><Plus size={12} /></button>
        </div>
      </div>
      <div className="text-sm font-semibold text-white mt-1">{price}</div>
    </div>
  );
}

// Simple BarChart icon component
function BarChart2({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  );
}
