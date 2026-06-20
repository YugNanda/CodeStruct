export const huffmanCPP = `#include <iostream>
#include <string>
#include <queue>
#include <unordered_map>
using namespace std;

// A Huffman tree node
struct Node {
    char ch;
    int freq;
    Node *left, *right;
    
    Node(char ch, int freq, Node* left = nullptr, Node* right = nullptr) {
        this->ch = ch;
        this->freq = freq;
        this->left = left;
        this->right = right;
    }
};

// Comparison object to be used to order the heap
struct comp {
    bool operator()(Node* l, Node* r) {
        return l->freq > r->freq;
    }
};

void encode(Node* root, string str, unordered_map<char, string> &huffmanCode) {
    if (root == nullptr) return;
    if (!root->left && !root->right) huffmanCode[root->ch] = str;

    encode(root->left, str + "0", huffmanCode);
    encode(root->right, str + "1", huffmanCode);
}

void buildHuffmanTree(string text) {
    unordered_map<char, int> freq;
    for (char ch: text) freq[ch]++;

    priority_queue<Node*, vector<Node*>, comp> pq;
    for (auto pair: freq) pq.push(new Node(pair.first, pair.second));

    while (pq.size() > 1) {
        Node *left = pq.top(); pq.pop();
        Node *right = pq.top(); pq.pop();
        int sum = left->freq + right->freq;
        pq.push(new Node('\\0', sum, left, right));
    }

    Node* root = pq.top();
    unordered_map<char, string> huffmanCode;
    encode(root, "", huffmanCode);

    for (auto pair: huffmanCode) cout << pair.first << " " << pair.second << "\\n";
}

int main() {
    string text = "BEEP BOOP";
    buildHuffmanTree(text);
    return 0;
}
`;

export const huffmanJava = `import java.util.PriorityQueue;
import java.util.HashMap;
import java.util.Map;

class Node implements Comparable<Node> {
    char ch;
    int freq;
    Node left, right;

    Node(char ch, int freq, Node left, Node right) {
        this.ch = ch;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }

    public int compareTo(Node node) {
        return this.freq - node.freq;
    }
}

public class HuffmanCoding {
    public static void encode(Node root, String str, Map<Character, String> huffmanCode) {
        if (root == null) return;
        if (root.left == null && root.right == null) huffmanCode.put(root.ch, str);

        encode(root.left, str + "0", huffmanCode);
        encode(root.right, str + "1", huffmanCode);
    }

    public static void buildHuffmanTree(String text) {
        Map<Character, Integer> freq = new HashMap<>();
        for (char c : text.toCharArray()) freq.put(c, freq.getOrDefault(c, 0) + 1);

        PriorityQueue<Node> pq = new PriorityQueue<>();
        for (Map.Entry<Character, Integer> entry : freq.entrySet()) {
            pq.add(new Node(entry.getKey(), entry.getValue(), null, null));
        }

        while (pq.size() > 1) {
            Node left = pq.poll();
            Node right = pq.poll();
            int sum = left.freq + right.freq;
            pq.add(new Node('\\0', sum, left, right));
        }

        Node root = pq.peek();
        Map<Character, String> huffmanCode = new HashMap<>();
        encode(root, "", huffmanCode);

        for (Map.Entry<Character, String> entry : huffmanCode.entrySet()) {
            System.out.println(entry.getKey() + " " + entry.getValue());
        }
    }

    public static void main(String[] args) {
        String text = "BEEP BOOP";
        buildHuffmanTree(text);
    }
}
`;

export const huffmanPython = `import heapq
from collections import defaultdict

class Node:
    def __init__(self, ch, freq, left=None, right=None):
        self.ch = ch
        self.freq = freq
        self.left = left
        self.right = right

    def __lt__(self, other):
        return self.freq < other.freq

def encode(root, string, huffman_code):
    if root is None:
        return
    if root.left is None and root.right is None:
        huffman_code[root.ch] = string
    
    encode(root.left, string + "0", huffman_code)
    encode(root.right, string + "1", huffman_code)

def build_huffman_tree(text):
    freq = defaultdict(int)
    for ch in text:
        freq[ch] += 1
    
    pq = [Node(k, v) for k, v in freq.items()]
    heapq.heapify(pq)
    
    while len(pq) > 1:
        left = heapq.heappop(pq)
        right = heapq.heappop(pq)
        sum_freq = left.freq + right.freq
        heapq.heappush(pq, Node(None, sum_freq, left, right))
        
    root = pq[0] if pq else None
    huffman_code = {}
    encode(root, "", huffman_code)
    
    for k, v in huffman_code.items():
        print(f"{k} {v}")

if __name__ == '__main__':
    text = "BEEP BOOP"
    build_huffman_tree(text)
`;

