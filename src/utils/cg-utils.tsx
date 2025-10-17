
export const copyToClipboard = async (text: string, type: string) => {
    try {
        await navigator.clipboard.writeText(text)
        alert('复制成功')
    } catch (error) {
        alert('复制失败:' + error)
        console.error('复制失败:', error)
    }
}

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};


export function isUUID(str: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

