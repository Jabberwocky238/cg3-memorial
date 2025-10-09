import type { FC, HTMLAttributes } from "react";
import { useCallback, useContext, useEffect, useRef } from "react";
import type { Placement } from "@react-types/overlays";
import { BookOpen01, ChevronSelectorVertical, LogOut01, Plus, Settings01, User01 } from "@untitledui/icons";
import { useFocusManager } from "react-aria";
import type { DialogProps as AriaDialogProps, OverlayTriggerState } from "react-aria-components";
import { Button as AriaButton, Dialog as AriaDialog, DialogTrigger as AriaDialogTrigger, Popover as AriaPopover, Link, OverlayTriggerStateContext } from "react-aria-components";
import { AvatarLabelGroup } from "../../../base/avatar/avatar-label-group";
import { Button } from "../../../base/buttons/button";
import { RadioButtonBase } from "../../../base/radio-buttons/radio-buttons";
import { useBreakpoint } from "@/hooks/tiptap/use-breakpoint";
import { cx } from "@/utils/cx";
import { useFirebase } from "@/hooks/use-firebase";
import { useNavigate } from "react-router-dom";
import type { UserInfo } from "firebase/auth";

interface NavAccountMenuProps extends AriaDialogProps {
    className?: string;
    items?: UserInfo[];
    selectedAccountId?: string;
    state?: OverlayTriggerState;
}

export const NavAccountMenu = ({
    className,
    selectedAccountId,
    items,
    state, // 最外侧的状态
    ...dialogProps
}: NavAccountMenuProps) => {
    const focusManager = useFocusManager();
    const dialogRef = useRef<HTMLDivElement>(null);
    const { signOut } = useFirebase();
    const navigate = useNavigate();
    const _state = useContext(OverlayTriggerStateContext); // 自己的状态

    const onKeyDown = useCallback(
        (e: KeyboardEvent) => {
            switch (e.key) {
                case "ArrowDown":
                    focusManager?.focusNext({ tabbable: true, wrap: true });
                    break;
                case "ArrowUp":
                    focusManager?.focusPrevious({ tabbable: true, wrap: true });
                    break;
            }
        },
        [focusManager],
    );

    useEffect(() => {
        const element = dialogRef.current;
        if (element) {
            element.addEventListener("keydown", onKeyDown);
        }

        return () => {
            if (element) {
                element.removeEventListener("keydown", onKeyDown);
            }
        };
    }, [onKeyDown]);

    return (
        <AriaDialog
            {...dialogProps}
            ref={dialogRef}
            className={cx("w-66 rounded-xl bg-secondary_alt shadow-lg ring ring-secondary_alt outline-hidden", className)}
        >
            <div className="rounded-xl bg-primary ring-1 ring-secondary">
                <div className="flex flex-col gap-0.5 py-1.5">
                    <NavAccountCardMenuItem label="View profile" onClick={(e) => {
                        navigate("/profile")
                        state?.close()
                        _state?.close()
                    }} icon={Settings01} shortcut="⌘K->P" />
                    {/* <NavAccountCardMenuItem label="Account settings"icon={Settings01} shortcut="⌘S" /> */}
                    {/* <NavAccountCardMenuItem label="Documentation" icon={BookOpen01} /> */}
                </div>
                <div className="flex flex-col gap-0.5 border-t border-secondary py-1.5">
                    <div className="px-3 pt-1.5 pb-1 text-xs font-semibold text-tertiary">Switch account</div>

                    <div className="flex flex-col gap-0.5 px-1.5">
                        {items?.map((account) => (
                            <button
                                key={account.uid}
                                className={cx(
                                    "relative w-full cursor-pointer rounded-md px-2 py-1.5 text-left outline-focus-ring hover:bg-primary_hover focus:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
                                    account.uid === selectedAccountId && "bg-primary_hover",
                                )}
                            >
                                <AvatarLabelGroup status="online" size="md" src={account.photoURL} title={account.displayName} subtitle={account.email} />
                                <RadioButtonBase isSelected={account.uid === selectedAccountId} className="absolute top-2 right-2" />
                            </button>
                        ))}
                    </div>
                </div>
                {/* <div className="flex flex-col gap-2 px-2 pt-0.5 pb-2">
                    <Button iconLeading={Plus} color="secondary" size="sm">
                        Add account
                    </Button>
                </div> */}
            </div>

            <div className="pt-1 pb-1.5">
                <NavAccountCardMenuItem label="Sign out" onClick={signOut} icon={LogOut01} shortcut="⌥⇧Q" />
            </div>
        </AriaDialog>
    );
};

