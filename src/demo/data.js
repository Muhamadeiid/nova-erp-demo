// Fictional sample data for the in-browser demo. Every name, phone number
// and ID below is made up.

const DEPARTMENTS = ['Operations', 'Engineering', 'Human Resources', 'Finance', 'IT', 'Procurement']
const LOCATIONS = ['Head Office', 'North Site', 'South Site', 'Field Ops']

const PEOPLE = [
  ['Sarah Mitchell', 'General Manager', 'Operations', 'Head Office'],
  ['Layla Hassan', 'HR Manager', 'Human Resources', 'Head Office'],
  ['Daniel Brooks', 'Operations Manager', 'Operations', 'North Site'],
  ['Nadia Farouk', 'Engineering Manager', 'Engineering', 'Head Office'],
  ['Omar Saleh', 'Finance Manager', 'Finance', 'Head Office'],
  ['Priya Raman', 'IT Manager', 'IT', 'Head Office'],
  ['Marco Rossi', 'Procurement Lead', 'Procurement', 'Head Office'],
  ['Hana Kim', 'HR Specialist', 'Human Resources', 'Head Office'],
  ['Youssef Adel', 'Shift Supervisor', 'Operations', 'North Site'],
  ['Emma Clarke', 'Shift Supervisor', 'Operations', 'South Site'],
  ['Karim Nabil', 'Technician', 'Operations', 'North Site'],
  ['Lucas Meyer', 'Technician', 'Operations', 'North Site'],
  ['Aisha Khan', 'Technician', 'Operations', 'South Site'],
  ['Tom Walker', 'Technician', 'Operations', 'South Site'],
  ['Mona Samir', 'Technician', 'Operations', 'Field Ops'],
  ['Ali Hamdy', 'Technician', 'Operations', 'Field Ops'],
  ['Sofia Lopez', 'Senior Engineer', 'Engineering', 'Head Office'],
  ['Ahmed Fathy', 'Electrical Engineer', 'Engineering', 'North Site'],
  ['Grace Liu', 'Mechanical Engineer', 'Engineering', 'South Site'],
  ['Mostafa Ezz', 'Reliability Engineer', 'Engineering', 'Head Office'],
  ['Chloe Martin', 'Planning Engineer', 'Engineering', 'Head Office'],
  ['Rana Tarek', 'Accountant', 'Finance', 'Head Office'],
  ['James Wilson', 'Payroll Officer', 'Finance', 'Head Office'],
  ['Mariam Lotfy', 'Accountant', 'Finance', 'Head Office'],
  ['Noah Becker', 'Systems Administrator', 'IT', 'Head Office'],
  ['Salma Reda', 'Support Specialist', 'IT', 'North Site'],
  ['Ethan Davis', 'Developer', 'IT', 'Head Office'],
  ['Farida Nour', 'Buyer', 'Procurement', 'Head Office'],
  ['Hassan Ibrahim', 'Storekeeper', 'Procurement', 'North Site'],
  ['Olivia Brown', 'Storekeeper', 'Procurement', 'South Site'],
  ['Kareem Mansour', 'Technician', 'Operations', 'North Site'],
  ['Isabella Rossi', 'Recruiter', 'Human Resources', 'Head Office'],
  ['Mahmoud Sherif', 'Driver', 'Operations', 'Field Ops'],
  ['Zeina Khalil', 'Quality Inspector', 'Engineering', 'South Site'],
  ['Ryan Cooper', 'Safety Officer', 'Operations', 'Head Office'],
  ['Dina Mostafa', 'Office Coordinator', 'Human Resources', 'Head Office'],
]

// Department managers by department (index into PEOPLE).
const DEPT_MANAGER = { Operations: 2, Engineering: 3, Finance: 4, IT: 5, Procurement: 6, 'Human Resources': 1 }

const pad = (n, size = 2) => String(n).padStart(size, '0')
const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export const today = () => isoDate(new Date())
export const shiftDate = (days, base = new Date()) => {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return isoDate(d)
}

// Small deterministic random generator so the demo looks the same on every load.
let seed = 42
const rand = () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
const pick = (list) => list[Math.floor(rand() * list.length)]

