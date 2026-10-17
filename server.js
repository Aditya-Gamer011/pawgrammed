import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs/promises';
import 'dotenv/config';

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3000;
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'pawgrammed-data') : path.resolve('data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const EVENT_CONFIG_FILE = path.join(DATA_DIR, 'event_config.json');
const LEDGER_FILE = path.join(DATA_DIR, 'paws_ledger.json');
const SHOP_ITEMS_FILE = path.join(DATA_DIR, 'shop_items.json');
const UNIFIED_OUTBOX_FILE = path.join(DATA_DIR, 'unified_outbox.json');
const UPLOADS_DIR = IS_VERCEL ? path.join('/tmp', 'pawgrammed-uploads', 'screenshots') : path.resolve('uploads', 'screenshots');

app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));
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
    announcement: ''
};

async function ensureDataFiles() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    if (IS_VERCEL) {
        const rootData = path.resolve('data');
        const files = ['users.json', 'sessions.json', 'orders.json', 'projects.json', 'event_config.json', 'paws_ledger.json', 'shop_items.json', 'unified_outbox.json'];
        for (const file of files) {
            const target = path.join(DATA_DIR, file);
            try {
                await fs.access(target);
            } catch {
                try {
                    const src = path.join(rootData, file);
                    const content = await fs.readFile(src, 'utf-8');
                    await fs.writeFile(target, content, 'utf-8');
                } catch {}
            }
        }
    }
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
        await fs.writeFile(PROJECTS_FILE, JSON.stringify([], null, 2), 'utf-8');
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
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
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
        notes: note || '',
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
    return (process.env.ADMIN_EMAILS || process.env.ORGANIZER_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

function isAdminEmail(email) {
    if (!email) return false;
    const adminEmails = getAdminEmails();
    return adminEmails.includes(email.trim().toLowerCase());
}

function isAdminUser(user) {
    if (!user) return false;
    if (isAdminEmail(user.email)) return true;
    const adminSlackIds = (process.env.ADMIN_SLACK_IDS || process.env.ORGANIZER_SLACK_IDS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (user.slack_id && adminSlackIds.includes(user.slack_id)) return true;
    return false;
}

function getEffectiveHostAndProto(req) {
    const forwardedHost = req.get('x-forwarded-host');
    const host = (forwardedHost || req.get('host') || '').trim();
    const forwardedProto = req.get('x-forwarded-proto');
    const proto = (forwardedProto || req.protocol || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https')).split(',')[0].trim();
    return { host: host || 'localhost:3000', proto };
}

function getHcaRedirectUri(req) {
    const { host, proto } = getEffectiveHostAndProto(req);
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        return `${proto}://${host}/auth/callback`;
    }
    if (process.env.HCA_REDIRECT_URI && !process.env.HCA_REDIRECT_URI.includes('localhost')) {
        return process.env.HCA_REDIRECT_URI;
    }
    return `${proto}://${host}/auth/callback`;
}

function getHackatimeRedirectUri(req) {
    const { host, proto } = getEffectiveHostAndProto(req);
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        return `${proto}://${host}/auth/callback`;
    }
    if (process.env.HACKATIME_REDIRECT_URI && !process.env.HACKATIME_REDIRECT_URI.includes('localhost')) {
        return process.env.HACKATIME_REDIRECT_URI;
    }
    return `${proto}://${host}/auth/callback`;
}

async function fetchSlackProfile(slackId) {
    if (!slackId || !process.env.SLACK_BOT_TOKEN) return null;
    try {
        const res = await fetch(`https://slack.com/api/users.info?user=${encodeURIComponent(slackId)}`, {
            headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` }
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.ok || !data.user) return null;
        return {
            name: data.user.real_name || data.user.name,
            handle: data.user.profile?.display_name || data.user.name || '',
            avatar: data.user.profile?.image_192 || data.user.profile?.image_512 || data.user.profile?.image_72 || data.user.profile?.image_48 || null
        };
    } catch {
        return null;
    }
}

async function checkHcaVerification(identifier) {
    try {
        const params = new URLSearchParams();
        if (identifier.idv_id) params.set('idv_id', identifier.idv_id);
        else if (identifier.email) params.set('email', identifier.email);
        else if (identifier.slack_id) params.set('slack_id', identifier.slack_id);
        else return null;

        const res = await fetch(`https://auth.hackclub.com/api/external/check?${params.toString()}`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.result || null;
    } catch {
        return null;
    }
}

async function refreshHcaAccessToken(user) {
    if (!user || !user.hca_refresh_token) return null;
    try {
        const res = await fetch('https://auth.hackclub.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: user.hca_refresh_token,
                client_id: process.env.HCA_CLIENT_ID,
                client_secret: process.env.HCA_CLIENT_SECRET
            })
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (data.access_token) {
            user.hca_access_token = data.access_token;
            if (data.refresh_token) user.hca_refresh_token = data.refresh_token;
            const users = await loadUsers();
            const idx = users.findIndex(u => u.id === user.id);
            if (idx !== -1) {
                users[idx].hca_access_token = data.access_token;
                if (data.refresh_token) users[idx].hca_refresh_token = data.refresh_token;
                await saveUsers(users);
            }
            return data.access_token;
        }
    } catch {
        return null;
    }
    return null;
}

async function sendSlackDm(slackId, message) {
    if (!slackId || !process.env.SLACK_BOT_TOKEN) return false;
    try {
        const openRes = await fetch('https://slack.com/api/conversations.open', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({ users: slackId }),
            signal: AbortSignal.timeout(5000)
        });
        if (!openRes.ok) return false;
        const openData = await openRes.json();
        const channel = openData.channel?.id;
        if (!channel) return false;

        const postRes = await fetch('https://slack.com/api/chat.postMessage', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
                'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
                channel: channel,
                text: message,
                mrkdwn: true,
                unfurl_links: false
            }),
            signal: AbortSignal.timeout(5000)
        });
        if (!postRes.ok) return false;
        const postData = await postRes.json();
        return Boolean(postData.ok);
    } catch {
        return false;
    }
}

async function notifyProjectDecision(project, makerUser, decision, approvedHours, awardedPaws, note) {
    if (!makerUser?.slack_id) return;
    const name = makerUser.first_name || makerUser.name || 'there';
    const title = project.title || 'Untitled';
    let message = '';
    if (decision === 'approved') {
        message = `🌟 *Your Pawgrammed project was approved!*\nHey ${name} — *${title}* has been approved for *${approvedHours}h* and awarded *${awardedPaws} paws*! 🐾\n\nKeep shipping!`;
    } else if (decision === 'changes_requested') {
        message = `🛠️ *Changes requested on your Pawgrammed project*\nHey ${name} — the organizers reviewed *${title}* and requested a few changes:\n\n>${note || 'Please check the dashboard for details.'}\n\nYou've got this!`;
    } else if (decision === 'rejected') {
        message = `📋 *Update on your Pawgrammed project*\nHey ${name} — *${title}* wasn't approved this time.\n\nFeedback:\n>${note || 'Please check the dashboard for details.'}`;
    }
    if (message) {
        await sendSlackDm(makerUser.slack_id, message);
    }
}

async function getSessionUser(req) {
    const token = req.cookies?.paw_session;
    if (token) {
        const sessions = await loadSessions();
        const session = sessions[token];
        if (session && session.userId) {
            const users = await loadUsers();
            const u = users.find(x => x.id === session.userId);
            if (u) {
                if (isAdminUser(u) && u.role !== 'Admin') {
                    u.role = 'Admin';
                    await saveUsers(users);
                }
                return u;
            }
        }
    }
    return null;
}

