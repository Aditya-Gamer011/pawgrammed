function initPathway() {
    const svg = document.getElementById('pathwaySvg');
    const trail = document.getElementById('pathwayTrail');
    const pawsGroup = document.getElementById('pathwayPaws');
    const wrap = document.querySelector('.pathway-wrap');
    const stops = document.querySelectorAll('.pathway-stop');

    if (!svg || !trail || !pawsGroup || !wrap || stops.length === 0) return;

    function renderPath() {
        const wrapRect = wrap.getBoundingClientRect();
        const svgW = wrapRect.width;
        const svgH = wrapRect.height;
        if (svgW === 0 || svgH === 0) return;

        svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
        svg.style.width = svgW + 'px';
        svg.style.height = svgH + 'px';

        const nodeCoords = [];
        stops.forEach(stop => {
            const circle = stop.querySelector('.node-circle');
            if (!circle) return;
            const r = circle.getBoundingClientRect();
            nodeCoords.push({
                x: r.left + r.width / 2 - wrapRect.left,
                y: r.top + r.height / 2 - wrapRect.top
            });
        });

        if (nodeCoords.length < 2) return;

        const pStart = { x: svgW / 2, y: 15 };
        const lastNode = nodeCoords[nodeCoords.length - 1];
        const pEnd = { x: svgW / 2, y: lastNode.y + 55 };
        const allPoints = [pStart, ...nodeCoords, pEnd];

        let d = `M ${allPoints[0].x.toFixed(1)} ${allPoints[0].y.toFixed(1)}`;
        for (let i = 0; i < allPoints.length - 1; i++) {
            const pPrev = i > 0 ? allPoints[i - 1] : allPoints[0];
            const pCurr = allPoints[i];
            const pNext = allPoints[i + 1];
            const pFuture = (i + 2 < allPoints.length) ? allPoints[i + 2] : pNext;

            const cp1x = pCurr.x + (pNext.x - pPrev.x) / 6;
            const cp1y = pCurr.y + (pNext.y - pPrev.y) / 6;
            const cp2x = pNext.x - (pFuture.x - pCurr.x) / 6;
            const cp2y = pNext.y - (pFuture.y - pCurr.y) / 6;

            d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${pNext.x.toFixed(1)} ${pNext.y.toFixed(1)}`;
        }

        trail.setAttribute('d', d);

        const totalLen = trail.getTotalLength();
        if (!totalLen || isNaN(totalLen)) return;

        pawsGroup.innerHTML = '';
        const pawStride = 38;
        let stepCount = 0;

        for (let dist = 20; dist < totalLen - 16; dist += pawStride) {
            const pt = trail.getPointAtLength(dist);

            let overlap = false;
            for (const n of nodeCoords) {
                if (Math.hypot(pt.x - n.x, pt.y - n.y) < 30) {
                    overlap = true;
                    break;
                }
            }
            if (overlap) continue;

            const ptAhead = trail.getPointAtLength(Math.min(totalLen, dist + 4));
            const ptBehind = trail.getPointAtLength(Math.max(0, dist - 4));
            const angleRad = Math.atan2(ptAhead.y - ptBehind.y, ptAhead.x - ptBehind.x);
            const angleDeg = (angleRad * 180 / Math.PI) + 90;

            const isLeft = (stepCount % 2 === 0);
            const lateralOffset = isLeft ? -7 : 7;
            const normal = angleRad + Math.PI / 2;
            const px = pt.x + Math.cos(normal) * lateralOffset;
            const py = pt.y + Math.sin(normal) * lateralOffset;
            const tilt = isLeft ? -6 : 6;

            const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
            use.setAttribute('href', '#pawPrintDef');
            use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#pawPrintDef');
            use.setAttribute('transform', `translate(${px.toFixed(1)}, ${py.toFixed(1)}) rotate(${(angleDeg + tilt).toFixed(1)})`);
            use.setAttribute('opacity', '0.85');
            pawsGroup.appendChild(use);

            stepCount++;
        }
    }

    renderPath();

    if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => renderPath());
        ro.observe(wrap);
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(renderPath, 40);
    });

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(renderPath);
    }

    window.addEventListener('load', renderPath);
}

document.addEventListener('DOMContentLoaded', initPathway);
if (document.readyState !== 'loading') {
    initPathway();
}
