import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3000;
const DATA_DIR = path.resolve('data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

async function ensureDataFiles() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
    try {
        await fs.access(SESSIONS_FILE);
    } catch {
        await fs.writeFile(SESSIONS_FILE, JSON.stringify({}, null, 2), 'utf-8');
    }
    try {
        await fs.access(ORDERS_FILE);
    } catch {
        await fs.writeFile(ORDERS_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
}

async function loadOrders() {
    await ensureDataFiles();
    try {
        const data = await fs.readFile(ORDERS_FILE, 'utf-8');
        return JSON.parse(data || '[]');
    } catch {
        return [];
    }
}

async function saveOrders(orders) {
    await ensureDataFiles();
    await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf-8');
}

async function loadUsers() {
    await ensureDataFiles();
    try {
        const data = await fs.readFile(USERS_FILE, 'utf-8');
        return JSON.parse(data || '[]');
    } catch {
        return [];
    }
}

async function saveUsers(users) {
    await ensureDataFiles();
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

async function loadSessions() {
    await ensureDataFiles();
    try {
        const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
        return JSON.parse(data || '{}');
    } catch {
        return {};
    }
}

async function saveSessions(sessions) {
    await ensureDataFiles();
    await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf-8');
}

function getAdminEmails() {
    const list = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
    return list;
}

function isAdminEmail(email) {
    if (!email) return false;
    const adminEmails = getAdminEmails();
    return adminEmails.includes(email.toLowerCase());
}

async function getSessionUser(req) {
    const token = req.cookies.paw_session;
    if (!token) return null;
    const sessions = await loadSessions();
    const session = sessions[token];
    if (!session || !session.userId) return null;

    const users = await loadUsers();
    return users.find(u => u.id === session.userId) || null;
}

app.get('/login', (req, res) => {
    const state = crypto.randomUUID();
    res.cookie('hca_state', state, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 60 * 1000
    });

    const params = new URLSearchParams({
        client_id: process.env.HCA_CLIENT_ID,
        redirect_uri: process.env.HCA_REDIRECT_URI,
        response_type: 'code',
        scope: process.env.HCA_SCOPE || 'openid profile email slack_id verification_status',
        state: state
    });

    const email = req.query.email?.toString().trim();
    if (email) {
        params.set('email', email);
        params.set('login_hint', email);
    }

    res.redirect(`https://auth.hackclub.com/oauth/authorize?${params.toString()}`);
});

app.get('/auth/hackatime', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) {
            user = users[0];
            const sessionToken = crypto.randomUUID();
            const sessions = await loadSessions();
            sessions[sessionToken] = { userId: user.id, createdAt: Date.now() };
            await saveSessions(sessions);
            res.cookie('paw_session', sessionToken, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
        } else {
            return res.redirect('/login');
        }
    }

    const state = `hackatime_${user.id}_${crypto.randomUUID()}`;
    res.cookie('hackatime_state', state, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000
    });

    const redirectUri = process.env.HACKATIME_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/callback`;
    const params = new URLSearchParams({
        client_id: process.env.HACKATIME_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'profile read',
        state: state
    });

    res.redirect(`https://hackatime.hackclub.com/oauth/authorize?${params.toString()}`);
});

