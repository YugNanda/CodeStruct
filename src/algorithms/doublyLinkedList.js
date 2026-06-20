// ============================================================
// Doubly Linked List – Insertion & Deletion Code Snippets
// All 4 languages: C++, Python, Java, JavaScript
// ============================================================

// ─── INSERT AT HEAD ─────────────────────────────────────────

export const dllInsertAtHeadCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* prev;
    Node* next;
    Node(int val) : data(val), prev(nullptr), next(nullptr) {}
};

Node* insertAtHead(Node* head, int val) {
    Node* newNode = new Node(val);
    newNode->next = head;       // new->next points to old head
    if (head) head->prev = newNode; // old head's prev points back
    return newNode;              // new node is now the head
}

void printList(Node* head) {
    Node* curr = head;
    cout << "null <-> ";
    while (curr) {
        cout << curr->data;
        if (curr->next) cout << " <-> ";
        curr = curr->next;
    }
    cout << " <-> null\\n";
}

int main() {
    Node* head = new Node(20);
    head->next = new Node(30);
    head->next->prev = head;

    cout << "Before: "; printList(head);
    head = insertAtHead(head, 10);
    cout << "After:  "; printList(head);
    return 0;
}`;

export const dllInsertAtHeadPython = `class Node:
    def __init__(self, val):
        self.data = val
        self.prev = None
        self.next = None

def insert_at_head(head, val):
    new_node = Node(val)
    new_node.next = head       # new->next points to old head
    if head:
        head.prev = new_node   # old head's prev points back
    return new_node            # new node is now the head

def print_list(head):
    parts = []
    curr = head
    while curr:
        parts.append(str(curr.data))
        curr = curr.next
    print("null <-> " + " <-> ".join(parts) + " <-> null")

head = Node(20)
head.next = Node(30)
head.next.prev = head

print("Before:", end=" "); print_list(head)
head = insert_at_head(head, 10)
print("After: ", end=" "); print_list(head)`;

export const dllInsertAtHeadJava = `public class DoublyLinkedList {
    static class Node {
        int data;
        Node prev, next;
        Node(int val) { data = val; }
    }

    static Node insertAtHead(Node head, int val) {
        Node newNode = new Node(val);
        newNode.next = head;           // new->next = old head
        if (head != null) head.prev = newNode; // old head back-link
        return newNode;                // new node is the head
    }

    static void printList(Node head) {
        System.out.print("null <-> ");
        while (head != null) {
            System.out.print(head.data);
            if (head.next != null) System.out.print(" <-> ");
            head = head.next;
        }
        System.out.println(" <-> null");
    }

    public static void main(String[] args) {
        Node head = new Node(20);
        head.next = new Node(30);
        head.next.prev = head;

        System.out.print("Before: "); printList(head);
        head = insertAtHead(head, 10);
        System.out.print("After:  "); printList(head);
    }
}`;

export const dllInsertAtHeadJS = `class Node {
  constructor(val) {
    this.data = val;
    this.prev = null;
    this.next = null;
  }
}

function insertAtHead(head, val) {
  const newNode = new Node(val);
  newNode.next = head;           // new->next = old head
  if (head) head.prev = newNode; // old head's prev back-link
  return newNode;                // new node is the head
}

function printList(head) {
  const parts = [];
  let curr = head;
  while (curr) { parts.push(curr.data); curr = curr.next; }
  console.log("null <-> " + parts.join(" <-> ") + " <-> null");
}

let head = new Node(20);
head.next = new Node(30);
head.next.prev = head;

