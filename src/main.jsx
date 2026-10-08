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

  useEffect(() => {
    loadCases()
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

  const counts = useMemo(() => {
    const normalize = value =>
      String(value || '')
        .trim()
        .toUpperCase()
        .replace(/-/g, '_')
        .replace(/\s+/g, '_')

    return {
      total: cases.length,
      open: cases.filter(x => normalize(x.status) === 'OPEN').length,
      assigned: cases.filter(x => normalize(x.status) === 'ASSIGNED').length,
      reassigned: cases.filter(x => normalize(x.status) === 'REASSIGNED').length,
      preQc: cases.filter(x => normalize(x.status) === 'PRE_QC').length,
      qcHold: cases.filter(x => normalize(x.status) === 'QC_HOLD').length
    }
  }, [cases])

  const recentCases = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return cases.slice(0, 10)

    return cases.filter(item =>
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
        .some(value => String(value).toLowerCase().includes(q))
    ).slice(0, 20)
  }, [cases, search])

  function formatDate(value) {
    if (!value) return '—'

    return new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  function displayStatus(status) {
    if (!status) return 'OPEN'

    return String(status)
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
  }

  return (
    <div className="app">

      <aside>
        <div className="brand">
          <b>CD</b>
          <span>
            <strong>CarDekho</strong>
            <small>Vehicle Inspection</small>
          </span>
        </div>

        <nav>
          {items.map(([name, icon]) => (
            <button
              key={name}
              className={active === name ? 'active' : ''}
              onClick={() => setActive(name)}
            >
              <i>{icon}</i>
              {name}
            </button>
          ))}
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
            <small>CarDekho Vehicle Inspection Portal</small>
          </div>

          <div className="tools">
            <label>
              ⌕
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by Lead ID, Registration No, Customer..."
              />
            </label>

            <button>
              <Bell />
            </button>

            <b>SS Sundar Singh · Admin</b>
          </div>
        </header>

        {active === 'Dashboard' ? (
          <>
            {dbError && (
              <div className="panel" style={{ marginBottom: 16 }}>
                <strong>Database connection error</strong>
                <p>{dbError}</p>
              </div>
            )}

            <div className="cards">

              <div className="card">
                <small>Total Cases</small>
                <strong>{loading ? '...' : counts.total}</strong>
                <em>Live database count</em>
              </div>

              <div className="card">
                <small>Open</small>
                <strong>{loading ? '...' : counts.open}</strong>
                <em>Live database count</em>
              </div>

              <div className="card">
                <small>Assigned</small>
                <strong>{loading ? '...' : counts.assigned}</strong>
                <em>Live database count</em>
              </div>

              <div className="card">
                <small>Reassigned</small>
                <strong>{loading ? '...' : counts.reassigned}</strong>
                <em>Live database count</em>
              </div>

              <div className="card">
                <small>Pre QC</small>
                <strong>{loading ? '...' : counts.preQc}</strong>
                <em>Live database count</em>
              </div>

              <div className="card">
                <small>QC Hold</small>
                <strong>{loading ? '...' : counts.qcHold}</strong>
                <em>Live database count</em>
              </div>

            </div>

            <div className="cols">

              <section className="panel">
                <h2>Lead Status Overview</h2>
                <p>Current case distribution</p>

                <div className="donut">
                  <strong>{loading ? '...' : counts.total}</strong>
                  <small>Total</small>
                </div>
              </section>

              <section className="panel">
                <h2>Today's Activity</h2>
                <p>Operational snapshot</p>

                <div className="row">
                  <span>Submitted to QC</span>
                  <b>
                    {cases.filter(x =>
                      ['QC', 'QC_APPROVED', 'PRICING', 'COMPLETED', 'REPORT_GENERATED']
                        .includes(
                          String(x.status || '')
                            .toUpperCase()
                            .replace(/-/g, '_')
                        )
                    ).length}
                  </b>
                </div>

                <div className="row">
                  <span>QC Approved</span>
                  <b>
                    {cases.filter(x =>
                      String(x.status || '').toUpperCase() === 'QC_APPROVED'
                    ).length}
                  </b>
                </div>

                <div className="row">
                  <span>Pricing Pending</span>
                  <b>
                    {cases.filter(x =>
                      String(x.status || '').toUpperCase() === 'PRICING'
                    ).length}
                  </b>
                </div>

                <div className="row">
                  <span>Completed</span>
                  <b>
                    {cases.filter(x =>
                      String(x.status || '').toUpperCase() === 'COMPLETED'
                    ).length}
                  </b>
                </div>

                <div className="row">
                  <span>TAT Breached</span>
                  <b>0</b>
                </div>
              </section>

              <section className="panel">
                <h2>Quick Actions</h2>

                <button
                  className="quick"
                  onClick={() => setAdd(true)}
                >
                  ＋ Add Lead
                </button>

                <button
                  className="quick"
                  onClick={() => setActive('Open Lead')}
                >
                  □ Open Lead
                </button>

                <button
                  className="quick"
                  onClick={() => setActive('Case Search')}
                >
                  ⌕ Case Search
                </button>

                <button
                  className="quick"
                  onClick={() => setActive('MIS')}
                >
                  ▥ MIS
                </button>
              </section>

            </div>

            <section className="panel table">

              <h2>Recent Leads</h2>

              {loading ? (
                <p>Loading cases from Supabase...</p>
              ) : recentCases.length === 0 ? (
                <p>
                  No cases found in Supabase.
                  <br />
                  Once a lead is created, it will appear here automatically.
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
                    {recentCases.map(item => (
                      <tr key={item.id}>

                        <td>
                          CASE-{item.case_id}
                        </td>

                        <td>
                          {item.customer_name || '—'}
                        </td>

                        <td>
                          {[item.make, item.model, item.variant]
                            .filter(Boolean)
                            .join(' ') || '—'}
                        </td>

                        <td>
                          <span className="status">
                            {displayStatus(item.status)}
                          </span>
                        </td>

                        <td>
                          {formatDate(item.created_at)}
                        </td>

                        <td>
                          <button
                            onClick={() => setHist(true)}
                          >
                            <Eye />
                          </button>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </section>

          </>
        ) : (

          <section className="panel empty">

            <Database />

            <h2>{active}</h2>

            <p>
              Starter module ready for the next implementation stage.
            </p>

            <button
              className="primary"
              onClick={() => setAdd(true)}
            >
              ＋ Add Lead
            </button>

          </section>

        )}

        {add && (
          <Modal
            title="Add Lead"
            close={() => setAdd(false)}
          >
            <div className="form">
              <p>
                Add Lead module will be connected to the
                Supabase cases table in the next step.
              </p>

              <button
                className="primary"
                onClick={() => setAdd(false)}
              >
                Close
              </button>
            </div>
          </Modal>
        )}

        {hist && (
          <Modal
            title="Case History"
            close={() => setHist(false)}
          >
            <div className="history">
              <p>
                <b>History module</b>
                <small>
                  Full audit trail will be connected in the next stage.
                </small>
              </p>
            </div>
          </Modal>
        )}

      </main>
    </div>
  )
}

function Modal({ title, close, children }) {
  return (
    <div className="overlay">
      <div className="modal">

        <header>
          <h2>{title}</h2>

          <button onClick={close}>
            <X />
          </button>
        </header>

        {children}

      </div>
    </div>
  )
}

createRoot(
  document.getElementById('root')
).render(
  <App />
)
