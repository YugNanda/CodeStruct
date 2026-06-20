export const rabinKarpCPP = `#include <iostream>
#include <string>
using namespace std;

#define d 256

void search(string pattern, string text, int q) {
    int m = pattern.length();
    int n = text.length();
    int p = 0; // hash value for pattern
    int t = 0; // hash value for text
    int h = 1;

    // The value of h would be "pow(d, m-1)%q"
    for (int i = 0; i < m - 1; i++)
        h = (h * d) % q;

    // Calculate the hash value of pattern and first window of text
    for (int i = 0; i < m; i++) {
        p = (d * p + pattern[i]) % q;
        t = (d * t + text[i]) % q;
    }

    // Slide the pattern over text one by one
    for (int i = 0; i <= n - m; i++) {
        // Check the hash values of current window of text and pattern.
        // If the hash values match then only check for characters one by one
        if (p == t) {
            bool match = true;
            for (int j = 0; j < m; j++) {
                if (text[i + j] != pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                cout << "Pattern found at index " << i << endl;
            }
        }

        // Calculate hash value for next window of text: Remove leading digit,
        // add trailing digit
        if (i < n - m) {
            t = (d * (t - text[i] * h) + text[i + m]) % q;
            // We might get negative value of t, converting it to positive
            if (t < 0) {
                t = (t + q);
            }
        }
    }
}
`;

export const rabinKarpJava = `public class RabinKarp {
    public final static int d = 256;

    static void search(String pattern, String text, int q) {
        int m = pattern.length();
        int n = text.length();
        int p = 0; // hash value for pattern
        int t = 0; // hash value for text
        int h = 1;

        // The value of h would be "pow(d, m-1)%q"
        for (int i = 0; i < m - 1; i++)
            h = (h * d) % q;

        // Calculate the hash value of pattern and first window of text
        for (int i = 0; i < m; i++) {
            p = (d * p + pattern.charAt(i)) % q;
            t = (d * t + text.charAt(i)) % q;
        }

        // Slide the pattern over text one by one
        for (int i = 0; i <= n - m; i++) {
            // Check the hash values of current window of text and pattern.
            // If the hash values match then only check for characters one by one
            if (p == t) {
                boolean match = true;
                for (int j = 0; j < m; j++) {
                    if (text.charAt(i + j) != pattern.charAt(j)) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    System.out.println("Pattern found at index " + i);
                }
            }

            // Calculate hash value for next window of text: Remove leading digit,
            // add trailing digit
            if (i < n - m) {
                t = (d * (t - text.charAt(i) * h) + text.charAt(i + m)) % q;
                // We might get negative value of t, converting it to positive
                if (t < 0) {
                    t = (t + q);
                }
            }
        }
    }
}
`;

export const rabinKarpPython = `def search(pattern, text, q):
    d = 256
    m = len(pattern)
    n = len(text)
    p = 0    # hash value for pattern
    t = 0    # hash value for text
    h = 1

    # The value of h would be "pow(d, m-1)%q"
    for i in range(m-1):
        h = (h * d) % q

    # Calculate the hash value of pattern and first window of text
    for i in range(m):
        p = (d * p + ord(pattern[i])) % q
        t = (d * t + ord(text[i])) % q

    # Slide the pattern over text one by one
    for i in range(n - m + 1):
        # Check the hash values of current window of text and pattern.
        # If the hash values match then only check for characters one by one
        if p == t:
            match = True
            for j in range(m):
                if text[i + j] != pattern[j]:
                    match = False
                    break
            if match:
                print("Pattern found at index " + str(i))

        # Calculate hash value for next window of text: Remove leading digit,
        # add trailing digit
        if i < n - m:
            t = (d * (t - ord(text[i]) * h) + ord(text[i + m])) % q
            # We might get negative value of t, converting it to positive
            if t < 0:
                t = t + q
`;

export const rabinKarpJS = `function search(pattern, text, q) {
    let d = 256;
    let m = pattern.length;
    let n = text.length;
    let p = 0; // hash value for pattern
    let t = 0; // hash value for text
    let h = 1;

    // The value of h would be "pow(d, m-1)%q"
    for (let i = 0; i < m - 1; i++) {
        h = (h * d) % q;
    }

    // Calculate the hash value of pattern and first window of text
    for (let i = 0; i < m; i++) {
        p = (d * p + pattern.charCodeAt(i)) % q;
        t = (d * t + text.charCodeAt(i)) % q;
    }

    // Slide the pattern over text one by one
    for (let i = 0; i <= n - m; i++) {
        // Check the hash values of current window of text and pattern.
        // If the hash values match then only check for characters one by one
        if (p === t) {
            let match = true;
            for (let j = 0; j < m; j++) {
                if (text[i + j] !== pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                console.log("Pattern found at index " + i);
            }
        }

        // Calculate hash value for next window of text: Remove leading digit,
        // add trailing digit
        if (i < n - m) {
            t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
            // We might get negative value of t, converting it to positive
            if (t < 0) {
                t = (t + q);
            }
        }
    }
}
`;

