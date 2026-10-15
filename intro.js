const introOverlay = document.getElementById("introOverlay");
const introPaw = document.getElementById("introPaw");
const introHint = document.getElementById("introHint");
const introFlash = document.getElementById("introFlash");

if (introOverlay && introPaw && introHint && introFlash) {
    let canZoom = false;
    let completed = false;
    let currentProgress = 0;
    let targetProgress = 0;
    let direction = 1;

    const startAppearance = () => {
        setTimeout(() => {
            if (completed) return;
            introPaw.classList.add("visible");
            setTimeout(() => {
                if (completed) return;
                introPaw.style.transition = "none";
                introHint.classList.add("visible");
                canZoom = true;
            }, 800);
        }, 500);
    };

    const completeIntro = () => {
        if (completed) return;
        completed = true;

        window.removeEventListener("wheel", onWheel);
        window.removeEventListener("touchstart", onTouchStart);
        window.removeEventListener("touchmove", onTouchMove);

        introFlash.style.opacity = "1";

        setTimeout(() => {
            window.scrollTo(0, 0);
            introOverlay.style.transition = "opacity 0.65s ease-out";
            introOverlay.style.opacity = "0";

            setTimeout(() => {
                document.body.classList.remove("intro-active");
                introOverlay.remove();
            }, 650);
        }, 220);
    };

    const tick = () => {
        if (completed) return;

        currentProgress += (targetProgress - currentProgress) * 0.14;
        if (currentProgress < 0.0001) currentProgress = 0;

        const scale = 1 + Math.pow(currentProgress, 2.2) * 50;
        const shiftY = currentProgress * 16.4;

        introPaw.style.transform = `translateY(-${shiftY}%) scale(${scale})`;

        if (currentProgress >= 0.9) {
            completeIntro();
            return;
        }

        requestAnimationFrame(tick);
    };

    const onWheel = (e) => {
        e.preventDefault();
        if (completed) return;

        if (!canZoom) {
            canZoom = true;
            introPaw.classList.add("visible");
            introPaw.style.transition = "none";
        }

        if (targetProgress === 0 && e.deltaY < 0) {
            direction = -1;
        }

        targetProgress += (e.deltaY * direction) * 0.0012;
        targetProgress = Math.max(0, Math.min(1.05, targetProgress));

        if (targetProgress > 0.02) {
            introHint.style.opacity = "0";
        } else {
            introHint.style.opacity = "0.6";
        }
    };

    let touchStartY = 0;
    const onTouchStart = (e) => {
        if (e.touches.length > 0) {
            touchStartY = e.touches[0].clientY;
        }
    };

    const onTouchMove = (e) => {
        if (completed || e.touches.length === 0) return;

        if (!canZoom) {
            canZoom = true;
            introPaw.classList.add("visible");
            introPaw.style.transition = "none";
        }

        const touchY = e.touches[0].clientY;
        const deltaY = touchStartY - touchY;
        touchStartY = touchY;

        targetProgress += deltaY * 0.003;
        targetProgress = Math.max(0, Math.min(1.05, targetProgress));

        if (targetProgress > 0.02) {
            introHint.style.opacity = "0";
        }
    };

    introOverlay.addEventListener("click", () => {
        if (completed) return;
        if (!canZoom) {
            canZoom = true;
            introPaw.classList.add("visible");
            introPaw.style.transition = "none";
        }
        targetProgress = 1.0;
        introHint.style.opacity = "0";
    });

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    startAppearance();
    requestAnimationFrame(tick);
}
