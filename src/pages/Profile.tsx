import { useState, useEffect } from 'react'
import { useFirebase } from '@/hooks/use-firebase'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Label } from '@/components/base/input/label'
import { Card } from '@/components/tiptap-ui-primitive/card'
import { User01, Wallet01, Key01, Copy01, Check } from '@untitledui/icons'
import { AvatarLabelGroup } from '@/components/base/avatar/avatar-label-group'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
    const { user, loading: firebaseLoading } = useFirebase()

    const navigate = useNavigate()

    useEffect(() => {
        if (firebaseLoading) return
        if (!user) navigate('/auth')
    }, [user, firebaseLoading, navigate])

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
        } catch (error) {
            console.error('复制失败:', error)
        }
    }

    if (!user) return null

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 用户基本信息卡片 */}
                <Card className="mb-8">
                    <div className="p-6">
                        <AvatarLabelGroup
                            size="md"
                            src={user.photoURL}
                            alt={user.displayName || '未设置'}
                            title={user.displayName || '未设置'}
                            subtitle={user.email || '未设置'}
                        />

                        {/* Arweave 地址信息 */}
                        <div className="pt-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <Wallet01 className="h-5 w-5" />
                                <h3 className="text-lg font-semibold">Arweave 钱包</h3>
                            </div>

                            {user.arweaveAddress ? (
                                <div className="space-y-3">
                                    <div>
                                        <Label className="text-sm font-medium ">钱包地址</Label>
                                        <div className="mt-1 flex items-center space-x-2">
                                            <Input
                                                value={user.arweaveAddress}
                                                isReadOnly
                                                className="font-mono text-sm"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => copyToClipboard(user.arweaveAddress!, 'address')}
                                            >
                                                <Copy01 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="">
                                    <p>Arweave 钱包未初始化</p>
                                    <p className="text-xs mt-1">
                                        调试信息: arweaveAddress = {String(user.arweaveAddress)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* 用户数据监视 */}
                <Card>
                    <div className="p-6">
                        <h3 className="text-lg font-semibold  mb-4">用户数据监视</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                    <p className="mt-1 text-sm ">{user.displayName || '未设置'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium ">Arweave 地址</Label>
                                    <p className="mt-1 text-sm  font-mono">{user.arweaveAddress || '未设置'}</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Label className="text-sm font-medium ">完整用户元数据</Label>
                                <pre className="mt-2 p-4 rounded-md text-xs overflow-auto">
                                    {JSON.stringify(user, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
