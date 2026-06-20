export const topologicalSortCPP = `#include <iostream>
#include <vector>
#include <queue>

using namespace std;

// Topological Sort using Kahn's Algorithm
vector<int> topologicalSort(int V, vector<vector<int>>& adj) {
    vector<int> inDegree(V, 0);
    
    // Calculate in-degrees
    for (int u = 0; u < V; u++) {
        for (int v : adj[u]) {
            inDegree[v]++;
        }
    }
    
    queue<int> q;
    // Enqueue nodes with 0 in-degree
    for (int i = 0; i < V; i++) {
        if (inDegree[i] == 0) {
            q.push(i);
        }
    }
    
    vector<int> topoOrder;
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        topoOrder.push_back(u);
        
        // Decrease in-degree of adjacent nodes
        for (int v : adj[u]) {
            inDegree[v]--;
            if (inDegree[v] == 0) {
                q.push(v);
            }
        }
    }
    
    return topoOrder;
}

int main() {
    int V, E;
    cout << "Enter V and E: ";
    cin >> V >> E;

    vector<vector<int>> adj(V);
    cout << "Enter directed edges (u v):\\n";
    for (int i = 0; i < E; i++) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
    }

    vector<int> result = topologicalSort(V, adj);
    
    if (result.size() != V) {
        cout << "Graph has a cycle! Topological sort not possible.\\n";
    } else {
        cout << "Topological Sort: ";
        for (int node : result) {
            cout << node << " ";
        }
        cout << endl;
    }

    return 0;
}`;

export const topologicalSortJava = `import java.util.*;

public class Main {
    // Topological Sort using Kahn's Algorithm
    public static List<Integer> topologicalSort(int V, ArrayList<ArrayList<Integer>> adj) {
        int[] inDegree = new int[V];
        
        // Calculate in-degrees
        for (int u = 0; u < V; u++) {
            for (int v : adj.get(u)) {
                inDegree[v]++;
            }
        }
        
        Queue<Integer> q = new LinkedList<>();
        // Enqueue nodes with 0 in-degree
        for (int i = 0; i < V; i++) {
            if (inDegree[i] == 0) {
                q.add(i);
            }
        }
        
        List<Integer> topoOrder = new ArrayList<>();
        while (!q.isEmpty()) {
            int u = q.poll();
            topoOrder.add(u);
            
            // Decrease in-degree of adjacent nodes
            for (int v : adj.get(u)) {
                inDegree[v]--;
                if (inDegree[v] == 0) {
                    q.add(v);
                }
            }
        }
        
        return topoOrder;
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter V and E: ");
        int V = sc.nextInt();
        int E = sc.nextInt();
        
        ArrayList<ArrayList<Integer>> adj = new ArrayList<>(V);
        for(int i=0; i<V; i++) adj.add(new ArrayList<>());
        
        System.out.println("Enter directed edges (u v):");
        for (int i = 0; i < E; i++) {
            int u = sc.nextInt();
            int v = sc.nextInt();
            adj.get(u).add(v);
        }

        List<Integer> result = topologicalSort(V, adj);
        
        if (result.size() != V) {
            System.out.println("Graph has a cycle! Topological sort not possible.");
        } else {
            System.out.print("Topological Sort: ");
            for (int node : result) {
                System.out.print(node + " ");
            }
            System.out.println();
        }
    }
}`;

export const topologicalSortPython = `from collections import deque

def topological_sort(V, adj):
    in_degree = [0] * V
    
    # Calculate in-degrees
    for u in range(V):
        for v in adj[u]:
            in_degree[v] += 1
            
    q = deque()
    # Enqueue nodes with 0 in-degree
    for i in range(V):
        if in_degree[i] == 0:
            q.append(i)
            
    topo_order = []
    while q:
        u = q.popleft()
        topo_order.append(u)
        
        # Decrease in-degree of adjacent nodes
        for v in adj[u]:
            in_degree[v] -= 1
            if in_degree[v] == 0:
                q.append(v)
                
    return topo_order

def main():
    V, E = map(int, input("Enter V and E: ").split())
    
    adj = [[] for _ in range(V)]
    
    print("Enter directed edges (u v):")
    for _ in range(E):
        u, v = map(int, input().split())
        adj[u].append(v)
    
    result = topological_sort(V, adj)
    
    if len(result) != V:
        print("Graph has a cycle! Topological sort not possible.")
    else:
        print("Topological Sort: " + " ".join(map(str, result)))

if __name__ == "__main__":
    main()`;

export const topologicalSortJS = `// Topological Sort (Kahn's Algorithm) Implementation in JavaScript
function topologicalSort(V, adj) {
    const inDegree = new Array(V).fill(0);
    
    // Calculate in-degrees
    for (let u = 0; u < V; u++) {
        for (const v of adj[u]) {
            inDegree[v]++;
        }
    }
    
    const q = [];
    // Enqueue nodes with 0 in-degree
    for (let i = 0; i < V; i++) {
        if (inDegree[i] === 0) {
            q.push(i);
        }
    }
    
    const topoOrder = [];
    while (q.length > 0) {
        const u = q.shift();
        topoOrder.push(u);
        
        // Decrease in-degree of adjacent nodes
        for (const v of adj[u]) {
            inDegree[v]--;
            if (inDegree[v] === 0) {
                q.push(v);
            }
        }
    }
    
    return topoOrder;
}

// Example usage
const V = 6; // Number of vertices
const adj = Array.from({ length: V }, () => []);

// Add directed edges
const edges = [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]];
edges.forEach(([u, v]) => {
    adj[u].push(v);
});

const result = topologicalSort(V, adj);
if (result.length !== V) {
    console.log("Graph has a cycle! Topological sort not possible.");
} else {
    console.log("Topological Sort:", result.join(" "));
}
`;

export const topologicalSort = async () => { };
