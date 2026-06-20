// ─── Hash Table – step generator + multi-language code snippets ───────────────

/**
 * Supported collision strategies:
 *   "chaining"      – separate chaining (linked lists per bucket)
 *   "linear"        – open addressing – linear probing
 *   "quadratic"     – open addressing – quadratic probing
 *   "double"        – open addressing – double hashing
 */

// ─── Primary hash function ────────────────────────────────────────────────────
export function hashFn(key, size) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) % size;
  }
  return hash;
}

// ─── Secondary hash (for double hashing) ─────────────────────────────────────
export function hashFn2(key, size) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 37 + key.charCodeAt(i)) % size;
  }
  // Must be non-zero and coprime with size
  return (hash % (size - 1)) + 1;
}

// ─── Probe sequence helpers ───────────────────────────────────────────────────
function nextProbe(strategy, key, size, attempt) {
  const h1 = hashFn(key, size);
  if (strategy === "linear") return (h1 + attempt) % size;
  if (strategy === "quadratic") return (h1 + attempt * attempt) % size;
  if (strategy === "double") return (h1 + attempt * hashFn2(key, size)) % size;
  return h1; // chaining always uses h1
}

// ─── [NEW] Probe formula string for a given attempt ──────────────────────────
function probeFormulaStr(strategy, h1, h2, attempt, size, resultIdx) {
  if (strategy === "linear")
    return `slot = (${h1} + ${attempt}) % ${size} = ${resultIdx}`;
  if (strategy === "quadratic")
    return `slot = (${h1} + ${attempt}²) % ${size} = ${resultIdx}`;
  if (strategy === "double")
    return `slot = (${h1} + ${attempt}×${h2}) % ${size} = ${resultIdx}`;
  return "";
}

// ─── Step generator ───────────────────────────────────────────────────────────
/**
 * Generates an array of frames describing each step of an operation.
 *
 * Frame shape:
 * {
 *   table          : Array<bucket>         – full snapshot of the table
 *   highlightIdx   : number|null           – bucket index being examined
 *   probeIdx       : number|null           – current probe slot (OA only)
 *   action         : string                – short label
 *   description    : string                – longer explanation
 *   result         : "found"|"not-found"|"inserted"|"deleted"|"collision"|"probing"|null
 *   hashCalc       : { key, h1, h2? }     – hash computation shown in UI
 *   statsAfter     : { size, occupied, tombstones, load }   ← [UPDATED] added tombstones
 *   probeSequence  : number[]              – [NEW] probe indices visited so far (OA only)
 *   probeFormula   : string                – [NEW] formula string for current probe (OA only)
 * }
 *
 * bucket shape (chaining)  : { entries: [{key,value,status}], status }
 * bucket shape (open addr) : { entry: {key,value,status}|null, status }
 */
export function generateHashTableSteps(tableSize, strategy, operation, key, value, initialTable) {
  const frames = [];
  // Deep-clone so we never mutate the caller's state
  let table = deepClone(initialTable);

  // [NEW] track probe sequence across attempts for OA strategies
  const probeSeq = [];

  const snap = (highlightIdx, probeIdx, action, description, result, hashCalc, formula = "") => {
    frames.push({
      table: deepClone(table),
      highlightIdx,
      probeIdx,
      action,
      description,
      result: result ?? null,
      hashCalc: hashCalc ?? null,
      statsAfter: computeStats(table, strategy),
      probeSequence: [...probeSeq],   // [NEW]
      probeFormula: formula,           // [NEW]
    });
  };

  const h1 = hashFn(key, tableSize);
  const h2 = strategy === "double" ? hashFn2(key, tableSize) : null;
  const hashCalcBase = { key, h1, h2 };

  // ── Initial frame ───────────────────────────────────────────────────────────
  snap(null, null, "Start", `Beginning ${operation} for key "${key}"`, null, hashCalcBase);

  // ── Hash computation frame ────────────────────────────────��─────────────────
  snap(
    h1,
    null,
    "Hash",
    `hash("${key}") = ${h1}${h2 !== null ? `, h2 = ${h2}` : ""} → Bucket ${h1}`,
    null,
    hashCalcBase,
  );

  if (strategy === "chaining") {
    _chainingOp(frames, table, tableSize, operation, key, value, h1, snap, hashCalcBase);
  } else {
    _openAddressingOp(frames, table, tableSize, strategy, operation, key, value, h1, h2, snap, hashCalcBase, probeSeq);
  }

  return frames;
}

