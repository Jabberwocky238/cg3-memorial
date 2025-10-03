import { Outlet, useLocation, Link } from 'react-router-dom'
import { HeaderNavigationBase } from '@/components/application/app-navigation/header-navigation'
import { Button } from '@/components/base/buttons/button'
import { Avatar } from '@/components/base/avatar/avatar'
import { useFirebase } from '@/hooks/use-firebase'

const navItems = [
    { label: 'Home', href: '/' },
]

function useItemsWithCurrent() {
	const { pathname } = useLocation()
	return navItems.map((item) => ({
		...item,
		current: item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
	}))
}

export default function Layout() {
	const items = useItemsWithCurrent()
	const { user } = useFirebase()
	return (
		<div className="min-h-dvh flex flex-col">
			<HeaderNavigationBase
				items={items}
				user={user}
			/>
			<main className="flex-1">
				<Outlet />
			</main>
			<footer className="p-4 text-center text-xs text-zinc-500">
				<Link to="/auth" className="underline">Auth</Link>
			</footer>
		</div>
	)
}

