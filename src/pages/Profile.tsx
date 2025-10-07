import { useState, useEffect } from 'react'
import { useFirebase } from '@/hooks/use-firebase'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Label } from '@/components/base/input/label'
import { Card } from '@/components/tiptap-ui-primitive/card'
import { User01, Wallet01, Key01, Copy01, Check } from '@untitledui/icons'
import { AvatarLabelGroup } from '@/components/base/avatar/avatar-label-group'
import { useNavigate } from 'react-router-dom'
import { useArweave } from '@/hooks/use-arweave'
import { useCashier } from '@/hooks/use-cashier'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'

const copyToClipboard = async (text: string, type: string) => {
    try {
        await navigator.clipboard.writeText(text)
    } catch (error) {
        console.error('复制失败:', error)
    }
}

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
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 用户基本信息卡片 */}
                <Card className="mb-8 p-6">
                    <AvatarLabelGroup
                        size="md"
                        src={userFirebase.photoURL}
                        alt={userFirebase.displayName!}
                        title={userFirebase.displayName}
                        subtitle={userFirebase.email}
                    />
                </Card>

                {/* 用户 Arweave 地址卡片 */}
                <Card className="mb-8 p-6">
                    <ArweaveInfo />
                </Card>

                {/* 用户数据监视 */}
                <Card>
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
                                    <p className="mt-1 text-sm ">{userCashier?.balance_usd || '未获取到'}</p>
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
    )
}

function ArweaveInfo() {
    const { arweaveAddress, loading, error } = useArweave()
    return (
        <>
            <div className="flex items-center space-x-2 mb-4">
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
