import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useFirebase } from '../hooks/use-firebase'
import { SocialButton } from '@/components/base/buttons/social-button'
import { Input } from '@/components/base/input/input'
import { Button } from '@/components/base/buttons/button'
import { updateProfile } from 'firebase/auth'
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

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [displayName, setDisplayName] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const onSubmit = useCallback(async (e: React.FormEvent) => {
		e.preventDefault()
		setSubmitting(true)
		setError(null)
		try {
			if (tab === 'login') {
				await emailSignIn(email.trim(), password)
			} else {
				const cred = await emailSignUp(email.trim(), password)
				if (displayName) {
					await updateProfile(cred.user, { displayName })
				}
			}
			navigate('/')
		} catch (err: any) {
			setError(err?.message ?? 'Auth error')
		} finally {
			setSubmitting(false)
		}
	}, [email, password, displayName, tab, navigate])

	return (
		<div className="relative min-h-dvh">
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
						{tab === 'signup' && (
							<Input label="Name" placeholder="Your name" value={displayName} onChange={(e) => setDisplayName(e)} />
						)}
						<Input label="Email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e)} type="email" isRequired />
						<Input label="Password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e)} type="password" isRequired />
						<Input label="Confirm Password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e)} type="password" isRequired />
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

