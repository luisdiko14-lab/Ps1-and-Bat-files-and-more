# ============================================
#           C - M O D E   P Y T H O N
#        ULTIMATE CHAOS ENGINE v3.0
#   Safe Simulation • Animated • 230+ Lines
# ============================================

import os
import time
import random
import sys

try:
    from colorama import Fore, Style, init
    init()
    COLOR = True
except:
    COLOR = False


# ---------- Utility Functions ----------
def c(text, color):
    """Color wrapper with fallback."""
    if not COLOR:
        return text
    return color + text + Style.RESET_ALL


def slow_print(text, delay=0.02):
    """Typewriter effect printing."""
    for ch in text:
        print(ch, end="", flush=True)
        time.sleep(delay)
    print()


def bar(current, total, width=50):
    """Generate a progress bar."""
    filled = int(width * (current / total))
    return "[" + ("█" * filled) + ("░" * (width - filled)) + "]"


def wait(ms):
    time.sleep(ms / 1000)


# ---------- Title Screen ----------
def title_screen():
    art = r"""
   ██████╗      ███╗   ███╗ ██████╗ ██████╗ ███████╗
  ██╔════╝      ████╗ ████║██╔═══██╗██╔══██╗██╔════╝
  ██║  ███╗     ██╔████╔██║██║   ██║██████╔╝█████╗  
  ██║   ██║     ██║╚██╔╝██║██║   ██║██╔═══╝ ██╔══╝  
  ╚██████╔╝     ██║ ╚═╝ ██║╚██████╔╝██║     ███████╗
   ╚═════╝      ╚═╝     ╚═╝ ╚═════╝ ╚═╝     ╚══════╝
    """
    print(c(art, Fore.CYAN if COLOR else ""))


# ---------- Loading Bar ----------
def loading_bar(speed_mb=3.5, max_gb=2.1):
    total_mb = int(max_gb * 1024)
    current = 0

    print(c("Initializing Hyper Loader...", Fore.YELLOW))
    wait(700)

    while current < total_mb:
        current += speed_mb
        if current > total_mb:
            current = total_mb

        percent = current / total_mb
        sys.stdout.write(
            f"\r{c(bar(current, total_mb), Fore.GREEN)} {percent*100:6.2f}% "
            f"({current/1024:.2f}GB / {max_gb}GB)"
        )
        sys.stdout.flush()
        wait(300)

    print("\n" + c("✔ Loading Complete.\n", Fore.GREEN))
    wait(500)


# ---------- File Generator ----------
def generate_files():
    out_dir = "PYTHON_C_MODE_FILES"
    if not os.path.exists(out_dir):
        os.mkdir(out_dir)

    print(c("Creating CHAOS PHASE FILES...\n", Fore.MAGENTA))
    wait(500)

    for i in range(1, 61):
        filename = f"phase_{i}_{random.randint(10000,99999)}.txt"
        path = os.path.join(out_dir, filename)
        with open(path, "w") as f:
            f.write(
                f"PHASE FILE #{i}\nGenerated: {time.ctime()}\n"
                f"Random key: {random.random()*999999:.4f}\n"
            )
        print(c(f" - Created {filename}", Fore.CYAN))
        wait(50)

    print(c("\n✔ 60 Phase Files Created.\n", Fore.GREEN))


# ---------- Chaos Events ----------
def chaos_events():
    events = [
        "📡 Scanning multidimensional frequencies...",
        "🚀 Igniting hyper-thrusters...",
        "🧬 Reconstructing digital DNA matrices...",
        "💥 Amplifying chaos coefficients...",
        "🌐 Linking to imaginary network nodes...",
        "🔮 Predictive anomaly engine warming...",
        "🛰️ Simulated satellite triangulation active...",
        "⚠️ Bypassing fake firewalls...",
        "🔥 Deploying virtual flame packets...",
        "💫 Quantum instability: simulated"
    ]

    print(c("Initiating Chaos Events...\n", Fore.RED))
    wait(500)

    for e in events:
        slow_print(c(e, Fore.YELLOW), 0.03)
        wait(400)

    print(c("\n✔ Chaos Events Complete.\n", Fore.GREEN))
    wait(500)


# ---------- Leveling System ----------
def leveling():
    print(c("Launching XP Leveling Engine...\n", Fore.BLUE))
    wait(500)

    level = 1
    xp = 0

    while level <= 6:
        while xp < 100:
            sys.stdout.write(f"\rLevel {level} | XP: {xp}/100")
            sys.stdout.flush()
            xp += 5
            wait(200)

        print(f"\n{c('LEVEL UP!', Fore.GREEN)} → {level+1}")
        level += 1
        xp = 0
        wait(800)

    print(c("\n✔ Level Engine Complete.\n", Fore.GREEN))


# ---------- Fake System Analyzer ----------
def analyzer():
    print(c("Running Deep System Scan...\n", Fore.CYAN))
    wait(500)

    fake_sections = [
        "CPU Thermal Imaginary Mapping",
        "GPU Shader Vortex Analyzer",
        "Memory Fragment Stabilizer",
        "Quantum Randomness Sampler",
        "Packet Tunnel Reinforcer",
        "Neural Feedback Emulator",
        "Cosmic Byte Synchronizer"
    ]

    for sec in fake_sections:
        slow_print(c(f"[+] {sec}...", Fore.MAGENTA), 0.03)
        for i in range(0, 101, random.randint(15, 30)):
            sys.stdout.write(f"\r    Progress: {i}%")
            sys.stdout.flush()
            wait(200)
        print()
        wait(200)

    print(c("\n✔ Analyzer Complete.\n", Fore.GREEN))
    wait(500)


# ---------- Chaos Menu ----------
def menu():
    slow_print(c("Welcome to C-MODE Python Edition.", Fore.YELLOW), 0.03)
    slow_print("This is a safe simulation. No real system changes.\n", 0.02)

    start = input(c("Start? (Y/N): ", Fore.CYAN)).strip().lower()
    if start != "y":
        print(c("Exiting. Weak energy detected...", Fore.RED))
        return

    # PHASE 1 — Title
    title_screen()
    wait(900)

    # PHASE 2 — Loader
    loading_bar()

    input(c("Press ENTER to continue to Phase Creation...", Fore.CYAN))

    # PHASE 3 — File Creation
    generate_files()

    input(c("Press ENTER to continue to Chaos Events...", Fore.CYAN))

    # PHASE 4 — Chaos Effects
    chaos_events()

    input(c("Press ENTER to continue to Leveling Engine...", Fore.CYAN))

    # PHASE 5 — Leveling
    leveling()

    input(c("Press ENTER to continue to Analyzer...", Fore.CYAN))

    # PHASE 6 — Fake Scan Engine
    analyzer()

    # FINAL
    print(c("C-MODE SIMULATION COMPLETE.", Fore.GREEN))
    print(c("Files stored in: PYTHON_C_MODE_FILES", Fore.CYAN))


# ---------- Main ----------
if __name__ == "__main__":
    menu()
