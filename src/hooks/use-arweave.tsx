import Arweave from 'arweave';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useFirebase } from './use-firebase';
import Transaction from 'arweave/node/lib/transaction';
import type { JWKInterface } from 'arweave/node/lib/wallet';

const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

interface ArweaveContextType {
    searchTx: (query: string) => Promise<any>
    createTx: (content: string, headers: [[string, string]]) => Promise<Transaction>
    address: string | null
    privateKey: JWKInterface | null
}

const ArweaveContext = createContext<ArweaveContextType | null>(null)

export function ArweaveProvider({ children }: { children: React.ReactNode }) {
    const { setSecretArweaveKey, getSecretArweaveKey, user, updateUserMetaInfo } = useFirebase()
    const [privateKey, setPrivateKey] = useState<JWKInterface | null>(null)
    const [address, setAddress] = useState<string | null>(null)

    const createTx = async (content: string, headers: [[string, string]]) => {
        if (!arweave) {
            throw new Error('Arweave 未初始化')
        }
        if (!privateKey) {
            throw new Error('私钥未加载')
        }
        const tx = await arweave.createTransaction({
            data: content,
        }, privateKey)
        for (const header of headers) {
            tx.addTag(header[0], header[1])
        }
        await arweave.transactions.sign(tx, privateKey)
        console.log(tx, privateKey)
        // const res = await arweave.transactions.post(tx)
        // console.log(res)
        // return res
        return tx
    }

    const searchTx = async (query: string) => {
        if (!arweave) {
            throw new Error('Arweave 未初始化')
        }
        const res = await arweave.transactions.get(query)
        return res
    }

    useEffect(() => {
        const tryLoadPrivateKey = async () => {
            if (!arweave) {
                throw new Error('Arweave 未初始化')
            }
            if (user) {
                try {
                    let key = await getSecretArweaveKey(user.uid)
                    if (key) {
                        console.log('Arweave 私钥加载成功')
                    } else {
                        console.log('Arweave hook: 创建新私钥...')
                        // 如果没有私钥，则创建一个
                        key = await arweave.wallets.generate()
                        console.log('Arweave hook: 新私钥生成成功')
                        await setSecretArweaveKey(user.uid, key)
                        console.log('Arweave 私钥创建成功')
                    }
                    setPrivateKey(key)
                    const address = await arweave.wallets.jwkToAddress(key)
                    setAddress(address)
                    await updateUserMetaInfo(user.uid, { 'arweaveAddress': address })
                } catch (error) {
                    console.error('Arweave 私钥加载失败:', error)
                }
            } else {
                console.log('Arweave hook: 用户未登录，清空状态')
                // 用户登出时清空状态
                setPrivateKey(null)
                setAddress(null)
            }
        }

        tryLoadPrivateKey()
    }, [user])

    return (
        <ArweaveContext.Provider value={{ createTx, searchTx, address, privateKey }}>
            {children}
        </ArweaveContext.Provider>
    )
}

export function useArweave() {
    const context = useContext(ArweaveContext)

    if (!context) {
        throw new Error('useArweave must be used within an ArweaveProvider')
    }

    return context
}