console.log("Before:"); printList(head);
head = insertAtHead(head, 10);
console.log("After:"); printList(head);`;

// ─── INSERT AT TAIL ─────────────────────────────────────────

export const dllInsertAtTailCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* prev;
    Node* next;
    Node(int val) : data(val), prev(nullptr), next(nullptr) {}
};

Node* insertAtTail(Node* head, int val) {
    Node* newNode = new Node(val);
    if (!head) return newNode;          // empty list
    Node* curr = head;
    while (curr->next) curr = curr->next; // traverse to tail
    curr->next = newNode;               // tail->next = new node
    newNode->prev = curr;               // new->prev = old tail
    return head;
}

void printList(Node* head) {
    cout << "null <-> ";
    while (head) {
        cout << head->data;
        if (head->next) cout << " <-> ";
        head = head->next;
    }
    cout << " <-> null\\n";
}

int main() {
    Node* head = new Node(10);
    head->next = new Node(20);
    head->next->prev = head;

    cout << "Before: "; printList(head);
    head = insertAtTail(head, 30);
    cout << "After:  "; printList(head);
    return 0;
}`;

export const dllInsertAtTailPython = `class Node:
    def __init__(self, val):
        self.data = val
        self.prev = None
        self.next = None

def insert_at_tail(head, val):
    new_node = Node(val)
    if not head:
        return new_node          # empty list
    curr = head
    while curr.next:
        curr = curr.next         # traverse to tail
    curr.next = new_node         # tail->next = new node
    new_node.prev = curr         # new->prev = old tail
    return head

def print_list(head):
    parts = []
    curr = head
    while curr:
        parts.append(str(curr.data))
        curr = curr.next
    print("null <-> " + " <-> ".join(parts) + " <-> null")

head = Node(10)
head.next = Node(20)
head.next.prev = head

print("Before:", end=" "); print_list(head)
head = insert_at_tail(head, 30)
print("After: ", end=" "); print_list(head)`;

export const dllInsertAtTailJava = `public class DoublyLinkedList {
    static class Node {
        int data; Node prev, next;
        Node(int val) { data = val; }
    }

    static Node insertAtTail(Node head, int val) {
        Node newNode = new Node(val);
        if (head == null) return newNode;
        Node curr = head;
        while (curr.next != null) curr = curr.next; // find tail
        curr.next = newNode;    // tail->next = new node
        newNode.prev = curr;    // new->prev = old tail
        return head;
    }

    static void printList(Node head) {
        System.out.print("null <-> ");
        while (head != null) {
            System.out.print(head.data);
            if (head.next != null) System.out.print(" <-> ");
            head = head.next;
        }
        System.out.println(" <-> null");
    }

    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(20);
        head.next.prev = head;
        System.out.print("Before: "); printList(head);
        head = insertAtTail(head, 30);
        System.out.print("After:  "); printList(head);
    }
}`;

export const dllInsertAtTailJS = `class Node {
  constructor(val) { this.data = val; this.prev = null; this.next = null; }
}

function insertAtTail(head, val) {
  const newNode = new Node(val);
  if (!head) return newNode;
  let curr = head;
  while (curr.next) curr = curr.next; // traverse to tail
  curr.next = newNode;                // tail->next = new
  newNode.prev = curr;                // new->prev = old tail
  return head;
}

function printList(head) {
  const parts = [];
  let curr = head;
  while (curr) { parts.push(curr.data); curr = curr.next; }
  console.log("null <-> " + parts.join(" <-> ") + " <-> null");
}

let head = new Node(10);
head.next = new Node(20); head.next.prev = head;
console.log("Before:"); printList(head);
head = insertAtTail(head, 30);
console.log("After:"); printList(head);`;

// ─── INSERT AT POSITION ─────────────────────────────────────

