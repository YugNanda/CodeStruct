// ============================================================
// Singly Linked List – Insertion & Deletion Code Snippets
// ============================================================

// ─── C++ ────────────────────────────────────────────────────

export const insertAtHeadCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

Node* insertAtHead(Node* head, int val) {
    Node* newNode = new Node(val);
    newNode->next = head;   // point new node to old head
    return newNode;          // new node becomes the head
}

void printList(Node* head) {
    while (head) {
        cout << head->data;
        if (head->next) cout << " -> ";
        head = head->next;
    }
    cout << " -> null\\n";
}

int main() {
    Node* head = new Node(20);
    head->next = new Node(30);
    head->next->next = new Node(40);

    cout << "Before: "; printList(head);
    head = insertAtHead(head, 10);
    cout << "After:  "; printList(head);
    return 0;
}`;

export const insertAtTailCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

Node* insertAtTail(Node* head, int val) {
    Node* newNode = new Node(val);
    if (!head) return newNode;

    Node* curr = head;
    while (curr->next)          // traverse to the last node
        curr = curr->next;
    curr->next = newNode;        // link last node to new node
    return head;
}

void printList(Node* head) {
    while (head) {
        cout << head->data;
        if (head->next) cout << " -> ";
        head = head->next;
    }
    cout << " -> null\\n";
}

int main() {
    Node* head = new Node(10);
    head->next = new Node(20);
    head->next->next = new Node(30);

    cout << "Before: "; printList(head);
    head = insertAtTail(head, 40);
    cout << "After:  "; printList(head);
    return 0;
}`;

export const insertAtPositionCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

// pos is 0-indexed
Node* insertAtPosition(Node* head, int val, int pos) {
    Node* newNode = new Node(val);
    if (pos == 0) {
        newNode->next = head;
        return newNode;
    }
    Node* curr = head;
    for (int i = 0; i < pos - 1 && curr; ++i)
        curr = curr->next;

    if (!curr) return head; // position out of bounds

    newNode->next = curr->next;  // redirect pointers
    curr->next = newNode;
    return head;
}

void printList(Node* head) {
    while (head) {
        cout << head->data;
        if (head->next) cout << " -> ";
        head = head->next;
    }
    cout << " -> null\\n";
}

int main() {
    Node* head = new Node(10);
    head->next = new Node(30);
    head->next->next = new Node(40);

    cout << "Before: "; printList(head);
    head = insertAtPosition(head, 20, 1);
    cout << "After:  "; printList(head);
    return 0;
}`;

export const deleteFromHeadCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

Node* deleteFromHead(Node* head) {
    if (!head) return nullptr;
    Node* temp = head;
    head = head->next;  // move head to the next node
    delete temp;         // free old head
    return head;
}

void printList(Node* head) {
    while (head) {
        cout << head->data;
        if (head->next) cout << " -> ";
        head = head->next;
    }
    cout << " -> null\\n";
}

int main() {
    Node* head = new Node(10);
    head->next = new Node(20);
    head->next->next = new Node(30);

    cout << "Before: "; printList(head);
    head = deleteFromHead(head);
    cout << "After:  "; printList(head);
    return 0;
}`;

export const deleteFromTailCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

Node* deleteFromTail(Node* head) {
    if (!head) return nullptr;
    if (!head->next) { delete head; return nullptr; }

    Node* curr = head;
    while (curr->next->next)    // traverse to second-last
        curr = curr->next;
    delete curr->next;           // free last node
    curr->next = nullptr;        // set next of second-last to null
    return head;
}

void printList(Node* head) {
    while (head) {
        cout << head->data;
        if (head->next) cout << " -> ";
        head = head->next;
    }
    cout << " -> null\\n";
}

