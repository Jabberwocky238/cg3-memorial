import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useFirebase } from '../hooks/use-firebase'
import { SocialButton } from '@/components/base/buttons/social-button'
import { Input } from '@/components/base/input/input'
import { Button } from '@/components/base/buttons/button'
import { ButtonGroup, ButtonGroupItem } from '@/components/base/button-group/button-group'
import { ArrowLeft, User01 } from '@untitledui/icons'

export default function AuthPage() {
	const { emailSignIn, emailSignUp, googleSignIn } = useFirebase()
	const navigate = useNavigate()
	const location = useLocation()

	// 以锚点控制 Tab：#login | #signup
	const initialTab = useMemo(() => {
		const fromHash = (location.hash?.replace('#', '') || '').toLowerCase()
		if (fromHash === 'login' || fromHash === 'signup') return fromHash
		return 'login'
	}, [location.hash])

	const [tab, setTab] = useState<'login' | 'signup'>(initialTab as 'login' | 'signup')

	useEffect(() => {
		const handle = () => {
			const h = (window.location.hash.replace('#', '') || '').toLowerCase()
			if (h === 'login' || h === 'signup') setTab(h)
		}
		window.addEventListener('hashchange', handle)
		return () => window.removeEventListener('hashchange', handle)
	}, [])

	const switchTab = useCallback((target: 'login' | 'signup') => {
		if (target !== tab) {
			setTab(target)
			window.location.hash = target
		}
	}, [tab])

	const [form, setForm] = useState<{
		email: string
		password: string
		confirmPassword: string
	}>({ email: '', password: '', confirmPassword: '' })

	const validateForm = (isLogin: boolean) => {
		if (isLogin) {
			return form.email.trim() !== '' && form.password.trim() !== ''
		} else {
			const isPasswordValid = form.password.trim() === form.confirmPassword.trim() && form.password.trim() !== ''
			return form.email.trim() !== '' && isPasswordValid
		}
	}

	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const onSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault()
		setSubmitting(true)
		setError(null)
		try {
			validateForm(tab === 'login')
			if (tab === 'login') {
				await emailSignIn(form.email.trim(), form.password)
			} else {
				await emailSignUp(form.email.trim(), form.password)
				await navigate('/auth#login')
			}
		} catch (err: any) {
			setError(err?.message ?? 'Auth error')
		} finally {
			setSubmitting(false)
		}
	}, [form, tab])

	return (
		<div className="relative min-h-dvh" style={{
			color: 'var(--color-text-primary)',
			backgroundColor: 'var(--background-color-primary)',
		}}>
			<div className='absolute pt-4 pl-4 z-20' >
				{/* 返回按钮 */}
				<Button iconLeading={ArrowLeft} color='tertiary' onClick={() => navigate('/')}>
					主页
				</Button>
			</div>

			{/* 内容 */}
			<div className="relative z-10 grid min-h-dvh place-items-center px-4 py-10">
				<div className="w-full max-w-md rounded-xl border p-6 shadow-sm">
					{/* Tabs */}
					<div className="mb-4 flex items-center gap-2">
						<ButtonGroup className='w-full' selectedKeys={[tab]}>
							<ButtonGroupItem id="login" iconLeading={User01}
								className='w-full'
								onClick={() => switchTab('login')}
							>Login</ButtonGroupItem>
							<ButtonGroupItem id="signup" iconLeading={User01}
								className='w-full'
								onClick={() => switchTab('signup')}
							>Sign up</ButtonGroupItem>
						</ButtonGroup>
					</div>

					{/* 表单 */}
					<form onSubmit={onSubmit} className="space-y-4">
						<Input label="Email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e })} type="email" isRequired />
						<Input label="Password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e })} type="password" isRequired />
						{tab === 'signup' && (
							<Input label="Confirm Password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e })} type="password" isRequired />
						)}
						{error && <p className="text-sm">{error}</p>}
						<Button type="submit" disabled={submitting} className="w-full">
							{tab === 'login' ? 'Login' : 'Create account'}
						</Button>
					</form>

					{/* 分割 */}
					<div className="my-5 flex items-center gap-3">
						<div className="h-px flex-1" />
						<span className="text-xs">OR</span>
						<div className="h-px flex-1" />
					</div>

					{/* 社交登录 */}
					<div className="space-y-3">
						<SocialButton social="google" className='w-full' theme="brand" onClick={() => {
							googleSignIn().then((res) => {
								console.log(res)
								if (res.user) {
									navigate('/')
								}
							}).catch(console.error)
						}}>
							Continue with Google
						</SocialButton>
					</div>
				</div>
			</div>
		</div>
	)
}

