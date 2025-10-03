import type { FC, MouseEventHandler, ReactNode } from "react";
import { Bell01, LifeBuoy01, PlusSquare, SearchLg, Settings01 } from "@untitledui/icons";
import { Button as AriaButton, DialogTrigger, Popover } from "react-aria-components";
import { Avatar } from "../../base/avatar/avatar";
import { BadgeWithDot } from "../../base/badges/badges";
import { Input } from "../../base/input/input";
import { UntitledLogo } from "../../foundations/logo/untitledui-logo";
import { cx } from "@/utils/cx";
import { MobileNavigationHeader } from "./base-components/mobile-header";
import { NavAccountCard, NavAccountMenu } from "./base-components/nav-account-card";
import { NavItemBase } from "./base-components/nav-item";
import { NavItemButton } from "./base-components/nav-item-button";
import { NavList } from "./base-components/nav-list";
import { Link } from "react-router-dom";
import { Button } from "@/components/base/buttons/button";
import type { User } from "firebase/auth";
import { useTheme } from "@/hooks/use-theme";
import { MoonStarIcon } from "@/components/tiptap-icons/moon-star-icon";
import { SunIcon } from "@/components/tiptap-icons/sun-icon";

type NavItem = {
    /** Label text for the nav item. */
    label: string;
    /** URL to navigate to when the nav item is clicked. */
    href: string;
    /** Whether the nav item is currently active. */
    current?: boolean;
    /** Icon component to display. */
    icon?: FC<{ className?: string }>;
    /** Badge to display. */
    badge?: ReactNode;
    /** List of sub-items to display. */
    items?: NavItem[];
};

type ActionItem = {
    size?: "md" | "lg";
    icon?: FC<{ className?: string }>;
    label: string;
    href?: string;
    onClick?: MouseEventHandler;
    tooltipPlacement?: "top" | "right" | "bottom" | "left";
};

interface HeaderNavigationBaseProps {
    /** URL of the currently active item. */
    activeUrl?: string;
    /** List of items to display. */
    items: NavItem[];
    /** List of sub-items to display. */
    subItems?: NavItem[];
    /** List of action items to display. */
    actionItems?: ActionItem[];
    /** Content to display in the trailing position. */
    trailingContent?: ReactNode;
    /** Whether to show the avatar dropdown. */
    showAvatarDropdown?: boolean;
    /** Whether to hide the bottom border. */
    hideBorder?: boolean;
    /** External user info to control avatar/login UI. */
    user?: User | null;
}

export const HeaderNavigationBase = ({
    activeUrl,
    items,
    subItems,
    actionItems,
    trailingContent,
    showAvatarDropdown = true,
    hideBorder = false,
    user,
}: HeaderNavigationBaseProps) => {
    const activeSubNavItems = subItems || items.find((item) => item.current && item.items && item.items.length > 0)?.items;
    const { theme, setTheme } = useTheme()
    const showSecondaryNav = activeSubNavItems && activeSubNavItems.length > 0;

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
                            {actionItems?.map((item) => (
                                <NavItemBase type="link" href={item.href} icon={item.icon} current={item.href === activeUrl}>
                                    {item.label}
                                </NavItemBase>
                            ))}
                            <NavItemBase type="link" href="#" icon={theme === "light" ? SunIcon : MoonStarIcon} onClick={() => {
                                setTheme(theme === "light" ? "dark" : "light")
                            }}>
                                Toggle Theme
                            </NavItemBase>
                            {/* <NavItemBase type="link" href="#" icon={LifeBuoy01}>
                                Support
                            </NavItemBase>
                            <NavItemBase
                                type="link"
                                href="#"
                                icon={Settings01}
                                badge={
                                    <BadgeWithDot color="success" type="modern" size="sm">
                                        Online
                                    </BadgeWithDot>
                                }
                            >
                                Settings
                            </NavItemBase>
                            <NavItemBase type="link" href="https://www.untitledui.com/" icon={Settings01}>
                                Open in browser
                            </NavItemBase> */}
                        </div>

                        <NavAccountCard items={user ? [user] : []} selectedAccountId={user?.uid} />
                    </div>
                </aside>
            </MobileNavigationHeader>

            <header className="max-lg:hidden">
                <section
                    className={cx(
                        "flex h-16 w-full items-center justify-center bg-primary md:h-18",
                        (!hideBorder || showSecondaryNav) && "border-b border-secondary",
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
                                            <NavItemBase icon={item.icon} href={item.href} current={item.current} badge={item.badge} type="link">
                                                {item.label}
                                            </NavItemBase>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                        </div>

                        <div className="flex items-center gap-3">
                            {trailingContent}

                            <div className="flex gap-0.5">
                                {actionItems?.map((item) => (
                                    <NavItemButton
                                        key={item.label}
                                        current={item.href === activeUrl}
                                        size={item.size}
                                        icon={item.icon ?? PlusSquare}
                                        label={item.label}
                                        href={item.href}
                                        tooltipPlacement={item.tooltipPlacement}
                                        onClick={item.onClick}
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

                            {showAvatarDropdown && (
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
                                            <Avatar alt={user.displayName ?? user.email ?? "User"} src={user.photoURL ?? undefined} size="md" />
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

                {showSecondaryNav && (
                    <section className={cx("flex h-16 w-full items-center justify-center bg-primary", !hideBorder && "border-b border-secondary")}>
                        <div className="flex w-full max-w-container items-center justify-between gap-8 px-8">
                            <nav>
                                <ul className="flex items-center gap-0.5">
                                    {activeSubNavItems.map((item) => (
                                        <li key={item.label} className="py-0.5">
                                            <NavItemBase icon={item.icon} href={item.href} current={item.current} badge={item.badge} type="link">
                                                {item.label}
                                            </NavItemBase>
                                        </li>
                                    ))}

                                </ul>
                            </nav>

                            <Input shortcut aria-label="Search" placeholder="Search" icon={SearchLg} size="sm" className="max-w-xs" />
                        </div>
                    </section>
                )}
            </header>
        </>
    );
};
