// --- C++ Snippets ---
export const reverseLinkedListCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int value) {
        data = value;
        next = nullptr;
    }
};

Node* reverseList(Node* head) {
    Node* prev = nullptr;
    Node* curr = head;

    while (curr != nullptr) {
        Node* nextNode = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextNode;
    }

    return prev;
}

void printList(Node* head) {
    Node* temp = head;
    while (temp != nullptr) {
        cout << temp->data;
        if (temp->next != nullptr) cout << " -> ";
        temp = temp->next;
    }
    cout << "\\n";
}

int main() {
    Node* head = new Node(10);
    head->next = new Node(20);
    head->next->next = new Node(30);
    head->next->next->next = new Node(40);

    cout << "Original: ";
    printList(head);

    head = reverseList(head);

    cout << "Reversed: ";
    printList(head);
    return 0;
}`;

export const middleNodeCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int value) {
        data = value;
        next = nullptr;
    }
};

Node* findMiddle(Node* head) {
    if (head == nullptr) return nullptr;

    Node* slow = head;
    Node* fast = head;

    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }

    return slow;
}

int main() {
    Node* head = new Node(1);
    head->next = new Node(3);
    head->next->next = new Node(5);
    head->next->next->next = new Node(7);
    head->next->next->next->next = new Node(9);

    Node* middle = findMiddle(head);
    if (middle != nullptr) {
        cout << "Middle node value: " << middle->data << "\\n";
    }
    return 0;
}`;

// --- Python Snippets ---
export const reverseLinkedListPython = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def reverse_list(head):
    prev = None
    curr = head
    while curr:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node
    return prev

def print_list(head):
    temp = head
    while temp:
        print(temp.data, end=" -> " if temp.next else "")
        temp = temp.next
    print()

if __name__ == "__main__":
    head = Node(10)
    head.next = Node(20)
    head.next.next = Node(30)
    
    print("Original:", end=" ")
    print_list(head)
    
    head = reverse_list(head)
    
    print("Reversed:", end=" ")
    print_list(head)`;

export const middleNodePython = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def find_middle(head):
    slow = head
    fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    return slow

if __name__ == "__main__":
    head = Node(1)
    head.next = Node(2)
    head.next.next = Node(3)
    head.next.next.next = Node(4)
    head.next.next.next.next = Node(5)
    
    middle = find_middle(head)
    if middle:
        print("Middle node value:", middle.data)`;

// --- Java Snippets ---
export const reverseLinkedListJava = `class Node {
    int data;
    Node next;
    Node(int data) {
        this.data = data;
        this.next = null;
    }
}

public class Main {
    public static Node reverseList(Node head) {
        Node prev = null;
        Node current = head;
        Node next = null;
        
        while (current != null) {
            next = current.next;
            current.next = prev;
            prev = current;
            current = next;
        }
        return prev;
    }

    public static void main(String[] args) {
        Node head = new Node(10);
        head.next = new Node(20);
        head.next.next = new Node(30);
        
        head = reverseList(head);
        // List is now reversed
    }
}`;

export const middleNodeJava = `class Node {
    int data;
    Node next;
    Node(int data) {
        this.data = data;
        this.next = null;
    }
}

public class Main {
    public static Node findMiddle(Node head) {
        Node slow = head;
        Node fast = head;
        
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        return slow;
    }

    public static void main(String[] args) {
        Node head = new Node(1);
        head.next = new Node(2);
        head.next.next = new Node(3);
        
        Node middle = findMiddle(head);
        System.out.println("Middle Node: " + middle.data);
    }
}`;

// --- JavaScript Snippets ---
export const reverseLinkedListJS = `// Reverse Linked List Implementation in JavaScript
class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

function reverseList(head) {
    let prev = null;
    let curr = head;

    while (curr !== null) {
        const nextNode = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nextNode;
    }

    return prev;
}

function printList(head) {
    const result = [];
    let temp = head;
    while (temp !== null) {
        result.push(temp.data);
        temp = temp.next;
    }
    console.log(result.join(\" -> \"));
}

// Example usage
let head = new Node(10);
head.next = new Node(20);
head.next.next = new Node(30);
head.next.next.next = new Node(40);

console.log(\"Original:\");
printList(head);

head = reverseList(head);

console.log(\"Reversed:\");
printList(head);`;

export const middleNodeJS = `// Find Middle Node Implementation in JavaScript
class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

function findMiddle(head) {
    if (head === null) return null;

    let slow = head;
    let fast = head;

    while (fast !== null && fast.next !== null) {
        slow = slow.next;
        fast = fast.next.next;
    }

    return slow;
}

// Example usage
const head = new Node(1);
head.next = new Node(3);
head.next.next = new Node(5);
head.next.next.next = new Node(7);
head.next.next.next.next = new Node(9);

const middle = findMiddle(head);
if (middle !== null) {
    console.log(\"Middle node value:\", middle.data);
}`;