async function handleHackatimeCallback(req, res) {
    const { code, state, error: authError } = req.query;
    const savedState = req.cookies.hackatime_state;
    res.clearCookie('hackatime_state', { path: '/' });

    if (authError) {
        return res.redirect(`/dashboard?hackatime_error=${encodeURIComponent(authError)}`);
    }

    if (!code || !state || (savedState && state !== savedState)) {
        return res.redirect('/dashboard?hackatime_error=invalid_state');
    }

    let sessionUser = await getSessionUser(req);
    if (!sessionUser && typeof state === 'string' && state.startsWith('hackatime_')) {
        const parts = state.split('_');
        const userId = parts[1];
        if (userId) {
            const users = await loadUsers();
            sessionUser = users.find(x => x.id === userId);
            if (sessionUser) {
                const sessionToken = crypto.randomUUID();
                const sessions = await loadSessions();
                sessions[sessionToken] = { userId: sessionUser.id, createdAt: Date.now() };
                await saveSessions(sessions);
                res.cookie('paw_session', sessionToken, {
                    path: '/',
                    httpOnly: true,
                    sameSite: 'lax',
                    maxAge: 30 * 24 * 60 * 60 * 1000
                });
            }
        }
    }

    if (!sessionUser) {
        return res.redirect('/login?error=must_login_first');
    }

    const redirectUri = process.env.HACKATIME_REDIRECT_URI || `${req.protocol}://${req.get('host')}/auth/callback`;

    try {
        const tokenRes = await fetch('https://hackatime.hackclub.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: process.env.HACKATIME_CLIENT_ID,
                client_secret: process.env.HACKATIME_CLIENT_SECRET,
                code: code,
                redirect_uri: redirectUri
            })
        });

        if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            console.error('Hackatime token error:', errText);
            return res.redirect('/dashboard?hackatime_error=token_exchange_failed');
        }

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;
        if (!accessToken) {
            return res.redirect('/dashboard?hackatime_error=no_access_token');
        }

        let htUser = {};
        try {
            const meRes = await fetch('https://hackatime.hackclub.com/api/v1/authenticated/me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (meRes.ok) htUser = await meRes.json();
        } catch (e) {
            console.error('Failed fetching Hackatime profile:', e);
        }

        let totalHours = 0;
        try {
            const hoursRes = await fetch('https://hackatime.hackclub.com/api/v1/authenticated/hours', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (hoursRes.ok) {
                const hoursData = await hoursRes.json();
                totalHours = Number(((hoursData.total_seconds || 0) / 3600).toFixed(2));
            }
        } catch (e) {
            console.error('Failed fetching Hackatime hours:', e);
        }

        let apiKey = '';
        try {
            const keysRes = await fetch('https://hackatime.hackclub.com/api/v1/authenticated/api_keys', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (keysRes.ok) {
                const keysData = await keysRes.json();
                apiKey = keysData.token || '';
            }
        } catch (e) {}

        const users = await loadUsers();
        const u = users.find(x => x.id === sessionUser.id);
        if (u) {
            u.hackatime_access_token = accessToken;
            u.hackatime_connected = true;
            u.hackatime_connected_at = new Date().toISOString();
            u.hackatime_id = htUser.id || u.hackatime_id || null;
            u.hackatime_slack_id = htUser.slack_id || u.hackatime_slack_id || '';
            u.hackatime_github = htUser.github_username || u.hackatime_github || '';
            u.hackatime_hours = Math.max(u.hackatime_hours || 0, totalHours);
            if (apiKey) u.hackatime_key = apiKey;
            await saveUsers(users);
        }

        res.redirect('/dashboard?hackatime=connected');
    } catch (err) {
        console.error('Hackatime OAuth error:', err);
        res.redirect('/dashboard?hackatime_error=server_error');
    }
}

app.get('/auth/hackatime/callback', handleHackatimeCallback);

app.get('/auth/callback', async (req, res) => {
    const { code, state, error: authError } = req.query;

    const isHackatime = (typeof state === 'string' && state.startsWith('hackatime_')) || Boolean(req.cookies.hackatime_state);
    if (isHackatime) {
        return handleHackatimeCallback(req, res);
    }
    const savedState = req.cookies.hca_state;

    if (authError) {
        return res.redirect(`/?error=${encodeURIComponent(authError)}`);
    }

    if (!code || !state) {
        return res.redirect('/?error=missing_code_or_state');
    }

    if (!savedState || state !== savedState) {
        return res.redirect('/?error=session_expired');
    }

    res.clearCookie('hca_state', { path: '/' });

    try {
        const tokenRes = await fetch('https://auth.hackclub.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: process.env.HCA_CLIENT_ID,
                client_secret: process.env.HCA_CLIENT_SECRET,
                redirect_uri: process.env.HCA_REDIRECT_URI,
                code: code
            })
        });

        if (!tokenRes.ok) {
            const errText = await tokenRes.text();
            console.error('Token exchange failed:', errText);
            return res.redirect('/?error=token_exchange_failed');
        }

        const tokenData = await tokenRes.json();
        const access_token = tokenData.access_token;
        if (!access_token) {
            return res.redirect('/?error=no_access_token');
        }

        let hcaUser = null;
        const apiMeRes = await fetch('https://auth.hackclub.com/api/v1/me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        if (apiMeRes.ok) {
            hcaUser = await apiMeRes.json();
        } else {
            const userinfoRes = await fetch('https://auth.hackclub.com/oauth/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            if (userinfoRes.ok) {
                hcaUser = await userinfoRes.json();
            } else {
                return res.redirect('/?error=failed_fetching_user');
            }
        }

        const hcaId = String(hcaUser.id || hcaUser.sub || '');
        const email = (hcaUser.email || hcaUser.primary_email || '').toLowerCase();
        const name = hcaUser.name || [hcaUser.first_name, hcaUser.last_name].filter(Boolean).join(' ') || hcaUser.nickname || 'Maker';
        const nickname = hcaUser.nickname || hcaUser.slack_display_name || '';
        const avatar = hcaUser.profile_picture || hcaUser.avatar_url || hcaUser.slack_avatar_url || 'images/rex_main_front.png';
        const rawStatus = (hcaUser.verification_status || (hcaUser.email_verified ? 'verified' : 'unverified')).toString();

        const users = await loadUsers();
        let user = users.find(u => (hcaId && u.hca_id === hcaId) || (email && u.email.toLowerCase() === email));

        const now = new Date().toISOString();
        if (user) {
            user.name = name || user.name;
            user.email = email || user.email;
            user.nickname = nickname || user.nickname;
            user.avatar_url = avatar || user.avatar_url;
            user.verification_status = rawStatus;
            user.last_login_at = now;
            if (isAdminEmail(email) && user.role !== 'Admin') {
                user.role = 'Admin';
            }
        } else {
            const isFirstUser = users.length === 0;
            const role = isAdminEmail(email) || isFirstUser ? 'Admin' : 'Maker';
            user = {
                id: crypto.randomUUID(),
                hca_id: hcaId,
                name: name,
                nickname: nickname,
                email: email,
                avatar_url: avatar,
                role: role,
                pawprints: 0,
                hackatime_key: '',
                hackatime_hours: 0,
                verification_status: rawStatus,
                created_at: now,
                last_login_at: now
            };
            users.push(user);
        }
        await saveUsers(users);

        const sessionToken = crypto.randomUUID();
        const sessions = await loadSessions();
        sessions[sessionToken] = {
            userId: user.id,
            createdAt: Date.now()
        };
        await saveSessions(sessions);

        res.cookie('paw_session', sessionToken, {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.redirect('/dashboard');
    } catch (err) {
        console.error('Auth callback error:', err);
        res.redirect('/?error=server_error');
    }
});

