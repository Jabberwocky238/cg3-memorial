import { useNavigate, Link } from 'react-router-dom'
import { useFirebase } from '../hooks/use-firebase'

export default function HomePage() {
	const { signOut, user } = useFirebase()
	const navigate = useNavigate()

	return (
		<div className="min-h-dvh grid place-items-center px-4">
			<div className="w-full max-w-sm space-y-4 text-center">
				<h1 className="text-xl font-semibold">首页</h1>
				{user ? (
					<div className="space-y-2">
						<p className="text-sm text-zinc-600">已登录：{user.email ?? user.displayName ?? user.uid}</p>
						<button
							className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
							onClick={async () => {
								await signOut()
								navigate('/auth')
							}}
						>
							退出登录
						</button>
					</div>
				) : (
					<div className="space-y-2">
						<p className="text-sm text-zinc-600">你还没有登录</p>
						<Link
							to="/auth"
							className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
						>
							去登录
						</Link>
					</div>
				)}
			</div>
		</div>
	)
}


