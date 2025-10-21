import React, { useEffect, useMemo, useState } from "react";

/**
 * Frontend conectado al backend "marketplace-dulces" (Spring WebFlux + JWT)
 * Endpoints:
 *  - POST   /auth/login           -> { token }
 *  - POST   /auth/register        -> "ok"
 *  - GET    /productos            -> [Producto]
 *  - GET    /productos/buscar     -> [Producto] (opcional: ?pais=, ?tipo=)
 *  - POST   /carrito/agregar      -> crea/actualiza item (query: productoId, cantidad)
 *  - GET    /carrito              -> [Carrito]
 *  - DELETE /carrito/{id}         -> 204
 */

// API_URL robusto: VITE_API_URL (Vite) -> window.__VITE_API_URL -> process.env -> por defecto "/api"
const API_URL = (() => {
    try { if (import.meta?.env?.VITE_API_URL) return import.meta.env.VITE_API_URL; } catch(_) {}
    try { if (typeof window !== "undefined" && window.__VITE_API_URL) return window.__VITE_API_URL; } catch(_) {}
    try { if (typeof process !== "undefined" && process.env?.VITE_API_URL) return process.env.VITE_API_URL; } catch(_) {}
    return "/api";
})();

// Utils
const formatCOP = (n) =>
    new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

const IMG_BY_TIPO = {
    Chocolates: "https://images.unsplash.com/photo-1606313564200-e75d5e30476e?q=80&w=1200&auto=format&fit=crop",
    Gomitas: "https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?q=80&w=1200&auto=format&fit=crop",
    Caramelos: "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop",
    Galletas: "https://images.unsplash.com/photo-1475856033578-76b18d42c07b?q=80&w=1200&auto=format&fit=crop",
    Confites: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?q=80&w=1200&auto=format&fit=crop",
    Colombianos: "https://images.unsplash.com/photo-1599785209791-98d6aabe5a0e?q=80&w=1200&auto=format&fit=crop",
    Bebidas: "https://images.unsplash.com/photo-1542442810-6bd2a7f5f86b?q=80&w=1200&auto=format&fit=crop",
};
const pickImage = (tipo) =>
    IMG_BY_TIPO[tipo] || "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop";

function normalizeProduct(p) {
    const price = typeof p?.precio === "string" ? Number(p.precio) : p?.precio ?? 0;
    return {
        id: p?.id,
        name: p?.nombre,
        price,
        category: p?.tipo,
        country: p?.paisOrigen,
        stock: p?.stock,
        img: pickImage(p?.tipo),
        rating: 4.5,
        tags: [p?.tipo, p?.paisOrigen].filter(Boolean),
    };
}

// Fetch con token (y fallback x-www-form-urlencoded sólo para login/register si el server responde 415/400)
async function apiFetch(path, { auth = true, method = "GET", headers = {}, body } = {}) {
    const token = localStorage.getItem("dm_token");
    const base = API_URL.replace(/\/$/, "");
    const url = `${base}${path}`; // API_URL puede ser '/api' o 'http://...'

    const isJsonBody = body !== undefined && !(body instanceof FormData) && headers["Content-Type"] !== "application/x-www-form-urlencoded";
    let init = { method, headers: { ...headers }, body: undefined, mode: "cors" };
    if (auth && token) init.headers.Authorization = `Bearer ${token}`;
    if (isJsonBody) {
        init.headers["Content-Type"] = init.headers["Content-Type"] || "application/json";
        init.body = JSON.stringify(body);
    } else if (body instanceof FormData || init.headers["Content-Type"] === "application/x-www-form-urlencoded") {
        init.body = body;
    }

    let res;
    try { res = await fetch(url, init); }
    catch (e) { throw new Error(`Fallo de red: ${e.message}`); }

    if (!res.ok && method.toUpperCase() === "POST" && !auth && isJsonBody && (res.status === 415 || res.status === 400)) {
        const params = new URLSearchParams();
        Object.entries(body).forEach(([k, v]) => params.append(k, String(v)));
        const res2 = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params, mode: "cors" });
        if (!res2.ok) throw new Error(`${res2.status} ${res2.statusText}`);
        return res2.headers.get("content-type")?.includes("application/json") ? res2.json() : res2.text();
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`${res.status} ${res.statusText}${text ? " – " + text : ""}`);
    }
    return res.headers.get("content-type")?.includes("application/json") ? res.json() : res.text();
}

