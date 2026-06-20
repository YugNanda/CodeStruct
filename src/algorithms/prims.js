import { sleep } from '../utils/helpers';

export const prims = async (nodes, edges, setGraph, speed, stopSignal, pauseSignal, setStatusMessage) => {
    const n = nodes.length;
    if (n === 0) return;

    let mstNodes = new Set();
    // Start with the first node
    mstNodes.add(0);
    
    // Helper to update state
    const update = () => setGraph({ nodes: [...nodes], edges: [...edges] });

    nodes[0].status = 'processing';
    update();
    await sleep(speed);

    while (mstNodes.size < n) {
        if (stopSignal.current) return;
        while (pauseSignal.current) { 
            if (stopSignal.current) return;
            await sleep(100); 
        }

        let minWeight = Infinity;
        let bestEdge = null;

        // Highlight all edges currently being considered
        for (let edge of edges) {
            const uIn = mstNodes.has(edge.source);
            const vIn = mstNodes.has(edge.target);

            if ((uIn && !vIn) || (!uIn && vIn)) {
                edge.status = 'comparing';
                if (edge.weight < minWeight) {
                    minWeight = edge.weight;
                    bestEdge = edge;
                }
            }
        }
        update();
        await sleep(speed);

        if (bestEdge) {
            const nextNodeId = mstNodes.has(bestEdge.source) ? bestEdge.target : bestEdge.source;
            
            // Add to MST
            mstNodes.add(nextNodeId);
            bestEdge.status = 'traversed';
            nodes[nextNodeId].status = 'visited';
            setStatusMessage(`Added edge with weight ${bestEdge.weight} to MST.`);
            
            // Reset other 'comparing' edges back to default
            edges.forEach(e => { if (e.status === 'comparing') e.status = 'default'; });
            
            update();
            await sleep(speed);
        } else {
            setStatusMessage("Graph is disconnected. MST complete for this component.");
            break;
        }
    }
    return true;
};

export const primsCPP = `void prims(int n, vector<pair<int, int>> adj[]) {
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
    vector<int> key(n, 1e9);
    vector<bool> inMST(n, false);
    pq.push({0, 0}); // {weight, node}
    key[0] = 0;

    while (!pq.empty()) {
        int u = pq.top().second;
        pq.pop();
        if(inMST[u]) continue;
        inMST[u] = true;

        for (auto& edge : adj[u]) {
            int v = edge.first, w = edge.second;
            if (!inMST[v] && w < key[v]) {
                key[v] = w;
                pq.push({key[v], v});
            }
        }
    }
}`;

export const primsJava = `public static void prims(int n, List<List<int[]>> adj) {
    PriorityQueue<int[]> pq = new PriorityQueue<>(Comparator.comparingInt(a -> a[0]));
    int[] key = new int[n];
    boolean[] inMST = new boolean[n];
    Arrays.fill(key, Integer.MAX_VALUE);
    pq.add(new int[]{0, 0});
    key[0] = 0;

    while (!pq.isEmpty()) {
        int u = pq.poll()[1];
        if (inMST[u]) continue;
        inMST[u] = true;
        for (int[] edge : adj.get(u)) {
            if (!inMST[edge[0]] && edge[1] < key[edge[0]]) {
                key[edge[0]] = edge[1];
                pq.add(new int[]{key[edge[0]], edge[0]});
            }
        }
    }
}`;

export const primsPython = `import heapq
def prims(n, adj):
    pq = [(0, 0)] # (weight, node)
    keys = [float('inf')] * n
    in_mst = [False] * n
    keys[0] = 0
    while pq:
        w, u = heapq.heappop(pq)
        if in_mst[u]: continue
        in_mst[u] = True
        for v, weight in adj[u]:
            if not in_mst[v] and weight < keys[v]:
                keys[v] = weight
                heapq.heappush(pq, (keys[v], v))`;

export const primsJS = `function prims(n, adj) {
    const key = Array(n).fill(Infinity);
    const inMST = Array(n).fill(false);
    key[0] = 0;
    for (let count = 0; count < n - 1; count++) {
        let u = -1;
        for (let i = 0; i < n; i++)
            if (!inMST[i] && (u === -1 || key[i] < key[u])) u = i;
        inMST[u] = true;
        for (let v = 0; v < n; v++)
            if (adj[u][v] && !inMST[v] && adj[u][v] < key[v])
                key[v] = adj[u][v];
    }
}`;