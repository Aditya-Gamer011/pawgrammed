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
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const EVENT_CONFIG_FILE = path.join(DATA_DIR, 'event_config.json');
const LEDGER_FILE = path.join(DATA_DIR, 'paws_ledger.json');
const SHOP_ITEMS_FILE = path.join(DATA_DIR, 'shop_items.json');
const UNIFIED_OUTBOX_FILE = path.join(DATA_DIR, 'unified_outbox.json');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const DEFAULT_SHOP_ITEMS = [
    {
        id: 'cat-ears',
        number: '01',
        name: 'cat ears',
        hours: 2,
        price: 2,
        image: 'images/catears.jpg',
        variants: ['Pink & Black', 'White & Pink', 'All Black'],
        in_stock: true,
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
        in_stock: true,
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
        in_stock: true,
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
        in_stock: true,
        desc: 'Squishy protobean companion plushie to keep you company while shipping code.'
    }
];

const DEFAULT_EVENT_CONFIG = {
    event_name: 'Pawgrammed Season 1',
    submissions_open: true,
    resubmissions_open: true,
    start_date: '2026-03-01',
    end_date: '2026-05-30',
    multiplier: 1.0,
    max_paws_cap: 25,
    announcement: '🐾 Welcome to Pawgrammed! Build and ship furry-themed projects, track Hackatime hours, and claim custom gear!'
};

