import React, { useEffect, useMemo, useState } from 'react'
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
  CheckCircle2
} from 'lucide-react'
import { supabase } from './supabaseClient'
import './styles.css'

const items = [
  ['Dashboard', '◉'],
  ['Add Lead', '＋'],
  ['Open Lead', '□'],
  ['Assign', '⇥'],
  ['Reassign', '↻'],
  ['TPA QC', '✓'],
  ['QC', '✓'],
  ['QC Hold', 'Ⅱ'],
  ['Pricing', '₹'],
  ['Report Generated', '▣'],
  ['MIS', '▥'],
  ['Case Search', '⌕'],
  ['Users', '♟'],
  ['TPA Master', '▦'],
  ['Client Master', '▦'],
  ['MMV Master', '▦'],
  ['Location/Zone Master', '⌖'],
  ['Permissions', '✓'],
  ['Audit Trail', '◷'],
  ['Help Desk', '?']
]

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

  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState('')

  const [search, setSearch] = useState('')

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

    const { data, error } = await supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      console.error('Supabase cases error:', error)
      setDbError(error.message)
      setCases([])
    } else {
      setCases(data || [])
    }

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

  function openTpaQcCase(item) {
    setTpaQcCase(item)
    setActive('TPA QC')
    setTpaQcMessage('')
    setTpaQcForm(buildTpaQcForm(item))
  }

  function buildTpaQcForm(item) {
    return {
      registration_number: item?.registration_number || '', rto: item?.rto || '',
      manufacturing_date: item?.manufacturing_date || '', registration_date: item?.registration_date || '',
      owner_count: item?.owner_count || '', odometer: item?.odometer || '', fuel: item?.fuel || '', transmission: item?.transmission || '',
      color: item?.color || '', body_type: item?.body_type || '', engine_number: item?.engine_number || '', chassis_number: item?.chassis_number || '',
      loan_number: item?.loan_number || '', rc_available: item?.rc_available || '', insurance_type: item?.insurance_type || '', insurance_validity: item?.insurance_validity || '',
      insurance_expiry: item?.insurance_expiry || '', third_party_validity: item?.third_party_validity || '', hypothecation: item?.hypothecation || '', financier: item?.financier || '',
      cng_fitment: item?.cng_fitment || '', cng_category: item?.cng_category || '', road_tax_validity: item?.road_tax_validity || '', road_tax_date: item?.road_tax_date || '',
      customer_name: item?.customer_name || '', proposer_name: item?.proposer_name || '', client_name: item?.client_name || '', cng_validity: item?.cng_validity || '',
      key_available: item?.key_available || '', inspection_type: item?.inspection_type || 'Physical Inspection', inspection_site: item?.city || '', remarks: '',
      overall_score: '', body_score: '', exterior_score: '', light_score: '', tyre_score: '', other_score: '', condition: '', detailed: {}, media: {}
    }
  }

  function updateTpaQcField(key, value) {
    setTpaQcForm(prev => ({ ...prev, [key]: value }))
  }

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
    setTpaQcSaving(true)
    setTpaQcMessage('')
    try {
      if (submitToQc) {
        const { error } = await supabase.from('cases').update({ status: 'QC' }).eq('id', tpaQcCase.id).eq('status', 'PRE_QC')
        if (error) throw new Error(error.message)
        const { error: auditError } = await supabase.from('audit_trail').insert({
          case_id: tpaQcCase.case_id, action: 'Submitted to QC', stage: 'TPA QC', old_status: 'PRE_QC', new_status: 'QC',
          reason: null, remarks: tpaQcForm.remarks || null, user_id: null, user_name: 'SS Sundar Singh', role: 'Admin'
        })
        if (auditError) console.error('TPA QC submit audit error:', auditError)
        await loadCases()
        setTpaQcCase({ ...tpaQcCase, status: 'QC' })
        setTpaQcMessage('Report saved and submitted to QC successfully.')
      } else setTpaQcMessage('TPA QC report draft saved. PDF layout remains unchanged.')
    } catch (error) { setTpaQcMessage(error?.message || 'Unable to save TPA QC report.') }
    finally { setTpaQcSaving(false) }
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
      const { error } = await supabase
        .from('audit_trail')
        .insert({
          case_id: remarkCase.case_id,
          action: 'Remark Added',
          stage: 'OPEN',
          old_status: remarkCase.status || 'OPEN',
          new_status: remarkCase.status || 'OPEN',
          remarks: text
        })

      if (error) throw new Error(error.message)

      setRemarkCase(null)
      setRemarkText('')
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
            ([name, icon]) => (
              <button
                key={name}
                className={
                  active === name
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setActive(name)
                }
              >
                <i>{icon}</i>
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
                    {openLeads.map(item => (
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
                          <th>Customer</th>
                          <th>Registration No.</th>
                          <th>Vehicle</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cases
                          .filter(item => String(item.status || '').trim().toUpperCase() === 'OPEN')
                          .map(item => (
                            <tr key={item.id}>
                              <td><strong>CASE-{item.case_id}</strong></td>
                              <td>{item.customer_name || '—'}</td>
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

          <TpaQcReport
            caseItem={tpaQcCase}
            cases={cases}
            form={tpaQcForm}
            updateField={updateTpaQcField}
            setForm={setTpaQcForm}
            saving={tpaQcSaving}
            message={tpaQcMessage}
            onOpenCase={openTpaQcCase}
            onSave={() => saveTpaQcDraft(false)}
            onSubmit={() => saveTpaQcDraft(true)}
            onRemarks={() => tpaQcCase && openRemarkCase(tpaQcCase)}
            onReject={() => tpaQcCase && openRejectCase(tpaQcCase)}
            onHistory={() => tpaQcCase && openHistory(tpaQcCase)}
          />

        ) : (

          <section className="panel empty">

            <Database />

            <h2>{active}</h2>

            <p>
              Module ready for the next implementation stage.
            </p>

            <button
              className="primary"
              onClick={() => {
                setEditCase(null)
                setAdd(true)
              }}
            >
              ＋ Add Lead
            </button>

          </section>

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

function TpaQcReport({ caseItem, cases = [], form, updateField, setForm, saving, message, onOpenCase, onSave, onSubmit, onRemarks, onReject, onHistory }) {
  if (!caseItem) {
    const normalize = value => String(value || '').trim().toUpperCase().replace(/-/g, '_').replace(/\s+/g, '_')
    const tpaQcCases = cases.filter(item => normalize(item.status) === 'PRE_QC')

    return (
      <section className="panel" style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <h2 style={{ margin: 0 }}>TPA QC</h2>
            <p style={{ margin: '5px 0 0', color: '#64748b' }}>Cases moved from Assign/Reassign to TPA QC. Open a case below to continue the same inspection report.</p>
          </div>
          <span style={{ padding: '6px 10px', borderRadius: 999, background: '#E0F2F1', color: '#0f766e', fontWeight: 700, fontSize: 12 }}>
            {tpaQcCases.length} Pending
          </span>
        </div>

        {tpaQcCases.length === 0 ? (
          <div className="panel empty" style={{ marginTop: 10 }}>
            <Database />
            <h3>No TPA QC cases</h3>
            <p>Move a case from Assign/Reassign using the TPA QC action.</p>
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
                {tpaQcCases.map(item => (
                  <tr key={item.id}>
                    <td style={{ padding: '11px 8px', fontWeight: 700 }}>CASE-{item.case_id}</td>
                    <td style={{ padding: '11px 8px' }}>{item.customer_name || '—'}</td>
                    <td style={{ padding: '11px 8px' }}>{item.registration_number || '—'}</td>
                    <td style={{ padding: '11px 8px' }}>{[item.make, item.model, item.variant].filter(Boolean).join(' ') || '—'}</td>
                    <td style={{ padding: '11px 8px' }}>{item.assigned_tpa_name || '—'}</td>
                    <td style={{ padding: '11px 8px' }}><span style={{ padding: '4px 8px', borderRadius: 999, background: '#E0F2F1', color: '#0f766e', fontSize: 11, fontWeight: 700 }}>TPA QC</span></td>
                    <td style={{ padding: '11px 8px' }}>
                      <button type="button" className="primary" onClick={() => onOpenCase(item)}>Open TPA QC</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    )
  }

  const reportField = (label, key, disabled = false) => (
    <label style={{ display: 'grid', gridTemplateColumns: '145px 1fr', alignItems: 'center', gap: 8, fontSize: 10, minHeight: 27 }}>
      <span style={{ fontWeight: 700, color: '#222' }}>{label}</span>
      <input
        value={form[key] || ''}
        disabled={disabled}
        onChange={e => updateField(key, e.target.value)}
        style={{ width: '100%', boxSizing: 'border-box', height: 25, padding: '3px 6px', border: '1px solid #bdbdbd', borderRadius: 0, fontSize: 10, background: disabled ? '#f7f7f7' : '#fff' }}
      />
    </label>
  )

  const ratingOptions = ['Good', 'Scratched', 'Dented', 'Ok', 'Available', 'Not Available', 'Not Applicable']

  // Inspection rating -> score. "Not Applicable" is excluded from averages.
  const ratingToScore = {
    Good: 10,
    Ok: 10,
    Available: 10,
    Scratched: 7,
    Dented: 5,
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
    'Dashboard', 'Odometer Reading 1', 'Odometer Reading 2', 'ABC Pedals (from driver seat)', 'Selfie with Vehicle', 'Other Images 1', 'Other Images 2', 'Other Images 3',
    'VIN Plate Photo', 'Chassis Imprint 1', 'Chassis Imprint 2', 'Pencil Tracing 1', 'Pencil Tracing 2'
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
            <h2 style={{ margin: 0 }}>TPA QC — Vehicle Inspection Report</h2>
            <small>{caseItem.case_id} · {caseItem.registration_number || 'Registration not available'} · Single-page merged report</small>
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <button className="primary" type="button" onClick={onSave} disabled={saving}><Save size={15} /> {saving ? 'Saving...' : 'Save Draft'}</button>
            <button type="button" onClick={onRemarks}>Remarks</button>
            <button type="button" onClick={onReject}>Reject</button>
            <button type="button" onClick={onHistory}>History</button>
            <button className="primary" type="button" onClick={onSubmit} disabled={saving}>Submit to QC</button>
          </div>
        </div>
        {message && <div style={{ marginTop: 8, padding: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12 }}>{message}</div>}
      </div>

      <div style={reportShell}>
        {reportHeader}

        <div style={{ marginTop: 12, fontSize: 17, fontWeight: 800 }}>
          {[caseItem.make, caseItem.model, caseItem.variant].filter(Boolean).join(' ') || 'Vehicle Inspection'}
        </div>

        {section('A', 'Vehicle Details',
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 24, rowGap: 1 }}>
            {reportField('Registration No.', 'registration_number')}
            {reportField('RTO', 'rto')}
            {reportField('Manufacturing Date', 'manufacturing_date')}
            {reportField('Registration Date', 'registration_date')}
            {reportField('No. of Owners', 'owner_count')}
            {reportField('Odometer Reading', 'odometer')}
            {reportField('Fuel Type', 'fuel')}
            {reportField('Transmission', 'transmission')}
            {reportField('Color', 'color')}
            {reportField('Body Type', 'body_type')}
            {reportField('Engine Number', 'engine_number')}
            {reportField('Chassis Number', 'chassis_number')}
            {reportField('Loan No./Ref. No.', 'loan_number')}
            {reportField('RC Available', 'rc_available')}
            {reportField('Insurance Type', 'insurance_type')}
            {reportField('Insurance Validity', 'insurance_validity')}
            {reportField('Insurance Expiry', 'insurance_expiry')}
            {reportField('Third Party Validity', 'third_party_validity')}
            {reportField('Hypothecation', 'hypothecation')}
            {reportField('Financier', 'financier')}
            {reportField('CNG/LPG Fitment', 'cng_fitment')}
            {reportField('CNG/LPG Category', 'cng_category')}
            {reportField('Road Tax Validity', 'road_tax_validity')}
            {reportField('Road Tax Date', 'road_tax_date')}
            {reportField('Customer Name', 'customer_name')}
            {reportField('Client Name', 'client_name')}
            {reportField('CNG Validity Date', 'cng_validity')}
            {reportField('Key Available', 'key_available')}
            {reportField('Inspection Type', 'inspection_type')}
            {reportField('Inspection Site', 'inspection_site')}
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
              const imageSrc = typeof mediaItem === 'string' ? mediaItem : mediaItem?.dataUrl
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
                reader.onload = () => {
                  setForm(prev => ({
                    ...prev,
                    mediaError: '',
                    media: {
                      ...(prev.media || {}),
                      [name]: { name: file.name, type: file.type, size: file.size, dataUrl: reader.result }
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
                    {imageSrc ? <img src={imageSrc} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : <span style={{ fontSize: 9, color: '#888' }}>No Image</span>}
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

        {section('', 'Exterior Video',
          <div style={{ border: '1px dashed #c8c8c8', padding: 10, fontSize: 10 }}>
            <b>Exterior Video (Max 59s)</b>
            <div style={{ marginTop: 5, color: '#666' }}>Only exterior inspection video is allowed. Maximum duration: 59 seconds, MP4, maximum 30MB.</div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, cursor: 'pointer' }}><Upload size={12} /> Upload Exterior Video<input type="file" accept="image/*,video/mp4" style={{ display: 'none' }} /></label>
          </div>
        )}

        {section('E', 'Vahan Details',
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

createRoot(
  document.getElementById('root')
).render(
  <App />
)
