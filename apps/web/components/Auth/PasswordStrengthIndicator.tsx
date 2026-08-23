'use client'
import React, { useMemo } from 'react'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PasswordRequirement {
    id: string
    label: string
    validator: (_password: string) => boolean
}

interface PasswordStrengthIndicatorProps {
    password: string
    showRequirements?: boolean
    tone?: 'light' | 'dark'
}

export function PasswordStrengthIndicator({
    password,
    showRequirements = true,
    tone = 'light',
}: PasswordStrengthIndicatorProps) {
    const { t } = useTranslation()
    const isDark = tone === 'dark'

    const requirements: PasswordRequirement[] = useMemo(() => [
        {
            id: 'minLength',
            label: t('auth.password_req_min_length'),
            validator: (pwd: string) => pwd.length >= 8,
        },
        {
            id: 'uppercase',
            label: t('auth.password_req_uppercase'),
            validator: (pwd: string) => /[A-Z]/.test(pwd),
        },
        {
            id: 'lowercase',
            label: t('auth.password_req_lowercase'),
            validator: (pwd: string) => /[a-z]/.test(pwd),
        },
        {
            id: 'number',
            label: t('auth.password_req_number'),
            validator: (pwd: string) => /[0-9]/.test(pwd),
        },
        {
            id: 'special',
            label: t('auth.password_req_special'),
            validator: (pwd: string) => /[!@#$%^&*()_+\-=\x5B\x5D{}|;':",./<>?]/.test(pwd),
        },
    ], [t])

    const validCount = useMemo(() => {
        return requirements.filter(req => req.validator(password)).length
    }, [password, requirements])

    const strengthPercentage = (validCount / requirements.length) * 100

    const getStrengthColor = () => {
        if (strengthPercentage === 0) return 'bg-gray-200'
        if (strengthPercentage <= 40) return 'bg-red-500'
        if (strengthPercentage <= 60) return 'bg-orange-500'
        if (strengthPercentage <= 80) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    const getStrengthLabel = () => {
        if (strengthPercentage === 0) return ''
        if (strengthPercentage <= 40) return t('auth.password_strength_weak')
        if (strengthPercentage <= 60) return t('auth.password_strength_fair')
        if (strengthPercentage <= 80) return t('auth.password_strength_good')
        return t('auth.password_strength_strong')
    }

    // Don't show anything if password is empty
    if (!password) {
        return null
    }

    return (
        <div className="mt-2 space-y-2">
            {/* Strength bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className={isDark ? 'text-white/70' : 'text-gray-500'}>{t('auth.password_strength')}</span>
                    <span className={`font-medium ${
                        strengthPercentage <= 40 ? (isDark ? 'text-red-400' : 'text-red-600') :
                        strengthPercentage <= 60 ? (isDark ? 'text-orange-300' : 'text-orange-600') :
                        strengthPercentage <= 80 ? (isDark ? 'text-yellow-300' : 'text-yellow-600') :
                        (isDark ? 'text-green-400' : 'text-green-600')
                    }`}>
                        {getStrengthLabel()}
                    </span>
                </div>
                <div className={`h-1.5 w-full rounded-full overflow-hidden ${isDark ? 'bg-white/15' : 'bg-gray-200'}`}>
                    <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${strengthPercentage}%` }}
                    />
                </div>
            </div>

            {/* Requirements list */}
            {showRequirements && (
                <ul className="text-xs space-y-1">
                    {requirements.map((req) => {
                        const isValid = req.validator(password)
                        return (
                            <li
                                key={req.id}
                                className={`flex items-center gap-1.5 ${
                                    isValid
                                        ? (isDark ? 'text-green-400' : 'text-green-600')
                                        : (isDark ? 'text-white/65' : 'text-gray-500')
                                }`}
                            >
                                {isValid ? (
                                    <Check className="h-3.5 w-3.5" />
                                ) : (
                                    <X className="h-3.5 w-3.5" />
                                )}
                                <span>{req.label}</span>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

export function validatePasswordStrength(password: string): {
    isValid: boolean
    errors: string[]
} {
    const errors: string[] = []

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters')
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter')
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number')
    }
    if (!/[!@#$%^&*()_+\-=\x5B\x5D{}|;':",./<>?]/.test(password)) {
        errors.push('Password must contain at least one special character')
    }

    return {
        isValid: errors.length === 0,
        errors,
    }
}

export default PasswordStrengthIndicator
