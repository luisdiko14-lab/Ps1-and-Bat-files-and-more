# ====================================================
#          C - M O D E   R U B Y  C H A O S
#      ULTIMATE SIMULATION • SAFE • 220+ LINES
# ====================================================

require "io/console"
require "time"

# ---- Color Helpers ----
def color(text, code)
  "\e[#{code}m#{text}\e[0m"
end

def cyan(t); color(t, 36); end
def yellow(t); color(t, 33); end
def green(t); color(t, 32); end
def red(t); color(t, 31); end
def magenta(t); color(t, 35); end
def blue(t); color(t, 34); end

# ---- Utility ----
def slow_print(text, delay = 0.02)
  text.each_char do |c|
    print c
    sleep delay
  end
  puts
end

def wait(ms)
  sleep(ms / 1000.0)
end

def progress_bar(current, max, width = 50)
  fill = (current.to_f / max * width).to_i
  "[" + "█" * fill + "░" * (width - fill) + "]"
end

# ----------------------------------------------------
#                    TITLE SCREEN
# ----------------------------------------------------
def title_screen
  art = <<~EOF
    ██████╗      ███╗   ███╗ ██████╗ ██████╗ ███████╗
    ██╔════╝      ████╗ ████║██╔═══██╗██╔══██╗██╔════╝
    ██║  ███╗     ██╔████╔██║██║   ██║██████╔╝█████╗
    ██║   ██║     ██║╚██╔╝██║██║   ██║██╔═══╝ ██╔══╝
    ╚██████╔╝     ██║ ╚═╝ ██║╚██████╔╝██║     ███████╗
     ╚═════╝      ╚═╝     ╚═╝ ╚═════╝ ╚═╝     ╚══════╝
  EOF

  puts cyan(art)
  wait(500)
end

# ----------------------------------------------------
#                LOADING BAR SIMULATION
# ----------------------------------------------------
def loading_bar(speed_mb = 3.5, max_gb = 2.1)
  total_mb = (max_gb * 1024).to_i
  current = 0

  puts yellow("Initializing Ruby HyperLoader...")
  wait(700)

  while current < total_mb
    current += speed_mb
    current = total_mb if current > total_mb

    percent = current.to_f / total_mb * 100
    print "\r#{green(progress_bar(current, total_mb))} #{percent.round(2)}% (#{(current / 1024).round(2)}GB / #{max_gb}GB)"
    $stdout.flush

    wait(300)
  end

  puts "\n" + green("✔ Loading Complete.\n")
  wait(500)
end

# ----------------------------------------------------
#                  FILE GENERATION
# ----------------------------------------------------
def generate_files
  dir = "RUBY_C_MODE_FILES"
  Dir.mkdir(dir) unless Dir.exist?(dir)

  puts magenta("\nCreating 70 chaos-phase files...\n")
  wait(400)

  1.upto(70) do |i|
    name = "phase_#{i}_#{rand(10000..99999)}.txt"
    File.write("#{dir}/#{name}", <<~TXT)
      CHAOS PHASE FILE ##{i}
      Timestamp: #{Time.now}
      Random Key: #{rand * 999999}
    TXT

    puts cyan(" - Created #{name}")
    wait(40)
  end

  puts green("\n✔ 70 files created successfully.\n")
end

# ----------------------------------------------------
#                    CHAOS EVENTS
# ----------------------------------------------------
def chaos_events
  events = [
    "📡 Scanning imaginary signal clusters...",
    "🚀 Powering hyper-thrust modules...",
    "🧬 Generating simulated DNA strings...",
    "🔥 Releasing digital flame packets...",
    "🌀 Spinning vortex engine...",
    "🌐 Interlinking phantom network nodes...",
    "✨ Quantum noise amplifier active...",
    "🛰️ Satellite triangulation (FAKE)...",
    "🔮 Temporal crystal oscillation...",
    "💫 Chaos stability: SIMULATED OK"
  ]

  puts red("\nInitiating CHAOS EVENT ENGINE...\n")
  wait(500)

  events.each do |e|
    slow_print(yellow(e), 0.03)
    wait(300)
  end

  puts green("\n✔ Chaos events done.\n")
  wait(600)
end

# ----------------------------------------------------
#                       LEVELING
# ----------------------------------------------------
def leveling
  puts blue("Launching XP Level Simulation...\n")
  wait(400)

  level = 1
  xp = 0

  while level <= 7
    while xp < 100
      print "\rLevel #{level} | XP: #{xp}/100"
      xp += 5
      wait(200)
    end

    puts "\n" + green("LEVEL UP! → #{level + 1}")
    level += 1
    xp = 0
    wait(600)
  end

  puts green("\n✔ Level system complete.\n")
  wait(500)
end

# ----------------------------------------------------
#                ANALYZER / SCAN ENGINE
# ----------------------------------------------------
def analyzer
  puts cyan("Initializing Deep System Analyzer...\n")
  wait(400)

  parts = [
    "Virtual CPU Thermal Map",
    "GPU Parallel Shader Echo",
    "Memory Fragment Rebuilder",
    "Quantum Byte Sampler",
    "Packet Tunnel Emulator",
    "Neural Interface Feedback",
    "Cosmic Bit Normalizer"
  ]

  parts.each do |p|
    slow_print(magenta("[+] #{p}..."), 0.03)

    prog = 0
    while prog < 100
      prog += rand(8..18)
      prog = 100 if prog > 100
      print "\r    Progress: #{prog}%"
      wait(200)
    end
    puts
    wait(200)
  end

  puts green("\n✔ Analyzer finished.\n")
end

# ----------------------------------------------------
#                      MENU
# ----------------------------------------------------
def menu
  slow_print(yellow("Welcome to the C-MODE Ruby Chaos Engine."), 0.03)
  slow_print("This simulation is 100% safe.\n", 0.02)

  print cyan("Start? (Y/N): ")
  ans = STDIN.gets.chomp.downcase
  if ans != "y"
    puts red("Exiting. Weak aura detected...")
    return
  end

  title_screen
  loading_bar

  print cyan("Press ENTER to continue into File Generation...")
  STDIN.gets

  generate_files

  print cyan("Press ENTER to continue into CHAOS MODE...")
  STDIN.gets

  chaos_events

  print cyan("Press ENTER to continue XP Simulation...")
  STDIN.gets

  leveling

  print cyan("Press ENTER to launch the Analyzer...")
  STDIN.gets

  analyzer

  puts green("\nC-MODE RUBY SIMULATION COMPLETE.")
  puts cyan("Files saved in: RUBY_C_MODE_FILES\n")
end

# ----------------------------------------------------
#                     MAIN
# ----------------------------------------------------
menu