// ─── Chaining helpers ─────────────────────────────────────────────────────────
function _chainingOp(frames, table, tableSize, op, key, value, h1, snap, hc) {
  const bucket = table[h1];

  if (op === "insert") {
    // Check for existing key
    const existingIdx = bucket.entries.findIndex((e) => e.key === key);
    if (existingIdx !== -1) {
      bucket.entries[existingIdx].status = "highlight";
      snap(h1, null, "Key Exists", `Key "${key}" already exists — updating value to "${value}"`, "collision", hc);
      bucket.entries[existingIdx].value = value;
      bucket.entries[existingIdx].status = "inserted";
      snap(h1, null, "Updated", `Key "${key}" updated to value "${value}"`, "inserted", hc);
    } else {
      if (bucket.entries.length > 0) {
        bucket.status = "collision";
        snap(h1, null, "Collision", `Bucket ${h1} already has ${bucket.entries.length} entry/entries — chaining`, "collision", hc);
      }
      bucket.entries.push({ key, value, status: "inserting" });
      bucket.status = "active";
      snap(h1, null, "Inserting", `Appending key "${key}" to chain at bucket ${h1}`, "inserted", hc);
      bucket.entries[bucket.entries.length - 1].status = "inserted";
      bucket.status = "default";
      snap(h1, null, "Done", `Key "${key}" successfully inserted`, "inserted", hc);
    }
  } else if (op === "search") {
    bucket.status = "active";
    snap(h1, null, "Check Bucket", `Scanning chain at bucket ${h1}`, null, hc);
    let found = false;
    for (let i = 0; i < bucket.entries.length; i++) {
      bucket.entries[i].status = "comparing";
      snap(h1, null, "Compare", `Comparing key "${bucket.entries[i].key}" == "${key}"?`, null, hc);
      if (bucket.entries[i].key === key) {
        bucket.entries[i].status = "found";
        snap(h1, null, "Found!", `Key "${key}" found with value "${bucket.entries[i].value}"`, "found", hc);
        found = true;
        break;
      } else {
        bucket.entries[i].status = "not-found";
        snap(h1, null, "No Match", `"${bucket.entries[i].key}" ≠ "${key}", continue`, null, hc);
        bucket.entries[i].status = "default";
      }
    }
    if (!found) {
      bucket.status = "not-found";
      snap(h1, null, "Not Found", `Key "${key}" not found in bucket ${h1}`, "not-found", hc);
      bucket.status = "default";
    } else {
      bucket.status = "default";
    }
  } else if (op === "delete") {
    bucket.status = "active";
    snap(h1, null, "Check Bucket", `Scanning chain at bucket ${h1}`, null, hc);
    let idx = -1;
    for (let i = 0; i < bucket.entries.length; i++) {
      bucket.entries[i].status = "comparing";
      snap(h1, null, "Compare", `Comparing key "${bucket.entries[i].key}" == "${key}"?`, null, hc);
      if (bucket.entries[i].key === key) {
        idx = i;
        bucket.entries[i].status = "deleting";
        snap(h1, null, "Deleting", `Found "${key}" — removing from chain`, "deleted", hc);
        break;
      } else {
        bucket.entries[i].status = "default";
      }
    }
    if (idx !== -1) {
      bucket.entries.splice(idx, 1);
      bucket.status = "default";
      snap(h1, null, "Done", `Key "${key}" successfully deleted`, "deleted", hc);
    } else {
      bucket.status = "not-found";
      snap(h1, null, "Not Found", `Key "${key}" not found — nothing to delete`, "not-found", hc);
      bucket.status = "default";
    }
  }
}