app.get('/login', (req, res) => {
    const state = crypto.randomUUID();
    res.cookie('hca_state', state, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 30 * 60 * 1000
    });

    if (req.query.return_to) {
        res.cookie('hca_return_to', String(req.query.return_to), {
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 30 * 60 * 1000
        });
    }

    const redirectUri = getHcaRedirectUri(req);
    const scope = process.env.HCA_SCOPE || 'openid profile email slack_id verification_status';
    const params = new URLSearchParams({
        client_id: process.env.HCA_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scope,
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
    const user = await getSessionUser(req);
    if (!user) {
        return res.redirect('/login');
    }

    const state = `hackatime_${user.id}_${crypto.randomUUID()}`;
    res.cookie('hackatime_state', state, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000
    });

    const redirectUri = getHackatimeRedirectUri(req);
    res.cookie('hackatime_redirect_uri', redirectUri, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000
    });

    const params = new URLSearchParams({
        client_id: process.env.HACKATIME_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'profile read',
        state: state
    });

    res.redirect(`https://hackatime.hackclub.com/oauth/authorize?${params.toString()}`);
});

async function fetchUserHackatimeProjects(accessToken) {
    if (!accessToken) return [];
    try {
        const res = await fetch('https://hackatime.hackclub.com/api/v1/authenticated/projects', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (!res.ok) {
            console.error('Failed fetching Hackatime projects:', res.status);
            return [];
        }
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : (Array.isArray(data.projects) ? data.projects : (data.data || []));

        return rawList
            .map(p => {
                const latestHeartbeat = p.most_recent_heartbeat || p.most_recent_heartbeat_at || p.last_heartbeat_at || p.lastSeen || null;
                const totalSeconds = Number(p.total_seconds ?? p.totalSeconds ?? 0);
                const hbTime = latestHeartbeat ? new Date(latestHeartbeat).getTime() : null;
                return {
                    name: String(p.name || ''),
                    total_seconds: totalSeconds,
                    hours: Number((totalSeconds / 3600).toFixed(1)),
                    languages: Array.isArray(p.languages) ? p.languages : [],
                    most_recent_heartbeat: latestHeartbeat,
                    created_at: p.created_at || null,
                    timestamp: hbTime || (p.created_at ? new Date(p.created_at).getTime() : null)
                };
            })
            .filter(p => p.name && p.total_seconds > 0)
            .sort((a, b) => b.total_seconds - a.total_seconds);
    } catch (err) {
        console.error('Error fetching Hackatime projects:', err);
        return [];
    }
}

function calculateProjectHackatimeStats(project, hackatimeList) {
    const pTags = Array.isArray(project.hackatime_projects) && project.hackatime_projects.length > 0
        ? project.hackatime_projects
        : (project.hackatime_project ? project.hackatime_project.split(',').map(s => s.trim()).filter(Boolean) : []);
    if (!pTags.length || !hackatimeList || !hackatimeList.length) {
        const secs = project.seconds_logged !== undefined ? project.seconds_logged : Math.round((project.hours_logged || 0) * 3600);
        return {
            seconds: secs,
            hours: Number((secs / 3600).toFixed(1))
        };
    }
    const lowerTags = new Set(pTags.map(t => t.toLowerCase()));
    const totalSecs = hackatimeList
        .filter(p => p && p.name && lowerTags.has(p.name.toLowerCase()))
        .reduce((sum, p) => sum + (p.total_seconds || 0), 0);
    return {
        seconds: totalSecs,
        hours: Number((totalSecs / 3600).toFixed(1))
    };
}

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

    const redirectUri = req.cookies.hackatime_redirect_uri || getHackatimeRedirectUri(req);
    res.clearCookie('hackatime_redirect_uri', { path: '/' });

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

        const projectsList = await fetchUserHackatimeProjects(accessToken);
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
            u.hackatime_projects_cache = projectsList;
            if (apiKey) u.hackatime_key = apiKey;
            await saveUsers(users);

            const allProjects = await loadProjects();
            let changedProjects = false;
            for (const proj of allProjects) {
                if (proj.user_id === u.id) {
                    const stats = calculateProjectHackatimeStats(proj, projectsList);
                    proj.hours_logged = stats.hours;
                    proj.seconds_logged = stats.seconds;
                    changedProjects = true;
                }
            }
            if (changedProjects) {
                await saveProjects(allProjects);
            }
        }

        res.redirect('/dashboard?hackatime=connected');
    } catch (err) {
        console.error('Hackatime OAuth error:', err);
        res.redirect('/dashboard?hackatime_error=server_error');
    }
}

app.get('/auth/hackatime/callback', handleHackatimeCallback);

function parseHcaAddress(identity, userinfo, firstName, lastName, fullName) {
    let rawAddr = null;
    const addresses = identity?.addresses || userinfo?.addresses;
    if (Array.isArray(addresses) && addresses.length > 0) {
        rawAddr = addresses.find(a => a.primary) || addresses[0];
    } else if (identity?.primary_address && typeof identity.primary_address === 'object') {
        rawAddr = identity.primary_address;
    } else if (identity?.address && typeof identity.address === 'object') {
        rawAddr = identity.address;
    } else if (userinfo?.primary_address && typeof userinfo.primary_address === 'object') {
        rawAddr = userinfo.primary_address;
    }

    if (rawAddr) {
        const pName = [rawAddr.first_name || firstName, rawAddr.last_name || lastName].filter(Boolean).join(' ') || fullName || '';
        const addressObj = {
            name: pName,
            line1: rawAddr.line_1 || rawAddr.line1 || rawAddr.street_address || '',
            line2: rawAddr.line_2 || rawAddr.line2 || '',
            city: rawAddr.city || rawAddr.locality || '',
            state: rawAddr.state || rawAddr.region || '',
            postal_code: rawAddr.postal_code || rawAddr.postcode || rawAddr.zip || '',
            country: rawAddr.country || '',
            first_name: rawAddr.first_name || firstName || '',
            last_name: rawAddr.last_name || lastName || ''
        };
        const shippingAddress = [
            addressObj.name,
            addressObj.line1,
            addressObj.line2,
            addressObj.city,
            addressObj.state,
            addressObj.postal_code,
            addressObj.country
        ].filter(Boolean).join(', ');
        return { addressObj, shippingAddress };
    }

    if (userinfo?.address) {
        const uAddr = userinfo.address;
        const [line1, ...rest] = (uAddr.street_address || uAddr.formatted || '').split(/\r?\n/);
        const pName = fullName || [firstName, lastName].filter(Boolean).join(' ') || '';
        const addressObj = {
            name: pName,
            line1: line1?.trim() || '',
            line2: rest.join(' ').trim() || '',
            city: uAddr.locality || uAddr.city || '',
            state: uAddr.region || uAddr.state || '',
            postal_code: uAddr.postal_code || uAddr.postcode || '',
            country: uAddr.country || '',
            first_name: firstName || '',
            last_name: lastName || ''
        };
        const shippingAddress = [
            addressObj.name,
            addressObj.line1,
            addressObj.line2,
            addressObj.city,
            addressObj.state,
            addressObj.postal_code,
            addressObj.country
        ].filter(Boolean).join(', ');
        return { addressObj, shippingAddress };
    }

    return { addressObj: null, shippingAddress: '' };
}

