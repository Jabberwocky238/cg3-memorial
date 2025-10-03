import { Outlet, useLocation, Link } from 'react-router-dom'
import { Zap } from '@untitledui/icons'
import { HeaderNavigationBase } from '@/components/application/app-navigation/header-navigation'
import { Button } from '@/components/base/buttons/button'

const navItems = [
	{ label: 'Home', href: '/' },
	{
		label: 'Dashboard',
		href: '/dashboard',
		items: [
			{ label: 'Overview', href: '#' },
			{ label: 'Notifications', href: '#' },
			{ label: 'Analytics', href: '#' },
			{ label: 'Saved reports', href: '#' },
			{ label: 'Scheduled reports', href: '#' },
			{ label: 'User reports', href: '#' },
		],
	},
	{ label: 'Projects', href: '/projects' },
	{ label: 'Tasks', href: '/tasks' },
	{ label: 'Reporting', href: '/reporting' },
	{ label: 'Users', href: '/users' },
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
	return (
		<div className="min-h-dvh flex flex-col">
			<HeaderNavigationBase
				items={items}
				trailingContent={
					<Button iconLeading={Zap} color="secondary" size="sm">
						Upgrade now
					</Button>
				}
			/>
			<main className="flex-1">
				<Outlet />
			</main>
			<footer className="border-t border-zinc-200 p-4 text-center text-xs text-zinc-500">
				<Link to="/auth" className="underline">Auth</Link>
			</footer>
		</div>
	)
}


