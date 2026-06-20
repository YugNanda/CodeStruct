// BFS code snippets for the code panel.
// The actual visualization logic is embedded in BFSVisualizerPage.jsx
// to tightly couple with the graph state (same approach as DFS).

export const bfsCPP = `#include <iostream>
#include <vector>
#include <queue>

using namespace std;

// BFS on a Graph (Adjacency List)

void bfs(int start, const vector<vector<int>>& adj, int V) {
    vector<bool> visited(V, false);
    queue<int> q;

    visited[start] = true;
    q.push(start);

    cout << "BFS Traversal: ";
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        cout << u << " ";

        for (int v : adj[u]) {
            if (!visited[v]) {
                visited[v] = true;
                q.push(v);
            }
        }
    }
    cout << endl;
}

int main() {
    int V, E;
    cout << "Enter V and E: ";
    cin >> V >> E;

    vector<vector<int>> adj(V);

    cout << "Enter edges (u v):" << endl;
    for (int i = 0; i < E; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u); // Undirected
    }

    bfs(0, adj, V);

    return 0;
}`;

export const bfsJava = `import java.util.*;

public class Main {
    // BFS on a Graph (Adjacency List)

    public static void bfs(int start, ArrayList<ArrayList<Integer>> adj, int V) {
        boolean[] visited = new boolean[V];
        Queue<Integer> queue = new LinkedList<>();

        visited[start] = true;
        queue.add(start);

        System.out.print("BFS Traversal: ");
        while (!queue.isEmpty()) {
            int u = queue.poll();
            System.out.print(u + " ");

            for (int v : adj.get(u)) {
                if (!visited[v]) {
                    visited[v] = true;
                    queue.add(v);
                }
            }
        }
        System.out.println();
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter V and E: ");
        int V = sc.nextInt();
        int E = sc.nextInt();

        ArrayList<ArrayList<Integer>> adj = new ArrayList<>(V);
        for (int i = 0; i < V; i++) adj.add(new ArrayList<>());

        System.out.println("Enter edges (u v):");
        for (int i = 0; i < E; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            adj.get(u).add(v);
            adj.get(v).add(u); // Undirected
        }

        bfs(0, adj, V);
    }
}`;

export const bfsPython = `from collections import deque


def bfs(start, adj, V):
    visited = [False] * V
    queue = deque([start])
    visited[start] = True

    print("BFS Traversal: ", end="")
    while queue:
        u = queue.popleft()
        print(u, end=" ")

        for v in adj[u]:
            if not visited[v]:
                visited[v] = True
                queue.append(v)
    print()


def main():
    V, E = map(int, input("Enter V and E: ").split())

    adj = [[] for _ in range(V)]

    print("Enter edges (u v):")
    for _ in range(E):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)  # Undirected

    bfs(0, adj, V)


if __name__ == "__main__":
    main()`;

export const bfsJS = `// BFS (Breadth-First Search) Implementation in JavaScript
function bfs(start, adj, V) {
    const visited = new Array(V).fill(false);
    const queue = [start];
    const result = [];

    visited[start] = true;

    while (queue.length > 0) {
        const u = queue.shift();
        result.push(u);

        for (const v of adj[u]) {
            if (!visited[v]) {
                visited[v] = true;
                queue.push(v);
            }
        }
    }

    return result;
}

// Example usage
const V = 5; // Number of vertices
const adj = Array.from({ length: V }, () => []);

// Add edges (undirected graph)
const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4]];
edges.forEach(([u, v]) => {
    adj[u].push(v);
    adj[v].push(u);
});

const traversal = bfs(0, adj, V);
console.log("BFS Traversal:", traversal.join(" "));`;
