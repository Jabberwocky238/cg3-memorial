import { createContext, type DOMAttributes, type FC, type PropsWithChildren, type ReactElement } from "react";
import { Archive, X as CloseIcon, Menu02, Trash01 } from "@untitledui/icons";
import type { FocusableElement } from "@react-types/shared";
import {
    Button as AriaButton,
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
    type ButtonProps,
    type OverlayTriggerState,
    Pressable,
} from "react-aria-components";
import { UntitledLogo } from "@@/foundations/logo/untitledui-logo";
import { cx } from "@/utils/cx";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ButtonGroup, ButtonGroupItem } from "@/components/base/button-group/button-group";

interface MobileNavigationHeaderProps {
    children: ((state: OverlayTriggerState) => React.ReactNode) | React.ReactNode
}

export const MobileNavigationHeader = ({ children }: MobileNavigationHeaderProps) => {
    return (
        <AriaDialogTrigger>
            <header className="flex h-16 items-center justify-between border-b border-secondary bg-primary py-3 pr-2 pl-4 lg:hidden">
                <UntitledLogo />

                <AriaButton
                    aria-label="Expand navigation menu"
                    className="group flex items-center justify-center rounded-lg bg-primary p-2 text-fg-secondary outline-focus-ring hover:bg-primary_hover hover:text-fg-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    <Menu02 className="size-6 transition duration-200 ease-in-out group-aria-expanded:opacity-0" />
                    <CloseIcon className="absolute size-6 opacity-0 transition duration-200 ease-in-out group-aria-expanded:opacity-100" />
                </AriaButton>
            </header>

            <AriaModalOverlay
                isDismissable
                className={({ isEntering, isExiting }) =>
                    cx(
                        "fixed inset-0 z-50 cursor-pointer bg-overlay/70 pr-16 backdrop-blur-md lg:hidden",
                        isEntering && "duration-300 ease-in-out animate-in fade-in",
                        isExiting && "duration-200 ease-in-out animate-out fade-out",
                    )
                }
            >
                {({ state }) => (
                    <>
                        <AriaButton
                            aria-label="Close navigation menu"
                            onPress={() => state.close()}
                            className="fixed top-3 right-2 flex cursor-pointer items-center justify-center rounded-lg p-2 text-fg-white/70 outline-focus-ring hover:bg-white/10 hover:text-fg-white focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <CloseIcon className="size-6" />
                        </AriaButton>

                        <AriaModal className="w-full cursor-auto will-change-transform">
                            <AriaDialog className="h-dvh outline-hidden focus:outline-hidden">
                                {typeof children === 'function' ? children(state) : children}
                            </AriaDialog>
                        </AriaModal>
                    </>
                )}
            </AriaModalOverlay>
        </AriaDialogTrigger>
    );
};

interface MobilePortalProps extends PropsWithChildren {
    children: React.ReactNode
    hiddenClass: string
    OpenIcon: FC<{ className?: string }>
    CloseIcon: FC<{ className?: string }>
}

export const MobilePortal = ({ children, hiddenClass, OpenIcon, CloseIcon }: MobilePortalProps) => {
    return (
        <AriaDialogTrigger>
            <AriaButton
                aria-label="Expand navigation menu"
                className={`z-50 fixed right-6 bottom-6 group flex 
                items-center justify-center rounded-lg 
                ${hiddenClass}
                bg-primary p-2 text-fg-secondary outline-focus-ring 
                hover:bg-primary_hover hover:text-fg-secondary_hover hover:cursor-pointer
                focus-visible:outline-2 focus-visible:outline-offset-2`}
            >
                <OpenIcon className="size-6 transition duration-200 ease-in-out group-aria-expanded:opacity-0" />
                <CloseIcon className="absolute size-6 opacity-0 transition duration-200 ease-in-out group-aria-expanded:opacity-100" />
            </AriaButton>

            <AriaModalOverlay
                isDismissable
                className={({ isEntering, isExiting }) =>
                    cx(
                        "fixed inset-0 z-50 cursor-pointer bg-overlay/70 pr-16 backdrop-blur-md",
                        `${hiddenClass}`,
                        isEntering && "duration-300 ease-in-out animate-in fade-in",
                        isExiting && "duration-200 ease-in-out animate-out fade-out",
                    )
                }
            >
                {({ state }) => (
                    <>
                        <AriaButton
                            aria-label="Close navigation menu"
                            onPress={() => state.close()}
                            className="fixed top-3 right-2 flex 
                            cursor-pointer items-center justify-center 
                            rounded-lg p-2 text-fg-white/70 outline-focus-ring 
                            hover:bg-white/10 hover:text-fg-white hover:cursor-pointer
                            focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <CloseIcon className="size-6" />
                        </AriaButton>

                        <AriaModal className="w-full cursor-auto will-change-transform">
                            <AriaDialog className="h-dvh outline-hidden focus:outline-hidden">{children}</AriaDialog>
                        </AriaModal>
                    </>
                )}
            </AriaModalOverlay>
        </AriaDialogTrigger>
    );
};


