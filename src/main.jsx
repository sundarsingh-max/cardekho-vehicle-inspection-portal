import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Bell,
  Database,
  Eye,
  X,
  Pencil,
  History,
  RefreshCw,
  UserPlus,
  MessageSquare,
  Save,
  Upload,
  CheckCircle2,
  LayoutDashboard,
  Plus,
  ClipboardList,
  UserCheck,
  Repeat2,
  ShieldCheck,
  BadgeIndianRupee,
  FileCheck2,
  ChartNoAxesCombined,
  Search,
  Users,
  Building2,
  CarFront,
  MapPinned,
  KeyRound,
  CircleHelp,
  FileDown,
  Download,
  ExternalLink,
  Copy,
  Ban,
} from 'lucide-react'
import { supabase } from './supabaseClient'
import './styles.css'

const items = [
  ['Dashboard', LayoutDashboard],
  ['Add Lead', Plus],
  ['Open Lead', ClipboardList],
  ['Assign', UserCheck],
  ['Reassign', Repeat2],
  ['TPA QC', ShieldCheck],
  ['QC', ShieldCheck],
  ['QC Hold', ClipboardList],
  ['Pricing', BadgeIndianRupee],
  ['Report Generated', FileCheck2],
  ['MIS', ChartNoAxesCombined],
  ['Case Search', Search],
  ['Users', Users],
  ['TPA Master', Building2],
  ['Client Master', Building2],
  ['MMV Master', CarFront],
  ['Location/Zone Master', MapPinned],
  ['Permissions', KeyRound],
  ['Audit Trail', History],
  ['Help Desk', CircleHelp]
]