async function saveBase64Image(dataUri, prefix = 'screenshot') {
    if (!dataUri || typeof dataUri !== 'string' || !dataUri.startsWith('data:image/')) {
        return dataUri;
    }
    try {
        const matches = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (!matches) return dataUri;
        const rawExt = matches[1].toLowerCase();
        const ext = rawExt === 'jpeg' ? 'jpg' : rawExt.replace('+xml', '');
        const buffer = Buffer.from(matches[2], 'base64');

        if (process.env.CDN_TOKEN && process.env.CDN_TOKEN.trim()) {
            try {
                const formData = new FormData();
                const blob = new Blob([buffer], { type: `image/${rawExt}` });
                formData.append('file', blob, `${prefix}_${Date.now()}.${ext}`);
                const cdnRes = await fetch('https://cdn.hackclub.com/api/v4/upload', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${process.env.CDN_TOKEN.trim()}` },
                    body: formData,
                    signal: AbortSignal.timeout(15000)
                });
                if (cdnRes.ok) {
                    const cdnData = await cdnRes.json().catch(() => null);
                    if (cdnData && cdnData.url) return cdnData.url;
                }
            } catch (cdnErr) {
                console.error('CDN upload error:', cdnErr.message);
            }
        }

        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        const filename = `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, filename);
        await fs.writeFile(filePath, buffer);

        const baseUrl = (process.env.PUBLIC_URL || process.env.BASE_URL || '').replace(/\/+$/, '');
        return `${baseUrl}/uploads/screenshots/${filename}`;
    } catch (e) {
        console.error('Error saving image:', e.message);
        return dataUri;
    }
}

function resolveUserAddress(makerUser) {
    const addr = makerUser?.address || {};
    let line1 = addr.line1 || null;
    let line2 = addr.line2 || null;
    let city = addr.city || null;
    let state = addr.state || null;
    let postalCode = addr.postal_code || addr.postcode || null;
    let country = addr.country || null;

    if ((!line1 || !city || !country) && makerUser?.shipping_address) {
        const parts = makerUser.shipping_address.split(',').map(s => s.trim()).filter(Boolean);
        if (parts.length >= 3) {
            let p = [...parts];
            if (p[0] === (makerUser.name || makerUser.nickname)) {
                p.shift();
            }
            if (!line1 && p.length > 0) line1 = p[0];
            if (!country && p.length > 1) country = p[p.length - 1];
            if (!postalCode && p.length > 2 && /^[0-9A-Z\s-]{3,10}$/i.test(p[p.length - 2])) {
                postalCode = p[p.length - 2];
            }
            if (!state && p.length > 3) state = p[p.length - 3];
            if (!city && p.length > 2) city = p[1];
        } else if (!line1) {
            line1 = makerUser.shipping_address;
        }
    }

    return { line1, line2, city, state, postalCode, country };
}

function buildUnifiedPayload(project, makerUser, approvedHours) {
    const hours = Number(approvedHours || project.hours_approved || project.hours_logged || 1);
    const firstName = makerUser?.first_name || (project.maker_name ? project.maker_name.split(' ')[0] : 'Maker');
    const lastName = makerUser?.last_name || (project.maker_name ? project.maker_name.split(' ').slice(1).join(' ') : '');
    const addr = resolveUserAddress(makerUser);

    let ghUsername = null;
    if (project.repo_url) {
        try {
            const parsed = new URL(project.repo_url);
            const segs = parsed.pathname.split('/').filter(Boolean);
            if (segs.length > 0) ghUsername = segs[0];
        } catch {}
    }
    if (!ghUsername && makerUser?.hackatime_github) {
        ghUsername = makerUser.hackatime_github;
    }

    const htNames = Array.isArray(project.hackatime_projects) && project.hackatime_projects.length > 0
        ? project.hackatime_projects.join(', ')
        : (project.hackatime_project || 'None');

    const justification = [
        `[HACKATIME]\nProjects: ${htNames}\nLogged: ${project.hours_logged || hours}h`,
        `[PROJECT]\n${project.description || 'Pawgrammed project'}`,
        `[REVIEW]\nApproved in Pawgrammed for ${hours}h.`
    ].join('\n\n');

    let screenshotVal = null;
    if (project.screenshot_url) {
        let scUrl = project.screenshot_url;
        if (scUrl.startsWith('/')) {
            const base = (process.env.PUBLIC_URL || process.env.BASE_URL || 'https://pawgrammed.hackclub.com').replace(/\/+$/, '');
            scUrl = `${base}${scUrl}`;
        }
        if (scUrl.startsWith('http://') || scUrl.startsWith('https://')) {
            let filename = 'screenshot.png';
            try {
                const last = new URL(scUrl).pathname.split('/').filter(Boolean).pop();
                if (last) filename = decodeURIComponent(last);
            } catch {}
            screenshotVal = [{ url: scUrl, filename: filename }];
        }
    }

    const fields = {};
    function setIf(key, val) {
        if (val !== null && val !== undefined && val !== '') {
            fields[key] = val;
        }
    }

    setIf('First Name', firstName);
    setIf('Last Name', lastName);
    setIf('Email', makerUser?.email || project.maker_email || '');
    if (makerUser?.birthday) {
        setIf('Birthday', String(makerUser.birthday).split('T')[0]);
    }
    setIf('Address (Line 1)', addr.line1);
    setIf('Address (Line 2)', addr.line2);
    setIf('City', addr.city);
    setIf('State / Province', addr.state);
    setIf('ZIP / Postal Code', addr.postalCode);
    setIf('Country', addr.country);
    setIf('Code URL', project.repo_url || '');
    setIf('Playable URL', project.demo_url || '');
    if (screenshotVal && Array.isArray(screenshotVal) && screenshotVal.length > 0) {
        const publicAtts = screenshotVal.filter(a => !a.url.includes('localhost') && !a.url.includes('127.0.0.1'));
        if (publicAtts.length > 0) {
            fields['Screenshot'] = publicAtts;
        }
    }
    setIf('Description', project.description || '');
    setIf('GitHub Username', ghUsername);
    setIf('Optional - Override Hours Spent', hours);
    setIf('Optional - Override Hours Spent Justification', justification);
    setIf('Justification - Hackatime Project Name(s) + Date Range(s)', htNames);
    if (makerUser?.hackatime_id) {
        setIf('Justification - Submitter Hackatime ID', String(makerUser.hackatime_id));
    }
    setIf('Justification - Specific Technical Features', project.description || '');
    setIf('Justification - Additional Justification', `Approved in Pawgrammed for ${hours}h.`);

    return {
        source: 'pawgrammed',
        project_title: project.title,
        fields: fields
    };
}

const AIRTABLE_FIELD_MAP = {
    'First Name': 'First Name',
    'Last Name': 'Last Name',
    'Email': 'Email',
    'Birthday': 'Birthday',
    'Address (Line 1)': 'Address (Line 1)',
    'Address (Line 2)': 'Address (Line 2)',
    'City': 'City',
    'State / Province': 'State / Province',
    'ZIP / Postal Code': 'ZIP / Postal Code',
    'Country': 'Country',
    'Code URL': 'Code URL',
    'Playable URL': 'Playable URL',
    'Screenshot': 'Screenshot',
    'Description': 'Description',
    'GitHub Username': 'GitHub Username',
    'Optional - Override Hours Spent': 'Optional - Override Hours Spent',
    'Override Hours Spent': 'Optional - Override Hours Spent',
    'Optional - Override Hours Spent Justification': 'Optional - Override Hours Spent Justification',
    'Override Hours Spent Justification': 'Optional - Override Hours Spent Justification',
    'Justification - Hackatime Project Name(s) + Date Range(s)': 'Justification - Hackatime Project Name(s) + Date Range(s)',
    'Justification - Submitter Hackatime ID': 'Justification - Submitter Hackatime ID',
    'Justification - Specific Technical Features': 'Justification - Specific Technical Features',
    'Justification - Additional Justification': 'Justification - Additional Justification'
};

async function pushToAirtableDirect(item, airtableToken, airtableBaseId, airtableTableIdOrName) {
    let tableId = airtableTableIdOrName || process.env.AIRTABLE_TABLE_ID || process.env.AIRTABLE_TABLE_NAME || 'tblCzg8gTBTwLdb8g';
    if (tableId.includes('tblEsiA0P8o5PKIru')) {
        tableId = 'tblCzg8gTBTwLdb8g';
    }
    const url = `https://api.airtable.com/v0/${airtableBaseId}/${encodeURIComponent(tableId)}`;

    const rawFields = item.payload?.fields || {};
    const fields = {};
    for (const [k, v] of Object.entries(rawFields)) {
        if (v === null || v === undefined || v === '') continue;
        const targetField = AIRTABLE_FIELD_MAP[k];
        if (!targetField) continue;
        if (targetField === 'Screenshot') {
            if (Array.isArray(v) && v.length > 0) {
                const validAttachments = v.filter(a => a && typeof a.url === 'string' && a.url.startsWith('http') && !a.url.includes('localhost') && !a.url.includes('127.0.0.1'));
                if (validAttachments.length > 0) {
                    fields[targetField] = validAttachments;
                }
            }
        } else {
            fields[targetField] = v;
        }
    }

    let resp = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${airtableToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields }),
        signal: AbortSignal.timeout(15000)
    });

    if (!resp.ok) {
        const errText = await resp.text().catch(() => '');
        if (tableId !== 'tblCzg8gTBTwLdb8g' && errText.includes('UNKNOWN_FIELD_NAME')) {
            const fallbackUrl = `https://api.airtable.com/v0/${airtableBaseId}/tblCzg8gTBTwLdb8g`;
            const retryResp = await fetch(fallbackUrl, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${airtableToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fields }),
                signal: AbortSignal.timeout(15000)
            });
            if (retryResp.ok) {
                const data = await retryResp.json().catch(() => ({}));
                return { ok: true, id: data.id };
            }
        }
        return { ok: false, error: `Airtable HTTP ${resp.status}: ${errText}` };
    }

    const data = await resp.json().catch(() => ({}));
    return { ok: true, id: data.id };
}