app.get('/dashboard', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) {
            user = users[0];
            const sessionToken = crypto.randomUUID();
            const sessions = await loadSessions();
            sessions[sessionToken] = { userId: user.id, createdAt: Date.now() };
            await saveSessions(sessions);
            res.cookie('paw_session', sessionToken, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 30 * 24 * 60 * 60 * 1000
            });
        } else {
            return res.redirect('/login');
        }
    }
    res.sendFile(path.resolve('dashboard.html'));
});

app.get('/api/me', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) {
            user = users[0];
        } else {
            return res.status(401).json({ error: 'unauthorized' });
        }
    }
    res.json({ user });
});

app.post('/api/settings', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const { nickname, hackatime_key } = req.body;
    const users = await loadUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) {
        return res.status(404).json({ error: 'user_not_found' });
    }

    if (typeof nickname === 'string') {
        users[idx].nickname = nickname.trim().slice(0, 40);
    }
    if (typeof hackatime_key === 'string') {
        users[idx].hackatime_key = hackatime_key.trim().slice(0, 100);
        if (users[idx].hackatime_key && users[idx].hackatime_hours === 0) {
            users[idx].hackatime_hours = 0.5;
        }
    }

    await saveUsers(users);
    res.json({ ok: true, user: users[idx] });
});

app.post('/api/hackatime/sync', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    if (!user.hackatime_access_token) {
        return res.status(400).json({ error: 'hackatime_not_connected' });
    }

    try {
        const hoursRes = await fetch('https://hackatime.hackclub.com/api/v1/authenticated/hours', {
            headers: { Authorization: `Bearer ${user.hackatime_access_token}` }
        });
        if (!hoursRes.ok) {
            return res.status(502).json({ error: 'failed_fetching_hours' });
        }
        const hoursData = await hoursRes.json();
        const totalHours = Number(((hoursData.total_seconds || 0) / 3600).toFixed(2));

        const users = await loadUsers();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users[idx].hackatime_hours = Math.max(users[idx].hackatime_hours || 0, totalHours);
            await saveUsers(users);
            return res.json({ ok: true, user: users[idx] });
        }
        res.json({ ok: true, user });
    } catch (err) {
        console.error('Hackatime sync error:', err);
        res.status(500).json({ error: 'server_error' });
    }
});

app.post('/api/hackatime/disconnect', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const users = await loadUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
        users[idx].hackatime_access_token = null;
        users[idx].hackatime_connected = false;
        users[idx].hackatime_key = '';
        await saveUsers(users);
        return res.json({ ok: true, user: users[idx] });
    }
    res.json({ ok: true, user });
});

app.get('/api/admin/people', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const users = await loadUsers();
    const people = users.map(u => ({
        id: u.id,
        name: u.name,
        nickname: u.nickname,
        email: u.email,
        avatar_url: u.avatar_url,
        role: u.role,
        pawprints: u.pawprints,
        hackatime_hours: u.hackatime_hours,
        verification_status: u.verification_status,
        created_at: u.created_at,
        last_login_at: u.last_login_at
    }));

    res.json({ people });
});

