import { useCallback } from 'react'
import { GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth'
import { useNavigate } from 'react-router-dom'
import { useFirebase } from '../contexts/firebase'
import { SocialButton } from '@/components/base/buttons/social-button'

export default function AuthPage() {
	const { auth } = useFirebase()
	const navigate = useNavigate()

	const signInWith = useCallback(
		async (provider: 'google' | 'github') => {
			const p = provider === 'google' ? new GoogleAuthProvider() : new GithubAuthProvider()
			await signInWithPopup(auth, p)
			navigate('/')
		},
		[auth, navigate],
	)

	return (
		<div className="min-h-dvh grid place-items-center px-4">
			<div className="w-full max-w-sm space-y-4">
				<h1 className="text-xl font-semibold">登录</h1>
				<p className="text-sm text-zinc-500">使用社交账号继续</p>
				<div className="space-y-3">
					<SocialButton social="google" theme="brand" onClick={() => signInWith('google')}>
						Sign in with Google
					</SocialButton>
					<SocialButton social="facebook" theme="brand">
						Sign in with Facebook
					</SocialButton>
					<SocialButton social="apple" theme="brand">
						Sign in with Apple
					</SocialButton>
				</div>
			</div>
		</div>
	)
}


