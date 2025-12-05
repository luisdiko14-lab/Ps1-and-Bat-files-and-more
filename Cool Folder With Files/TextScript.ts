// ================================
// Mega Custom TypeScript Script
// ================================

type UUID = string;
type TaskStatus = "pending" | "running" | "completed" | "failed";
type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

// ================================
// Utility Functions
// ================================

function generateUUID(): UUID {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(date: Date): string {
  return date.toISOString().replace("T", " ").split(".")[0];
}

// ================================
// Logger System
// ================================

class Logger {
  private buffer: string[] = [];
  private enabled: boolean = true;

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  private log(level: LogLevel, message: string) {
    if (!this.enabled) return;

    const entry = `[${formatTime(new Date())}] [${level}] ${message}`;
    this.buffer.push(entry);

    switch (level) {
      case "INFO":
        console.log(entry);
        break;
      case "WARN":
        console.warn(entry);
        break;
      case "ERROR":
        console.error(entry);
        break;
      case "DEBUG":
        console.debug(entry);
        break;
    }
  }

  info(msg: string) { this.log("INFO", msg); }
  warn(msg: string) { this.log("WARN", msg); }
  error(msg: string) { this.log("ERROR", msg); }
  debug(msg: string) { this.log("DEBUG", msg); }

  getLogs(): string[] {
    return [...this.buffer];
  }

  clear() {
    this.buffer = [];
  }
}

// ================================
// Virtual File System
// ================================

interface VirtualFile {
  id: UUID;
  name: string;
  size: number;
  createdAt: Date;
  content: string;
}

class VirtualFileSystem {
  private files: Map<UUID, VirtualFile> = new Map();

  createFile(name: string, content: string): VirtualFile {
    const file: VirtualFile = {
      id: generateUUID(),
      name,
      size: content.length,
      createdAt: new Date(),
      content
    };

    this.files.set(file.id, file);
    return file;
  }

  readFile(id: UUID): VirtualFile | null {
    return this.files.get(id) || null;
  }

  deleteFile(id: UUID): boolean {
    return this.files.delete(id);
  }

  listFiles(): VirtualFile[] {
    return Array.from(this.files.values());
  }

  updateFile(id: UUID, newContent: string): boolean {
    const file = this.files.get(id);
    if (!file) return false;
    file.content = newContent;
    file.size = newContent.length;
    return true;
  }
}

// ================================
// Task System
// ================================

interface TaskMetadata {
  retries: number;
  timeout: number;
}

class Task {
  id: UUID;
  name: string;
  status: TaskStatus;
  createdAt: Date;
  metadata: TaskMetadata;

  constructor(name: string, metadata: TaskMetadata) {
    this.id = generateUUID();
    this.name = name;
    this.status = "pending";
    this.createdAt = new Date();
    this.metadata = metadata;
  }
}

class TaskManager {
  private tasks: Map<UUID, Task> = new Map();
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  createTask(name: string, metadata: TaskMetadata): Task {
    const task = new Task(name, metadata);
    this.tasks.set(task.id, task);
    this.logger.info(`Task created: ${task.name} (${task.id})`);
    return task;
  }

  getTask(id: UUID): Task | null {
    return this.tasks.get(id) || null;
  }

  listTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  async runTask(id: UUID): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) {
      this.logger.error(`Task not found: ${id}`);
      return;
    }

    task.status = "running";
    this.logger.info(`Task running: ${task.name}`);

    try {
      await sleep(randomInt(500, 2000));
      if (Math.random() > 0.85) {
        throw new Error("Random execution failure");
      }
      task.status = "completed";
      this.logger.info(`Task completed: ${task.name}`);
    } catch (err) {
      task.status = "failed";
      this.logger.error(`Task failed: ${task.name}`);
    }
  }

  async runAllSequential() {
    for (const task of this.tasks.values()) {
      await this.runTask(task.id);
    }
  }

  clearCompleted() {
    for (const [id, task] of this.tasks) {
      if (task.status === "completed") {
        this.tasks.delete(id);
        this.logger.debug(`Removed completed task: ${task.name}`);
      }
    }
  }
}

// ================================
// Fake System Monitor
// ================================

interface SystemStats {
  cpu: number;
  ram: number;
  temperature: number;
  uptime: number;
}

class SystemMonitor {
  private startTime = Date.now();

  readStats(): SystemStats {
    return {
      cpu: randomInt(5, 90),
      ram: randomInt(200, 16384),
      temperature: randomInt(20, 95),
      uptime: Math.floor((Date.now() - this.startTime) / 1000)
    };
  }
}

// ================================
// Event Bus
// ================================

type EventHandler = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventHandler[]> = new Map();

  on(event: string, handler: EventHandler) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }

  emit(event: string, ...args: any[]) {
    const handlers = this.events.get(event);
    if (!handlers) return;

    for (const h of handlers) {
      h(...args);
    }
  }
}

// ================================
// Fake Network Simulator
// ================================

interface Packet {
  id: UUID;
  source: string;
  destination: string;
  payload: string;
  createdAt: Date;
}

class NetworkSimulator {
  private packets: Packet[] = [];
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  sendPacket(source: string, destination: string, payload: string) {
    const packet: Packet = {
      id: generateUUID(),
      source,
      destination,
      payload,
      createdAt: new Date()
    };

    this.packets.push(packet);
    this.logger.info(`Packet sent ${packet.id} from ${source} -> ${destination}`);
  }