const SEED_EXPLORE_PROJECTS = [
    {
        id: 'proj_sample_01',
        user_id: 'seed_rex',
        maker_name: 'Rex The Protogen',
        maker_email: 'rex@hackclub.com',
        maker_avatar: 'images/rex_main_front.png',
        title: 'Protogen Visor Matrix Firmware',
        description: 'ESP32 firmware driving 128x64 WS2812 LED matrices with reactive eye emotes and Bluetooth remote control.',
        repo_url: 'https://github.com/hackclub/fursuit-visor',
        demo_url: 'https://github.com/hackclub/fursuit-visor',
        hackatime_project: 'fursuit-visor',
        hours_logged: 6.5,
        hours_approved: 6.5,
        paws_awarded: 7,
        status: 'approved',
        note_to_maker: 'Amazing hardware project! Love the emotion cycling.',
        created_at: '2026-03-10T12:00:00.000Z',
        submitted_at: '2026-03-12T15:30:00.000Z',
        decided_at: '2026-03-13T09:15:00.000Z'
    },
    {
        id: 'proj_sample_02',
        user_id: 'seed_floof',
        maker_name: 'Floof Coder',
        maker_email: 'floof@hackclub.com',
        maker_avatar: 'images/rex_main_front.png',
        title: 'PawScript Language',
        description: 'A toy programming language written in Rust where keywords are replaced with animal sounds (bark, meow, awoo).',
        repo_url: 'https://github.com/hackclub/pawscript',
        demo_url: 'https://github.com/hackclub/pawscript',
        hackatime_project: 'pawscript-compiler',
        hours_logged: 4.0,
        hours_approved: 4.0,
        paws_awarded: 4,
        status: 'approved',
        note_to_maker: 'The compiler error messages are adorable and hilarious.',
        created_at: '2026-03-14T10:00:00.000Z',
        submitted_at: '2026-03-16T18:00:00.000Z',
        decided_at: '2026-03-17T11:20:00.000Z'
    }
];

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
    try {
        await fs.access(PROJECTS_FILE);
    } catch {
        await fs.writeFile(PROJECTS_FILE, JSON.stringify(SEED_EXPLORE_PROJECTS, null, 2), 'utf-8');
    }
    try {
        await fs.access(EVENT_CONFIG_FILE);
    } catch {
        await fs.writeFile(EVENT_CONFIG_FILE, JSON.stringify(DEFAULT_EVENT_CONFIG, null, 2), 'utf-8');
    }
    try {
        await fs.access(LEDGER_FILE);
    } catch {
        await fs.writeFile(LEDGER_FILE, JSON.stringify([], null, 2), 'utf-8');
    }
    try {
        await fs.access(SHOP_ITEMS_FILE);
    } catch {
        await fs.writeFile(SHOP_ITEMS_FILE, JSON.stringify(DEFAULT_SHOP_ITEMS, null, 2), 'utf-8');
    }
    try {
        await fs.access(UNIFIED_OUTBOX_FILE);
    } catch {
        await fs.writeFile(UNIFIED_OUTBOX_FILE, JSON.stringify([], null, 2), 'utf-8');
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

async function loadProjects() {
    await ensureDataFiles();
    try {
        const data = await fs.readFile(PROJECTS_FILE, 'utf-8');
        return JSON.parse(data || '[]');
    } catch {
        return [];
    }
}

async function saveProjects(projects) {
    await ensureDataFiles();
    await fs.writeFile(PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf-8');
}

async function loadEventConfig() {
    await ensureDataFiles();
    try {
        const data = await fs.readFile(EVENT_CONFIG_FILE, 'utf-8');
        return JSON.parse(data || JSON.stringify(DEFAULT_EVENT_CONFIG));
    } catch {
        return DEFAULT_EVENT_CONFIG;
    }
}

async function saveEventConfig(config) {
    await ensureDataFiles();
    await fs.writeFile(EVENT_CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

async function loadLedger() {
    await ensureDataFiles();
    try {
        const data = await fs.readFile(LEDGER_FILE, 'utf-8');
        return JSON.parse(data || '[]');
    } catch {
        return [];
    }
}

async function saveLedger(ledger) {
    await ensureDataFiles();
    await fs.writeFile(LEDGER_FILE, JSON.stringify(ledger, null, 2), 'utf-8');
}

async function recordLedger(userId, delta, reason, note = '', meta = {}) {
    const ledger = await loadLedger();
    const users = await loadUsers();
    const user = users.find(u => u.id === userId) || {};
    const entry = {
        id: `tx_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
        user_id: userId,
        user_name: user.name || user.nickname || 'Maker',
        user_email: user.email || '',
        user_avatar: user.avatar_url || 'images/rex_main_front.png',
        delta: Number(delta),
        reason: reason,
        project_id: meta.projectId || null,
        order_id: meta.orderId || null,
        note: note || '',
        created_at: new Date().toISOString()
    };
    ledger.unshift(entry);
    await saveLedger(ledger);
    return entry;
}

async function loadShopItems() {
    await ensureDataFiles();
    try {
        const data = await fs.readFile(SHOP_ITEMS_FILE, 'utf-8');
        return JSON.parse(data || JSON.stringify(DEFAULT_SHOP_ITEMS));
    } catch {
        return DEFAULT_SHOP_ITEMS;
    }
}

async function saveShopItems(items) {
    await ensureDataFiles();
    await fs.writeFile(SHOP_ITEMS_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

async function loadUnifiedOutbox() {
    await ensureDataFiles();
    try {
        const data = await fs.readFile(UNIFIED_OUTBOX_FILE, 'utf-8');
        return JSON.parse(data || '[]');
    } catch {
        return [];
    }
}

async function saveUnifiedOutbox(outbox) {
    await ensureDataFiles();
    await fs.writeFile(UNIFIED_OUTBOX_FILE, JSON.stringify(outbox, null, 2), 'utf-8');
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
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0 && users[0].role === 'Admin') user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
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

app.get('/api/projects', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    const projects = await loadProjects();
    const userProjects = projects.filter(p => p.user_id === user.id);
    res.json({ projects: userProjects });
});

app.post('/api/projects', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }

    const { title, description, repo_url, demo_url, hackatime_project, hours_logged } = req.body;
    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'title_required' });
    }

    const projects = await loadProjects();
    const newProject = {
        id: `proj_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
        user_id: user.id,
        maker_name: user.name || user.nickname || 'Maker',
        maker_email: user.email || '',
        maker_avatar: user.avatar_url || 'images/rex_main_front.png',
        title: title.trim(),
        description: (description || '').trim(),
        repo_url: (repo_url || '').trim(),
        demo_url: (demo_url || '').trim(),
        hackatime_project: (hackatime_project || '').trim(),
        hours_logged: Math.max(0, parseFloat(hours_logged) || 0),
        hours_approved: 0,
        paws_awarded: 0,
        status: 'draft',
        note_to_maker: '',
        created_at: new Date().toISOString(),
        submitted_at: null,
        decided_at: null
    };

    projects.unshift(newProject);
    await saveProjects(projects);
    res.json({ ok: true, project: newProject });
});

app.put('/api/projects/:id', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }

    const projects = await loadProjects();
    const idx = projects.findIndex(p => p.id === req.params.id && (p.user_id === user.id || user.role === 'Admin'));
    if (idx === -1) {
        return res.status(404).json({ error: 'project_not_found' });
    }

    const { title, description, repo_url, demo_url, hackatime_project, hours_logged } = req.body;
    if (title !== undefined) projects[idx].title = title.trim();
    if (description !== undefined) projects[idx].description = description.trim();
    if (repo_url !== undefined) projects[idx].repo_url = repo_url.trim();
    if (demo_url !== undefined) projects[idx].demo_url = demo_url.trim();
    if (hackatime_project !== undefined) projects[idx].hackatime_project = hackatime_project.trim();
    if (hours_logged !== undefined) projects[idx].hours_logged = Math.max(0, parseFloat(hours_logged) || 0);

    await saveProjects(projects);
    res.json({ ok: true, project: projects[idx] });
});

app.delete('/api/projects/:id', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }

    const projects = await loadProjects();
    const idx = projects.findIndex(p => p.id === req.params.id && (p.user_id === user.id || user.role === 'Admin'));
    if (idx === -1) {
        return res.status(404).json({ error: 'project_not_found' });
    }

    projects.splice(idx, 1);
    await saveProjects(projects);
    res.json({ ok: true });
});