export const dllInsertAtPositionCPP = `#include <iostream>
using namespace std;

struct Node {
    int data; Node* prev; Node* next;
    Node(int val) : data(val), prev(nullptr), next(nullptr) {}
};

Node* insertAtPosition(Node* head, int val, int pos) {
    Node* newNode = new Node(val);
    if (pos == 0) {                         // insert at head
        newNode->next = head;
        if (head) head->prev = newNode;
        return newNode;
    }
    Node* curr = head;
    for (int i = 0; i < pos - 1 && curr; i++) curr = curr->next;
    if (!curr) { delete newNode; return head; } // out of bounds
    newNode->next = curr->next;             // new->next = curr->next
    newNode->prev = curr;                   // new->prev = curr
    if (curr->next) curr->next->prev = newNode; // next->prev = new
    curr->next = newNode;                   // curr->next = new
    return head;
}

void printList(Node* head) {
    cout << "null <-> ";
    while (head) { cout << head->data; if (head->next) cout << " <-> "; head = head->next; }
    cout << " <-> null\\n";
}

int main() {
    Node* head = new Node(10);
    head->next = new Node(30);
    head->next->prev = head;
    cout << "Before: "; printList(head);
    head = insertAtPosition(head, 20, 1);
    cout << "After:  "; printList(head);
    return 0;
}`;

export const dllInsertAtPositionPython = `class Node:
    def __init__(self, val):
        self.data = val; self.prev = None; self.next = None

def insert_at_position(head, val, pos):
    new_node = Node(val)
    if pos == 0:
        new_node.next = head
        if head: head.prev = new_node
        return new_node
    curr = head
    for _ in range(pos - 1):
        if not curr: return head   # out of bounds
        curr = curr.next
    if not curr: return head
    new_node.next = curr.next      # new->next = curr->next
    new_node.prev = curr           # new->prev = curr
    if curr.next: curr.next.prev = new_node  # next->prev = new
    curr.next = new_node           # curr->next = new
    return head

def print_list(head):
    parts = []
    curr = head
    while curr: parts.append(str(curr.data)); curr = curr.next
    print("null <-> " + " <-> ".join(parts) + " <-> null")

head = Node(10)
head.next = Node(30); head.next.prev = head
print("Before:", end=" "); print_list(head)
head = insert_at_position(head, 20, 1)
print("After: ", end=" "); print_list(head)`;

export const dllInsertAtPositionJava = `public class DoublyLinkedList {
    static class Node {
        int data; Node prev, next;
        Node(int val) { data = val; }
    }

    static Node insertAtPosition(Node head, int val, int pos) {
        Node newNode = new Node(val);
        if (pos == 0) {
            newNode.next = head;
            if (head != null) head.prev = newNode;
            return newNode;
        }
        Node curr = head;
        for (int i = 0; i < pos - 1 && curr != null; i++) curr = curr.next;
        if (curr == null) return head;
        newNode.next = curr.next;
        newNode.prev = curr;
        if (curr.next != null) curr.next.prev = newNode;
        curr.next = newNode;
        return head;
    }

    static void printList(Node head) {
        System.out.print("null <-> ");
        while (head != null) { System.out.print(head.data); if (head.next != null) System.out.print(" <-> "); head = head.next; }
        System.out.println(" <-> null");
    }

    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(30); head.next.prev = head;
        System.out.print("Before: "); printList(head);
        head = insertAtPosition(head, 20, 1);
        System.out.print("After:  "); printList(head);
    }
}`;

export const dllInsertAtPositionJS = `class Node {
  constructor(val) { this.data = val; this.prev = null; this.next = null; }
}

function insertAtPosition(head, val, pos) {
  const newNode = new Node(val);
  if (pos === 0) {
    newNode.next = head;
    if (head) head.prev = newNode;
    return newNode;
  }
  let curr = head;
  for (let i = 0; i < pos - 1 && curr; i++) curr = curr.next;
  if (!curr) return head;
  newNode.next = curr.next;          // new->next = curr->next
  newNode.prev = curr;               // new->prev = curr
  if (curr.next) curr.next.prev = newNode; // next->prev = new
  curr.next = newNode;               // curr->next = new
  return head;
}

function printList(head) {
  const parts = [];
  let curr = head;
  while (curr) { parts.push(curr.data); curr = curr.next; }
  console.log("null <-> " + parts.join(" <-> ") + " <-> null");
}

let head = new Node(10);
head.next = new Node(30); head.next.prev = head;
console.log("Before:"); printList(head);
head = insertAtPosition(head, 20, 1);
console.log("After:"); printList(head);`;

