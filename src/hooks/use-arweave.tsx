import { createContext, useContext, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useFirebase } from './use-firebase';
import { useAppState } from './use-app-state';

import Arweave from 'arweave';
import Transaction from 'arweave/node/lib/transaction';
import type { JWKInterface } from 'arweave/node/lib/wallet';


interface ArweaveContextType {
    searchTx: (query: string) => Promise<any>
    createTx: (content: string, headers: [[string, string]]) => Promise<Transaction>
    privateKey: JWKInterface | null
}

const ArweaveContext = createContext<ArweaveContextType | null>(null)

export function ArweaveProvider({ children }: { children: React.ReactNode }) {
    const arweaveRef = useRef<Arweave | null>(null)
    const [privateKey, setPrivateKey] = useState<JWKInterface | null>(null)

    const { LOG_append, LOG_clear, setError } = useAppState()
    const { setSecretArweaveKey, getSecretArweaveKey, user, setUserMeta, loading: fbloading } = useFirebase()

    useEffect(() => {
        LOG_append('初始化 Arweave...')
        try {
            arweaveRef.current = Arweave.init({
                host: 'arweave.net',
                port: 443,
                protocol: 'https'
            })
        } catch (error) {
            setError('初始化 Arweave 失败: ' + error)
        } finally {
            LOG_clear()
        }
    }, [])

    const tryLoadPrivateKey = async () => {
        if (!arweaveRef.current) {
            throw new Error('Arweave 未初始化')
        }
        if (user) {
            console.log(user)
            let key = await getSecretArweaveKey(user.uid)
            if (key) {
                console.log('Arweave 私钥加载成功')
            } else {
                console.log('Arweave hook: 创建新私钥...')
                // 如果没有私钥，则创建一个
                key = await arweaveRef.current.wallets.generate()
                await setSecretArweaveKey(user.uid, key)
                console.log('Arweave 私钥创建成功')
            }
            setPrivateKey(key)
            const address = await arweaveRef.current.wallets.jwkToAddress(key)
            await setUserMeta({ ...user, arweaveAddress: address })
        } else {
            console.log('Arweave hook: 用户未登录，清空状态')
            setPrivateKey(null)
            // setUserMeta(null) // useFirebase已经清理
        }
    }

    useEffect(() => {
        if (fbloading) {
            console.log('Arweave hook: fbloading')
            return
        }
        if (!arweaveRef.current) {
            console.log('Arweave hook: arweaveRef 未初始化')
            return
        }
        LOG_append('加载 Arweave 私钥...')
        console.log('Arweave hook: 加载 Arweave 私钥...')
        try {
            tryLoadPrivateKey()
        } catch (error) {
            console.error('Arweave hook: 加载 Arweave 私钥失败: ' + error)
            setError('加载 Arweave 私钥失败: ' + error)
        } finally {
            LOG_clear()
        }
    }, [fbloading, arweaveRef.current])

    const createTx = async (content: string, headers: [[string, string]]) => {
        if (!privateKey || !arweaveRef.current) {
            throw new Error('Arweave 私钥未加载或未初始化')
        }
        const tx = await arweaveRef.current.createTransaction({
            data: content,
        }, privateKey)
        for (const header of headers) {
            tx.addTag(header[0], header[1])
        }
        await arweaveRef.current.transactions.sign(tx, privateKey)
        console.log(tx, privateKey)
        // const res = await arweave.transactions.post(tx)
        // console.log(res)
        // return res
        return tx
    }

    const searchTx = async (query: string) => {
        const res = await arweaveRef.current?.transactions.get(query)
        return res
    }

    return (
        <ArweaveContext.Provider value={{ createTx, searchTx, privateKey }}>
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