export const huffmanJS = `class Node {
    constructor(ch, freq, left = null, right = null) {
        this.ch = ch;
        this.freq = freq;
        this.left = left;
        this.right = right;
    }
}

function encode(root, str, huffmanCode) {
    if (root === null) return;
    if (root.left === null && root.right === null) {
        huffmanCode[root.ch] = str;
    }
    encode(root.left, str + "0", huffmanCode);
    encode(root.right, str + "1", huffmanCode);
}

function buildHuffmanTree(text) {
    const freq = {};
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        freq[char] = (freq[char] || 0) + 1;
    }
    
    let pq = [];
    for (const char in freq) {
        pq.push(new Node(char, freq[char]));
    }
    
    while (pq.length > 1) {
        pq.sort((a, b) => a.freq - b.freq); // Simulating priority queue
        const left = pq.shift();
        const right = pq.shift();
        const sum = left.freq + right.freq;
        pq.push(new Node(null, sum, left, right));
    }
    
    const root = pq[0];
    const huffmanCode = {};
    encode(root, "", huffmanCode);
    
    for (const char in huffmanCode) {
        console.log(char + " " + huffmanCode[char]);
    }
    return huffmanCode;
}

const text = "BEEP BOOP";
buildHuffmanTree(text);
`;

export function generateHuffmanSteps(text) {
    const steps = [];
    let state = {
        phase: 'Counting Frequencies',
        nodes: [], // all active roots in forest
        edges: [], // all established edges [{source, target, label}]
        allNodes: [], // all nodes to allow drawing by ID
        frequencies: {},
        codes: {},
        description: 'Calculating character frequencies...',
    };

    const pushStep = (desc, updates = {}) => {
        state = { ...state, description: desc, ...updates };
        // Deep copy structural parts
        steps.push({
            ...state,
            nodes: [...state.nodes],
            edges: state.edges.map(e => ({ ...e })),
            allNodes: state.allNodes.map(n => ({ ...n })),
            frequencies: { ...state.frequencies },
            codes: { ...state.codes }
        });
    };

    if (!text || text.length === 0) {
        pushStep("Empty text provided.");
        return { steps };
    }

    // 1. Count Frequencies
    pushStep("Calculating character frequencies...");
    const freq = {};
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        freq[char] = (freq[char] || 0) + 1;
    }

    let nodeIdCounter = 0;
    const initialNodes = [];
    for (const char in freq) {
        const node = { id: nodeIdCounter++, char, freq: freq[char], isLeaf: true };
        initialNodes.push(node);
        state.allNodes.push(node);
    }

    pushStep("Found " + initialNodes.length + " unique characters.", {
        phase: 'Initial Forest',
        nodes: [...initialNodes],
        frequencies: freq
    });

    // 2. Build Tree
    let forest = [...initialNodes];

    while (forest.length > 1) {
        forest.sort((a, b) => {
            if (a.freq !== b.freq) return a.freq - b.freq;
            return a.id - b.id; // Stable sort
        });

        const left = forest.shift();
        const right = forest.shift();

        pushStep("Popping two nodes with smallest frequencies: '" + (left.char || '*') + "' (" + left.freq + ") and '" + (right.char || '*') + "' (" + right.freq + ").", {
            nodes: [...forest], // They are popped from the forest
            highlightNodes: [left.id, right.id]
        });

        const sum = left.freq + right.freq;
        const newNode = {
            id: nodeIdCounter++,
            char: null,
            freq: sum,
            isLeaf: false,
            left: left.id,
            right: right.id
        };

        state.allNodes.push(newNode);
        forest.push(newNode);

        // Add edges
        state.edges.push({ source: newNode.id, target: left.id, label: '0' });
        state.edges.push({ source: newNode.id, target: right.id, label: '1' });

        pushStep("Created parent node with frequency " + sum + ".", {
            phase: 'Building Tree',
            nodes: [...forest],
            highlightNodes: [newNode.id],
            highlightEdges: [{ source: newNode.id, target: left.id }, { source: newNode.id, target: right.id }]
        });
    }

    const root = forest[0];

    // 3. Generate Codes
    pushStep("Tree built! Generating codes by traversing from root.", {
        phase: 'Generating Codes',
        highlightNodes: [],
        highlightEdges: []
    });

    const codes = {};
    const traverse = (nodeId, currentCode) => {
        const node = state.allNodes.find(n => n.id === nodeId);
        if (!node) return;

        pushStep("Traversing to node " + (node.char ? "'" + node.char + "'" : node.freq) + ", code so far: '" + currentCode + "'", {
            highlightNodes: [nodeId]
        });

        if (node.isLeaf) {
            codes[node.char] = currentCode || "0"; // Handle single char case
            pushStep("Assigned code '" + codes[node.char] + "' to '" + node.char + "'.", {
                codes: { ...codes },
                highlightNodes: [nodeId]
            });
        }

        if (node.left !== undefined) {
            traverse(node.left, currentCode + "0");
        }
        if (node.right !== undefined) {
            traverse(node.right, currentCode + "1");
        }
    };

    if (root) {
        traverse(root.id, "");
    }

    pushStep("Huffman Coding complete.", {
        phase: 'Completed',
        highlightNodes: [],
        highlightEdges: []
    });

    return { steps, rootId: root ? root.id : null };
}