// ─── DELETE FROM HEAD ────────────────────────────────────────

export const dllDeleteFromHeadCPP = `#include <iostream>
using namespace std;

struct Node {
    int data; Node* prev; Node* next;
    Node(int val) : data(val), prev(nullptr), next(nullptr) {}
};

Node* deleteFromHead(Node* head) {
    if (!head) return nullptr;
    Node* newHead = head->next;   // second node becomes head
    if (newHead) newHead->prev = nullptr; // clear back-link
    delete head;
    return newHead;
}

void printList(Node* head) {
    cout << "null <-> ";
    while (head) { cout << head->data; if (head->next) cout << " <-> "; head = head->next; }
    cout << " <-> null\\n";
}

int main() {
    Node* head = new Node(10);
    head->next = new Node(20); head->next->prev = head;
    head->next->next = new Node(30); head->next->next->prev = head->next;
    cout << "Before: "; printList(head);
    head = deleteFromHead(head);
    cout << "After:  "; printList(head);
    return 0;
}`;

export const dllDeleteFromHeadPython = `class Node:
    def __init__(self, val):
        self.data = val; self.prev = None; self.next = None

def delete_from_head(head):
    if not head:
        return None
    new_head = head.next          # second node becomes head
    if new_head:
        new_head.prev = None      # clear the back-link
    return new_head

def print_list(head):
    parts = []
    curr = head
    while curr: parts.append(str(curr.data)); curr = curr.next
    print("null <-> " + " <-> ".join(parts) + " <-> null")

head = Node(10)
head.next = Node(20); head.next.prev = head
head.next.next = Node(30); head.next.next.prev = head.next
print("Before:", end=" "); print_list(head)
head = delete_from_head(head)
print("After: ", end=" "); print_list(head)`;

export const dllDeleteFromHeadJava = `public class DoublyLinkedList {
    static class Node {
        int data; Node prev, next;
        Node(int val) { data = val; }
    }

    static Node deleteFromHead(Node head) {
        if (head == null) return null;
        Node newHead = head.next;
        if (newHead != null) newHead.prev = null; // clear back-link
        return newHead;
    }

    static void printList(Node head) {
        System.out.print("null <-> ");
        while (head != null) { System.out.print(head.data); if (head.next != null) System.out.print(" <-> "); head = head.next; }
        System.out.println(" <-> null");
    }

    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(20); head.next.prev = head;
        head.next.next = new Node(30); head.next.next.prev = head.next;
        System.out.print("Before: "); printList(head);
        head = deleteFromHead(head);
        System.out.print("After:  "); printList(head);
    }
}`;

export const dllDeleteFromHeadJS = `class Node {
  constructor(val) { this.data = val; this.prev = null; this.next = null; }
}

function deleteFromHead(head) {
  if (!head) return null;
  const newHead = head.next;        // second node becomes head
  if (newHead) newHead.prev = null; // clear the back-link
  return newHead;
}

function printList(head) {
  const parts = [];
  let curr = head;
  while (curr) { parts.push(curr.data); curr = curr.next; }
  console.log("null <-> " + parts.join(" <-> ") + " <-> null");
}

let head = new Node(10);
head.next = new Node(20); head.next.prev = head;
head.next.next = new Node(30); head.next.next.prev = head.next;
console.log("Before:"); printList(head);
head = deleteFromHead(head);
console.log("After:"); printList(head);`;

// ─── DELETE FROM TAIL ────────────────────────────────────────

