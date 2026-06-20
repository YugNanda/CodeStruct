export const segmentTreeCPP = `#include <vector>
#include <iostream>

using namespace std;

class SegmentTree {
private:
    vector<int> tree;
    vector<int> data;
    int n;

    void build(int node, int start, int end) {
        if (start == end) {
            tree[node] = data[start];
            return;
        }
        int mid = start + (end - start) / 2;
        int leftChild = 2 * node + 1;
        int rightChild = 2 * node + 2;
        
        build(leftChild, start, mid);
        build(rightChild, mid + 1, end);
        
        tree[node] = tree[leftChild] + tree[rightChild];
    }

    void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            data[idx] = val;
            tree[node] = val;
            return;
        }
        int mid = start + (end - start) / 2;
        int leftChild = 2 * node + 1;
        int rightChild = 2 * node + 2;
        
        if (idx <= mid) {
            update(leftChild, start, mid, idx, val);
        } else {
            update(rightChild, mid + 1, end, idx, val);
        }
        
        tree[node] = tree[leftChild] + tree[rightChild];
    }

    int query(int node, int start, int end, int L, int R) {
        if (R < start || L > end) {
            return 0; // Return identity value for sum
        }
        if (L <= start && end <= R) {
            return tree[node];
        }
        int mid = start + (end - start) / 2;
        int leftChild = 2 * node + 1;
        int rightChild = 2 * node + 2;
        
        int p1 = query(leftChild, start, mid, L, R);
        int p2 = query(rightChild, mid + 1, end, L, R);
        
        return p1 + p2;
    }

public:
    SegmentTree(const vector<int>& arr) {
        data = arr;
        n = arr.size();
        tree.assign(4 * n, 0);
        if (n > 0) {
            build(0, 0, n - 1);
        }
    }

    void update(int idx, int val) {
        if (n > 0) update(0, 0, n - 1, idx, val);
    }

    int query(int L, int R) {
        if (n == 0) return 0;
        return query(0, 0, n - 1, L, R);
    }
};`;

export const segmentTreeJava = `public class SegmentTree {
    private int[] tree;
    private int[] data;
    private int n;

    public SegmentTree(int[] arr) {
        data = arr;
        n = arr.length;
        tree = new int[4 * n];
        if (n > 0) {
            build(0, 0, n - 1);
        }
    }

    private void build(int node, int start, int end) {
        if (start == end) {
            tree[node] = data[start];
            return;
        }
        int mid = start + (end - start) / 2;
        int leftChild = 2 * node + 1;
        int rightChild = 2 * node + 2;
        
        build(leftChild, start, mid);
        build(rightChild, mid + 1, end);
        
        tree[node] = tree[leftChild] + tree[rightChild];
    }

    public void update(int idx, int val) {
        if (n > 0) update(0, 0, n - 1, idx, val);
    }

    private void update(int node, int start, int end, int idx, int val) {
        if (start == end) {
            data[idx] = val;
            tree[node] = val;
            return;
        }
        int mid = start + (end - start) / 2;
        int leftChild = 2 * node + 1;
        int rightChild = 2 * node + 2;
        
        if (idx <= mid) {
            update(leftChild, start, mid, idx, val);
        } else {
            update(rightChild, mid + 1, end, idx, val);
        }
        
        tree[node] = tree[leftChild] + tree[rightChild];
    }

    public int query(int L, int R) {
        if (n == 0) return 0;
        return query(0, 0, n - 1, L, R);
    }

    private int query(int node, int start, int end, int L, int R) {
        if (R < start || L > end) {
            return 0; // Return identity value for sum
        }
        if (L <= start && end <= R) {
            return tree[node];
        }
        int mid = start + (end - start) / 2;
        int leftChild = 2 * node + 1;
        int rightChild = 2 * node + 2;
        
        int p1 = query(leftChild, start, mid, L, R);
        int p2 = query(rightChild, mid + 1, end, L, R);
        
        return p1 + p2;
    }
}`;