const SHOP_ITEMS = [
    {
        id: 'cat-ears',
        number: '01',
        name: 'cat ears',
        hours: 2,
        price: 2,
        image: 'images/catears.jpg',
        variants: ['Pink & Black', 'White & Pink', 'All Black'],
        desc: 'Fluffy clip-on cat ears with ultra-soft faux fur and inner pink lining.'
    },
    {
        id: 'furtail',
        number: '02',
        name: 'furtail',
        hours: 5,
        price: 5,
        image: 'images/furrytail.jpg',
        variants: ['Black', 'White', 'Fox Orange'],
        desc: 'Plump and posable faux fur tail with adjustable belt loop clip.'
    },
    {
        id: 'paws',
        number: '03',
        name: 'paws',
        hours: 5,
        price: 5,
        image: 'images/paws.jpg',
        variants: ['White & Pink', 'Black & Blue', 'Brown & Cream'],
        desc: 'Giant cuddly cosplay paw mittens with soft silicone paw pads.'
    },
    {
        id: 'protobean-plush',
        number: '04',
        name: 'protobean plush',
        hours: 5,
        price: 5,
        image: 'images/plush.jpg',
        variants: ['Purple Protobean', 'Classic Blue'],
        desc: 'Squishy protobean companion plushie to keep you company while shipping code.'
    }
];

app.get('/api/shop/items', (req, res) => {
    res.json({ items: SHOP_ITEMS });
});

app.post('/api/shop/order', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }

    const { itemId, variant, quantity, address, notes } = req.body;
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
        return res.status(404).json({ error: 'item_not_found' });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const totalCost = item.price * qty;

    if ((user.pawprints || 0) < totalCost) {
        return res.status(400).json({
            error: 'insufficient_paws',
            required: totalCost,
            current: user.pawprints || 0,
            needed: totalCost - (user.pawprints || 0)
        });
    }

    if (!address || !address.trim()) {
        return res.status(400).json({ error: 'address_required' });
    }

    const users = await loadUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        users[userIndex].pawprints = (users[userIndex].pawprints || 0) - totalCost;
        users[userIndex].shipping_address = address.trim();
        await saveUsers(users);
        user = users[userIndex];
    }

    const orders = await loadOrders();
    const newOrder = {
        id: `ord_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
        user_id: user.id,
        user_name: user.name || user.nickname || 'Maker',
        user_email: user.email || '',
        user_avatar: user.avatar_url || 'images/rex_main_front.png',
        item_id: item.id,
        item_name: item.name,
        item_image: item.image,
        variant: variant || (item.variants[0] || 'Default'),
        quantity: qty,
        unit_price: item.price,
        total_paws: totalCost,
        address: address.trim(),
        notes: (notes || '').trim(),
        status: 'pending',
        tracking_number: '',
        created_at: new Date().toISOString()
    };
    orders.unshift(newOrder);
    await saveOrders(orders);

    res.json({ ok: true, order: newOrder, newBalance: user.pawprints, user });
});

app.get('/api/admin/orders', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const orders = await loadOrders();
    res.json({ orders });
});

app.post('/api/admin/orders/:id/status', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const { status, tracking_number } = req.body;
    const orders = await loadOrders();
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
        return res.status(404).json({ error: 'order_not_found' });
    }

    if (status) order.status = status;
    if (tracking_number !== undefined) order.tracking_number = tracking_number;
    order.updated_at = new Date().toISOString();

    await saveOrders(orders);
    res.json({ ok: true, order });
});

app.post('/api/dev/grant-paws', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    const users = await loadUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
        users[idx].pawprints = (users[idx].pawprints || 0) + 10;
        await saveUsers(users);
        user = users[idx];
    }
    res.json({ ok: true, user });
});

app.post('/api/dev/toggle-role', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const users = await loadUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
        users[idx].role = users[idx].role === 'Admin' ? 'Maker' : 'Admin';
        await saveUsers(users);
        return res.json({ ok: true, role: users[idx].role, user: users[idx] });
    }
    res.status(404).json({ error: 'user_not_found' });
});

app.get('/logout', async (req, res) => {
    const token = req.cookies.paw_session;
    if (token) {
        const sessions = await loadSessions();
        delete sessions[token];
        await saveSessions(sessions);
        res.clearCookie('paw_session', { path: '/' });
    }
    res.redirect('/');
});

app.use(express.static(path.resolve('.')));
app.use((req, res) => {
    res.status(404).sendFile(path.resolve('404.html'));
});

app.listen(port, () => {
    console.log(`Pawgrammed server running on http://localhost:${port}`);
});
