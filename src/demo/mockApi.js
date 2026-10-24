import {
  buildAttendance, buildDemoUser, buildEmployees, buildLeaveRequests, buildNotifications, buildUsers,
  DEMO_USER_ID, DEPARTMENTS, LOCATIONS, shiftDate, today,
} from './data'

// Demo mode answers every API call in the browser from sample data, so the
// app can be deployed as a live preview with no backend. Data resets on reload.

export const DEMO_CREDENTIALS = { email: 'admin@nova-demo.dev', password: 'demo1234' }
const DEMO_TOKEN = 'demo-token'

const employees = buildEmployees()
const users = buildUsers(employees)
const demoUser = buildDemoUser()
let leaveRequests = buildLeaveRequests(employees)
let notifications = buildNotifications()
const attendanceCache = new Map()
let nextId = 5000

const findEmployee = (id) => employees.find(e => e.id === Number(id))
const brief = ({ id, name, position, department, user_id, work_location }) => ({ id, name, position, department, user_id, work_location })

const attendanceFor = (date) => {
  if (!attendanceCache.has(date)) attendanceCache.set(date, buildAttendance(employees, date))
  return attendanceCache.get(date)
}

const countBy = (list, key) => list.reduce((acc, item) => {
  const value = item[key] ?? 'Unassigned'
  acc[value] = (acc[value] ?? 0) + 1
  return acc
}, {})

const filterEmployees = (params) => {
  const search = (params.get('search') || '').toLowerCase()
  return employees.filter(e =>
    (!params.get('department') || params.get('department') === 'all' || e.department === params.get('department')) &&
    (!params.get('location') || params.get('location') === 'all' || e.work_location === params.get('location')) &&
    (!params.get('status') || params.get('status') === 'all' || e.status === params.get('status')) &&
    (!params.get('category') || params.get('category') === 'all' || e.category === params.get('category')) &&
    (!search || [e.name, e.position, e.department, e.ibs_code, e.punch_code].some(v => String(v).toLowerCase().includes(search)))
  )
}

const paginate = (list, params) => {
  const perPage = Number(params.get('per_page') || 12)
  const page = Number(params.get('page') || 1)
  const lastPage = Math.max(1, Math.ceil(list.length / perPage))
  const start = (page - 1) * perPage
  return {
    data: list.slice(start, start + perPage),
    pagination: { total: list.length, per_page: perPage, current_page: page, last_page: lastPage, from: list.length ? start + 1 : null, to: Math.min(start + perPage, list.length) },
  }
}

const notificationPayload = () => {
  const unread = notifications.filter(n => !n.read_at).length
  return { success: true, items: notifications, hasMore: false, unreadCount: unread, criticalCount: 0, data: notifications, unread_count: unread }
}

const upcomingBirthdays = () => {
  const now = new Date()
  return employees
    .filter(e => {
      const birth = new Date(`${e.birth_date}T00:00:00`)
      return birth.getMonth() === now.getMonth() && Math.abs(birth.getDate() - now.getDate()) <= 1
    })
    .map(e => ({ id: e.id, name: e.name, position: e.position, department: e.department, date_label: 'Today', user: null }))
}

const leaveActions = {
  approve: (r) => Object.assign(r, { status: 'approved', approved_at: new Date().toISOString(), approver: { id: demoUser.id, name: demoUser.name, role: 'admin' } }),
  'manager-approve': (r) => Object.assign(r, { status: 'manager_approved', manager_approved_at: new Date().toISOString(), manager_approver: { id: demoUser.id, name: demoUser.name } }),
  'hr-approve': (r) => Object.assign(r, { status: 'hr_approved', hr_approved_at: new Date().toISOString(), hr_approver: { id: demoUser.id, name: demoUser.name } }),
  reject: (r, body) => Object.assign(r, { status: 'rejected', rejected_at: new Date().toISOString(), rejection_reason: body.reason || body.rejection_reason || 'Rejected in demo' }),
  cancel: (r) => Object.assign(r, { status: 'cancelled', cancelled_at: new Date().toISOString() }),
  'cancel-approved': (r) => Object.assign(r, { status: 'cancellation_pending' }),
  'approve-cancellation': (r) => Object.assign(r, { status: 'cancelled', cancelled_at: new Date().toISOString() }),
  'reject-cancellation': (r) => Object.assign(r, { status: 'approved' }),
  'request-amendment': (r) => Object.assign(r, { status: 'amendment_pending' }),
  'approve-amendment': (r) => Object.assign(r, { status: 'approved' }),
  'reject-amendment': (r) => Object.assign(r, { status: 'approved' }),
  archive: (r) => Object.assign(r, { archived: true }),
  reschedule: (r, body) => Object.assign(r, { start_date: body.start_date ?? r.start_date, end_date: body.end_date ?? r.end_date }),
}

