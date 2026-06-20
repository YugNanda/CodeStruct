// --- C++ Snippets ---
export const stackPushPopCPP = `#include <iostream>
#include <stack>
using namespace std;

int main() {
    stack<int> stk;

    // Push operations
    stk.push(10);
    cout << "Pushed: 10" << endl;
    stk.push(20);
    cout << "Pushed: 20" << endl;
    stk.push(30);
    cout << "Pushed: 30" << endl;

    cout << "Stack size: " << stk.size() << endl;
    cout << "Top element: " << stk.top() << endl;

    // Pop operations
    while (!stk.empty()) {
        cout << "Popped: " << stk.top() << endl;
        stk.pop();
    }

    cout << "Stack is empty: " << (stk.empty() ? "Yes" : "No") << endl;
    return 0;
}`;

export const stackArrayCPP = `#include <iostream>
using namespace std;

#define MAX_SIZE 100

class Stack {
private:
    int arr[MAX_SIZE];
    int top;

public:
    Stack() { top = -1; }

    bool isEmpty() { return top == -1; }

    bool isFull() { return top == MAX_SIZE - 1; }

    void push(int value) {
        if (isFull()) {
            cout << "Stack Overflow!" << endl;
            return;
        }
        arr[++top] = value;
        cout << "Pushed: " << value << endl;
    }

    int pop() {
        if (isEmpty()) {
            cout << "Stack Underflow!" << endl;
            return -1;
        }
        int value = arr[top--];
        cout << "Popped: " << value << endl;
        return value;
    }

    int peek() {
        if (isEmpty()) {
            cout << "Stack is empty!" << endl;
            return -1;
        }
        return arr[top];
    }

    int size() { return top + 1; }
};

int main() {
    Stack stk;
    stk.push(10);
    stk.push(20);
    stk.push(30);
    
    cout << "Top: " << stk.peek() << endl;
    cout << "Size: " << stk.size() << endl;
    
    stk.pop();
    stk.pop();
    stk.pop();
    
    return 0;
}`;

// --- Java Snippets ---
export const stackPushPopJava = `import java.util.Stack;

public class StackDemo {
    public static void main(String[] args) {
        Stack<Integer> stack = new Stack<>();

        // Push operations
        stack.push(10);
        System.out.println("Pushed: 10");
        stack.push(20);
        System.out.println("Pushed: 20");
        stack.push(30);
        System.out.println("Pushed: 30");

        System.out.println("Stack size: " + stack.size());
        System.out.println("Top element: " + stack.peek());

        // Pop operations
        while (!stack.isEmpty()) {
            System.out.println("Popped: " + stack.pop());
        }

        System.out.println("Stack is empty: " + stack.isEmpty());
    }
}`;

export const stackArrayJava = `public class StackArray {
    private int[] arr;
    private int top;
    private int capacity;

    public StackArray(int size) {
        arr = new int[size];
        capacity = size;
        top = -1;
    }

    public boolean isEmpty() {
        return top == -1;
    }

    public boolean isFull() {
        return top == capacity - 1;
    }

    public void push(int value) {
        if (isFull()) {
            System.out.println("Stack Overflow!");
            return;
        }
        arr[++top] = value;
        System.out.println("Pushed: " + value);
    }

    public int pop() {
        if (isEmpty()) {
            System.out.println("Stack Underflow!");
            return -1;
        }
        int value = arr[top--];
        System.out.println("Popped: " + value);
        return value;
    }

    public int peek() {
        if (isEmpty()) {
            System.out.println("Stack is empty!");
            return -1;
        }
        return arr[top];
    }

    public int size() {
        return top + 1;
    }

    public static void main(String[] args) {
        StackArray stack = new StackArray(100);
        stack.push(10);
        stack.push(20);
        stack.push(30);
        
        System.out.println("Top: " + stack.peek());
        System.out.println("Size: " + stack.size());
        
        stack.pop();
        stack.pop();
        stack.pop();
    }
}`;

// --- Python Snippets ---
export const stackPushPopPython = `# Using Python list as a stack
stack = []

# Push operations
stack.append(10)
print("Pushed: 10")
stack.append(20)
print("Pushed: 20")
stack.append(30)
print("Pushed: 30")

print(f"Stack size: {len(stack)}")
print(f"Top element: {stack[-1]}")

# Pop operations
while stack:
    print(f"Popped: {stack.pop()}")

print(f"Stack is empty: {len(stack) == 0}")`;

export const stackArrayPython = `class Stack:
    def __init__(self, max_size=100):
        self.arr = [None] * max_size
        self.top = -1
        self.max_size = max_size

    def is_empty(self):
        return self.top == -1

    def is_full(self):
        return self.top == self.max_size - 1

    def push(self, value):
        if self.is_full():
            print("Stack Overflow!")
            return
        self.top += 1
        self.arr[self.top] = value
        print(f"Pushed: {value}")

    def pop(self):
        if self.is_empty():
            print("Stack Underflow!")
            return None
        value = self.arr[self.top]
        self.top -= 1
        print(f"Popped: {value}")
        return value

    def peek(self):
        if self.is_empty():
            print("Stack is empty!")
            return None
        return self.arr[self.top]

    def size(self):
        return self.top + 1


if __name__ == "__main__":
    stack = Stack()
    stack.push(10)
    stack.push(20)
    stack.push(30)
    
    print(f"Top: {stack.peek()}")
    print(f"Size: {stack.size()}")
    
    stack.pop()
    stack.pop()
    stack.pop()`;

// --- JavaScript Snippets ---
export const stackPushPopJS = `// Using JavaScript array as a stack
const stack = [];

// Push operations
stack.push(10);
console.log("Pushed: 10");
stack.push(20);
console.log("Pushed: 20");
stack.push(30);
console.log("Pushed: 30");

console.log(\`Stack size: \${stack.length}\`);
console.log(\`Top element: \${stack[stack.length - 1]}\`);

// Pop operations
while (stack.length > 0) {
  console.log(\`Popped: \${stack.pop()}\`);
}

console.log(\`Stack is empty: \${stack.length === 0}\`);`;

export const stackArrayJS = `class Stack {
  constructor(maxSize = 100) {
    this.arr = new Array(maxSize);
    this.top = -1;
    this.maxSize = maxSize;
  }

  isEmpty() {
    return this.top === -1;
  }

  isFull() {
    return this.top === this.maxSize - 1;
  }

  push(value) {
    if (this.isFull()) {
      console.log("Stack Overflow!");
      return;
    }
    this.arr[++this.top] = value;
    console.log(\`Pushed: \${value}\`);
  }

  pop() {
    if (this.isEmpty()) {
      console.log("Stack Underflow!");
      return null;
    }
    const value = this.arr[this.top--];
    console.log(\`Popped: \${value}\`);
    return value;
  }

  peek() {
    if (this.isEmpty()) {
      console.log("Stack is empty!");
      return null;
    }
    return this.arr[this.top];
  }

  size() {
    return this.top + 1;
  }
}

// Usage
const stack = new Stack();
stack.push(10);
stack.push(20);
stack.push(30);

console.log(\`Top: \${stack.peek()}\`);
console.log(\`Size: \${stack.size()}\`);

stack.pop();
stack.pop();
stack.pop();`;
