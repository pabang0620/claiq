import { pool, withTransaction } from '../../config/db.js'
import crypto from 'crypto'

export const findUserByEmail = async (email) => {
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, name, role, phone, is_active, created_at
     FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email]
  )
  return rows[0] || null
}

export const findUserById = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, email, name, role, phone, is_active, created_at
     FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  )
  return rows[0] || null
}

export const createUser = async ({ email, password_hash, name, role, phone }) => {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, name, role, phone)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, email, name, role, phone, created_at`,
    [email, password_hash, name, role, phone || null]
  )
  return rows[0]
}

export const saveRefreshToken = async (userId, token, expiresAt) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hash, expiresAt]
  )
}

export const findRefreshToken = async (token) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const { rows } = await pool.query(
    `SELECT rt.id, rt.user_id, rt.expires_at, rt.revoked_at,
            u.email, u.name, u.role, u.is_active
     FROM refresh_tokens rt
     JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = $1`,
    [hash]
  )
  return rows[0] || null
}

export const revokeRefreshToken = async (token) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1`,
    [hash]
  )
}

export const findUserByIdWithPassword = async (id) => {
  const { rows } = await pool.query(
    `SELECT id, email, password_hash, name, role, phone, is_active
     FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  )
  return rows[0] || null
}

export const updatePassword = async (userId, newHash) => {
  await pool.query(
    `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
    [userId, newHash]
  )
}

export const revokeAllUserRefreshTokens = async (userId) => {
  await pool.query(
    `UPDATE refresh_tokens SET revoked_at = NOW()
     WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  )
}
