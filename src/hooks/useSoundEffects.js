import { useRef, useCallback, useEffect } from "react";

/**
 * useSoundEffects — Generates short tones via Web Audio API.
 *
 * Returns:
 *  - playTone(freq, duration, type)  — play an arbitrary tone
 *  - playCompare()   — short high tick
 *  - playSwap()      — rising two-note boop
 *  - playSorted()    — satisfying "ding"
 *  - playVisit()     — soft blip (graph node visit)
 *  - playComplete()  — cheerful ascending chord
 *  - enabled / setEnabled — mute toggle
 */
export default function useSoundEffects(initialEnabled = false) {
    const ctxRef = useRef(null);
    const enabledRef = useRef(initialEnabled);

    // Lazily create AudioContext on first use (avoids autoplay-policy issues)
    const getCtx = useCallback(() => {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ctxRef.current.state === "suspended") ctxRef.current.resume();
        return ctxRef.current;
    }, []);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (ctxRef.current) {
                ctxRef.current.close().catch(() => { });
                ctxRef.current = null;
            }
        };
    }, []);

    /* ── Core tone generator ── */
    const playTone = useCallback(
        (freq = 440, duration = 0.06, type = "sine", volume = 0.12) => {
            if (!enabledRef.current) return;
            try {
                const ctx = getCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = type;
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(volume, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration);
            } catch {
                /* silently ignore Web Audio errors */
            }
        },
        [getCtx],
    );

    /* ── Preset sounds ── */
    const playCompare = useCallback(
        () => playTone(600, 0.04, "sine", 0.08),
        [playTone],
    );

    const playSwap = useCallback(() => {
        playTone(350, 0.06, "triangle", 0.1);
        setTimeout(() => playTone(500, 0.06, "triangle", 0.1), 60);
    }, [playTone]);

    const playSorted = useCallback(
        () => playTone(880, 0.1, "sine", 0.1),
        [playTone],
    );

    const playVisit = useCallback(
        () => playTone(520, 0.05, "sine", 0.07),
        [playTone],
    );

    const playComplete = useCallback(() => {
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
        notes.forEach((n, i) => {
            setTimeout(() => playTone(n, 0.18, "sine", 0.12), i * 120);
        });
    }, [playTone]);

    const playEnqueue = useCallback(
        () => playTone(440, 0.06, "triangle", 0.09),
        [playTone],
    );

    const playDequeue = useCallback(
        () => playTone(330, 0.06, "triangle", 0.09),
        [playTone],
    );

    const playPush = useCallback(
        () => playTone(480, 0.06, "triangle", 0.09),
        [playTone],
    );

    const playPop = useCallback(
        () => playTone(360, 0.06, "sawtooth", 0.07),
        [playTone],
    );

    const setEnabled = useCallback((val) => {
        enabledRef.current = val;
    }, []);

    return {
        playTone,
        playCompare,
        playSwap,
        playSorted,
        playVisit,
        playComplete,
        playEnqueue,
        playDequeue,
        playPush,
        playPop,
        enabled: enabledRef.current,
        setEnabled,
        enabledRef,
    };
}
