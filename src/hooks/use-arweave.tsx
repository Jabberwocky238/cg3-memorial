import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useFirebase } from './use-firebase';

import Arweave from 'arweave/web';
import Transaction from 'arweave/web/lib/transaction';
import type { JWKInterface } from 'arweave/web/lib/wallet';
import { EasyError } from './use-error';
import { LoadingPage, useLoading } from './use-loading';

export interface UserArweaveSecret {
    privateKey?: JWKInterface
}

export interface UserArweavePublic {
    arweaveAddress: string
}

interface ArweaveContextType {
    arweave: Arweave
    privateThings: UserArweaveSecret | null
    publicThings: UserArweavePublic | null

    createTx: (content: string, headers: [string, string][]) => Promise<any>
    searchTx: (query: string) => Promise<Transaction>
    searchByQuery: (tags: Record<string, string>, arweaveAddress?: string) => Promise<any>
    searchByQueryRaw: (tags: Record<string, string>, arweaveAddress?: string) => Promise<SearchByQueryResponse>
}

const ARWEAVE_JWK = 'arweaveJWK' as const
const ArweaveContext = createContext<ArweaveContextType | null>(null)

export function ArweaveProvider({ children }: { children: React.ReactNode }) {
    const arweaveRef = useRef<Arweave | null>(null)
    const [innerSecret, setInnerSecret] = useState<UserArweaveSecret | null>(null)
    const [innerPublic, setInnerPublic] = useState<UserArweavePublic | null>(null)

    const {
        userFirebase: user, auth, loading: fbloading,
        getFirebaseSecret, setFirebaseSecret,
        getFirebasePublic, setFirebasePublic
    } = useFirebase()

    const { start: startInitArweave, loading: loadingInitArweave } = useLoading({
        asyncfn: async () => {
            arweaveRef.current = Arweave.init({
                host: 'arweave.net',
                port: 443,
                protocol: 'https'
            })
        },
        label: '加载 Arweave 私钥...'
    })

    useEffect(() => {
        startInitArweave()
    }, [])

    const tryLoadPrivateKey = async () => {
        if (!arweaveRef.current) throw new Error('Arweave 未初始化')
        console.log('Arweave: Trying to load Arweave private key...')
        try {
            if (user) {
                console.log(user)
                const secret = await getFirebaseSecret(user.uid)
                let key: JWKInterface | null = null

                if (secret) {
                    if (Object.keys(secret).find(key => key === ARWEAVE_JWK)) {
                        key = _parseArweaveKey(secret[ARWEAVE_JWK] as Record<string, unknown>)
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
                    console.log('Arweave 私钥加载成功', key)
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
        } catch (error) {
            throw new EasyError('Arweave: 加载 Arweave 私钥失败: ', error)
        }
    }

    const { start: startLoadPrivateKey, loading: loadingLoadPrivateKey } = useLoading({
        asyncfn: tryLoadPrivateKey,
        label: '尝试加载 Arweave 私钥...'
    })

    useEffect(() => {
        if (fbloading) return
        if (!arweaveRef.current) return
        startLoadPrivateKey()
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

    const searchByQueryRaw = useCallback((tags: Record<string, string>, arweaveAddress?: string) => {
        if (!arweaveRef.current) throw new Error('Arweave 未初始化')
        return _searchByQueryRaw(arweaveRef.current, tags, arweaveAddress)
    }, [arweaveRef.current])

    if (loadingInitArweave) {
        return <LoadingPage label="Initializing Arweave..." />
    }
    
    if (loadingLoadPrivateKey) {
        return <LoadingPage label="Loading Arweave private key..." />
    }

    return (
        <ArweaveContext.Provider value={{
            arweave: arweaveRef.current!,
            createTx, searchTx, searchByQuery, searchByQueryRaw,
            privateThings: innerSecret,
            publicThings: innerPublic,
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



const _searchByQuery = async (arweave: Arweave, tags: Record<string, string>, arweaveAddress?: string) => {
    const tagsString = Object.entries(tags).map(([name, value]) => `{ name: "${name}", values: ["${value}"] }`).join(',')
    const ownersString = arweaveAddress ? `owners:["${arweaveAddress}"]` : ''
    let queryObject = {
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
    queryObject = {
        query:
            `{
            transactions (
                ${ownersString},
                tags: [ ${tagsString} ]
            ) {
                edges {
                    cursor
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


export interface SearchByQueryResponse {
    transactions: {
        edges: {
            cursor: string
            node: {
                id: string
                owner: {
                    address: string
                }
                data: {
                    size: string
                }
                block: {
                    height: number
                    timestamp: number
                }
                tags: {
                    name: string
                    value: string
                }[]
            }
        }[]
    }
}

const _searchByQueryRaw = async (arweave: Arweave, tags: Record<string, string>, arweaveAddress?: string): Promise<SearchByQueryResponse> => {
    const tagsString = Object.entries(tags).map(([name, value]) => `{ name: "${name}", values: ["${value}"] }`).join(',')
    const ownersString = arweaveAddress ? `owners:["${arweaveAddress}"]` : ''
    let queryObject = {
        query:
            `query( $count: Int ){
                transactions(
                first: $count, 
                ${ownersString},
                tags: [${tagsString} ]
                ) {
                edges {
                    cursor
                    node {
                        id
                        owner {
                            address
                        }
                        data {
                            size
                        }
                        block {
                            height
                            timestamp
                        }
                        tags {
                            name,
                            value
                        }
                    }
                }
            }
        }`,
        variables: { count: 100 }
    };
    const res = await arweave.api.post('/graphql', queryObject)
    return res.data.data as SearchByQueryResponse
}


const _searchTx = async (arweave: Arweave, tx_id: string) => {
    const res = await arweave.transactions.get(tx_id)
    // 获取明文数据
    const data = await arweave.transactions.getData(tx_id, { decode: true, string: true })

    // 解码 tags 为明文
    const decodedTags = res.tags.map(tag => ({
        name: arweave.utils.b64UrlToString(tag.name),
        value: arweave.utils.b64UrlToString(tag.value)
    }))

    return {
        ...res,
        data: data,
        tags: decodedTags,
    } as Transaction
}

function _parseArweaveKey(key: Record<string, unknown>): JWKInterface | null {
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


const _createTx = async (arweave: Arweave, privateKey: JWKInterface, content: string, headers: [string, string][]) => {
    const tx = await arweave.createTransaction({ data: content }, privateKey)
    for (const header of headers) {
        tx.addTag(header[0], header[1])
    }
    await arweave.transactions.sign(tx, privateKey)
    const isVerify = await arweave.transactions.verify(tx)
    const res = await arweave.transactions.post(tx)
    return { tx, res }
}

