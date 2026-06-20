// --- C++ Snippets ---
export const queueEnqueueDequeueCPP = `#include <iostream>
#include <queue>
using namespace std;

int main() {
    queue<int> q;

    // Enqueue operations
    q.push(10);
    cout << "Enqueued: 10" << endl;
    q.push(20);
    cout << "Enqueued: 20" << endl;
    q.push(30);
    cout << "Enqueued: 30" << endl;

    cout << "Queue size: " << q.size() << endl;
    cout << "Front element: " << q.front() << endl;
    cout << "Rear element: " << q.back() << endl;

    // Dequeue operations
    while (!q.empty()) {
        cout << "Dequeued: " << q.front() << endl;
        q.pop();
    }

    cout << "Queue is empty: " << (q.empty() ? "Yes" : "No") << endl;
    return 0;
}`;

export const queueArrayCPP = `#include <iostream>
using namespace std;

#define MAX_SIZE 100

class Queue {
private:
    int arr[MAX_SIZE];
    int front, rear, count;

public:
    Queue() { front = 0; rear = -1; count = 0; }

    bool isEmpty() { return count == 0; }

    bool isFull() { return count == MAX_SIZE; }

    void enqueue(int value) {
        if (isFull()) {
            cout << "Queue Overflow!" << endl;
            return;
        }
        rear = (rear + 1) % MAX_SIZE;
        arr[rear] = value;
        count++;
        cout << "Enqueued: " << value << endl;
    }

    int dequeue() {
        if (isEmpty()) {
            cout << "Queue Underflow!" << endl;
            return -1;
        }
        int value = arr[front];
        front = (front + 1) % MAX_SIZE;
        count--;
        cout << "Dequeued: " << value << endl;
        return value;
    }

    int peek() {
        if (isEmpty()) {
            cout << "Queue is empty!" << endl;
            return -1;
        }
        return arr[front];
    }

    int size() { return count; }
};

int main() {
    Queue q;
    q.enqueue(10);
    q.enqueue(20);
    q.enqueue(30);

    cout << "Front: " << q.peek() << endl;
    cout << "Size: " << q.size() << endl;

    q.dequeue();
    q.dequeue();
    q.dequeue();

    return 0;
}`;

// --- Java Snippets ---
export const queueEnqueueDequeueJava = `import java.util.LinkedList;
import java.util.Queue;

public class QueueDemo {
    public static void main(String[] args) {
        Queue<Integer> queue = new LinkedList<>();

        // Enqueue operations
        queue.add(10);
        System.out.println("Enqueued: 10");
        queue.add(20);
        System.out.println("Enqueued: 20");
        queue.add(30);
        System.out.println("Enqueued: 30");

        System.out.println("Queue size: " + queue.size());
        System.out.println("Front element: " + queue.peek());

        // Dequeue operations
        while (!queue.isEmpty()) {
            System.out.println("Dequeued: " + queue.poll());
        }

        System.out.println("Queue is empty: " + queue.isEmpty());
    }
}`;

export const queueArrayJava = `public class QueueArray {
    private int[] arr;
    private int front, rear, count, capacity;

    public QueueArray(int size) {
        arr = new int[size];
        capacity = size;
        front = 0;
        rear = -1;
        count = 0;
    }

    public boolean isEmpty() {
        return count == 0;
    }

    public boolean isFull() {
        return count == capacity;
    }

    public void enqueue(int value) {
        if (isFull()) {
            System.out.println("Queue Overflow!");
            return;
        }
        rear = (rear + 1) % capacity;
        arr[rear] = value;
        count++;
        System.out.println("Enqueued: " + value);
    }

    public int dequeue() {
        if (isEmpty()) {
            System.out.println("Queue Underflow!");
            return -1;
        }
        int value = arr[front];
        front = (front + 1) % capacity;
        count--;
        System.out.println("Dequeued: " + value);
        return value;
    }

    public int peek() {
        if (isEmpty()) {
            System.out.println("Queue is empty!");
            return -1;
        }
        return arr[front];
    }

    public int size() {
        return count;
    }

    public static void main(String[] args) {
        QueueArray q = new QueueArray(100);
        q.enqueue(10);
        q.enqueue(20);
        q.enqueue(30);

        System.out.println("Front: " + q.peek());
        System.out.println("Size: " + q.size());

        q.dequeue();
        q.dequeue();
        q.dequeue();
    }
}`;

