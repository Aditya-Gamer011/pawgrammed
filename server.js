import express from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'node:crypto';
import path from 'node:path';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const sessions = new Map();

function getSession(req) {
    const token = req.cookies.paw_session;
    if (!token) return null;
    return sessions.get(token) || null;
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
        scope: process.env.HCA_SCOPE || 'openid profile email',
        state: state
    });

    const email = req.query.email?.toString().trim();
    if (email) {
        params.set('email', email);
        params.set('login_hint', email);
    }

    res.redirect(`https://auth.hackclub.com/oauth/authorize?${params.toString()}`);
});

app.get('/auth/callback', async (req, res) => {
    const { code, state, error: authError } = req.query;
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

        let user = null;
        const apiMeRes = await fetch('https://auth.hackclub.com/api/v1/me', {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        if (apiMeRes.ok) {
            user = await apiMeRes.json();
        } else {
            const userinfoRes = await fetch('https://auth.hackclub.com/oauth/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            if (userinfoRes.ok) {
                user = await userinfoRes.json();
            } else {
                return res.redirect('/?error=failed_fetching_user');
            }
        }

        const sessionToken = crypto.randomUUID();
        sessions.set(sessionToken, {
            user,
            tokenData,
            createdAt: Date.now()
        });

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

app.get('/dashboard', (req, res) => {
    const session = getSession(req);
    if (!session) {
        return res.redirect('/login');
    }
    res.sendFile(path.resolve('dashboard.html'));
});

app.get('/api/me', (req, res) => {
    const session = getSession(req);
    if (!session) {
        return res.status(401).json({ error: 'unauthorized' });
    }
    res.json({ user: session.user });
});

app.get('/logout', (req, res) => {
    const token = req.cookies.paw_session;
    if (token) {
        sessions.delete(token);
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
