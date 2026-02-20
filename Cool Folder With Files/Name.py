# ============================================
# Mega Custom Python Script
# Fake System Utility + Task Manager + Logger
# Virtual File System + Network + Users
# ============================================

import time
import random
import string
import uuid
import threading
from typing import Dict, List, Optional, Callable, Any

# ============================================
# Utilities
# ============================================

def generate_uuid() -> str:
    return str(uuid.uuid4())

def sleep_ms(ms: int):
    time.sleep(ms / 1000)

def random_int(min_v: int, max_v: int) -> int:
    return random.randint(min_v, max_v)

def format_time(ts: float) -> str:
    return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(ts))

def random_string(length: int) -> str:
    return "".join(random.choice(string.ascii_lowercase) for _ in range(length))

# ============================================
# Logger System
# ============================================

class Logger:
    def __init__(self):
        self.enabled = True
        self.buffer: List[str] = []

    def enable(self):
        self.enabled = True

    def disable(self):
        self.enabled = False

    def _log(self, level: str, message: str):
        if not self.enabled:
            return
        entry = f"[{format_time(time.time())}] [{level}] {message}"
        self.buffer.append(entry)

        if level == "INFO":
            print(entry)
        elif level == "WARN":
            print(entry)
        elif level == "ERROR":
            print(entry)
        elif level == "DEBUG":
            print(entry)

    def info(self, msg: str):
        self._log("INFO", msg)

    def warn(self, msg: str):
        self._log("WARN", msg)

    def error(self, msg: str):
        self._log("ERROR", msg)

    def debug(self, msg: str):
        self._log("DEBUG", msg)

    def get_logs(self) -> List[str]:
        return list(self.buffer)

    def clear(self):
        self.buffer.clear()

# ============================================
# Virtual File System
# ============================================

class VirtualFile:
    def __init__(self, name: str, content: str):
        self.id: str = generate_uuid()
        self.name: str = name
        self.content: str = content
        self.size: int = len(content)
        self.created_at: float = time.time()

class VirtualFileSystem:
    def __init__(self):
        self.files: Dict[str, VirtualFile] = {}

    def create_file(self, name: str, content: str) -> VirtualFile:
        file = VirtualFile(name, content)
        self.files[file.id] = file
        return file

    def read_file(self, file_id: str) -> Optional[VirtualFile]:
        return self.files.get(file_id)

    def delete_file(self, file_id: str) -> bool:
        return self.files.pop(file_id, None) is not None

    def update_file(self, file_id: str, new_content: str) -> bool:
        file = self.files.get(file_id)
        if not file:
            return False
        file.content = new_content
        file.size = len(new_content)
        return True

    def list_files(self) -> List[VirtualFile]:
        return list(self.files.values())

# ============================================
# Task System
# ============================================

class Task:
    def __init__(self, name: str, retries: int, timeout: int):
        self.id: str = generate_uuid()
        self.name: str = name
        self.retries: int = retries
        self.timeout: int = timeout
        self.status: str = "pending"
        self.created_at: float = time.time()

class TaskManager:
    def __init__(self, logger: Logger):
        self.tasks: Dict[str, Task] = {}
        self.logger = logger

    def create_task(self, name: str, retries: int, timeout: int) -> Task:
        task = Task(name, retries, timeout)
        self.tasks[task.id] = task
        self.logger.info(f"Task created: {task.name} ({task.id})")
        return task

    def get_task(self, task_id: str) -> Optional[Task]:
        return self.tasks.get(task_id)

    def list_tasks(self) -> List[Task]:
        return list(self.tasks.values())

    def run_task(self, task_id: str):
        task = self.tasks.get(task_id)
        if not task:
            self.logger.error(f"Task not found: {task_id}")
            return

        task.status = "running"
        self.logger.info(f"Task running: {task.name}")

        try:
            sleep_ms(random_int(300, 1500))
            if random.random() > 0.85:
                raise Exception("Random task failure")
            task.status = "completed"
            self.logger.info(f"Task completed: {task.name}")
        except Exception as e:
            task.status = "failed"
            self.logger.error(f"Task failed: {task.name}")

    def run_all_sequential(self):
        for task in list(self.tasks.values()):
            self.run_task(task.id)

    def clear_completed(self):
        remove_ids = [tid for tid, t in self.tasks.items() if t.status == "completed"]
        for tid in remove_ids:
            self.logger.debug(f"Removing completed task: {self.tasks[tid].name}")
            del self.tasks[tid]

# ============================================
# System Monitor
# ============================================

class SystemMonitor:
    def __init__(self):
        self.start_time = time.time()

    def read_stats(self) -> Dict[str, int]:
        return {
            "cpu": random_int(5, 95),
            "ram": random_int(256, 32768),
            "temperature": random_int(25, 98),
            "uptime": int(time.time() - self.start_time)
        }

# ============================================
# Event Bus
# ============================================

EventHandler = Callable[..., Any]

class EventBus:
    def __init__(self):
        self.events: Dict[str, List[EventHandler]] = {}

    def on(self, event: str, handler: EventHandler):
        if event not in self.events:
            self.events[event] = []
        self.events[event].append(handler)

    def emit(self, event: str, *args):
        handlers = self.events.get(event, [])
        for h in handlers:
            h(*args)

# ============================================
# Network Simulator
# ============================================

class Packet:
    def __init__(self, source: str, destination: str, payload: str):
        self.id = generate_uuid()
        self.source = source
        self.destination = destination
        self.payload = payload
        self.created_at = time.time()

