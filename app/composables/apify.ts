export default function apify(path: string, type: "api" | "base" = "api") {
    const config = useRuntimeConfig();

    if (type === "api") {
        return `${config.public.api}/${path}/`;
    }

    return `${config.public.base}${path}`;
}