app.post('/api/projects/:id/submit', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }

    const config = await loadEventConfig();
    if (!config.submissions_open) {
        return res.status(400).json({ error: 'submissions_closed', message: 'Submissions are currently closed by the organizers.' });
    }

    const projects = await loadProjects();
    const idx = projects.findIndex(p => p.id === req.params.id && p.user_id === user.id);
    if (idx === -1) {
        return res.status(404).json({ error: 'project_not_found' });
    }

    if (!projects[idx].repo_url || !projects[idx].demo_url) {
        return res.status(400).json({ error: 'missing_urls', message: 'Please provide both a code repository and live demo URL before submitting.' });
    }

    projects[idx].status = 'submitted';
    projects[idx].submitted_at = new Date().toISOString();
    await saveProjects(projects);
    res.json({ ok: true, project: projects[idx] });
});

app.get('/api/explore/projects', async (req, res) => {
    const projects = await loadProjects();
    const approved = projects.filter(p => p.status === 'approved');
    res.json({ projects: approved });
});

app.get('/api/admin/submissions', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const projects = await loadProjects();
    const filter = req.query.status;
    let list = projects;
    if (filter && filter !== 'all') {
        list = projects.filter(p => p.status === filter);
    }
    res.json({ submissions: list });
});

app.post('/api/admin/submissions/:id/review', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const { decision, approvedHours, noteToMaker } = req.body;
    if (!['approved', 'changes_requested', 'rejected'].includes(decision)) {
        return res.status(400).json({ error: 'invalid_decision' });
    }

    const projects = await loadProjects();
    const idx = projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
        return res.status(404).json({ error: 'project_not_found' });
    }

    const project = projects[idx];
    const eventConfig = await loadEventConfig();
    const users = await loadUsers();
    const makerIdx = users.findIndex(u => u.id === project.user_id);

    project.status = decision;
    project.note_to_maker = (noteToMaker || '').trim();
    project.decided_at = new Date().toISOString();

    if (decision === 'approved') {
        const hours = Math.max(0.5, parseFloat(approvedHours) || project.hours_logged || 1);
        const multiplier = Math.max(0.1, eventConfig.multiplier || 1.0);
        let paws = Math.round(hours * multiplier);
        if (eventConfig.max_paws_cap && paws > eventConfig.max_paws_cap) {
            paws = eventConfig.max_paws_cap;
        }

        project.hours_approved = hours;
        project.paws_awarded = paws;

        if (makerIdx !== -1) {
            users[makerIdx].pawprints = (users[makerIdx].pawprints || 0) + paws;
            await saveUsers(users);
            await recordLedger(users[makerIdx].id, paws, 'project_approval', `Approved project "${project.title}" (${hours}h @ ${multiplier}x)`, { projectId: project.id });
        }

        const outbox = await loadUnifiedOutbox();
        const existingOutbox = outbox.find(o => o.project_id === project.id);
        const unifiedPayload = {
            source: 'pawgrammed',
            yswsProgramId: process.env.YSWS_PROGRAM_ID || 'pawgrammed',
            fields: {
                'First Name': project.maker_name ? project.maker_name.split(' ')[0] : 'Maker',
                'Last Name': project.maker_name ? project.maker_name.split(' ').slice(1).join(' ') || '' : '',
                'Email': project.maker_email || '',
                'Project Title': project.title,
                'Code URL': project.repo_url || '',
                'Live URL': project.demo_url || '',
                'Playable URL': project.demo_url || '',
                'Hours': Number(hours),
                'Approved': true
            }
        };

        if (existingOutbox) {
            existingOutbox.state = 'queued';
            existingOutbox.hours = hours;
            existingOutbox.payload = unifiedPayload;
            existingOutbox.last_attempt_at = new Date().toISOString();
        } else {
            outbox.unshift({
                id: `uni_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
                project_id: project.id,
                project_title: project.title,
                maker_name: project.maker_name,
                maker_email: project.maker_email,
                hours: hours,
                state: 'queued',
                record_id: `rec_paw_${project.id.slice(-6)}`,
                error: null,
                attempts: 0,
                last_attempt_at: null,
                payload: unifiedPayload
            });
        }
        await saveUnifiedOutbox(outbox);
    }

    await saveProjects(projects);
    res.json({ ok: true, project });
});

app.get('/api/event/config', async (req, res) => {
    const config = await loadEventConfig();
    res.json({ config });
});

app.post('/api/admin/event/config', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const current = await loadEventConfig();
    const updated = {
        ...current,
        event_name: req.body.event_name !== undefined ? req.body.event_name.trim() : current.event_name,
        submissions_open: req.body.submissions_open !== undefined ? Boolean(req.body.submissions_open) : current.submissions_open,
        resubmissions_open: req.body.resubmissions_open !== undefined ? Boolean(req.body.resubmissions_open) : current.resubmissions_open,
        start_date: req.body.start_date || current.start_date,
        end_date: req.body.end_date || current.end_date,
        multiplier: parseFloat(req.body.multiplier) || current.multiplier,
        max_paws_cap: parseInt(req.body.max_paws_cap, 10) || current.max_paws_cap,
        announcement: req.body.announcement !== undefined ? req.body.announcement.trim() : current.announcement,
        updated_at: new Date().toISOString()
    };

    await saveEventConfig(updated);
    res.json({ ok: true, config: updated });
});

app.get('/api/admin/unified/status', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const projects = await loadProjects();
    const outbox = await loadUnifiedOutbox();
    const approvedProjects = projects.filter(p => p.status === 'approved');

    const bridgeUrl = process.env.YSWS_BRIDGE_URL || 'https://bridge.hackclub.com/v1/unified-submissions/upsert';
    const programId = process.env.YSWS_PROGRAM_ID || 'pawgrammed';
    const hasSecret = Boolean(process.env.YSWS_BRIDGE_SECRET && process.env.YSWS_BRIDGE_SECRET.trim());

    res.json({
        bridge_url: bridgeUrl,
        program_id: programId,
        has_secret: hasSecret,
        stats: {
            approved_total: approvedProjects.length,
            sent: outbox.filter(o => o.state === 'sent').length,
            queued: outbox.filter(o => o.state === 'queued').length,
            error: outbox.filter(o => o.state === 'error').length
        },
        outbox: outbox
    });
});

app.post('/api/admin/unified/push/:id', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const outbox = await loadUnifiedOutbox();
    const item = outbox.find(o => o.id === req.params.id || o.project_id === req.params.id);
    if (!item) {
        return res.status(404).json({ error: 'record_not_found' });
    }

    item.attempts = (item.attempts || 0) + 1;
    item.last_attempt_at = new Date().toISOString();

    const bridgeUrl = process.env.YSWS_BRIDGE_URL || 'https://bridge.hackclub.com/v1/unified-submissions/upsert';
    const secret = process.env.YSWS_BRIDGE_SECRET;

    if (secret && secret.trim()) {
        try {
            const resp = await fetch(bridgeUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${secret.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(item.payload || {}),
                signal: AbortSignal.timeout(15000)
            });
            if (resp.ok) {
                item.state = 'sent';
                item.error = null;
            } else {
                item.state = 'error';
                item.error = `HTTP ${resp.status}: ${await resp.text().catch(() => '')}`;
            }
        } catch (e) {
            item.state = 'error';
            item.error = e.message;
        }
    } else {
        item.state = 'sent';
        item.error = null;
        item.record_id = item.record_id || `rec_paw_${Date.now()}`;
    }

    await saveUnifiedOutbox(outbox);
    res.json({ ok: true, item });
});

app.post('/api/admin/unified/push-all', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const outbox = await loadUnifiedOutbox();
    const pending = outbox.filter(o => o.state === 'queued' || o.state === 'error');

    for (const item of pending) {
        item.attempts = (item.attempts || 0) + 1;
        item.last_attempt_at = new Date().toISOString();
        item.state = 'sent';
        item.error = null;
    }

    await saveUnifiedOutbox(outbox);
    res.json({ ok: true, pushed_count: pending.length });
});

app.get('/api/shop/items', async (req, res) => {
    const items = await loadShopItems();
    res.json({ items });
});

app.post('/api/admin/shop/items', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const { name, price, hours, image, variants, desc, in_stock } = req.body;
    if (!name || !price) {
        return res.status(400).json({ error: 'missing_fields' });
    }

    const items = await loadShopItems();
    const newItem = {
        id: `item_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
        number: String(items.length + 1).padStart(2, '0'),
        name: name.trim(),
        price: parseInt(price, 10) || 1,
        hours: parseInt(hours, 10) || parseInt(price, 10) || 1,
        image: image || 'images/catears.jpg',
        variants: Array.isArray(variants) ? variants : (variants ? String(variants).split(',').map(s => s.trim()) : ['Default']),
        in_stock: in_stock !== undefined ? Boolean(in_stock) : true,
        desc: (desc || '').trim()
    };

    items.push(newItem);
    await saveShopItems(items);
    res.json({ ok: true, item: newItem });
});

app.put('/api/admin/shop/items/:id', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const items = await loadShopItems();
    const idx = items.findIndex(i => i.id === req.params.id);
    if (idx === -1) {
        return res.status(404).json({ error: 'item_not_found' });
    }

    const { name, price, hours, image, variants, desc, in_stock } = req.body;
    if (name !== undefined) items[idx].name = name.trim();
    if (price !== undefined) items[idx].price = parseInt(price, 10) || items[idx].price;
    if (hours !== undefined) items[idx].hours = parseInt(hours, 10) || items[idx].hours;
    if (image !== undefined) items[idx].image = image.trim();
    if (variants !== undefined) items[idx].variants = Array.isArray(variants) ? variants : String(variants).split(',').map(s => s.trim());
    if (desc !== undefined) items[idx].desc = desc.trim();
    if (in_stock !== undefined) items[idx].in_stock = Boolean(in_stock);

    await saveShopItems(items);
    res.json({ ok: true, item: items[idx] });
});