export function buildEmployees() {
  return PEOPLE.map(([name, position, department, location], index) => {
    const id = index + 1
    const managerIndex = index === 0 ? null : (index === DEPT_MANAGER[department] ? 0 : DEPT_MANAGER[department])
    const hiring = new Date(2019 + Math.floor(rand() * 6), Math.floor(rand() * 12), 1 + Math.floor(rand() * 27))
    const birth = new Date(1975 + Math.floor(rand() * 25), Math.floor(rand() * 12), 1 + Math.floor(rand() * 27))
    return {
      id,
      user_id: id,
      ibs_code: `EMP-${pad(id, 4)}`,
      punch_code: String(1000 + id),
      client_code: `C-${pad(id, 3)}`,
      name,
      arabic_name: null,
      position,
      position_id: null,
      department,
      work_location: location,
      city: pick(['Downtown', 'East District', 'West District', 'New City']),
      hiring_date: isoDate(hiring),
      birth_date: isoDate(birth),
      phone: `+00 100 000 ${pad(id, 4)}`,
      category: index < 8 ? 'Staff' : pick(['Staff', 'Technical', 'Labour']),
      status: id === 33 ? 'on_leave' : 'active',
      insurance_status: pick(['insured', 'insured', 'pending']),
      contract_start: isoDate(hiring),
      contract_end: null,
      direct_manager_id: managerIndex === null ? null : managerIndex + 1,
      user_role: index === 0 ? 'general_manager' : index === 1 ? 'hr' : Object.values(DEPT_MANAGER).includes(index) ? 'manager' : 'staff',
      e_signature: null,
      weekly_off_day: 'friday',
      saturday_group: null,
      created_at: isoDate(hiring),
    }
  }).map((employee, _, all) => ({
    ...employee,
    direct_manager: all.find(e => e.id === employee.direct_manager_id)
      ? (({ id, name, position, user_id }) => ({ id, name, position, user_id }))(all.find(e => e.id === employee.direct_manager_id))
      : null,
  }))
}

export function buildUsers(employees) {
  return employees.map(employee => ({
    id: employee.user_id,
    name: employee.name,
    email: `${employee.name.toLowerCase().replace(/[^a-z]+/g, '.')}@nova-demo.dev`,
    role: employee.user_role === 'staff' ? 'staff' : employee.user_role,
    department: employee.department,
    is_active: true,
    is_team_manager: employee.user_role === 'manager',
    e_signature: null,
    has_profile_photo: false,
    manager_id: employee.direct_manager_id,
    employee_id: employee.id,
    employee: { id: employee.id, name: employee.name, position: employee.position, department: employee.department, direct_manager_id: employee.direct_manager_id },
  }))
}

export const DEMO_USER_ID = 999
export function buildDemoUser() {
  return {
    id: DEMO_USER_ID,
    name: 'Demo Admin',
    email: 'admin@nova-demo.dev',
    role: 'admin',
    department: 'Human Resources',
    is_active: true,
    is_team_manager: true,
    e_signature: null,
    has_profile_photo: false,
    manager_id: null,
    employee_id: null,
    employee: null,
  }
}

const LEAVE_TYPES = ['annual', 'casual', 'sick', 'annual', 'unpaid']
const LEAVE_STATUSES = ['pending', 'pending', 'manager_approved', 'hr_approved', 'approved', 'approved', 'approved', 'rejected']

export function buildLeaveRequests(employees) {
  const requests = []
  let id = 1
  for (let i = 0; i < 16; i += 1) {
    const employee = employees[3 + Math.floor(rand() * (employees.length - 3))]
    const startOffset = Math.floor(rand() * 40) - 20
    const days = 1 + Math.floor(rand() * 4)
    const status = LEAVE_STATUSES[i % LEAVE_STATUSES.length]
    requests.push(leaveFor(employee, employees, {
      id: id++, type: 'lrf', leave_type: LEAVE_TYPES[i % LEAVE_TYPES.length],
      start_date: shiftDate(startOffset), end_date: shiftDate(startOffset + days - 1), days, status,
      purpose: pick(['Family event', 'Personal matters', 'Medical appointment', 'Travel', 'Rest']),
    }))
  }
  for (let i = 0; i < 8; i += 1) {
    const employee = employees[8 + Math.floor(rand() * 20)]
    const dayOffset = -Math.floor(rand() * 20)
    const hours = 2 + Math.floor(rand() * 4)
    const status = LEAVE_STATUSES[(i + 3) % LEAVE_STATUSES.length]
    requests.push(leaveFor(employee, employees, {
      id: id++, type: 'otr', leave_type: 'overtime', ot_date: shiftDate(dayOffset),
      start_date: shiftDate(dayOffset), end_date: shiftDate(dayOffset),
      start_time: '17:00', end_time: `${17 + hours}:00`, hours, days: 0, status,
      explanation: pick(['Urgent equipment repair', 'Month-end closing', 'Inventory count', 'System migration']),
      overtime_results: 'Task completed on time.',
    }))
  }
  return requests.sort((a, b) => b.created_at.localeCompare(a.created_at))
}

