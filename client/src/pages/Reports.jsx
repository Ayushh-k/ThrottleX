import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  IndianRupee,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import { exportToCSV } from '../utils/csvExport';
import { exportReportToPDF } from '../utils/pdfExport';

export default function Reports({ refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    loadReports();
  }, [refreshKey]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await api.getReports();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const { overview = {}, monthlySummary = {}, bikeWiseReports = [], partnerReports = [], customerReports = [] } = data || {};

  const handleExportCSV = () => {
    if (activeTab === 'bikes') {
      exportToCSV(bikeWiseReports, 'THROTTLEX-Bike-Performance.csv');
    } else if (activeTab === 'customers') {
      exportToCSV(customerReports, 'THROTTLEX-Customer-Report.csv');
    } else {
      const summaryRows = [
        { Metric: 'Total Revenue', Value: overview.totalRevenue },
        { Metric: 'Total Expenses', Value: overview.totalExpenses },
        { Metric: 'Net Profit', Value: overview.netProfit },
        { Metric: 'Profit Margin %', Value: `${overview.profitMargin}%` },
        { Metric: 'Total Rentals', Value: overview.totalRentalCount },
        { Metric: 'Top Performing Bike', Value: monthlySummary.topPerformingBike },
        { Metric: 'Highest Expense Category', Value: monthlySummary.highestExpenseCategory }
      ];
      exportToCSV(summaryRows, 'THROTTLEX-Monthly-Summary.csv');
    }
  };

  const handleExportPDF = () => {
    if (activeTab === 'bikes') {
      exportReportToPDF({
        title: 'THROTTLEX — Bike Fleet Performance Report',
        subtitle: 'Breakdown of revenue, expenses, net profit, and days rented per motorcycle',
        headers: ['Motorcycle', 'Registration', 'Revenue', 'Expenses', 'Net Profit', 'Trips', 'Days Rented'],
        rows: bikeWiseReports.map((b) => [
          b.name,
          b.registrationNumber,
          formatINR(b.revenue),
          formatINR(b.expenses),
          formatINR(b.profit),
          `${b.totalRentals} trips`,
          `${b.totalRentalDays} days`
        ]),
        filename: 'THROTTLEX-Bike-Performance.pdf'
      });
    } else {
      exportReportToPDF({
        title: 'THROTTLEX — Business Executive Financial Report',
        subtitle: `Monthly Operations Review | Generated: ${new Date().toLocaleDateString('en-IN')}`,
        headers: ['Financial Metric', 'Operational Value'],
        rows: [
          ['Total Rental Revenue', formatINR(overview.totalRevenue)],
          ['Total Operating Expenses', formatINR(overview.totalExpenses)],
          ['Net Realized Profit', formatINR(overview.netProfit)],
          ['Profit Margin', `${overview.profitMargin}%`],
          ['Total Rentals Logged', `${overview.totalRentalCount} Trips`],
          ['Top Performing Motorcycle', monthlySummary.topPerformingBike],
          ['Highest Expense Category', `${monthlySummary.highestExpenseCategory} (${formatINR(monthlySummary.highestExpenseAmount)})`],
          ['Recommended Settlement', monthlySummary.settlementRecommendation]
        ],
        filename: 'THROTTLEX-Business-Summary.pdf'
      });
    }
  };

  if (loading && !data) {
    return (
      <div className="py-20 text-center text-slate-400 text-xs">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Generating consolidated business intelligence reports...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Financial & Fleet Reports</h1>
          <p className="text-xs text-slate-400">
            Comprehensive P&L, bike-wise profitability, partner contributions, and printable statements
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-brand-border rounded-xl flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-brand-orange" /> Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 text-xs font-bold bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl shadow-glow-sm flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Download PDF Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'summary', label: 'Monthly Business Summary' },
          { id: 'bikes', label: 'Bike-Wise P&L' },
          { id: 'customers', label: 'Customer Lifetime Report' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-brand-orange text-white shadow-glow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Monthly Business Summary (Prompt Section 26) */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Executive Summary Card (Section 26 Layout) */}
          <div className="p-6 sm:p-8 rounded-2xl bg-brand-card border border-brand-border shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-brand-border">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-brand-orange">
                  MONTHLY BUSINESS SUMMARY
                </span>
                <h2 className="text-2xl font-bold font-display text-white mt-0.5">
                  Performance Statement: {monthlySummary.period}
                </h2>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-400">Net Business Profit</span>
                <p className="text-2xl font-bold font-display text-emerald-400">
                  {formatINR(monthlySummary.netProfit)}
                </p>
              </div>
            </div>

            {/* Grid of Key Operating Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
                <span className="text-slate-400 text-[10px] uppercase">Total Rentals</span>
                <p className="text-xl font-bold text-white mt-1">{monthlySummary.totalRentals} Trips</p>
              </div>

              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
                <span className="text-slate-400 text-[10px] uppercase">Total Rental Days</span>
                <p className="text-xl font-bold text-white mt-1">{monthlySummary.totalRentalDays} Days</p>
              </div>

              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
                <span className="text-slate-400 text-[10px] uppercase">Total Revenue</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">{formatINR(monthlySummary.totalRevenue)}</p>
              </div>

              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border">
                <span className="text-slate-400 text-[10px] uppercase">Total Expenses</span>
                <p className="text-xl font-bold text-rose-400 mt-1">{formatINR(monthlySummary.totalExpenses)}</p>
              </div>
            </div>

            {/* Highlights row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex items-center gap-3.5">
                <div className="p-3 rounded-lg bg-brand-orange/10 text-brand-orange">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Top Performing Motorcycle</span>
                  <p className="font-bold text-white text-base mt-0.5">{monthlySummary.topPerformingBike}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-brand-surface border border-brand-border flex items-center gap-3.5">
                <div className="p-3 rounded-lg bg-rose-500/10 text-rose-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Highest Expense Category</span>
                  <p className="font-bold text-white text-base mt-0.5 capitalize">
                    {monthlySummary.highestExpenseCategory} ({formatINR(monthlySummary.highestExpenseAmount)})
                  </p>
                </div>
              </div>
            </div>

            {/* Partner Settlement Box */}
            <div className="p-4 rounded-xl bg-brand-orange/10 border border-brand-orange/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-orange">
                  Partner Settlement Recommendation
                </span>
                <p className="text-base font-bold text-white mt-0.5">
                  {monthlySummary.settlementRecommendation}
                </p>
              </div>
              <span className="text-slate-300 font-medium">
                Verified zero-sum splitwise distribution
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bike-Wise Report */}
      {activeTab === 'bikes' && (
        <div className="p-5 rounded-2xl bg-brand-card border border-brand-border overflow-hidden space-y-4">
          <h3 className="font-bold font-display text-white text-base">Motorcycle Profitability Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">Motorcycle</th>
                  <th className="py-3 px-3">Registration</th>
                  <th className="py-3 px-3">Total Trips</th>
                  <th className="py-3 px-3">Billed Days</th>
                  <th className="py-3 px-3">Fuel Spent</th>
                  <th className="py-3 px-3">Service Spent</th>
                  <th className="py-3 px-3">Total Revenue</th>
                  <th className="py-3 px-3">Total Expenses</th>
                  <th className="py-3 px-3 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {bikeWiseReports.map((b) => (
                  <tr key={b.id} className="hover:bg-brand-surface/70">
                    <td className="py-3.5 px-3 font-bold text-white">{b.name}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">{b.registrationNumber}</td>
                    <td className="py-3.5 px-3 text-white">{b.totalRentals}</td>
                    <td className="py-3.5 px-3 text-white">{b.totalRentalDays}</td>
                    <td className="py-3.5 px-3 text-amber-400">{formatINR(b.fuelSpent)}</td>
                    <td className="py-3.5 px-3 text-rose-400">{formatINR(b.maintenanceSpent)}</td>
                    <td className="py-3.5 px-3 font-bold text-emerald-400">{formatINR(b.revenue)}</td>
                    <td className="py-3.5 px-3 font-bold text-rose-400">{formatINR(b.expenses)}</td>
                    <td className="py-3.5 px-3 font-bold font-display text-brand-orange text-sm text-right">
                      {formatINR(b.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Customer Report */}
      {activeTab === 'customers' && (
        <div className="p-5 rounded-2xl bg-brand-card border border-brand-border overflow-hidden space-y-4">
          <h3 className="font-bold font-display text-white text-base">Top Customers by Lifetime Rental Value</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-brand-border text-slate-400 uppercase text-[10px]">
                  <th className="py-3 px-3">Customer Name</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Completed Trips</th>
                  <th className="py-3 px-3">Lifetime Revenue Spent</th>
                  <th className="py-3 px-3 text-right">Pending Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {customerReports.map((c) => (
                  <tr key={c.id} className="hover:bg-brand-surface/70">
                    <td className="py-3.5 px-3 font-bold text-white">{c.name}</td>
                    <td className="py-3.5 px-3 font-mono text-slate-300">{c.phone}</td>
                    <td className="py-3.5 px-3 text-white">{c.rentalsCount} trips</td>
                    <td className="py-3.5 px-3 font-bold font-display text-emerald-400 text-sm">
                      {formatINR(c.totalSpent)}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-amber-400 text-right">
                      {formatINR(c.outstanding)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
