import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useFirebase } from './use-firebase';
import { useAppState } from './use-app-state';

import Arweave from 'arweave/web';
import Transaction from 'arweave/web/lib/transaction';
import type { JWKInterface } from 'arweave/web/lib/wallet';

interface ArweaveContextType {
    searchTx: (query: string) => Promise<any>
    createTx: (content: string, headers: [string, string][]) => Promise<any>
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
                // host: 'arweave.net',
                // port: 443,
                // protocol: 'https'
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

    const createTx = useCallback((content: string, headers: [string, string][]) => {
        if (!arweaveRef.current || !privateKey) {
            throw new Error('Arweave 未初始化或私钥未加载')
        }
        return _createTx(arweaveRef.current, privateKey, content, headers)
    }, [arweaveRef.current, privateKey])

    const searchTx = useCallback((query: string) => {
        if (!arweaveRef.current) {
            throw new Error('Arweave 未初始化')
        }
        return _searchTx(arweaveRef.current, query)
    }, [arweaveRef.current])

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


const _createTx = async (arweave: Arweave, privateKey: JWKInterface, content: string, headers: [string, string][]) => {
    const tx = await arweave.createTransaction({
        data: content,
    }, privateKey)
    for (const header of headers) {
        tx.addTag(header[0], header[1])
    }
    await arweave.transactions.sign(tx, privateKey)
    console.log(tx, privateKey)
    const isVerify = await arweave.transactions.verify(tx)
    console.log(isVerify)

    
    // const uploader = await arweave.transactions.getUploader(tx);
    // while (!uploader.isComplete) {
    //     const res = await uploader.uploadChunk();
    //     console.log(res)
    //     console.log(uploader.pctComplete, uploader)
    // }
    // console.log(uploader.toJSON())
    // return uploader.toJSON()

    // const res = await arweave.transactions.post(tx)
    // return res

    const res = await arweave.api.post('tx', tx, {
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    })
    console.log(res)
    return { tx, res }
}


const _searchTx = async (arweave: Arweave, query: string) => {
    const res = await arweave.transactions.get(query)
    return res
}