// Iconos/mini componentes
const Star = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`h-4 w-4 ${filled ? "fill-current" : "fill-none"} stroke-current`}>
        <path strokeWidth="1.5" d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
);
const Heart = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 stroke-current">
        <path className={filled ? "fill-current" : "fill-none"} strokeWidth="1.5" d="M12.1 21.35 10 19.28C5.4 14.36 2 11.28 2 7.5 2 5 4 3 6.5 3c1.74 0 3.41.81 4.5 2.09A6.04 6.04 0 0 1 15.5 3C18 3 20 5 20 7.5c0 3.78-3.4 6.86-8 11.78l-1.9 2.07Z" />
    </svg>
);
const Badge = ({ children }) => <span className="rounded-full bg-pink-100 text-pink-700 text-xs px-2 py-0.5">{children}</span>;
const Rating = ({ value = 4.5 }) => {
    const full = Math.round(value);
    return (
        <div className="flex items-center gap-1 text-yellow-500">
            {[...Array(5)].map((_, i) => <Star key={i} filled={i < full} />)}
            <span className="ml-1 text-xs text-neutral-500">{value.toFixed(1)}</span>
        </div>
    );
};

// Auth
function AuthView({ onLogged }) {
    const [mode, setMode] = useState("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            if (mode === "register") {
                await apiFetch("/auth/register", { auth: false, method: "POST", body: { username, password, rol: "USUARIO" } });
            }
            const data = await apiFetch("/auth/login", { auth: false, method: "POST", body: { username, password } });
            localStorage.setItem("dm_token", data.token);
            localStorage.setItem("dm_user", username);
            onLogged();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen grid place-items-center bg-gradient-to-b from-pink-50 to-white p-4">
            <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🍬</span>
                    <h1 className="text-xl font-bold">DulceMarket</h1>
                </div>
                <p className="text-sm text-neutral-600">
                    {mode === "login" ? "Inicia sesión para ver el catálogo." : "Crea tu cuenta y luego inicia sesión."}
                </p>
                <div className="space-y-2">
                    <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Usuario" className="w-full rounded-xl border px-3 py-2 text-sm" required />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" className="w-full rounded-xl border px-3 py-2 text-sm" required />
                </div>
                {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
                <button disabled={busy} className="w-full rounded-xl bg-pink-600 px-3 py-2 text-white hover:bg-pink-700">
                    {busy ? "Procesando..." : mode === "login" ? "Iniciar sesión" : "Registrarme"}
                </button>
                <div className="text-center text-sm">
                    {mode === "login" ? (
                        <button type="button" onClick={() => setMode("register")} className="text-pink-700 hover:underline">
                            ¿No tienes cuenta? Regístrate
                        </button>
                    ) : (
                        <button type="button" onClick={() => setMode("login")} className="text-pink-700 hover:underline">
                            ¿Ya tienes cuenta? Inicia sesión
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

// Tarjeta producto
function ProductCard({ p, onAdd, fav, onFav }) {
    return (
        <div className="group rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="relative">
                <img src={p.img} alt={p.name} className="h-44 w-full object-cover" />
                <button onClick={() => onFav(p.id)} className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-pink-600 hover:bg-white" aria-label="Marcar favorito">
                    <Heart filled={fav} />
                </button>
            </div>
            <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="font-semibold leading-tight">{p.name}</h3>
                        <p className="text-xs text-neutral-500">{p.category} · {p.country}</p>
                    </div>
                    <Rating value={p.rating ?? 4.5} />
                </div>
                <div className="flex flex-wrap gap-2">
                    {p.tags?.map((t) => <Badge key={t}>{t}</Badge>)}
                    {p.stock !== undefined && <Badge>Stock: {p.stock}</Badge>}
                </div>
                <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold">{formatCOP(p.price)}</span>
                    <button onClick={() => onAdd(p)} className="rounded-xl bg-pink-600 px-3 py-2 text-sm font-medium text-white hover:bg-pink-700">
                        Añadir
                    </button>
                </div>
            </div>
        </div>
    );
}

// Drawer carrito
function CartDrawer({ open, onClose, items, products, onDel }) {
    const enrich = (it) => {
        const prod = products.find((p) => p.id === it.productoId);
        return { ...it, name: prod?.name ?? `Producto ${it.productoId}`, price: prod ? prod.price : 0, img: prod?.img ?? pickImage("Confites") };
    };
    const enriched = items.map(enrich);
    const subtotal = enriched.reduce((s, i) => s + i.price * i.cantidad, 0);
    const envio = subtotal === 0 || subtotal >= 80000 ? 0 : 8000;
    const total = subtotal + envio;

    return (
        <div className={`fixed inset-0 z-40 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
            <div onClick={onClose} className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
            <aside className={`absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl transition-transform ${open ? "translate-x-0" : "translate-x-full"}`}>
                <div className="flex items-center justify-between border-b p-4">
                    <h2 className="text-lg font-semibold">Tu carrito</h2>
                    <button onClick={onClose} className="rounded-lg border px-2 py-1 text-sm">Cerrar</button>
                </div>
                <div className="h-[calc(100%-200px)] overflow-y-auto p-4 space-y-3">
                    {enriched.length === 0 ? (
                        <p className="text-neutral-500">Aún no has agregado dulces. 🍬</p>
                    ) : (
                        enriched.map((it) => (
                            <div key={it.id} className="flex gap-3 rounded-xl border p-3">
                                <img src={it.img} alt={it.name} className="h-16 w-16 rounded-lg object-cover" />
                                <div className="flex-1">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="font-medium leading-tight">{it.name}</p>
                                            <p className="text-xs text-neutral-500">{formatCOP(it.price)}</p>
                                        </div>
                                        <button onClick={() => onDel(it.id)} className="text-xs text-neutral-500 hover:text-red-600">Eliminar</button>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="inline-flex items-center gap-2 rounded-lg border px-2">
                                            <span className="text-sm">Cant.</span>
                                            <span className="min-w-6 text-center text-sm">{it.cantidad}</span>
                                        </div>
                                        <span className="font-semibold">{formatCOP(it.cantidad * it.price)}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="border-t p-4 space-y-3">
                    <div className="flex items-center justify-between text-sm"><span>Subtotal</span><span>{formatCOP(subtotal)}</span></div>
                    <div className="flex items-center justify-between text-sm"><span>Envío {envio === 0 ? "(Gratis desde $80.000)" : ""}</span><span>{formatCOP(envio)}</span></div>
                    <div className="flex items-center justify-between text-base font-semibold"><span>Total</span><span>{formatCOP(total)}</span></div>
                    <div className="flex gap-2 pt-2">
                        <button className="w-full rounded-xl bg-pink-600 px-3 py-2 text-white hover:bg-pink-700">Pagar (demo)</button>
                    </div>
                </div>
            </aside>
        </div>
    );
}

// App
export default function DulceMarket() {
    const [logged, setLogged] = useState(!!localStorage.getItem("dm_token"));
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("Todas");
    const [maxPrice, setMaxPrice] = useState(999999);
    const [sort, setSort] = useState("relevancia");
    const [openCart, setOpenCart] = useState(false);
    const [favs, setFavs] = useState(() => new Set(JSON.parse(localStorage.getItem("dm_favs") || "[]")));
    const [products, setProducts] = useState([]);
    const [cart, setCart] = useState([]);

    async function loadData() {
        const list = await apiFetch("/productos", { auth: true });
        setProducts(list.map(normalizeProduct));
        try {
            const carrito = await apiFetch("/carrito", { auth: true });
            setCart(carrito);
        } catch { setCart([]); }
    }

    useEffect(() => { if (logged) { loadData().catch(console.error); document.title = "Marketplace de Dulces"; } }, [logged]);

    const categories = useMemo(() => ["Todas", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))], [products]);
    const prices = useMemo(() => products.map((p) => p.price), [products]);
    const minPrice = prices.length ? Math.min(...prices) : 0;
    const realMax = prices.length ? Math.max(...prices) : 100000;
    useEffect(() => { if (prices.length) setMaxPrice(realMax); }, [realMax]);

    const filtered = useMemo(() => {
        let list = products.filter((p) => p.price <= maxPrice);
        if (category !== "Todas") list = list.filter((p) => p.category === category);
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter((p) => `${p.name} ${p.category} ${p.country}`.toLowerCase().includes(q));
        }
        switch (sort) {
            case "menor-precio": list.sort((a, b) => a.price - b.price); break;
            case "mayor-precio": list.sort((a, b) => b.price - a.price); break;
            default: list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        }
        return list;
    }, [query, category, maxPrice, sort, products]);

    const cartCount = cart.reduce((s, i) => s + (i.cantidad ?? 0), 0);

    const toggleFav = (id) => {
        const next = new Set(favs);
        next.has(id) ? next.delete(id) : next.add(id);
        setFavs(next);
        localStorage.setItem("dm_favs", JSON.stringify([...next]));
    };

    async function addToCart(prod) {
        try {
            -   await apiFetch(`/carrito/agregar?productoId=${encodeURIComponent(prod.id)}&cantidad=1`, { method: "POST" });
            +   await apiFetch(`/carrito/agregar/${encodeURIComponent(prod.id)}?cantidad=1`, { method: "POST" });
            const carrito = await apiFetch("/carrito");
            setCart(carrito);
            setOpenCart(true);
        } catch (e) {
            alert("No se pudo agregar al carrito. Verifica que estás autenticado.\n" + (e?.message || ""));
        }
    }

    async function removeFromCart(id) {
        await apiFetch(`/carrito/${id}`, { method: "DELETE" });
        const carrito = await apiFetch("/carrito");
        setCart(carrito);
    }

    function logout() {
        localStorage.removeItem("dm_token");
        localStorage.removeItem("dm_user");
        setLogged(false);
    }

    if (!logged) return <AuthView onLogged={() => setLogged(true)} />;

    return (
        <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
            <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b">
                <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🍬</span>
                        <h1 className="text-xl font-bold">DulceMarket</h1>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <div className="hidden md:flex items-center gap-2 rounded-2xl border px-3 py-2 w-[380px]">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-neutral-400"><path fill="currentColor" d="m20.94 20.94-4.34-4.35A8 8 0 1 0 4 12a8 8 0 0 0 12.59 6.6l4.35 4.34zM6 12a6 6 0 1 1 12 0a6 6 0 0 1-12 0"/></svg>
                            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar dulces, categorías, país…" className="w-full bg-transparent outline-none text-sm" />
                        </div>
                        <button onClick={() => setOpenCart(true)} className="relative rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50">
                            Carrito {cartCount > 0 && <span className="ml-1 rounded-full bg-pink-600 px-2 py-0.5 text-white">{cartCount}</span>}
                        </button>
                        <button onClick={logout} className="rounded-xl border px-3 py-2 text-sm hover:bg-neutral-50">Salir</button>
                    </div>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-4 py-4">
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="md:col-span-1 space-y-3">
                        <div className="rounded-2xl border bg-white p-4">
                            <h3 className="font-semibold mb-3">Categorías</h3>
                            <div className="flex flex-wrap gap-2">
                                {["Todas", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))].map((c) => (
                                    <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-sm border ${category === c ? "bg-pink-600 text-white border-pink-600" : "hover:bg-neutral-50"}`}>{c}</button>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border bg-white p-4 space-y-3">
                            <h3 className="font-semibold">Precio máximo</h3>
                            <input
                                type="range"
                                min={prices.length ? Math.min(...prices) : 0}
                                max={prices.length ? Math.max(...prices) : 100000}
                                step={100}
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(Number(e.target.value))}
                                className="w-full"
                            />
                            <div className="flex items-center justify-between text-sm text-neutral-600">
                                <span>{formatCOP(prices.length ? Math.min(...prices) : 0)}</span>
                                <span className="font-semibold">{formatCOP(maxPrice)}</span>
                            </div>
                        </div>
                        <div className="rounded-2xl border bg-white p-4">
                            <h3 className="font-semibold mb-2">Ordenar por</h3>
                            <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full rounded-xl border px-3 py-2 text-sm">
                                <option value="relevancia">Relevancia</option>
                                <option value="menor-precio">Menor precio</option>
                                <option value="mayor-precio">Mayor precio</option>
                            </select>
                        </div>
                    </div>

                    <div className="md:col-span-3 space-y-4">
                        <div className="md:hidden">
                            <div className="flex items-center gap-2 rounded-2xl border bg-white px-3 py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-neutral-400"><path fill="currentColor" d="m20.94 20.94-4.34-4.35A8 8 0 1 0 4 12a8 8 0 0 0 12.59 6.6l4.35 4.34zM6 12a6 6 0 1 1 12 0a6 6 0 0 1-12 0"/></svg>
                                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar dulces…" className="w-full bg-transparent outline-none text-sm" />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-sm text-neutral-600">
                                Mostrando <span className="font-semibold">{filtered.length}</span> de {products.length} productos
                            </p>
                            <div className="hidden md:block text-xs text-neutral-500">
                                Envío gratis desde <span className="font-semibold">{formatCOP(80000)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filtered.map((p) => (
                                <ProductCard key={p.id} p={p} onAdd={addToCart} fav={favs.has(p.id)} onFav={toggleFav} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t bg-white">
                <div className="mx-auto max-w-7xl px-4 py-6 text-sm text-neutral-500 flex flex-col md:flex-row items-center justify-between gap-2">
                    <p>© {new Date().getFullYear()} DulceMarket · Hecho con ❤️ en Colombia</p>
                    <p>Conectado a <code>{API_URL}</code>. Cambia VITE_API_URL para apuntar al backend.</p>
                </div>
            </footer>

            <CartDrawer open={openCart} onClose={() => setOpenCart(false)} items={cart} products={products} onDel={removeFromCart} />
        </div>
    );
}