class NetworkSimulator:
    def __init__(self, logger: Logger):
        self.queue: List[Packet] = []
        self.logger = logger

    def send_packet(self, source: str, destination: str, payload: str):
        packet = Packet(source, destination, payload)
        self.queue.append(packet)
        self.logger.info(f"Packet sent {packet.id} {source} -> {destination}")

    def receive_packet(self) -> Optional[Packet]:
        if not self.queue:
            return None
        packet = self.queue.pop(0)
        self.logger.debug(f"Packet received {packet.id}")
        return packet

    def queue_size(self) -> int:
        return len(self.queue)

# ============================================
# Database
# ============================================

class InMemoryDatabase:
    def __init__(self):
        self.data: Dict[str, Any] = {}

    def insert(self, item_id: str, item: Any):
        self.data[item_id] = item

    def get(self, item_id: str) -> Optional[Any]:
        return self.data.get(item_id)

    def all(self) -> List[Any]:
        return list(self.data.values())

    def delete(self, item_id: str) -> bool:
        return self.data.pop(item_id, None) is not None

# ============================================
# User System
# ============================================

class User:
    def __init__(self, username: str, role: str):
        self.id = generate_uuid()
        self.username = username
        self.role = role
        self.created_at = time.time()

class UserManager:
    def __init__(self):
        self.db = InMemoryDatabase()

    def create_user(self, username: str, role: str) -> User:
        user = User(username, role)
        self.db.insert(user.id, user)
        return user

    def list_users(self) -> List[User]:
        return self.db.all()

    def get_user(self, user_id: str) -> Optional[User]:
        return self.db.get(user_id)

    def delete_user(self, user_id: str) -> bool:
        return self.db.delete(user_id)

# ============================================
# Random Data Generator
# ============================================

class RandomDataGenerator:
    @staticmethod
    def random_name() -> str:
        return random_string(random_int(5, 10))

    @staticmethod
    def random_text(size: int) -> str:
        return random_string(size)

# ============================================
# Fake CLI Core
# ============================================

class FakeCLI:
    def __init__(self):
        self.logger = Logger()
        self.fs = VirtualFileSystem()
        self.tasks = TaskManager(self.logger)
        self.users = UserManager()
        self.system = SystemMonitor()
        self.bus = EventBus()
        self.network = NetworkSimulator(self.logger)
        self._register_events()

    def _register_events(self):
        self.bus.on("user:create", lambda u: self.logger.info(f"Event user:create -> {u.username}"))
        self.bus.on("file:create", lambda f: self.logger.info(f"Event file:create -> {f.name}"))
        self.bus.on("task:create", lambda t: self.logger.info(f"Event task:create -> {t.name}"))

    def run_demo(self):
        self.logger.info("System starting...")

        u1 = self.users.create_user("admin", "admin")
        u2 = self.users.create_user("guest", "guest")

        self.bus.emit("user:create", u1)
        self.bus.emit("user:create", u2)

        f1 = self.fs.create_file("notes.txt", "hello world")
        f2 = self.fs.create_file("boot.log", "system booted")

        self.bus.emit("file:create", f1)
        self.bus.emit("file:create", f2)

        t1 = self.tasks.create_task("Backup", 3, 5000)
        t2 = self.tasks.create_task("Cleanup", 1, 2000)

        self.bus.emit("task:create", t1)
        self.bus.emit("task:create", t2)

        self.network.send_packet("clientA", "serverB", "HELLO")
        self.network.send_packet("serverB", "clientA", "ACK")

        self.print_status()

    def run_tasks(self):
        self.tasks.run_all_sequential()
        self.tasks.clear_completed()

    def print_status(self):
        stats = self.system.read_stats()
        self.logger.info(
            f"CPU {stats['cpu']}% | RAM {stats['ram']} MB | "
            f"TEMP {stats['temperature']} C | UPTIME {stats['uptime']}s"
        )

    def dump_everything(self):
        print("\n=== USERS ===")
        for u in self.users.list_users():
            print(vars(u))

        print("\n=== FILES ===")
        for f in self.fs.list_files():
            print(vars(f))

        print("\n=== TASKS ===")
        for t in self.tasks.list_tasks():
            print(vars(t))

        print("\n=== LOGS ===")
        for log in self.logger.get_logs():
            print(log)

# ============================================
# Stress Test
# ============================================

def stress_test(cli: FakeCLI):
    for _ in range(25):
        name = RandomDataGenerator.random_name() + ".txt"
        content = RandomDataGenerator.random_text(120)
        cli.fs.create_file(name, content)
        sleep_ms(30)

    for i in range(15):
        cli.tasks.create_task(f"Task_{i}", 2, 3000)

    cli.run_tasks()

# ============================================
# Threaded Network Spam
# ============================================

def network_spam(cli: FakeCLI):
    for _ in range(20):
        cli.network.send_packet(
            RandomDataGenerator.random_name(),
            RandomDataGenerator.random_name(),
            RandomDataGenerator.random_text(20)
        )
        sleep_ms(50)

# ============================================
# Entry Point
# ============================================

def main():
    cli = FakeCLI()
    cli.run_demo()

    t = threading.Thread(target=network_spam, args=(cli,))
    t.start()

    stress_test(cli)
    t.join()

    cli.print_status()
    cli.dump_everything()

if __name__ == "__main__":
    main()
