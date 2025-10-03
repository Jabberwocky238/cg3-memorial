import { Outlet, useLocation, Link } from 'react-router-dom'
import { HeaderNavigationBase } from '@/components/application/app-navigation/header-navigation'
import { useFirebase } from '@/hooks/use-firebase'
import { Bell01, PlusSquare, Settings01, Thermometer01 } from '@untitledui/icons'
import { useTheme } from '@/hooks/use-theme'

const navItems = [
	{ label: 'Home', href: '/' },
	{ label: 'Explore', href: '/explore' },
]

function useItemsWithCurrent() {
	const { pathname } = useLocation()
	return navItems.map((item) => ({
		...item,
		current: item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
	}))
}

const actions = [
	{
		href: "/edit/new",
		icon: PlusSquare,
		label: "New Article",
		tooltipPlacement: "bottom" as const
	},
	{
		href: "/settings-01",
		icon: Settings01,
		label: "Settings",
		tooltipPlacement: "bottom" as const
	},
	{
		href: "/notifications-01",
		icon: Bell01,
		label: "Notifications",
		tooltipPlacement: "bottom" as const
	},
]

export default function Layout() {
	const items = useItemsWithCurrent()
	const { user } = useFirebase()
	return (
		<div className="min-h-dvh flex flex-col">
			<HeaderNavigationBase
				items={items}
				actionItems={actions}
				user={user}
			/>
			<main className="flex-1">
				<Outlet />
			</main>
			<footer className="p-4 text-center text-xs">
				<Link to="/auth" className="underline">Auth</Link>
			</footer>
		</div>
	)
}

