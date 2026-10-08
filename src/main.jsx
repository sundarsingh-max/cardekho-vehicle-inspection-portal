import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Bell,
  Database,
  Eye,
  X
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

  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState('')

  const [search, setSearch] = useState('')

  const [clients, setClients] = useState([])
  const [mmv, setMmv] = useState([])
  const [locations, setLocations] = useState([])

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

  const segments = [
    'CAR',
    'CV',
    'FE',
    '3WLR',
    '2WLR',
    'CE'
  ]

  const mmvHasSegment = useMemo(() => {
    return mmv.some(row =>
      String(
        firstValue(row, [
          'segment',
          'Segment',
          'SEGMENT',
          'vehicle_segment',
          'VEHICLE_SEGMENT'
        ]) || ''
      ).trim() !== ''
    )
  }, [mmv])

  const mmvRowsForSelection = useMemo(() => {
    return mmv.filter(row => {
      const rowSegment = firstValue(row, [
        'segment',
        'Segment',
        'SEGMENT',
        'vehicle_segment',
        'VEHICLE_SEGMENT'
      ])

      if (!form.segment || !mmvHasSegment) return true

      return (
        String(rowSegment || '').trim().toUpperCase() ===
        String(form.segment).trim().toUpperCase()
      )
    })
  }, [mmv, mmvHasSegment, form.segment])

  const makes = useMemo(() => {
    return uniqueValues(
      mmvRowsForSelection.map(row =>
        firstValue(row, [
          'make',
          'MAKE',
          'Make'
        ])
      )
    )
  }, [mmvRowsForSelection])

  const models = useMemo(() => {
    return uniqueValues(
      mmvRowsForSelection
        .filter(row => {
          const rowMake = firstValue(row, [
            'make',
            'MAKE',
            'Make'
          ])

          return (
            !form.make ||
            String(rowMake || '').trim().toUpperCase() ===
              String(form.make).trim().toUpperCase()
          )
        })
        .map(row =>
          firstValue(row, [
            'model',
            'MODEL',
            'Model'
          ])
        )
    )
  }, [mmvRowsForSelection, form.make])

  const variants = useMemo(() => {
    return uniqueValues(
      mmvRowsForSelection
        .filter(row => {
          const rowMake = firstValue(row, [
            'make',
            'MAKE',
            'Make'
          ])

          const rowModel = firstValue(row, [
            'model',
            'MODEL',
            'Model'
          ])

          return (
            (!form.make ||
              String(rowMake || '').trim().toUpperCase() ===
                String(form.make).trim().toUpperCase()) &&
            (!form.model ||
              String(rowModel || '').trim().toUpperCase() ===
                String(form.model).trim().toUpperCase())
          )
        })
        .map(row =>
          firstValue(row, [
            'variant',
            'VARIANT',
            'Variant'
          ])
        )
    )
  }, [mmvRowsForSelection, form.make, form.model])

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const result = []

    for (let year = currentYear; year >= 2000; year--) {
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
        ) : active === 'Add Lead' ? (

          <section className="panel empty">

            <Database />

            <h2>
              Add Lead
            </h2>

            <p>
              Create a new vehicle
              inspection case.
            </p>

            <button
              className="primary"
              onClick={() =>
                setAdd(true)
              }
            >
              ＋ Add Lead
            </button>

          </section>

        ) : (

          <section className="panel empty">

            <Database />

            <h2>
              {active}
            </h2>

            <p>
              Module ready for the
              next implementation stage.
            </p>

            <button
              className="primary"
              onClick={() =>
                setAdd(true)
              }
            >
              ＋ Add Lead
            </button>

          </section>

        )}

        {add && (

          <Modal
            title="Add Lead"
            close={() => {
              if (!savingLead) {
                setAdd(false)
                setFormError('')
                setFormSuccess('')
              }
            }}
          >

            <form
              className="form"
              onSubmit={saveLead}
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
                  value="Auto-generated"
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
                  onClick={() =>
                    setAdd(false)
                  }
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
                    ? 'Saving Lead...'
                    : 'Create Lead'}
                </button>

              </div>

            </form>

          </Modal>
        )}

        {hist && (

          <Modal
            title="Case History"
            close={() =>
              setHist(false)
            }
          >

            <div className="history">

              <p>
                <b>
                  History module
                </b>

                <small>
                  Full audit trail will
                  be connected in the
                  next stage.
                </small>
              </p>

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
