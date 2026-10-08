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
  MessageSquare
} from 'lucide-react'
import { supabase } from './supabaseClient'
import './styles.css'

const items = [
  ['Dashboard', '◉'],
  ['Add Lead', '＋'],
  ['Open Lead', '□'],
  ['Assign', '⇥'],
  ['Reassign', '↻'],
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
  const [actionError, setActionError] = useState('')
  const [actionSaving, setActionSaving] = useState(false)

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
    const { data, error } = await supabase
      .from('tpa_master')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('TPA master error:', error)
      setTpas([])
    } else {
      setTpas(data || [])
    }
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

      if (!tpa) throw new Error('Selected TPA is not available.')

      const { data: updatedCase, error: caseError } = await supabase
        .from('cases')
        .update({
          status: 'ASSIGNED',
          assigned_tpa_id: tpa.id,
          assigned_tpa_name: tpa.name
        })
        .eq('id', assignCase.id)
        .eq('status', 'OPEN')
        .select()
        .single()

      if (caseError) throw new Error(caseError.message)

      const { error: historyError } = await supabase
        .from('assignment_history')
        .insert({
          case_id: assignCase.case_id,
          old_tpa: null,
          new_tpa: tpa.name,
          assigned_by: 'SS Sundar Singh',
          role: 'Admin',
          reason: assignReason.trim() || null,
          remarks: assignRemarks.trim() || null
        })

      if (historyError) throw new Error(historyError.message)

      const { error: auditError } = await supabase
        .from('audit_trail')
        .insert({
          case_id: assignCase.case_id,
          action: 'Assigned',
          stage: 'OPEN',
          old_status: 'OPEN',
          new_status: 'ASSIGNED',
          reason: assignReason.trim() || null,
          remarks: assignRemarks.trim() || null
        })

      if (auditError) throw new Error(auditError.message)

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

  function openRejectCase(item) {
    setActionError('')
    setRejectReason('')
    setRejectRemarks('')
    setRejectCase(item)
  }

  async function rejectOpenCase() {
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

    setActionSaving(true)
    setActionError('')

    try {
      const { data, error } = await supabase
        .from('cases')
        .update({ status: 'REJECTED' })
        .eq('id', rejectCase.id)
        .eq('status', 'OPEN')
        .select()
        .single()

      if (error) throw new Error(error.message)

      const { error: auditError } = await supabase
        .from('audit_trail')
        .insert({
          case_id: rejectCase.case_id,
          action: 'Rejected',
          stage: 'OPEN',
          old_status: 'OPEN',
          new_status: 'REJECTED',
          reason,
          remarks: remarks || null
        })

      if (auditError) throw new Error(auditError.message)

      setRejectCase(null)
      setRejectReason('')
      setRejectRemarks('')
      await loadCases()
    } catch (error) {
      console.error('Reject lead error:', error)
      setActionError(error?.message || 'Unable to reject lead.')
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

              <div className="card">
                <small>Pre QC</small>
                <strong>
                  {loading
                    ? '...'
                    : counts.preQc}
                </strong>
                <em>
                  Live database count
                </em>
              </div>

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
                  {tpas
                    .filter(tpa => tpa.is_active)
                    .map(tpa => (
                      <option key={tpa.id} value={tpa.id}>
                        {tpa.name} — {tpa.mobile}
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

            {tpas.filter(tpa => tpa.is_active).length === 0 && (
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
                <strong>Unable to reject lead</strong>
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
              <strong>Rejecting this OPEN lead</strong>
              <p style={{ marginBottom: 0 }}>
                The case will move from OPEN to REJECTED and the rejection
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
                onClick={rejectOpenCase}
                disabled={actionSaving}
              >
                {actionSaving ? 'Rejecting...' : 'Reject Lead'}
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

                  <p>
                    <b>Audit Trail</b>
                    <small>
                      Detailed immutable audit events will be
                      connected in the Audit Trail stage.
                    </small>
                  </p>
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
