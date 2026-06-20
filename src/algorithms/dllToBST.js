// ============================================================
// DLL ↔ BST Conversion — Code Snippets (C++, Python, Java, JS)
// ============================================================

// ─── DLL TO BST: C++ ────────────────────────────────────────

export const dllToBSTCPP = `#include <iostream>
using namespace std;

// Doubly Linked List Node
struct DLLNode {
    int data;
    DLLNode* prev;
    DLLNode* next;
    DLLNode(int val) : data(val), prev(nullptr), next(nullptr) {}
};

// Binary Search Tree Node
struct BSTNode {
    int data;
    BSTNode* left;
    BSTNode* right;
    BSTNode(int val) : data(val), left(nullptr), right(nullptr) {}
};

// Step 1: Count DLL nodes
int countNodes(DLLNode* head) {
    int count = 0;
    while (head) { count++; head = head->next; }
    return count;
}

// Step 2: Convert sorted DLL to balanced BST (in-order simulation)
BSTNode* sortedDLLToBSTHelper(DLLNode*& curr, int n) {
    if (n <= 0) return nullptr;

    // Build left subtree first (smaller elements)
    BSTNode* left = sortedDLLToBSTHelper(curr, n / 2);

    // Current DLL node becomes the root of this subtree
    BSTNode* root = new BSTNode(curr->data);
    root->left = left;

    // Advance DLL pointer forward
    curr = curr->next;

    // Build right subtree (larger elements)
    root->right = sortedDLLToBSTHelper(curr, n - n / 2 - 1);

    return root;
}

BSTNode* sortedDLLToBST(DLLNode* head) {
    int n = countNodes(head);
    DLLNode* curr = head;
    return sortedDLLToBSTHelper(curr, n);
}

void inorder(BSTNode* root) {
    if (!root) return;
    inorder(root->left);
    cout << root->data << " ";
    inorder(root->right);
}

int main() {
    // Sorted DLL: 1 <-> 2 <-> 3 <-> 4 <-> 5
    DLLNode* head = new DLLNode(1);
    head->next = new DLLNode(2); head->next->prev = head;
    head->next->next = new DLLNode(3); head->next->next->prev = head->next;
    head->next->next->next = new DLLNode(4);
    head->next->next->next->prev = head->next->next;
    head->next->next->next->next = new DLLNode(5);
    head->next->next->next->next->prev = head->next->next->next;

    BSTNode* root = sortedDLLToBST(head);

    cout << "BST In-order (matches DLL): ";
    inorder(root);
    cout << endl;
    return 0;
}`;

// ─── BST TO DLL: C++ ────────────────────────────────────────

export const bstToDLLCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* left;   // acts as "prev" in DLL
    Node* right;  // acts as "next" in DLL
    Node(int val) : data(val), left(nullptr), right(nullptr) {}
};

Node* prev = nullptr;
Node* head = nullptr;

// In-order traversal rewires left/right to prev/next
void bstToDLL(Node* root) {
    if (!root) return;

    bstToDLL(root->left);

    // Link current node with previous
    root->left = prev;
    if (prev) prev->right = root;
    else head = root; // first node becomes DLL head

    prev = root;

    bstToDLL(root->right);
}

void printDLL(Node* node) {
    cout << "null <-> ";
    while (node) {
        cout << node->data;
        if (node->right) cout << " <-> ";
        node = node->right;
    }
    cout << " <-> null" << endl;
}

int main() {
    //       4
    //      / \\
    //     2   5
    //    / \\
    //   1   3
    Node* root = new Node(4);
    root->left = new Node(2);
    root->right = new Node(5);
    root->left->left = new Node(1);
    root->left->right = new Node(3);

    bstToDLL(root);

    cout << "Sorted DLL from BST: ";
    printDLL(head);
    return 0;
}`;

// ─── DLL TO BST: Python ─────────────────────────────────────

export const dllToBSTPython = `class DLLNode:
    def __init__(self, val):
        self.data = val
        self.prev = None
        self.next = None

class BSTNode:
    def __init__(self, val):
        self.data = val
        self.left = None
        self.right = None

def count_nodes(head):
    count = 0
    while head:
        count += 1
        head = head.next
    return count

