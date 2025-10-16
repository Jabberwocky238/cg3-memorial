import { useState, useEffect, type FC } from 'react'
import { useFirebase } from '@/hooks/use-firebase'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Label } from '@/components/base/input/label'
import { Card } from '@/components/tiptap-ui-primitive/card'
import { User01, Wallet01, Key01, Copy01, Check, ArrowUp } from '@untitledui/icons'
import { AvatarLabelGroup } from '@/components/base/avatar/avatar-label-group'
import { useNavigate } from 'react-router-dom'
import { useArweave } from '@/hooks/use-arweave'
import { useCashier } from '@/hooks/use-cashier'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { copyToClipboard } from '@/utils/cg-utils'


export default function Profile() {
    const { userFirebase, loading: firebaseLoading } = useFirebase()
    const { userCashier, loading: cashierLoading } = useCashier()
    const { arweaveAddress, loading: arweaveLoading } = useArweave()
    const navigate = useNavigate()

    useEffect(() => {
        if (firebaseLoading) return
        if (!userFirebase) navigate('/auth')
    }, [userFirebase, userCashier, firebaseLoading, navigate])

    if (!userFirebase) return null

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 flex gap-4 overflow-hidden justify-center">
                {/* 锚点导航 */}
                <div className="lg:w-1/5 max-lg:hidden overflow-auto bg-red-500">
                    <AnchorNavigation />
                </div>

                <div className="lg:w-3/5 max-lg:w-full overflow-auto bg-blue-500">
                    {/* 用户基本信息卡片 */}
                    <Card id="user-info" className="mb-8 p-6">
                        <AvatarLabelGroup
                            size="md"
                            src={userFirebase.photoURL}
                            alt={userFirebase.displayName!}
                            title={userFirebase.displayName}
                            subtitle={userFirebase.email}
                        />
                    </Card>

                    {/* 用户 Arweave 地址卡片 */}
                    <Card id="arweave-wallet" className="mb-8 p-6">
                        <ArweaveInfo />
                    </Card>

                    {/* 用户数据监视 */}
                    <Card id="user-data">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold  mb-4">用户数据监视</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <Label className="text-sm font-medium ">用户ID</Label>
                                        <p className="mt-1 text-sm  font-mono">{userFirebase.uid}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium ">邮箱</Label>
                                        <p className="mt-1 text-sm ">{userFirebase.email}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium ">显示名称</Label>
                                        <p className="mt-1 text-sm ">{userFirebase.displayName}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium ">Arweave 地址</Label>
                                        <p className="mt-1 text-sm  font-mono">{arweaveAddress}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium ">钱包余额</Label>
                                        <p className="mt-1 text-sm ">{userCashier?.balance_usd ?? '未获取到'}</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <Label className="text-sm font-medium ">userFirebase</Label>
                                    <pre className="mt-2 p-4 rounded-md text-xs break-all break-words whitespace-pre-wrap overflow-wrap-anywhere overflow-x-hidden">
                                        {JSON.stringify(userFirebase, null, 2)}
                                    </pre>
                                    <Label className="text-sm font-medium ">userCashier</Label>
                                    <pre className="mt-2 p-4 rounded-md text-xs break-all break-words whitespace-pre-wrap overflow-wrap-anywhere overflow-x-hidden">
                                        {JSON.stringify(userCashier, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}

type ControlItem = {
    id: string
    label: string
    icon: FC<{ className?: string }>
    onClick: () => void
}

function AnchorNavigation() {
    const controlList: ControlItem[] = [
        {
            id: 'user-info',
            label: '基本信息',
            icon: User01,
            onClick: () => scrollToSection('user-info')
        },
        {
            id: 'arweave-wallet',
            label: 'Arweave钱包',
            icon: Wallet01,
            onClick: () => scrollToSection('arweave-wallet')
        },
        {
            id: 'user-data',
            label: '数据监视',
            icon: Key01,
            onClick: () => scrollToSection('user-data')
        }
    ]

    const scrollToSection = (sectionId: string) => {
        const element = document.getElementById(sectionId)
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            })
            // 更新URL哈希
            window.history.pushState(null, '', `#${sectionId}`)
        }
    }

    // 页面加载时检查URL哈希并滚动到对应区域
    useEffect(() => {
        const hash = window.location.hash.slice(1) // 移除#号
        if (hash && ['user-info', 'arweave-wallet', 'user-data'].includes(hash)) {
            // 延迟执行，确保页面内容已渲染
            setTimeout(() => {
                scrollToSection(hash)
            }, 100)
        }
    }, [])

    // const scrollToTop = () => {
    //     window.scrollTo({ top: 0, behavior: 'smooth' })
    // }

    return (
        <div className="flex flex-wrap items-center gap-2 w-full">
            {controlList.map((item) => (
                <Button
                    key={item.id}
                    size="sm"
                    color="secondary"
                    onClick={item.onClick}
                    iconLeading={item.icon}
                    className="w-full text-sm"
                >
                    {item.label}
                </Button>
            ))}
        </div>
    )
}

function ArweaveInfo() {
    const { arweaveAddress, loading, error } = useArweave()
    return (
        <>
            <div className="flex items-start space-x-2 mb-4">
                <Wallet01 className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Arweave 钱包</h3>
            </div>

            {error && (
                <div className="">
                    <p>Arweave 钱包初始化失败</p>
                    <p className="text-xs mt-1">
                        调试信息: error = {String(error)}
                    </p>
                </div>
            )}

            {loading && (
                <LoadingIndicator type="line-spinner" size="md" label="Loading Arweave..." />
            )}

            {(!loading && !error) && (
                <div className="space-y-3">
                    <div>
                        <Label className="text-sm font-medium ">钱包地址</Label>
                        <div className="mt-1 flex items-center space-x-2">
                            <Input
                                value={arweaveAddress}
                                isReadOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                size="sm"
                                onClick={() => copyToClipboard(arweaveAddress!, 'address')}
                            >
                                <Copy01 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
