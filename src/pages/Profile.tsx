import { useState, useEffect } from 'react'
import { useFirebase } from '@/hooks/use-firebase'
import { useArweave } from '@/hooks/use-arweave'
import { Button } from '@/components/base/buttons/button'
import { Input } from '@/components/base/input/input'
import { Label } from '@/components/base/input/label'
import { Card } from '@/components/tiptap-ui-primitive/card'
import { User01, Wallet01, Key01, Copy01, Check } from '@untitledui/icons'
import { AvatarLabelGroup } from '@/components/base/avatar/avatar-label-group'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
    const { user, getUserMetaInfo, loading: firebaseLoading } = useFirebase()
    const { createTx, searchTx, address: arweaveAddress } = useArweave()
    const [userMeta, setUserMeta] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState<string | null>(null)
    const [testContent, setTestContent] = useState('')
    const [testHeaders, setTestHeaders] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const loadUserData = async () => {
            console.log('Profile: Firebase loading:', firebaseLoading, 'User:', user?.uid)
            
            // 如果 Firebase 还在加载，不执行任何操作
            if (firebaseLoading) {
                console.log('Profile: Firebase 还在加载中，等待...')
                return
            }
            
            if (user) {
                console.log('Profile: 用户已登录，加载用户数据...')
                try {
                    const meta = await getUserMetaInfo(user.uid)
                    setUserMeta(meta)
                } catch (error) {
                    console.error('加载用户数据失败:', error)
                } finally {
                    setLoading(false)
                }
            } else {
                console.log('Profile: 用户未登录，跳转到登录页面')
                // 只有在 Firebase 加载完成且用户确实未登录时才跳转
                navigate('/auth')
            }
        }
        loadUserData()
    }, [user, getUserMetaInfo, firebaseLoading, navigate])

    const copyToClipboard = async (text: string, type: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(type)
            setTimeout(() => setCopied(null), 2000)
        } catch (error) {
            console.error('复制失败:', error)
        }
    }

    const handleTestTransaction = async () => {
        if (!testContent.trim()) {
            alert('请输入测试内容')
            return
        }

        try {
            const headers = testHeaders.trim()
                ? testHeaders.split(',').map(h => h.trim().split('=')) as [[string, string]]
                : [['Content-Type', 'text/plain']] as [[string, string]]

            const tx = await createTx(testContent, headers)
            console.log('交易创建成功:', tx)
            alert(`交易创建成功！ID: ${tx.id}`)
        } catch (error) {
            console.error('创建交易失败:', error)
            alert('创建交易失败: ' + (error as Error).message)
        }
    }

    const handleSearchTransaction = async () => {
        if (!testContent.trim()) {
            alert('请输入要搜索的交易ID')
            return
        }

        try {
            const result = await searchTx(testContent)
            console.log('搜索结果:', result)
            alert('搜索结果已输出到控制台')
        } catch (error) {
            console.error('搜索失败:', error)
            alert('搜索失败: ' + (error as Error).message)
        }
    }

    if (firebaseLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"></div>
                    <p className="mt-2 ">加载中...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="">请先登录</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* 用户基本信息卡片 */}
                <Card className="mb-8">
                    <div className="p-6">
                        <AvatarLabelGroup
                            size="md"
                            src={user.photoURL}
                            alt={userMeta?.displayName || user.displayName || '未设置'}
                            title={userMeta?.displayName || user.displayName || '未设置'}
                            subtitle={user.email || '未设置'}
                        />

                        {/* Arweave 地址信息 */}
                        <div className="pt-6">
                            <div className="flex items-center space-x-2 mb-4">
                                <Wallet01 className="h-5 w-5" />
                                <h3 className="text-lg font-semibold">Arweave 钱包</h3>
                            </div>

                            {arweaveAddress ? (
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
                                                onClick={() => copyToClipboard(arweaveAddress, 'address')}
                                            >
                                                {copied === 'address' ? <Check className="h-4 w-4" /> : <Copy01 className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="">
                                    <p>Arweave 钱包未初始化</p>
                                    <p className="text-xs mt-1">
                                        调试信息: arweaveAddress = {String(arweaveAddress)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Arweave 功能测试区域 */}
                <Card className="mb-8">
                    <div className="p-6">
                        <div className="flex items-center space-x-2 mb-6">
                            <Key01 className="h-5 w-5 " />
                            <h3 className="text-lg font-semibold ">Arweave 功能测试</h3>
                        </div>

                        <div className="space-y-6">
                            {/* 创建交易测试 */}
                            <div>
                                <h4 className="text-md font-medium  mb-3">创建交易</h4>
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="testContent">内容</Label>
                                        <Input
                                            id="testContent"
                                            value={testContent}
                                            onChange={(e) => setTestContent(e)}
                                            placeholder="输入要存储的内容..."
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="testHeaders">标签 (格式: key1=value1,key2=value2)</Label>
                                        <Input
                                            id="testHeaders"
                                            value={testHeaders}
                                            onChange={(e) => setTestHeaders(e)}
                                            placeholder="Content-Type=text/plain,Title=测试文章"
                                            className="mt-1"
                                        />
                                    </div>
                                    <Button onClick={handleTestTransaction}>
                                        创建交易
                                    </Button>
                                </div>
                            </div>

                            {/* 搜索交易测试 */}
                            <div className="border-t pt-6">
                                <h4 className="text-md font-medium  mb-3">搜索交易</h4>
                                <div className="space-y-3">
                                    <div>
                                        <Label htmlFor="searchTx">交易ID</Label>
                                        <Input
                                            id="searchTx"
                                            value={testContent}
                                            onChange={(e) => setTestContent(e)}
                                            placeholder="输入要搜索的交易ID..."
                                            className="mt-1"
                                        />
                                    </div>
                                    <Button onClick={handleSearchTransaction}>
                                        搜索交易
                                    </Button>
                                </div>
                            </div>
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
                                    <p className="mt-1 text-sm ">{userMeta?.displayName || '未设置'}</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium ">Arweave 地址</Label>
                                    <p className="mt-1 text-sm  font-mono">{arweaveAddress || '未设置'}</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Label className="text-sm font-medium ">完整用户元数据</Label>
                                <pre className="mt-2 p-4 rounded-md text-xs overflow-auto">
                                    {JSON.stringify(userMeta, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