export const dllDeleteFromTailCPP = `#include <iostream>
using namespace std;

struct Node {
    int data; Node* prev; Node* next;
    Node(int val) : data(val), prev(nullptr), next(nullptr) {}
};

Node* deleteFromTail(Node* head) {
    if (!head) return nullptr;
    if (!head->next) { delete head; return nullptr; } // single node
    Node* curr = head;
    while (curr->next) curr = curr->next; // traverse to tail
    curr->prev->next = nullptr;   // second-to-last->next = null
    delete curr;
    return head;
}

void printList(Node* head) {
    cout << "null <-> ";
    while (head) { cout << head->data; if (head->next) cout << " <-> "; head = head->next; }
    cout << " <-> null\\n";
}

int main() {
    Node* head = new Node(10);
    head->next = new Node(20); head->next->prev = head;
    head->next->next = new Node(30); head->next->next->prev = head->next;
    cout << "Before: "; printList(head);
    head = deleteFromTail(head);
    cout << "After:  "; printList(head);
    return 0;
}`;

export const dllDeleteFromTailPython = `class Node:
    def __init__(self, val):
        self.data = val; self.prev = None; self.next = None

def delete_from_tail(head):
    if not head:
        return None
    if not head.next:
        return None              # single node
    curr = head
    while curr.next:
        curr = curr.next         # traverse to tail
    curr.prev.next = None        # second-to-last->next = null
    return head

def print_list(head):
    parts = []
    curr = head
    while curr: parts.append(str(curr.data)); curr = curr.next
    print("null <-> " + " <-> ".join(parts) + " <-> null")

head = Node(10)
head.next = Node(20); head.next.prev = head
head.next.next = Node(30); head.next.next.prev = head.next
print("Before:", end=" "); print_list(head)
head = delete_from_tail(head)
print("After: ", end=" "); print_list(head)`;

export const dllDeleteFromTailJava = `public class DoublyLinkedList {
    static class Node {
        int data; Node prev, next;
        Node(int val) { data = val; }
    }

    static Node deleteFromTail(Node head) {
        if (head == null) return null;
        if (head.next == null) return null; // single node
        Node curr = head;
        while (curr.next != null) curr = curr.next; // find tail
        curr.prev.next = null;  // second-to-last->next = null
        return head;
    }

    static void printList(Node head) {
        System.out.print("null <-> ");
        while (head != null) { System.out.print(head.data); if (head.next != null) System.out.print(" <-> "); head = head.next; }
        System.out.println(" <-> null");
    }

    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(20); head.next.prev = head;
        head.next.next = new Node(30); head.next.next.prev = head.next;
        System.out.print("Before: "); printList(head);
        head = deleteFromTail(head);
        System.out.print("After:  "); printList(head);
    }
}`;

export const dllDeleteFromTailJS = `class Node {
  constructor(val) { this.data = val; this.prev = null; this.next = null; }
}

function deleteFromTail(head) {
  if (!head) return null;
  if (!head.next) return null;     // single node
  let curr = head;
  while (curr.next) curr = curr.next; // traverse to tail
  curr.prev.next = null;           // second-to-last->next = null
  return head;
}

function printList(head) {
  const parts = [];
  let curr = head;
  while (curr) { parts.push(curr.data); curr = curr.next; }
  console.log("null <-> " + parts.join(" <-> ") + " <-> null");
}

let head = new Node(10);
head.next = new Node(20); head.next.prev = head;
head.next.next = new Node(30); head.next.next.prev = head.next;
console.log("Before:"); printList(head);
head = deleteFromTail(head);
console.log("After:"); printList(head);`;

// ─── DELETE BY VALUE ─────────────────────────────────────────