// --- Python Snippets ---
export const queueEnqueueDequeuePython = `from collections import deque

# Using deque as a queue
queue = deque()

# Enqueue operations
queue.append(10)
print("Enqueued: 10")
queue.append(20)
print("Enqueued: 20")
queue.append(30)
print("Enqueued: 30")

print(f"Queue size: {len(queue)}")
print(f"Front element: {queue[0]}")
print(f"Rear element: {queue[-1]}")

# Dequeue operations
while queue:
    print(f"Dequeued: {queue.popleft()}")

print(f"Queue is empty: {len(queue) == 0}")`;

export const queueArrayPython = `class Queue:
    def __init__(self, max_size=100):
        self.arr = [None] * max_size
        self.front = 0
        self.rear = -1
        self.count = 0
        self.max_size = max_size

    def is_empty(self):
        return self.count == 0

    def is_full(self):
        return self.count == self.max_size

    def enqueue(self, value):
        if self.is_full():
            print("Queue Overflow!")
            return
        self.rear = (self.rear + 1) % self.max_size
        self.arr[self.rear] = value
        self.count += 1
        print(f"Enqueued: {value}")

    def dequeue(self):
        if self.is_empty():
            print("Queue Underflow!")
            return None
        value = self.arr[self.front]
        self.front = (self.front + 1) % self.max_size
        self.count -= 1
        print(f"Dequeued: {value}")
        return value

    def peek(self):
        if self.is_empty():
            print("Queue is empty!")
            return None
        return self.arr[self.front]

    def size(self):
        return self.count


if __name__ == "__main__":
    q = Queue()
    q.enqueue(10)
    q.enqueue(20)
    q.enqueue(30)

    print(f"Front: {q.peek()}")
    print(f"Size: {q.size()}")

    q.dequeue()
    q.dequeue()
    q.dequeue()`;

// --- JavaScript Snippets ---
export const queueEnqueueDequeueJS = `// Using JavaScript array as a queue
const queue = [];

// Enqueue operations
queue.push(10);
console.log("Enqueued: 10");
queue.push(20);
console.log("Enqueued: 20");
queue.push(30);
console.log("Enqueued: 30");

console.log(\`Queue size: \${queue.length}\`);
console.log(\`Front element: \${queue[0]}\`);
console.log(\`Rear element: \${queue[queue.length - 1]}\`);

// Dequeue operations (shift removes from front)
while (queue.length > 0) {
  console.log(\`Dequeued: \${queue.shift()}\`);
}

console.log(\`Queue is empty: \${queue.length === 0}\`);`;

export const queueArrayJS = `class Queue {
  constructor(maxSize = 100) {
    this.arr = new Array(maxSize);
    this.front = 0;
    this.rear = -1;
    this.count = 0;
    this.maxSize = maxSize;
  }

  isEmpty() {
    return this.count === 0;
  }

  isFull() {
    return this.count === this.maxSize;
  }

  enqueue(value) {
    if (this.isFull()) {
      console.log("Queue Overflow!");
      return;
    }
    this.rear = (this.rear + 1) % this.maxSize;
    this.arr[this.rear] = value;
    this.count++;
    console.log(\`Enqueued: \${value}\`);
  }

  dequeue() {
    if (this.isEmpty()) {
      console.log("Queue Underflow!");
      return null;
    }
    const value = this.arr[this.front];
    this.front = (this.front + 1) % this.maxSize;
    this.count--;
    console.log(\`Dequeued: \${value}\`);
    return value;
  }

  peek() {
    if (this.isEmpty()) {
      console.log("Queue is empty!");
      return null;
    }
    return this.arr[this.front];
  }

  size() {
    return this.count;
  }
}

// Usage
const q = new Queue();
q.enqueue(10);
q.enqueue(20);
q.enqueue(30);

console.log(\`Front: \${q.peek()}\`);
console.log(\`Size: \${q.size()}\`);

q.dequeue();
q.dequeue();
q.dequeue();`;