# Use a list as a mutable pointer reference
def sorted_dll_to_bst_helper(curr_ref, n):
    if n <= 0:
        return None

    # Recursively build left subtree
    left = sorted_dll_to_bst_helper(curr_ref, n // 2)

    # Current node becomes root
    root = BSTNode(curr_ref[0].data)
    root.left = left

    # Advance DLL pointer
    curr_ref[0] = curr_ref[0].next

    # Recursively build right subtree
    root.right = sorted_dll_to_bst_helper(curr_ref, n - n // 2 - 1)

    return root

def sorted_dll_to_bst(head):
    n = count_nodes(head)
    curr_ref = [head]
    return sorted_dll_to_bst_helper(curr_ref, n)

def inorder(root):
    if not root:
        return
    inorder(root.left)
    print(root.data, end=" ")
    inorder(root.right)

# Build sorted DLL: 1 <-> 2 <-> 3 <-> 4 <-> 5
head = DLLNode(1)
head.next = DLLNode(2); head.next.prev = head
head.next.next = DLLNode(3); head.next.next.prev = head.next
head.next.next.next = DLLNode(4)
head.next.next.next.prev = head.next.next
head.next.next.next.next = DLLNode(5)
head.next.next.next.next.prev = head.next.next.next

root = sorted_dll_to_bst(head)
print("BST In-order:", end=" ")
inorder(root)`;

// ─── BST TO DLL: Python ─────────────────────────────────────

export const bstToDLLPython = `class Node:
    def __init__(self, val):
        self.data = val
        self.left = None   # prev in DLL
        self.right = None  # next in DLL

prev = [None]
head = [None]

def bst_to_dll(root):
    if not root:
        return

    bst_to_dll(root.left)

    # Link current node with previous
    root.left = prev[0]
    if prev[0]:
        prev[0].right = root
    else:
        head[0] = root  # first node is DLL head

    prev[0] = root

    bst_to_dll(root.right)

def print_dll(node):
    parts = []
    curr = node
    while curr:
        parts.append(str(curr.data))
        curr = curr.right
    print("null <-> " + " <-> ".join(parts) + " <-> null")

#       4
#      / \\
#     2   5
#    / \\
#   1   3
root = Node(4)
root.left = Node(2)
root.right = Node(5)
root.left.left = Node(1)
root.left.right = Node(3)

bst_to_dll(root)
print("Sorted DLL from BST:", end=" ")
print_dll(head[0])`;

// ─── DLL TO BST: Java ───────────────────────────────────────

export const dllToBSTJava = `class DLLNode {
    int data;
    DLLNode prev, next;
    DLLNode(int val) { data = val; }
}

class BSTNode {
    int data;
    BSTNode left, right;
    BSTNode(int val) { data = val; }
}

public class DLLToBST {
    static DLLNode curr;

    static int countNodes(DLLNode head) {
        int count = 0;
        while (head != null) { count++; head = head.next; }
        return count;
    }

    static BSTNode sortedDLLToBSTHelper(int n) {
        if (n <= 0) return null;

        // Build left subtree
        BSTNode left = sortedDLLToBSTHelper(n / 2);

        // Current node becomes root
        BSTNode root = new BSTNode(curr.data);
        root.left = left;

        curr = curr.next; // advance pointer

        // Build right subtree
        root.right = sortedDLLToBSTHelper(n - n / 2 - 1);
        return root;
    }

    static BSTNode sortedDLLToBST(DLLNode head) {
        int n = countNodes(head);
        curr = head;
        return sortedDLLToBSTHelper(n);
    }

    static void inorder(BSTNode root) {
        if (root == null) return;
        inorder(root.left);
        System.out.print(root.data + " ");
        inorder(root.right);
    }

    public static void main(String[] args) {
        DLLNode head = new DLLNode(1);
        head.next = new DLLNode(2); head.next.prev = head;
        head.next.next = new DLLNode(3);
        head.next.next.prev = head.next;
        head.next.next.next = new DLLNode(4);
        head.next.next.next.prev = head.next.next;
        head.next.next.next.next = new DLLNode(5);
        head.next.next.next.next.prev = head.next.next.next;

        BSTNode root = sortedDLLToBST(head);
        System.out.print("BST In-order: ");
        inorder(root);
    }
}`;

// ─── BST TO DLL: Java ───────────────────────────────────────

export const bstToDLLJava = `class Node {
    int data;
    Node left, right; // left=prev, right=next in DLL
    Node(int val) { data = val; }
}

public class BSTToDLL {
    static Node prev = null;
    static Node head = null;

    static void bstToDLL(Node root) {
        if (root == null) return;

        bstToDLL(root.left);

        // Rewire: link current with previous
        root.left = prev;
        if (prev != null) prev.right = root;
        else head = root; // DLL head

        prev = root;

        bstToDLL(root.right);
    }

    static void printDLL(Node node) {
        System.out.print("null <-> ");
        while (node != null) {
            System.out.print(node.data);
            if (node.right != null) System.out.print(" <-> ");
            node = node.right;
        }
        System.out.println(" <-> null");
    }

    public static void main(String[] args) {
        Node root = new Node(4);
        root.left = new Node(2);
        root.right = new Node(5);
        root.left.left = new Node(1);
        root.left.right = new Node(3);

        bstToDLL(root);
        System.out.print("Sorted DLL from BST: ");
        printDLL(head);
    }
}`;

// ─── DLL TO BST: JavaScript ─────────────────────────────────

export const dllToBSTJS = `// DLL to BST Conversion in JavaScript
class DLLNode {
    constructor(val) {
        this.data = val;
        this.prev = null;
        this.next = null;
    }
}

class BSTNode {
    constructor(val) {
        this.data = val;
        this.left = null;
        this.right = null;
    }
}

function countNodes(head) {
    let count = 0;
    while (head) { count++; head = head.next; }
    return count;
}

// currRef = { node: DLLNode } acts as mutable pointer
function sortedDLLToBSTHelper(currRef, n) {
    if (n <= 0) return null;

    const left = sortedDLLToBSTHelper(currRef, Math.floor(n / 2));

    const root = new BSTNode(currRef.node.data);
    root.left = left;

    currRef.node = currRef.node.next; // advance pointer

    root.right = sortedDLLToBSTHelper(currRef, n - Math.floor(n / 2) - 1);
    return root;
}

function sortedDLLToBST(head) {
    const n = countNodes(head);
    const currRef = { node: head };
    return sortedDLLToBSTHelper(currRef, n);
}

function inorder(root, result = []) {
    if (!root) return result;
    inorder(root.left, result);
    result.push(root.data);
    inorder(root.right, result);
    return result;
}

// Build sorted DLL: 1 <-> 2 <-> 3 <-> 4 <-> 5
const head = new DLLNode(1);
head.next = new DLLNode(2); head.next.prev = head;
head.next.next = new DLLNode(3); head.next.next.prev = head.next;
head.next.next.next = new DLLNode(4);
head.next.next.next.prev = head.next.next;
head.next.next.next.next = new DLLNode(5);
head.next.next.next.next.prev = head.next.next.next;

const root = sortedDLLToBST(head);
console.log("BST In-order:", inorder(root).join(" -> "));`;

// ─── BST TO DLL: JavaScript ─────────────────────────────────

export const bstToDLLJS = `// BST to DLL Conversion in JavaScript
class Node {
    constructor(val) {
        this.data = val;
        this.left = null;   // acts as prev in DLL
        this.right = null;  // acts as next in DLL
    }
}

let prev = null;
let head = null;

function bstToDLL(root) {
    if (!root) return;

    bstToDLL(root.left);

    // Rewire: link current node with previous
    root.left = prev;
    if (prev) {
        prev.right = root;
    } else {
        head = root; // first node -> DLL head
    }
    prev = root;

    bstToDLL(root.right);
}

function printDLL(node) {
    const parts = [];
    while (node) {
        parts.push(node.data);
        node = node.right;
    }
    console.log("null <-> " + parts.join(" <-> ") + " <-> null");
}

//       4
//      / \\
//     2   5
//    / \\
//   1   3
const root = new Node(4);
root.left = new Node(2);
root.right = new Node(5);
root.left.left = new Node(1);
root.left.right = new Node(3);

bstToDLL(root);
console.log("Sorted DLL from BST:");
printDLL(head);`;