// ─── Open addressing helpers ──────────────────────────────────────────────────
// [UPDATED] accepts h2 + probeSeq so we can attach probeSequence & probeFormula to frames
function _openAddressingOp(frames, table, tableSize, strategy, op, key, value, h1, h2, snap, hc, probeSeq) {
  const maxProbes = tableSize;

  if (op === "insert") {
    let inserted = false;
    for (let i = 0; i < maxProbes; i++) {
      const idx = nextProbe(strategy, key, tableSize, i);
      probeSeq.push(idx); // [NEW]
      const formula = probeFormulaStr(strategy, h1, h2, i, tableSize, idx); // [NEW]
      const slot = table[idx];
      if (i > 0) {
        snap(h1, idx, "Probing", `Probe ${i}: checking slot ${idx} (${strategyLabel(strategy, i, hc)})`, "probing", hc, formula);
      }
      if (!slot.entry || slot.entry.deleted) {
        if (i > 0) {
          slot.status = "collision";
          snap(h1, idx, "Collision Resolved", `Slot ${idx} is free — inserting here after ${i} probe(s)`, "collision", hc, formula);
        }
        slot.entry = { key, value, status: "inserting" };
        slot.status = "active";
        snap(h1, idx, "Inserting", `Inserting key "${key}" at slot ${idx}`, "inserted", hc, formula);
        slot.entry.status = "inserted";
        slot.status = "default";
        snap(h1, idx, "Done", `Key "${key}" inserted at slot ${idx}`, "inserted", hc, formula);
        inserted = true;
        break;
      } else if (slot.entry.key === key) {
        slot.entry.status = "highlight";
        snap(h1, idx, "Key Exists", `Key "${key}" already at slot ${idx} — updating value`, "collision", hc, formula);
        slot.entry.value = value;
        slot.entry.status = "inserted";
        snap(h1, idx, "Updated", `Value updated to "${value}"`, "inserted", hc, formula);
        inserted = true;
        break;
      } else {
        slot.status = "collision";
        snap(h1, idx, "Collision!", `Slot ${idx} occupied by "${slot.entry.key}" — probing next`, "collision", hc, formula);
        slot.status = "default";
      }
    }
    if (!inserted) {
      snap(h1, null, "Table Full", `All slots exhausted — table is full`, "not-found", hc);
    }
  } else if (op === "search") {
    let found = false;
    for (let i = 0; i < maxProbes; i++) {
      const idx = nextProbe(strategy, key, tableSize, i);
      probeSeq.push(idx); // [NEW]
      const formula = probeFormulaStr(strategy, h1, h2, i, tableSize, idx); // [NEW]
      const slot = table[idx];
      slot.status = "active";
      snap(h1, idx, "Probe", `Probe ${i}: checking slot ${idx}`, null, hc, formula);
      if (!slot.entry || (slot.entry === null && !slot.entry?.deleted)) {
        // Empty (not deleted) slot — key doesn't exist
        if (!slot.entry) {
          slot.status = "not-found";
          snap(h1, idx, "Not Found", `Empty slot at ${idx} — key "${key}" not in table`, "not-found", hc, formula);
          slot.status = "default";
          break;
        }
      }
      if (slot.entry && !slot.entry.deleted && slot.entry.key === key) {
        slot.entry.status = "found";
        snap(h1, idx, "Found!", `Key "${key}" found at slot ${idx} with value "${slot.entry.value}"`, "found", hc, formula);
        found = true;
        break;
      } else {
        slot.status = "default";
      }
    }
    if (!found) {
      snap(h1, null, "Not Found", `Key "${key}" not found after probing all slots`, "not-found", hc);
    }
  } else if (op === "delete") {
    let deleted = false;
    for (let i = 0; i < maxProbes; i++) {
      const idx = nextProbe(strategy, key, tableSize, i);
      probeSeq.push(idx); // [NEW]
      const formula = probeFormulaStr(strategy, h1, h2, i, tableSize, idx); // [NEW]
      const slot = table[idx];
      slot.status = "active";
      snap(h1, idx, "Probe", `Probe ${i}: checking slot ${idx}`, null, hc, formula);
      if (!slot.entry) {
        slot.status = "not-found";
        snap(h1, idx, "Not Found", `Empty slot at ${idx} — key "${key}" doesn't exist`, "not-found", hc, formula);
        slot.status = "default";
        break;
      }
      if (!slot.entry.deleted && slot.entry.key === key) {
        slot.entry.status = "deleting";
        snap(h1, idx, "Deleting", `Found "${key}" at slot ${idx} — marking as deleted (tombstone)`, "deleted", hc, formula);
        slot.entry.deleted = true;
        slot.entry.status = "deleted";
        snap(h1, idx, "Done", `Slot ${idx} marked as tombstone ☠️`, "deleted", hc, formula);
        slot.status = "default";
        deleted = true;
        break;
      } else {
        slot.status = "default";
      }
    }
    if (!deleted) {
      snap(h1, null, "Not Found", `Key "${key}" not found — nothing to delete`, "not-found", hc);
    }
  }
}