async function pushUnifiedRecord(item) {
    item.attempts = (item.attempts || 0) + 1;
    item.last_attempt_at = new Date().toISOString();

    if (item.project_id) {
        try {
            const projects = await loadProjects();
            const proj = projects.find(p => p.id === item.project_id);
            if (proj) {
                const users = await loadUsers();
                const maker = users.find(u => u.id === proj.user_id);
                item.payload = buildUnifiedPayload(proj, maker, item.hours || proj.hours_approved);
                item.project_title = proj.title;
                item.maker_name = proj.maker_name;
                item.maker_email = proj.maker_email;
            }
        } catch {}
    }

    const airtableToken = (process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY || '').trim();
    const airtableBaseId = (process.env.AIRTABLE_BASE_ID || '').trim();
    const airtableTable = (process.env.AIRTABLE_TABLE_ID || process.env.AIRTABLE_TABLE_NAME || 'tblCzg8gTBTwLdb8g').trim();

    if (airtableToken && airtableBaseId) {
        const result = await pushToAirtableDirect(item, airtableToken, airtableBaseId, airtableTable);
        if (result.ok) {
            item.state = 'sent';
            item.error = null;
            item.record_id = result.id || item.record_id;
            item.sent_at = new Date().toISOString();
            item.target = 'airtable';
            return { ok: true, target: 'airtable', id: item.record_id };
        } else {
            item.state = 'error';
            item.error = result.error;
            item.target = 'airtable';
            return { ok: false, target: 'airtable', error: result.error };
        }
    } else {
        item.state = 'sent';
        item.error = null;
        item.record_id = item.record_id || `rec_paw_${Date.now().toString(36)}`;
        item.sent_at = new Date().toISOString();
        item.target = 'dryrun';
        return { ok: true, target: 'dryrun', id: item.record_id };
    }
}

async function reconcileProjectPaws(project, decision, approvedHours, awardedPaws, adminNote) {
    const users = await loadUsers();
    const makerIdx = users.findIndex(u => u.id === project.user_id);
    const eventConfig = await loadEventConfig();
    const previousPaws = project.paws_awarded || 0;

    let targetPaws = 0;
    if (decision === 'approved') {
        const hours = Math.max(0.5, parseFloat(approvedHours) || project.hours_logged || 1);
        const multiplier = Math.max(0.1, eventConfig.multiplier || 1.0);
        let paws = parseInt(awardedPaws, 10) || Math.round(hours * multiplier);
        if (eventConfig.max_paws_cap && paws > eventConfig.max_paws_cap) {
            paws = eventConfig.max_paws_cap;
        }
        targetPaws = paws;
        project.hours_approved = hours;
        project.approved_hours = hours;
    } else {
        project.hours_approved = 0;
        project.approved_hours = 0;
    }

    const delta = targetPaws - previousPaws;
    project.paws_awarded = targetPaws;
    project.awarded_paws = targetPaws;
    project.status = decision;
    project.note_to_maker = (adminNote || '').trim();
    project.feedback = (adminNote || '').trim();
    project.decided_at = new Date().toISOString();

    if (makerIdx !== -1 && delta !== 0) {
        users[makerIdx].pawprints = Math.max(0, (users[makerIdx].pawprints || 0) + delta);
        await saveUsers(users);
        const reason = delta > 0 ? (previousPaws === 0 ? 'project_approval' : 'project_adjustment') : 'project_revoked';
        const note = delta > 0
            ? `Approved project "${project.title}" (${project.hours_approved}h) +${delta} paws`
            : `Adjusted project "${project.title}" ${delta} paws`;
        await recordLedger(users[makerIdx].id, delta, reason, note, { projectId: project.id });
    }

    return { delta, project, makerUser: makerIdx !== -1 ? users[makerIdx] : null };
}

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
        const redirectUri = getHcaRedirectUri(req);
        const tokenRes = await fetch('https://auth.hackclub.com/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: process.env.HCA_CLIENT_ID,
                client_secret: process.env.HCA_CLIENT_SECRET,
                redirect_uri: redirectUri,
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

        let apiMeData = null;
        try {
            const apiMeRes = await fetch('https://auth.hackclub.com/api/v1/me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            if (apiMeRes.ok) apiMeData = await apiMeRes.json();
        } catch (e) {
            console.error('Failed fetching /api/v1/me:', e);
        }

        let userinfoData = null;
        try {
            const userinfoRes = await fetch('https://auth.hackclub.com/oauth/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            if (userinfoRes.ok) userinfoData = await userinfoRes.json();
        } catch (e) {
            console.error('Failed fetching /oauth/userinfo:', e);
        }

        const identity = apiMeData?.identity || {};
        const userinfo = userinfoData || {};

        const hcaId = String(identity.id || userinfo.sub || apiMeData?.id || '');
        const email = (identity.primary_email || identity.email || userinfo.email || '').toLowerCase().trim();
        const firstName = (identity.first_name || userinfo.given_name || '').trim();
        const lastName = (identity.last_name || userinfo.family_name || '').trim();
        const fullName = userinfo.name || identity.name || [firstName, lastName].filter(Boolean).join(' ') || identity.nickname || userinfo.nickname || 'Maker';
        const slackId = (identity.slack_id || userinfo.slack_id || '').trim();
        let verificationStatus = identity.verification_status || userinfo.verification_status || (userinfo.email_verified ? 'verified' : 'unverified');
        let yswsEligible = Boolean(identity.ysws_eligible || userinfo.ysws_eligible || verificationStatus === 'verified_eligible');
        const birthday = identity.birthday || userinfo.birthdate || null;
        const phoneNumber = identity.phone_number || '';

        if (!yswsEligible && (email || slackId || hcaId)) {
            const extCheck = await checkHcaVerification({ idv_id: hcaId, email, slack_id: slackId });
            if (extCheck) {
                verificationStatus = extCheck;
                if (extCheck === 'verified_eligible') yswsEligible = true;
            }
        }

        const { addressObj, shippingAddress } = parseHcaAddress(identity, userinfo, firstName, lastName, fullName);

        let slackHandle = '';
        let slackAvatar = '';
        if (slackId) {
            const slackProfile = await fetchSlackProfile(slackId);
            if (slackProfile) {
                slackHandle = slackProfile.handle || '';
                slackAvatar = slackProfile.avatar || '';
            }
        }
        if (!slackHandle) {
            slackHandle = identity.nickname || userinfo.nickname || (slackId ? `@${slackId}` : '');
        }

        const avatar = slackAvatar || userinfo.picture || userinfo.avatar_url || 'images/rex_main_front.png';

        const users = await loadUsers();
        let user = users.find(u => (hcaId && u.hca_id === hcaId) || (email && u.email.toLowerCase() === email) || (slackId && u.slack_id === slackId));
        const now = new Date().toISOString();

        if (user) {
            user.hca_id = hcaId || user.hca_id;
            user.name = fullName || user.name;
            user.first_name = firstName || user.first_name || '';
            user.last_name = lastName || user.last_name || '';
            user.email = email || user.email;
            user.slack_id = slackId || user.slack_id || '';
            user.slack_handle = slackHandle || user.slack_handle || '';
            if (!user.nickname || user.nickname === 'Maker') {
                user.nickname = slackHandle || user.nickname || '';
            }
            if (slackAvatar) {
                user.slack_avatar_url = slackAvatar;
                user.avatar_url = slackAvatar;
            } else if (avatar && avatar !== 'images/rex_main_front.png' && (!user.avatar_url || user.avatar_url === 'images/rex_main_front.png')) {
                user.avatar_url = avatar;
            }
            user.verification_status = verificationStatus || user.verification_status;
            user.ysws_eligible = yswsEligible;
            user.birthday = birthday || user.birthday;
            user.phone_number = phoneNumber || user.phone_number;
            if (shippingAddress) {
                user.shipping_address = shippingAddress;
                user.address = addressObj;
            }
            user.hca_access_token = access_token;
            if (tokenData.refresh_token) {
                user.hca_refresh_token = tokenData.refresh_token;
            }
            user.last_login_at = now;
            if (isAdminUser(user) && user.role !== 'Admin') {
                user.role = 'Admin';
            }
        } else {
            const role = isAdminUser({ email, slack_id: slackId }) ? 'Admin' : 'Maker';
            user = {
                id: crypto.randomUUID(),
                hca_id: hcaId,
                name: fullName,
                first_name: firstName,
                last_name: lastName,
                nickname: slackHandle || '',
                email: email,
                slack_id: slackId,
                slack_handle: slackHandle,
                avatar_url: avatar,
                slack_avatar_url: slackAvatar || '',
                role: role,
                pawprints: 0,
                hackatime_key: '',
                hackatime_hours: 0,
                verification_status: verificationStatus,
                ysws_eligible: yswsEligible,
                birthday: birthday,
                phone_number: phoneNumber,
                shipping_address: shippingAddress,
                address: addressObj,
                hca_access_token: access_token,
                hca_refresh_token: tokenData.refresh_token || '',
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

        const returnTo = req.cookies.hca_return_to || '/dashboard';
        res.clearCookie('hca_return_to', { path: '/' });
        res.redirect(returnTo);
    } catch (err) {
        console.error('Auth callback error:', err);
        res.redirect('/?error=server_error');
    }
});

app.get('/dashboard', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        if (process.env.NODE_ENV !== 'production' && req.query.dev === '1') {
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
        } else {
            return res.redirect('/login');
        }
    }
    res.sendFile(path.resolve('dashboard.html'));
});

