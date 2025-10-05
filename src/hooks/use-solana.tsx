import { createSolanaRpc, createSolanaRpcSubscriptions } from '@solana/kit';
import type { Rpc, RpcSubscriptions, SolanaRpcApi, SolanaRpcSubscriptionsApi } from '@solana/kit';
import { createContext, useContext, useEffect, useState } from 'react';
import { generateKeyPair } from '@solana/kit';
import { generateKeyPairSigner } from '@solana/kit';
 
// const wallet = await generateKeyPairSigner();
// const wallet: CryptoKeyPair = await generateKeyPair();
export type Client = {
    rpc: Rpc<SolanaRpcApi>;
    rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
};

const SolanaContext = createContext<{
    client: Client
} | null>(null);

export function SolanaProvider({ children }: { children: React.ReactNode }) {
    const [client, setClient] = useState<Client | null>(null);

    useEffect(() => {
        const _client = {
            rpc: createSolanaRpc('http://127.0.0.1:8899'),
            rpcSubscriptions: createSolanaRpcSubscriptions('ws://127.0.0.1:8900'),
        };
        setClient(_client);
    }, []);

    return <SolanaContext.Provider value={{ client: client as Client }}>
        {children}
    </SolanaContext.Provider>;
}

export function useSolana() {
    const context = useContext(SolanaContext);
    if (!context) {
        throw new Error('useSolana must be used within a SolanaProvider');
    }
    return context;
}