export const generateRabinKarpSteps = (text, pattern) => {
    const steps = [];
    const q = 101; // A prime number
    const d = 256;
    const n = text.length;
    const m = pattern.length;

    // Safety check
    if (m === 0 || n === 0 || m > n) {
        steps.push({
            phase: 'Complete',
            textIndex: -1,
            patternHash: 0,
            textHash: 0,
            matchFound: false,
            description: "Invalid input lengths. Cannot search.",
            windowChars: "",
            patternChars: pattern,
            compareIndex: -1
        });
        return steps;
    }

    let p = 0;
    let t = 0;
    let h = 1;

    // Calculate h = pow(d, m-1) % q
    for (let i = 0; i < m - 1; i++) {
        h = (h * d) % q;
    }

    // Initial step: Calculate initial hashes
    steps.push({
        phase: 'Initialization',
        textIndex: 0,
        patternHash: p,
        textHash: t,
        matchFound: false,
        description: `Calculating initial hash for Pattern and Text window of length ${m}...`,
        windowChars: text.substring(0, m),
        patternChars: pattern,
        compareIndex: -1
    });

    for (let i = 0; i < m; i++) {
        p = (d * p + pattern.charCodeAt(i)) % q;
        t = (d * t + text.charCodeAt(i)) % q;
    }

    steps.push({
        phase: 'Initialization',
        textIndex: 0,
        patternHash: p,
        textHash: t,
        matchFound: false,
        description: `Initial Hashes calculated | Pattern Hash: ${p} | Window Hash: ${t}`,
        windowChars: text.substring(0, m),
        patternChars: pattern,
        compareIndex: -1
    });

    // Slide window over text
    for (let i = 0; i <= n - m; i++) {
        const currentWindow = text.substring(i, i + m);

        steps.push({
            phase: 'Hash Comparison',
            textIndex: i,
            patternHash: p,
            textHash: t,
            matchFound: false,
            description: `Window '${currentWindow}' at index ${i} | Hash: ${t} | Target: ${p}`,
            windowChars: currentWindow,
            patternChars: pattern,
            compareIndex: -1
        });

        if (p === t) {
            steps.push({
                phase: 'Character Verification',
                textIndex: i,
                patternHash: p,
                textHash: t,
                matchFound: false,
                description: "Hashes match! Comparing characters one by one...",
                windowChars: currentWindow,
                patternChars: pattern,
                compareIndex: 0
            });

            let match = true;
            for (let j = 0; j < m; j++) {
                steps.push({
                    phase: 'Character Verification',
                    textIndex: i,
                    patternHash: p,
                    textHash: t,
                    matchFound: false,
                    description: `Comparing Target '${pattern[j]}' with Text '${text[i + j]}'`,
                    windowChars: currentWindow,
                    patternChars: pattern,
                    compareIndex: j
                });

                if (text[i + j] !== pattern[j]) {
                    match = false;
                    steps.push({
                        phase: 'Character Verification',
                        textIndex: i,
                        patternHash: p,
                        textHash: t,
                        matchFound: false,
                        description: "Characters mismatch. Moving to next window.",
                        windowChars: currentWindow,
                        patternChars: pattern,
                        compareIndex: j
                    });
                    break;
                }
            }

            if (match) {
                steps.push({
                    phase: 'Match Found',
                    textIndex: i,
                    patternHash: p,
                    textHash: t,
                    matchFound: true,
                    description: `Pattern exactly matched at index ${i}!`,
                    windowChars: currentWindow,
                    patternChars: pattern,
                    compareIndex: m // Indicates full match
                });
            }
        } else {
            steps.push({
                phase: 'Hash Comparison',
                textIndex: i,
                patternHash: p,
                textHash: t,
                matchFound: false,
                description: "Hashes do not match. Skipping full string comparison.",
                windowChars: currentWindow,
                patternChars: pattern,
                compareIndex: -1
            });
        }

        // Calculate hash for next window
        if (i < n - m) {
            steps.push({
                phase: 'Rolling Hash',
                textIndex: i,
                patternHash: p,
                textHash: t,
                matchFound: false,
                description: `Rolling Hash: Removing '${text[i]}' and adding '${text[i + m]}'`,
                windowChars: currentWindow, // Still showing current window while doing math
                patternChars: pattern,
                compareIndex: -1
            });

            t = (d * (t - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % q;
            if (t < 0) {
                t = t + q;
            }
        }
    }

    steps.push({
        phase: 'Complete',
        textIndex: n,
        patternHash: p,
        textHash: -1,
        matchFound: false,
        description: "Reached end of text. Algorithm complete.",
        windowChars: "",
        patternChars: pattern,
        compareIndex: -1
    });

    return steps;
};