app.get('/api/me', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    const projects = await loadProjects();
    const userProjects = projects.filter(p => p.user_id === user.id);

    let maxProjectSeconds = 0;
    const htList = user.hackatime_projects_cache || [];
    for (const proj of userProjects) {
        const stats = calculateProjectHackatimeStats(proj, htList);
        if (stats.seconds > maxProjectSeconds) {
            maxProjectSeconds = stats.seconds;
        }
    }

    const userWithStats = {
        ...user,
        project_count: userProjects.length,
        shipped: userProjects.filter(p => p.status === 'submitted' || p.status === 'approved').length,
        max_project_seconds: maxProjectSeconds,
        has_min_tracked_time: maxProjectSeconds >= 300
    };
    res.json({ user: userWithStats });
});

app.post('/api/user/sync-hca-address', async (req, res) => {
    let user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    if (!user.hca_access_token && user.hca_refresh_token) {
        await refreshHcaAccessToken(user);
    }

    if (user.hca_access_token) {
        try {
            let apiMeRes = await fetch('https://auth.hackclub.com/api/v1/me', {
                headers: { Authorization: `Bearer ${user.hca_access_token}` }
            });

            if (apiMeRes.status === 401 && user.hca_refresh_token) {
                const newToken = await refreshHcaAccessToken(user);
                if (newToken) {
                    apiMeRes = await fetch('https://auth.hackclub.com/api/v1/me', {
                        headers: { Authorization: `Bearer ${newToken}` }
                    });
                }
            }

            let apiMeData = null;
            if (apiMeRes.ok) apiMeData = await apiMeRes.json();

            let userinfoData = null;
            try {
                const uRes = await fetch('https://auth.hackclub.com/oauth/userinfo', {
                    headers: { Authorization: `Bearer ${user.hca_access_token}` }
                });
                if (uRes.ok) userinfoData = await uRes.json();
            } catch {}

            const identity = apiMeData?.identity || {};
            const userinfo = userinfoData || {};
            const { addressObj, shippingAddress } = parseHcaAddress(
                identity,
                userinfo,
                user.first_name || '',
                user.last_name || '',
                user.name || ''
            );

            if (addressObj && (addressObj.line1 || addressObj.city || addressObj.country)) {
                const users = await loadUsers();
                const idx = users.findIndex(u => u.id === user.id);
                if (idx !== -1) {
                    users[idx].address = addressObj;
                    users[idx].shipping_address = shippingAddress;
                    await saveUsers(users);
                    return res.json({ ok: true, address: addressObj, shipping_address: shippingAddress, user: users[idx] });
                }
            }
        } catch (e) {
            console.error('Failed refreshing HCA address:', e);
        }
    }

    return res.json({
        ok: false,
        needs_reauth: true,
        auth_url: '/login?return_to=' + encodeURIComponent('/dashboard.html#settings')
    });
});