int main() {
    Node* head = new Node(10);
    head->next = new Node(20);
    head->next->next = new Node(30);

    cout << "Before: "; printList(head);
    head = deleteFromTail(head);
    cout << "After:  "; printList(head);
    return 0;
}`;

export const deleteByValueCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int val) : data(val), next(nullptr) {}
};

Node* deleteByValue(Node* head, int target) {
    if (!head) return nullptr;
    if (head->data == target) {
        Node* temp = head;
        head = head->next;
        delete temp;
        return head;
    }
    Node* curr = head;
    while (curr->next && curr->next->data != target)
        curr = curr->next;

    if (curr->next) {
        Node* temp = curr->next;
        curr->next = curr->next->next;  // bypass the target node
        delete temp;
    }
    return head;
}

void printList(Node* head) {
    while (head) {
        cout << head->data;
        if (head->next) cout << " -> ";
        head = head->next;
    }
    cout << " -> null\\n";
}

int main() {
    Node* head = new Node(10);
    head->next = new Node(20);
    head->next->next = new Node(30);

    cout << "Before: "; printList(head);
    head = deleteByValue(head, 20);
    cout << "After:  "; printList(head);
    return 0;
}`;

// ─── Python ─────────────────────────────────────────────────

export const insertAtHeadPython = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def insert_at_head(head, val):
    new_node = Node(val)
    new_node.next = head   # point new node to old head
    return new_node         # new node becomes the head

def print_list(head):
    parts = []
    while head:
        parts.append(str(head.data))
        head = head.next
    print(" -> ".join(parts) + " -> null")

if __name__ == "__main__":
    head = Node(20)
    head.next = Node(30)
    head.next.next = Node(40)

    print("Before:", end=" "); print_list(head)
    head = insert_at_head(head, 10)
    print("After: ", end=" "); print_list(head)`;

export const insertAtTailPython = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def insert_at_tail(head, val):
    new_node = Node(val)
    if not head:
        return new_node
    curr = head
    while curr.next:          # traverse to the last node
        curr = curr.next
    curr.next = new_node       # link last node to new node
    return head

def print_list(head):
    parts = []
    while head:
        parts.append(str(head.data))
        head = head.next
    print(" -> ".join(parts) + " -> null")

if __name__ == "__main__":
    head = Node(10)
    head.next = Node(20)
    head.next.next = Node(30)

    print("Before:", end=" "); print_list(head)
    head = insert_at_tail(head, 40)
    print("After: ", end=" "); print_list(head)`;

export const insertAtPositionPython = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def insert_at_position(head, val, pos):
    new_node = Node(val)
    if pos == 0:
        new_node.next = head
        return new_node

    curr = head
    for _ in range(pos - 1):
        if not curr:
            return head  # position out of bounds
        curr = curr.next

    if not curr:
        return head

    new_node.next = curr.next  # redirect pointers
    curr.next = new_node
    return head

def print_list(head):
    parts = []
    while head:
        parts.append(str(head.data))
        head = head.next
    print(" -> ".join(parts) + " -> null")

if __name__ == "__main__":
    head = Node(10)
    head.next = Node(30)
    head.next.next = Node(40)

    print("Before:", end=" "); print_list(head)
    head = insert_at_position(head, 20, 1)
    print("After: ", end=" "); print_list(head)`;

export const deleteFromHeadPython = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def delete_from_head(head):
    if not head:
        return None
    return head.next   # move head to the next node

def print_list(head):
    parts = []
    while head:
        parts.append(str(head.data))
        head = head.next
    print(" -> ".join(parts) + " -> null")

if __name__ == "__main__":
    head = Node(10)
    head.next = Node(20)
    head.next.next = Node(30)

    print("Before:", end=" "); print_list(head)
    head = delete_from_head(head)
    print("After: ", end=" "); print_list(head)`;

export const deleteFromTailPython = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def delete_from_tail(head):
    if not head:
        return None
    if not head.next:
        return None
    curr = head
    while curr.next.next:     # traverse to second-last
        curr = curr.next
    curr.next = None           # remove last node
    return head

def print_list(head):
    parts = []
    while head:
        parts.append(str(head.data))
        head = head.next
    print(" -> ".join(parts) + " -> null")

if __name__ == "__main__":
    head = Node(10)
    head.next = Node(20)
    head.next.next = Node(30)

    print("Before:", end=" "); print_list(head)
    head = delete_from_tail(head)
    print("After: ", end=" "); print_list(head)`;

export const deleteByValuePython = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def delete_by_value(head, target):
    if not head:
        return None
    if head.data == target:
        return head.next

    curr = head
    while curr.next and curr.next.data != target:
        curr = curr.next

    if curr.next:
        curr.next = curr.next.next  # bypass the target node
    return head

def print_list(head):
    parts = []
    while head:
        parts.append(str(head.data))
        head = head.next
    print(" -> ".join(parts) + " -> null")

if __name__ == "__main__":
    head = Node(10)
    head.next = Node(20)
    head.next.next = Node(30)

    print("Before:", end=" "); print_list(head)
    head = delete_by_value(head, 20)
    print("After: ", end=" "); print_list(head)`;

