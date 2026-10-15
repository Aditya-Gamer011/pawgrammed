const navLogin = document.querySelector(".nav-login");
const tailPath = document.getElementById("navTailPath");

if (navLogin && tailPath) {
    const basePts = [
        { x: 14, y: 0 },
        { x: 18, y: 18 },
        { x: 35, y: 35 },
        { x: 62, y: 45 },
        { x: 95, y: 37 },
        { x: 128, y: 29 },
        { x: 160, y: 33 },
        { x: 186, y: 40 }
    ];
    const n = basePts.length;

    const catmullRom = (pts) => {
        let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[Math.max(0, i - 1)];
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const p3 = pts[Math.min(pts.length - 1, i + 2)];
            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;
            d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
        }
        return d;
    };

    const restPath = catmullRom(basePts);
    tailPath.setAttribute("d", restPath);

    let isSwishing = false;
    let hasSwished = false;
    let startTime = 0;
    const DURATION = 1100;

    const animateSwish = (now) => {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const p = Math.min(1.0, elapsed / DURATION);

        const envelope = Math.sin(Math.PI * p);
        const pts = basePts.map((pt, i) => {
            if (i === 0) return { x: pt.x, y: pt.y };
            const s = i / (n - 1);
            const wave1 = Math.sin(2.2 * Math.PI * p - 2.6 * s);
            const wave2 = 0.25 * Math.sin(4.4 * Math.PI * p - 4.0 * s);
            const dy = (wave1 + wave2) * 20 * Math.pow(s, 1.4) * envelope;
            const dx = -Math.cos(2.2 * Math.PI * p - 2.6 * s) * 10 * Math.pow(s, 1.6) * envelope;
            return { x: pt.x + dx, y: pt.y + dy };
        });

        tailPath.setAttribute("d", catmullRom(pts));

        if (p < 1.0) {
            requestAnimationFrame(animateSwish);
        } else {
            tailPath.setAttribute("d", restPath);
            isSwishing = false;
        }
    };

    const triggerSwish = () => {
        if (isSwishing || hasSwished) return;
        hasSwished = true;
        isSwishing = true;
        startTime = 0;
        requestAnimationFrame(animateSwish);
    };

    navLogin.addEventListener("mouseenter", triggerSwish);

    navLogin.addEventListener("mouseleave", () => {
        hasSwished = false;
    });

    navLogin.addEventListener("touchstart", () => {
        triggerSwish();
        setTimeout(() => {
            hasSwished = false;
        }, DURATION + 200);
    }, { passive: true });
}