app.post('/api/settings', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const { nickname, hackatime_key, shipping_address } = req.body;
    const users = await loadUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx === -1) {
        return res.status(404).json({ error: 'user_not_found' });
    }

    if (typeof nickname === 'string') {
        users[idx].nickname = nickname.trim().slice(0, 40);
    }
    if (req.body.address && typeof req.body.address === 'object') {
        const a = req.body.address;
        const addressObj = {
            name: typeof a.name === 'string' ? a.name.trim().slice(0, 80) : '',
            line1: typeof a.line1 === 'string' ? a.line1.trim().slice(0, 120) : '',
            line2: typeof a.line2 === 'string' ? a.line2.trim().slice(0, 120) : '',
            city: typeof a.city === 'string' ? a.city.trim().slice(0, 80) : '',
            state: typeof a.state === 'string' ? a.state.trim().slice(0, 80) : '',
            postal_code: typeof a.postal_code === 'string' ? a.postal_code.trim().slice(0, 30) : (typeof a.postcode === 'string' ? a.postcode.trim().slice(0, 30) : ''),
            country: typeof a.country === 'string' ? a.country.trim().slice(0, 80) : ''
        };
        users[idx].address = addressObj;
        const formatted = [
            addressObj.name,
            addressObj.line1,
            addressObj.line2,
            addressObj.city,
            addressObj.state,
            addressObj.postal_code,
            addressObj.country
        ].filter(Boolean).join(', ');
        users[idx].shipping_address = formatted;
    } else if (typeof shipping_address === 'string') {
        users[idx].shipping_address = shipping_address.trim().slice(0, 300);
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

app.get('/api/hackatime/projects', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    if (!user.hackatime_access_token) {
        return res.json({ connected: false, projects: [] });
    }

    try {
        const projects = await fetchUserHackatimeProjects(user.hackatime_access_token);
        const users = await loadUsers();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users[idx].hackatime_projects_cache = projects;
            const totalSecs = projects.reduce((sum, p) => sum + (p.total_seconds || 0), 0);
            const totalH = Number((totalSecs / 3600).toFixed(1));
            if (totalH > (users[idx].hackatime_hours || 0)) {
                users[idx].hackatime_hours = totalH;
            }
            await saveUsers(users);
        }

        res.json({ connected: true, projects });
    } catch (err) {
        console.error('Error fetching Hackatime projects:', err);
        res.json({ connected: true, projects: user.hackatime_projects_cache || [] });
    }
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
        let totalHours = user.hackatime_hours || 0;
        try {
            const hoursRes = await fetch('https://hackatime.hackclub.com/api/v1/authenticated/hours', {
                headers: { Authorization: `Bearer ${user.hackatime_access_token}` }
            });
            if (hoursRes.ok) {
                const hoursData = await hoursRes.json();
                totalHours = Number(((hoursData.total_seconds || 0) / 3600).toFixed(2));
            }
        } catch (e) {
            console.error('Failed fetching Hackatime hours in sync:', e);
        }

        const projectsList = await fetchUserHackatimeProjects(user.hackatime_access_token);

        const users = await loadUsers();
        const idx = users.findIndex(u => u.id === user.id);
        if (idx !== -1) {
            users[idx].hackatime_hours = Math.max(users[idx].hackatime_hours || 0, totalHours);
            users[idx].hackatime_projects_cache = projectsList;
            await saveUsers(users);

            const allProjects = await loadProjects();
            let changedProjects = false;
            for (const proj of allProjects) {
                if (proj.user_id === user.id) {
                    const stats = calculateProjectHackatimeStats(proj, projectsList);
                    proj.hours_logged = stats.hours;
                    proj.seconds_logged = stats.seconds;
                    changedProjects = true;
                }
            }
            if (changedProjects) {
                await saveProjects(allProjects);
            }

            return res.json({ ok: true, user: users[idx], projects: projectsList });
        }
        res.json({ ok: true, user, projects: projectsList });
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
        users[idx].hackatime_projects_cache = [];
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

async function handleGetUserProjects(req, res) {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    const projects = await loadProjects();
    const userProjects = projects.filter(p => p.user_id === user.id);
    const htList = user.hackatime_projects_cache || [];
    for (const proj of userProjects) {
        if (proj.seconds_logged === undefined) {
            const pTags = Array.isArray(proj.hackatime_projects) && proj.hackatime_projects.length > 0
                ? proj.hackatime_projects
                : (proj.hackatime_project ? proj.hackatime_project.split(',').map(s => s.trim()).filter(Boolean) : []);
            if (pTags.length > 0 && htList.length > 0) {
                const lowerTags = new Set(pTags.map(t => t.toLowerCase()));
                proj.seconds_logged = htList.filter(p => p && p.name && lowerTags.has(p.name.toLowerCase()))
                                           .reduce((sum, p) => sum + (p.total_seconds || 0), 0);
            } else {
                proj.seconds_logged = Math.round((proj.hours_logged || 0) * 3600);
            }
        }
    }
    res.json({ projects: userProjects });
}

app.get('/api/projects', handleGetUserProjects);
app.get('/api/my/projects', handleGetUserProjects);

app.post('/api/upload', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'missing_image' });
    }
    const url = await saveBase64Image(image, 'screenshot');
    res.json({ ok: true, url });
});

app.post('/api/projects', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const {
        title,
        description,
        repo_url,
        demo_url,
        screenshot_url,
        ai_declaration,
        is_prior_project,
        update_description
    } = req.body;

    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'title_required' });
    }

    if (Boolean(is_prior_project) && (!update_description || !update_description.trim())) {
        return res.status(400).json({ error: 'update_description_required', message: 'Update description is required for prior projects.' });
    }

    let htProjects = [];
    if (Array.isArray(req.body.hackatime_projects)) {
        htProjects = req.body.hackatime_projects.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof req.body.hackatime_project === 'string' && req.body.hackatime_project.trim()) {
        htProjects = req.body.hackatime_project.split(',').map(s => s.trim()).filter(Boolean);
    } else if (typeof req.body.hackatime_project_name === 'string' && req.body.hackatime_project_name.trim()) {
        htProjects = req.body.hackatime_project_name.split(',').map(s => s.trim()).filter(Boolean);
    }
    htProjects = Array.from(new Set(htProjects));

    let calculatedHours = 0;
    let totalSecs = 0;
    if (user.hackatime_access_token) {
        let htList = user.hackatime_projects_cache || [];
        try {
            const freshList = await fetchUserHackatimeProjects(user.hackatime_access_token);
            if (freshList && freshList.length > 0) {
                htList = freshList;
                const users = await loadUsers();
                const uIdx = users.findIndex(u => u.id === user.id);
                if (uIdx !== -1) {
                    users[uIdx].hackatime_projects_cache = freshList;
                    await saveUsers(users);
                }
            }
        } catch {}

        const lowerSet = new Set(htProjects.map(p => p.toLowerCase()));
        for (const p of htList) {
            if (p && p.name && lowerSet.has(p.name.toLowerCase())) {
                totalSecs += (p.total_seconds || 0);
            }
        }
        calculatedHours = Number((totalSecs / 3600).toFixed(1));
    }

    let finalScreenshot = typeof screenshot_url === 'string' ? screenshot_url.trim() : '';
    if (finalScreenshot.startsWith('data:image/')) {
        finalScreenshot = await saveBase64Image(finalScreenshot, 'screenshot');
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
        screenshot_url: finalScreenshot,
        ai_declaration: typeof ai_declaration === 'string' ? ai_declaration.trim() : '',
        is_prior_project: Boolean(is_prior_project),
        update_description: typeof update_description === 'string' ? update_description.trim() : '',
        hackatime_projects: htProjects,
        hackatime_project: htProjects.join(', '),
        hackatime_project_name: htProjects.join(', '),
        seconds_logged: totalSecs,
        hours_logged: calculatedHours,
        hours_approved: 0,
        paws_awarded: 0,
        awarded_paws: 0,
        status: 'draft',
        note_to_maker: '',
        feedback: '',
        created_at: new Date().toISOString(),
        submitted_at: null,
        decided_at: null
    };

    projects.unshift(newProject);
    await saveProjects(projects);
    res.json({ ok: true, project: newProject });
});

app.put('/api/projects/:id', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const projects = await loadProjects();
    const idx = projects.findIndex(p => p.id === req.params.id && (p.user_id === user.id || user.role === 'Admin'));
    if (idx === -1) {
        return res.status(404).json({ error: 'project_not_found' });
    }

    const {
        title,
        description,
        repo_url,
        demo_url,
        screenshot_url,
        ai_declaration,
        is_prior_project,
        update_description
    } = req.body;

    if (title !== undefined) projects[idx].title = title.trim();
    if (description !== undefined) projects[idx].description = description.trim();
    if (repo_url !== undefined) projects[idx].repo_url = repo_url.trim();
    if (demo_url !== undefined) projects[idx].demo_url = demo_url.trim();
    if (screenshot_url !== undefined) {
        let sc = String(screenshot_url).trim();
        if (sc.startsWith('data:image/')) {
            sc = await saveBase64Image(sc, 'screenshot');
        }
        projects[idx].screenshot_url = sc;
    }
    if (ai_declaration !== undefined) projects[idx].ai_declaration = String(ai_declaration).trim();
    if (is_prior_project !== undefined) projects[idx].is_prior_project = Boolean(is_prior_project);
    if (update_description !== undefined) projects[idx].update_description = String(update_description).trim();

    if (projects[idx].is_prior_project && (!projects[idx].update_description || !projects[idx].update_description.trim())) {
        return res.status(400).json({ error: 'update_description_required', message: 'Update description is required for prior projects.' });
    }

    let htProjects = null;
    if (Array.isArray(req.body.hackatime_projects)) {
        htProjects = req.body.hackatime_projects.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof req.body.hackatime_project === 'string') {
        htProjects = req.body.hackatime_project.split(',').map(s => s.trim()).filter(Boolean);
    } else if (typeof req.body.hackatime_project_name === 'string') {
        htProjects = req.body.hackatime_project_name.split(',').map(s => s.trim()).filter(Boolean);
    }

    if (htProjects !== null) {
        htProjects = Array.from(new Set(htProjects));
        projects[idx].hackatime_projects = htProjects;
        projects[idx].hackatime_project = htProjects.join(', ');
        projects[idx].hackatime_project_name = htProjects.join(', ');

        let calculatedHours = 0;
        let totalSecs = 0;
        const projectOwnerId = projects[idx].user_id;
        const users = await loadUsers();
        const owner = users.find(u => u.id === projectOwnerId) || user;

        if (owner && owner.hackatime_access_token) {
            let htList = owner.hackatime_projects_cache || [];
            try {
                const freshList = await fetchUserHackatimeProjects(owner.hackatime_access_token);
                if (freshList && freshList.length > 0) {
                    htList = freshList;
                }
            } catch {}

            const lowerSet = new Set(htProjects.map(p => p.toLowerCase()));
            for (const p of htList) {
                if (p && p.name && lowerSet.has(p.name.toLowerCase())) {
                    totalSecs += (p.total_seconds || 0);
                }
            }
            calculatedHours = Number((totalSecs / 3600).toFixed(1));
        }
        projects[idx].seconds_logged = totalSecs;
        projects[idx].hours_logged = calculatedHours;
    } else if (req.body.hours_logged !== undefined && user.role === 'Admin') {
        projects[idx].hours_logged = Math.max(0, parseFloat(req.body.hours_logged) || 0);
        projects[idx].seconds_logged = Math.round(projects[idx].hours_logged * 3600);
    }

    await saveProjects(projects);
    res.json({ ok: true, project: projects[idx] });
});

