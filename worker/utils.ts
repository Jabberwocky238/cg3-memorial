export async function middlewareReadJson<T = any>(request: Request): Promise<T> {
    let jsonData = {} as T
    const urlpath = new URL(request.url).pathname
    const headers = request.headers
    const contentType = headers.get('content-type')
    const isJson = contentType && contentType.includes('application/json')
    const isFormData = contentType && contentType.includes('multipart/form-data')

    if (isJson) {
        jsonData = await request.json()
    } else if (isFormData) {
        const formData = await request.formData()
        jsonData = Object.fromEntries(formData.entries()) as T
    } else {
        jsonData = {} as T
    }

    const searchParams = new URLSearchParams(request.url)
    const searchParamsData = Object.fromEntries(searchParams.entries())
    jsonData = { ...jsonData, ...searchParamsData }

    console.log(urlpath, jsonData)
    return jsonData
}



export async function responseJson(data: Record<string, unknown>, init: ResponseInit = {}): Promise<Response> {
    return new Response(JSON.stringify(data), {
        headers: { 'content-type': 'application/json; charset=utf-8' },
        ...init
    })
}