export const segmentTreePython = `class SegmentTree:
    def __init__(self, arr):
        self.data = arr
        self.n = len(arr)
        self.tree = [0] * (4 * self.n)
        if self.n > 0:
            self.build(0, 0, self.n - 1)

    def build(self, node, start, end):
        if start == end:
            self.tree[node] = self.data[start]
            return
        mid = start + (end - start) // 2
        left_child = 2 * node + 1
        right_child = 2 * node + 2
        
        self.build(left_child, start, mid)
        self.build(right_child, mid + 1, end)
        
        self.tree[node] = self.tree[left_child] + self.tree[right_child]

    def update(self, idx, val):
        if self.n > 0:
            self._update(0, 0, self.n - 1, idx, val)

    def _update(self, node, start, end, idx, val):
        if start == end:
            self.data[idx] = val
            self.tree[node] = val
            return
        mid = start + (end - start) // 2
        left_child = 2 * node + 1
        right_child = 2 * node + 2
        
        if idx <= mid:
            self._update(left_child, start, mid, idx, val)
        else:
            self._update(right_child, mid + 1, end, idx, val)
        
        self.tree[node] = self.tree[left_child] + self.tree[right_child]

    def query(self, L, R):
        if self.n == 0:
            return 0
        return self._query(0, 0, self.n - 1, L, R)

    def _query(self, node, start, end, L, R):
        if R < start or L > end:
            return 0  # Return identity value for sum
        if L <= start and end <= R:
            return self.tree[node]
        
        mid = start + (end - start) // 2
        left_child = 2 * node + 1
        right_child = 2 * node + 2
        
        p1 = self._query(left_child, start, mid, L, R)
        p2 = self._query(right_child, mid + 1, end, L, R)
        
        return p1 + p2`;

export const segmentTreeJS = `class SegmentTree {
    constructor(arr) {
        this.data = [...arr];
        this.n = arr.length;
        this.tree = new Array(4 * this.n).fill(0);
        if (this.n > 0) {
            this.build(0, 0, this.n - 1);
        }
    }

    build(node, start, end) {
        if (start === end) {
            this.tree[node] = this.data[start];
            return;
        }
        const mid = Math.floor((start + end) / 2);
        const leftChild = 2 * node + 1;
        const rightChild = 2 * node + 2;
        
        this.build(leftChild, start, mid);
        this.build(rightChild, mid + 1, end);
        
        this.tree[node] = this.tree[leftChild] + this.tree[rightChild];
    }

    update(idx, val) {
        if (this.n > 0) {
            this._update(0, 0, this.n - 1, idx, val);
        }
    }

    _update(node, start, end, idx, val) {
        if (start === end) {
            this.data[idx] = val;
            this.tree[node] = val;
            return;
        }
        const mid = Math.floor((start + end) / 2);
        const leftChild = 2 * node + 1;
        const rightChild = 2 * node + 2;
        
        if (idx <= mid) {
            this._update(leftChild, start, mid, idx, val);
        } else {
            this._update(rightChild, mid + 1, end, idx, val);
        }
        
        this.tree[node] = this.tree[leftChild] + this.tree[rightChild];
    }

    query(L, R) {
        if (this.n === 0) return 0;
        return this._query(0, 0, this.n - 1, L, R);
    }

    _query(node, start, end, L, R) {
        if (R < start || L > end) {
            return 0; // Return identity value for sum
        }
        if (L <= start && end <= R) {
            return this.tree[node];
        }
        
        const mid = Math.floor((start + end) / 2);
        const leftChild = 2 * node + 1;
        const rightChild = 2 * node + 2;
        
        const p1 = this._query(leftChild, start, mid, L, R);
        const p2 = this._query(rightChild, mid + 1, end, L, R);
        
        return p1 + p2;
    }
}`;
