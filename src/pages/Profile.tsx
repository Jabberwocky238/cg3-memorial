import { useState, useEffect, type FC } from 'react'
import { useFirebase } from '@/hooks/use-firebase'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Label } from '@/components/base/input/label'
import { Card } from '@/components/tiptap-ui-primitive/card'
import { User01, Wallet01, Key01, Copy01, Check, ArrowUp } from '@untitledui/icons'
import { AvatarLabelGroup } from '@/components/base/avatar/avatar-label-group'
import { useNavigate } from 'react-router-dom'
import { useArweave, type SearchByQueryResponse, type UserArweavePublic } from '@/hooks/use-arweave'
import { useCashier, type UserCashier } from '@/hooks/use-cashier'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'
import { copyToClipboard } from '@/utils/cg-utils'
import { LoadingErrorHelper } from '@/hooks/use-app-state'
import { Divider } from '@/components/tremor/Divider'
import type { User } from 'firebase/auth'
import type Transaction from 'arweave/web/lib/transaction'
import { HelpCircle } from "@untitledui/icons";
import { Tooltip, TooltipTrigger } from "@/components/base/tooltip/tooltip";

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
        if (hash && controlList.some(item => item.id === hash)) {
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

export default function Profile() {
    const { userFirebase, loading: firebaseLoading } = useFirebase()
    const { userCashier, loading: cashierLoading } = useCashier()
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

                <div className="lg:w-3/5 max-lg:w-full max-lg:p-4 overflow-auto scrollbar-hide bg-blue-500">
                    {/* 用户基本信息卡片 */}
                    <Card id="user-info" className="mb-8 p-6 w-full">
                        <AvatarLabelGroup
                            size="md"
                            src={userFirebase.photoURL}
                            alt={userFirebase.displayName!}
                            title={userFirebase.displayName}
                            subtitle={userFirebase.email}
                        />
                    </Card>

                    {/* 用户 Arweave 地址卡片 */}
                    <Card id="arweave-wallet" className="mb-8 p-6 w-full">
                        <div className=" flex items-center gap-2 w-full">
                            <Wallet01 className="h-5 w-5" />
                            <h3 className="text-lg font-semibold">Arweave 钱包</h3>
                        </div>
                        <Divider />
                        <ArweaveInfoSection />
                    </Card>

                    {/* 用户数据监视 */}
                    <Card id="user-data" className="mb-8 p-6 w-full">
                        <div className=" flex items-center gap-2 w-full">
                            <Key01 className="h-5 w-5" />
                            <h3 className="text-lg font-semibold">用户数据监视</h3>
                        </div>
                        <Divider />
                        <DebugSection user={userFirebase} cashier={userCashier!} />
                    </Card>
                </div>
            </div>
        </div>
    )
}



function ArweaveInfoSection() {
    const {
        loading, error, arweave,
        publicThings, privateThings,
        searchByQueryRaw
    } = useArweave()
    const [balance, setBalance] = useState<string>('0')
    const [transactions, setTransactions] = useState<SearchByQueryResponse['transactions']['edges']>([])

    useEffect(() => {
        if (loading || error) return
        if (!arweave) return
        if (publicThings?.arweaveAddress) {
            arweave.wallets.getBalance(publicThings.arweaveAddress).then(setBalance)
            searchByQueryRaw({}, publicThings.arweaveAddress).then((txs) => {
                setTransactions(txs.transactions.edges)
            }).catch(console.error)
        }
    }, [loading, error, arweave, publicThings?.arweaveAddress])

    return (
        <LoadingErrorHelper loading={loading} error={error}>
            <div className="w-full">
                <div className="space-y-3">
                    <div>
                        <Label className="text-sm font-medium ">钱包地址</Label>
                        <div className="mt-1 flex items-center space-x-2">
                            <Input
                                value={publicThings?.arweaveAddress ?? ''}
                                isReadOnly
                                className="font-mono text-sm"
                            />
                            <Button
                                size="lg"
                                onClick={() => copyToClipboard(publicThings?.arweaveAddress ?? '', 'address')}
                            >
                                <Copy01 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label className="text-sm font-medium flex items-center gap-2">
                            钱包余额
                            <Tooltip title="钱包余额是用户在Arweave网络中的余额，用于支付交易费用。此数字不是USD，大于零即可正常使用。" placement="top">
                                <TooltipTrigger>
                                    <HelpCircle className="size-4" />
                                </TooltipTrigger>
                            </Tooltip>
                        </Label>
                        <div className="mt-1 flex items-center space-x-2">
                            <Input value={balance} isReadOnly className="font-mono text-sm" />
                        </div>
                    </div>
                    <div>
                        <Label className="text-sm font-medium ">所有Transactions</Label>
                        <div className="mt-1 ">
                            {transactions.map(tx => (
                                <div key={tx.node.id}>
                                    <p className='text-xs'>{tx.node.id} - {tx.node.owner.address} - {tx.node.data.size} - {tx.node.block.height} - {tx.node.block.timestamp}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </LoadingErrorHelper>
    )
}


interface DebugSectionProps {
    user: User
    cashier: UserCashier
}

function DebugSection({ user, cashier }: DebugSectionProps) {
    const { publicThings, privateThings, loading } = useArweave()
    return (
        <>
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <Label className="text-sm font-medium ">用户ID</Label>
                        <p className="mt-1 text-sm  font-mono">{user.uid}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium ">邮箱</Label>
                        <p className="mt-1 text-sm ">{user.email}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium ">显示名称</Label>
                        <p className="mt-1 text-sm ">{user.displayName}</p>
                    </div>
                    <div>
                        <Label className="text-sm font-medium ">Arweave publicThings</Label>
                        <pre className="mt-1 p-4 rounded-md text-xs break-all break-words whitespace-pre-wrap overflow-wrap-anywhere overflow-x-hidden">
                            {JSON.stringify(publicThings, null, 2)}
                        </pre>
                        <Label className="text-sm font-medium ">Arweave privateThings</Label>
                        <pre className="mt-2 p-4 rounded-md text-xs break-all break-words whitespace-pre-wrap overflow-wrap-anywhere overflow-x-hidden">
                            {JSON.stringify(privateThings, null, 2)}
                        </pre>
                    </div>
                </div>

                <div className="mt-6">
                    <Label className="text-sm font-medium ">user</Label>
                    <pre className="mt-2 p-4 rounded-md text-xs break-all break-words whitespace-pre-wrap overflow-wrap-anywhere overflow-x-hidden">
                        {JSON.stringify(user, null, 2)}
                    </pre>
                    <Label className="text-sm font-medium ">userCashier</Label>
                    <pre className="mt-2 p-4 rounded-md text-xs break-all break-words whitespace-pre-wrap overflow-wrap-anywhere overflow-x-hidden">
                        {JSON.stringify(cashier, null, 2)}
                    </pre>
                </div>
            </div>
        </>
    )
}