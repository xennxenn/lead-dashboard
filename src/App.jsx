import React, { useState, useEffect, useMemo, useRef } from 'react';
import { UploadCloud, FileText, CheckSquare, Square, Table as TableIcon, PieChart, AlertCircle, FileSpreadsheet, Search, Filter, Settings, Download, Calculator, LayoutDashboard, List, ChevronDown, X, BarChart3, MousePointerClick, DollarSign } from 'lucide-react';

// --- Component: Dropdown Multi-Select ---
const MultiSelectDropdown = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (opt) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(item => item !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="relative inline-block text-left w-full" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-slate-300 text-slate-700 py-1.5 px-3 rounded-lg text-sm flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors hover:bg-slate-50 shadow-sm"
      >
        <span className="truncate pr-2 font-medium">
          {selected.length === 0 ? `กรอง ${label}` : `${label} (${selected.length})`}
        </span>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white rounded-lg shadow-xl border border-slate-200 max-h-64 overflow-auto">
          <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 flex justify-between z-10">
            <button onClick={() => onChange([])} className="text-xs text-blue-600 hover:text-blue-800 font-medium">ล้างทั้งหมด</button>
            <button onClick={() => onChange([...options])} className="text-xs text-slate-500 hover:text-slate-800 font-medium">เลือกทั้งหมด</button>
          </div>
          <ul className="py-1">
            {options.map((opt, idx) => (
              <li key={idx} className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-start transition-colors" onClick={() => toggleOption(opt)}>
                <input type="checkbox" checked={selected.includes(opt)} readOnly className="mt-0.5 mr-2 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-slate-700 break-words leading-tight">{opt === '' ? '(ไม่มีข้อมูล)' : opt}</span>
              </li>
            ))}
            {options.length === 0 && <li className="px-3 py-2 text-sm text-slate-400 text-center">ไม่มีตัวเลือก</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [mainFile, setMainFile] = useState(null);
  const [statusFile, setStatusFile] = useState(null);
  const [salesFile, setSalesFile] = useState(null); // เพิ่มไฟล์ที่ 3
  
  const [mainData, setMainData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [salesData, setSalesData] = useState([]); // ข้อมูลไฟล์ที่ 3
  const [mergedData, setMergedData] = useState([]);
  
  const [dashSearchTerm, setDashSearchTerm] = useState('');
  const [dashFilters, setDashFilters] = useState({});
  const [summaryBy, setSummaryBy] = useState('stage_name');
  const [dashSortOrder, setDashSortOrder] = useState('count-desc');
  
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [tableFilters, setTableFilters] = useState({});
  const [aggColumn, setAggColumn] = useState(''); 
  const [showColumnSelector, setShowColumnSelector] = useState(false); 
  
  const [encoding, setEncoding] = useState('windows-874');

  const [drillDown, setDrillDown] = useState({ isOpen: false, title: '', data: [] });

  const availableColumns = [
    { id: 'Lead_no', label: 'Lead No.' },
    { id: 'stage_name', label: 'Stage Name' },
    { id: 'contact_name', label: 'Contact Name' },
    { id: 'cs_phone', label: 'CS Phone' },
    { id: 'total_amount', label: 'Total Amount' }, // คอลัมน์ใหม่จากยอด Sales
    { id: 'payment_duration_days', label: 'Payment Duration (Days)' }, // คอลัมน์ใหม่สำหรับระยะเวลาชำระเงิน
    { id: 'source_name', label: 'Source Name' },
    { id: 'site_name', label: 'Site Name' },
    { id: 'owner_name', label: 'Owner Name' },
    { id: 'branch_no', label: 'Branch No' },
    { id: 'province', label: 'Province' },
    { id: 'no_of_installation', label: 'No of Installation' },
    { id: 'time_frame_month', label: 'Time Frame (Month)' },
    { id: 'create_date', label: 'Create Date' },
    { id: 'create_month', label: 'Create Month' },
    { id: 'create_year', label: 'Create Year' },
    { id: 'discriptions', label: 'discriptions (Raw)' },
    { id: 'desc_ads', label: '[แยก] 1. Ads' },
    { id: 'desc_opportunity', label: '[แยก] 2. Opportunity' },
    { id: 'desc_cause', label: '[แยก] 3. Cause' },
    { id: 'desc_quotation', label: '[แยก] 4. Quotation Amount' },
    { id: 'desc_remark', label: '[แยก] 5. Remark' },
  ];

  const [selectedColumns, setSelectedColumns] = useState(
    availableColumns.filter(c => !['discriptions', 'create_date'].includes(c.id)).map(c => c.id)
  );

  const findDescKey = (row) => {
    if (!row) return null;
    const keys = Object.keys(row);
    const cleanKeys = keys.map(k => ({ original: k, clean: k.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() }));
    let match = cleanKeys.find(k => k.clean === 'discriptions' || k.clean === 'discription' || k.clean === 'descriptions' || k.clean === 'description');
    if (match) return match.original;
    match = cleanKeys.find(k => k.clean.includes('desc') || k.clean.includes('disc'));
    return match ? match.original : null;
  };

  // ค้นหาคอลัมน์ total_amount แบบฉลาดขึ้น
  const findTotalAmountKey = (row) => {
    if (!row) return null;
    const keys = Object.keys(row);
    const cleanKeys = keys.map(k => ({ original: k, clean: k.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() }));
    let match = cleanKeys.find(k => k.clean === 'totalamount');
    return match ? match.original : null;
  };

  // ค้นหาคอลัมน์ r_status แบบฉลาดขึ้น
  const findRStatusKey = (row) => {
    if (!row) return null;
    const keys = Object.keys(row);
    const cleanKeys = keys.map(k => ({ original: k, clean: k.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() }));
    let match = cleanKeys.find(k => k.clean === 'rstatus');
    return match ? match.original : null;
  };

  // ค้นหาคอลัมน์ receipt_date แบบฉลาดขึ้น
  const findReceiptDateKey = (row) => {
    if (!row) return null;
    const keys = Object.keys(row);
    const cleanKeys = keys.map(k => ({ original: k, clean: k.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() }));
    let match = cleanKeys.find(k => k.clean === 'receiptdate');
    return match ? match.original : null;
  };

  // ฟังก์ชันแปลงวันที่ให้เป็น Object (รองรับ พ.ศ. และรูปแบบที่หลากหลาย)
  const normalizeDate = (dateStr) => {
    if (!dateStr) return null;
    const dStr = String(dateStr).split(' ')[0]; // ตัดเวลาทิ้ง
    const parts = dStr.includes('/') ? dStr.split('/') : dStr.split('-');
    if (parts.length === 3) {
      let year, month, day;
      if (parts[0].length === 4) { // YYYY-MM-DD
        year = parseInt(parts[0]); month = parseInt(parts[1]); day = parseInt(parts[2]);
      } else if (parts[2].length === 4) { // DD/MM/YYYY
        year = parseInt(parts[2]); month = parseInt(parts[1]); day = parseInt(parts[0]);
      } else {
        return new Date(dateStr);
      }
      // แปลง พ.ศ. เป็น ค.ศ.
      if (year > 2500) year -= 543;
      const dateObj = new Date(year, month - 1, day);
      return isNaN(dateObj.getTime()) ? null : dateObj;
    }
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? null : fallback;
  };

  const parseDescriptions = (desc) => {
    if (!desc || typeof desc !== 'string') return {
      desc_ads: '', desc_opportunity: '', desc_cause: '', desc_quotation: '', desc_remark: ''
    };
    const keywords = ["Ads", "Opportunity", "Cause", "Quotation Amount", "Remark"];
    const result = {};
    keywords.forEach((kw, i) => {
      const startRegex = new RegExp(kw + "\\s*[:\\-]?\\s*", 'i');
      const match = desc.match(startRegex);
      if (!match) {
        result[`desc_${kw.toLowerCase().split(' ')[0]}`] = '';
        return;
      }
      let content = desc.substring(match.index + match[0].length);
      let minIndex = content.length;
      for (let j = 0; j < keywords.length; j++) {
         if (i === j) continue;
         const nextRegex = new RegExp(keywords[j] + "\\s*[:\\-]?\\s*", 'i');
         const nextMatch = content.match(nextRegex);
         if (nextMatch && nextMatch.index < minIndex) {
             minIndex = nextMatch.index;
         }
      }
      result[`desc_${kw.toLowerCase().split(' ')[0]}`] = content.substring(0, minIndex).trim();
    });
    return {
      desc_ads: result.desc_ads || '',
      desc_opportunity: result.desc_opportunity || '',
      desc_cause: result.desc_cause || '',
      desc_quotation: result.desc_quotation || '',
      desc_remark: result.desc_remark || ''
    };
  };

  const parseCSVString = (str) => {
    if (!str) return [];
    const firstLine = str.split('\n')[0].replace(/^\uFEFF/, '');
    const delimiter = firstLine.includes('\t') ? '\t' : ',';
    const result = [];
    let row = []; let inQuotes = false; let val = '';
    for (let i = 0; i < str.length; i++) {
      let char = str[i]; let nextChar = str[i + 1];
      if (char === '"' && inQuotes && nextChar === '"') {
        val += '"'; i++;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        row.push(val); val = '';
      } else if (char === '\n' && !inQuotes) {
        row.push(val); result.push(row); row = []; val = '';
      } else if (char !== '\r') {
        val += char;
      }
    }
    if (val || row.length > 0) { row.push(val); result.push(row); }
    if (result.length < 2) return [];
    
    const headers = result[0].map(h => {
      let cleanH = h.trim().replace(/^["']|["']$/g, '');
      if (cleanH.toLowerCase() === 'lead_no') return 'Lead_no';
      return cleanH;
    });

    const data = [];
    for (let i = 1; i < result.length; i++) {
      if (result[i].length === 1 && result[i][0] === "") continue;
      let obj = {};
      headers.forEach((header, index) => {
        let cellVal = result[i][index] !== undefined ? result[i][index].trim() : '';
        obj[header] = cellVal.replace(/^["']|["']$/g, '');
      });
      data.push(obj);
    }
    return data;
  };

  // Readers
  useEffect(() => {
    if (mainFile) {
      const reader = new FileReader();
      reader.onload = (e) => setMainData(parseCSVString(e.target.result));
      reader.readAsText(mainFile, encoding);
    } else setMainData([]);
  }, [mainFile, encoding]);

  useEffect(() => {
    if (statusFile) {
      const reader = new FileReader();
      reader.onload = (e) => setStatusData(parseCSVString(e.target.result));
      reader.readAsText(statusFile, encoding);
    } else setStatusData([]);
  }, [statusFile, encoding]);

  useEffect(() => {
    if (salesFile) {
      const reader = new FileReader();
      reader.onload = (e) => setSalesData(parseCSVString(e.target.result));
      reader.readAsText(salesFile, encoding);
    } else setSalesData([]);
  }, [salesFile, encoding]);

  // INNER JOIN + (Optional) LEFT JOIN with Sales Data
  useEffect(() => {
    // ต้องมีข้อมูล 2 ไฟล์หลัก ถึงจะเริ่มการทำงาน
    if (mainData.length > 0 && statusData.length > 0) {
      const merged = [];
      mainData.forEach(mainRow => {
        const leadNo = (mainRow.Lead_no || '').toString().trim();
        const statusRow = statusData.find(s => (s.Lead_no || '').toString().trim() === leadNo);
        
        if (statusRow) {
          const combined = { ...mainRow, ...statusRow };
          
          // ดึงข้อมูลยอดเงินจาก Sales Report (ถ้ามี)
          if (salesData.length > 0) {
            const salesRow = salesData.find(s => (s.Lead_no || '').toString().trim() === leadNo);
            if (salesRow) {
              const statusKey = findRStatusKey(salesRow);
              const rStatus = statusKey ? String(salesRow[statusKey] || '').trim().toUpperCase() : '';
              
              // ถ้ายกเลิก (r_status เป็น C) จะไม่นำยอดมารวม
              if (rStatus !== 'C') {
                const amountKey = findTotalAmountKey(salesRow);
                if (amountKey) combined.total_amount = salesRow[amountKey];
                
                // ดึงวันที่ใบเสร็จ (Receipt Date)
                const receiptDateKey = findReceiptDateKey(salesRow);
                if (receiptDateKey) combined.receipt_date = salesRow[receiptDateKey];
              }
            }
          }

          const mDescKey = findDescKey(mainRow);
          const sDescKey = findDescKey(statusRow);
          const mDesc = mDescKey ? String(mainRow[mDescKey] || '') : '';
          const sDesc = sDescKey ? String(statusRow[sDescKey] || '') : '';
          const finalDesc = mDesc.length > sDesc.length ? mDesc : sDesc;
          
          combined.discriptions = finalDesc;
          const parsedDesc = parseDescriptions(finalDesc);

          let cMonth = ''; let cYear = '';
          const cDate = combined.create_date || '';
          if (cDate) {
             const dStr = String(cDate).split(' ')[0];
             const parts = dStr.includes('/') ? dStr.split('/') : dStr.split('-');
             if (parts.length === 3) {
                 if (parts[0].length === 4) { cYear = parts[0]; cMonth = parts[1]; } 
                 else if (parts[2].length === 4) { cYear = parts[2]; cMonth = parts[1]; }
             }
          }
          combined.create_month = cMonth;
          combined.create_year = cYear;

          // คำนวณระยะเวลาการชำระเงิน (วัน)
          if (combined.create_date && combined.receipt_date) {
            const createDateObj = normalizeDate(combined.create_date);
            const receiptDateObj = normalizeDate(combined.receipt_date);
            
            if (createDateObj && receiptDateObj) {
              const diffTime = receiptDateObj.getTime() - createDateObj.getTime();
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              // ถ้าระยะเวลาติดลบ (เช่น ลงวันที่ผิด) จะให้เป็น 0 หรือแสดงตามจริง
              combined.payment_duration_days = diffDays;
            }
          }

          merged.push({ ...combined, ...parsedDesc });
        }
      });
      setMergedData(merged);
    } else {
      setMergedData([]);
    }
  }, [mainData, statusData, salesData]);

  const filterDropdownOptions = useMemo(() => {
    const options = {};
    availableColumns.forEach(col => {
      const uniqueVals = [...new Set(mergedData.map(row => String(row[col.id] || '').trim()))];
      options[col.id] = uniqueVals.sort();
    });
    return options;
  }, [mergedData]);

  const applyFilters = (data, search, filters) => {
    return data.filter(row => {
      if (search && !Object.values(row).some(val => String(val || '').toLowerCase().includes(search.toLowerCase()))) return false;
      for (const [colId, selectedValues] of Object.entries(filters)) {
        if (selectedValues && selectedValues.length > 0) {
          const val = String(row[colId] || '').trim();
          if (!selectedValues.includes(val)) return false;
        }
      }
      return true;
    });
  };

  const filteredDashboardData = useMemo(() => applyFilters(mergedData, dashSearchTerm, dashFilters), [mergedData, dashSearchTerm, dashFilters]);
  const filteredTableData = useMemo(() => applyFilters(mergedData, tableSearchTerm, tableFilters), [mergedData, tableSearchTerm, tableFilters]);

  // Dashboard Calculations with Amount
  const dashboardStats = useMemo(() => {
    const stats = { total: filteredDashboardData.length, totalAmount: 0, totalSalesCount: 0, groups: {}, maxCount: 0, maxAmount: 0 };
    
    filteredDashboardData.forEach(row => {
      let key = String(row[summaryBy] || '(ไม่มีข้อมูล)').trim();
      if (key === '') key = '(ไม่มีข้อมูล)';
      
      // แปลงยอดเงินให้เป็นตัวเลขที่คำนวณได้ (ตัด comma หรือตัวอักษรออก)
      const amountStr = String(row.total_amount || '0').replace(/[^0-9.-]+/g, "");
      const amount = parseFloat(amountStr) || 0;
      
      stats.totalAmount += amount;

      // นับจำนวนรายการที่มีข้อมูล total_amount
      const hasSales = row.total_amount && String(row.total_amount).trim() !== '';
      if (hasSales) {
        stats.totalSalesCount += 1;
      }

      if (!stats.groups[key]) {
        stats.groups[key] = { count: 0, amount: 0, salesCount: 0 };
      }
      stats.groups[key].count += 1;
      stats.groups[key].amount += amount;
      if (hasSales) {
        stats.groups[key].salesCount += 1;
      }

      if (stats.groups[key].count > stats.maxCount) stats.maxCount = stats.groups[key].count;
      if (stats.groups[key].amount > stats.maxAmount) stats.maxAmount = stats.groups[key].amount;
    });

    let sorted = Object.entries(stats.groups);
    
    if (dashSortOrder === 'count-desc') {
      sorted.sort((a, b) => b[1].count - a[1].count);
    } else if (dashSortOrder === 'count-asc') {
      sorted.sort((a, b) => a[1].count - b[1].count);
    } else if (dashSortOrder === 'amount-desc') {
      sorted.sort((a, b) => b[1].amount - a[1].amount);
    } else if (dashSortOrder === 'amount-asc') {
      sorted.sort((a, b) => a[1].amount - b[1].amount);
    } else if (dashSortOrder === 'name-asc') {
      sorted.sort((a, b) => a[0].localeCompare(b[0], 'th'));
    } else if (dashSortOrder === 'name-desc') {
      sorted.sort((a, b) => b[0].localeCompare(a[0], 'th'));
    }

    stats.sortedGroups = sorted;
    return stats;
  }, [filteredDashboardData, summaryBy, dashSortOrder]);

  const calculateAggregations = () => {
    let count = filteredTableData.length;
    let sum = 0; let avg = 0; let validNumbers = 0;
    if (aggColumn) {
      filteredTableData.forEach(row => {
        const valStr = String(row[aggColumn] || '').replace(/,/g, '');
        const val = parseFloat(valStr);
        if (!isNaN(val)) { sum += val; validNumbers++; }
      });
      avg = validNumbers > 0 ? sum / validNumbers : 0;
    }
    return { count, sum, avg, validNumbers };
  };
  const aggResult = calculateAggregations();

  const handleExport = (format, dataToExport = filteredTableData) => {
    const cols = availableColumns.filter(c => selectedColumns.includes(c.id));
    let content = '';
    if (format === 'csv') {
      content += cols.map(c => `"${c.label}"`).join(',') + '\n';
      dataToExport.forEach(row => {
        content += cols.map(c => `"${String(row[c.id] || '').replace(/"/g, '""')}"`).join(',') + '\n';
      });
    } else {
      content += cols.map(c => c.label).join('\t') + '\n';
      dataToExport.forEach(row => {
        content += cols.map(c => String(row[c.id] || '').replace(/\t/g, ' ')).join('\t') + '\n';
      });
    }
    const blob = new Blob(['\uFEFF' + content], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lead_data_export.${format}`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const FilterSection = ({ searchTerm, setSearchTerm, filters, setFilters }) => {
    const filterableCols = ['stage_name', 'branch_no', 'province', 'create_month', 'create_year', 'owner_name', 'source_name', 'site_name', 'desc_ads', 'desc_opportunity', 'desc_cause', 'desc_quotation', 'desc_remark'];
    return (
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6 relative z-10">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
          <h3 className="text-md font-semibold text-slate-800 flex items-center gap-2">
            <Filter size={18} className="text-slate-500" /> ตัวกรองข้อมูล
          </h3>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" placeholder="ค้นหาข้อความทั่วไป..." 
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filterableCols.map(colId => {
            const colDef = availableColumns.find(c => c.id === colId);
            return (
              <MultiSelectDropdown 
                key={colId} label={colDef.label} 
                options={filterDropdownOptions[colId] || []}
                selected={filters[colId] || []}
                onChange={(newVals) => setFilters(prev => ({ ...prev, [colId]: newVals }))}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="bg-white rounded-2xl shadow-sm p-6 border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-3 rounded-xl text-white shadow-md">
              <FileSpreadsheet size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Lead Analytics Pro</h1>
              <p className="text-slate-500 text-sm">Dashboard สรุปผลและเจาะลึกรายละเอียด (รองรับยอด Sales)</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg">
            <Settings size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-600">การอ่านไฟล์:</span>
            <select 
              value={encoding} onChange={(e) => setEncoding(e.target.value)}
              className="bg-white border border-slate-300 text-slate-700 text-sm rounded focus:ring-blue-500 px-2 py-1 outline-none"
            >
              <option value="windows-874">Thai (Windows-874)</option>
              <option value="utf-8">UTF-8</option>
            </select>
          </div>
        </header>

        {mergedData.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><UploadCloud className="text-blue-500" /> 1. ไฟล์หลัก <span className="text-xs text-red-500 font-normal">*ต้องใส่</span></h2>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative cursor-pointer group">
                <input type="file" accept=".csv, .txt" onChange={(e) => setMainFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3 group-hover:text-blue-500 transition-colors" />
                <p className="text-sm font-medium text-slate-700">คลิกเลือกไฟล์ ข้อมูลหลัก</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><UploadCloud className="text-indigo-500" /> 2. ไฟล์สถานะ <span className="text-xs text-red-500 font-normal">*ต้องใส่</span></h2>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative cursor-pointer group">
                <input type="file" accept=".csv, .txt" onChange={(e) => setStatusFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3 group-hover:text-indigo-500 transition-colors" />
                <p className="text-sm font-medium text-slate-700">คลิกเลือกไฟล์ สถานะ</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 bg-emerald-50/30">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><UploadCloud className="text-emerald-500" /> 3. Daily Sales <span className="text-xs text-slate-500 font-normal">(ออปชันเสริม)</span></h2>
              <div className="border-2 border-dashed border-emerald-200 rounded-xl p-8 text-center hover:bg-emerald-50 transition-colors relative cursor-pointer group">
                <input type="file" accept=".csv, .txt" onChange={(e) => setSalesFile(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                <DollarSign className="mx-auto h-12 w-12 text-emerald-300 mb-3 group-hover:text-emerald-500 transition-colors" />
                <p className="text-sm font-medium text-slate-700">คลิกเลือกไฟล์ยอดเงิน</p>
              </div>
            </div>
          </div>
        )}

        {mergedData.length > 0 && (
          <>
            {/* Tabs Navigation */}
            <div className="flex space-x-2 border-b border-slate-200 mb-6">
              <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-t-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-b-0 border-slate-200'}`}>
                <LayoutDashboard size={18} /> สรุปผล Dashboard
              </button>
              <button onClick={() => setActiveTab('table')} className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm rounded-t-lg transition-colors ${activeTab === 'table' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-b-0 border-slate-200'}`}>
                <List size={18} /> ตารางข้อมูลรายละเอียด
              </button>
            </div>

            {/* -------------------- TAB 1: DASHBOARD -------------------- */}
            {activeTab === 'dashboard' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                <FilterSection searchTerm={dashSearchTerm} setSearchTerm={setDashSearchTerm} filters={dashFilters} setFilters={setDashFilters} />
                
                {/* Metric Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-md text-white flex flex-col justify-center relative overflow-hidden">
                    <PieChart className="absolute right-[-20px] bottom-[-20px] opacity-20 w-32 h-32" />
                    <p className="text-blue-100 font-medium mb-1">Total Leads (ทั้งหมด)</p>
                    <h2 className="text-4xl lg:text-5xl font-bold">{dashboardStats.total.toLocaleString()} <span className="text-base lg:text-lg font-normal">รายการ</span></h2>
                  </div>

                  <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-6 rounded-2xl shadow-md text-white flex flex-col justify-center relative overflow-hidden">
                    <CheckSquare className="absolute right-[-20px] bottom-[-20px] opacity-20 w-32 h-32" />
                    <p className="text-indigo-100 font-medium mb-1">จำนวนที่มียอด Sales</p>
                    <h2 className="text-4xl lg:text-5xl font-bold">{dashboardStats.totalSalesCount.toLocaleString()} <span className="text-base lg:text-lg font-normal">รายการ</span></h2>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl shadow-md text-white flex flex-col justify-center relative overflow-hidden">
                    <DollarSign className="absolute right-[-20px] bottom-[-20px] opacity-20 w-32 h-32" />
                    <p className="text-emerald-100 font-medium mb-1">ยอดรวม Total Amount</p>
                    <h2 className="text-3xl lg:text-4xl font-bold truncate">
                      ฿ {dashboardStats.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </h2>
                  </div>
                  
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center">
                    <p className="text-slate-500 font-medium mb-1 text-sm">การแยก discriptions (Ads)</p>
                    <h3 className="text-2xl font-bold text-slate-800">
                      {filteredDashboardData.filter(d => d.desc_ads && d.desc_ads !== '').length.toLocaleString()}
                    </h3>
                    <p className="text-blue-600 font-medium text-sm mt-1">รายการที่พบข้อมูล Ads</p>
                  </div>
                </div>
                
                {/* Main Interactive Chart Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                  <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                      <div className="bg-blue-100 p-2 rounded-lg hidden sm:block"><BarChart3 size={20} className="text-blue-600" /></div>
                      <span className="font-semibold text-slate-800 text-sm sm:text-base">วิเคราะห์ตาม:</span>
                      <select 
                        value={summaryBy} onChange={(e) => setSummaryBy(e.target.value)} 
                        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        {['stage_name', 'branch_no', 'owner_name', 'province', 'source_name', 'site_name', 'create_month', 'create_year', 'desc_ads', 'desc_opportunity', 'desc_cause', 'desc_quotation', 'desc_remark'].map(col => (
                          <option key={col} value={col}>{availableColumns.find(c => c.id === col)?.label || col}</option>
                        ))}
                      </select>
                      
                      <span className="font-semibold text-slate-800 text-sm sm:text-base ml-0 sm:ml-2">เรียงตาม:</span>
                      <select 
                        value={dashSortOrder} onChange={(e) => setDashSortOrder(e.target.value)} 
                        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      >
                        <option value="count-desc">จำนวน (มากไปน้อย)</option>
                        <option value="count-asc">จำนวน (น้อยไปมาก)</option>
                        <option value="amount-desc">ยอดรวม (มากไปน้อย)</option>
                        <option value="amount-asc">ยอดรวม (น้อยไปมาก)</option>
                        <option value="name-asc">ชื่อ (A-Z)</option>
                        <option value="name-desc">ชื่อ (Z-A)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm w-full lg:w-auto">
                      <MousePointerClick size={16} className="text-blue-500" />
                      <span className="font-medium">Double-click</span> แถวเพื่อเจาะลึก
                    </div>
                  </div>
                  
                  <div className="p-6 max-h-[500px] overflow-y-auto">
                    {dashboardStats.sortedGroups.length > 0 ? (
                      <div className="space-y-4">
                        {dashboardStats.sortedGroups.map(([groupName, data]) => {
                          const isSortingByAmount = dashSortOrder.includes('amount');
                          const percentage = isSortingByAmount 
                            ? (dashboardStats.maxAmount > 0 ? (data.amount / dashboardStats.maxAmount) * 100 : 0)
                            : (dashboardStats.maxCount > 0 ? (data.count / dashboardStats.maxCount) * 100 : 0);
                            
                          return (
                            <div 
                              key={groupName} 
                              className="group relative cursor-pointer select-none"
                              onDoubleClick={() => {
                                const matchedData = filteredDashboardData.filter(r => {
                                  let val = String(r[summaryBy] || '').trim();
                                  if (val === '') val = '(ไม่มีข้อมูล)';
                                  return val === groupName;
                                });
                                setDrillDown({ isOpen: true, title: `${availableColumns.find(c => c.id === summaryBy)?.label || summaryBy}: ${groupName}`, data: matchedData });
                              }}
                            >
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-slate-700 group-hover:text-blue-600 transition-colors">{groupName}</span>
                                <span className="font-bold text-slate-600 flex flex-wrap justify-end items-center gap-2">
                                  <span>{data.count.toLocaleString()} รายการ</span>
                                  {data.salesCount > 0 && (
                                    <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 text-xs font-semibold">
                                      มียอด Sales {data.salesCount.toLocaleString()} รายการ
                                    </span>
                                  )}
                                  {data.amount > 0 && (
                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                      ฿{data.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                    </span>
                                  )}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner flex relative">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${isSortingByAmount ? 'bg-emerald-500 group-hover:bg-emerald-600' : 'bg-blue-500 group-hover:bg-blue-600'}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <AlertCircle size={48} className="mx-auto mb-3 opacity-20" />
                        <p>ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- TAB 2: DATA TABLE -------------------- */}
            {activeTab === 'table' && (
              <div className="animate-in fade-in duration-300">
                <FilterSection searchTerm={tableSearchTerm} setSearchTerm={setTableSearchTerm} filters={tableFilters} setFilters={setTableFilters} />

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 relative z-0">
                  <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 flex-wrap w-full lg:w-auto">
                    <div className="flex items-center gap-2">
                      <Calculator size={18} className="text-slate-500" />
                      <span className="text-sm font-medium text-slate-700">วิเคราะห์ค่า:</span>
                      <select 
                        value={aggColumn} onChange={(e) => setAggColumn(e.target.value)}
                        className="text-sm border border-slate-300 rounded-md px-2 py-1 bg-white focus:ring-blue-500"
                      >
                        <option value="">-- เลือกคอลัมน์ --</option>
                        {availableColumns.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                      </select>
                    </div>
                    {aggColumn && (
                      <div className="flex gap-4 border-l border-slate-300 pl-4">
                        <div className="text-sm text-slate-600">Count: <span className="font-bold text-slate-800">{aggResult.count.toLocaleString()}</span></div>
                        <div className="text-sm text-slate-600">Sum: <span className="font-bold text-emerald-600">{aggResult.sum.toLocaleString(undefined, {maximumFractionDigits:2})}</span></div>
                        <div className="text-sm text-slate-600">Avg: <span className="font-bold text-blue-600">{aggResult.avg.toLocaleString(undefined, {maximumFractionDigits:2})}</span></div>
                      </div>
                    )}
                    {!aggColumn && (
                       <div className="text-sm text-slate-500 border-l border-slate-300 pl-4 font-medium">
                          รวมข้อมูลที่พบ: <span className="font-bold text-slate-800">{aggResult.count.toLocaleString()}</span> รายการ
                       </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleExport('csv')} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-emerald-100 transition">
                      <Download size={16} /> Export CSV
                    </button>
                    <button onClick={() => handleExport('txt')} className="flex items-center gap-2 bg-slate-100 text-slate-700 border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition">
                      <Download size={16} /> Export TXT
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mb-4 overflow-hidden">
                  <button
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                    className="w-full px-5 py-3 flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors focus:outline-none"
                  >
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <TableIcon size={16} className="text-blue-600" /> ตั้งค่าการแสดงผลคอลัมน์ ({selectedColumns.length}/{availableColumns.length})
                    </h3>
                    <ChevronDown size={18} className={`text-slate-500 transition-transform duration-200 ${showColumnSelector ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showColumnSelector && (
                    <div className="p-5 border-t border-slate-200 bg-white">
                      <div className="flex flex-wrap gap-2">
                        {availableColumns.map(col => (
                          <button
                            key={col.id}
                            onClick={() => setSelectedColumns(prev => prev.includes(col.id) ? prev.filter(id => id !== col.id) : [...prev, col.id])}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-all border ${
                              selectedColumns.includes(col.id) ? 'bg-slate-800 border-slate-800 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {selectedColumns.includes(col.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                            {col.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col z-0 relative">
                  <div className="overflow-auto max-h-[600px] w-full rounded-2xl">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="text-xs text-slate-600 bg-slate-100 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 font-semibold w-12 text-center border-b border-slate-200">#</th>
                          {availableColumns.filter(col => selectedColumns.includes(col.id)).map(col => (
                            <th key={col.id} className="px-4 py-3 font-semibold tracking-wider border-b border-slate-200">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTableData.slice(0, 150).map((row, index) => (
                          <tr key={index} className="hover:bg-blue-50/50 transition-colors bg-white">
                            <td className="px-4 py-3 text-center text-slate-400">{index + 1}</td>
                            {availableColumns.filter(col => selectedColumns.includes(col.id)).map(col => {
                              const isAmount = col.id === 'total_amount';
                              const val = row[col.id];
                              let displayVal = val;
                              if (isAmount && val) {
                                const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
                                displayVal = !isNaN(num) ? num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : val;
                              }
                              return (
                                <td key={col.id} className={`px-4 py-3 text-slate-700 max-w-[250px] truncate ${isAmount ? 'text-right font-medium' : ''}`} title={val || '-'}>
                                  {val ? displayVal : <span className="text-slate-300">-</span>}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredTableData.length === 0 && (
                       <div className="text-center py-10 text-slate-500 bg-white">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</div>
                    )}
                  </div>
                  {filteredTableData.length > 150 && (
                    <div className="p-3 text-center text-xs font-medium text-slate-500 border-t border-slate-200 bg-slate-50">
                      กำลังแสดง 150 รายการแรกจาก {filteredTableData.length.toLocaleString()} รายการ
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* -------------------- DRILL-DOWN MODAL -------------------- */}
            {drillDown.isOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
                  
                  {/* Modal Header */}
                  <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <List size={20} className="text-blue-600" />
                        รายละเอียด: <span className="text-blue-700">{drillDown.title}</span>
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">พบข้อมูลทั้งหมด {drillDown.data.length.toLocaleString()} รายการ</p>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleExport('csv', drillDown.data)}
                        className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1 border border-blue-200"
                      >
                        <Download size={14} /> Export ชุดนี้
                      </button>
                      <button 
                        onClick={() => setDrillDown({ isOpen: false, title: '', data: [] })}
                        className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Modal Body (Table) */}
                  <div className="flex-1 overflow-auto bg-white p-0">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="text-xs text-slate-600 bg-slate-100 sticky top-0 z-10 shadow-sm">
                        <tr>
                          <th className="px-4 py-3 font-semibold w-12 text-center border-b border-slate-200">#</th>
                          {availableColumns.filter(col => selectedColumns.includes(col.id)).map(col => (
                            <th key={col.id} className="px-4 py-3 font-semibold tracking-wider border-b border-slate-200">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {drillDown.data.map((row, index) => (
                          <tr key={index} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-4 py-3 text-center text-slate-400">{index + 1}</td>
                            {availableColumns.filter(col => selectedColumns.includes(col.id)).map(col => {
                              const isAmount = col.id === 'total_amount';
                              const val = row[col.id];
                              let displayVal = val;
                              if (isAmount && val) {
                                const num = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
                                displayVal = !isNaN(num) ? num.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : val;
                              }
                              return (
                                <td key={col.id} className={`px-4 py-3 text-slate-700 max-w-[250px] truncate ${isAmount ? 'text-right font-medium' : ''}`} title={val || '-'}>
                                  {val ? displayVal : <span className="text-slate-300">-</span>}
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}