  receivePacket(): Packet | null {
    const p = this.packets.shift() || null;
    if (p) {
      this.logger.debug(`Packet received ${p.id}`);
    }
    return p;
  }

  getQueueSize(): number {
    return this.packets.length;
  }
}

// ================================
// Fake Database
// ================================

class InMemoryDatabase<T extends { id: UUID }> {
  private table: Map<UUID, T> = new Map();

  insert(item: T) {
    this.table.set(item.id, item);
  }

  get(id: UUID): T | null {
    return this.table.get(id) || null;
  }

  all(): T[] {
    return Array.from(this.table.values());
  }

  delete(id: UUID): boolean {
    return this.table.delete(id);
  }

  update(id: UUID, data: Partial<T>) {
    const item = this.table.get(id);
    if (!item) return null;
    const updated = { ...item, ...data };
    this.table.set(id, updated);
    return updated;
  }
}

// ================================
// User System
// ================================

interface User {
  id: UUID;
  username: string;
  role: "admin" | "user" | "guest";
  createdAt: Date;
}

class UserManager {
  private db = new InMemoryDatabase<User>();

  createUser(username: string, role: User["role"]): User {
    const user: User = {
      id: generateUUID(),
      username,
      role,
      createdAt: new Date()
    };

    this.db.insert(user);
    return user;
  }

  listUsers(): User[] {
    return this.db.all();
  }

  getUser(id: UUID): User | null {
    return this.db.get(id);
  }

  deleteUser(id: UUID) {
    return this.db.delete(id);
  }
}

// ================================
// CLI Simulator
// ================================

class FakeCLI {
  private logger: Logger;
  private fs: VirtualFileSystem;
  private tasks: TaskManager;
  private users: UserManager;
  private system: SystemMonitor;
  private bus: EventBus;
  private netwerk: NetworkSimulator;

  constructor() {
    this.logger = new Logger();
    this.fs = new VirtualFileSystem();
    this.tasks = new TaskManager(this.logger);
    this.users = new UserManager();
    this.system = new SystemMonitor();
    this.bus = new EventBus();
    this.netwerk = new NetworkSimulator(this.logger);
    this.registerEvents();
  }

  private registerEvents() {
    this.bus.on("user:create", (user: User) => {
      this.logger.info(`Event user:create -> ${user.username}`);
    });

    this.bus.on("file:create", (file: VirtualFile) => {
      this.logger.info(`Event file:create -> ${file.name}`);
    });

    this.bus.on("task:create", (task: Task) => {
      this.logger.info(`Event task:create -> ${task.name}`);
    });
  }

  runDemo() {
    this.logger.info("System starting...");
    const u1 = this.users.createUser("admin", "admin");
    const u2 = this.users.createUser("guest1", "guest");

    this.bus.emit("user:create", u1);
    this.bus.emit("user:create", u2);

    const f1 = this.fs.createFile("notes.txt", "Hello world");
    const f2 = this.fs.createFile("log.txt", "System boot");

    this.bus.emit("file:create", f1);
    this.bus.emit("file:create", f2);

    const t1 = this.tasks.createTask("Backup", { retries: 3, timeout: 5000 });
    const t2 = this.tasks.createTask("Cleanup", { retries: 1, timeout: 2000 });

    this.bus.emit("task:create", t1);
    this.bus.emit("task:create", t2);

    this.netwerk.sendPacket("clientA", "serverB", "HELLO");
    this.netwerk.sendPacket("serverB", "clientA", "ACK");

    this.printStatus();
  }

  async runTasks() {
    await this.tasks.runAllSequential();
    this.tasks.clearCompleted();
  }

  printStatus() {
    const stats = this.system.readStats();
    this.logger.info(`CPU ${stats.cpu}% | RAM ${stats.ram}MB | TEMP ${stats.temperature}C | UPTIME ${stats.uptime}s`);
  }

  dumpEverything() {
    console.log("\n=== USERS ===");
    console.table(this.users.listUsers());

    console.log("\n=== FILES ===");
    console.table(this.fs.listFiles());

    console.log("\n=== TASKS ===");
    console.table(this.tasks.listTasks());

    console.log("\n=== LOGS ===");
    console.log(this.logger.getLogs().join("\n"));
  }
}

// ================================
// Random Data Generator
// ================================

class RandomDataGenerator {
  static randomName(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz";
    return Array.from({ length: randomInt(5, 10) })
      .map(() => chars[randomInt(0, chars.length - 1)])
      .join("");
  }

  static randomText(size: number): string {
    return Array.from({ length: size })
      .map(() => String.fromCharCode(randomInt(97, 122)))
      .join("");
  }
}

// ================================
// Stress Test
// ================================

async function stressTest(cli: FakeCLI) {
  for (let i = 0; i < 20; i++) {
    const name = RandomDataGenerator.randomName();
    const content = RandomDataGenerator.randomText(100);
    cli["fs"].createFile(name + ".txt", content);
    await sleep(50);
  }

  for (let i = 0; i < 10; i++) {
    cli["tasks"].createTask("Task_" + i, { retries: 2, timeout: 3000 });
  }

  await cli.runTasks();
}

// ================================
// Entry Point
// ================================

(async () => {
  const cli = new FakeCLI();
  cli.runDemo();
  await cli.runTasks();
  await stressTest(cli);
  cli.printStatus();
  cli.dumpEverything();
})();
