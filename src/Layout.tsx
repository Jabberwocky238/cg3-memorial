import { Outlet, useLocation, Link, useNavigate } from 'react-router-dom'
import { useFirebase } from '@/hooks/use-firebase'
import { Bell01, PlusSquare, Settings01 } from '@untitledui/icons'
import { ArweaveProvider } from './hooks/use-arweave'
import { AppStateProvider } from './hooks/use-app-state'
import { useTheme } from './hooks/use-theme'
import { MobileNavigationHeader } from './components/application/app-navigation/base-components/mobile-header'
import { NavList } from './components/application/app-navigation/base-components/nav-list'
import { NavItemBase } from './components/application/app-navigation/base-components/nav-item'
import { SunIcon } from './components/tiptap-icons/sun-icon'
import { MoonStarIcon } from './components/tiptap-icons/moon-star-icon'
import { NavAccountCard, NavAccountMenu } from './components/application/app-navigation/base-components/nav-account-card'
import { Input } from './components/base/input/input'
import { SearchLg } from '@untitledui/icons'
import { cx } from './utils/cx'
import { DialogTrigger } from 'react-aria-components'
import { UntitledLogo } from './components/foundations/logo/untitledui-logo'
import { Button } from './components/base/buttons/button'
import { Avatar } from './components/base/avatar/avatar'
import { Popover } from 'react-aria-components'
import { NavItemButton } from './components/application/app-navigation/base-components/nav-item-button'
import { Button as AriaButton } from 'react-aria-components'

const navItems = [
	{ label: 'Home', href: '/' },
	{ label: 'Explore', href: '/explore' },
	{ label: 'Profile', href: '/profile' },
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
		tooltipPlacement: "bottom" as const,
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
	return (
		<div className="min-h-dvh flex flex-col">
			<HeaderNavigation />
			<main className="flex-1">
				<AppStateProvider>
					<ArweaveProvider>
						<Outlet />
					</ArweaveProvider>
				</AppStateProvider>
			</main>
		</div>
	)
}

const HeaderNavigation = () => {
	const items = useItemsWithCurrent()
	const navigate = useNavigate()
	const { user } = useFirebase()
	const actionItems = actions;
	const { theme, setTheme } = useTheme()
	const showSecondaryNav = false;

	return (
		<>
			<MobileNavigationHeader>
				<aside className="flex h-full max-w-full flex-col justify-between overflow-auto border-r border-secondary bg-primary pt-4 lg:pt-6">
					<div className="flex flex-col gap-5 px-4 lg:px-5">
						<UntitledLogo className="h-8" />
						<Input shortcut size="sm" aria-label="Search" placeholder="Search" icon={SearchLg} />
					</div>

					<NavList items={items} />

					<div className="mt-auto flex flex-col gap-4 px-2 py-4 lg:px-4 lg:py-6">
						<div className="flex flex-col gap-1">
							{actionItems.map((item) => (
								<NavItemBase
									key={item.label}
									type="link"
									href={item.href}
									icon={item.icon}
								>
									{item.label}
								</NavItemBase>
							))}
							<NavItemBase type="link" href="#" icon={theme === "light" ? SunIcon : MoonStarIcon} onClick={() => {
								setTheme(theme === "light" ? "dark" : "light")
							}}>
								Toggle Theme
							</NavItemBase>
						</div>

						<NavAccountCard items={user ? [user] : []} selectedAccountId={user?.uid} />
					</div>
				</aside>
			</MobileNavigationHeader>

			<header className="max-lg:hidden">
				<section
					className={cx(
						"flex h-16 w-full items-center justify-center bg-primary md:h-18",
						showSecondaryNav && "border-b border-secondary",
					)}
				>
					<div className="flex w-full max-w-container justify-between pr-3 pl-4 md:px-8">
						<div className="flex flex-1 items-center gap-4">
							<a
								aria-label="Go to homepage"
								href="/"
								className="rounded-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
							>
								<UntitledLogo className="h-8" />
							</a>

							<nav>
								<ul className="flex items-center gap-0.5">
									{items.map((item) => (
										<li key={item.label} className="py-0.5">
											<NavItemBase
												href={item.href}
												current={item.current}
												type="link"
											>
												{item.label}
											</NavItemBase>
										</li>
									))}
								</ul>
							</nav>
						</div>

						<div className="flex items-center gap-3">
							{/* {trailingContent} */}

							<div className="flex gap-0.5">
								{actionItems?.map((item) => (
									<NavItemButton
										key={item.label}
										size="md"
										icon={item.icon ?? PlusSquare}
										label={item.label}
										href={item.href}
										tooltipPlacement={item.tooltipPlacement}
									/>
								))}
								<NavItemButton
									current={theme === "light"}
									size="md"
									icon={theme === "light" ? SunIcon : MoonStarIcon}
									label={"Toggle Theme"}
									href="#"
									tooltipPlacement="bottom"
									onClick={() => {
										setTheme(theme === "light" ? "dark" : "light")
									}}
								/>
							</div>

							{true && (
								user ? (
									<DialogTrigger>
										<AriaButton
											className={({ isPressed, isFocused }) =>
												cx(
													"group relative inline-flex cursor-pointer",
													(isPressed || isFocused) && "rounded-full outline-2 outline-offset-2 outline-focus-ring",
												)
											}
										>
											<Avatar alt={user.displayName} src={user.photoURL} size="md" />
										</AriaButton>
										<Popover
											placement="bottom right"
											offset={8}
											className={({ isEntering, isExiting }) =>
												cx(
													"will-change-transform",
													isEntering &&
													"duration-300 ease-out animate-in fade-in placement-right:slide-in-from-left-2 placement-top:slide-in-from-bottom-2 placement-bottom:slide-in-from-top-2",
													isExiting &&
													"duration-150 ease-in animate-out fade-out placement-right:slide-out-to-left-2 placement-top:slide-out-to-bottom-2 placement-bottom:slide-out-to-top-2",
												)
											}
										>
											<NavAccountMenu items={user ? [user] : []} selectedAccountId={user?.uid} />
										</Popover>
									</DialogTrigger>
								) : (
									<div className="flex items-center gap-2">
										<Link to="/auth#login">
											<Button size="sm">Login</Button>
										</Link>
										<Link to="/auth#signup">
											<Button size="sm" color="secondary">Sign up</Button>
										</Link>
									</div>
								)
							)}
						</div>
					</div>
				</section>
			</header>
		</>
	);
};
