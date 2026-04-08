import { pool } from '../../config/db.js'

export const findAcademyById = async (id) => {
  const { rows } = await pool.query(
    `SELECT a.*, u.name AS owner_name
     FROM academies a
     JOIN users u ON u.id = a.owner_id
     WHERE a.id = $1 AND a.deleted_at IS NULL`,
    [id]
  )
  return rows[0] || null
}

export const findAcademyByCode = async (code) => {
  const { rows } = await pool.query(
    `SELECT * FROM academies WHERE code = $1 AND deleted_at IS NULL`,
    [code]
  )
  return rows[0] || null
}

export const createAcademy = async ({ name, code, address, owner_id, suneung_date }) => {
  const { rows } = await pool.query(
    `INSERT INTO academies (name, code, address, owner_id, suneung_date)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name, code, address || null, owner_id, suneung_date || null]
  )
  return rows[0]
}

export const addMember = async ({ academy_id, user_id, role }) => {
  const { rows } = await pool.query(
    `INSERT INTO academy_members (academy_id, user_id, role)
     VALUES ($1, $2, $3)
     ON CONFLICT (academy_id, user_id) DO UPDATE
       SET status = 'active', left_at = NULL
     RETURNING *`,
    [academy_id, user_id, role]
  )
  return rows[0]
}

export const findMembership = async (academy_id, user_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM academy_members WHERE academy_id = $1 AND user_id = $2`,
    [academy_id, user_id]
  )
  return rows[0] || null
}

export const findMembers = async (academy_id, role = null) => {
  const params = [academy_id]
  let roleClause = ''
  if (role) {
    params.push(role)
    roleClause = `AND am.role = $${params.length}`
  }

  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.name, u.role, u.phone,
            am.status, am.joined_at
     FROM academy_members am
     JOIN users u ON u.id = am.user_id
     WHERE am.academy_id = $1 AND am.status = 'active' ${roleClause}
     ORDER BY am.joined_at ASC`,
    params
  )
  return rows
}

export const updateAcademy = async (id, updates) => {
  const fields = []
  const params = [id]
  let idx = 2

  if (updates.name !== undefined) { fields.push(`name = $${idx++}`); params.push(updates.name) }
  if (updates.address !== undefined) { fields.push(`address = $${idx++}`); params.push(updates.address) }
  if (updates.suneung_date !== undefined) { fields.push(`suneung_date = $${idx++}`); params.push(updates.suneung_date) }

  if (!fields.length) {
    const err = new Error('수정할 항목이 없습니다')
    err.status = 400
    throw err
  }
  fields.push('updated_at = NOW()')

  const { rows } = await pool.query(
    `UPDATE academies SET ${fields.join(', ')} WHERE id = $1 AND deleted_at IS NULL RETURNING *`,
    params
  )
  return rows[0] || null
}

export const removeMember = async (academy_id, user_id) => {
  await pool.query(
    `UPDATE academy_members SET status = 'inactive', left_at = NOW()
     WHERE academy_id = $1 AND user_id = $2`,
    [academy_id, user_id]
  )
}

export const findCoupons = async (academy_id) => {
  const { rows } = await pool.query(
    `SELECT * FROM academy_coupons
     WHERE academy_id = $1 AND deleted_at IS NULL
     ORDER BY created_at DESC`,
    [academy_id]
  )
  return rows
}

export const createCoupon = async ({ academy_id, name, description, discount_type, discount_amount, expires_at }) => {
  const { rows } = await pool.query(
    `INSERT INTO academy_coupons (academy_id, name, description, discount_type, discount_amount, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [academy_id, name, description || null, discount_type || 'percent', discount_amount || 0, expires_at || null]
  )
  return rows[0]
}

export const deleteCoupon = async (id, academy_id) => {
  await pool.query(
    `UPDATE academy_coupons SET deleted_at = NOW() WHERE id = $1 AND academy_id = $2`,
    [id, academy_id]
  )
}

export const updateMemberRole = async (academy_id, user_id, role) => {
  const { rows } = await pool.query(
    `UPDATE academy_members SET role = $3, updated_at = NOW()
     WHERE academy_id = $1 AND user_id = $2 AND status = 'active'
     RETURNING *`,
    [academy_id, user_id, role]
  )
  return rows[0] || null
}

export const findUserAcademies = async (user_id) => {
  const { rows } = await pool.query(
    `SELECT a.*, am.role AS member_role, am.status, am.joined_at
     FROM academy_members am
     JOIN academies a ON a.id = am.academy_id
     WHERE am.user_id = $1 AND am.status = 'active' AND a.deleted_at IS NULL
     ORDER BY am.joined_at DESC`,
    [user_id]
  )
  return rows
}
