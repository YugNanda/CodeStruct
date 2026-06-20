import { sleep } from '../utils/helpers';

/**
 * Standard A* Algorithm
 * f(n) = g(n) + h(n)
 */
export const astar = async (
    grid, 
    startNodePos, 
    endNodePos, 
    setGrid, 
    speed, 
    stopSignal, 
    pauseSignal, 
    setStatusMessage,
    heuristicType = 'Manhattan'
) => {
    // 1. Initialize sets and grid state
    const openSet = [grid[startNodePos.row][startNodePos.col]];
    const closedSet = new Set();
    const target = grid[endNodePos.row][endNodePos.col];

    // Reset all nodes to a clean state
    for (let row of grid) {
        for (let node of row) {
            node.g = Infinity;
            node.f = Infinity;
            node.h = 0;
            node.previousNode = null;
            if (node.status !== 'wall') node.status = 'default';
        }
    }

    // 2. Setup Start Node
    const startNode = grid[startNodePos.row][startNodePos.col];
    startNode.g = 0;
    startNode.h = calculateHeuristic(startNode, target, heuristicType);
    startNode.f = startNode.h;

    while (openSet.length > 0) {
        // Handle stop/pause signals
        if (stopSignal.current) return false;
        while (pauseSignal.current) {
            if (stopSignal.current) return false;
            await sleep(100);
        }

        // 3. Find the node with the lowest f-score
        // In a "Standard" implementation, we sort the openSet.
        // In "Advanced", we would use a Binary Heap.
        openSet.sort((a, b) => a.f - b.f);
        let current = openSet.shift();

        // 4. Check if we reached the target
        if (current === target) {
            setStatusMessage("Path found! Reconstructing...");
            await animatePath(current, setGrid, speed);
            return true;
        }

        closedSet.add(current);
        if (current.status !== 'wall') current.status = 'visited';

        // 5. Process Neighbors
        const neighbors = getNeighbors(current, grid);
        for (let neighbor of neighbors) {
            if (closedSet.has(neighbor) || neighbor.status === 'wall') continue;

            // distance between nodes is 1
            let tentativeG = current.g + 1;

            if (tentativeG < neighbor.g) {
                neighbor.previousNode = current;
                neighbor.g = tentativeG;
                neighbor.h = calculateHeuristic(neighbor, target, heuristicType);
                neighbor.f = neighbor.g + neighbor.h;

                if (!openSet.includes(neighbor)) {
                    neighbor.status = 'processing';
                    openSet.push(neighbor);
                }
            }
        }

        setStatusMessage(`Exploring: Row ${current.row}, Col ${current.col} (f: ${current.f.toFixed(0)})`);
        setGrid([...grid.map(r => [...r])]);
        await sleep(speed);
    }

    setStatusMessage("No path exists between start and end.");
    return false;
};

const calculateHeuristic = (a, b, type) => {
    const d1 = Math.abs(a.row - b.row);
    const d2 = Math.abs(a.col - b.col);
    return type === 'Manhattan' ? d1 + d2 : Math.sqrt(d1 * d1 + d2 * d2);
};

const getNeighbors = (node, grid) => {
    const res = [];
    const { row, col } = node;
    if (row > 0) res.push(grid[row - 1][col]);
    if (row < grid.length - 1) res.push(grid[row + 1][col]);
    if (col > 0) res.push(grid[row][col - 1]);
    if (col < grid[0].length - 1) res.push(grid[row][col + 1]);
    return res;
};

const animatePath = async (endNode, setGrid, speed) => {
    let curr = endNode;
    while (curr !== null) {
        curr.status = 'path';
        setGrid(prev => [...prev.map(r => [...r])]);
        await sleep(speed);
        curr = curr.previousNode;
    }
};

// --- Standard Multi-Language Snippets ---

export const astarCPP = `// Standard A* Implementation
void findPath(Node* start, Node* target) {
    priority_queue<Node*, vector<Node*>, CompareF> openSet;
    start->g = 0;
    start->f = heuristic(start, target);
    openSet.push(start);

    while (!openSet.empty()) {
        Node* curr = openSet.top();
        if (curr == target) return reconstruct(curr);
        openSet.pop();

        for (Node* neighbor : curr->neighbors) {
            float gScore = curr->g + 1;
            if (gScore < neighbor->g) {
                neighbor->parent = curr;
                neighbor->g = gScore;
                neighbor->f = gScore + heuristic(neighbor, target);
                openSet.push(neighbor);
            }
        }
    }
}`;

export const astarJava = `// Standard A* Implementation
public void aStar(Node start, Node target) {
    PriorityQueue<Node> openSet = new PriorityQueue<>(
        Comparator.comparingDouble(n -> n.f)
    );
    start.g = 0;
    start.f = h(start, target);
    openSet.add(start);

    while (!openSet.isEmpty()) {
        Node curr = openSet.poll();
        if (curr.equals(target)) return buildPath(curr);

        for (Node neighbor : curr.getNeighbors()) {
            double tempG = curr.g + 1;
            if (tempG < neighbor.g) {
                neighbor.parent = curr;
                neighbor.g = tempG;
                neighbor.f = tempG + h(neighbor, target);
                if (!openSet.contains(neighbor)) openSet.add(neighbor);
            }
        }
    }
}`;

export const astarPython = `# Standard A* Implementation
def a_star(start, target):
    open_set = []
    heappush(open_set, (0, start))
    g_score = {start: 0}

    while open_set:
        _, current = heappop(open_set)
        
        if current == target:
            return reconstruct_path(current)

        for neighbor in current.neighbors:
            tentative_g = g_score[current] + 1
            if tentative_g < g_score.get(neighbor, float('inf')):
                neighbor.parent = current
                g_score[neighbor] = tentative_g
                f_score = tentative_g + heuristic(neighbor, target)
                heappush(open_set, (f_score, neighbor))`;

export const astarJS = `// Standard A* Implementation
async function astar(grid, start, target) {
    const openSet = [start];
    start.g = 0;
    
    while (openSet.length > 0) {
        // Sort by f(n) = g(n) + h(n)
        openSet.sort((a, b) => a.f - b.f);
        let curr = openSet.shift();
        
        if (curr === target) return true;

        for (let neighbor of getNeighbors(curr)) {
            let g = curr.g + 1;
            if (g < neighbor.g) {
                neighbor.g = g;
                neighbor.f = g + h(neighbor, target);
                openSet.push(neighbor);
            }
        }
    }
}`;