// ─── Java ───────────────────────────────────────────────────

export const insertAtHeadJava = `class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; this.next = null; }
}

public class Main {
    static Node insertAtHead(Node head, int val) {
        Node newNode = new Node(val);
        newNode.next = head;   // point new node to old head
        return newNode;         // new node becomes the head
    }

    static void printList(Node head) {
        while (head != null) {
            System.out.print(head.data + " -> ");
            head = head.next;
        }
        System.out.println("null");
    }

    public static void main(String[] args) {
        Node head = new Node(20);
        head.next = new Node(30);
        head.next.next = new Node(40);

        System.out.print("Before: "); printList(head);
        head = insertAtHead(head, 10);
        System.out.print("After:  "); printList(head);
    }
}`;

export const insertAtTailJava = `class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; this.next = null; }
}

public class Main {
    static Node insertAtTail(Node head, int val) {
        Node newNode = new Node(val);
        if (head == null) return newNode;
        Node curr = head;
        while (curr.next != null)     // traverse to the last node
            curr = curr.next;
        curr.next = newNode;           // link last node to new node
        return head;
    }

    static void printList(Node head) {
        while (head != null) {
            System.out.print(head.data + " -> ");
            head = head.next;
        }
        System.out.println("null");
    }

    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(20);
        head.next.next = new Node(30);

        System.out.print("Before: "); printList(head);
        head = insertAtTail(head, 40);
        System.out.print("After:  "); printList(head);
    }
}`;

export const insertAtPositionJava = `class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; this.next = null; }
}

public class Main {
    static Node insertAtPosition(Node head, int val, int pos) {
        Node newNode = new Node(val);
        if (pos == 0) { newNode.next = head; return newNode; }

        Node curr = head;
        for (int i = 0; i < pos - 1 && curr != null; i++)
            curr = curr.next;

        if (curr == null) return head; // position out of bounds

        newNode.next = curr.next;  // redirect pointers
        curr.next = newNode;
        return head;
    }

    static void printList(Node head) {
        while (head != null) {
            System.out.print(head.data + " -> ");
            head = head.next;
        }
        System.out.println("null");
    }

    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(30);
        head.next.next = new Node(40);

        System.out.print("Before: "); printList(head);
        head = insertAtPosition(head, 20, 1);
        System.out.print("After:  "); printList(head);
    }
}`;

export const deleteFromHeadJava = `class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; this.next = null; }
}

public class Main {
    static Node deleteFromHead(Node head) {
        if (head == null) return null;
        return head.next;  // move head to the next node
    }

    static void printList(Node head) {
        while (head != null) {
            System.out.print(head.data + " -> ");
            head = head.next;
        }
        System.out.println("null");
    }

    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(20);
        head.next.next = new Node(30);

        System.out.print("Before: "); printList(head);
        head = deleteFromHead(head);
        System.out.print("After:  "); printList(head);
    }
}`;

export const deleteFromTailJava = `class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; this.next = null; }
}

public class Main {
    static Node deleteFromTail(Node head) {
        if (head == null) return null;
        if (head.next == null) return null;

        Node curr = head;
        while (curr.next.next != null)  // traverse to second-last
            curr = curr.next;
        curr.next = null;                // remove last node
        return head;
    }

    static void printList(Node head) {
        while (head != null) {
            System.out.print(head.data + " -> ");
            head = head.next;
        }
        System.out.println("null");
    }

    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(20);
        head.next.next = new Node(30);

        System.out.print("Before: "); printList(head);
        head = deleteFromTail(head);
        System.out.print("After:  "); printList(head);
    }
}`;

export const deleteByValueJava = `class Node {
    int data;
    Node next;
    Node(int data) { this.data = data; this.next = null; }
}

public class Main {
    static Node deleteByValue(Node head, int target) {
        if (head == null) return null;
        if (head.data == target) return head.next;

        Node curr = head;
        while (curr.next != null && curr.next.data != target)
            curr = curr.next;

        if (curr.next != null)
            curr.next = curr.next.next;  // bypass the target node
        return head;
    }

    static void printList(Node head) {
        while (head != null) {
            System.out.print(head.data + " -> ");
            head = head.next;
        }
        System.out.println("null");
    }

    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(20);
        head.next.next = new Node(30);

        System.out.print("Before: "); printList(head);
        head = deleteByValue(head, 20);
        System.out.print("After:  "); printList(head);
    }
}`;

