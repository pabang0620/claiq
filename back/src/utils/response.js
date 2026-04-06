export const successResponse = (res, data, message = 'success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  })
}

export const errorResponse = (res, message = 'error', statusCode = 400, errors = null) => {
  const body = { success: false, message }
  if (errors) body.errors = errors
  return res.status(statusCode).json(body)
}

export const paginatedResponse = (res, data, meta, message = 'success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta,
  })
}
