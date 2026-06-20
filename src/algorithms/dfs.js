// This file is now primarily serving as the source for the code snippets.
// The actual visualization logic for the Graph DFS is currently embedded in
// GraphVisualizerPage.jsx to tightly couple with the graph state.
// However, we can export the standard C++ / Java implementations here.

export const dfsCPP = `#include <iostream>
#include <vector>

using namespace std;

// DFS on a Graph (Adjacency List)

void dfs(int u, const vector<vector<int>>& adj, vector<bool>& visited) {
    visited[u] = true;
    cout << u << " "; // Process node

    for (int v : adj[u]) {
        if (!visited[v]) {
            dfs(v, adj, visited);
        }
    }
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

    vector<bool> visited(V, false);
    cout << "DFS Traversal: ";
    dfs(0, adj, visited);
    cout << endl;

    return 0;
}`;

export const dfsJava = `import java.util.*;

public class Main {
    // DFS on a Graph (Adjacency List)
    
    public static void dfs(int u, ArrayList<ArrayList<Integer>> adj, boolean[] visited) {
        visited[u] = true;
        System.out.print(u + " "); // Process node

        for (int v : adj.get(u)) {
            if(!visited[v]) {
                dfs(v, adj, visited);   
            }
        }
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter V and E: ");
        int V = sc.nextInt();
        int E = sc.nextInt();
        
        ArrayList<ArrayList<Integer>> adj = new ArrayList<>(V);
        for(int i=0; i<V; i++) adj.add(new ArrayList<>());
        
        System.out.println("Enter edges (u v):");
        for (int i = 0; i < E; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            adj.get(u).add(v);
            adj.get(v).add(u); // Undirected
        }

        boolean[] visited = new boolean[V];
        System.out.print("DFS Traversal: ");
        dfs(0, adj, visited);
        System.out.println();
    }
}`;

export const dfsPython = `def dfs(u, adj, visited):
    visited[u] = True
    print(u, end=" ")  # Process node

    for v in adj[u]:
        if not visited[v]:
            dfs(v, adj, visited)


def main():
    V, E = map(int, input("Enter V and E: ").split())
    
    adj = [[] for _ in range(V)]
    
    print("Enter edges (u v):")
    for _ in range(E):
        u, v = map(int, input().split())
        adj[u].append(v)
        adj[v].append(u)  # Undirected
    
    visited = [False] * V
    print("DFS Traversal: ", end="")
    dfs(0, adj, visited)
    print()


if __name__ == "__main__":
    main()`;

export const dfsJS = `// DFS (Depth-First Search) Implementation in JavaScript
function dfs(node, adj, visited, result = []) {
    visited[node] = true;
    result.push(node); // Process node

    for (const neighbor of adj[node]) {
        if (!visited[neighbor]) {
            dfs(neighbor, adj, visited, result);
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

const visited = new Array(V).fill(false);
const traversal = dfs(0, adj, visited);
console.log(\"DFS Traversal:\", traversal.join(\" \"));`;

// The 'dfs' export is kept for compatibility if needed, 
// but is not used by GraphVisualizerPage
export const dfs = async () => { };