function OperationalModule({ active, cases = [], locations = [], tpas = [], clients = [], onRefresh }) {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 25

  useEffect(() => {
    let cancelled = false
    async function load() {
      setBusy(true); setError('')
      try {
        const tableByModule = {
          'Audit Trail': 'audit_trail',
          'Client Master': 'clients',
          'MMV Master': 'mmv_master',
          'Location/Zone Master': 'location_master',
          'Permissions': 'user_profiles'
        }
        const table = tableByModule[active]
        if (table) {
          const { data, error: fetchError } = await supabase.from(table).select('*').limit(10000)
          if (fetchError) throw fetchError
          const sorted = (data || []).sort((a,b) => {
            const av = a.id ?? a.created_at ?? a.email ?? ''
            const bv = b.id ?? b.created_at ?? b.email ?? ''
            return String(bv).localeCompare(String(av), undefined, {numeric:true})
          })
          if (!cancelled) setRows(sorted)
        } else if (active === 'Users') {
          const { data, error: fetchError } = await supabase.from('user_profiles').select('*').order('created_at', {ascending:false}).limit(1000)
          if (fetchError) throw fetchError
          if (!cancelled) setRows(data || [])
        } else if (active === 'Case Search' || active === 'MIS') {
          if (!cancelled) setRows(cases)
        } else if (active === 'Help Desk') {
          if (!cancelled) setRows([])
        }
      } catch (e) {
        if (!cancelled) {
          setRows([])
          setError(e?.message || 'Unable to load this module.')
        }
      } finally { if (!cancelled) setBusy(false) }
    }
    load()
    return () => { cancelled = true }
  }, [active, cases, onRefresh])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(row => Object.values(row || {}).some(value => String(value ?? '').toLowerCase().includes(q)))
  }, [rows, query])
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize)
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const countStatus = status => cases.filter(c => String(c.status || '').toUpperCase().replace(/[ -]/g, '_') === status).length
  const headers = active === 'Audit Trail' ? ['id','case_id','user_name','role','action','stage','old_status','new_status','remarks','created_at']
    : active === 'Location/Zone Master' ? Object.keys(rows[0] || {zone:'',state:'',city:'',is_active:'',created_at:''})
    : active === 'Client Master' ? Object.keys(rows[0] || {id:'',name:'',client_code:'',is_active:'',created_at:''})
    : active === 'MMV Master' ? Object.keys(rows[0] || {id:'',segment:'',make:'',model:'',variant:'',year:'',is_active:''})
    : active === 'Users' || active === 'Permissions' ? Object.keys(rows[0] || {full_name:'',email:'',role:'',is_active:'',must_change_password:''})
    : ['case_id','customer_name','mobile_phone','registration_number','make','model','variant','status','assigned_tpa_name','created_at']

  const title = active === 'Permissions' ? 'Role & User Permissions' : active
  const description = active === 'MIS' ? 'Live case summary from the cases table.'
    : active === 'Case Search' ? 'Search by Case ID, customer, mobile or registration number.'
    : active === 'Users' ? 'User profiles currently registered in Supabase. Auth account creation requires the deployed secure Admin function.'
    : active === 'Permissions' ? 'Role assignments and account flags from user_profiles. This view does not itself grant privileges.'
    : active === 'Client Master' ? 'Client master records loaded from Supabase.'
    : active === 'MMV Master' ? 'Make, model and variant master records loaded from Supabase.'
    : active === 'Location/Zone Master' ? 'Location and zone records from Supabase.'
    : active === 'Audit Trail' ? 'Recent recorded actions from audit_trail.'
    : 'Support guidance and issue reporting.'

  return <section className="panel operational-module">
    <div className="module-heading"><div><h2>{title}</h2><p>{description}</p></div><button type="button" className="secondary" onClick={() => { setPage(1); setQuery(''); onRefresh?.(); }}>↻ Refresh</button></div>
    {active === 'MIS' && <div className="mis-cards">{[['Total Cases',cases.length],['Open',countStatus('OPEN')],['Assigned',countStatus('ASSIGNED')],['QC',countStatus('QC')],['QC Hold',countStatus('QC_HOLD')],['Pricing',countStatus('PRICING')],['Completed',countStatus('COMPLETED')]].map(([label,value])=><div className="mis-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
    {active === 'Help Desk' && <div className="helpdesk-content"><h3>How can we help?</h3><p>For a case issue, use Case Search to find the case and Audit Trail/History to review its activity.</p><p>Ticket submission is not connected yet because a help-desk ticket table is not present in the current schema.</p><button type="button" onClick={() => { navigator.clipboard?.writeText('CarDekho Vehicle Inspection Portal support request'); }}>Copy support subject</button></div>}
    {(['Case Search','Audit Trail','Client Master','MMV Master','Location/Zone Master','Users','Permissions'].includes(active)) && <>
      <input className="module-search" value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder={active === 'Case Search' ? 'Search case ID, registration, customer, mobile…' : 'Filter records…'} />
      {busy ? <p>Loading records…</p> : error ? <p className="module-error">{error}</p> : <div className="table-wrap"><table className="data-table"><thead><tr>{headers.map(h=><th key={h}>{h.replace(/_/g,' ').toUpperCase()}</th>)}</tr></thead><tbody>{pageRows.map((row,i)=><tr key={row.id || row.user_id || row.case_id || i}>{headers.map(h=><td key={h}>{row[h] == null || row[h] === '' ? '—' : typeof row[h] === 'boolean' ? (row[h] ? 'Active' : 'Inactive') : String(row[h])}</td>)}</tr>)}{!pageRows.length && <tr><td colSpan={headers.length}>{busy ? 'Loading…' : 'No records found in this table, or access is not granted by Supabase policies.'}</td></tr>}</tbody></table></div>}
      <div className="case-pagination"><span>Showing {filtered.length ? (page-1)*pageSize+1 : 0}–{Math.min(page*pageSize,filtered.length)} of {filtered.length}</span><div className="page-controls"><button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Previous</button><span>Page {page} of {pages}</span><button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>Next</button></div></div>
    </>}
    {['Client Master','MMV Master','Location/Zone Master','Users','Permissions'].includes(active) && <p className="module-note">Records are read from Supabase. Add/edit/remove controls are not enabled until authenticated Admin identity and server-side authorization are wired; this avoids exposing master deletion or role changes to ordinary users.</p>}
  </section>
}
function App() {
  const [active, setActive] = useState('Dashboard')
  const [add, setAdd] = useState(false)
  const [hist, setHist] = useState(false)
  const [selectedCase, setSelectedCase] = useState(null)
  const [editCase, setEditCase] = useState(null)
  const [assignCase, setAssignCase] = useState(null)
  const [remarkCase, setRemarkCase] = useState(null)
  const [rejectCase, setRejectCase] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectRemarks, setRejectRemarks] = useState('')
  const [remarkText, setRemarkText] = useState('')
  const [reassignCase, setReassignCase] = useState(null)
  const [reassignTpaId, setReassignTpaId] = useState('')
  const [reassignReason, setReassignReason] = useState('')
  const [reassignRemarks, setReassignRemarks] = useState('')
  const [historyEvents, setHistoryEvents] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionSaving, setActionSaving] = useState(false)
  const [tpaQcCase, setTpaQcCase] = useState(null)
  const [tpaQcSaving, setTpaQcSaving] = useState(false)
  const [tpaQcMessage, setTpaQcMessage] = useState('')
  const [tpaQcForm, setTpaQcForm] = useState({})
  const [reportHydrated, setReportHydrated] = useState(false)
  const [reportAutosaving, setReportAutosaving] = useState(false)
  // Serialize every report write so a slower older request cannot finish after a newer save.
  const reportSaveQueueRef = useRef(Promise.resolve())
  const reportLoadRequestRef = useRef(0)

  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState('')

  const [search, setSearch] = useState('')
  const [pageByView, setPageByView] = useState({})
  const pageSize = 25
  const currentPage = pageByView[active] || 1

  const [clients, setClients] = useState([])
  const [mmv, setMmv] = useState([])
  const [locations, setLocations] = useState([])
  const [tpas, setTpas] = useState([])
  const [tpaModal, setTpaModal] = useState(false)
  const [tpaSaving, setTpaSaving] = useState(false)
  const [tpaError, setTpaError] = useState('')
  const [tpaForm, setTpaForm] = useState({
    name: '',
    mobile: '',
    email: '',
    location: '',
    zone: '',
    state: '',
    client_mapping: '',
    is_active: true
  })
  const [assignTpaId, setAssignTpaId] = useState('')
  const [assignReason, setAssignReason] = useState('')
  const [assignRemarks, setAssignRemarks] = useState('')

  const [masterLoading, setMasterLoading] = useState(false)

  const [form, setForm] = useState({
    loan_number: '',
    bank_executive_name: '',
    bank_executive_mobile: '',
    customer_name: '',
    mobile_phone: '',
    registration_number: '',
    client_id: '',
    segment: '',
    make: '',
    model: '',
    variant: '',
    mfg_year: '',
    zone: '',
    state: '',
    city: ''
  })

  const [savingLead, setSavingLead] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    loadCases()
    loadMasters()
    loadTpas()
  }, [])

  async function loadCases() {
    setLoading(true)
    setDbError('')

    // Do not abort Supabase requests with AbortController. In this portal,
    // aborted requests were producing "signal is aborted without reason"
    // and incorrectly clearing the dashboard counts to zero.
    let lastError = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const { data, error } = await supabase
          .from('cases')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000)

        if (error) throw new Error(error.message || 'Unable to load cases from Supabase.')

        setCases(data || [])
        setDbError('')
        setLoading(false)
        return
      } catch (error) {
        lastError = error
        console.error(`Supabase cases request failed (attempt ${attempt}/3):`, error)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        }
      }
    }

    // Keep the last successfully loaded cases on screen rather than replacing
    // the counts with zero when a temporary network failure occurs.
    setDbError(`Database connection failed after 3 attempts: ${lastError?.message || 'Please check your connection and retry.'}`)
    setLoading(false)
  }

  async function loadTpas() {
    // Use ONLY the existing public.tpa_master table.
    // The Assign dropdown and TPA Master screen share this same data source.
    const { data, error } = await supabase
      .from('tpa_master')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(1000)

    if (error) {
      console.error('TPA master error:', error)
      setTpas([])
      setActionError(
        `Unable to load active TPA master: ${error.message}`
      )
      return
    }

    // Keep only active records even if the database returns a non-boolean
    // representation of is_active.
    const activeTpas = (data || []).filter(
      tpa =>
        tpa.is_active === true ||
        String(tpa.is_active).toLowerCase() === 'true' ||
        tpa.is_active === 1 ||
        String(tpa.is_active) === '1'
    )

    setTpas(activeTpas)
  }

  function resetTpaForm() {
    setTpaForm({
      name: '',
      mobile: '',
      email: '',
      location: '',
      zone: '',
      state: '',
      client_mapping: '',
      is_active: true
    })
    setTpaError('')
  }

  async function saveTpa() {
    const name = tpaForm.name.trim()
    const mobile = tpaForm.mobile.trim()

    if (!name) {
      setTpaError('TPA Name is mandatory.')
      return
    }

    if (!/^\\d{10}$/.test(mobile)) {
      setTpaError('Enter a valid 10 digit mobile number.')
      return
    }

    setTpaSaving(true)
    setTpaError('')

    try {
      const { error } = await supabase
        .from('tpa_master')
        .insert({
          name,
          mobile,
          email: tpaForm.email.trim() || null,
          location: tpaForm.location.trim() || null,
          zone: tpaForm.zone.trim() || null,
          state: tpaForm.state.trim() || null,
          client_mapping: tpaForm.client_mapping.trim() || null,
          is_active: Boolean(tpaForm.is_active)
        })

      if (error) throw new Error(error.message)

      await loadTpas()
      setTpaModal(false)
      resetTpaForm()
    } catch (error) {
      setTpaError(error?.message || 'Unable to save TPA.')
    } finally {
      setTpaSaving(false)
    }
  }

  async function assignCaseToTpa() {
    if (!assignCase) {
      setActionError('No case selected.')
      return
    }

    if (!assignTpaId) {
      setActionError('Please select an active TPA.')
      return
    }

    setActionSaving(true)
    setActionError('')

    try {
      const tpa = tpas.find(item => String(item.id) === String(assignTpaId))

      if (!tpa) {
        throw new Error('Selected TPA is not available.')
      }

      // STEP 1: Assign the case. This is the source of truth for success.
      // We deliberately do not use .single() because RLS can make a successful
      // update return an empty representation.
      const { data: updatedCases, error: caseError } = await supabase
        .from('cases')
        .update({
          status: 'ASSIGNED',
          assigned_tpa_id: tpa.id,
          assigned_tpa_name: tpa.name
        })
        .eq('id', assignCase.id)
        .eq('status', 'OPEN')
        .select('id, case_id, status, assigned_tpa_id, assigned_tpa_name')

      if (caseError) {
        throw new Error(caseError.message)
      }

      if (!updatedCases || updatedCases.length !== 1) {
        throw new Error(
          'Case was not assigned. The case may no longer be OPEN, or Supabase permissions/RLS are blocking the update.'
        )
      }

      // STEP 2: Write assignment history as a non-blocking audit operation.
      // The assignment itself must not be reported as failed just because a
      // history/audit insert is unavailable. UUID fields stay NULL because the
      // current app has no Supabase Auth user UUID; display identity goes into
      // the text fields.
      const historyPayload = {
        case_id: assignCase.case_id,
        old_tpa: null,
        new_tpa: tpa.name,
        assigned_by: null,
        assigned_by_name: 'SS Sundar Singh',
        assigned_by_role: 'Admin',
        role: 'Admin',
        reason: assignReason.trim() || null,
        remarks: assignRemarks.trim() || null
      }

      const { error: historyError } = await supabase
        .from('assignment_history')
        .insert(historyPayload)

      // STEP 3: Write audit trail independently. One logging failure must not
      // make a successfully assigned case appear to have failed.
      const auditPayload = {
        case_id: assignCase.case_id,
        user_id: null,
        user_name: 'SS Sundar Singh',
        role: 'Admin',
        action: 'Assigned',
        stage: 'OPEN',
        old_status: 'OPEN',
        new_status: 'ASSIGNED',
        reason: assignReason.trim() || null,
        remarks: assignRemarks.trim() || null
      }

      const { error: auditError } = await supabase
        .from('audit_trail')
        .insert(auditPayload)

      // Logging errors are intentionally console-only for now. The database
      // case status remains the authoritative assignment result. This avoids
      // the previous false "Unable to assign case" / "Failed to fetch" message
      // after the case had already moved to ASSIGNED.
      if (historyError) {
        console.warn('Assignment history could not be saved:', historyError)
      }

      if (auditError) {
        console.warn('Audit trail could not be saved:', auditError)
      }

      // STEP 4: Close the modal and refresh the live case lists only after the
      // case update itself has succeeded.
      setAssignCase(null)
      setAssignTpaId('')
      setAssignReason('')
      setAssignRemarks('')
      await loadCases()
    } catch (error) {
      console.error('Assign case error:', error)
      setActionError(error?.message || 'Unable to assign case.')
    } finally {
      setActionSaving(false)
    }
  }

  async function loadMasters() {
    setMasterLoading(true)

    try {
      const [
        clientsResult,
        mmvResult,
        locationResult
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .limit(5000),

        supabase
          .from('mmv_master')
          .select('*')
          .limit(10000),

        supabase
          .from('location_master')
          .select('*')
          .limit(10000)
      ])

      if (clientsResult.error) {
        console.error('Clients master error:', clientsResult.error)
      }

      if (mmvResult.error) {
        console.error('MMV master error:', mmvResult.error)
      }

      if (locationResult.error) {
        console.error('Location master error:', locationResult.error)
      }

      setClients(clientsResult.data || [])
      setMmv(mmvResult.data || [])
      setLocations(locationResult.data || [])
    } catch (error) {
      console.error('Master loading error:', error)
    }

    setMasterLoading(false)
  }

  const counts = useMemo(() => {
    const normalize = value =>
      String(value || '')
        .trim()
        .toUpperCase()
        .replace(/-/g, '_')
        .replace(/\s+/g, '_')

    return {
      total: cases.length,
      open: cases.filter(
        x => normalize(x.status) === 'OPEN'
      ).length,
      assigned: cases.filter(
        x => normalize(x.status) === 'ASSIGNED'
      ).length,
      reassigned: cases.filter(
        x => normalize(x.status) === 'REASSIGNED'
      ).length,
      preQc: cases.filter(
        x => normalize(x.status) === 'PRE_QC'
      ).length,
      qcHold: cases.filter(
        x => normalize(x.status) === 'QC_HOLD'
      ).length
    }
  }, [cases])

  const recentCases = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return cases.slice(0, 10)

    return cases
      .filter(item =>
        [
          item.case_id,
          item.customer_name,
          item.registration_number,
          item.mobile_phone,
          item.make,
          item.model,
          item.variant
        ]
          .filter(Boolean)
          .some(value =>
            String(value)
              .toLowerCase()
              .includes(q)
          )
      )
      .slice(0, 20)
  }, [cases, search])

  // Open Lead must always read ALL OPEN cases directly from the loaded
  // Supabase case list. Do not use the dashboard's recent/search list here.
  const openLeads = useMemo(() => {
    return cases.filter(item => {
      const status = String(item.status || '')
        .trim()
        .toUpperCase()
        .replace(/-/g, '_')
        .replace(/\s+/g, '_')

      return status === 'OPEN'
    })
  }, [cases])

  const segments = useMemo(() => {
    return [
      'CAR',
      'CV',
      'FE',
      '3WLR',
      '2WLR',
      'CE'
    ]
  }, [])

  // MMV master now contains a real `segment` column.
  // Always filter by Segment first; never fall back to all makes.
  const mmvRowsForSelection = useMemo(() => {
    if (!form.segment) return []

    const selectedSegment = String(form.segment)
      .trim()
      .toUpperCase()

    return mmv.filter(row => {
      const rowSegment = String(
        firstValue(row, [
          'segment',
          'SEGMENT',
          'Segment',
          'vehicle_segment',
          'VEHICLE_SEGMENT'
        ]) || ''
      )
        .trim()
        .toUpperCase()

      return rowSegment === selectedSegment
    })
  }, [mmv, form.segment])

  const makes = useMemo(() => {
    return uniqueValues(
      mmvRowsForSelection.map(row =>
        firstValue(row, [
          'make',
          'MAKE',
          'Make'
        ])
      )
    ).sort((a, b) => a.localeCompare(b))
  }, [mmvRowsForSelection])

  const mmvRowsForSelectedMake = useMemo(() => {
    if (!form.segment || !form.make) return []

    const selectedMake = String(form.make)
      .trim()
      .toUpperCase()

    return mmvRowsForSelection.filter(row => {
      const rowMake = String(
        firstValue(row, [
          'make',
          'MAKE',
          'Make'
        ]) || ''
      )
        .trim()
        .toUpperCase()

      return rowMake === selectedMake
    })
  }, [mmvRowsForSelection, form.make, form.segment])

  const models = useMemo(() => {
    return uniqueValues(
      mmvRowsForSelectedMake.map(row =>
        firstValue(row, [
          'model',
          'MODEL',
          'Model'
        ])
      )
    ).sort((a, b) => a.localeCompare(b))
  }, [mmvRowsForSelectedMake])

  const mmvRowsForSelectedModel = useMemo(() => {
    if (!form.segment || !form.make || !form.model) return []

    const selectedModel = String(form.model)
      .trim()
      .toUpperCase()

    return mmvRowsForSelectedMake.filter(row => {
      const rowModel = String(
        firstValue(row, [
          'model',
          'MODEL',
          'Model'
        ]) || ''
      )
        .trim()
        .toUpperCase()

      return rowModel === selectedModel
    })
  }, [mmvRowsForSelectedMake, form.model, form.make, form.segment])

  const variants = useMemo(() => {
    return uniqueValues(
      mmvRowsForSelectedModel.map(row =>
        firstValue(row, [
          'variant',
          'VARIANT',
          'Variant'
        ])
      )
    ).sort((a, b) => a.localeCompare(b))
  }, [mmvRowsForSelectedModel])

  // Manufacturing Year is independent of MMV rows.
  // It starts at 2010 and automatically includes the current year.
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const result = []

    for (let year = currentYear; year >= 2010; year--) {
      result.push(String(year))
    }

    return result
  }, [])

  const zones = useMemo(() => {
    return uniqueValues(
      locations.map(row =>
        firstValue(row, [
          'zone',
          'ZONE',
          'Zone'
        ])
      )
    )
  }, [locations])

  const states = useMemo(() => {
    return uniqueValues(
      locations
        .filter(row => {
          const rowZone = firstValue(row, [
            'zone',
            'ZONE',
            'Zone'
          ])

          return (
            !form.zone ||
            String(rowZone || '').trim() ===
              String(form.zone).trim()
          )
        })
        .map(row =>
          firstValue(row, [
            'state',
            'STATE',
            'State'
          ])
        )
    )
  }, [locations, form.zone])

  const cities = useMemo(() => {
    return uniqueValues(
      locations
        .filter(row => {
          const rowZone = firstValue(row, [
            'zone',
            'ZONE',
            'Zone'
          ])

          const rowState = firstValue(row, [
            'state',
            'STATE',
            'State'
          ])

          return (
            (!form.zone ||
              String(rowZone || '').trim() ===
                String(form.zone).trim()) &&
            (!form.state ||
              String(rowState || '').trim() ===
                String(form.state).trim())
          )
        })
        .map(row =>
          firstValue(row, [
            'city',
            'CITY',
            'City'
          ])
        )
    )
  }, [locations, form.zone, form.state])

  function formatDate(value) {
    if (!value) return '—'

    return new Date(value).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    )
  }

  function displayStatus(status) {
    if (!status) return 'OPEN'

    return String(status)
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
  }

  function updateForm(field, value) {
    setForm(prev => ({
      ...prev,
      [field]: value
    }))

    setFormError('')
    setFormSuccess('')
  }

  function resetDependentFields(field) {
    if (field === 'segment') {
      setForm(prev => ({
        ...prev,
        segment: prev.segment,
        make: '',
        model: '',
        variant: ''
      }))
    }

    if (field === 'make') {
      setForm(prev => ({
        ...prev,
        make: prev.make,
        model: '',
        variant: ''
      }))
    }

    if (field === 'model') {
      setForm(prev => ({
        ...prev,
        model: prev.model,
        variant: ''
      }))
    }

    if (field === 'zone') {
      setForm(prev => ({
        ...prev,
        zone: prev.zone,
        state: '',
        city: ''
      }))
    }

    if (field === 'state') {
      setForm(prev => ({
        ...prev,
        state: prev.state,
        city: ''
      }))
    }
  }

  function handleSegmentChange(value) {
    setForm(prev => ({
      ...prev,
      segment: value,
      make: '',
      model: '',
      variant: ''
    }))
    setFormError('')
  }

  function handleMakeChange(value) {
    setForm(prev => ({
      ...prev,
      make: value,
      model: '',
      variant: ''
    }))
    setFormError('')
  }

  function handleModelChange(value) {
    setForm(prev => ({
      ...prev,
      model: value,
      variant: ''
    }))
    setFormError('')
  }

  function handleZoneChange(value) {
    setForm(prev => ({
      ...prev,
      zone: value,
      state: '',
      city: ''
    }))
    setFormError('')
  }

  function handleStateChange(value) {
    setForm(prev => ({
      ...prev,
      state: value,
      city: ''
    }))
    setFormError('')
  }

  function validateLead() {
    const required = [
      ['bank_executive_name', 'Bank Executive Name'],
      ['bank_executive_mobile', 'Bank Executive Mobile Number'],
      ['customer_name', 'Customer Name'],
      ['mobile_phone', 'Mobile Number'],
      ['registration_number', 'Registration Number'],
      ['client_id', 'Client'],
      ['segment', 'Segment'],
      ['make', 'Make'],
      ['model', 'Model'],
      ['variant', 'Variant'],
      ['mfg_year', 'Manufacturing Year'],
      ['zone', 'Zone'],
      ['state', 'State'],
      ['city', 'City']
    ]

    for (const [key, label] of required) {
      if (!String(form[key] || '').trim()) {
        return `${label} is required.`
      }
    }

    const mobile = String(
      form.mobile_phone || ''
    ).replace(/\D/g, '')

    if (mobile.length !== 10) {
      return 'Mobile Number must be 10 digits.'
    }

    const bankExecutiveMobile = String(
      form.bank_executive_mobile || ''
    ).replace(/\D/g, '')

    if (bankExecutiveMobile.length !== 10) {
      return 'Bank Executive Mobile Number must be 10 digits.'
    }

    return ''
  }

  async function generateCaseId() {
    const { data, error } = await supabase
      .from('cases')
      .select('case_id')
      .order('case_id', {
        ascending: false
      })
      .limit(1)

    if (error) {
      throw new Error(
        `Unable to generate Case ID: ${error.message}`
      )
    }

    const lastCaseId =
      data &&
      data.length > 0 &&
      data[0].case_id
        ? Number(data[0].case_id)
        : 100000

    return lastCaseId + 1
  }

  function openEditLead(item) {
    setSelectedCase(item)
    setEditCase(item)
    setFormError('')
    setFormSuccess('')
    setForm({
      loan_number: item.loan_number || '',
      bank_executive_name: item.bank_executive_name || '',
      bank_executive_mobile: item.bank_executive_mobile || '',
      customer_name: item.customer_name || '',
      mobile_phone: item.mobile_phone || '',
      registration_number: item.registration_number || '',
      client_id: item.client_id || '',
      segment: item.segment || '',
      make: item.make || '',
      model: item.model || '',
      variant: item.variant || '',
      mfg_year: item.mfg_year ? String(item.mfg_year) : '',
      zone: item.zone || '',
      state: item.state || '',
      city: item.city || ''
    })
    setAdd(true)
  }

  function closeLeadForm() {
    if (savingLead) return
    setAdd(false)
    setEditCase(null)
    setSelectedCase(null)
    setFormError('')
    setFormSuccess('')
    setForm({
      loan_number: '',
      bank_executive_name: '',
      bank_executive_mobile: '',
      customer_name: '',
      mobile_phone: '',
      registration_number: '',
      client_id: '',
      segment: '',
      make: '',
      model: '',
      variant: '',
      mfg_year: '',
      zone: '',
      state: '',
      city: ''
    })
  }

  async function updateLead(event) {
    event.preventDefault()
    setFormError('')
    setFormSuccess('')

    const validationError = validateLead()
    if (validationError) {
      setFormError(validationError)
      return
    }

    if (!editCase) {
      setFormError('No lead selected for editing.')
      return
    }

    setSavingLead(true)

    try {
      const payload = {
        loan_number: form.loan_number.trim() || null,
        bank_executive_name: form.bank_executive_name.trim(),
        bank_executive_mobile: form.bank_executive_mobile.trim(),
        customer_name: form.customer_name.trim(),
        mobile_phone: form.mobile_phone.trim(),
        registration_number: form.registration_number.trim().toUpperCase(),
        client_id: form.client_id,
        segment: form.segment,
        make: form.make,
        model: form.model,
        variant: form.variant,
        mfg_year: Number(form.mfg_year),
        zone: form.zone,
        state: form.state,
        city: form.city
      }

      const { data, error } = await supabase
        .from('cases')
        .update(payload)
        .eq('id', editCase.id)
        .select()
        .single()

      if (error) {
        console.error('Update lead error:', error)
        throw new Error(error.message)
      }

      setFormSuccess(
        `Lead updated successfully. Case ID: CASE-${data.case_id}`
      )
      await loadCases()
    } catch (error) {
      setFormError(
        error?.message || 'Unable to update lead.'
      )
    } finally {
      setSavingLead(false)
    }
  }

  function openAssignCase(item) {
    setActionError('')
    setAssignTpaId('')
    setAssignReason('')
    setAssignRemarks('')
    setAssignCase(item)
  }

  function openRemarkCase(item) {
    setActionError('')
    setRemarkText('')
    setRemarkCase(item)
  }

  function openReassignCase(item) {
    setActionError('')
    setReassignTpaId('')
    setReassignReason('')
    setReassignRemarks('')
    setReassignCase(item)
  }

  async function openHistory(item) {
    setSelectedCase(item)
    setHist(true)
    setHistoryEvents([])
    setHistoryError('')
    setHistoryLoading(true)

    try {
      const [auditResult, assignmentResult] = await Promise.all([
        supabase
          .from('audit_trail')
          .select('*')
          .eq('case_id', item.case_id)
          .order('created_at', { ascending: true }),
        supabase
          .from('assignment_history')
          .select('*')
          .eq('case_id', item.case_id)
          .order('created_at', { ascending: true })
      ])

      if (auditResult.error) throw new Error(auditResult.error.message)
      if (assignmentResult.error) throw new Error(assignmentResult.error.message)

      const auditEvents = (auditResult.data || []).map(row => ({
        id: `audit-${row.id}`,
        source: 'Audit Trail',
        action: row.action || 'Audit Event',
        stage: row.stage || '—',
        oldStatus: row.old_status || '—',
        newStatus: row.new_status || '—',
        reason: row.reason || '—',
        remarks: row.remarks || '—',
        userName: row.user_name || 'SS Sundar Singh',
        role: row.role || 'Admin',
        createdAt: row.created_at
      }))

      const assignmentEvents = (assignmentResult.data || []).map(row => ({
        id: `assignment-${row.id}`,
        source: 'Assignment History',
        action: row.old_tpa ? 'Reassigned' : 'Assigned',
        stage: 'ASSIGNMENT',
        oldStatus: row.old_tpa ? 'ASSIGNED' : 'OPEN',
        newStatus: row.old_tpa ? 'REASSIGNED' : 'ASSIGNED',
        reason: row.reason || '—',
        remarks: row.remarks || '—',
        userName: row.assigned_by_name || row.assigned_by || 'SS Sundar Singh',
        role: row.assigned_by_role || row.role || 'Admin',
        createdAt: row.created_at,
        oldTpa: row.old_tpa || '—',
        newTpa: row.new_tpa || '—'
      }))

      const merged = [...auditEvents, ...assignmentEvents].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      )

      setHistoryEvents(merged)
    } catch (error) {
      console.error('History load error:', error)
      setHistoryError(error?.message || 'Unable to load case history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  async function recoverCaseMediaFromStorage(caseId, savedForm = {}) {
    // Recovery helper: Storage files can remain even when report_data.photos/videos references are empty.
    const recovered = { ...(savedForm || {}), media: { ...((savedForm || {}).media || {}) } }
    const bucket = supabase.storage.from('inspection-media')
    const files = []
    const queue = [String(caseId)]
    const visited = new Set()
    while (queue.length) {
      const prefix = queue.shift()
      if (visited.has(prefix)) continue
      visited.add(prefix)
      const { data, error } = await bucket.list(prefix, { limit: 100, sortBy: { column: 'name', order: 'asc' } })
      if (error) {
        console.warn('Media recovery list failed for', prefix, error.message)
        continue
      }
      for (const entry of data || []) {
        if (!entry?.name) continue
        const path = `${prefix}/${entry.name}`
        const isFolder = !entry.id && !entry.metadata && !/\.(mp4|mov|jpg|jpeg|png|webp|heic)$/i.test(entry.name)
        if (isFolder) queue.push(path)
        else files.push({ path, entry })
      }
    }

    const normalizeMediaKey = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
    const photoAliases = {
      'Profile Picture': ['profilepicture'], 'Right View': ['rightview'], 'Right Quarter Panel': ['rightquarterpanel'],
      'Rear View': ['rearview'], 'Left Quarter Panel': ['leftquarterpanel'], 'Left View': ['leftview'],
      'Left Side Profile Pic': ['leftsideprofilepic'], 'Front View': ['frontview'],
      'Engine Compartment 1': ['enginecompartment1'], 'Engine Compartment 2': ['enginecompartment2'], 'Engine Compartment 3': ['enginecompartment3'],
      'Boot / Dicky': ['bootdicky','boot','dicky'], 'Front Windscreen': ['frontwindscreen'],
      'Windscreen - Interior (from rear seat)': ['windscreeninteriorfromrearseat','windscreeninterior'],
      'Dashboard': ['dashboard'], 'Odometer Reading': ['odometerreading','odometer'],
      'ABC Pedals (from driver seat)': ['abcpedalsfromdriverseat','abcpedals'], 'Selfie with Vehicle': ['selfiewithvehicle'],
      'Other Images 1': ['otherimages1'], 'Other Images 2': ['otherimages2'], 'Other Images 3': ['otherimages3'],
      'VIN Plate Photo': ['vinplatephoto','vinplate'], 'Chassis Imprint': ['chassisimprint'], 'Pencil Tracing': ['penciltracing']
    }

    const savedVideo = recovered.exteriorVideo
    const storedVideos = files.filter(file => /\.(mp4|mov|webm|m4v)$/i.test(file.path) && /exterior/i.test(file.path))
    if (!(savedVideo?.url || savedVideo?.publicUrl || savedVideo?.signedUrl) && storedVideos.length) {
      const chosen = storedVideos.sort((a, b) => {
        const at = Number(a.entry?.created_at ? Date.parse(a.entry.created_at) : 0)
        const bt = Number(b.entry?.created_at ? Date.parse(b.entry.created_at) : 0)
        return bt - at
      })[0]
      const { data: publicData } = bucket.getPublicUrl(chosen.path)
      recovered.exteriorVideo = {
        name: chosen.entry.name,
        type: 'video/mp4',
        size: Number(chosen.entry.metadata?.size || 0),
        duration: Number(savedVideo?.duration || 0),
        url: publicData?.publicUrl || '',
        publicUrl: publicData?.publicUrl || '',
        storagePath: chosen.path,
        recoveredFromStorage: true
      }
    }

    for (const [label, aliases] of Object.entries(photoAliases)) {
      const existing = recovered.media?.[label]
      if (existing && (typeof existing === 'string' || existing.dataUrl || existing.url || existing.publicUrl)) continue
      const match = files.find(file => {
        if (!/\.(jpg|jpeg|png|webp)$/i.test(file.path)) return false
        const key = normalizeMediaKey(file.path.split('/').slice(1, -1).join(' ') + ' ' + file.entry.name)
        return aliases.some(alias => key.includes(alias))
      })
      if (match) {
        const { data: publicData } = bucket.getPublicUrl(match.path)
        recovered.media[label] = { name: match.entry.name, type: match.entry.metadata?.mimetype || 'image/jpeg', size: Number(match.entry.metadata?.size || 0), url: publicData?.publicUrl || '', publicUrl: publicData?.publicUrl || '', storagePath: match.path, recoveredFromStorage: true }
      }
    }
    return recovered
  }

  async function loadMasterInspectionReport(item) {
    setReportHydrated(false)
    if (!item?.case_id) return buildTpaQcForm(item)
    try {
      const { data, error } = await supabase.from('inspection_reports').select('report_data, photos, videos, updated_at').eq('case_id', item.case_id).order('updated_at', { ascending: false }).limit(1)
      if (error) {
        console.warn('Inspection report load:', error.message)
        return recoverCaseMediaFromStorage(item.case_id, buildTpaQcForm(item))
      }
      const row = data?.[0]
      const saved = row?.report_data && typeof row.report_data === 'object' ? row.report_data : {}
      const merged = { ...buildTpaQcForm(item), ...saved }
      merged.detailed = saved.detailed && typeof saved.detailed === 'object' ? saved.detailed : {}
      // Older app versions stored media separately from report_data. Merge both formats.
      const savedPhotos = row?.photos && typeof row.photos === 'object' ? row.photos : {}
      const savedVideos = row?.videos && typeof row.videos === 'object' ? row.videos : {}
      merged.media = { ...(savedPhotos.media || {}), ...savedPhotos, ...(saved.media || {}) }
      delete merged.media.media
      if (!merged.exteriorVideo) {
        const video = savedVideos.exteriorVideo || savedVideos['Exterior Video'] || savedVideos.exterior || savedVideos.video || null
        if (video) merged.exteriorVideo = typeof video === 'string' ? { url: video, publicUrl: video, name: 'Exterior Video', type: 'video/mp4' } : video
      }
      if (!merged.exteriorVideo && Array.isArray(savedVideos)) {
        const video = savedVideos.find(v => /exterior/i.test(`${v?.category || ''} ${v?.name || ''} ${v?.path || ''}`))
        if (video) merged.exteriorVideo = typeof video === 'string' ? { url: video, publicUrl: video, name: 'Exterior Video', type: 'video/mp4' } : { ...video, url: video.url || video.publicUrl || '' }
      }
      return await recoverCaseMediaFromStorage(item.case_id, merged)
    } catch (error) {
      console.error('Master report load error:', error)
      // Return lead-derived fields if the report query fails, but do not mark
      // the form hydrated until openReportCase has installed this exact result.
      return await recoverCaseMediaFromStorage(item.case_id, buildTpaQcForm(item))
    }
  }

  function sanitizeReportForm(value) {
    const next = JSON.parse(JSON.stringify(value || {}))
    delete next.mediaError
    if (next.exteriorVideo) {
      delete next.exteriorVideo.previewUrl
      delete next.exteriorVideo.file
    }
    return next
  }

  async function persistMasterInspectionReport(item, value, stage, writeAudit = true) {
    if (!item?.case_id) return
    const { data: existing, error: findError } = await supabase.from('inspection_reports').select('id, report_data, photos, videos').eq('case_id', item.case_id).order('updated_at', { ascending: false }).limit(1)
    if (findError) throw new Error(findError.message)
    const currentRow = existing?.[0] || null
    const incoming = sanitizeReportForm(value)
    const previous = currentRow?.report_data && typeof currentRow.report_data === 'object' ? currentRow.report_data : {}
    // Never let an empty autosave erase a populated value saved by an earlier stage.
    const mergePreservingSaved = (oldValue, newValue) => {
      if (newValue === undefined || newValue === null || newValue === '') return oldValue ?? newValue
      if (Array.isArray(newValue)) return newValue.length ? newValue : (Array.isArray(oldValue) && oldValue.length ? oldValue : newValue)
      if (typeof newValue === 'object') {
        const out = { ...(oldValue && typeof oldValue === 'object' && !Array.isArray(oldValue) ? oldValue : {}) }
        for (const [key, val] of Object.entries(newValue)) out[key] = mergePreservingSaved(out[key], val)
        return out
      }
      return newValue
    }
    const mergedReport = mergePreservingSaved(previous, incoming)
    const mediaFromRow = currentRow?.photos && typeof currentRow.photos === 'object' ? currentRow.photos : {}
    const videosFromRow = currentRow?.videos && typeof currentRow.videos === 'object' ? currentRow.videos : {}
    const payload = {
      case_id: item.case_id,
      report_data: mergedReport,
      photos: { ...mediaFromRow, ...(mergedReport.media || {}) },
      videos: { ...videosFromRow, ...(mergedReport.exteriorVideo ? { exteriorVideo: mergedReport.exteriorVideo, 'Exterior Video': mergedReport.exteriorVideo } : {}) },
      updated_at: new Date().toISOString()
    }
    if (currentRow?.id) {
      const { error } = await supabase.from('inspection_reports').update(payload).eq('id', currentRow.id)
      if (error) throw new Error(error.message)
    } else {
      const { error } = await supabase.from('inspection_reports').insert(payload)
      if (error) throw new Error(error.message)
    }
    if (writeAudit) {
      const { error: auditError } = await supabase.from('audit_trail').insert({ case_id: item.case_id, action: 'Report Saved', stage: stage || active, old_status: item.status || null, new_status: item.status || null, remarks: `Master report saved from ${stage || active}`, user_id: null, user_name: 'SS Sundar Singh', role: 'Admin' })
      if (auditError) console.warn('Report audit:', auditError.message)
    }
  }

  function queueMasterInspectionReportSave(item, value, stage, writeAudit = true) {
    // Snapshot at invocation time; never let concurrent Supabase writes race each other.
    const snapshot = JSON.parse(JSON.stringify(value || {}))
    const save = reportSaveQueueRef.current.catch(() => {}).then(() =>
      persistMasterInspectionReport(item, snapshot, stage, writeAudit)
    )
    // Keep the queue alive after a failed save while still returning the error to its caller.
    reportSaveQueueRef.current = save.catch(() => {})
    return save
  }

  async function openReportCase(item, stage) {
    // Ignore late responses if the user switches to another case before loading finishes.
    const requestId = ++reportLoadRequestRef.current
    setReportHydrated(false)
    setTpaQcCase(item)
    setActive(stage)
    setTpaQcMessage('')
    setActionError('')
    setTpaQcForm({})
    try {
      const loaded = await loadMasterInspectionReport(item)
      if (requestId !== reportLoadRequestRef.current) return
      setTpaQcForm(loaded)
      setReportHydrated(true)
    } catch (error) {
      if (requestId !== reportLoadRequestRef.current) return
      setTpaQcMessage(`Unable to load saved report: ${error?.message || 'Unknown error'}. Autosave is paused until the report is re-opened.`)
      setReportHydrated(false)
    }
  }

  function openTpaQcCase(item) { openReportCase(item, 'TPA QC') }
  function openQcCase(item) { openReportCase(item, 'QC') }

  function buildTpaQcForm(item) {
    return {
      registration_number: item?.registration_number || '', rto: item?.rto || '',
      manufacturing_date: item?.manufacturing_date || '', registration_date: item?.registration_date || '',
      owner_count: item?.owner_count || '', odometer: item?.odometer || '', fuel: item?.fuel || '', transmission: item?.transmission || '',
      color: item?.color || '', body_type: item?.body_type || '', engine_number: item?.engine_number || '', chassis_number: item?.chassis_number || '',
      loan_number: item?.loan_number || '', rc_available: item?.rc_available || '', insurance_type: item?.insurance_type || '', insurance_validity: item?.insurance_validity || '',
      insurance_expiry: item?.insurance_expiry || '', third_party_validity: item?.third_party_validity || '', hypothecation: item?.hypothecation || '', financier: item?.financier || '',
      cng_fitment: item?.cng_fitment || '', cng_category: item?.cng_category || '', road_tax_validity: item?.road_tax_validity || '', road_tax_date: item?.road_tax_date || '',
      customer_name: item?.customer_name || '', proposer_name: item?.proposer_name || '', client_name: item?.client_name || item?.client || '', cng_validity: item?.cng_validity || '',
      key_available: item?.key_available || '', inspection_type: item?.inspection_type || 'Physical Inspection', inspection_site: item?.city || '', remarks: item?.remarks || '',
      overall_score: '', body_score: '', exterior_score: '', light_score: '', tyre_score: '', other_score: '', condition: '', detailed: {}, media: {}, exteriorVideo: null, valuation_price: '', pricing_remarks: '', pdf_url: '', pdf_size: '', pdf_generated_at: ''
    }
  }

  function updateTpaQcField(key, value) {
    setTpaQcForm(prev => ({ ...prev, [key]: value }))
  }

  useEffect(() => {
    const editableStages = ['TPA QC', 'QC', 'QC Hold', 'Pricing', 'Report Generated']
    if (!tpaQcCase || !reportHydrated || !editableStages.includes(active) || !Object.keys(tpaQcForm || {}).length) return
    const timer = setTimeout(async () => {
      try {
        setReportAutosaving(true)
        await queueMasterInspectionReportSave(tpaQcCase, tpaQcForm, active, false)
      } catch (error) { console.error('Master report autosave error:', error); setTpaQcMessage(`Autosave failed: ${error?.message || 'Unknown error'}. Please do not close this report until it saves.`) }
      finally { setReportAutosaving(false) }
    }, 800)
    return () => clearTimeout(timer)
  }, [tpaQcForm, tpaQcCase, active, reportHydrated])

  async function moveCaseToTpaQc(item) {
    if (!item) return
    setActionSaving(true)
    setActionError('')
    try {
      const { error } = await supabase.from('cases').update({ status: 'PRE_QC' }).eq('id', item.id).in('status', ['ASSIGNED', 'REASSIGNED'])
      if (error) throw new Error(error.message)
      const { error: auditError } = await supabase.from('audit_trail').insert({
        case_id: item.case_id, action: 'Moved to TPA QC', stage: 'TPA QC', old_status: item.status || 'ASSIGNED', new_status: 'PRE_QC',
        reason: null, remarks: null, user_id: null, user_name: 'SS Sundar Singh', role: 'Admin'
      })
      if (auditError) console.error('TPA QC audit error:', auditError)
      const refreshed = { ...item, status: 'PRE_QC' }
      await loadCases()
      openTpaQcCase(refreshed)
    } catch (error) {
      console.error('Move to TPA QC error:', error)
      setActionError(error?.message || 'Unable to move case to TPA QC.')
    } finally { setActionSaving(false) }
  }

  async function saveTpaQcDraft(submitToQc = false) {
    if (!tpaQcCase) return
    setTpaQcSaving(true); setTpaQcMessage('')
    try {
      await queueMasterInspectionReportSave(tpaQcCase, tpaQcForm, active, true)
      if (submitToQc) {
        const { error } = await supabase.from('cases').update({ status: 'QC' }).eq('id', tpaQcCase.id).eq('status', 'PRE_QC')
        if (error) throw new Error(error.message)
        await supabase.from('audit_trail').insert({ case_id: tpaQcCase.case_id, action: 'Submitted to QC', stage: 'TPA QC', old_status: 'PRE_QC', new_status: 'QC', remarks: tpaQcForm.remarks || null, user_id: null, user_name: 'SS Sundar Singh', role: 'Admin' })
        const next = { ...tpaQcCase, status: 'QC' }
        setTpaQcCase(next); setActive('QC'); setReportHydrated(true); await loadCases()
        setTpaQcMessage('Master report saved and submitted to QC successfully.')
      } else setTpaQcMessage('Master report saved successfully.')
    } catch (error) { setTpaQcMessage(error?.message || 'Unable to save master inspection report.') }
    finally { setTpaQcSaving(false) }
  }

  async function qcApproveCase(item) {
    if (!item) return
    setActionSaving(true); setActionError('')
    try {
      await queueMasterInspectionReportSave(item, tpaQcForm, 'QC', true)
      const { error } = await supabase.from('cases').update({ status: 'PRICING' }).eq('id', item.id).eq('status', 'QC')
      if (error) throw new Error(error.message)
      await supabase.from('audit_trail').insert({ case_id: item.case_id, action: 'QC Approved', stage: 'QC', old_status: 'QC', new_status: 'PRICING', user_id: null, user_name: 'SS Sundar Singh', role: 'Admin' })
      await loadCases(); setTpaQcCase({ ...item, status: 'PRICING' }); setActive('Pricing')
    } catch (error) { setActionError(error?.message || 'Unable to approve QC case.') }
    finally { setActionSaving(false) }
  }

  async function qcHoldCase(item) {
    if (!item) return
    const reason = window.prompt('Enter mandatory QC Hold reason:')
    if (!reason || !reason.trim()) return
    setActionSaving(true); setActionError('')
    try {
      await queueMasterInspectionReportSave(item, tpaQcForm, 'QC', true)
      const { error } = await supabase.from('cases').update({ status: 'QC_HOLD' }).eq('id', item.id).eq('status', 'QC')
      if (error) throw new Error(error.message)
      await supabase.from('audit_trail').insert({ case_id: item.case_id, action: 'QC Hold', stage: 'QC', old_status: 'QC', new_status: 'QC_HOLD', reason: reason.trim(), remarks: reason.trim(), user_id: null, user_name: 'SS Sundar Singh', role: 'Admin' })
      await loadCases(); setTpaQcCase({ ...item, status: 'QC_HOLD' }); setActive('QC Hold')
    } catch (error) { setActionError(error?.message || 'Unable to put case on QC Hold.') }
    finally { setActionSaving(false) }
  }

  async function moveQcHoldBackToQc(item) {
    if (!item) return
    setActionSaving(true); setActionError('')
    try {
      await queueMasterInspectionReportSave(item, tpaQcForm, 'QC Hold', true)
      const { error } = await supabase.from('cases').update({ status: 'QC' }).eq('id', item.id).eq('status', 'QC_HOLD')
      if (error) throw new Error(error.message)
      await supabase.from('audit_trail').insert({ case_id: item.case_id, action: 'QC Hold Resubmitted', stage: 'QC Hold', old_status: 'QC_HOLD', new_status: 'QC', user_id: null, user_name: 'SS Sundar Singh', role: 'Admin' })
      await loadCases(); setTpaQcCase({ ...item, status: 'QC' }); setActive('QC')
    } catch (error) { setActionError(error?.message || 'Unable to return case to QC.') }
    finally { setActionSaving(false) }
  }

  async function pricingFinalSubmit(item, pdfMeta = null) {
    if (!item) return
    setActionSaving(true); setActionError('')
    try {
      // A case must not be marked completed unless the PDF was generated and uploaded.
      if (!pdfMeta?.pdfUrl) {
        throw new Error('PDF was not generated or uploaded. The case remains in Pricing. Please retry Final Submit.')
      }
      const finalForm = {
        ...tpaQcForm,
        pdf_url: pdfMeta.pdfUrl,
        pdf_size: pdfMeta.pdfSize || null,
        pdf_generated_at: pdfMeta.pdfGeneratedAt || new Date().toISOString()
      }
      setTpaQcForm(finalForm)
      await queueMasterInspectionReportSave(item, finalForm, 'Pricing', true)
      const { error } = await supabase.from('cases').update({ status: 'COMPLETED' }).eq('id', item.id).eq('status', 'PRICING')
      if (error) throw new Error(error.message)
      await supabase.from('audit_trail').insert({ case_id: item.case_id, action: 'Final Submitted / Report Generated', stage: 'Pricing', old_status: 'PRICING', new_status: 'COMPLETED', remarks: 'Pricing final submitted; PDF generated and uploaded successfully.', user_id: null, user_name: 'SS Sundar Singh', role: 'Admin' })
      await loadCases()
      setTpaQcCase({ ...item, status: 'COMPLETED' })
      setTpaQcMessage('PDF generated and uploaded successfully. Report is ready.')
      // Open the report itself so PDF actions are available inside the report, not on the list page.
      setActive('Report Generated')
    } catch (error) {
      setActionError(error?.message || 'Unable to generate final report. The case has not been marked completed.')
    } finally {
      setActionSaving(false)
    }
  }

  async function reassignCaseToTpa() {
    if (!reassignCase) {
      setActionError('No case selected.')
      return
    }

    if (!reassignTpaId) {
      setActionError('Please select a new active TPA.')
      return
    }

    const reason = reassignReason.trim()
    const remarks = reassignRemarks.trim()

    if (!reason) {
      setActionError('Reassign reason is mandatory.')
      return
    }

    setActionSaving(true)
    setActionError('')

    try {
      const tpa = tpas.find(item => String(item.id) === String(reassignTpaId))
      if (!tpa) throw new Error('Selected TPA is not available.')

      const oldTpa = reassignCase.assigned_tpa_name || null
      if (String(reassignCase.assigned_tpa_id || '') === String(tpa.id)) {
        throw new Error('Please select a different TPA.')
      }

      // Update the case first. Do NOT depend on the UPDATE response body;
      // Supabase can return an empty representation when the table has RLS
      // policies or when the API does not return updated rows.
      const { error: updateError } = await supabase
        .from('cases')
        .update({
          status: 'REASSIGNED',
          assigned_tpa_id: tpa.id,
          assigned_tpa_name: tpa.name
        })
        .eq('id', reassignCase.id)
        .in('status', ['ASSIGNED', 'REASSIGNED'])

      if (updateError) throw new Error(updateError.message)

      // Verify the saved state with a normal SELECT. This prevents the false
      // "Case was not reassigned" error seen when UPDATE succeeds but returns
      // no row representation.
      const { data: verifiedCase, error: verifyError } = await supabase
        .from('cases')
        .select('id, case_id, status, assigned_tpa_id, assigned_tpa_name')
        .eq('id', reassignCase.id)
        .maybeSingle()

      if (verifyError) throw new Error(verifyError.message)

      if (
        !verifiedCase ||
        verifiedCase.status !== 'REASSIGNED' ||
        String(verifiedCase.assigned_tpa_id || '') !== String(tpa.id)
      ) {
        throw new Error(
          'Reassignment could not be verified. The case may have changed or Supabase permissions/RLS may be blocking the update.'
        )
      }

      const { error: historyError } = await supabase
        .from('assignment_history')
        .insert({
          case_id: reassignCase.case_id,
          old_tpa: oldTpa,
          new_tpa: tpa.name,
          assigned_by: null,
          assigned_by_name: 'SS Sundar Singh',
          assigned_by_role: 'Admin',
          role: 'Admin',
          reason,
          remarks: remarks || null
        })

      if (historyError) {
        console.error('Reassign history error:', historyError)
      }

      const { error: auditError } = await supabase
        .from('audit_trail')
        .insert({
          case_id: reassignCase.case_id,
          action: 'Reassigned',
          stage: 'ASSIGN',
          old_status: reassignCase.status || 'ASSIGNED',
          new_status: 'REASSIGNED',
          reason,
          remarks: remarks || null,
          user_id: null,
          user_name: 'SS Sundar Singh',
          role: 'Admin'
        })

      if (auditError) {
        console.error('Reassign audit error:', auditError)
      }

      setReassignCase(null)
      setReassignTpaId('')
      setReassignReason('')
      setReassignRemarks('')
      await loadCases()
    } catch (error) {
      console.error('Reassign case error:', error)
      setActionError(error?.message || 'Unable to reassign case.')
    } finally {
      setActionSaving(false)
    }
  }

  function openRejectCase(item) {
    setActionError('')
    setRejectReason('')
    setRejectRemarks('')
    setRejectCase(item)
  }

  async function rejectAssignedCase() {
    if (!rejectCase) {
      setActionError('No case selected.')
      return
    }

    const reason = rejectReason.trim()
    const remarks = rejectRemarks.trim()

    if (!reason) {
      setActionError('Reject reason is mandatory.')
      return
    }

    const oldStatus = String(rejectCase.status || 'OPEN').trim().toUpperCase()
    if (!['OPEN', 'ASSIGNED', 'REASSIGNED'].includes(oldStatus)) {
      setActionError('This case cannot be rejected from the current stage.')
      return
    }

    setActionSaving(true)
    setActionError('')

    try {
      const { data, error } = await supabase
        .from('cases')
        .update({ status: 'REJECTED' })
        .eq('id', rejectCase.id)
        .eq('status', oldStatus)
        .select('id, case_id, status')

      if (error) throw new Error(error.message)
      if (!data || data.length !== 1) {
        throw new Error('Case was not rejected. It may have changed stage or permissions/RLS may be blocking the update.')
      }

      const { error: auditError } = await supabase
        .from('audit_trail')
        .insert({
          case_id: rejectCase.case_id,
          action: 'Rejected',
          stage: 'ASSIGN',
          old_status: oldStatus,
          new_status: 'REJECTED',
          reason,
          remarks: remarks || null,
          user_id: null,
          user_name: 'SS Sundar Singh',
          role: 'Admin'
        })

      if (auditError) {
        console.error('Reject audit error:', auditError)
      }

      setRejectCase(null)
      setRejectReason('')
      setRejectRemarks('')
      await loadCases()
    } catch (error) {
      console.error('Reject case error:', error)
      setActionError(error?.message || 'Unable to reject case.')
    } finally {
      setActionSaving(false)
    }
  }

  async function saveRemark() {
    const text = remarkText.trim()

    if (!remarkCase) {
      setActionError('No case selected.')
      return
    }

    if (!text) {
      setActionError('Please enter remarks.')
      return
    }

    setActionSaving(true)
    setActionError('')

    try {
      const payload = {
        case_id: remarkCase.case_id,
        action: 'Remark Added',
        stage: displayStatus(remarkCase.status || 'OPEN'),
        old_status: remarkCase.status || 'OPEN',
        new_status: remarkCase.status || 'OPEN',
        remarks: text,
        user_id: null,
        user_name: 'SS Sundar Singh',
        role: 'Admin'
      }

      let result = await supabase.from('audit_trail').insert(payload)
      if (result.error && /fetch|network|timeout/i.test(String(result.error.message || ''))) {
        await new Promise(resolve => setTimeout(resolve, 900))
        result = await supabase.from('audit_trail').insert(payload)
      }
      if (result.error) throw new Error(result.error.message)

      setRemarkCase(null)
      setRemarkText('')
      setActionError('')
      await loadCases()
    } catch (error) {
      setActionError(
        error?.message || 'Unable to save remarks.'
      )
    } finally {
      setActionSaving(false)
    }
  }

  
  async function saveLead(event) {
    event.preventDefault()

    setFormError('')
    setFormSuccess('')

    const validationError = validateLead()

    if (validationError) {
      setFormError(validationError)
      return
    }

    setSavingLead(true)

    try {
      const nextCaseId =
        await generateCaseId()

      const payload = {
        case_id: nextCaseId,
        loan_number:
          form.loan_number.trim() || null,
        bank_executive_name:
          form.bank_executive_name.trim(),
        bank_executive_mobile:
          form.bank_executive_mobile.trim(),
        customer_name:
          form.customer_name.trim(),
        mobile_phone:
          form.mobile_phone.trim(),
        registration_number:
          form.registration_number
            .trim()
            .toUpperCase(),
        client_id: form.client_id,
        segment: form.segment,
        make: form.make,
        model: form.model,
        variant: form.variant,
        mfg_year: Number(form.mfg_year),
        zone: form.zone,
        state: form.state,
        city: form.city,
        status: 'OPEN'
      }

      const { data, error } =
        await supabase
          .from('cases')
          .insert(payload)
          .select()
          .single()

      if (error) {
        console.error(
          'Create lead error:',
          error
        )

        throw new Error(error.message)
      }

      setFormSuccess(
        `Lead created successfully. Case ID: CASE-${data.case_id}`
      )

      await loadCases()

      setForm({
        loan_number: '',
        bank_executive_name: '',
        bank_executive_mobile: '',
        customer_name: '',
        mobile_phone: '',
        registration_number: '',
        client_id: '',
        segment: '',
        make: '',
        model: '',
        variant: '',
        mfg_year: '',
        zone: '',
        state: '',
        city: ''
      })
    } catch (error) {
      setFormError(
        error?.message ||
          'Unable to create lead.'
      )
    } finally {
      setSavingLead(false)
    }
  }

  return (
    <div className="app">

      <aside>
        <div className="brand">
          <b>CD</b>

          <span>
            <strong>CarDekho</strong>
            <small>
              Vehicle Inspection
            </small>
          </span>
        </div>

        <nav>
          {items.map(
            ([name, Icon]) => (
              <button
                key={name}
                className={
                  active === name
                    ? 'active'
                    : ''
                }
                onClick={() => {
                  setActive(name)
                  if (['TPA QC', 'QC', 'QC Hold', 'Pricing', 'Report Generated'].includes(name)) {
                    setTpaQcCase(null)
                    setTpaQcForm({})
                    setReportHydrated(false)
                    setTpaQcMessage('')
                    setActionError('')
                  }
                }}
              >
                <i className="nav-icon"><Icon size={18} strokeWidth={1.9} aria-hidden="true" /></i>
                {name}
              </button>
            )
          )}
        </nav>

        <div className="user">
          SS&nbsp; Sundar Singh
          <small>Admin</small>
        </div>
      </aside>

      <main>

        <header>
          <div>
            <h1>{active}</h1>

            <small>
              CarDekho Vehicle Inspection Portal
            </small>
          </div>

          <div className="tools">

            <label>
              ⌕

              <input
                value={search}
                onChange={e =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by Lead ID, Registration No, Customer..."
              />
            </label>

            <button>
              <Bell />
            </button>

            <b>
              SS Sundar Singh · Admin
            </b>

          </div>
        </header>

        {active === 'Dashboard' ? (
          <>

            {dbError && (
              <div
                className="panel"
                style={{
                  marginBottom: 16
                }}
              >
                <strong>
                  Database connection error
                </strong>

                <p>{dbError}</p>
              </div>
            )}

            <div className="cards">

              <div className="card">
                <small>Total Cases</small>
                <strong>
                  {loading
                    ? '...'
                    : counts.total}
                </strong>
                <em>
                  Live database count
                </em>
              </div>

              <div className="card">
                <small>Open</small>
                <strong>
                  {loading
                    ? '...'
                    : counts.open}
                </strong>
                <em>
                  Live database count
                </em>
              </div>

              <div className="card">
                <small>Assigned</small>
                <strong>
                  {loading
                    ? '...'
                    : counts.assigned}
                </strong>
                <em>
                  Live database count
                </em>
              </div>

              <div className="card">
                <small>Reassigned</small>
                <strong>
                  {loading
                    ? '...'
                    : counts.reassigned}
                </strong>
                <em>
                  Live database count
                </em>
              </div>

              <button
                type="button"
                className="card"
                onClick={() => {
                  setTpaQcCase(null)
                  setActive('TPA QC')
                }}
                style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid #e2e8f0' }}
                title="Open TPA QC cases"
              >
                <small>TPA QC</small>
                <strong>
                  {loading
                    ? '...'
                    : counts.preQc}
                </strong>
                <em>
                  Click to open TPA QC queue
                </em>
              </button>

              <div className="card">
                <small>QC Hold</small>
                <strong>
                  {loading
                    ? '...'
                    : counts.qcHold}
                </strong>
                <em>
                  Live database count
                </em>
              </div>

            </div>

            <div className="cols">

              <section className="panel">
                <h2>
                  Lead Status Overview
                </h2>

                <p>
                  Current case distribution
                </p>

                <div className="donut">
                  <strong>
                    {loading
                      ? '...'
                      : counts.total}
                  </strong>

                  <small>
                    Total
                  </small>
                </div>
              </section>

              <section className="panel">

                <h2>
                  Today's Activity
                </h2>

                <p>
                  Operational snapshot
                </p>

                <div className="row">
                  <span>
                    Submitted to QC
                  </span>

                  <b>
                    {
                      cases.filter(
                        x =>
                          [
                            'QC',
                            'QC_APPROVED',
                            'PRICING',
                            'COMPLETED',
                            'REPORT_GENERATED'
                          ].includes(
                            String(
                              x.status || ''
                            )
                              .toUpperCase()
                              .replace(
                                /-/g,
                                '_'
                              )
                          )
                      ).length
                    }
                  </b>
                </div>

                <div className="row">
                  <span>
                    QC Approved
                  </span>

                  <b>
                    {
                      cases.filter(
                        x =>
                          String(
                            x.status || ''
                          ).toUpperCase() ===
                          'QC_APPROVED'
                      ).length
                    }
                  </b>
                </div>

                <div className="row">
                  <span>
                    Pricing Pending
                  </span>

                  <b>
                    {
                      cases.filter(
                        x =>
                          String(
                            x.status || ''
                          ).toUpperCase() ===
                          'PRICING'
                      ).length
                    }
                  </b>
                </div>

                <div className="row">
                  <span>
                    Completed
                  </span>

                  <b>
                    {
                      cases.filter(
                        x =>
                          String(
                            x.status || ''
                          ).toUpperCase() ===
                          'COMPLETED'
                      ).length
                    }
                  </b>
                </div>

                <div className="row">
                  <span>
                    TAT Breached
                  </span>

                  <b>0</b>
                </div>

              </section>

              <section className="panel">

                <h2>
                  Quick Actions
                </h2>

                <button
                  className="quick"
                  onClick={() =>
                    setAdd(true)
                  }
                >
                  ＋ Add Lead
                </button>

                <button
                  className="quick"
                  onClick={() =>
                    setActive(
                      'Open Lead'
                    )
                  }
                >
                  □ Open Lead
                </button>

                <button
                  className="quick"
                  onClick={() =>
                    setActive(
                      'Case Search'
                    )
                  }
                >
                  ⌕ Case Search
                </button>

                <button
                  className="quick"
                  onClick={() =>
                    setActive('MIS')
                  }
                >
                  ▥ MIS
                </button>

              </section>

            </div>

            <section className="panel table">

              <h2>
                Recent Leads
              </h2>

              {loading ? (
                <p>
                  Loading cases from Supabase...
                </p>
              ) : recentCases.length === 0 ? (
                <p>
                  No cases found in Supabase.
                  <br />
                  Once a lead is created,
                  it will appear here
                  automatically.
                </p>
              ) : (
                <table>

                  <thead>
                    <tr>
                      <th>Lead ID</th>
                      <th>Customer</th>
                      <th>Vehicle</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>

                    {recentCases.map(
                      item => (
                        <tr
                          key={item.id}
                        >

                          <td>
                            CASE-
                            {item.case_id}
                          </td>

                          <td>
                            {
                              item.customer_name ||
                              '—'
                            }
                          </td>

                          <td>
                            {[
                              item.make,
                              item.model,
                              item.variant
                            ]
                              .filter(Boolean)
                              .join(' ') ||
                              '—'}
                          </td>

                          <td>
                            <span className="status">
                              {
                                displayStatus(
                                  item.status
                                )
                              }
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              item.created_at
                            )}
                          </td>

                          <td>
                            <button
                              onClick={() =>
                                setHist(true)
                              }
                            >
                              <Eye />
                            </button>
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>
              )}

            </section>

          </>
        ) : active === 'TPA Master' ? (

          <section className="panel">

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                gap: 12
              }}
            >
              <div>
                <h2 style={{ marginBottom: 4 }}>TPA Master</h2>
                <p style={{ margin: 0 }}>
                  Manage TPA users available for case assignment.
                </p>
              </div>

              <button
                type="button"
                className="primary"
                onClick={() => {
                  resetTpaForm()
                  setTpaModal(true)
                }}
              >
                ＋ Add TPA
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>TPA Name</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Zone</th>
                    <th>State</th>
                    <th>Client Mapping</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tpas.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: 28 }}>
                        No TPA records found. Click Add TPA to create the first active TPA.
                      </td>
                    </tr>
                  ) : (
                    tpas.map(tpa => (
                      <tr key={tpa.id}>
                        <td><strong>{tpa.name}</strong></td>
                        <td>{tpa.mobile || '—'}</td>
                        <td>{tpa.email || '—'}</td>
                        <td>{tpa.location || '—'}</td>
                        <td>{tpa.zone || '—'}</td>
                        <td>{tpa.state || '—'}</td>
                        <td>{tpa.client_mapping || 'All Clients'}</td>
                        <td>
                          <span className="status">
                            {tpa.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </section>

        ) : active === 'Add Lead' ? (

          <section className="panel empty">

            <Database />

            <h2>Add Lead</h2>

            <p>
              Create a new vehicle inspection case.
            </p>

            <button
              className="primary"
              onClick={() => {
                setEditCase(null)
                setFormError('')
                setFormSuccess('')
                setAdd(true)
              }}
            >
              ＋ Add Lead
            </button>

          </section>

        ) : active === 'Open Lead' ? (

          <section className="panel">

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16
              }}
            >
              <div>
                <h2 style={{ marginBottom: 4 }}>
                  Open Leads
                </h2>
                <p style={{ margin: 0 }}>
                  Live OPEN cases from Supabase
                </p>
              </div>

              <button
                type="button"
                className="primary"
                onClick={loadCases}
                disabled={loading}
              >
                <RefreshCw size={16} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {dbError && (
              <div
                className="panel"
                style={{
                  marginBottom: 16,
                  border: '1px solid #fecaca',
                  background: '#fff1f2'
                }}
              >
                <strong>Database connection error</strong>
                <p>{dbError}</p>
              </div>
            )}

            {loading ? (
              <p>Loading leads from Supabase...</p>
            ) : openLeads.length === 0 ? (
              <div
                style={{
                  padding: 28,
                  textAlign: 'center',
                  border: '1px dashed #cbd5e1',
                  borderRadius: 12
                }}
              >
                <Database size={38} />
                <h3>No Open Leads Found</h3>
                <p>
                  Create a lead from Add Lead and it will
                  appear here automatically.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Lead ID</th>
                      <th>Customer</th>
                      <th>Registration No.</th>
                      <th>Vehicle</th>
                      <th>Loan Number</th>
                      <th>Bank Executive</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {openLeads.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(item => (
                        <tr key={item.id}>
                          <td>
                            <strong>CASE-{item.case_id}</strong>
                          </td>

                          <td>
                            {item.customer_name || '—'}
                            <br />
                            <small>{item.mobile_phone || ''}</small>
                          </td>

                          <td>
                            {item.registration_number || '—'}
                          </td>

                          <td>
                            {[
                              item.make,
                              item.model,
                              item.variant
                            ]
                              .filter(Boolean)
                              .join(' ') || '—'}
                          </td>

                          <td>{item.loan_number || '—'}</td>

                          <td>
                            {item.bank_executive_name || '—'}
                            <br />
                            <small>
                              {item.bank_executive_mobile || ''}
                            </small>
                          </td>

                          <td>
                            <span className="status">
                              {displayStatus(item.status)}
                            </span>
                          </td>

                          <td>{formatDate(item.created_at)}</td>

                          <td>
                            <div
                              style={{
                                display: 'flex',
                                gap: 6,
                                flexWrap: 'wrap'
                              }}
                            >
                              <button
                                type="button"
                                title="Edit Lead"
                                aria-label="Edit Lead"
                                onClick={() => openEditLead(item)}
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                title="History"
                                aria-label="History"
                                onClick={() => {
                                  setSelectedCase(item)
                                  setHist(true)
                                }}
                              >
                                <History size={16} />
                              </button>

                              <button
                                type="button"
                                title="Assign"
                                aria-label="Assign"
                                onClick={() => openAssignCase(item)}
                              >
                                <UserPlus size={16} />
                              </button>

                              <button
                                type="button"
                                title="Add Remarks"
                                aria-label="Add Remarks"
                                onClick={() => openRemarkCase(item)}
                              >
                                <MessageSquare size={16} />
                              </button>

                              <button
                                type="button"
                                title="Reject Lead"
                                aria-label="Reject Lead"
                                onClick={() => openRejectCase(item)}
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

          </section>

        ) : active === 'Assign' ? (

          <section className="panel">

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16
              }}
            >
              <div>
                <h2 style={{ marginBottom: 4 }}>Assign Cases</h2>
                <p style={{ margin: 0 }}>
                  Open cases ready for assignment and cases already assigned to a TPA.
                </p>
              </div>

              <button
                type="button"
                className="primary"
                onClick={loadCases}
                disabled={loading}
              >
                <RefreshCw size={16} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {dbError && (
              <div
                className="panel"
                style={{
                  marginBottom: 16,
                  border: '1px solid #fecaca',
                  background: '#fff1f2'
                }}
              >
                <strong>Database connection error</strong>
                <p>{dbError}</p>
              </div>
            )}

            {loading ? (
              <p>Loading cases from Supabase...</p>
            ) : (
              <>
                <h3 style={{ marginBottom: 10 }}>Ready to Assign</h3>
                {cases.filter(item => String(item.status || '').trim().toUpperCase() === 'OPEN').length === 0 ? (
                  <div
                    style={{
                      padding: 18,
                      marginBottom: 24,
                      textAlign: 'center',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 12
                    }}
                  >
                    No OPEN cases are waiting for assignment.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', marginBottom: 28 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Lead ID</th>
                          <th>Customer / Mobile</th>
                          <th>Bank Executive / Mobile</th>
                          <th>Registration No.</th>
                          <th>Vehicle</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cases
                          .filter(item => String(item.status || '').trim().toUpperCase() === 'OPEN')
                          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                          .map(item => (
                            <tr key={item.id}>
                              <td><strong>CASE-{item.case_id}</strong></td>
                              <td><div className="case-person-cell"><strong>{item.customer_name || '—'}</strong><small>{item.mobile_phone || 'Mobile not available'}</small></div></td>
                              <td><div className="case-person-cell"><strong>{item.bank_executive_name || '—'}</strong><small>{item.bank_executive_mobile || 'Mobile not available'}</small></div></td>
                              <td>{item.registration_number || '—'}</td>
                              <td>{[item.make, item.model, item.variant].filter(Boolean).join(' ') || '—'}</td>
                              <td><span className="status">OPEN</span></td>
                              <td>
                                <button
                                  type="button"
                                  className="primary"
                                  onClick={() => {
                                    setAssignCase(item)
                                    setAssignTpaId('')
                                    setAssignReason('')
                                    setAssignRemarks('')
                                    setActionError('')
                                  }}
                                >
                                  Assign TPA
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <h3 style={{ marginBottom: 10 }}>Assigned Cases</h3>
                {cases.filter(item => {
                  const status = String(item.status || '').trim().toUpperCase()
                  return status === 'ASSIGNED' || status === 'REASSIGNED'
                }).length === 0 ? (
                  <div
                    style={{
                      padding: 18,
                      textAlign: 'center',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 12
                    }}
                  >
                    No assigned cases found.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Lead ID</th>
                          <th>Customer / Mobile</th>
                          <th>Bank Executive / Mobile</th>
                          <th>Registration No.</th>
                          <th>Vehicle</th>
                          <th>Current TPA</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cases
                          .filter(item => {
                            const status = String(item.status || '').trim().toUpperCase()
                            return status === 'ASSIGNED' || status === 'REASSIGNED'
                          })
                          .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                          .map(item => (
                            <tr key={item.id}>
                              <td><strong>CASE-{item.case_id}</strong></td>
                              <td><div className="case-person-cell"><strong>{item.customer_name || '—'}</strong><small>{item.mobile_phone || 'Mobile not available'}</small></div></td>
                              <td><div className="case-person-cell"><strong>{item.bank_executive_name || '—'}</strong><small>{item.bank_executive_mobile || 'Mobile not available'}</small></div></td>
                              <td>{item.registration_number || '—'}</td>
                              <td>{[item.make, item.model, item.variant].filter(Boolean).join(' ') || '—'}</td>
                              <td>{item.assigned_tpa_name || '—'}</td>
                              <td><span className="status">{displayStatus(item.status)}</span></td>
                              <td>{formatDate(item.created_at)}</td>
                              <td>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  <button type="button" className="icon-button" title="Reassign" aria-label="Reassign" onClick={() => openReassignCase(item)}>
                                    <RefreshCw size={15} />
                                  </button>
                                  <button type="button" className="icon-button" title="Remarks" aria-label="Remarks" onClick={() => openRemarkCase(item)}>
                                    <MessageSquare size={15} />
                                  </button>
                                  <button type="button" className="icon-button" title="History" aria-label="History" onClick={() => openHistory(item)}>
                                    <History size={15} />
                                  </button>
                                  <button type="button" className="icon-button" title="Reject" aria-label="Reject" onClick={() => openRejectCase(item)}>
                                    <X size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

          </section>

        ) : active === 'Reassign' ? (

          <section className="panel">

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16
              }}
            >
              <div>
                <h2 style={{ marginBottom: 4 }}>Reassign Cases</h2>
                <p style={{ margin: 0 }}>
                  Manage cases already assigned to a TPA. Use the same actions available on Assign.
                </p>
              </div>

              <button
                type="button"
                className="primary"
                onClick={loadCases}
                disabled={loading}
              >
                <RefreshCw size={16} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {dbError && (
              <div
                className="panel"
                style={{
                  marginBottom: 16,
                  border: '1px solid #fecaca',
                  background: '#fff1f2'
                }}
              >
                <strong>Database connection error</strong>
                <p>{dbError}</p>
              </div>
            )}

            {loading ? (
              <p>Loading assigned cases from Supabase...</p>
            ) : (
              <>
                <h3 style={{ marginBottom: 10 }}>Assigned / Reassigned Cases</h3>

                {cases.filter(item => {
                  const status = String(item.status || '').trim().toUpperCase()
                  return status === 'ASSIGNED' || status === 'REASSIGNED'
                }).length === 0 ? (
                  <div
                    style={{
                      padding: 24,
                      textAlign: 'center',
                      border: '1px dashed #cbd5e1',
                      borderRadius: 12
                    }}
                  >
                    <Database size={34} />
                    <h3>No Assigned Cases Found</h3>
                    <p>Assign an OPEN case first. It will appear here immediately.</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Lead ID</th>
                          <th>Customer</th>
                          <th>Registration No.</th>
                          <th>Vehicle</th>
                          <th>Current TPA</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cases
                          .filter(item => {
                            const status = String(item.status || '').trim().toUpperCase()
                            return status === 'ASSIGNED' || status === 'REASSIGNED'
                          })
                          .map(item => (
                            <tr key={item.id}>
                              <td><strong>CASE-{item.case_id}</strong></td>
                              <td>{item.customer_name || '—'}</td>
                              <td>{item.registration_number || '—'}</td>
                              <td>{[item.make, item.model, item.variant].filter(Boolean).join(' ') || '—'}</td>
                              <td>{item.assigned_tpa_name || '—'}</td>
                              <td><span className="status">{displayStatus(item.status)}</span></td>
                              <td>{formatDate(item.created_at)}</td>
                              <td>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    className="icon-button"
                                    title="Reassign"
                                    aria-label="Reassign"
                                    onClick={() => openReassignCase(item)}
                                  >
                                    <RefreshCw size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-button"
                                    title="Move to TPA QC"
                                    aria-label="Move to TPA QC"
                                    onClick={() => moveCaseToTpaQc(item)}
                                    disabled={actionSaving}
                                  >
                                    <CheckCircle2 size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-button"
                                    title="Remarks"
                                    aria-label="Remarks"
                                    onClick={() => openRemarkCase(item)}
                                  >
                                    <MessageSquare size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-button"
                                    title="History"
                                    aria-label="History"
                                    onClick={() => openHistory(item)}
                                  >
                                    <History size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-button"
                                    title="Reject"
                                    aria-label="Reject"
                                    onClick={() => openRejectCase(item)}
                                  >
                                    <X size={15} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

          </section>

        ) : active === 'TPA QC' ? (
          <TpaQcReport mode="TPA QC" caseItem={tpaQcCase} cases={cases} clients={clients} locations={locations} form={tpaQcForm} updateField={updateTpaQcField} setForm={setTpaQcForm} saving={tpaQcSaving || reportAutosaving} message={tpaQcMessage} onOpenCase={openTpaQcCase} onSave={() => saveTpaQcDraft(false)} onSubmit={() => saveTpaQcDraft(true)} onRemarks={() => tpaQcCase && openRemarkCase(tpaQcCase)} onReject={() => tpaQcCase && openRejectCase(tpaQcCase)} onHistory={() => tpaQcCase && openHistory(tpaQcCase)} onHold={() => {}} />
        ) : active === 'QC' ? (
          <TpaQcReport mode="QC" caseItem={tpaQcCase} cases={cases} clients={clients} locations={locations} form={tpaQcForm} updateField={updateTpaQcField} setForm={setTpaQcForm} saving={actionSaving || reportAutosaving} message={actionError || tpaQcMessage} onOpenCase={openQcCase} onSave={() => tpaQcCase && queueMasterInspectionReportSave(tpaQcCase, tpaQcForm, 'QC', true)} onSubmit={() => tpaQcCase && qcApproveCase(tpaQcCase)} onRemarks={() => tpaQcCase && openRemarkCase(tpaQcCase)} onReject={() => tpaQcCase && openRejectCase(tpaQcCase)} onHistory={() => tpaQcCase && openHistory(tpaQcCase)} onHold={() => tpaQcCase && qcHoldCase(tpaQcCase)} />
        ) : active === 'QC Hold' ? (
          <TpaQcReport mode="QC Hold" caseItem={tpaQcCase} cases={cases} clients={clients} locations={locations} form={tpaQcForm} updateField={updateTpaQcField} setForm={setTpaQcForm} saving={actionSaving || reportAutosaving} message={actionError || tpaQcMessage} onOpenCase={item => openReportCase(item, 'QC Hold')} onSave={() => tpaQcCase && queueMasterInspectionReportSave(tpaQcCase, tpaQcForm, 'QC Hold', true)} onSubmit={() => tpaQcCase && moveQcHoldBackToQc(tpaQcCase)} onRemarks={() => tpaQcCase && openRemarkCase(tpaQcCase)} onReject={() => tpaQcCase && openRejectCase(tpaQcCase)} onHistory={() => tpaQcCase && openHistory(tpaQcCase)} onHold={() => {}} />
        ) : active === 'Pricing' ? (
          <TpaQcReport mode="Pricing" caseItem={tpaQcCase} cases={cases} clients={clients} locations={locations} form={tpaQcForm} updateField={updateTpaQcField} setForm={setTpaQcForm} saving={actionSaving || reportAutosaving} message={actionError || tpaQcMessage} onOpenCase={item => openReportCase(item, 'Pricing')} onSave={() => tpaQcCase && queueMasterInspectionReportSave(tpaQcCase, tpaQcForm, 'Pricing', true)} onSubmit={(meta) => tpaQcCase && pricingFinalSubmit(tpaQcCase, meta)} onRemarks={() => tpaQcCase && openRemarkCase(tpaQcCase)} onReject={() => tpaQcCase && openRejectCase(tpaQcCase)} onHistory={() => tpaQcCase && openHistory(tpaQcCase)} onHold={() => {}} />
        ) : active === 'Report Generated' ? (
          <TpaQcReport mode="Report Generated" caseItem={tpaQcCase} cases={cases} clients={clients} locations={locations} form={tpaQcForm} updateField={updateTpaQcField} setForm={setTpaQcForm} saving={actionSaving || reportAutosaving} message={actionError || tpaQcMessage} onOpenCase={item => openReportCase(item, 'Report Generated')} onSave={(valueOverride) => tpaQcCase && queueMasterInspectionReportSave(tpaQcCase, valueOverride || tpaQcForm, 'Report Generated', true)} onSubmit={() => {}} onRemarks={item => openRemarkCase(item || tpaQcCase)} onReject={item => openRejectCase(item || tpaQcCase)} onHistory={item => openHistory(item || tpaQcCase)} onHold={() => {}} />
        ) : (

          <OperationalModule active={active} cases={cases} locations={locations} tpas={tpas} clients={clients} onRefresh={loadCases} />

        )}

        {add && (

          <Modal
            title={editCase ? 'Edit Lead' : 'Add Lead'}
            close={closeLeadForm}
          >

            <form
              className="form"
              onSubmit={editCase ? updateLead : saveLead}
            >

              {formError && (
                <div
                  className="panel"
                  style={{
                    marginBottom: 12,
                    border:
                      '1px solid #fecaca',
                    background:
                      '#fff1f2'
                  }}
                >
                  <strong>
                    Unable to create lead
                  </strong>

                  <p>
                    {formError}
                  </p>
                </div>
              )}

              {formSuccess && (
                <div
                  className="panel"
                  style={{
                    marginBottom: 12,
                    border:
                      '1px solid #bbf7d0',
                    background:
                      '#f0fdf4'
                  }}
                >
                  <strong>
                    Lead created
                    successfully
                  </strong>

                  <p>
                    {formSuccess}
                  </p>
                </div>
              )}

              <div className="form-grid">

                <Field
                  label="Case ID"
                  value={
                    editCase
                      ? `CASE-${editCase.case_id}`
                      : 'Auto-generated'
                  }
                  disabled
                />

                <Field
                  label="Loan Number"
                  value={
                    form.loan_number
                  }
                  onChange={value =>
                    updateForm(
                      'loan_number',
                      value
                    )
                  }
                  placeholder="Enter loan number"
                />

                <Field
                  label="Bank Executive Name"
                  value={
                    form.bank_executive_name
                  }
                  onChange={value =>
                    updateForm(
                      'bank_executive_name',
                      value
                    )
                  }
                  placeholder="Enter bank executive name"
                  required
                />

                <Field
                  label="Bank Executive Mobile Number"
                  value={
                    form.bank_executive_mobile
                  }
                  onChange={value =>
                    updateForm(
                      'bank_executive_mobile',
                      value.replace(
                        /\D/g,
                        ''
                      ).slice(0, 10)
                    )
                  }
                  placeholder="10 digit mobile number"
                  required
                />

                <Field
                  label="Customer Name"
                  value={
                    form.customer_name
                  }
                  onChange={value =>
                    updateForm(
                      'customer_name',
                      value
                    )
                  }
                  placeholder="Enter customer name"
                  required
                />

                <Field
                  label="Mobile Number"
                  value={
                    form.mobile_phone
                  }
                  onChange={value =>
                    updateForm(
                      'mobile_phone',
                      value.replace(
                        /\D/g,
                        ''
                      ).slice(0, 10)
                    )
                  }
                  placeholder="10 digit mobile number"
                  required
                />

                <Field
                  label="Registration Number"
                  value={
                    form.registration_number
                  }
                  onChange={value =>
                    updateForm(
                      'registration_number',
                      value
                    )
                  }
                  placeholder="e.g. DL01AB1234"
                  required
                />

                <SelectField
                  label="Client"
                  value={
                    form.client_id
                  }
                  onChange={value =>
                    updateForm(
                      'client_id',
                      value
                    )
                  }
                  required
                >
                  <option value="">
                    Select Client
                  </option>

                  {clients.map(
                    client => (
                      <option
                        key={
                          client.id
                        }
                        value={
                          client.id
                        }
                      >
                        {clientDisplayName(
                          client
                        )}
                      </option>
                    )
                  )}
                </SelectField>

                <SelectField
                  label="Segment"
                  value={
                    form.segment
                  }
                  onChange={
                    handleSegmentChange
                  }
                  required
                >
                  <option value="">
                    Select Segment
                  </option>

                  {segments.map(
                    value => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    )
                  )}
                </SelectField>

                <SelectField
                  label="Make"
                  value={
                    form.make
                  }
                  onChange={
                    handleMakeChange
                  }
                  disabled={
                    !form.segment
                  }
                  required
                >
                  <option value="">
                    Select Make
                  </option>

                  {makes.map(
                    value => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    )
                  )}
                </SelectField>

                <SelectField
                  label="Model"
                  value={
                    form.model
                  }
                  onChange={
                    handleModelChange
                  }
                  disabled={
                    !form.make
                  }
                  required
                >
                  <option value="">
                    Select Model
                  </option>

                  {models.map(
                    value => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    )
                  )}
                </SelectField>

                <SelectField
                  label="Variant"
                  value={
                    form.variant
                  }
                  onChange={value =>
                    updateForm(
                      'variant',
                      value
                    )
                  }
                  disabled={
                    !form.model
                  }
                  required
                >
                  <option value="">
                    Select Variant
                  </option>

                  {variants.map(
                    value => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    )
                  )}
                </SelectField>

                <SelectField
                  label="Manufacturing Year"
                  value={
                    form.mfg_year
                  }
                  onChange={value =>
                    updateForm(
                      'mfg_year',
                      value
                    )
                  }
                  required
                >
                  <option value="">
                    Select Year
                  </option>

                  {years.map(
                    value => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    )
                  )}
                </SelectField>

                <SelectField
                  label="Zone"
                  value={
                    form.zone
                  }
                  onChange={
                    handleZoneChange
                  }
                  required
                >
                  <option value="">
                    Select Zone
                  </option>

                  {zones.map(
                    value => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    )
                  )}
                </SelectField>

                <SelectField
                  label="State"
                  value={
                    form.state
                  }
                  onChange={
                    handleStateChange
                  }
                  disabled={
                    !form.zone
                  }
                  required
                >
                  <option value="">
                    Select State
                  </option>

                  {states.map(
                    value => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    )
                  )}
                </SelectField>

                <SelectField
                  label="City"
                  value={
                    form.city
                  }
                  onChange={value =>
                    updateForm(
                      'city',
                      value
                    )
                  }
                  disabled={
                    !form.state
                  }
                  required
                >
                  <option value="">
                    Select City
                  </option>

                  {cities.map(
                    value => (
                      <option
                        key={value}
                        value={value}
                      >
                        {value}
                      </option>
                    )
                  )}
                </SelectField>

              </div>

              {masterLoading && (
                <p
                  style={{
                    marginTop: 12
                  }}
                >
                  Loading Client, MMV and
                  Location masters...
                </p>
              )}

              {!masterLoading &&
                clients.length === 0 && (
                  <p
                    style={{
                      marginTop: 12
                    }}
                  >
                    Client Master has no
                    records. Please add
                    clients in Client Master
                    before creating a lead.
                  </p>
                )}

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  marginTop: 18
                }}
              >

                <button
                  type="button"
                  className="primary"
                  style={{
                    background:
                      '#64748b'
                  }}
                  onClick={closeLeadForm}
                  disabled={savingLead}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary"
                  disabled={savingLead}
                >
                  {savingLead
                    ? (editCase ? 'Updating Lead...' : 'Saving Lead...')
                    : (editCase ? 'Update Lead' : 'Create Lead')}
                </button>

              </div>

            </form>

          </Modal>
        )}

        {assignCase && (
          <Modal
            title={`Assign Case — CASE-${assignCase.case_id}`}
            close={() => {
              if (!actionSaving) {
                setAssignCase(null)
                setActionError('')
              }
            }}
          >
            <div className="panel" style={{ marginBottom: 12 }}>
              <strong>Assign OPEN Case</strong>
              <p style={{ marginBottom: 0 }}>
                Select an active TPA. The case will move to ASSIGNED immediately after confirmation.
              </p>
            </div>

            {actionError && (
              <div
                className="panel"
                style={{
                  marginBottom: 12,
                  border: '1px solid #fecaca',
                  background: '#fff1f2'
                }}
              >
                <strong>Unable to assign case</strong>
                <p>{actionError}</p>
              </div>
            )}

            <div className="form-grid">
              <Field label="Case ID" value={`CASE-${assignCase.case_id}`} disabled />
              <Field label="Customer" value={assignCase.customer_name || ''} disabled />
              <Field label="Registration Number" value={assignCase.registration_number || ''} disabled />
              <Field label="Current Status" value={displayStatus(assignCase.status)} disabled />

              <label className="field">
                <span>Active TPA <b style={{ color: '#dc2626' }}>*</b></span>
                <select
                  value={assignTpaId}
                  onChange={e => setAssignTpaId(e.target.value)}
                  required
                >
                  <option value="">Select TPA</option>
                  {tpas.map(tpa => (
                    <option key={tpa.id} value={tpa.id}>
                      {tpa.name} — {tpa.mobile || 'No mobile'}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Reason</span>
                <input
                  value={assignReason}
                  onChange={e => setAssignReason(e.target.value)}
                  placeholder="Assignment reason"
                />
              </label>

              <label className="field" style={{ width: '100%' }}>
                <span>Remarks</span>
                <textarea
                  value={assignRemarks}
                  onChange={e => setAssignRemarks(e.target.value)}
                  placeholder="Assignment remarks"
                  rows={3}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    padding: 10,
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontFamily: 'inherit'
                  }}
                />
              </label>
            </div>

            {tpas.length === 0 && (
              <div
                className="panel"
                style={{
                  marginTop: 12,
                  border: '1px solid #fed7aa',
                  background: '#fff7ed'
                }}
              >
                <strong>No active TPA available.</strong>
                <p>
                  Add an active TPA in TPA Master before assigning this case.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="primary"
                style={{ background: '#64748b' }}
                onClick={() => setAssignCase(null)}
                disabled={actionSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={assignCaseToTpa}
                disabled={actionSaving}
              >
                <UserPlus size={16} /> Assign TPA
              </button>
            </div>
          </Modal>
        )}

        {reassignCase && (
          <Modal
            title={`Reassign Case — CASE-${reassignCase.case_id}`}
            close={() => {
              if (!actionSaving) {
                setReassignCase(null)
                setReassignTpaId('')
                setReassignReason('')
                setReassignRemarks('')
                setActionError('')
              }
            }}
          >
            {actionError && (
              <div className="panel" style={{ marginBottom: 12, border: '1px solid #fecaca', background: '#fff1f2' }}>
                <strong>Unable to reassign case</strong>
                <p>{actionError}</p>
              </div>
            )}

            <div className="panel" style={{ marginBottom: 12 }}>
              <strong>Reassign Assigned Case</strong>
              <p style={{ marginBottom: 0 }}>Select a different active TPA. The old TPA will lose the current assignment immediately.</p>
            </div>

            <div className="form-grid">
              <Field label="Case ID" value={`CASE-${reassignCase.case_id}`} disabled />
              <Field label="Customer" value={reassignCase.customer_name || ''} disabled />
              <Field label="Registration Number" value={reassignCase.registration_number || ''} disabled />
              <Field label="Current TPA" value={reassignCase.assigned_tpa_name || '—'} disabled />

              <label className="field">
                <span>New TPA <b style={{ color: '#dc2626' }}>*</b></span>
                <select value={reassignTpaId} onChange={e => setReassignTpaId(e.target.value)} required>
                  <option value="">Select New TPA</option>
                  {tpas.map(tpa => (
                    <option key={tpa.id} value={tpa.id}>
                      {tpa.name} — {tpa.mobile || 'No mobile'}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span>Reason <b style={{ color: '#dc2626' }}>*</b></span>
                <input value={reassignReason} onChange={e => setReassignReason(e.target.value)} placeholder="Reassignment reason" />
              </label>

              <label className="field" style={{ width: '100%' }}>
                <span>Remarks</span>
                <textarea value={reassignRemarks} onChange={e => setReassignRemarks(e.target.value)} placeholder="Reassignment remarks" rows={4} style={{ width: '100%', resize: 'vertical', padding: 10, border: '1px solid #cbd5e1', borderRadius: 8, fontFamily: 'inherit' }} />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button type="button" className="primary" style={{ background: '#64748b' }} onClick={() => setReassignCase(null)} disabled={actionSaving}>Cancel</button>
              <button type="button" className="primary" onClick={reassignCaseToTpa} disabled={actionSaving}>
                {actionSaving ? 'Reassigning...' : 'Confirm Reassign'}
              </button>
            </div>
          </Modal>
        )}

        {rejectCase && (
          <Modal
            title={`Reject Lead — CASE-${rejectCase.case_id}`}
            close={() => {
              if (!actionSaving) {
                setRejectCase(null)
                setRejectReason('')
                setRejectRemarks('')
                setActionError('')
              }
            }}
          >
            {actionError && (
              <div
                className="panel"
                style={{
                  marginBottom: 12,
                  border: '1px solid #fecaca',
                  background: '#fff1f2'
                }}
              >
                <strong>Unable to reject case</strong>
                <p>{actionError}</p>
              </div>
            )}

            <div
              className="panel"
              style={{
                marginBottom: 12,
                border: '1px solid #fecaca',
                background: '#fff7f7'
              }}
            >
              <strong>Rejecting this case</strong>
              <p style={{ marginBottom: 0 }}>
                The case will move from its current stage to REJECTED and the rejection
                reason will be stored in the audit trail.
              </p>
            </div>

            <div className="form-grid">
              <Field
                label="Case ID"
                value={`CASE-${rejectCase.case_id}`}
                disabled
              />

              <Field
                label="Customer"
                value={rejectCase.customer_name || ''}
                disabled
              />

              <label className="field" style={{ width: '100%' }}>
                <span>
                  Reject Reason <b style={{ color: '#dc2626' }}>*</b>
                </span>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Enter mandatory rejection reason"
                  rows={4}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    padding: 10,
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontFamily: 'inherit'
                  }}
                />
              </label>

              <label className="field" style={{ width: '100%' }}>
                <span>Additional Remarks</span>
                <textarea
                  value={rejectRemarks}
                  onChange={e => setRejectRemarks(e.target.value)}
                  placeholder="Enter additional remarks (optional)"
                  rows={4}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    padding: 10,
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    fontFamily: 'inherit'
                  }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="primary"
                style={{ background: '#64748b' }}
                onClick={() => setRejectCase(null)}
                disabled={actionSaving}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary"
                style={{ background: '#dc2626' }}
                onClick={rejectAssignedCase}
                disabled={actionSaving}
              >
                {actionSaving ? 'Rejecting...' : 'Reject Case'}
              </button>
            </div>
          </Modal>
        )}

        {remarkCase && (
          <Modal
            title={`Add Remarks — CASE-${remarkCase.case_id}`}
            close={() => {
              if (!actionSaving) {
                setRemarkCase(null)
                setRemarkText('')
                setActionError('')
              }
            }}
          >
            {actionError && (
              <div
                className="panel"
                style={{
                  marginBottom: 12,
                  border: '1px solid #fecaca',
                  background: '#fff1f2'
                }}
              >
                <strong>Unable to save remarks</strong>
                <p>{actionError}</p>
              </div>
            )}

            <label className="field" style={{ width: '100%' }}>
              <span>Remarks <b style={{ color: '#dc2626' }}>*</b></span>
              <textarea
                value={remarkText}
                onChange={e => setRemarkText(e.target.value)}
                placeholder="Enter remarks"
                rows={6}
                style={{
                  width: '100%',
                  resize: 'vertical',
                  padding: 10,
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontFamily: 'inherit'
                }}
              />
            </label>

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button
                type="button"
                className="primary"
                style={{ background: '#64748b' }}
                onClick={() => setRemarkCase(null)}
                disabled={actionSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary"
                onClick={saveRemark}
                disabled={actionSaving}
              >
                {actionSaving ? 'Saving...' : 'Save Remarks'}
              </button>
            </div>
          </Modal>
        )}

        {hist && (

          <Modal
            title={
              selectedCase
                ? `Case Details — CASE-${selectedCase.case_id}`
                : 'Case History'
            }
            close={() => {
              setHist(false)
              setSelectedCase(null)
            }}
          >

            <div className="history">

              {selectedCase ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(2, minmax(0, 1fr))',
                      gap: 12,
                      marginBottom: 16
                    }}
                  >
                    <div>
                      <small>Customer</small>
                      <strong>
                        {selectedCase.customer_name || '—'}
                      </strong>
                    </div>

                    <div>
                      <small>Registration Number</small>
                      <strong>
                        {selectedCase.registration_number || '—'}
                      </strong>
                    </div>

                    <div>
                      <small>Vehicle</small>
                      <strong>
                        {[
                          selectedCase.make,
                          selectedCase.model,
                          selectedCase.variant
                        ]
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </strong>
                    </div>

                    <div>
                      <small>Status</small>
                      <strong>
                        {displayStatus(selectedCase.status)}
                      </strong>
                    </div>

                    <div>
                      <small>Loan Number</small>
                      <strong>
                        {selectedCase.loan_number || '—'}
                      </strong>
                    </div>

                    <div>
                      <small>Created</small>
                      <strong>
                        {formatDate(selectedCase.created_at)}
                      </strong>
                    </div>
                  </div>

                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ marginBottom: 10 }}>History / Audit Trail</h3>
                    {historyLoading ? (
                      <p>Loading case history...</p>
                    ) : historyError ? (
                      <div className="panel" style={{ border: '1px solid #fecaca', background: '#fff1f2' }}>
                        <strong>Unable to load history</strong>
                        <p>{historyError}</p>
                      </div>
                    ) : historyEvents.length === 0 ? (
                      <p>No history records found for this case.</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table>
                          <thead>
                            <tr>
                              <th>Date/Time</th>
                              <th>Source</th>
                              <th>Action</th>
                              <th>Stage</th>
                              <th>Old Status</th>
                              <th>New Status</th>
                              <th>User</th>
                              <th>Reason</th>
                              <th>Remarks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historyEvents.map(event => (
                              <tr key={event.id}>
                                <td>{formatDate(event.createdAt)}</td>
                                <td>{event.source}</td>
                                <td><strong>{event.action}</strong></td>
                                <td>{event.stage}</td>
                                <td>{event.oldStatus}</td>
                                <td>{event.newStatus}</td>
                                <td>{event.userName} ({event.role})</td>
                                <td>{event.reason}</td>
                                <td>{event.remarks}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p>No case selected.</p>
              )}

            </div>

          </Modal>

        )}



      </main>
    </div>
  )
}

function TpaQcReport({ mode = 'TPA QC', caseItem, cases = [], clients = [], locations = [], form, updateField, setForm, saving, message, onOpenCase, onSave, onSubmit, onRemarks, onReject, onHistory, onHold }) {
  const reportRef = useRef(null)
  const [photoViewer, setPhotoViewer] = useState(null)
  const [photoZoom, setPhotoZoom] = useState(1)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfMessage, setPdfMessage] = useState('')
  const [reportEditMode, setReportEditMode] = useState(mode !== 'Report Generated')
  const [reportLinks, setReportLinks] = useState({})
  const [listPage, setListPage] = useState(1)
  const pageSize = 25

  useEffect(() => {
    if (caseItem || mode !== 'Report Generated' || !cases.length) return
    let cancelled = false
    const caseIds = cases
      .filter(item => ['COMPLETED', 'REPORT_GENERATED'].includes(String(item.status || '').trim().toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_')))
      .map(item => item.case_id)
      .filter(Boolean)
    if (!caseIds.length) { setReportLinks({}); return }
    supabase.from('inspection_reports').select('case_id, report_data').in('case_id', caseIds)
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { console.warn('Unable to load generated PDF links:', error.message); return }
        const next = {}
        ;(data || []).forEach(row => {
          const report = row.report_data || {}
          if (row.case_id && report.pdf_url) next[String(row.case_id)] = report.pdf_url
        })
        setReportLinks(next)
      })
      .catch(error => { if (!cancelled) console.warn('Unable to load generated PDF links:', error) })
    return () => { cancelled = true }
  }, [caseItem, mode, cases])

  if (!caseItem) {
    const normalize = value => String(value || '').trim().toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_')
    const statusMap = { 'TPA QC': 'PRE_QC', 'QC': 'QC', 'QC Hold': 'QC_HOLD', 'Pricing': 'PRICING', 'Report Generated': 'COMPLETED' }
    const tpaQcCases = cases.filter(item => {
      const status = normalize(item.status)
      return mode === 'Report Generated'
        ? ['COMPLETED', 'REPORT_GENERATED'].includes(status)
        : status === (statusMap[mode] || 'PRE_QC')
    })

    return (
      <section className="panel" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>{mode}</h2>
            <p style={{ margin: '5px 0 0', color: '#64748b' }}>Open the same master inspection report. Data saved in the previous stage remains available.</p>
          </div>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: '#E0F2F1', color: '#0f766e', fontWeight: 700, fontSize: 12 }}>
            {tpaQcCases.length} {mode === 'Report Generated' ? 'Generated' : 'Pending'}
          </span>
        </div>

        {tpaQcCases.length === 0 ? (
          <div className="panel empty" style={{ marginTop: 10 }}>
            <Database />
            <h3>No {mode} cases</h3>
            <p>{mode === 'Report Generated' ? 'Completed reports will appear here after Pricing final submission.' : 'Move a case to this stage using the permitted workflow action.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Lead ID','Customer','Registration No.','Vehicle','Current TPA','Status','Action'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 8px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tpaQcCases.slice((listPage - 1) * pageSize, listPage * pageSize).map(item => (
                  <tr key={item.id}>
                    <td style={{ padding: '11px 8px', fontWeight: 700 }}>CASE-{item.case_id}</td>
                    <td style={{ padding: '11px 8px' }}>{item.customer_name || '—'}</td>
                    <td style={{ padding: '11px 8px' }}>{item.registration_number || '—'}</td>
                    <td style={{ padding: '11px 8px' }}>{[item.make, item.model, item.variant].filter(Boolean).join(' ') || '—'}</td>
                    <td style={{ padding: '11px 8px' }}>{item.assigned_tpa_name || '—'}</td>
                    <td style={{ padding: '11px 8px' }}><span style={{ padding: '4px 8px', borderRadius: 999, background: mode === 'Report Generated' ? '#DCFCE7' : '#E0F2F1', color: mode === 'Report Generated' ? '#166534' : '#0f766e', fontSize: 11, fontWeight: 700 }}>{mode === 'Report Generated' ? 'REPORT GENERATED' : mode}</span></td>
                    <td style={{ padding: '11px 8px', minWidth: mode === 'Report Generated' ? 440 : 150 }}>
                      {mode === 'Report Generated' ? (
                        <div className="report-row-actions">
                          <button type="button" className="primary report-action" onClick={() => onOpenCase(item)} title="Edit / Open Report" aria-label="Edit / Open Report"><Pencil size={16}/></button>
                          <button type="button" className="report-action" onClick={() => onOpenCase(item)} title="Regenerate PDF" aria-label="Regenerate PDF"><RefreshCw size={16}/></button>
                          {reportLinks[String(item.case_id)] ? (
                            <>
                              <a className="report-action download" href={reportLinks[String(item.case_id)]} download={`CarDekho_${item.case_id}_Inspection_Report.pdf`} title="Download PDF" aria-label="Download PDF"><Download size={16}/></a>
                              <a className="report-action open" href={reportLinks[String(item.case_id)]} target="_blank" rel="noreferrer" title="Open PDF" aria-label="Open PDF"><ExternalLink size={16}/></a>
                              <button type="button" className="report-action" onClick={async () => { const url = reportLinks[String(item.case_id)]; try { await navigator.clipboard.writeText(url); window.alert('Report URL copied.') } catch { window.prompt('Copy report URL:', url) } }} title="Copy Report URL" aria-label="Copy Report URL"><Copy size={16}/></button>
                            </>
                          ) : (
                            <button type="button" className="report-action" onClick={() => onOpenCase(item)} title="Generate PDF" aria-label="Generate PDF"><FileDown size={16}/></button>
                          )}
                          <button type="button" className="report-action" onClick={() => onRemarks?.(item)} title="Remarks" aria-label="Remarks"><MessageSquare size={16}/></button>
                          <button type="button" className="report-action danger" onClick={() => onReject?.(item)} title="Reject" aria-label="Reject"><Ban size={16}/></button>
                          <button type="button" className="report-action" onClick={() => onHistory?.(item)} title="History" aria-label="History"><History size={16}/></button>
                        </div>
                      ) : (
                        <button type="button" className="primary" onClick={() => onOpenCase(item)}>Open {mode}</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="case-pagination">
              <span>Showing {tpaQcCases.length ? ((listPage - 1) * pageSize + 1) : 0}–{Math.min(listPage * pageSize, tpaQcCases.length)} of {tpaQcCases.length} cases</span>
              <div className="page-controls">
                <button type="button" disabled={listPage <= 1} onClick={() => setListPage(p => Math.max(1, p - 1))}>Previous</button>
                <span>Page {listPage} of {Math.max(1, Math.ceil(tpaQcCases.length / pageSize))}</span>
                <button type="button" disabled={listPage >= Math.ceil(tpaQcCases.length / pageSize)} onClick={() => setListPage(p => Math.min(Math.ceil(tpaQcCases.length / pageSize), p + 1))}>Next</button>
              </div>
            </div>
          </div>
        )}
      </section>
    )
  }

  const dateValue = value => {
    const text = String(value || '').trim()
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : ''
  }

  const loadExternalScript = (src, timeoutMs = 20000) => new Promise((resolve, reject) => {
    const key = src.replace(/[^a-z0-9]/gi, '_')
    const existing = document.querySelector(`script[data-cd-pdf=\"${key}\"]`)
    if (existing?.dataset.loaded === 'true') return resolve()

    const finish = (error) => {
      clearTimeout(timer)
      if (error) reject(error)
      else resolve()
    }

    const timer = setTimeout(() => finish(new Error(`PDF library load timed out: ${src}`)), timeoutMs)

    if (existing) {
      existing.addEventListener('load', () => { existing.dataset.loaded = 'true'; finish() }, { once: true })
      existing.addEventListener('error', () => finish(new Error(`Unable to load ${src}`)), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.cdPdf = key
    script.onload = () => { script.dataset.loaded = 'true'; finish() }
    script.onerror = () => finish(new Error(`Unable to load ${src}`))
    document.head.appendChild(script)
  })

  const compressImageDataUrl = (dataUrl, maxWidth = 1000, maxHeight = 750, quality = 0.62) => new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const ratio = Math.min(1, maxWidth / img.naturalWidth, maxHeight / img.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(img.naturalWidth * ratio))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * ratio))
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })

  const generateInspectionPdf = async () => {
    if (!reportRef.current) throw new Error('Report is not ready for PDF generation.')
    setPdfGenerating(true)
    setPdfMessage('Preparing complete report and photos...')
    let printHost = null
    try {
      const html2canvasUrls = [
        'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
      ]
      const jspdfUrls = [
        'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
      ]
      let loaded = false
      let lastError = null
      for (const url of html2canvasUrls) {
        try { await loadExternalScript(url); loaded = true; break } catch (e) { lastError = e }
      }
      if (!loaded) throw new Error(`Unable to load image renderer. ${lastError?.message || ''}`)
      loaded = false
      for (const url of jspdfUrls) {
        try { await loadExternalScript(url); loaded = true; break } catch (e) { lastError = e }
      }
      if (!loaded) throw new Error(`Unable to load PDF engine. ${lastError?.message || ''}`)
      const JsPdf = window.jspdf?.jsPDF
      if (!JsPdf || !window.html2canvas) throw new Error('PDF libraries are unavailable.')

      // Package every uploaded inspection photo into a downloadable ZIP. The ZIP is
      // stored beside the PDF so the link remains usable after the report is shared.
      let photoZipUrl = ''
      const photoPublicUrls = {}
      const photoEntries = Object.entries(form.media || {}).filter(([, item]) => {
        if (typeof item === 'string') return Boolean(item)
        return Boolean(item?.dataUrl || item?.url || item?.publicUrl)
      })
      if (photoEntries.length) {
        setPdfMessage('Preparing downloadable ZIP of inspection photos...')
        const zipUrls = [
          'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js'
        ]
        let zipLoaded = false
        let zipLoadError = null
        for (const url of zipUrls) {
          try { await loadExternalScript(url); if (window.JSZip) { zipLoaded = true; break } } catch (e) { zipLoadError = e }
        }
        if (!zipLoaded || !window.JSZip) throw new Error(`Unable to load ZIP tool for photo download. ${zipLoadError?.message || ''}`)
        const zip = new window.JSZip()
        const safeFileName = value => String(value || 'inspection-photo').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_')
        let packed = 0
        for (const [label, item] of photoEntries) {
          const src = typeof item === 'string' ? item : (item.dataUrl || item.url || item.publicUrl)
          try {
            const response = await fetch(src)
            if (!response.ok) throw new Error(`HTTP ${response.status}`)
            const blob = await response.blob()
            const originalName = typeof item === 'object' ? item.name : ''
            const ext = (originalName && /\.[a-z0-9]{2,5}$/i.test(originalName)) ? originalName.split('.').pop() : (blob.type?.split('/')[1] || 'jpg')

            // Keep every image in the downloadable ZIP, as before.
            zip.file(`${String(packed + 1).padStart(2, '0')}_${safeFileName(label)}.${safeFileName(ext)}`, blob)
            packed += 1

            // Also store an individual copy so the PDF's View annotation can use a real HTTPS URL.
            try {
              const safeLabel = safeFileName(label)
              const imagePath = `${caseItem.case_id}/${Date.now()}_${packed}_${safeLabel}.${safeFileName(ext)}`
              const imageUpload = await supabase.storage.from('inspection-reports').upload(imagePath, blob, {
                contentType: blob.type || 'image/jpeg',
                upsert: true
              })
              if (imageUpload.error) throw new Error(imageUpload.error.message)
              const { data: imagePublic } = supabase.storage.from('inspection-reports').getPublicUrl(imagePath)
              const publicUrl = imagePublic?.publicUrl || ''
              if (publicUrl && /^https?:\/\//i.test(publicUrl)) {
                photoPublicUrls[src] = publicUrl
                if (typeof item === 'object') {
                  if (item.dataUrl) photoPublicUrls[item.dataUrl] = publicUrl
                  if (item.url) photoPublicUrls[item.url] = publicUrl
                  if (item.publicUrl) photoPublicUrls[item.publicUrl] = publicUrl
                }
              } else {
                throw new Error('Could not create a public photo URL.')
              }
            } catch (uploadError) {
              // ZIP creation should still succeed even if an individual photo upload fails.
              console.warn(`Could not create a public View URL for inspection photo: ${label}`, uploadError)
            }
          } catch (e) {
            console.warn(`Could not add inspection photo to ZIP: ${label}`, e)
          }
        }
        if (packed) {
          const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 5 } })
          const zipPath = `${caseItem.case_id}/${Date.now()}_inspection_photos.zip`
          const zipUpload = await supabase.storage.from('inspection-reports').upload(zipPath, zipBlob, { contentType: 'application/zip', upsert: true })
          if (zipUpload.error) throw new Error(`Photo ZIP upload failed: ${zipUpload.error.message}`)
          const { data: zipPublic } = supabase.storage.from('inspection-reports').getPublicUrl(zipPath)
          photoZipUrl = zipPublic?.publicUrl || ''
          if (!photoZipUrl) throw new Error('Photo ZIP uploaded but download URL could not be created.')
        } else {
          throw new Error('No inspection photos could be packaged. Please check that the uploaded photos are accessible, then retry.')
        }
      }

      // Render a fixed-width clone so wide two-column tables and photos are not clipped by the screen viewport.
      // The sample PDF remains the target layout; this preserves the portal report's sections while fixing field values and image clarity.
      const source = reportRef.current
      printHost = document.createElement('div')
      printHost.style.cssText = 'position:fixed;left:-20000px;top:0;width:794px;background:#fff;z-index:-1;overflow:visible;'
      const clone = source.cloneNode(true)
      clone.style.width = '794px'
      clone.style.maxWidth = '794px'
      clone.style.minWidth = '794px'
      clone.style.height = 'auto'
      clone.style.maxHeight = 'none'
      clone.style.overflow = 'visible'
      clone.style.boxSizing = 'border-box'
      clone.querySelectorAll('*').forEach(el => {
        el.style.maxHeight = 'none'
        if (['auto', 'scroll', 'hidden', 'clip'].includes(getComputedStyle(el).overflow)) {
          el.style.overflow = 'visible'
        }
        if (el.tagName === 'IMG') {
          el.style.maxWidth = '100%'
          el.style.height = 'auto'
          el.style.objectFit = 'contain'
        }
      })
      // Photo previews are wrapped in buttons for click-to-zoom. Unwrap those
      // buttons before PDF capture so the IMG elements remain in the report.
      clone.querySelectorAll('button').forEach(button => {
        if (button.querySelector('img')) {
          button.replaceWith(...Array.from(button.childNodes))
        } else {
          button.remove()
        }
      })
      // Preserve live form values in the PDF. cloneNode() does not reliably copy the
      // current React-controlled value of inputs/selects/textareas, and removing them
      // caused filled fields to appear blank in the generated PDF.
      const sourceControls = Array.from(source.querySelectorAll('input, select, textarea'))
      const clonedControls = Array.from(clone.querySelectorAll('input, select, textarea'))
      clonedControls.forEach((el, index) => {
        const original = sourceControls[index]
        let value = ''
        if (original) {
          if (original.tagName === 'SELECT') value = original.selectedOptions?.[0]?.textContent?.trim() || original.value || ''
          else value = original.value || original.getAttribute('value') || ''
          if (original.type === 'checkbox' || original.type === 'radio') value = original.checked ? 'Yes' : 'No'
        }
        const span = document.createElement('span')
        span.textContent = value || '—'
        span.style.cssText = 'display:inline-block;white-space:pre-wrap;overflow-wrap:anywhere;color:#111827;font:inherit;min-height:1em;'
        el.replaceWith(span)
      })
      clone.querySelectorAll('[data-no-pdf="true"]').forEach(el => el.remove())

      // PDF-only photo-card cleanup: keep the photo heading (e.g. 'Selfie with Vehicle')
      // and the image, but remove the Replace/Upload row and uploaded filename. This only
      // runs against the off-screen PDF clone; the live portal remains unchanged.
      Array.from(clone.querySelectorAll('div')).forEach(card => {
        if (!card.querySelector('img')) return
        const directChildren = Array.from(card.children)
        if (directChildren.length < 3) return
        // A photo tile has a short title followed by the image frame, action row and filename.
        const titleText = (directChildren[0]?.textContent || '').trim()
        const imageFrame = directChildren.find(el => el.querySelector && el.querySelector('img'))
        if (!titleText || !imageFrame || !/^(Profile Picture|Right View|Right Quarter Panel|Rear View|Left Quarter Panel|Left View|Left Side Profile Pic|Front View|Engine Compartment.*|Boot \/ Dicky|Front Windscreen|Windscreen.*|Dashboard|Odometer Reading|ABC Pedals.*|Front Right Tyre|Rear Left Tyre|Front Left Tyre|Selfie with Vehicle|Other Images|VinPlate Photo|Chassis Imprint|Chassis Number Pencil Tracing)$/i.test(titleText)) return
        directChildren.slice(1).forEach(child => {
          if (child === imageFrame) return
          const text = (child.textContent || '').trim()
          const hasUploadControl = !!child.querySelector('input[type="file"]') || /\b(Replace|Upload|Remove)\b/i.test(text)
          const looksLikeFilename = /\.(jpg|jpeg|png|webp|heic)(\s|$)/i.test(text) || /IMG[-_][A-Za-z0-9._ -]+\.(jpg|jpeg|png|webp|heic)/i.test(text)
          if (hasUploadControl || looksLikeFilename) child.remove()
        })
      })

      // PDF-only photo cards: enlarge the grid, remove upload/file rows, and add a clickable View label.
      const pdfPhotoTargets = []
      Array.from(clone.querySelectorAll('div')).forEach(card => {
        if (!card.querySelector('img')) return
        const children = Array.from(card.children)
        if (children.length < 2) return
        const title = (children[0]?.textContent || '').trim()
        const img = card.querySelector('img')
        if (!title || !img) return
        if (!/^(Profile Picture|Right View|Right Quarter Panel|Rear View|Left Quarter Panel|Left View|Left Side Profile Pic|Front View|Engine Compartment.*|Boot \/ Dicky|Front Windscreen|Windscreen.*|Dashboard|Odometer Reading|ABC Pedals.*|Front Right Tyre|Rear Left Tyre|Front Left Tyre|Selfie with Vehicle|Other Images.*|VinPlate Photo|Chassis Imprint|Chassis Number Pencil Tracing)$/i.test(title)) return
        
// Remove original View anchors that may point to a data:image Base64 URL.
        card.querySelectorAll('a').forEach(anchor => {
          const href = anchor.getAttribute('href') || ''
          const label = (anchor.textContent || '').trim()
          if (/^data:image\//i.test(href) || /^view$/i.test(label)) anchor.remove()
        })

        const renderedSrc = img.currentSrc || img.src || img.getAttribute('src') || ''

        const matchingMedia = Object.values(form.media || {}).find(item => {
          if (!item || typeof item !== 'object') return false
          return item.dataUrl === renderedSrc || item.url === renderedSrc || item.publicUrl === renderedSrc
        })
        const mediaSource = matchingMedia
          ? (matchingMedia.dataUrl || matchingMedia.url || matchingMedia.publicUrl || renderedSrc)
          : renderedSrc
        const existingWebUrl = /^https?:\/\//i.test(mediaSource) ? mediaSource : ''
        const src = photoPublicUrls[renderedSrc] || photoPublicUrls[mediaSource] || existingWebUrl

        // Never embed a data:image Base64 string as a PDF URL annotation.
        if (!src || !/^https?:\/\//i.test(src)) return
        card.style.setProperty('min-height', '150px', 'important')
        card.style.setProperty('padding', '6px', 'important')
        card.style.setProperty('box-sizing', 'border-box', 'important')
        img.style.setProperty('max-height', '108px', 'important')
        img.style.setProperty('height', '108px', 'important')
        img.style.setProperty('width', '100%', 'important')
        img.style.setProperty('object-fit', 'contain', 'important')
        const parent = card.parentElement
        if (parent) {
          const siblings = Array.from(parent.children).filter(el => el.querySelector && el.querySelector('img'))
          if (siblings.length >= 2) {
            parent.style.setProperty('grid-template-columns', 'repeat(3, minmax(0, 1fr))', 'important')
            parent.style.setProperty('gap', '8px', 'important')
          }
        }
        const view = document.createElement('a')
        view.href = src
        view.textContent = 'View'
        view.setAttribute('aria-label', `View full-size ${title}`)
        view.style.cssText = 'display:block;text-align:right;color:#1265d8;font:9px Arial,sans-serif;text-decoration:underline;margin-top:4px;cursor:pointer;'
        card.appendChild(view)
        pdfPhotoTargets.push({ element: view, url: src })
      })

      // PDF-only media shortcut area: remove the entire Exterior Video section
      // (heading, video preview, filename, upload/replace controls and text links)
      // and put only the two icon tiles in its place. The live portal is untouched.
      const exteriorTitle = Array.from(clone.querySelectorAll('*')).find(el =>
        el.children.length === 0 && (el.textContent || '').trim() === 'Exterior Video'
      )
      // Find the complete card/section by its unique contents, not just the title's
      // immediate parent (which can leave the video preview box visible in the PDF).
      let exteriorSection = null
      let exteriorAncestor = exteriorTitle
      while (exteriorAncestor && exteriorAncestor !== clone) {
        const ancestorText = exteriorAncestor.textContent || ''
        if (/Exterior Video \(Max 59s\)/i.test(ancestorText) && /Replace Video|Upload Exterior Video|Only exterior inspection video is allowed/i.test(ancestorText)) {
          exteriorSection = exteriorAncestor
          break
        }
        exteriorAncestor = exteriorAncestor.parentElement
      }
      if (!exteriorSection && exteriorTitle) exteriorSection = exteriorTitle.parentElement?.parentElement || null
      const pdfLinkTargets = []
      const linksWrap = document.createElement('div')
      linksWrap.style.cssText = 'display:flex;align-items:flex-start;gap:18px;flex-wrap:wrap;margin-top:10px;padding:8px 0;font-family:Arial,sans-serif;'
      const exteriorVideoData = form.exteriorVideo || form.videos?.exteriorVideo || form.videos?.['Exterior Video'] || null
      const videoUrl = typeof exteriorVideoData === 'string' ? exteriorVideoData : (exteriorVideoData?.publicUrl || exteriorVideoData?.signedUrl || exteriorVideoData?.url || exteriorVideoData?.previewUrl || '')
      const makeTile = (kind, label, url) => {
        if (!url) return
        const a = document.createElement('a')
        a.href = url
        a.setAttribute('aria-label', label)
        a.style.cssText = 'width:94px;height:66px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;color:#6b7280;text-decoration:none;font-family:Arial,sans-serif;font-size:8px;font-weight:400;text-align:center;cursor:pointer;padding:0 2px;box-sizing:border-box;position:relative;z-index:2;'
        if (kind === 'video') {
          a.innerHTML = '<svg width="38" height="38" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><rect x="3.5" y="3.5" width="24" height="29" rx="4" fill="#fff" stroke="#ff563f" stroke-width="1.8"/><path d="M13 11.5 L13 24 L22 17.8 Z" fill="#fff" stroke="#ff563f" stroke-width="1.5" stroke-linejoin="round"/><circle cx="29" cy="29" r="8" fill="#fff" stroke="#ff563f" stroke-width="1.8"/><path d="M29 24.5 V29 L32 31" fill="none" stroke="#ff563f" stroke-width="1.5" stroke-linecap="round"/></svg><span>Download Exterior video</span>'
        } else {
          a.innerHTML = '<svg width="38" height="38" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.5 H15 L18.5 14 H37 V33 H3 Z" fill="#f5b12b" stroke="#d18a12" stroke-width="1"/><path d="M3 14 H37 V33 H3 Z" fill="#ffc64b" stroke="#d18a12" stroke-width="1"/><path d="M3 18 H37 V33 H3 Z" fill="#f4a51c"/><path d="M3 10.5 H15 L18.5 14 H37 V18 H3 Z" fill="#ffd36c"/></svg><span>Download images</span>'
        }
        linksWrap.appendChild(a)
        pdfLinkTargets.push({ element: a, url })
      }
     
makeTile('video', 'Download Exterior video', videoUrl)
makeTile('images', 'Download images', photoZipUrl)

if (exteriorSection?.parentNode) {
  if (linksWrap.children.length > 0) {
    exteriorSection.replaceWith(linksWrap)
  } else {
    exteriorSection.remove()
  }
} else if (linksWrap.children.length > 0) {
  clone.appendChild(linksWrap)
}

      printHost.appendChild(clone)
      document.body.appendChild(printHost)

      // Wait for every photo to load/decode before capturing the report.
      const imgs = Array.from(clone.querySelectorAll('img'))
      await Promise.all(imgs.map(img => new Promise(resolve => {
        if (img.complete && img.naturalWidth > 0) {
          if (img.decode) img.decode().catch(() => {}).finally(resolve)
          else resolve()
          return
        }
        const done = () => resolve()
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', done, { once: true })
        setTimeout(done, 15000)
      })))

      const attempts = [
        { scale: 2.0, quality: 0.96 },
        { scale: 1.6, quality: 0.92 },
        { scale: 1.25, quality: 0.88 },
        { scale: 1.0, quality: 0.84 }
      ]
      let finalBlob = null
      let finalDoc = null
      for (const attempt of attempts) {
        setPdfMessage(`Rendering complete report and photos (${Math.round(attempt.scale * 100)}% quality)...`)
        const canvas = await window.html2canvas(clone, {
          scale: attempt.scale,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          imageTimeout: 30000,
          logging: false,
          width: 794,
          windowWidth: 794,
          scrollX: 0,
          scrollY: 0
        })
        if (!canvas.width || !canvas.height) throw new Error('Report rendering returned an empty page.')
        const pdf = new JsPdf({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true })
        const margin = 7
        const pageWidth = 210
        const pageHeight = 297
        const usableWidth = pageWidth - margin * 2
        const usableHeight = pageHeight - margin * 2
        const pxPerMm = canvas.width / usableWidth
        const sliceHeight = Math.max(1, Math.floor(usableHeight * pxPerMm))
        let page = 0
        for (let y = 0; y < canvas.height; y += sliceHeight) {
          if (page > 0) pdf.addPage()
          const h = Math.min(sliceHeight, canvas.height - y)
          const slice = document.createElement('canvas')
          slice.width = canvas.width
          slice.height = h
          const ctx = slice.getContext('2d')
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, slice.width, slice.height)
          ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h)
          const imgData = slice.toDataURL('image/jpeg', attempt.quality)
          const imgHeight = h / pxPerMm
          pdf.addImage(imgData, 'JPEG', margin, margin, usableWidth, imgHeight, undefined, 'FAST')
          page += 1
        }
        // Add real PDF URI annotations over each icon tile. The page content is rasterized,
        // so clickable links must be added separately as PDF annotations.
        const cloneRect = clone.getBoundingClientRect()
        // Reuse the A4 page dimensions declared above for raster slicing.
        const cssPxPerMm = 794 / usableWidth
        const cssPageHeight = usableHeight * cssPxPerMm
        for (const target of [...pdfLinkTargets, ...pdfPhotoTargets]) {
          if (!target.url) continue
          const rect = target.element.getBoundingClientRect()
          const leftPx = Math.max(0, rect.left - cloneRect.left - 2)
          const topPx = Math.max(0, rect.top - cloneRect.top - 2)
          const widthPx = Math.max(rect.width + 4, target.element.getAttribute('aria-label')?.startsWith('View full-size') ? 34 : 94)
          const heightPx = Math.max(rect.height + 4, target.element.getAttribute('aria-label')?.startsWith('View full-size') ? 16 : 66)
          const pageIndex = Math.floor(topPx / cssPageHeight)
          const yInSlice = topPx - pageIndex * cssPageHeight
          if (pageIndex >= 0 && pageIndex < pdf.getNumberOfPages()) {
            pdf.setPage(pageIndex + 1)
            pdf.link(
              margin + leftPx / cssPxPerMm,
              margin + yInSlice / cssPxPerMm,
              Math.min(widthPx / cssPxPerMm, usableWidth - leftPx / cssPxPerMm),
              Math.min(heightPx / cssPxPerMm, usableHeight - yInSlice / cssPxPerMm),
              { url: target.url }
            )
          }
        }
        // Keep all media links within the existing Exterior Video section; never
        // append a separate Inspection Media Downloads page.
        if (photoZipUrl) {
          setForm(prev => ({ ...prev, exteriorVideo: { ...(prev.exteriorVideo || {}), photoZipUrl } }))
        }
        const blob = pdf.output('blob')
        if (!blob || !blob.size) throw new Error('Generated PDF is empty.')
        finalBlob = blob
        finalDoc = pdf
        if (canvas.toDataURL) canvas.width = 1 // release the large canvas buffer before the next attempt
        if (finalBlob.size <= 12 * 1024 * 1024) break
      }
      if (!finalBlob || !finalDoc) throw new Error('Unable to generate PDF.')
      const path = `${caseItem.case_id}/${Date.now()}_inspection_report.pdf`
      setPdfMessage('Uploading complete PDF with photos...')
      const upload = await supabase.storage.from('inspection-reports').upload(path, finalBlob, {
        contentType: 'application/pdf',
        upsert: true
      })
      if (upload.error) throw new Error(`PDF upload failed: ${upload.error.message}`)
      const { data: publicData } = supabase.storage.from('inspection-reports').getPublicUrl(path)
      const pdfUrl = publicData?.publicUrl || ''
      if (!pdfUrl) throw new Error('PDF uploaded but report URL could not be created.')
      setPdfMessage(`Complete PDF generated (${(finalBlob.size / 1024 / 1024).toFixed(2)} MB).`)
      return { pdfUrl, pdfSize: finalBlob.size, pdfGeneratedAt: new Date().toISOString() }
    } finally {
      if (printHost?.parentNode) printHost.parentNode.removeChild(printHost)
      setPdfGenerating(false)
    }
  }

  const fieldLocked = disabled => Boolean(disabled || (mode === 'Report Generated' && !reportEditMode))

  const selectField = (label, key, options, disabled = false) => (
    <label style={{ display: 'grid', gridTemplateColumns: '145px 1fr', alignItems: 'center', gap: 8, fontSize: 10, minHeight: 27 }}>
      <span style={{ fontWeight: 700, color: '#222' }}>{label}</span>
      <select value={form[key] || ''} disabled={fieldLocked(disabled)} onChange={e => updateField(key, e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', height: 25, padding: '2px 6px', border: '1px solid #bdbdbd', borderRadius: 0, fontSize: 10, background: fieldLocked(disabled) ? '#f7f7f7' : '#fff' }}>
        <option value="">Select</option>
        {options.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )

  const dateField = (label, key, disabled = false) => (
    <label style={{ display: 'grid', gridTemplateColumns: '145px 1fr', alignItems: 'center', gap: 8, fontSize: 10, minHeight: 27 }}>
      <span style={{ fontWeight: 700, color: '#222' }}>{label}</span>
      <input type="date" value={dateValue(form[key])} disabled={fieldLocked(disabled)} onChange={e => updateField(key, e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', height: 25, padding: '2px 6px', border: '1px solid #bdbdbd', borderRadius: 0, fontSize: 10, background: fieldLocked(disabled) ? '#f7f7f7' : '#fff' }} />
    </label>
  )

  const textField = (label, key, disabled = false) => (
    <label style={{ display: 'grid', gridTemplateColumns: '145px 1fr', alignItems: 'center', gap: 8, fontSize: 10, minHeight: 27 }}>
      <span style={{ fontWeight: 700, color: '#222' }}>{label}</span>
      <input value={form[key] || ''} disabled={fieldLocked(disabled)} onChange={e => updateField(key, e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', height: 25, padding: '3px 6px', border: '1px solid #bdbdbd', borderRadius: 0, fontSize: 10, background: fieldLocked(disabled) ? '#f7f7f7' : '#fff' }} />
    </label>
  )

  const fuelOptions = ['DIESEL','PETROL','CNG','LPG','ELECTRIC','HYBRID','PETROL+CNG']
  const transmissionOptions = ['MANUAL','AUTOMATIC','iMT','AT','AMT','CVT','DCT']
  const colorOptions = ['Beige','Black','Blue','Bronze','Brown','Gold','Gray','Green','Maroon','Navy Blue','Orange','Pink','Purple','Red','Silver','Sky Blue','Teal','White','Yellow']
  const bodyTypeOptions = ['Hatchback','Sedan','SUV','MUV','MPV','Coupe','Convertible','Pickup','Truck','Wagon','Crossover','Van','Limousine']
  const yesNoOptions = ['YES','NO']
  const insuranceOptions = ['Comprehensive','Third Party']
  const inspectionOptions = ['Physical Inspection','Digital Inspection']

  const financierOptions = [
    'State Bank of India','Bank of Baroda','Punjab National Bank','Canara Bank','Union Bank of India','Bank of India',
    'Indian Bank','Central Bank of India','Indian Overseas Bank','UCO Bank','Bank of Maharashtra','Punjab & Sind Bank',
    'HDFC Bank','ICICI Bank','Axis Bank','Kotak Mahindra Bank','IndusInd Bank','IDFC FIRST Bank','Federal Bank',
    'YES BANK','RBL Bank','AU Small Finance Bank','Ujjivan Small Finance Bank','Equitas Small Finance Bank',
    'Bajaj Finance','Tata Capital','Mahindra Finance','Cholamandalam Investment and Finance','Shriram Finance',
    'Muthoot Finance','Manappuram Finance','L&T Finance','Aditya Birla Finance','Hero FinCorp','TVS Credit',
    'HDB Financial Services','Hinduja Leyland Finance','Sundaram Finance','Magma Finance','Poonawalla Fincorp',
    'Clix Capital','DMI Finance','KreditBee','Lendingkart','IIFL Finance','JM Financial','Sammaan Capital',
    'Home First Finance','Aavas Financiers','Five-Star Business Finance','Aptus Value Housing Finance'
  ]

  const cityOptions = [...new Set(
    locations.map(row => firstValue(row, ['city','CITY','City'])).filter(Boolean).map(v => String(v).trim())
  )].sort((a,b) => a.localeCompare(b))

  const ratingOptions = ['Good', 'Average', 'Bad', 'Scratched', 'Dented', 'Ok', 'Available', 'Not Available', 'Not Applicable']

  // Inspection rating -> score. "Not Applicable" is excluded from averages.
  const ratingToScore = {
    Good: 10,
    Ok: 10,
    Available: 10,
    Scratched: 7,
    Dented: 5,
    Average: 5,
    Bad: 0,
    'Not Available': 0
  }

  const getGroupScore = (rows) => {
    const values = rows
      .map(row => form.detailed?.[row])
      .filter(value => value && value !== 'Not Applicable' && Object.prototype.hasOwnProperty.call(ratingToScore, value))

    if (!values.length) return ''
    const total = values.reduce((sum, value) => sum + ratingToScore[value], 0)
    return Number((total / values.length).toFixed(1))
  }

  const getOverallScore = () => {
    const allRows = parameterGroups.flatMap(group => group.rows)
    const values = allRows
      .map(row => form.detailed?.[row])
      .filter(value => value && value !== 'Not Applicable' && Object.prototype.hasOwnProperty.call(ratingToScore, value))

    if (!values.length) return ''
    const total = values.reduce((sum, value) => sum + ratingToScore[value], 0)
    return Number((total / values.length).toFixed(1))
  }

  const getCondition = score => {
    if (score === '' || score === null || score === undefined) return ''
    if (score >= 9) return 'Excellent'
    if (score >= 7) return 'Good'
    if (score >= 5) return 'Average'
    return 'Poor'
  }

  const scoreField = (label, value) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 58px', alignItems: 'center', gap: 5, fontSize: 10 }}>
      <span style={{ fontWeight: 700 }}>{label}</span>
      <div style={{ width: '100%', height: 24, boxSizing: 'border-box', padding: '4px 5px', border: '1px solid #aaa', background: '#f7f7f7', fontSize: 10, fontWeight: 800, textAlign: 'center' }}>
        {value === '' ? '—' : `${value}/10`}
      </div>
    </div>
  )

  const section = (letter, title, children) => (
    <div style={{ border: '1px solid #c7c7c7', marginTop: 10, background: '#fff' }}>
      <div style={{ background: '#f3f3f3', borderBottom: '1px solid #c7c7c7', minHeight: 30, display: 'flex', alignItems: 'center', padding: '0 9px', fontWeight: 800, fontSize: 12 }}>
        {letter && <span style={{ display: 'inline-grid', placeItems: 'center', width: 22, height: 22, background: '#444', color: '#fff', marginRight: 7, fontSize: 12 }}>{letter}</span>}
        {title}
      </div>
      <div style={{ padding: 9 }}>{children}</div>
    </div>
  )

  const parameterGroups = [
    {
      title: 'Body & Frame',
      rows: ['A Pillar L', 'A Pillar R', 'B Pillar L', 'B Pillar R', 'C Pillar L', 'C Pillar R', 'Front Panel', 'Quarter Panel L', 'Quarter Panel R', 'Apron L', 'Apron R', 'Running Board L', 'Running Board R', 'Roof', 'Dickey Floor']
    },
    {
      title: 'Exterior & Interior',
      rows: ['Bonnet', 'Fender L', 'Fender R', 'Front Door L', 'Front Door R', 'Rear Door L', 'Rear Door R', 'Front Bumper', 'Rear Bumper', 'Glasses', 'Chassis Frame', 'Windscreen', 'ORVM', 'Music System']
    },
    { title: 'Light', rows: ['Head Light L', 'Head Light R', 'Tail Light L', 'Tail Light R'] },
    { title: 'Tyre Details', rows: ['Front Right', 'Front Left', 'Rear Right', 'Rear Left', 'Spare'] },
    { title: 'Other Details', rows: ['AC', 'ABS', 'Alloy', 'Battery', 'Engine'] }
  ]

  const media = [
    'Profile Picture', 'Right View', 'Right Quarter Panel', 'Rear View', 'Left Quarter Panel', 'Left View', 'Left Side Profile Pic', 'Front View',
    'Engine Compartment 1', 'Engine Compartment 2', 'Engine Compartment 3', 'Boot / Dicky', 'Front Windscreen', 'Windscreen - Interior (from rear seat)',
    'Dashboard', 'Odometer Reading', 'ABC Pedals (from driver seat)', 'Selfie with Vehicle', 'Other Images 1', 'Other Images 2', 'Other Images 3',
    'VIN Plate Photo', 'Chassis Imprint', 'Pencil Tracing'
  ]

  const vahanFields = ['Registration Number','Manufacturing Date','Registered RTO','Registration Date','Owner Name','RC Blacklist Status','Owner Count','Fitness Upto','Owner Permanent Address','Name of Financier','Owner Present Address','Insurer','Vehicle Name','Policy Number','Make','Insurance Valid Upto','Model','PUCC Number','Vehicle Category','PUCC Valid Upto','Vehicle Class','NP Issued By','Wheel Base','NP Number','Chassis Number','NP Valid Upto','Engine Number','Permit Issue Date','Car Color','Permit Number','Fuel Type','Permit Type','Fuel Norms','Permit Valid From','Engine Capacity','Permit Valid Upto','Gross Vehicle Weight','RC Tax Upto','Seating Capacity','Body Type','Sleeper Capacity']

  const reportShell = {
    background: '#fff',
    border: '1px solid #c8cdd2',
    boxShadow: '0 2px 7px rgba(0,0,0,.05)',
    padding: '28px 34px 24px',
    fontFamily: 'Arial, Helvetica, sans-serif',
    color: '#161616',
    maxWidth: 1100,
    margin: '0 auto'
  }

  const reportHeader = (
    <div style={{ borderBottom: '1px solid #cfcfcf', paddingBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ef3e42', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 14 }}>CD</div>
        <div>
          <div style={{ fontSize: 20, lineHeight: 1, fontWeight: 800 }}>CarDekho</div>
          <div style={{ fontSize: 9, letterSpacing: 1.2, marginTop: 4 }}>INSPECTION</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>Vehicle Inspection Report</div>
        <div style={{ fontSize: 10, marginTop: 2 }}>Certificate No.: {String(caseItem.case_id || '').replace(/^CASE-/, '')}</div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="panel" style={{ marginBottom: 12, position: 'sticky', top: 0, zIndex: 5 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0 }}>{mode} — Vehicle Inspection Report</h2>
            <small>{caseItem.case_id} · {caseItem.registration_number || 'Registration not available'} · Single-page merged report</small>
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button className="primary" type="button" onClick={onSave} disabled={saving}><Save size={15} /> {saving ? 'Saving...' : 'Save Draft'}</button>
            <button type="button" onClick={onRemarks}>Remarks</button>
            <button type="button" onClick={onReject}>Reject</button>
            <button type="button" onClick={onHistory}>History</button>
            {mode === 'QC' && <button type="button" onClick={onHold} disabled={saving}>QC Hold</button>}
            {mode === 'TPA QC' && <button className="primary" type="button" onClick={onSubmit} disabled={saving}>Submit to QC</button>}
            {mode === 'QC' && <button className="primary" type="button" onClick={onSubmit} disabled={saving}>Approve &amp; Send to Pricing</button>}
            {mode === 'QC Hold' && <button className="primary" type="button" onClick={onSubmit} disabled={saving}>Resubmit to QC</button>}
            {mode === 'Pricing' && <button className="primary" type="button" onClick={async () => { try { const meta = await generateInspectionPdf(); await onSubmit(meta) } catch (e) { setPdfMessage(e?.message || 'Unable to generate PDF.') } }} disabled={saving || pdfGenerating}> {pdfGenerating ? 'Generating PDF...' : 'Final Submit & Generate Report'}</button>}
            {mode === 'Report Generated' && (
              <>
                <button type="button" onClick={() => setReportEditMode(v => !v)} style={{ padding: '7px 10px', border: '1px solid #7c3aed', background: reportEditMode ? '#f3e8ff' : '#fff', color: '#6d28d9', fontSize: 12, fontWeight: 700 }}>
                  {reportEditMode ? 'Editing Report' : 'Edit Report'}
                </button>
                {reportEditMode && <button className="primary" type="button" onClick={async () => { await onSave(); setReportEditMode(false); setPdfMessage('Report changes saved successfully.') }} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>}
                <button type="button" className="primary" onClick={async () => {
                  try {
                    const meta = await generateInspectionPdf()
                    const nextForm = { ...form, pdf_url: meta.pdfUrl, pdf_size: meta.pdfSize, pdf_generated_at: meta.pdfGeneratedAt }
                    setForm(nextForm)
                    await onSave(nextForm)
                    setPdfMessage('PDF generated, uploaded and report data saved successfully.')
                  } catch (e) {
                    setPdfMessage(e?.message || 'Unable to generate PDF.')
                  }
                }} disabled={saving || pdfGenerating}>
                  {pdfGenerating ? 'Generating PDF...' : (form.pdf_url ? 'Regenerate PDF' : 'Generate PDF')}
                </button>
                {form.pdf_url && (
                  <>
                    <a href={form.pdf_url} download={`CarDekho_${caseItem.case_id}_Inspection_Report.pdf`} style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 10px', border: '1px solid #16a34a', background: '#f0fdf4', color: '#15803d', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>Download PDF</a>
                    <a href={form.pdf_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 10px', border: '1px solid #1d4ed8', background: '#eff6ff', color: '#1d4ed8', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>Open PDF</a>
                    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(form.pdf_url); setPdfMessage('PDF generated URL copied successfully.') } catch { setPdfMessage(`PDF generated URL: ${form.pdf_url}`) } }} style={{ padding: '7px 10px', border: '1px solid #64748b', background: '#fff', color: '#334155', fontSize: 12, fontWeight: 700 }}>Copy Report URL</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        {message && <div style={{ marginTop: 8, padding: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12 }}>{message}</div>}
        {pdfMessage && <div style={{ marginTop: 8, padding: 8, background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: 11 }}>{pdfMessage}</div>}
        {mode === 'Report Generated' && form.pdf_url && (
          <div style={{ marginTop: 8, padding: 9, background: '#f8fafc', border: '1px solid #cbd5e1', fontSize: 11 }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>PDF Generated</div>
            <div><b>URL:</b> <span style={{ wordBreak: 'break-all' }}>{form.pdf_url}</span></div>
            {form.pdf_generated_at && <div style={{ marginTop: 3 }}><b>Generated:</b> {new Date(form.pdf_generated_at).toLocaleString()}</div>}
            {form.pdf_size && <div style={{ marginTop: 3 }}><b>PDF Size:</b> {(Number(form.pdf_size) / 1024 / 1024).toFixed(2)} MB</div>}
          </div>
        )}
      </div>

      <div ref={reportRef} style={reportShell}>
        {reportHeader}

        <div style={{ marginTop: 12, fontSize: 17, fontWeight: 800 }}>
          {[caseItem.make, caseItem.model, caseItem.variant].filter(Boolean).join(' ') || 'Vehicle Inspection'}
        </div>

        {section('A', 'Vehicle Details',
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, rowGap: 1 }}>
            {textField('Registration No.', 'registration_number', true)}
            {textField('RTO', 'rto')}
            {dateField('Manufacturing Date', 'manufacturing_date')}
            {dateField('Registration Date', 'registration_date')}
            {textField('No. of Owners', 'owner_count')}
            {textField('Odometer Reading', 'odometer')}
            {selectField('Fuel Type', 'fuel', fuelOptions)}
            {selectField('Transmission', 'transmission', transmissionOptions)}
            {selectField('Color', 'color', colorOptions)}
            {selectField('Body Type', 'body_type', bodyTypeOptions)}
            {textField('Engine Number', 'engine_number')}
            {textField('Chassis Number', 'chassis_number')}
            {textField('Loan No./Ref. No.', 'loan_number')}
            {selectField('RC Available', 'rc_available', yesNoOptions)}
            {selectField('Insurance Type', 'insurance_type', insuranceOptions)}
            {dateField('Insurance Validity', 'insurance_validity')}
            {dateField('Insurance Expiry', 'insurance_expiry')}
            {dateField('Third Party Validity', 'third_party_validity')}
            {selectField('Hypothecation', 'hypothecation', yesNoOptions)}
            {selectField('Financier', 'financier', financierOptions)}
            {selectField('CNG/LPG Fitment', 'cng_fitment', yesNoOptions)}
            {selectField('CNG/LPG Category', 'cng_category', yesNoOptions)}
            {dateField('Road Tax Validity', 'road_tax_validity')}
            {dateField('Road Tax Date', 'road_tax_date')}
            {textField('Customer Name', 'customer_name', true)}
            {textField('Client Name', 'client_name', true)}
            {dateField('CNG Validity Date', 'cng_validity')}
            {selectField('Key Available', 'key_available', yesNoOptions)}
            {selectField('Inspection Type', 'inspection_type', inspectionOptions)}
            {selectField('Inspection Site', 'inspection_site', cityOptions)}
          </div>
        )}

        {(() => {
          const overallScore = getOverallScore()
          const groupScoreMap = Object.fromEntries(parameterGroups.map(group => [group.title, getGroupScore(group.rows)]))
          const condition = getCondition(overallScore)

          return (
            <>
              {section('B', 'Summary / Score',
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {scoreField('Overall Score', overallScore)}
                  {scoreField('Body and Frame', groupScoreMap['Body & Frame'])}
                  {scoreField('Exterior and Interior', groupScoreMap['Exterior & Interior'])}
                  {scoreField('Light', groupScoreMap['Light'])}
                  {scoreField('Tyre Details', groupScoreMap['Tyre Details'])}
                  {scoreField('Other Details', groupScoreMap['Other Details'])}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: 5, fontSize: 10 }}>
                    <span style={{ fontWeight: 700 }}>Condition</span>
                    <div style={{ height: 24, border: '1px solid #aaa', background: '#f7f7f7', display: 'grid', placeItems: 'center', fontSize: 10, fontWeight: 800 }}>
                      {condition || '—'}
                    </div>
                  </div>
                </div>
              )}

              {section('', 'Remarks',
                <div style={{ padding: 8 }}>
                  <textarea
                    value={form.remarks || ''}
                    onChange={e => updateField('remarks', e.target.value)}
                    placeholder="Enter inspection remarks..."
                    rows={4}
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', border: '1px solid #aaa', borderRadius: 0, padding: 8, fontFamily: 'inherit', fontSize: 10, lineHeight: 1.45, background: '#fff' }}
                  />
                  <div style={{ marginTop: 4, fontSize: 8.5, color: '#777' }}>
                    Remarks are autosaved and remain part of the master inspection report.
                  </div>
                </div>
              )}

              {section('C', 'Detailed Inspection',
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {parameterGroups.map(group => {
                    const currentValues = group.rows.map(row => form.detailed?.[row] || '')
                    const allSame = currentValues.length > 0 && currentValues.every(value => value && value === currentValues[0])
                    const bulkValue = allSame ? currentValues[0] : ''

                    const applyGroupRating = value => {
                      setForm(prev => ({
                        ...prev,
                        detailed: {
                          ...(prev.detailed || {}),
                          ...Object.fromEntries(group.rows.map(row => [row, value]))
                        }
                      }))
                    }

                    return (
                      <div key={group.title} style={{ border: '1px solid #cfcfcf' }}>
                        <div style={{ background: '#f3f3f3', borderBottom: '1px solid #cfcfcf', padding: '5px 8px', fontWeight: 800, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span>{group.title}</span>
                          <select
                            value={bulkValue}
                            onChange={e => applyGroupRating(e.target.value)}
                            style={{ width: 125, height: 23, border: '1px solid #999', borderRadius: 0, fontSize: 9.5, background: '#fff' }}
                            title={`Apply one rating to all ${group.title} parameters`}
                          >
                            <option value="">Select</option>
                            {ratingOptions.map(option => <option key={option} value={option}>{option}</option>)}
                          </select>
                        </div>

                        <div style={{ padding: 7 }}>
                          {group.rows.map(row => (
                            <div key={row} style={{ display: 'grid', gridTemplateColumns: '1fr 125px', gap: 7, alignItems: 'center', borderBottom: '1px solid #ededed', minHeight: 25, fontSize: 9.5 }}>
                              <span>{row}</span>
                              <select
                                value={form.detailed?.[row] || ''}
                                onChange={e => setForm(prev => ({ ...prev, detailed: { ...(prev.detailed || {}), [row]: e.target.value } }))}
                                style={{ height: 22, border: '1px solid #aaa', borderRadius: 0, fontSize: 9.5 }}
                              >
                                <option value="">Select</option>
                                {ratingOptions.map(option => <option key={option} value={option}>{option}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )
        })()}

        {section('D', 'Inspection Photos / Media',
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {media.map(name => {
              const mediaItem = form.media?.[name]
              const imageSrc = typeof mediaItem === 'string' ? mediaItem : (mediaItem?.dataUrl || mediaItem?.url || mediaItem?.publicUrl)
              const imageName = typeof mediaItem === 'object' ? mediaItem?.name : ''

              const handlePhotoUpload = event => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (!file) return
                if (!file.type.startsWith('image/')) {
                  setForm(prev => ({ ...prev, mediaError: `${name}: Please select an image file.` }))
                  return
                }
                if (file.size > 10 * 1024 * 1024) {
                  setForm(prev => ({ ...prev, mediaError: `${name}: Image must be 10MB or smaller.` }))
                  return
                }
                const reader = new FileReader()
                reader.onload = async () => {
                  const compressed = await compressImageDataUrl(reader.result, 1000, 750, 0.62)
                  setForm(prev => ({
                    ...prev,
                    mediaError: '',
                    media: {
                      ...(prev.media || {}),
                      [name]: { name: file.name, type: 'image/jpeg', size: Math.round(compressed.length * 0.75), dataUrl: compressed }
                    }
                  }))
                }
                reader.onerror = () => setForm(prev => ({ ...prev, mediaError: `${name}: Unable to read this image.` }))
                reader.readAsDataURL(file)
              }

              const removePhoto = () => setForm(prev => {
                const nextMedia = { ...(prev.media || {}) }
                delete nextMedia[name]
                return { ...prev, media: nextMedia, mediaError: '' }
              })

              return (
                <div key={name} style={{ border: '1px solid #cfcfcf', minHeight: 128, padding: 6, background: '#fff' }}>
                  <div style={{ fontWeight: 700, fontSize: 9, minHeight: 25 }}>{name}</div>
                  <div style={{ height: 75, background: '#f7f7f7', border: '1px solid #e2e2e2', overflow: 'hidden', display: 'grid', placeItems: 'center' }}>
                    {imageSrc ? (
                      <button type="button" onClick={() => { setPhotoViewer({ name, src: imageSrc }); setPhotoZoom(1) }} title="Click to open photo" style={{ width: '100%', height: '100%', padding: 0, border: 'none', background: 'transparent', cursor: 'zoom-in' }}>
                        <img src={imageSrc} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </button>
                    ) : <span style={{ fontSize: 9, color: '#888' }}>No Image</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 9, cursor: 'pointer' }}>
                      <Upload size={11} /> {imageSrc ? 'Replace' : 'Upload'}
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                    </label>
                    {imageSrc && <button type="button" onClick={removePhoto} style={{ border: 'none', background: 'transparent', padding: 0, fontSize: 9, color: '#c00', cursor: 'pointer' }}>Remove</button>}
                  </div>
                  {imageName && <div title={imageName} style={{ marginTop: 3, fontSize: 8, color: '#777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{imageName}</div>}
                </div>
              )
            })}
          </div>
        )}
        {form.mediaError && <div style={{ marginTop: 7, padding: '6px 8px', background: '#fff5f5', border: '1px solid #f0b7b7', color: '#a00', fontSize: 9 }}>{form.mediaError}</div>}

        {(() => {
          const videoItem = form.exteriorVideo

          const removeExteriorVideo = () => {
            if (videoItem?.previewUrl) URL.revokeObjectURL(videoItem.previewUrl)
            setForm(prev => ({ ...prev, exteriorVideo: null, mediaError: '' }))
          }

          const handleExteriorVideoUpload = event => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return

            if (file.type !== 'video/mp4') {
              setForm(prev => ({ ...prev, mediaError: 'Exterior Video: Only MP4 video is allowed.' }))
              return
            }

            if (file.size > 30 * 1024 * 1024) {
              setForm(prev => ({ ...prev, mediaError: 'Exterior Video: Video must be 30MB or smaller.' }))
              return
            }

            const previewUrl = URL.createObjectURL(file)
            const testVideo = document.createElement('video')
            testVideo.preload = 'metadata'
            testVideo.onloadedmetadata = () => {
              URL.revokeObjectURL(testVideo.src)
              const duration = Number(testVideo.duration || 0)

              if (!Number.isFinite(duration) || duration > 59) {
                URL.revokeObjectURL(previewUrl)
                setForm(prev => ({ ...prev, mediaError: 'Exterior Video: Maximum duration is 59 seconds.' }))
                return
              }

              ;(async () => {
                try {
                  const path = `${caseItem.case_id}/exterior/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
                  const upload = await supabase.storage.from('inspection-media').upload(path, file, { contentType: 'video/mp4', upsert: true })
                  if (upload.error) throw new Error(upload.error.message)
                  const { data: publicData } = supabase.storage.from('inspection-media').getPublicUrl(path)
                  setForm(prev => ({
                    ...prev,
                    mediaError: '',
                    exteriorVideo: {
                      name: file.name,
                      type: file.type,
                      size: file.size,
                      duration: Math.round(duration * 10) / 10,
                      previewUrl,
                      url: publicData?.publicUrl || ''
                    }
                  }))
                } catch (uploadError) {
                  URL.revokeObjectURL(previewUrl)
                  setForm(prev => ({ ...prev, mediaError: `Exterior Video: Upload failed — ${uploadError?.message || 'Unknown error'}` }))
                }
              })()
            }
            testVideo.onerror = () => {
              URL.revokeObjectURL(previewUrl)
              setForm(prev => ({ ...prev, mediaError: 'Exterior Video: Unable to read this video. Please select a valid MP4 file.' }))
            }
            testVideo.src = previewUrl
          }

          return section('', 'Exterior Video',
            <div style={{ border: '1px dashed #c8c8c8', padding: 10, fontSize: 10 }}>
              <b>Exterior Video (Max 59s)</b>
              <div style={{ marginTop: 5, color: '#666' }}>Only exterior inspection video is allowed. Maximum duration: 59 seconds, MP4, maximum 30MB.</div>

              {(videoItem?.previewUrl || videoItem?.url || videoItem?.publicUrl) && (
                <div style={{ marginTop: 9, border: '1px solid #ddd', background: '#f7f7f7', padding: 7 }}>
                  <video
                    src={videoItem.previewUrl || videoItem.url || videoItem.publicUrl}
                    controls
                    preload="metadata"
                    style={{ width: '100%', maxHeight: 280, display: 'block', background: '#111' }}
                  />
                  <div style={{ marginTop: 5, fontSize: 9, color: '#555' }}>
                    {videoItem.name || 'Exterior Video'} · {videoItem.duration ? `${videoItem.duration}s · ` : ''}{(Number(videoItem.size || 0) / (1024 * 1024)).toFixed(1)} MB{videoItem.recoveredFromStorage ? ' · Recovered from Storage' : ''}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', border: '1px solid #aaa', padding: '5px 8px', background: '#fff' }}>
                  <Upload size={12} /> {videoItem ? 'Replace Video' : 'Upload Exterior Video'}
                  <input type="file" accept="video/mp4,.mp4" onChange={handleExteriorVideoUpload} style={{ display: 'none' }} />
                </label>
                {videoItem && (
                  <button type="button" onClick={removeExteriorVideo} style={{ border: 'none', background: 'transparent', color: '#c00', cursor: 'pointer', fontSize: 9 }}>
                    Remove
                  </button>
                )}
              </div>
            </div>
          )
        })()}

        {['Pricing', 'Report Generated'].includes(mode) && section('E', 'Pricing',
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, rowGap: 1 }}>
            {textField('Valuation Price', 'valuation_price', mode === 'Report Generated')}
            {textField('Pricing Remarks', 'pricing_remarks', mode === 'Report Generated')}
          </div>
        )}

        {section('F', 'Vahan Details',
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #d0d0d0' }}>
            {vahanFields.map((label, index) => (
              <div key={label} style={{ minHeight: 33, padding: '6px 8px', borderBottom: '1px solid #ededed', borderRight: index % 2 === 0 ? '1px solid #ededed' : 'none', fontSize: 9.5 }}>
                <b>{label}</b>
                <div style={{ marginTop: 3, color: '#999' }}>— API value will be populated later —</div>
              </div>
            ))}
          </div>
        )}

        {section('F', 'Challan Details',
          <div style={{ border: '1px solid #d0d0d0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '45px 1.2fr 1fr 1fr 90px', background: '#f3f3f3', fontWeight: 800, fontSize: 9.5, borderBottom: '1px solid #d0d0d0' }}>
              <div style={{ padding: 6 }}>Sr.</div><div style={{ padding: 6 }}>Challan No.</div><div style={{ padding: 6 }}>Date</div><div style={{ padding: 6 }}>Offence</div><div style={{ padding: 6 }}>Amount</div>
            </div>
            {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
              <div key={n} style={{ display: 'grid', gridTemplateColumns: '45px 1.2fr 1fr 1fr 90px', fontSize: 9.5, borderBottom: '1px solid #ededed' }}>
                <div style={{ padding: 6 }}>{n}</div><div style={{ padding: 6 }}>—</div><div style={{ padding: 6 }}>—</div><div style={{ padding: 6 }}>—</div><div style={{ padding: 6 }}>—</div>
              </div>
            ))}
            <div style={{ padding: 7, color: '#777', fontSize: 9 }}>Challan data intentionally blank until API integration.</div>
          </div>
        )}

        {section('', 'Disclaimer / Notes',
          <div style={{ fontSize: 9.5, lineHeight: 1.55 }}>
            <p style={{ margin: '3px 0 7px' }}>This inspection summary report is compiled based on information provided to us including title documents, MMV, year, condition, odometer reading and external examination of the vehicle/components.</p>
            <p style={{ margin: '3px 0 7px' }}>The report will not tell you about hidden defects or problems which cannot be identified by a visual inspection.</p>
            <p style={{ margin: '3px 0 0' }}>To check the genuinity of condition report please scan the QR code on 1st page of report.</p>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cfcfcf', marginTop: 14, paddingTop: 8, fontSize: 8.5, color: '#666' }}>
          <span>Date of Inspection</span>
          <span>Certificate No.: {String(caseItem.case_id || '').replace(/^CASE-/, '')}</span>
          <span>CarDekho INSPECTION</span>
        </div>

      {photoViewer && (
        <div onClick={() => setPhotoViewer(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: 'min(95vw, 1100px)', height: 'min(90vh, 800px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <button type="button" onClick={() => setPhotoViewer(null)} style={{ position: 'absolute', top: 0, right: 0, zIndex: 2, width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#fff', color: '#111', fontSize: 22, cursor: 'pointer' }}>×</button>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: 8 }}>{photoViewer.name}</div>
            <div onWheel={e => { if (['TPA QC','QC','QC Hold','Pricing','Report Generated'].includes(mode)) { e.preventDefault(); setPhotoZoom(z => Math.max(0.5, Math.min(3, Number((z + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2))))) } }} style={{ maxWidth: '100%', maxHeight: 'calc(100% - 70px)', overflow: 'auto', background: '#111', padding: 10, cursor: ['TPA QC','QC','QC Hold','Pricing','Report Generated'].includes(mode) ? 'zoom-in' : 'default' }}>
              <img src={photoViewer.src} alt={photoViewer.name} style={{ maxWidth: 'none', width: `${Math.round(700 * photoZoom)}px`, height: 'auto', display: 'block' }} />
            </div>
            {['TPA QC','QC','QC Hold','Pricing','Report Generated'].includes(mode) && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button type="button" onClick={() => setPhotoZoom(z => Math.min(3, Number((z + 0.25).toFixed(2))))}>Zoom In +</button>
                <button type="button" onClick={() => setPhotoZoom(z => Math.max(0.5, Number((z - 0.25).toFixed(2))))}>Zoom Out −</button>
                <button type="button" onClick={() => setPhotoZoom(1)}>Reset</button>
              </div>
            )}
          </div>
        </div>
      )}

      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  required
}) {
  return (
    <label className="field">

      <span>
        {label}
        {required && (
          <b
            style={{
              color: '#dc2626'
            }}
          >
            {' '}*
          </b>
        )}
      </span>

      <input
        value={value || ''}
        onChange={e =>
          onChange &&
          onChange(e.target.value)
        }
        placeholder={
          placeholder || ''
        }
        disabled={disabled}
        required={required}
      />

    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  disabled,
  required,
  children
}) {
  return (
    <label className="field">

      <span>
        {label}
        {required && (
          <b
            style={{
              color: '#dc2626'
            }}
          >
            {' '}*
          </b>
        )}
      </span>

      <select
        value={value || ''}
        onChange={e =>
          onChange(e.target.value)
        }
        disabled={disabled}
        required={required}
      >
        {children}
      </select>

    </label>
  )
}

function Modal({
  title,
  close,
  children
}) {
  return (
    <div className="overlay">

      <div className="modal">

        <header>

          <h2>
            {title}
          </h2>

          <button
            onClick={close}
          >
            <X />
          </button>

        </header>

        {children}

      </div>

    </div>
  )
}

function firstValue(
  row,
  keys
) {
  for (const key of keys) {
    if (
      row &&
      row[key] !== undefined &&
      row[key] !== null &&
      String(row[key]).trim() !== ''
    ) {
      return row[key]
    }
  }

  return ''
}

function uniqueValues(values) {
  return [
    ...new Set(
      values
        .filter(Boolean)
        .map(value =>
          String(value).trim()
        )
        .filter(Boolean)
    )
  ]
}

function clientDisplayName(client) {
  return (
    firstValue(client, [
      'client_name',
      'name',
      'client',
      'company_name',
      'title'
    ]) ||
    `Client ${client.id}`
  )
}

function AuthGate() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [authError, setAuthError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [working, setWorking] = useState(false)

  const loadProfile = async (currentSession) => {
    if (!currentSession?.user) {
      setSession(null); setProfile(null); setLoadingAuth(false); return
    }
    setSession(currentSession)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id,full_name,email,role,is_active,must_change_password')
      .eq('user_id', currentSession.user.id)
      .maybeSingle()
    if (error) {
      setAuthError('Profile load failed: ' + error.message)
      setProfile(null)
    } else if (!data) {
      setAuthError('Your login exists, but your user profile is missing. Ask an Admin to repair your account.')
      setProfile(null)
    } else if (data.is_active === false) {
      await supabase.auth.signOut()
      setSession(null); setProfile(null)
      setAuthError('Your account is inactive. Please contact an Admin.')
    } else {
      setProfile({ ...data, trustedRole: currentSession.user.app_metadata?.role || '' })
      setAuthError('')
    }
    setLoadingAuth(false)
  }

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) setAuthError(error.message)
      loadProfile(data?.session || null)
    }).catch(error => {
      if (mounted) { setAuthError(error?.message || 'Unable to check login session.'); setLoadingAuth(false) }
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      // Defer profile loading to avoid doing Supabase queries inside the auth callback.
      setTimeout(() => { if (mounted) loadProfile(nextSession) }, 0)
    })
    return () => { mounted = false; listener?.subscription?.unsubscribe() }
  }, [])

  const signIn = async (event) => {
    event.preventDefault(); setWorking(true); setAuthError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      if (!data?.session) throw new Error('Login did not create a session. Please try again.')
      await loadProfile(data.session)
    } catch (error) { setAuthError(error?.message || 'Login failed.') }
    finally { setWorking(false) }
  }

  const changePassword = async (event) => {
    event.preventDefault(); setAuthError('')
    if (newPassword.length < 12) { setAuthError('New password must be at least 12 characters.'); return }
    if (newPassword !== confirmPassword) { setAuthError('New password and confirmation do not match.'); return }
    setWorking(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      const { error: profileError } = await supabase.from('user_profiles').update({ must_change_password: false }).eq('user_id', session.user.id)
      if (profileError) throw new Error('Password changed, but first-login flag could not be cleared: ' + profileError.message + '. Ask an Admin to finish account setup.')
      setProfile(current => current ? { ...current, must_change_password: false } : current)
      setNewPassword(''); setConfirmPassword('')
    } catch (error) { setAuthError(error?.message || 'Unable to change password.') }
    finally { setWorking(false) }
  }

  const signOut = async () => { await supabase.auth.signOut(); setSession(null); setProfile(null); setPassword('') }

  if (loadingAuth) return <main className="auth-shell"><section className="auth-card"><h1>CarDekho Inspection Portal</h1><p>Checking secure session…</p></section></main>

  if (!session || !profile) return <main className="auth-shell"><form className="auth-card" onSubmit={signIn}>
    <div className="auth-brand">CarDekho <span>INSPECTION</span></div>
    <h1>Secure Sign In</h1><p>Sign in with your authorized portal account.</p>
    {authError && <div className="auth-error" role="alert">{authError}</div>}
    <label className="auth-field">Email address<input type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com" /></label>
    <label className="auth-field">Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" /></label>
    <button className="auth-submit" type="submit" disabled={working}>{working ? 'Signing in…' : 'Sign In'}</button>
    <small>Access is limited to active accounts registered by an Admin.</small>
  </form></main>

  if (profile.must_change_password) return <main className="auth-shell"><form className="auth-card" onSubmit={changePassword}>
    <div className="auth-brand">CarDekho <span>INSPECTION</span></div><h1>Set a new password</h1>
    <p>For security, change your temporary password before continuing.</p>
    {authError && <div className="auth-error" role="alert">{authError}</div>}
    <label className="auth-field">New password<input type="password" autoComplete="new-password" required minLength={12} value={newPassword} onChange={e=>setNewPassword(e.target.value)} /></label>
    <label className="auth-field">Confirm new password<input type="password" autoComplete="new-password" required minLength={12} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} /></label>
    <button className="auth-submit" type="submit" disabled={working}>{working ? 'Updating…' : 'Change Password'}</button>
    <button className="auth-link" type="button" onClick={signOut}>Sign out</button>
  </form></main>

  return <><div className="auth-session-bar"><span>Signed in: <strong>{profile.full_name || profile.email}</strong> · {profile.trustedRole || profile.role}</span><button type="button" onClick={signOut}>Sign out</button></div><App /></>
}

createRoot(
  document.getElementById('root')
).render(
  <AuthGate />
)
