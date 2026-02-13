
import React, { useState, Suspense, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useInView } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, PerspectiveCamera, Stars, ContactShadows, OrbitControls, Environment, MeshDistortMaterial } from '@react-three/drei';
import { 
  Github, 
  Linkedin, 
  Mail, 
  ExternalLink, 
  ChevronDown, 
  Code, 
  Target, 
  Users, 
  Globe, 
  Zap,
  CheckCircle2,
  AlertCircle,
  BarChart,
  User,
  Info,
  ArrowRight,
  Monitor,
  Download,
  Plus,
  Edit2,
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import * as THREE from 'three';
import { 
  StudentData, 
  TaskType, 
  PortfolioReview, 
  Project,
  Skill,
  Bill,
  Customer
} from './types';
import { generateReview } from './services/geminiService';
import { 
  MODULE_CODE, 
  UNIVERSITY, 
  CASE_STUDY,
  SKILLS
} from './constants';

// --- 3D Components ---
function RocketModel({ isHovered }: { isHovered: boolean }) {
  const meshRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += isHovered ? 0.04 : 0.01;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime) * 0.2;
      const targetScale = isHovered ? 1.3 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group ref={meshRef}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 3, 32]} />
        <meshStandardMaterial color="#e4002b" roughness={0.05} metalness={0.9} emissive="#660000" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0, 2.25, 0]}>
        <coneGeometry args={[0.5, 1.5, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0.48]}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="#88ccff" emissive="#0044ff" emissiveIntensity={1} metalness={1} roughness={0} />
      </mesh>
    </group>
  );
}

function SceneBackground() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.05;
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.03;
    }
  });
  return (
    <mesh ref={ref} scale={20}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial color="#002d56" distort={0.4} speed={2} transparent opacity={0.1} wireframe />
    </mesh>
  );
}