function leaveFor(employee, employees, fields) {
  const manager = employees.find(e => e.id === employee.direct_manager_id)
  const gm = employees[0]
  const hr = employees[1]
  const created = shiftDate(-Math.floor(rand() * 10), new Date(`${fields.start_date}T09:00:00`))
  const approvedStage = ['manager_approved', 'hr_approved', 'approved'].includes(fields.status)
  const hrStage = ['hr_approved', 'approved'].includes(fields.status)
  return {
    tracking_no: `${fields.type === 'otr' ? 'OTR' : 'LRF'}-${new Date().getFullYear()}-${pad(fields.id, 4)}`,
    user_id: employee.user_id,
    employee_id: employee.id,
    employee_name: employee.name,
    job_title: employee.position,
    department: employee.department,
    department_label: employee.department,
    direct_manager_name: manager?.name ?? gm.name,
    direct_manager_id: manager?.id ?? gm.id,
    alternate_employee_id: null,
    alternate_employee_name: null,
    paid: fields.leave_type !== 'unpaid',
    company_paid: false,
    available_balance: 21 - Math.floor(rand() * 10),
    casual_available_balance: 6 - Math.floor(rand() * 4),
    request_date: created,
    created_at: `${created}T09:${pad(Math.floor(rand() * 59))}:00`,
    updated_at: `${created}T10:00:00`,
    manager_approved_at: approvedStage ? `${created}T12:00:00` : null,
    manager_approved_by: approvedStage ? manager?.user_id ?? gm.user_id : null,
    manager_approver: approvedStage ? { id: manager?.user_id ?? gm.user_id, name: manager?.name ?? gm.name } : null,
    hr_approved_at: hrStage ? `${created}T14:00:00` : null,
    hr_approved_by: hrStage ? hr.user_id : null,
    hr_approver: hrStage ? { id: hr.user_id, name: hr.name } : null,
    approved_at: fields.status === 'approved' ? `${created}T16:00:00` : null,
    approved_by: fields.status === 'approved' ? gm.user_id : null,
    approver: fields.status === 'approved' ? { id: gm.user_id, name: gm.name, role: 'general_manager' } : null,
    rejected_at: fields.status === 'rejected' ? `${created}T15:00:00` : null,
    rejection_reason: fields.status === 'rejected' ? 'Overlaps with planned shutdown week.' : null,
    employee: { id: employee.id, name: employee.name, position: employee.position, department: employee.department, direct_manager_id: employee.direct_manager_id },
    user: { id: employee.user_id, name: employee.name },
    ...fields,
  }
}

export function buildAttendance(employees, date) {
  const day = new Date(`${date}T00:00:00`)
  if (day.getDay() === 5) return [] // Friday is the weekly day off
  seed = Number(date.replaceAll('-', '')) % 2147483647 || 7
  return employees
    .filter(employee => employee.status === 'active')
    .map(employee => {
      const roll = rand()
      if (roll < 0.06) return null // absent: no punch record
      const late = roll > 0.86 ? 10 + Math.floor(rand() * 45) : 0
      const inHour = late ? 8 : 7
      const inMinute = late || 35 + Math.floor(rand() * 24)
      const workHours = Number((8 + rand() * 1.5 - late / 60).toFixed(2))
      const outTotal = inHour * 60 + inMinute + Math.round(workHours * 60)
      return {
        id: Number(`${date.replaceAll('-', '').slice(2)}${pad(employee.id, 3)}`),
        employee_id: employee.id,
        date,
        check_in: `${pad(inHour)}:${pad(inMinute)}:00`,
        check_out: `${pad(Math.floor(outTotal / 60))}:${pad(outTotal % 60)}:00`,
        work_hours: workHours,
        expected_hours: 8,
        late_minutes: late,
        overtime_hours: Math.max(0, Number((workHours - 8).toFixed(2))),
        status: late ? 'late' : roll > 0.8 && roll <= 0.86 ? 'wfh' : 'present',
        is_manual: false,
        notes: null,
        employee: { id: employee.id, name: employee.name, position: employee.position, department: employee.department, work_location: employee.work_location, punch_code: employee.punch_code },
      }
    })
    .filter(Boolean)
}

export function buildNotifications() {
  const now = Date.now()
  const at = (minutes) => new Date(now - minutes * 60000).toISOString()
  return [
    { id: 1, type: 'leave_request', title: 'New leave request', message: 'Karim Nabil requested 2 days of annual leave.', link: '/human-resources/leave', severity: 'info', read_at: null, created_at: at(12) },
    { id: 2, type: 'overtime_request', title: 'Overtime awaiting approval', message: 'Lucas Meyer submitted 3 hours of overtime.', link: '/human-resources/overtime', severity: 'info', read_at: null, created_at: at(55) },
    { id: 3, type: 'birthday', title: 'Birthday today', message: 'Wish Grace Liu a happy birthday!', link: '/human-resources/employees', severity: 'info', read_at: null, created_at: at(180) },
    { id: 4, type: 'attendance', title: 'Attendance uploaded', message: 'Yesterday\'s attendance file was processed: 34 records.', link: '/human-resources/attendance', severity: 'info', read_at: at(400), created_at: at(600) },
  ]
}

export { DEPARTMENTS, LOCATIONS }