interface GeneralPortalProps {
    children: (close: () => void) => React.ReactNode
    trigger: ReactElement<DOMAttributes<FocusableElement>, string>
}

export const GeneralPortal = ({ children, trigger }: GeneralPortalProps) => {
    return (
        <AriaDialogTrigger >
            {/* <AriaButton>{trigger}</AriaButton> */}
            <Pressable>{trigger}</Pressable>
            <AriaModalOverlay
                isDismissable
                className={({ isEntering, isExiting }) =>
                    cx(
                        "fixed inset-0 z-50 cursor-pointer backdrop-blur-md",
                        isEntering && "duration-300 ease-in-out animate-in fade-in",
                        isExiting && "duration-200 ease-in-out animate-out fade-out",
                    )
                }
            >
                {({ state }) => (
                    <AriaModal
                        className="cursor-auto will-change-transform w-full h-full">
                        <AriaDialog
                            className="outline-hidden flex flex-col justify-center items-center w-full h-full"
                        >
                            {children(state.close)}
                        </AriaDialog>
                    </AriaModal>
                )}
            </AriaModalOverlay>
        </AriaDialogTrigger>
    );
};



interface ModalButtonProps {
    isLoading?: boolean
    iconLeading?: FC<{ className?: string }>
    color?: "secondary" | "tertiary"
    size?: "sm" | "md" | "lg"
    title: string
    tooltip?: string
    onClick?: () => void
    forceRefresh?: boolean

    children: React.ReactNode | ((close: () => void) => React.ReactNode)
    actions?: {
        label: string
        onClick: (close: () => void) => void | Promise<void>
        icon?: FC<{ className?: string }>
        color?: "secondary" | "tertiary"
        size?: "sm" | "md" | "lg"
    }[]
}

export const ModalButton = ({ children, actions, ...otherProps }: ModalButtonProps) => {
    const { isLoading, iconLeading, color, size, title, tooltip, onClick, forceRefresh } = otherProps
    return (
        <GeneralPortal
            key={forceRefresh ? `modal-${Date.now()}` : undefined}
            trigger={
                <Button
                    type="div"
                    className="w-full"
                    isLoading={isLoading} iconLeading={iconLeading}
                    color={color} size={size} onClick={onClick}
                >
                    {title}
                </Button>
            }>
            {(close) => (
                <div className="bg-primary p-4 rounded-lg border border-secondary md:w-120 max-md:w-full max-h-full overflow-auto">
                    <header className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">{title}</h2>
                        <ButtonUtility onClick={close} color="secondary"
                            size="sm" tooltip={tooltip} icon={CloseIcon} />
                    </header>
                    {typeof children === 'function' ? children(close) : children}
                    {actions && <footer className="flex justify-end mt-4">
                        <ButtonGroup>
                            {actions?.map((action) => (
                                <ButtonGroupItem
                                    key={action.label}
                                    iconLeading={action.icon}
                                    onClick={() => {
                                        action.onClick(close)
                                    }}
                                >
                                    {action.label}
                                </ButtonGroupItem>
                            ))}
                        </ButtonGroup>
                    </footer>}
                </div>
            )}
        </GeneralPortal>
    );
};

