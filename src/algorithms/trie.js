export const trieCPP = `class TrieNode {
public:
    bool isEndOfWord;
    TrieNode* children[26];
    
    TrieNode() {
        isEndOfWord = false;
        for (int i = 0; i < 26; i++) {
            children[i] = nullptr;
        }
    }
};

class Trie {
private:
    TrieNode* root;
    
public:
    Trie() {
        root = new TrieNode();
    }
    
    // Inserts a word into the trie.
    // Time Complexity: O(m), where m is the key length
    // Space Complexity: O(m)
    void insert(string word) {
        TrieNode* node = root;
        for (char c : word) {
            int index = c - 'a';
            if (node->children[index] == nullptr) {
                node->children[index] = new TrieNode();
            }
            node = node->children[index];
        }
        node->isEndOfWord = true;
    }
    
    // Returns true if the word is in the trie.
    // Time Complexity: O(m)
    // Space Complexity: O(1)
    bool search(string word) {
        TrieNode* node = root;
        for (char c : word) {
            int index = c - 'a';
            if (node->children[index] == nullptr) {
                return false;
            }
            node = node->children[index];
        }
        return node->isEndOfWord;
    }
    
    // Returns true if there is any word in the trie that starts with the given prefix.
    // Time Complexity: O(m)
    // Space Complexity: O(1)
    bool startsWith(string prefix) {
        TrieNode* node = root;
        for (char c : prefix) {
            int index = c - 'a';
            if (node->children[index] == nullptr) {
                return false;
            }
            node = node->children[index];
        }
        return true;
    }
};`;

export const trieJava = `class TrieNode {
    boolean isEndOfWord;
    TrieNode[] children;

    public TrieNode() {
        isEndOfWord = false;
        children = new TrieNode[26];
    }
}

class Trie {
    private TrieNode root;

    public Trie() {
        root = new TrieNode();
    }

    // Inserts a word into the trie.
    // Time Complexity: O(m), where m is the key length
    // Space Complexity: O(m)
    public void insert(String word) {
        TrieNode node = root;
        for (int i = 0; i < word.length(); i++) {
            char c = word.charAt(i);
            int index = c - 'a';
            if (node.children[index] == null) {
                node.children[index] = new TrieNode();
            }
            node = node.children[index];
        }
        node.isEndOfWord = true;
    }

    // Returns true if the word is in the trie.
    // Time Complexity: O(m)
    // Space Complexity: O(1)
    public boolean search(String word) {
        TrieNode node = root;
        for (int i = 0; i < word.length(); i++) {
            char c = word.charAt(i);
            int index = c - 'a';
            if (node.children[index] == null) {
                return false;
            }
            node = node.children[index];
        }
        return node.isEndOfWord;
    }

    // Returns true if there is any word in the trie that starts with the given prefix.
    // Time Complexity: O(m)
    // Space Complexity: O(1)
    public boolean startsWith(String prefix) {
        TrieNode node = root;
        for (int i = 0; i < prefix.length(); i++) {
            char c = prefix.charAt(i);
            int index = c - 'a';
            if (node.children[index] == null) {
                return false;
            }
            node = node.children[index];
        }
        return true;
    }
}`;

export const triePython = `class TrieNode:
    def __init__(self):
        self.is_end_of_word = False
        self.children = {}

class Trie:
    def __init__(self):
        self.root = TrieNode()

    # Inserts a word into the trie.
    # Time Complexity: O(m), where m is the key length
    # Space Complexity: O(m)
    def insert(self, word: str) -> None:
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_end_of_word = True

    # Returns true if the word is in the trie.
    # Time Complexity: O(m)
    # Space Complexity: O(1)
    def search(self, word: str) -> bool:
        node = self.root
        for char in word:
            if char not in node.children:
                return False
            node = node.children[char]
        return node.is_end_of_word

    # Returns true if there is any word in the trie that starts with the given prefix.
    # Time Complexity: O(m)
    # Space Complexity: O(1)
    def starts_with(self, prefix: str) -> bool:
        node = self.root
        for char in prefix:
            if char not in node.children:
                return False
            node = node.children[char]
        return True`;

export const trieJS = `class TrieNode {
    constructor() {
        this.isEndOfWord = false;
        this.children = {};
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    // Inserts a word into the trie.
    // Time Complexity: O(m), where m is the key length
    // Space Complexity: O(m)
    insert(word) {
        let node = this.root;
        for (const char of word) {
            if (!node.children[char]) {
                node.children[char] = new TrieNode();
            }
            node = node.children[char];
        }
        node.isEndOfWord = true;
    }

    // Returns true if the word is in the trie.
    // Time Complexity: O(m)
    // Space Complexity: O(1)
    search(word) {
        let node = this.root;
        for (const char of word) {
            if (!node.children[char]) {
                return false;
            }
            node = node.children[char];
        }
        return node.isEndOfWord;
    }

    // Returns true if there is any word in the trie that starts with the given prefix.
    // Time Complexity: O(m)
    // Space Complexity: O(1)
    startsWith(prefix) {
        let node = this.root;
        for (const char of prefix) {
            if (!node.children[char]) {
                return false;
            }
            node = node.children[char];
        }
        return true;
    }
}`;