app.delete('/api/projects/:id', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
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
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
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

    const p = projects[idx];
    if (p.status === 'approved') {
        return res.status(400).json({ error: 'already_approved', message: 'This project has already been approved.' });
    }
    if (p.status === 'submitted') {
        return res.status(400).json({ error: 'already_submitted', message: 'This project is already under review.' });
    }
    if (p.status === 'changes_requested' && config.resubmissions_open === false) {
        return res.status(400).json({ error: 'resubmissions_closed', message: 'Resubmissions are currently closed.' });
    }

    if (!p.title || !p.title.trim()) {
        return res.status(400).json({ error: 'missing_title', message: 'Project title is required before shipping.' });
    }
    if (!p.description || !p.description.trim()) {
        return res.status(400).json({ error: 'missing_description', message: 'Project description is required before shipping.' });
    }
    if (!p.screenshot_url || !p.screenshot_url.trim()) {
        return res.status(400).json({ error: 'missing_screenshot', message: 'Project screenshot is required before shipping.' });
    }
    if (!p.repo_url || !p.repo_url.trim()) {
        return res.status(400).json({ error: 'missing_repo', message: 'GitHub repository URL is required before shipping.' });
    }
    if (!p.demo_url || !p.demo_url.trim()) {
        return res.status(400).json({ error: 'missing_demo', message: 'Live demo / video URL is required before shipping.' });
    }
    if (p.is_prior_project && (!p.update_description || !p.update_description.trim())) {
        return res.status(400).json({ error: 'missing_update_desc', message: 'Update description is required for prior projects.' });
    }

    if (user.hackatime_access_token) {
        try {
            const freshList = await fetchUserHackatimeProjects(user.hackatime_access_token);
            if (freshList && freshList.length > 0) {
                const users = await loadUsers();
                const uIdx = users.findIndex(u => u.id === user.id);
                if (uIdx !== -1) {
                    users[uIdx].hackatime_projects_cache = freshList;
                    await saveUsers(users);
                }
                const stats = calculateProjectHackatimeStats(p, freshList);
                p.seconds_logged = stats.seconds;
                p.hours_logged = stats.hours;
            }
        } catch {}
    }

    const totalSeconds = p.seconds_logged !== undefined ? p.seconds_logged : Math.round((p.hours_logged || 0) * 3600);
    if (totalSeconds < 1800) {
        return res.status(400).json({
            error: 'insufficient_hackatime',
            message: 'You must attach at least 30 minutes (0.5h) of tracked Hackatime time to ship this project.'
        });
    }

    p.status = 'submitted';
    p.submitted_at = new Date().toISOString();
    await saveProjects(projects);
    res.json({ ok: true, project: p });
});

app.get('/api/explore/projects', async (req, res) => {
    const projects = await loadProjects();
    const approved = projects
        .filter(p => p.status === 'approved')
        .map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            repo_url: p.repo_url,
            demo_url: p.demo_url,
            screenshot_url: p.screenshot_url,
            maker_name: p.maker_name,
            maker_avatar: p.maker_avatar,
            hours_approved: p.hours_approved || p.hours_logged || 0,
            paws_awarded: p.paws_awarded || 0,
            hackatime_projects: p.hackatime_projects || [],
            created_at: p.created_at,
            decided_at: p.decided_at
        }));
    res.json({ projects: approved });
});

app.get('/api/admin/submissions', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
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
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const { decision, approvedHours, noteToMaker } = req.body;
    if (!['approved', 'changes_requested', 'rejected'].includes(decision)) {
        return res.status(400).json({ error: 'invalid_decision' });
    }

    const note = (noteToMaker || req.body.feedback || '').trim();
    if (decision !== 'approved' && !note) {
        return res.status(400).json({ error: 'note_required', message: 'Please provide feedback for the maker explaining what is needed or why it was not approved.' });
    }

    const projects = await loadProjects();
    const idx = projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) {
        return res.status(404).json({ error: 'project_not_found' });
    }

    const { project, makerUser } = await reconcileProjectPaws(
        projects[idx],
        decision,
        approvedHours || req.body.approved_hours,
        req.body.awarded_paws,
        note
    );

    if (decision === 'approved') {
        const outbox = await loadUnifiedOutbox();
        let targetOutbox = outbox.find(o => o.project_id === project.id);
        const unifiedPayload = buildUnifiedPayload(project, makerUser, project.hours_approved);

        if (targetOutbox) {
            targetOutbox.state = 'queued';
            targetOutbox.hours = project.hours_approved;
            targetOutbox.payload = unifiedPayload;
            targetOutbox.last_attempt_at = new Date().toISOString();
        } else {
            targetOutbox = {
                id: `uni_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
                project_id: project.id,
                project_title: project.title,
                maker_name: project.maker_name,
                maker_email: project.maker_email,
                hours: project.hours_approved,
                state: 'queued',
                record_id: `rec_paw_${project.id.slice(-6)}`,
                error: null,
                attempts: 0,
                last_attempt_at: null,
                payload: unifiedPayload
            };
            outbox.unshift(targetOutbox);
        }
        await saveUnifiedOutbox(outbox);

        pushUnifiedRecord(targetOutbox).then(() => {
            saveUnifiedOutbox(outbox).catch(() => {});
        }).catch(() => {});
    }

    await saveProjects(projects);

    if (makerUser?.slack_id) {
        notifyProjectDecision(project, makerUser, decision, project.hours_approved, project.paws_awarded, note).catch(() => {});
    }

    res.json({ ok: true, project });
});

app.get('/api/event/config', async (req, res) => {
    const config = await loadEventConfig();
    res.json({
        config: {
            ...config,
            announcement_banner: config.announcement || config.announcement_banner || ''
        }
    });
});

app.post('/api/admin/event/config', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
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
        announcement_banner: req.body.announcement !== undefined ? req.body.announcement.trim() : current.announcement,
        updated_at: new Date().toISOString()
    };

    await saveEventConfig(updated);
    res.json({ ok: true, config: updated });
});

app.get('/api/admin/unified/status', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const projects = await loadProjects();
    const outbox = await loadUnifiedOutbox();
    const users = await loadUsers();
    const approvedProjects = projects.filter(p => p.status === 'approved');

    let outboxUpdated = false;
    for (const proj of approvedProjects) {
        if (!outbox.find(o => o.project_id === proj.id)) {
            const hours = Number(proj.hours_approved || proj.hours_logged || 1);
            const maker = users.find(u => u.id === proj.user_id);
            const payload = buildUnifiedPayload(proj, maker, hours);
            outbox.unshift({
                id: `uni_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
                project_id: proj.id,
                project_title: proj.title,
                maker_name: proj.maker_name || 'Maker',
                maker_email: proj.maker_email || '',
                hours: hours,
                state: 'queued',
                record_id: `rec_paw_${proj.id.slice(-6)}`,
                error: null,
                attempts: 0,
                last_attempt_at: null,
                payload: payload
            });
            outboxUpdated = true;
        }
    }
    if (outboxUpdated) {
        await saveUnifiedOutbox(outbox);
    }

    const airtableToken = (process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY || '').trim();
    const airtableBaseId = (process.env.AIRTABLE_BASE_ID || '').trim();
    const isConfigured = Boolean(airtableToken && airtableBaseId);
    const tableId = process.env.AIRTABLE_TABLE_ID || process.env.AIRTABLE_TABLE_NAME || 'tblCzg8gTBTwLdb8g';

    res.json({
        airtable_configured: isConfigured,
        base_id: airtableBaseId,
        table_id: tableId,
        table_name: process.env.AIRTABLE_TABLE_NAME || 'YSWS Project Submission',
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
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const outbox = await loadUnifiedOutbox();
    const item = outbox.find(o => o.id === req.params.id || o.project_id === req.params.id);
    if (!item) {
        return res.status(404).json({ error: 'record_not_found' });
    }

    const result = await pushUnifiedRecord(item);
    await saveUnifiedOutbox(outbox);
    res.json({ ok: result.ok, item, result });
});

