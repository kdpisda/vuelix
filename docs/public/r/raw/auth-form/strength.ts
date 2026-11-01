export interface PasswordStrength {
  /** 0 (empty) → 4 (strong) */
  score: 0 | 1 | 2 | 3 | 4
  label: '' | 'Weak' | 'Fair' | 'Good' | 'Strong'
  checks: { length: boolean, mixedCase: boolean, number: boolean, symbol: boolean }
}

const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'] as const

/** A small, dependency-free heuristic. Swap in zxcvbn or your own rules if you need more. */
export function passwordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    mixedCase: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Z0-9]/i.test(password),
  }
  let score = Object.values(checks).filter(Boolean).length
  if (password.length >= 14)
    score++
  if (!checks.length)
    score = Math.min(score, 1)
  if (password && !score)
    score = 1
  const clamped = Math.min(4, score) as PasswordStrength['score']
  return { score: clamped, label: labels[clamped], checks }
}