export const floydCycleDetectionCPP = `#include <iostream>
using namespace std;

struct Node {
    int data;
    Node* next;
    Node(int value) {
        data = value;
        next = nullptr;
    }
};

// Phase 1: Detect if a cycle exists
// Phase 2: Find the start node of the cycle
Node* detectCycle(Node* head) {
    if (head == nullptr || head->next == nullptr)
        return nullptr;

    Node* slow = head;
    Node* fast = head;

    // Phase 1 — Move slow by 1, fast by 2
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;

        if (slow == fast) {
            // Cycle detected! Now find the start.
            // Phase 2 — Reset slow to head, move both by 1
            slow = head;
            while (slow != fast) {
                slow = slow->next;
                fast = fast->next;
            }
            return slow; // Cycle start node
        }
    }

    return nullptr; // No cycle
}

void printList(Node* head, int limit = 20) {
    Node* temp = head;
    int count = 0;
    while (temp != nullptr && count < limit) {
        cout << temp->data;
        if (temp->next != nullptr && count + 1 < limit)
            cout << " -> ";
        temp = temp->next;
        count++;
    }
    cout << "\\n";
}

int main() {
    // Create: 1 -> 2 -> 3 -> 4 -> 5 -> (back to 3)
    Node* head = new Node(1);
    head->next = new Node(2);
    head->next->next = new Node(3);
    head->next->next->next = new Node(4);
    head->next->next->next->next = new Node(5);
    head->next->next->next->next->next = head->next->next; // cycle at node 3

    Node* cycleStart = detectCycle(head);
    if (cycleStart != nullptr)
        cout << "Cycle starts at node with value: " << cycleStart->data << "\\n";
    else
        cout << "No cycle detected.\\n";

    return 0;
}`;

// --- Floyd's Cycle Detection: Python ---
export const floydCycleDetectionPython = `class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def detect_cycle(head):
    """
    Floyd's Cycle Detection (Tortoise and Hare)
    Phase 1: slow moves 1 step, fast moves 2 steps.
              If they meet → cycle exists.
    Phase 2: Reset slow to head, advance both by 1.
              Meeting point = cycle start.
    """
    if head is None or head.next is None:
        return None

    slow = head
    fast = head

    # Phase 1 — Detect cycle
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

        if slow == fast:
            # Phase 2 — Find cycle start
            slow = head
            while slow != fast:
                slow = slow.next
                fast = fast.next
            return slow  # cycle start node

    return None  # no cycle

if __name__ == "__main__":
    # Create: 1 -> 2 -> 3 -> 4 -> 5 -> (back to 3)
    head = Node(1)
    head.next = Node(2)
    head.next.next = Node(3)
    head.next.next.next = Node(4)
    head.next.next.next.next = Node(5)
    head.next.next.next.next.next = head.next.next  # cycle

    result = detect_cycle(head)
    if result:
        print("Cycle starts at node with value:", result.data)
    else:
        print("No cycle detected.")`;

// --- Floyd's Cycle Detection: Java ---
export const floydCycleDetectionJava = `class Node {
    int data;
    Node next;
    Node(int data) {
        this.data = data;
        this.next = null;
    }
}

public class Main {
    /**
     * Floyd's Cycle Detection Algorithm
     * Phase 1: slow moves 1 step, fast moves 2 steps → detect meeting
     * Phase 2: reset slow to head → both move 1 step → meeting = cycle start
     */
    public static Node detectCycle(Node head) {
        if (head == null || head.next == null) return null;

        Node slow = head;
        Node fast = head;

        // Phase 1
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;

            if (slow == fast) {
                // Phase 2
                slow = head;
                while (slow != fast) {
                    slow = slow.next;
                    fast = fast.next;
                }
                return slow;
            }
        }
        return null;
    }

    public static void main(String[] args) {
        // 1 -> 2 -> 3 -> 4 -> 5 -> back to 3
        Node head = new Node(1);
        head.next = new Node(2);
        head.next.next = new Node(3);
        head.next.next.next = new Node(4);
        head.next.next.next.next = new Node(5);
        head.next.next.next.next.next = head.next.next;

        Node cycleStart = detectCycle(head);
        if (cycleStart != null)
            System.out.println("Cycle starts at: " + cycleStart.data);
        else
            System.out.println("No cycle detected.");
    }
}`;

// --- Floyd's Cycle Detection: JavaScript ---
export const floydCycleDetectionJS = `// Floyd's Cycle Detection — Tortoise & Hare Algorithm
class Node {
    constructor(data) {
        this.data = data;
        this.next = null;
    }
}

/**
 * Phase 1: slow moves 1 step, fast moves 2 steps.
 *          If they meet → cycle exists.
 * Phase 2: Reset slow to head, both move 1 step.
 *          Meeting point is the cycle start.
 */
function detectCycle(head) {
    if (head === null || head.next === null) return null;

    let slow = head;
    let fast = head;

    // Phase 1 — Cycle detection
    while (fast !== null && fast.next !== null) {
        slow = slow.next;
        fast = fast.next.next;

        if (slow === fast) {
            // Phase 2 — Find cycle start
            slow = head;
            while (slow !== fast) {
                slow = slow.next;
                fast = fast.next;
            }
            return slow;
        }
    }
    return null;
}

// Example: 1 -> 2 -> 3 -> 4 -> 5 -> back to 3
const head = new Node(1);
head.next = new Node(2);
head.next.next = new Node(3);
head.next.next.next = new Node(4);
head.next.next.next.next = new Node(5);
head.next.next.next.next.next = head.next.next; // cycle

const cycleStart = detectCycle(head);
if (cycleStart !== null) {
    console.log("Cycle starts at node with value:", cycleStart.data);
} else {
    console.log("No cycle detected.");
}`;