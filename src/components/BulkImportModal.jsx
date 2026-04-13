// src/components/BulkImportModal.jsx
import { useState } from 'react'
import { bulkAddMenuItems } from '../services/menuService'
import { MiniSpinner } from './Spinner'
import { fmt } from '../utils/helpers'

const MAX_ITEMS = 20
const TEMPLATE_HEADERS = ['name', 'price', 'category', 'description', 'food_type', 'available', 'image_url']

export default function BulkImportModal({ restaurantId, categories, onClose, onComplete }) {
  const [stage, setStage] = useState('upload') // 'upload' | 'preview' | 'importing' | 'done'
  const [rows, setRows] = useState([])
  const [errors, setErrors] = useState([])
  const [importStats, setImportStats] = useState({ success: 0, failed: 0 })

  const handleDownloadTemplate = () => {
    const csvContent = TEMPLATE_HEADERS.join(',') + '\n' +
      'Margherita Pizza,12.99,Pizza,Classic cheese and tomato,veg,true\n' +
      'Coke,2.50,Drinks,Cold beverage,veg,true'
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'menu_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target.result
      parseAndValidate(text)
    }
    reader.readAsText(file)
  }

  const parseAndValidate = (text) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim())
    if (lines.length < 2) {
      alert('CSV file is empty or missing data rows.')
      return
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim())
    const dataLines = lines.slice(1)

    if (dataLines.length > MAX_ITEMS) {
      alert(`Max items exceeded. Please limit your CSV to ${MAX_ITEMS} rows.`)
      return
    }

    const hIdx = {
      name: headers.indexOf('name'),
      price: headers.indexOf('price'),
      category: headers.indexOf('category'),
      desc: headers.indexOf('description'),
      foodType: headers.indexOf('food_type'),
      available: headers.indexOf('available'),
      imageUrl: headers.indexOf('image_url'),
    }

    if (hIdx.name === -1 || hIdx.price === -1) {
      alert('Mandatory headers "name" or "price" are missing.')
      return
    }

    const parsedRows = []
    const parseErrors = []

    dataLines.forEach((line, i) => {
      const parts = line.split(',').map(p => p.trim())
      const rowNum = i + 2

      const name = parts[hIdx.name]
      const priceRaw = parts[hIdx.price]
      const price = parseFloat(priceRaw)
      
      if (!name) {
        parseErrors.push(`Row ${rowNum}: Name is missing.`)
        return
      }
      if (isNaN(price) || price < 0) {
        parseErrors.push(`Row ${rowNum}: Invalid price "${priceRaw}".`)
        return
      }

      let category = parts[hIdx.category] || 'Other'
      if (categories && !categories.includes(category)) {
        category = 'Other'
      }

      let foodType = (parts[hIdx.foodType] || '').toLowerCase()
      if (foodType !== 'veg' && foodType !== 'non-veg') foodType = ''

      const available = parts[hIdx.available]?.toLowerCase() !== 'false'

      parsedRows.push({
        name,
        price,
        category,
        description: parts[hIdx.desc] || '',
        foodType,
        available,
        imageUrl: parts[hIdx.imageUrl] || '',
      })
    })

    setRows(parsedRows)
    setErrors(parseErrors)
    setStage('preview')
  }

  const handleImport = async () => {
    setStage('importing')
    try {
      await bulkAddMenuItems(rows, restaurantId)
      setImportStats({ success: rows.length, failed: 0 })
      setStage('done')
    } catch (err) {
      console.error('Bulk import error:', err)
      alert('Failed to import items: ' + err.message)
      setStage('preview')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-surface w-full max-w-2xl rounded-2xl border border-border 
                      shadow-lifted overflow-hidden flex flex-col max-h-[90vh] 
                      animate-slide-up relative z-10">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-bright text-xl">Bulk Menu Import</h2>
          <button onClick={onClose} className="text-mid hover:text-bright text-2xl">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {stage === 'upload' && (
            <div className="space-y-6 text-center py-8">
              <div className="space-y-2">
                <p className="text-mid text-sm">Download our CSV template to ensure correct formatting.</p>
                <button 
                  onClick={handleDownloadTemplate}
                  className="text-amber text-sm font-semibold hover:underline"
                >
                  ⬇ Download Template (.csv)
                </button>
              </div>

              <label className="block border-2 border-dashed border-border rounded-2xl p-10 
                                cursor-pointer hover:border-amber/40 hover:bg-amber-soft 
                                transition-all group">
                <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
                <div className="space-y-3">
                  <div className="text-4xl group-hover:scale-110 transition-transform">📄</div>
                  <p className="text-bright font-semibold">Click to select CSV file</p>
                  <p className="text-faint text-xs">Maximum {MAX_ITEMS} items per upload</p>
                </div>
              </label>
            </div>
          )}

          {stage === 'preview' && (
            <div className="space-y-6">
              {errors.length > 0 && (
                <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 space-y-2">
                  <p className="text-danger text-xs font-bold uppercase tracking-wider">⚠ Parsing Issues</p>
                  <ul className="text-danger text-xs space-y-1 list-disc list-inside">
                    {errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                  <p className="text-faint text-[10px]">Incorrect rows will be skipped.</p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-mid text-xs font-semibold uppercase tracking-wider">Preview ({rows.length} items)</p>
                <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs font-body">
                    <thead className="bg-raised border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-bright">Item</th>
                        <th className="px-4 py-3 font-semibold text-bright">Price</th>
                        <th className="px-4 py-3 font-semibold text-bright">Category</th>
                        <th className="px-4 py-3 font-semibold text-bright">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-amber-soft transition-colors text-[10px]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded bg-raised overflow-hidden flex-shrink-0 border border-border">
                                {row.imageUrl 
                                  ? <img src={row.imageUrl} className="w-full h-full object-cover" alt="" />
                                  : <div className="w-full h-full flex items-center justify-center text-xs">🍽️</div>
                                }
                              </div>
                              <span className="text-bright font-medium">{row.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-mid">{fmt(row.price)}</td>
                          <td className="px-4 py-3 text-mid">
                            <span className={row.category === 'Other' ? 'text-amber font-semibold' : ''}>
                              {row.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-mid uppercase">{row.foodType || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleImport}
                  className="btn-amber flex-1 py-3"
                >
                  Confirm & Import {rows.length} Items
                </button>
                <button 
                  onClick={() => setStage('upload')}
                  className="btn-ghost px-6"
                >
                  Choose Different File
                </button>
              </div>
            </div>
          )}

          {stage === 'importing' && (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <MiniSpinner />
              <p className="text-bright font-display animate-pulse">Processing Batch Insertion…</p>
            </div>
          )}

          {stage === 'done' && (
            <div className="text-center py-10 space-y-6">
              <div className="w-16 h-16 rounded-full bg-done/10 border-2 border-done/30 
                              flex items-center justify-center text-3xl mx-auto">
                🎉
              </div>
              <div>
                <h3 className="text-bright font-display text-2xl">Import Successful!</h3>
                <p className="text-mid text-sm mt-1">{importStats.success} items have been added to your menu.</p>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={onComplete}
                  className="btn-amber py-3 rounded-xl"
                >
                  View Menu
                </button>
                <button 
                  onClick={() => setStage('upload')}
                  className="btn-ghost text-xs"
                >
                  Import More
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