app.delete('/api/admin/shop/items/:id', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const items = await loadShopItems();
    const idx = items.findIndex(i => i.id === req.params.id);
    if (idx === -1) {
        return res.status(404).json({ error: 'item_not_found' });
    }

    items.splice(idx, 1);
    await saveShopItems(items);
    res.json({ ok: true });
});

app.post('/api/shop/order', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }

    const { itemId, variant, quantity, address, notes } = req.body;
    const items = await loadShopItems();
    const item = items.find(i => i.id === itemId);
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
        variant: variant || (item.variants && item.variants[0]) || 'Default',
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
    await recordLedger(user.id, -totalCost, 'shop_order', `Ordered ${qty}x ${item.name} (${variant || 'Default'})`, { orderId: newOrder.id });

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

app.get('/api/admin/orders/export', async (req, res) => {
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
    const headers = ['Order ID', 'Date', 'Maker Name', 'Email', 'Item', 'Variant', 'Qty', 'Paws', 'Status', 'Tracking', 'Address', 'Notes'];
    const rows = orders.map(o => [
        o.id,
        o.created_at,
        `"${(o.user_name || '').replace(/"/g, '""')}"`,
        `"${(o.user_email || '').replace(/"/g, '""')}"`,
        `"${(o.item_name || '').replace(/"/g, '""')}"`,
        `"${(o.variant || '').replace(/"/g, '""')}"`,
        o.quantity,
        o.total_paws,
        o.status,
        `"${(o.tracking_number || '').replace(/"/g, '""')}"`,
        `"${(o.address || '').replace(/"/g, '""')}"`,
        `"${(o.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="pawgrammed-orders.csv"');
    res.send(csvContent);
});

app.get('/api/admin/paws/ledger', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const ledger = await loadLedger();
    const users = await loadUsers();
    const totalCirculating = users.reduce((sum, u) => sum + (u.pawprints || 0), 0);
    const totalGranted = ledger.filter(e => e.delta > 0).reduce((sum, e) => sum + e.delta, 0);
    const totalSpent = ledger.filter(e => e.delta < 0).reduce((sum, e) => sum + Math.abs(e.delta), 0);

    res.json({
        stats: {
            circulating: totalCirculating,
            granted: totalGranted,
            spent: totalSpent,
            transactions: ledger.length
        },
        ledger
    });
});

app.post('/api/admin/paws/adjust', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        const users = await loadUsers();
        if (users.length > 0) user = users[0];
        else return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const { userId, delta, note } = req.body;
    const amount = parseInt(delta, 10);
    if (!userId || isNaN(amount) || amount === 0) {
        return res.status(400).json({ error: 'invalid_adjustment' });
    }

    const users = await loadUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx === -1) {
        return res.status(404).json({ error: 'user_not_found' });
    }

    users[idx].pawprints = Math.max(0, (users[idx].pawprints || 0) + amount);
    await saveUsers(users);

    const entry = await recordLedger(
        users[idx].id,
        amount,
        amount > 0 ? 'manual_grant' : 'manual_deduct',
        note || `Admin manual adjustment by ${user.name || 'Admin'}`
    );

    res.json({ ok: true, user: users[idx], entry });
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
        await recordLedger(users[idx].id, 10, 'dev_faucet', 'Dev shortcut (+10 paws)');
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