function route(method, path, params, body, authorized) {
  let m

  // ── auth ──
  if (method === 'POST' && path === '/auth/login') {
    return body.email === DEMO_CREDENTIALS.email && body.password === DEMO_CREDENTIALS.password
      ? [200, { user: demoUser, token: DEMO_TOKEN }]
      : [401, { message: 'Invalid credentials' }]
  }
  if (!authorized) return [401, { message: 'Unauthenticated.' }]

  if (path === '/auth/logout') return [200, { message: 'Logged out' }]
  if (method === 'GET' && path === '/auth/me') return [200, demoUser]
  if (method === 'GET' && path === '/user/me') return [200, { success: true, data: demoUser }]
  if (/profile-photo$/.test(path) || /signature$/.test(path)) {
    return method === 'GET' ? [404, { message: 'No file' }] : [200, { success: true, data: demoUser }]
  }

  // ── employees ──
  if (method === 'GET' && path === '/employees') return [200, paginate(filterEmployees(params), params)]
  if (method === 'GET' && path === '/employees/stats') {
    const list = params.get('view') === 'all' ? employees : employees.filter(e => e.status !== 'resigned')
    return [200, {
      total: list.length,
      by_department: countBy(list, 'department'),
      by_location: countBy(list, 'work_location'),
      by_status: countBy(list, 'status'),
      by_category: countBy(list, 'category'),
      locations: [...new Set(list.map(e => e.work_location))].sort(),
      missing_docs: 3,
    }]
  }
  if (method === 'GET' && path === '/employees/org-chart') return [200, employees]
  if (method === 'GET' && path === '/employees/upcoming-birthdays') return [200, upcomingBirthdays()]
  if (method === 'GET' && path === '/employees/autocomplete') {
    const q = (params.get('search') || '').toLowerCase()
    return [200, employees.filter(e => e.name.toLowerCase().includes(q)).slice(0, 8).map(brief)]
  }
  if (method === 'GET' && path === '/employees/export') return [200, { success: true, message: 'Export is disabled in the demo.' }]
  if ((m = path.match(/^\/employees\/(\d+)\/form-profile$/))) {
    const e = findEmployee(m[1])
    return e ? [200, { success: true, data: { ...e, direct_manager: e.direct_manager } }] : [404, { message: 'Not found' }]
  }
  if ((m = path.match(/^\/employees\/(\d+)\/manager$/))) {
    const e = findEmployee(m[1])
    if (e) {
      e.direct_manager_id = body.direct_manager_id ?? body.manager_id ?? null
      const mgr = findEmployee(e.direct_manager_id)
      e.direct_manager = mgr ? brief(mgr) : null
    }
    return [200, { success: true, data: e }]
  }
  if ((m = path.match(/^\/employees\/(\d+)$/))) {
    const e = findEmployee(m[1])
    if (!e) return [404, { message: 'Employee not found' }]
    if (method === 'GET') return [200, { ...e, data: e }]
    if (method === 'PUT') { Object.assign(e, body); return [200, { success: true, data: e }] }
    if (method === 'DELETE') { employees.splice(employees.indexOf(e), 1); return [200, { success: true }] }
  }
  if (method === 'POST' && path === '/employees') {
    if (!body.name) return [422, { message: 'The name field is required.', errors: { name: ['The name field is required.'] } }]
    const e = { ...body, id: nextId++, status: body.status || 'active', direct_manager: null, created_at: today() }
    employees.push(e)
    return [201, { success: true, data: e }]
  }

  // ── users ──
  if (method === 'GET' && path === '/users') return [200, users]
  if (method === 'GET' && path === '/users/managers') return [200, users.filter(u => ['manager', 'general_manager', 'hr'].includes(u.role))]
  if (method === 'GET' && path === '/users/general-manager') return [200, users[0]]
  if (method === 'GET' && path === '/users/hr-officer') return [200, users[1]]
  if ((m = path.match(/^\/users\/(\d+)\/assigned-employees$/))) {
    return [200, employees.filter(e => e.direct_manager_id === Number(m[1]))]
  }

  // ── leave & overtime requests ──
  if (method === 'GET' && path === '/leave-requests/calendar') {
    return [200, { success: true, data: leaveRequests.filter(r => r.type === 'lrf' && r.status === 'approved') }]
  }
  if (method === 'GET' && path === '/leave-requests') {
    const type = params.get('type')
    const status = params.get('status')
    const items = leaveRequests.filter(r => !r.archived && (!type || type === 'all' || r.type === type) && (!status || status === 'all' || r.status === status))
    return [200, { success: true, data: items }]
  }
  if (method === 'POST' && path === '/leave-requests') {
    const employee = findEmployee(body.employee_id) || employees[10]
    const request = {
      ...leaveRequests[0], ...body,
      id: nextId++, status: 'pending', employee_id: employee.id, employee_name: employee.name, user_id: employee.user_id,
      job_title: employee.position, department: employee.department,
      employee: brief(employee), user: { id: employee.user_id, name: employee.name },
      tracking_no: `${body.type === 'otr' ? 'OTR' : 'LRF'}-${new Date().getFullYear()}-${nextId}`,
      created_at: new Date().toISOString(), request_date: today(),
      manager_approved_at: null, manager_approver: null, hr_approved_at: null, hr_approver: null, approved_at: null, approver: null, rejected_at: null, rejection_reason: null,
    }
    leaveRequests = [request, ...leaveRequests]
    return [201, { success: true, data: request, message: 'Request submitted.' }]
  }
  if ((m = path.match(/^\/leave-requests\/(\d+)(?:\/([a-z-]+))?$/))) {
    const request = leaveRequests.find(r => r.id === Number(m[1]))
    if (!request) return [404, { message: 'Request not found' }]
    const action = m[2]
    if (!action || action === 'details') {
      if (method === 'GET') return [200, { success: true, data: request }]
      if (method === 'PUT') { Object.assign(request, body); return [200, { success: true, data: request }] }
      if (method === 'DELETE') { leaveRequests = leaveRequests.filter(r => r !== request); return [200, { success: true }] }
    }
    if (action === 'tracking-no') { request.tracking_no = body.tracking_no ?? request.tracking_no; return [200, { success: true, data: request }] }
    if (leaveActions[action]) {
      leaveActions[action](request, body)
      return [200, { success: true, data: request, message: 'Done.' }]
    }
  }

  // ── attendance ──
  if (method === 'GET' && path === '/attendance/dashboard-week') {
    const days = Array.from({ length: 7 }, (_, i) => shiftDate(i - 6))
    const data = days.map(date => {
      const rows = attendanceFor(date)
      if (!rows.length) return { date, present: 0, absent: 0, leave: 0 }
      return { date, present: rows.length, absent: Math.max(0, employees.length - rows.length - 1), leave: 1 }
    })
    return [200, { success: true, data, recognition: employees.slice(8, 13).map(e => ({ employee_id: e.id, name: e.name, position: e.position, present: 6, late: 0 })) }]
  }
  if (method === 'GET' && path === '/attendance') {
    const date = params.get('date') || today()
    let rows
    if (params.get('start_date') && params.get('end_date')) {
      rows = []
      for (let d = params.get('start_date'); d <= params.get('end_date'); d = shiftDate(1, new Date(`${d}T00:00:00`))) rows.push(...attendanceFor(d))
    } else {
      rows = attendanceFor(date)
    }
    if (params.get('employee_id')) rows = rows.filter(r => r.employee_id === Number(params.get('employee_id')))
    const onLeave = leaveRequests.filter(r => r.type === 'lrf' && r.status === 'approved' && r.start_date <= date && r.end_date >= date)
    return [200, { success: true, data: rows, leaves: onLeave, otrs: [], holidays: [], total_workforce: employees.filter(e => e.status === 'active').length }]
  }
  if ((m = path.match(/^\/attendance\/summary\/(\d+)$/))) {
    const rows = Array.from({ length: 22 }, (_, i) => attendanceFor(shiftDate(-i))).flat().filter(r => r.employee_id === Number(m[1]))
    return [200, { success: true, data: {
      summary: {
        total_days: rows.length,
        present_days: rows.filter(r => r.status === 'present').length,
        absent_days: 0,
        late_days: rows.filter(r => r.status === 'late').length,
        wfh_days: rows.filter(r => r.status === 'wfh').length,
        total_work_hours: Number(rows.reduce((s, r) => s + r.work_hours, 0).toFixed(1)),
        total_overtime_hours: Number(rows.reduce((s, r) => s + r.overtime_hours, 0).toFixed(1)),
        total_late_minutes: rows.reduce((s, r) => s + r.late_minutes, 0),
      },
      attendances: rows,
    } }]
  }
  if (/^\/attendance\/(absence|late)-deductions\//.test(path)) return [200, { success: true, data: { total_hours: 0, items: [] } }]
  if ((m = path.match(/^\/attendance\/(\d+)$/)) && method === 'DELETE') return [200, { success: true }]

  // ── notifications ──
  if (method === 'GET' && path === '/notifications') return [200, notificationPayload()]
  if (path === '/notifications/read-all') {
    notifications = notifications.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    return [200, { success: true }]
  }
  if ((m = path.match(/^\/notifications\/(\d+)\/(read|action)$/))) {
    notifications = notifications.map(n => n.id === Number(m[1]) ? { ...n, read_at: new Date().toISOString() } : n)
    return [200, { success: true }]
  }
  if ((m = path.match(/^\/notifications\/(\d+)$/)) && method === 'DELETE') {
    notifications = notifications.filter(n => n.id !== Number(m[1]))
    return [200, { success: true }]
  }
  if (path === '/notifications/preferences') return [200, { success: true, data: {} }]

  // ── lookups, positions, settings ──
  if (method === 'GET' && (path === '/lookups/all' || path === '/lookups')) {
    const lookup = (type, offset) => (key, i) => ({ id: offset + i, type, key, label_en: key, label_ar: null, sort: i, is_active: true })
    return [200, {
      department: DEPARTMENTS.map(lookup('department', 1)),
      location: LOCATIONS.map(lookup('location', 20)),
      category: ['Staff', 'Technical', 'Labour'].map(lookup('category', 40)),
      role: ['admin', 'general_manager', 'hr', 'manager', 'staff'].map(lookup('role', 60)),
    }]
  }
  if (method === 'GET' && (path === '/positions' || path === '/positions/all')) {
    return [200, [...new Set(employees.map(e => e.position))].map((name, i) => ({ id: i + 1, name, name_arabic: null }))]
  }
  if (method === 'GET' && path === '/settings') return [200, { success: true, data: {} }]
  if (method === 'GET' && path === '/settings/managers') return [200, { success: true, data: users.filter(u => u.role === 'manager') }]

  // Anything else: reads return empty data, writes succeed without changing anything.
  return method === 'GET'
    ? [200, { success: true, data: [] }]
    : [200, { success: true, message: 'Saved (demo mode).' }]
}

const readBody = async (body) => {
  if (!body) return {}
  if (body instanceof FormData) return Object.fromEntries(body.entries())
  if (typeof body === 'string') {
    try { return JSON.parse(body) } catch { return {} }
  }
  return {}
}

export function installMockApi(apiBase) {
  const realFetch = window.fetch.bind(window)
  const base = new URL(apiBase, window.location.origin)

  window.fetch = async (input, init = {}) => {
    const request = input instanceof Request ? input : null
    const url = new URL(request ? request.url : String(input), window.location.origin)
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return realFetch(input, init)

    const method = (init.method || request?.method || 'GET').toUpperCase()
    const headers = new Headers(init.headers || request?.headers || {})
    const authorized = (headers.get('Authorization') || '').includes(DEMO_TOKEN)
    const path = url.pathname.slice(base.pathname.replace(/\/$/, '').length) || '/'
    const body = await readBody(init.body ?? (request && method !== 'GET' ? await request.clone().text() : null))

    const [status, data] = route(method, path, url.searchParams, body, authorized)
    await new Promise(resolve => setTimeout(resolve, 120))
    return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
  }
}

export { DEMO_USER_ID }