app.post('/api/admin/unified/push-all', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const outbox = await loadUnifiedOutbox();
    const pending = outbox.filter(o => o.state === 'queued' || o.state === 'error');

    let successCount = 0;
    let errorCount = 0;

    for (const item of pending) {
        const result = await pushUnifiedRecord(item);
        if (result.ok) successCount++;
        else errorCount++;
    }

    await saveUnifiedOutbox(outbox);
    res.json({ ok: true, pushed_count: pending.length, success_count: successCount, error_count: errorCount });
});

app.get('/api/shop/items', async (req, res) => {
    const items = await loadShopItems();
    res.json({ items });
});

app.post('/api/admin/shop/items', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
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
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
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
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
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
        return res.status(401).json({ error: 'unauthorized' });
    }

    const { itemId, variant, quantity, address, notes } = req.body;
    const items = await loadShopItems();
    const item = items.find(i => i.id === itemId);
    if (!item) {
        return res.status(404).json({ error: 'item_not_found' });
    }

    if (item.in_stock === false) {
        return res.status(400).json({ error: 'item_out_of_stock', message: 'This reward is currently out of stock.' });
    }

    const shippingAddress = (address || user.shipping_address || '').trim();
    if (!shippingAddress) {
        return res.status(400).json({ error: 'address_required', message: 'A shipping address is required to place an order.' });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);
    const totalCost = item.price * qty;

    const users = await loadUsers();
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'user_not_found' });
    }

    const currentBalance = users[userIndex].pawprints || 0;
    if (currentBalance < totalCost) {
        return res.status(400).json({
            error: 'insufficient_paws',
            required: totalCost,
            current: currentBalance,
            needed: totalCost - currentBalance
        });
    }

    users[userIndex].pawprints = currentBalance - totalCost;
    users[userIndex].shipping_address = shippingAddress;
    await saveUsers(users);
    user = users[userIndex];

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
        address: shippingAddress,
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

app.get('/api/orders', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const orders = await loadOrders();
    const myOrders = orders.filter(o => o.user_id === user.id);
    res.json({ orders: myOrders });
});

app.post('/api/orders/:id/cancel', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }

    const orders = await loadOrders();
    const order = orders.find(o => o.id === req.params.id && o.user_id === user.id);
    if (!order) {
        return res.status(404).json({ error: 'order_not_found' });
    }

    if (order.status !== 'pending') {
        return res.status(400).json({ error: 'cannot_cancel', message: 'Only pending orders can be cancelled.' });
    }

    order.status = 'cancelled';
    order.cancelled_at = new Date().toISOString();
    order.cancelled_by = 'maker';

    const users = await loadUsers();
    const uIdx = users.findIndex(u => u.id === user.id);
    if (uIdx !== -1) {
        users[uIdx].pawprints = (users[uIdx].pawprints || 0) + (order.total_paws || 0);
        await saveUsers(users);
        await recordLedger(users[uIdx].id, order.total_paws, 'order_cancelled_maker', `Cancelled order #${order.id.slice(-8)} for ${order.quantity}x ${order.item_name} (refunded)`, { orderId: order.id });
    }

    await saveOrders(orders);
    res.json({ ok: true, order, newBalance: uIdx !== -1 ? users[uIdx].pawprints : user.pawprints });
});

app.get('/api/admin/orders', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const orders = await loadOrders();
    res.json({ orders });
});

app.post('/api/admin/orders/:id/status', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
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

    const oldStatus = order.status;
    if (status) order.status = status;
    if (tracking_number !== undefined) order.tracking_number = tracking_number;
    order.updated_at = new Date().toISOString();

    if (status === 'cancelled' && oldStatus !== 'cancelled') {
        order.cancelled_at = new Date().toISOString();
        order.cancelled_by = 'admin';

        const users = await loadUsers();
        const uIdx = users.findIndex(u => u.id === order.user_id);
        if (uIdx !== -1) {
            users[uIdx].pawprints = (users[uIdx].pawprints || 0) + (order.total_paws || 0);
            users[uIdx].notifications = users[uIdx].notifications || [];
            users[uIdx].notifications.unshift({
                id: `notif_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
                type: 'order_cancelled',
                title: 'Order Cancelled',
                message: `Your order #${order.id.slice(-8)} for ${order.quantity}x ${order.item_name} was cancelled by an admin. ${order.total_paws} paws have been refunded to your balance.`,
                created_at: new Date().toISOString()
            });
            await saveUsers(users);
            await recordLedger(users[uIdx].id, order.total_paws, 'order_cancelled_admin', `Admin cancelled order #${order.id.slice(-8)} for ${order.quantity}x ${order.item_name} (refunded)`, { orderId: order.id });
        }
    } else if (status === 'shipped' && oldStatus !== 'shipped') {
        const users = await loadUsers();
        const maker = users.find(u => u.id === order.user_id);
        if (maker?.slack_id) {
            const trackText = order.tracking_number ? `\nTracking number: \`${order.tracking_number}\`` : '';
            sendSlackDm(maker.slack_id, `📦 *Your Pawgrammed order has shipped!*\nHey ${maker.name || 'there'} — your order for *${order.quantity}x ${order.item_name}* has been shipped!${trackText}`).catch(() => {});
        }
    }

    await saveOrders(orders);
    res.json({ ok: true, order });
});

app.get('/api/admin/orders/export', async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
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
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
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
    const user = await getSessionUser(req);
    if (!user) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
    }

    const userId = req.body.userId || req.body.user_id;
    const amount = parseInt(req.body.delta !== undefined ? req.body.delta : req.body.amount, 10);
    const note = (req.body.note || req.body.reason || '').trim();
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
        return res.status(401).json({ error: 'unauthorized' });
    }
    if (user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
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
    if (!isAdminUser(user) && user.role !== 'Admin') {
        return res.status(403).json({ error: 'forbidden_admin_only' });
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

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.resolve('images', 'paw-prize.png'));
});

app.use('/uploads/screenshots', express.static(UPLOADS_DIR));
app.use(express.static(path.resolve('.')));
app.use((req, res) => {
    res.status(404).sendFile(path.resolve('404.html'));
});

if (!process.env.VERCEL) {
    app.listen(port, () => {
        console.log(`Pawgrammed server running on http://localhost:${port}`);
    });
}

export default app;
