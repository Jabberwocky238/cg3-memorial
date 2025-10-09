import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useFirebase } from './use-firebase';
import { useAppState } from './use-app-state';

import Arweave from 'arweave/web';
import Transaction from 'arweave/web/lib/transaction';
import type { JWKInterface } from 'arweave/web/lib/wallet';

export interface UserArweaveSecret {
    privateKey?: JWKInterface
}

export interface UserArweavePublic {
    arweaveAddress: string
}

interface ArweaveContextType extends UserArweaveSecret, UserArweavePublic {
    initing: boolean
    loading: boolean
    error: string | null
    searchTx: (query: string) => Promise<any>
    searchByQuery: (tags: Record<string, string>, arweaveAddress?: string) => Promise<any>
    createTx: (content: string, headers: [string, string][]) => Promise<any>
}

const ARWEAVE_JWK = 'arweaveJWK' as const
const ArweaveContext = createContext<ArweaveContextType | null>(null)

export function ArweaveProvider({ children }: { children: React.ReactNode }) {
    const arweaveRef = useRef<Arweave | null>(null)
    const [loading, setLoading] = useState(true)
    const [initing, setIniting] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [innerSecret, setInnerSecret] = useState<UserArweaveSecret | null>(null)
    const [innerPublic, setInnerPublic] = useState<UserArweavePublic | null>(null)

    const {
        userFirebase: user, auth, loading: fbloading,
        getFirebaseSecret, setFirebaseSecret,
        getFirebasePublic, setFirebasePublic
    } = useFirebase()

    useEffect(() => {
        setLoading(true)
        try {
            arweaveRef.current = Arweave.init({
                host: 'arweave.net',
                port: 443,
                protocol: 'https'
            })
        } catch (error) {
            setError('初始化 Arweave 失败: ' + error)
        } finally {
            setLoading(false)
        }
    }, [])

    const tryLoadPrivateKey = async () => {
        if (!arweaveRef.current) throw new Error('Arweave 未初始化')
        if (user) {
            console.log(user)
            const secret = await getFirebaseSecret(user.uid)
            let key: JWKInterface | null = null

            if (secret) {
                if (Object.keys(secret).find(key => key === ARWEAVE_JWK)) {
                    key = parseArweaveKey(secret[ARWEAVE_JWK] as Record<string, unknown>)
                }
            }
            // key posibly is still null
            if (!key) {
                // 如果没有私钥 / 不合法，则创建一个
                console.log('Arweave hook: 创建新私钥...')
                key = await arweaveRef.current.wallets.generate()
                await setFirebaseSecret(user.uid, { [ARWEAVE_JWK]: key })
                console.log('Arweave 私钥创建成功')
            } else {
                console.log('Arweave 私钥加载成功')
            }

            const address = await arweaveRef.current.wallets.jwkToAddress(key)
            setInnerSecret({ privateKey: key })
            setInnerPublic({ arweaveAddress: address })
            setFirebasePublic(user.uid, { arweaveAddress: address })
        } else {
            console.log('Arweave hook: 用户未登录，清空状态')
            setInnerSecret(null)
            setInnerPublic(null)
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
        setLoading(true)
        console.log('Arweave hook: 加载 Arweave 私钥...')
        try {
            tryLoadPrivateKey()
        } catch (error) {
            console.error('Arweave hook: 加载 Arweave 私钥失败: ' + error)
            setError('加载 Arweave 私钥失败: ' + error)
        } finally {
            setLoading(false)
        }
        setIniting(false)
    }, [fbloading, arweaveRef.current, auth])

    const createTx = useCallback((content: string, headers: [string, string][]) => {
        if (!arweaveRef.current || !innerSecret?.privateKey) throw new Error('Arweave 未初始化或私钥未加载')
        return _createTx(arweaveRef.current, innerSecret.privateKey, content, headers)
    }, [arweaveRef.current, innerSecret?.privateKey])

    const searchTx = useCallback((query: string) => {
        if (!arweaveRef.current) throw new Error('Arweave 未初始化')
        return _searchTx(arweaveRef.current, query)
    }, [arweaveRef.current])

    const searchByQuery = useCallback((tags: Record<string, string>, arweaveAddress?: string) => {
        if (!arweaveRef.current) throw new Error('Arweave 未初始化')
        return _searchByQuery(arweaveRef.current, tags, arweaveAddress)
    }, [arweaveRef.current])

    return (
        <ArweaveContext.Provider value={{
            initing, loading, error,
            createTx, searchTx, searchByQuery,
            privateKey: innerSecret?.privateKey,
            arweaveAddress: innerPublic?.arweaveAddress ?? '',
        }}>
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

    const res = await arweave.api.post('tx', tx, {
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    })
    console.log(res)
    return { tx, res }
}

const _searchByQuery = async (arweave: Arweave, tags: Record<string, string>, arweaveAddress?: string) => {
    const tagsString = Object.entries(tags).map(([name, value]) => `{ name: "${name}", values: ["${value}"] }`).join(',')
    const ownersString = arweaveAddress ? `owners:["${arweaveAddress}"]` : ''
    const queryObject = {
        query:
            `{
            transactions (
                ${ownersString},
                tags: [ ${tagsString} ]
            ) {
                edges {
                    node {
                        id
                    }
                }
            }
        }`
    };
    const res = await arweave.api.post('/graphql', queryObject)
    return res.data
}


const _searchTx = async (arweave: Arweave, query: string) => {
    const res = await arweave.transactions.get(query)
    return res.toJSON()
}

function parseArweaveKey(key: Record<string, unknown>): JWKInterface | null {
    if (!key) {
        return null
    }
    const COMPONENTS = ['e', 'n', 'd', 'p', 'q', 'dp', 'dq', 'qi']
    const components = COMPONENTS.map(component => key[component])
    if (components.some(component => component === undefined)) {
        return null
    }
    return {
        kty: key.kty,
        e: key.e,
        n: key.n,

        d: key.d,
        p: key.p,
        q: key.q,
        dp: key.dp,
        dq: key.dq,
        qi: key.qi,
    } as JWKInterface
}
