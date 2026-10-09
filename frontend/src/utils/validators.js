/**
 * Form validation utilities.
 * Pure functions — no side effects.
 */

/** Email format check */
export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim())

/** Password strength requirements */
export const PASSWORD_MIN_LENGTH = 8

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' }

  let score = 0
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  }

  score = Object.values(checks).filter(Boolean).length

  const levels = [
    { score: 0, label: '',          color: '' },
    { score: 1, label: 'Very Weak', color: 'bg-rose-500'   },
    { score: 2, label: 'Weak',      color: 'bg-orange-500' },
    { score: 3, label: 'Fair',      color: 'bg-amber-500'  },
    { score: 4, label: 'Strong',    color: 'bg-emerald-500' },
    { score: 5, label: 'Very Strong', color: 'bg-emerald-400' },
  ]

  return { ...levels[score], checks, percentage: (score / 5) * 100 }
}

/** Validate register form */
export const validateRegisterForm = ({ fullName, email, password, confirmPassword }) => {
  const errors = {}

  if (!fullName || fullName.trim().length < 2) {
    errors.fullName = 'Full name must be at least 2 characters.'
  } else if (fullName.trim().length > 100) {
    errors.fullName = 'Full name must be under 100 characters.'
  }

  if (!email || !isValidEmail(email)) {
    errors.email = 'Please enter a valid email address.'
  }

  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }

  return errors
}

/** Validate login form */
export const validateLoginForm = ({ email, password }) => {
  const errors = {}
  if (!email || !isValidEmail(email)) {
    errors.email = 'Please enter a valid email address.'
  }
  if (!password) {
    errors.password = 'Password is required.'
  }
  return errors
}

/** Validate forgot-password form */
export const validateForgotForm = ({ email }) => {
  const errors = {}
  if (!email || !isValidEmail(email)) {
    errors.email = 'Please enter a valid email address.'
  }
  return errors
}

/** Validate reset-password form */
export const validateResetForm = ({ password, confirmPassword }) => {
  const errors = {}
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`
  }
  if (!confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  return errors
}