// ─── JavaScript ─────────────────────────────────────────────

export const insertAtHeadJS = `class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

function insertAtHead(head, val) {
    const newNode = new Node(val);
    newNode.next = head;   // point new node to old head
    return newNode;         // new node becomes the head
}

function printList(head) {
    const parts = [];
    while (head) { parts.push(head.data); head = head.next; }
    console.log(parts.join(" -> ") + " -> null");
}

let head = new Node(20);
head.next = new Node(30);
head.next.next = new Node(40);

console.log("Before:"); printList(head);
head = insertAtHead(head, 10);
console.log("After:");  printList(head);`;

export const insertAtTailJS = `class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

function insertAtTail(head, val) {
    const newNode = new Node(val);
    if (!head) return newNode;
    let curr = head;
    while (curr.next)          // traverse to the last node
        curr = curr.next;
    curr.next = newNode;        // link last node to new node
    return head;
}

function printList(head) {
    const parts = [];
    while (head) { parts.push(head.data); head = head.next; }
    console.log(parts.join(" -> ") + " -> null");
}

let head = new Node(10);
head.next = new Node(20);
head.next.next = new Node(30);

console.log("Before:"); printList(head);
head = insertAtTail(head, 40);
console.log("After:");  printList(head);`;

export const insertAtPositionJS = `class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

function insertAtPosition(head, val, pos) {
    const newNode = new Node(val);
    if (pos === 0) { newNode.next = head; return newNode; }

    let curr = head;
    for (let i = 0; i < pos - 1 && curr; i++)
        curr = curr.next;

    if (!curr) return head; // position out of bounds

    newNode.next = curr.next;  // redirect pointers
    curr.next = newNode;
    return head;
}

function printList(head) {
    const parts = [];
    while (head) { parts.push(head.data); head = head.next; }
    console.log(parts.join(" -> ") + " -> null");
}

let head = new Node(10);
head.next = new Node(30);
head.next.next = new Node(40);

console.log("Before:"); printList(head);
head = insertAtPosition(head, 20, 1);
console.log("After:");  printList(head);`;

export const deleteFromHeadJS = `class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

function deleteFromHead(head) {
    if (!head) return null;
    return head.next;  // move head to the next node
}

function printList(head) {
    const parts = [];
    while (head) { parts.push(head.data); head = head.next; }
    console.log(parts.join(" -> ") + " -> null");
}

let head = new Node(10);
head.next = new Node(20);
head.next.next = new Node(30);

console.log("Before:"); printList(head);
head = deleteFromHead(head);
console.log("After:");  printList(head);`;

export const deleteFromTailJS = `class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

function deleteFromTail(head) {
    if (!head) return null;
    if (!head.next) return null;

    let curr = head;
    while (curr.next.next)    // traverse to second-last
        curr = curr.next;
    curr.next = null;          // remove last node
    return head;
}

function printList(head) {
    const parts = [];
    while (head) { parts.push(head.data); head = head.next; }
    console.log(parts.join(" -> ") + " -> null");
}

let head = new Node(10);
head.next = new Node(20);
head.next.next = new Node(30);

console.log("Before:"); printList(head);
head = deleteFromTail(head);
console.log("After:");  printList(head);`;

export const deleteByValueJS = `class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

function deleteByValue(head, target) {
    if (!head) return null;
    if (head.data === target) return head.next;

    let curr = head;
    while (curr.next && curr.next.data !== target)
        curr = curr.next;

    if (curr.next)
        curr.next = curr.next.next;  // bypass the target node
    return head;
}

function printList(head) {
    const parts = [];
    while (head) { parts.push(head.data); head = head.next; }
    console.log(parts.join(" -> ") + " -> null");
}

let head = new Node(10);
head.next = new Node(20);
head.next.next = new Node(30);

console.log("Before:"); printList(head);
head = deleteByValue(head, 20);
console.log("After:");  printList(head);`;