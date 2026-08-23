'use client'
import React from 'react'
import FormLayout, {
    FormField,
} from '@components/Objects/StyledElements/Form/Form'
import * as Form from '@radix-ui/react-form'
import { AlertTriangle, ArrowLeft, CheckCircle, Info, X } from 'lucide-react'
import Link from 'next/link'
import { useFormik } from 'formik'
import { sendResetLink } from '@services/auth/auth'
import { getErrorMessage } from '@services/utils/ts/errorMessage'
import { useTranslation } from 'react-i18next'
import AuthLayout from '@components/Auth/AuthLayout'
import TurnstileWidget, { useTurnstileRequired, verifyTurnstileToken, type TurnstileWidgetHandle } from '@components/Auth/TurnstileWidget'
import { useLHAnalytics, AnalyticsEvent } from '@services/analytics'

const validate = (values: any, t: any) => {
    const errors: any = {}

    if (!values.email) {
        errors.email = t('validation.required')
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
        errors.email = t('validation.invalid_email')
    }

    return errors
}

interface ForgotPasswordClientProps {
    org: any
}

function ForgotPasswordClient({ org }: ForgotPasswordClientProps) {
    const { t } = useTranslation();
    const { track } = useLHAnalytics('public')
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [error, setError] = React.useState('')
    const [message, setMessage] = React.useState('')
    const [showMessage, setShowMessage] = React.useState(false)
    const [turnstileToken, setTurnstileToken] = React.useState<string | null>(null)
    const turnstileRef = React.useRef<TurnstileWidgetHandle>(null)
    const turnstileRequired = useTurnstileRequired()

    const formik = useFormik({
        initialValues: {
            email: ''
        },
        validate: (values) => validate(values, t),
        validateOnBlur: true,
        onSubmit: async (values) => {
            setIsSubmitting(true)
            setError('')
            setMessage('')
            setShowMessage(false)
            try {
                // Bot check before we ask the backend to email a reset link.
                if (!(await verifyTurnstileToken(turnstileToken))) {
                    setError(t('auth.turnstile_failed', { defaultValue: 'Verification failed. Please try again.' }))
                    setShowMessage(true)
                    turnstileRef.current?.reset()
                    return
                }
                let res = await sendResetLink(values.email)
                if (res.status == 200) {
                    track(AnalyticsEvent.PasswordResetLinkRequested, { success: true })
                    setMessage(res.data + ', ' + t('auth.check_email_message'))
                    setShowMessage(true)
                } else {
                    track(AnalyticsEvent.PasswordResetLinkRequested, { success: false })
                    setError(getErrorMessage(res.data?.detail, t('auth.error_generic')))
                    setShowMessage(true)
                }
            } catch (err) {
                track(AnalyticsEvent.PasswordResetLinkRequested, { success: false })
                setError(getErrorMessage((err as any)?.response?.data?.detail, t('auth.error_generic')))
                setShowMessage(true)
            } finally {
                setIsSubmitting(false)
            }
        },
    })

    return (
        <AuthLayout
          org={org}
          welcomeText={t('auth.reset_your_password')}
          title={t('auth.image_title_forgot', { defaultValue: 'Reset your password.' })}
          subtitle={t('auth.image_subtitle_forgot', {
            defaultValue: "We'll help you get back into your account in no time.",
          })}
        >
                {/* Notification — soft, rounded, inset to match the auth page style */}
                {showMessage && (error || message) && (
                    <div className={`
                        mx-6 md:mx-12 lg:mx-20 mt-6 rounded-xl border px-4 py-3 flex items-center justify-between gap-3 animate-in motion-reduce:animate-none slide-in-from-top duration-200
                        ${error ? 'bg-red-950/70 text-red-100 border-red-500/40' : 'bg-emerald-950/70 text-emerald-100 border-emerald-500/40'}
                    `}>
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            {error ? <AlertTriangle size={18} className="shrink-0" /> : <CheckCircle size={18} className="shrink-0" />}
                            <span className="text-sm font-medium">{error || message}</span>
                        </div>
                        <button
                            onClick={() => setShowMessage(false)}
                            className="p-1 rounded-lg hover:bg-white/10 transition-colors motion-reduce:transition-none shrink-0 opacity-60 hover:opacity-100"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div className="flex-1 flex items-center justify-center px-6 md:px-12 lg:px-20">
                    <div className="w-full max-w-[420px] py-10">
                        {/* Header */}
                        <h1 className="text-[28px] md:text-[32px] font-black text-white tracking-tight leading-tight">{t('auth.forgot_password_title')}</h1>
                        <p className="mt-2 text-slate-300 text-[15px] font-medium">{t('auth.forgot_password_description')}</p>

                        {/* Form */}
                        <div className="mt-8">
                            <FormLayout onSubmit={formik.handleSubmit}>
                                <FormField name="email">
                                    <div className="flex items-center space-x-2 mb-1.5">
                                        <Form.Label className="grow text-[13px] font-semibold text-slate-200">{t('auth.email')}</Form.Label>
                                        {formik.errors.email && (
                                            <div className="text-red-500 text-xs flex items-center space-x-1">
                                                <Info size={11} />
                                                <span>{formik.errors.email}</span>
                                            </div>
                                        )}
                                    </div>
                                    <Form.Control asChild>
                                        <input
                                            onChange={formik.handleChange}
                                            value={formik.values.email}
                                            type="email"
                                            required
                                            className="box-border w-full bg-[#111C2E] text-white rounded-lg px-4 border border-white/15 inline-flex h-[44px] appearance-none items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF]/30 focus:border-[#00D4FF] transition-all motion-reduce:transition-none placeholder:text-slate-500 text-sm"
                                        />
                                    </Form.Control>
                                </FormField>

                                <TurnstileWidget
                                    ref={turnstileRef}
                                    onToken={setTurnstileToken}
                                    className="mt-2 flex justify-center"
                                />

                                <Form.Submit asChild>
                                    <button
                                        disabled={isSubmitting || (turnstileRequired && !turnstileToken)}
                                        className="box-border w-full inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B1220] h-[44px] rounded-lg items-center justify-center bg-[#FF7A00] hover:bg-[#ff8f26] text-[#0B1220] px-[15px] font-bold text-[14px] leading-none mt-2 transition-all motion-reduce:transition-none disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center space-x-2">
                                                <span className="w-4 h-4 border-t-2 border-white rounded-full animate-spin motion-reduce:animate-none" />
                                                <span>{t('common.loading')}</span>
                                            </span>
                                        ) : (
                                            t('auth.send_reset_link')
                                        )}
                                    </button>
                                </Form.Submit>
                            </FormLayout>
                        </div>

                        {/* Back to Login */}
                        <p className="text-center text-sm text-slate-400 mt-6">
                            <Link href="/login" className="inline-flex items-center gap-2 text-white font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] rounded">
                                <ArrowLeft size={16} />
                                {t('auth.back_to_login')}
                            </Link>
                        </p>
                    </div>
                </div>
        </AuthLayout>
    )
}

export default ForgotPasswordClient