export const dllDeleteByValueCPP = `#include <iostream>
using namespace std;

struct Node {
    int data; Node* prev; Node* next;
    Node(int val) : data(val), prev(nullptr), next(nullptr) {}
};

Node* deleteByValue(Node* head, int val) {
    if (!head) return nullptr;
    if (head->data == val) {        // target is head
        Node* newHead = head->next;
        if (newHead) newHead->prev = nullptr;
        delete head;
        return newHead;
    }
    Node* curr = head;
    while (curr && curr->data != val) curr = curr->next;
    if (!curr) return head;         // value not found
    if (curr->prev) curr->prev->next = curr->next; // bypass node
    if (curr->next) curr->next->prev = curr->prev; // bypass back
    delete curr;
    return head;
}

void printList(Node* head) {
    cout << "null <-> ";
    while (head) { cout << head->data; if (head->next) cout << " <-> "; head = head->next; }
    cout << " <-> null\\n";
}

int main() {
    Node* head = new Node(10);
    head->next = new Node(20); head->next->prev = head;
    head->next->next = new Node(30); head->next->next->prev = head->next;
    cout << "Before: "; printList(head);
    head = deleteByValue(head, 20);
    cout << "After:  "; printList(head);
    return 0;
}`;

export const dllDeleteByValuePython = `class Node:
    def __init__(self, val):
        self.data = val; self.prev = None; self.next = None

def delete_by_value(head, val):
    if not head:
        return None
    if head.data == val:          # target is head
        new_head = head.next
        if new_head: new_head.prev = None
        return new_head
    curr = head
    while curr and curr.data != val:
        curr = curr.next
    if not curr: return head      # value not found
    if curr.prev: curr.prev.next = curr.next  # bypass node
    if curr.next: curr.next.prev = curr.prev  # bypass back
    return head

def print_list(head):
    parts = []
    curr = head
    while curr: parts.append(str(curr.data)); curr = curr.next
    print("null <-> " + " <-> ".join(parts) + " <-> null")

head = Node(10)
head.next = Node(20); head.next.prev = head
head.next.next = Node(30); head.next.next.prev = head.next
print("Before:", end=" "); print_list(head)
head = delete_by_value(head, 20)
print("After: ", end=" "); print_list(head)`;

export const dllDeleteByValueJava = `public class DoublyLinkedList {
    static class Node {
        int data; Node prev, next;
        Node(int val) { data = val; }
    }

    static Node deleteByValue(Node head, int val) {
        if (head == null) return null;
        if (head.data == val) {
            Node newHead = head.next;
            if (newHead != null) newHead.prev = null;
            return newHead;
        }
        Node curr = head;
        while (curr != null && curr.data != val) curr = curr.next;
        if (curr == null) return head;        // not found
        if (curr.prev != null) curr.prev.next = curr.next;
        if (curr.next != null) curr.next.prev = curr.prev;
        return head;
    }

    static void printList(Node head) {
        System.out.print("null <-> ");
        while (head != null) { System.out.print(head.data); if (head.next != null) System.out.print(" <-> "); head = head.next; }
        System.out.println(" <-> null");
    }

    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(20); head.next.prev = head;
        head.next.next = new Node(30); head.next.next.prev = head.next;
        System.out.print("Before: "); printList(head);
        head = deleteByValue(head, 20);
        System.out.print("After:  "); printList(head);
    }
}`;

export const dllDeleteByValueJS = `class Node {
  constructor(val) { this.data = val; this.prev = null; this.next = null; }
}

function deleteByValue(head, val) {
  if (!head) return null;
  if (head.data === val) {
    const newHead = head.next;
    if (newHead) newHead.prev = null;
    return newHead;
  }
  let curr = head;
  while (curr && curr.data !== val) curr = curr.next;
  if (!curr) return head;             // value not found
  if (curr.prev) curr.prev.next = curr.next; // bypass node
  if (curr.next) curr.next.prev = curr.prev; // bypass back
  return head;
}

function printList(head) {
  const parts = [];
  let curr = head;
  while (curr) { parts.push(curr.data); curr = curr.next; }
  console.log("null <-> " + parts.join(" <-> ") + " <-> null");
}

let head = new Node(10);
head.next = new Node(20); head.next.prev = head;
head.next.next = new Node(30); head.next.next.prev = head.next;
console.log("Before:"); printList(head);
head = deleteByValue(head, 20);
console.log("After:"); printList(head);`;