const NavAccountCardMenuItem = ({
    icon: Icon,
    label,
    shortcut,
    ...buttonProps
}: {
    icon?: FC<{ className?: string }>;
    label: string;
    shortcut?: string;
} & HTMLAttributes<HTMLButtonElement>) => {
    return (
        <button {...buttonProps} className={cx("group/item w-full cursor-pointer px-1.5 focus:outline-hidden", buttonProps.className)}>
            <div
                className={cx(
                    "flex w-full items-center justify-between gap-3 rounded-md p-2 group-hover/item:bg-primary_hover",
                    // Focus styles.
                    "outline-focus-ring group-focus-visible/item:outline-2 group-focus-visible/item:outline-offset-2",
                )}
            >
                <div className="flex gap-2 text-sm font-semibold text-secondary group-hover/item:text-secondary_hover">
                    {Icon && <Icon className="size-5 text-fg-quaternary" />} {label}
                </div>

                {shortcut && (
                    <kbd className="flex rounded px-1 py-px font-body text-xs font-medium text-tertiary ring-1 ring-secondary ring-inset">{shortcut}</kbd>
                )}
            </div>
        </button>
    );
};

export const NavAccountCard = ({
    popoverPlacement,
    selectedAccountId,
    items,
    state,
}: {
    popoverPlacement?: Placement;
    selectedAccountId?: string;
    items: UserInfo[];
    state: OverlayTriggerState;
}) => {
    const triggerRef = useRef<HTMLDivElement>(null);
    const isDesktop = useBreakpoint("lg");
    const selectedAccount = items?.find((account) => account.uid === selectedAccountId);

    if (items.length === 0) {
        return (
            <div ref={triggerRef} className="flex items-center  gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset">
                <Link href="/auth#login" className="flex-1">
                    <Button className="w-full">Login</Button>
                </Link>
                <Link href="/auth#signup" className="flex-1">
                    <Button color="secondary" className="w-full">Sign up</Button>
                </Link>
            </div>
        );
    }

    if (!selectedAccount) {
        console.warn(`Account with ID ${selectedAccountId} not found in <NavAccountCard />`);
        return null;
    }

    return (
        <div ref={triggerRef} className="relative flex items-center gap-3 rounded-xl p-3 ring-1 ring-secondary ring-inset">
            <AvatarLabelGroup
                size="md"
                src={selectedAccount.photoURL}
                title={selectedAccount.displayName}
                subtitle={selectedAccount.email}
                status="online"
            />

            <div className="absolute top-1.5 right-1.5">
                <AriaDialogTrigger>
                    <AriaButton className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-fg-quaternary outline-focus-ring transition duration-100 ease-linear hover:bg-primary_hover hover:text-fg-quaternary_hover focus-visible:outline-2 focus-visible:outline-offset-2 pressed:bg-primary_hover pressed:text-fg-quaternary_hover">
                        <ChevronSelectorVertical className="size-4 shrink-0" />
                    </AriaButton>
                    <AriaPopover
                        placement={popoverPlacement ?? (isDesktop ? "right bottom" : "top right")}
                        triggerRef={triggerRef}
                        offset={8}
                        className={({ isEntering, isExiting }) =>
                            cx(
                                "origin-(--trigger-anchor-point) will-change-transform",
                                isEntering &&
                                "duration-150 ease-out animate-in fade-in placement-right:slide-in-from-left-0.5 placement-top:slide-in-from-bottom-0.5 placement-bottom:slide-in-from-top-0.5",
                                isExiting &&
                                "duration-100 ease-in animate-out fade-out placement-right:slide-out-to-left-0.5 placement-top:slide-out-to-bottom-0.5 placement-bottom:slide-out-to-top-0.5",
                            )
                        }
                    >
                        <NavAccountMenu state={state} selectedAccountId={selectedAccountId} items={items} />
                    </AriaPopover>
                </AriaDialogTrigger>
            </div>
        </div>
    );
};