function strategyLabel(strategy, attempt, hc) {
  if (strategy === "linear") return `h(k) + ${attempt}`;
  if (strategy === "quadratic") return `h(k) + ${attempt}²`;
  if (strategy === "double") return `h(k) + ${attempt}×h2(k)`;
  return "";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function computeStats(table, strategy) {
  let occupied = 0;
  let tombstones = 0; // [NEW]
  const size = table.length;
  if (strategy === "chaining") {
    table.forEach((b) => { occupied += b.entries.length; });
  } else {
    table.forEach((b) => {
      if (b.entry && !b.entry.deleted) occupied++;
      if (b.entry && b.entry.deleted) tombstones++; // [NEW]
    });
  }
  return { size, occupied, tombstones, load: (occupied / size).toFixed(2) }; // [UPDATED]
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// ─── Initial table factories ──────────────────────────────────────────────────
export function createChainingTable(size) {
  return Array.from({ length: size }, () => ({ entries: [], status: "default" }));
}

export function createOpenTable(size) {
  return Array.from({ length: size }, () => ({ entry: null, status: "default" }));
}

// ─── C++ code snippet ─────────────────────────────────────────────────────────
export const hashTableCPP = `#include <iostream>
#include <list>
#include <string>
using namespace std;

class HashTable {
    int size;
    list<pair<string,int>>* table;

    int hash(const string& key) {
        int h = 0;
        for (char c : key) h = (h * 31 + c) % size;
        return h;
    }

public:
    HashTable(int sz) : size(sz) {
        table = new list<pair<string,int>>[size];
    }

    void insert(const string& key, int value) {
        int idx = hash(key);
        for (auto& p : table[idx])
            if (p.first == key) { p.second = value; return; }
        table[idx].push_back({key, value});
    }

    int search(const string& key) {
        int idx = hash(key);
        for (auto& p : table[idx])
            if (p.first == key) return p.second;
        return -1; // not found
    }

    bool remove(const string& key) {
        int idx = hash(key);
        for (auto it = table[idx].begin(); it != table[idx].end(); ++it)
            if (it->first == key) { table[idx].erase(it); return true; }
        return false;
    }
};

int main() {
    HashTable ht(7);
    ht.insert("apple", 1);
    ht.insert("banana", 2);
    cout << ht.search("apple") << endl; // 1
    ht.remove("apple");
    cout << ht.search("apple") << endl; // -1
}`;

// ─── Java code snippet ────────────────────────────────────────────────────────
export const hashTableJava = `import java.util.*;

public class HashTable {
    private final int size;
    private final LinkedList<int[]>[] table;

    @SuppressWarnings("unchecked")
    public HashTable(int size) {
        this.size = size;
        table = new LinkedList[size];
        for (int i = 0; i < size; i++)
            table[i] = new LinkedList<>();
    }

    private int hash(String key) {
        int h = 0;
        for (char c : key.toCharArray())
            h = (h * 31 + c) % size;
        return h;
    }

    public void insert(String key, int value) {
        int idx = hash(key);
        for (int[] entry : table[idx])
            if (Arrays.equals(entry, new int[]{key.hashCode(), entry[1]})) {
                entry[1] = value; return;
            }
        table[idx].add(new int[]{key.hashCode(), value});
    }

    public int search(String key) {
        int idx = hash(key);
        for (int[] entry : table[idx])
            if (entry[0] == key.hashCode()) return entry[1];
        return -1;
    }

    public boolean remove(String key) {
        int idx = hash(key);
        return table[idx].removeIf(e -> e[0] == key.hashCode());
    }

    public static void main(String[] args) {
        HashTable ht = new HashTable(7);
        ht.insert("apple", 1);
        ht.insert("banana", 2);
        System.out.println(ht.search("apple")); // 1
        ht.remove("apple");
        System.out.println(ht.search("apple")); // -1
    }
}`;

// ─── Python code snippet ──────────────────────────────────────────────────────
export const hashTablePython = `class HashTable:
    def __init__(self, size=7):
        self.size = size
        self.table = [[] for _ in range(size)]

    def _hash(self, key: str) -> int:
        h = 0
        for c in key:
            h = (h * 31 + ord(c)) % self.size
        return h

    def insert(self, key: str, value) -> None:
        idx = self._hash(key)
        for pair in self.table[idx]:
            if pair[0] == key:
                pair[1] = value
                return
        self.table[idx].append([key, value])

    def search(self, key: str):
        idx = self._hash(key)
        for pair in self.table[idx]:
            if pair[0] == key:
                return pair[1]
        return None  # not found

    def delete(self, key: str) -> bool:
        idx = self._hash(key)
        for i, pair in enumerate(self.table[idx]):
            if pair[0] == key:
                del self.table[idx][i]
                return True
        return False


ht = HashTable()
ht.insert("apple", 1)
ht.insert("banana", 2)
print(ht.search("apple"))   # 1
ht.delete("apple")
print(ht.search("apple"))   # None`;

// ─── JavaScript code snippet ──────────────────────────────────────────────────
export const hashTableJS = `class HashTable {
  constructor(size = 7) {
    this.size = size;
    this.table = Array.from({ length: size }, () => []);
  }

  _hash(key) {
    let h = 0;
    for (const c of key) h = (h * 31 + c.charCodeAt(0)) % this.size;
    return h;
  }

  insert(key, value) {
    const idx = this._hash(key);
    const existing = this.table[idx].find(p => p[0] === key);
    if (existing) { existing[1] = value; return; }
    this.table[idx].push([key, value]);
  }

  search(key) {
    const idx = this._hash(key);
    const found = this.table[idx].find(p => p[0] === key);
    return found ? found[1] : undefined;
  }

  delete(key) {
    const idx = this._hash(key);
    const i = this.table[idx].findIndex(p => p[0] === key);
    if (i !== -1) { this.table[idx].splice(i, 1); return true; }
    return false;
  }
}

const ht = new HashTable(7);
ht.insert("apple", 1);
ht.insert("banana", 2);
console.log(ht.search("apple"));  // 1
ht.delete("apple");
console.log(ht.search("apple"));  // undefined`;