// --- UI Components ---
const FadeInSection: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const SkillCard: React.FC<{ skill: Skill }> = ({ skill }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const IconMap: any = { target: Target, globe: Globe, 'bar-chart': BarChart, zap: Zap };
  const Icon = IconMap[skill.icon] || Info;

  return (
    <div className="relative group" onMouseEnter={() => setShowTooltip(true)} onMouseLeave={() => setShowTooltip(false)}>
      <motion.div whileHover={{ scale: 1.05, translateY: -5 }} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center cursor-default transition-shadow hover:shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-uwe-blue/5 text-uwe-blue flex items-center justify-center mb-4"><Icon size={24} /></div>
        <h4 className="font-bold text-uwe-blue text-sm mb-1">{skill.name}</h4>
        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{skill.category}</p>
      </motion.div>
      <AnimatePresence>
        {showTooltip && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 p-3 bg-uwe-blue text-white rounded-xl shadow-2xl text-[11px] leading-relaxed text-center pointer-events-none">
            {skill.description}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-uwe-blue" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<PortfolioReview | null>(null);
  const [isRocketHovered, setIsRocketHovered] = useState(false);
  
  // Billing State
  const [bills, setBills] = useState<Bill[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);
  const [billForm, setBillForm] = useState({
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    total: 0,
    currency: 'GBP',
    status: 'PENDING' as Bill['status']
  });

  const itemsPerPage = 5;

  useEffect(() => {
    // Initial dummy data for demonstration
    const dummyBills: Bill[] = [
      { id: '1', customerId: 'c1', vendor: 'UWE Bristol', date: '2024-10-01', dueDate: '2024-10-15', total: 1200, currency: 'GBP', status: 'PAID' },
      { id: '2', customerId: 'c2', vendor: 'OwlTech Global', date: '2024-11-10', dueDate: '2024-12-05', total: 4500, currency: 'USD', status: 'PENDING' },
      { id: '3', customerId: 'c1', vendor: 'UWE Bristol', date: '2024-11-20', dueDate: '2024-12-01', total: 800, currency: 'GBP', status: 'OVERDUE' },
      { id: '4', customerId: 'c3', vendor: 'Morningstar Labs', date: '2024-12-01', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], total: 300, currency: 'GBP', status: 'PENDING' },
      { id: '5', customerId: 'c4', vendor: 'Zenith Consultancy', date: '2024-12-05', dueDate: '2025-01-05', total: 1500, currency: 'EUR', status: 'PENDING' },
      { id: '6', customerId: 'c5', vendor: 'TechBridge', date: '2024-12-06', dueDate: '2024-12-20', total: 950, currency: 'GBP', status: 'PENDING' },
    ];
    setBills(dummyBills);
    setCustomers([
      { id: 'c1', name: 'UWE Bristol', email: 'billing@uwe.ac.uk', totalSpent: 2000, billIds: ['1', '3'] },
      { id: 'c2', name: 'OwlTech Global', email: 'finance@owltech.com', totalSpent: 4500, billIds: ['2'] },
    ]);
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const totalPages = Math.ceil(bills.length / itemsPerPage);
  const currentBills = bills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSaveBill = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Customer Profiling Logic
    let customer = customers.find(c => c.name.toLowerCase() === billForm.vendor.toLowerCase());
    const billId = editingBillId || Math.random().toString(36).substr(2, 9);
    
    if (!customer) {
      // Creative new profile
      customer = {
        id: 'c' + Math.random().toString(36).substr(2, 5),
        name: billForm.vendor,
        email: `${billForm.vendor.toLowerCase().replace(/\s/g, '')}@client.com`,
        totalSpent: billForm.total,
        billIds: [billId]
      };
      setCustomers([...customers, customer]);
    } else {
      // Link to existing
      customer.totalSpent += billForm.total;
      if (!customer.billIds.includes(billId)) {
        customer.billIds.push(billId);
      }
    }

    const newBill: Bill = {
      id: billId,
      customerId: customer.id,
      ...billForm
    };

    if (editingBillId) {
      setBills(bills.map(b => b.id === editingBillId ? newBill : b));
    } else {
      setBills([newBill, ...bills]);
    }

    // Reset Form
    setEditingBillId(null);
    setBillForm({ vendor: '', date: new Date().toISOString().split('T')[0], dueDate: '', total: 0, currency: 'GBP', status: 'PENDING' });
  };

  const handleEdit = (bill: Bill) => {
    setEditingBillId(bill.id);
    setBillForm({
      vendor: bill.vendor,
      date: bill.date,
      dueDate: bill.dueDate,
      total: bill.total,
      currency: bill.currency,
      status: bill.status
    });
    // Scroll to form
    document.getElementById('billing-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const exportToCSV = () => {
    const headers = ['Vendor', 'Date', 'Due Date', 'Total', 'Currency', 'Status'];
    const rows = bills.map(b => [b.vendor, b.date, b.dueDate, b.total, b.currency, b.status]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ashraf_bills_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isDueSoon = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  };

  if (loading) {
    return (
      <div className="h-screen w-full uwe-gradient flex flex-col items-center justify-center text-white">
        <div className="w-24 h-24 border-8 border-white/20 border-t-uwe-red rounded-full animate-spin" />
        <h2 className="mt-8 text-2xl font-black academic-header uppercase tracking-widest">Loading Analytics...</h2>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      <nav className="fixed w-full z-50 py-4 px-12 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span className="font-black text-uwe-blue tracking-tighter text-2xl">AM.</span>
          <div className="flex gap-6">
            <button onClick={exportToCSV} className="flex items-center gap-2 text-xs font-black uppercase text-uwe-blue hover:text-uwe-red transition">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => setEditingBillId(null)} className="bg-uwe-red text-white px-6 py-2 rounded-full text-xs font-black transition shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 flex items-center gap-2">
              <Plus size={14} /> New Invoice
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Invoice Form */}
        <div className="lg:col-span-4" id="billing-form">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100">
            <h3 className="text-xl font-black text-uwe-blue mb-6 flex items-center gap-3">
              <FileText className="text-uwe-red" />
              {editingBillId ? 'Update Invoice' : 'Generate Invoice'}
            </h3>
            <form onSubmit={handleSaveBill} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Client Name</label>
                <input 
                  required
                  type="text" 
                  value={billForm.vendor}
                  onChange={e => setBillForm({...billForm, vendor: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-transparent rounded-xl focus:border-uwe-blue outline-none transition text-sm font-medium"
                  placeholder="Enter Client/Vendor"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Date</label>
                  <input 
                    required
                    type="date" 
                    value={billForm.date}
                    onChange={e => setBillForm({...billForm, date: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-transparent rounded-xl focus:border-uwe-blue outline-none transition text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Due Date</label>
                  <input 
                    required
                    type="date" 
                    value={billForm.dueDate}
                    onChange={e => setBillForm({...billForm, dueDate: e.target.value})}
                    className={`w-full p-4 bg-slate-50 border border-transparent rounded-xl focus:border-uwe-blue outline-none transition text-sm font-medium ${isDueSoon(billForm.dueDate) ? 'border-amber-400 text-amber-700' : ''}`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Amount</label>
                  <input 
                    required
                    type="number" 
                    value={billForm.total}
                    onChange={e => setBillForm({...billForm, total: Number(e.target.value)})}
                    className="w-full p-4 bg-slate-50 border border-transparent rounded-xl focus:border-uwe-blue outline-none transition text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Currency</label>
                  <select 
                    value={billForm.currency}
                    onChange={e => setBillForm({...billForm, currency: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-transparent rounded-xl focus:border-uwe-blue outline-none transition text-sm font-medium"
                  >
                    <option>GBP</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Status</label>
                <div className="flex gap-2">
                  {['PAID', 'PENDING', 'OVERDUE'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBillForm({...billForm, status: s as Bill['status']})}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billForm.status === s ? 'bg-uwe-blue text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-uwe-blue text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl mt-4">
                {editingBillId ? 'Apply Changes' : 'Link & Save Invoice'}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Right: Bill Table & Client View */}
        <div className="lg:col-span-8 space-y-12">
          <FadeInSection>
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h3 className="academic-header text-2xl font-black text-uwe-blue">Managed Accounts</h3>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  Showing {itemsPerPage} of {bills.length} Records
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-8 py-4">Client / Vendor</th>
                      <th className="px-4 py-4">Issue Date</th>
                      <th className="px-4 py-4">Due Date</th>
                      <th className="px-4 py-4">Amount</th>
                      <th className="px-4 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <AnimatePresence mode="popLayout">
                      {currentBills.map((bill) => (
                        <motion.tr 
                          key={bill.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => handleEdit(bill)}
                          className="group cursor-pointer hover:bg-uwe-blue/[0.02] transition-colors"
                        >
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-uwe-blue text-xs uppercase">
                                  {bill.vendor.substring(0, 2)}
                                </div>
                                {isDueSoon(bill.dueDate) && bill.status !== 'PAID' && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white animate-pulse shadow-sm" title="Due Soon!" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{bill.vendor}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-black">ID: {bill.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-6 text-xs font-medium text-slate-500">{bill.date}</td>
                          <td className="px-4 py-6 text-xs font-medium">
                            <span className={isDueSoon(bill.dueDate) && bill.status !== 'PAID' ? 'text-amber-600 font-bold' : 'text-slate-500'}>
                              {bill.dueDate}
                            </span>
                          </td>
                          <td className="px-4 py-6 font-black text-uwe-blue text-sm">
                            {bill.currency} {bill.total.toLocaleString()}
                          </td>
                          <td className="px-4 py-6">
                            <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${
                              bill.status === 'PAID' ? 'bg-green-100 text-green-700' :
                              bill.status === 'OVERDUE' ? 'bg-red-100 text-red-700 font-bold border border-red-200' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {bill.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="p-8 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-uwe-blue hover:border-uwe-blue transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-uwe-blue hover:border-uwe-blue transition disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all ${currentPage === i + 1 ? 'w-8 bg-uwe-blue' : 'w-3 bg-slate-200'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </FadeInSection>

          {/* Client Analytics / Customer Profiles */}
          <FadeInSection>
             <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6">Verified Client Profiles</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {customers.map(customer => (
                 <div key={customer.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition">
                   <div className="flex justify-between items-start mb-4">
                     <div>
                       <h5 className="font-black text-uwe-blue text-sm">{customer.name}</h5>
                       <p className="text-[10px] text-slate-400 font-medium">{customer.email}</p>
                     </div>
                     <span className="text-[9px] bg-uwe-blue/5 text-uwe-blue px-2 py-1 rounded-full font-black uppercase">
                       {customer.billIds.length} Bills
                     </span>
                   </div>
                   <div className="flex items-end justify-between">
                     <div>
                       <span className="text-[9px] font-black uppercase text-slate-300 block mb-1">Lifetime Value</span>
                       <span className="text-xl font-black text-uwe-red">£{customer.totalSpent.toLocaleString()}</span>
                     </div>
                     <button className="p-2 text-slate-300 hover:text-uwe-blue transition"><ArrowRight size={20}/></button>
                   </div>
                 </div>
               ))}
             </div>
          </FadeInSection>
        </div>
      </main>

      <footer className="py-20 bg-white border-t border-slate-100 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">
          Ashraf Morningstar Billing Module v2.1 | UWE Professional Series
        </p>
      </footer>
    </div>
  );
};

export default App;
