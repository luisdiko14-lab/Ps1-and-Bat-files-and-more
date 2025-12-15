import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, filedialog
import psutil
import subprocess
import time
import datetime
import socket
import os
import platform
import threading

# --- WINSOUND is Windows-specific for a quick sound test ---
try:
    import winsound
except ImportError:
    winsound = None 

class SystemAdminTool:
    def __init__(self, root):
        self.root = root
        self.root.title("Ultimate System Utility (USU) v3.0")
        self.root.geometry("700x600")
        
        style = ttk.Style()
        style.theme_use('clam')
        
        # Initialize tracking variables for Network Speed
        self.last_upload = psutil.net_io_counters().bytes_sent
        self.last_download = psutil.net_io_counters().bytes_recv

        # Create the Tab Controller (Notebook)
        self.notebook = ttk.Notebook(root)
        self.notebook.pack(expand=True, fill='both', padx=10, pady=10)
        
        # --- TAB CONTROLLER SETUP ---
        
        # Original Tabs
        self.tab_process = ttk.Frame(self.notebook); self.notebook.add(self.tab_process, text='Processes')
        self.tab_hardware = ttk.Frame(self.notebook); self.notebook.add(self.tab_hardware, text='Hardware')
        self.tab_power = ttk.Frame(self.notebook); self.notebook.add(self.tab_power, text='Power')
        
        # New Monitoring/Admin Tabs
        self.tab_net_info = ttk.Frame(self.notebook); self.notebook.add(self.tab_net_info, text='Network/Ping')
        self.tab_sys_info = ttk.Frame(self.notebook); self.notebook.add(self.tab_sys_info, text='System Info')
        self.tab_file_util = ttk.Frame(self.notebook); self.notebook.add(self.tab_file_util, text='File Utility')
        self.tab_audio = ttk.Frame(self.notebook); self.notebook.add(self.tab_audio, text='Audio')


        # --- BUILD TABS ---
        self.build_process_tab()
        self.build_hardware_tab()
        self.build_power_tab()
        self.build_network_tab()
        self.build_sys_info_tab()
        self.build_file_utility_tab()
        self.build_audio_tab()

        # Start the recursive update loop
        self.update_metrics()

    # ==========================
    #      TAB BUILDERS
    # ==========================

    def build_process_tab(self):
        """Combined Process Killer and Mini Task Manager."""
        # Frame for Task Killer
        kill_frame = ttk.LabelFrame(self.tab_process, text="Task Terminator", padding=10)
        kill_frame.pack(fill="x", padx=10, pady=10)

        ttk.Label(kill_frame, text="Process Name (e.g. chrome.exe):").pack(side="left", padx=5)
        self.process_entry = ttk.Entry(kill_frame, width=20)
        self.process_entry.pack(side="left", padx=5)
        ttk.Button(kill_frame, text="Kill Process", command=self.kill_custom_process).pack(side="left", padx=5)
        ttk.Button(kill_frame, text="Restart Explorer", command=self.restart_explorer).pack(side="left", padx=5)

        # Frame for Task List
        list_frame = ttk.LabelFrame(self.tab_process, text="Running Processes", padding=10)
        list_frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        ttk.Button(list_frame, text="Refresh Process List", command=self.refresh_task_list).pack(pady=5)
        self.task_text = scrolledtext.ScrolledText(list_frame, width=80, height=20, font=('Courier', 9))
        self.task_text.pack(fill="both", expand=True)

    def build_hardware_tab(self):
        """CPU, GPU, RAM, Disk monitoring with progress bars."""
        frame = ttk.LabelFrame(self.tab_hardware, text="Resource Monitor", padding=20)
        frame.pack(fill="both", expand=True, padx=10, pady=10)

        # CPU
        self.cpu_label = ttk.Label(frame, text="CPU Usage: ...")
        self.cpu_label.pack(anchor="w")
        self.cpu_bar = ttk.Progressbar(frame, orient='horizontal', length=400, mode='determinate')
        self.cpu_bar.pack(pady=5)

        # RAM
        self.ram_label = ttk.Label(frame, text="RAM Usage: ...")
        self.ram_label.pack(anchor="w", pady=(10, 0))
        self.ram_bar = ttk.Progressbar(frame, orient='horizontal', length=400, mode='determinate')
        self.ram_bar.pack(pady=5)

        # Disk
        self.disk_label = ttk.Label(frame, text="Disk (C:) Usage: ...")
        self.disk_label.pack(anchor="w", pady=(10, 0))
        self.disk_bar = ttk.Progressbar(frame, orient='horizontal', length=400, mode='determinate')
        self.disk_bar.pack(pady=5)

        ttk.Separator(frame, orient='horizontal').pack(fill='x', pady=15)
        gpu_name = self.get_gpu_info()
        ttk.Label(frame, text=f"Detected GPU: {gpu_name}", foreground="blue").pack()

    def build_power_tab(self):
        """Uptime, Battery, and Scheduled Shutdown."""
        frame = ttk.LabelFrame(self.tab_power, text="Power & Time", padding=20)
        frame.pack(fill="both", expand=True, padx=10, pady=10)

        # Uptime
        self.uptime_label = ttk.Label(frame, text="System Uptime: ...", font=("Helvetica", 10, "bold"))
        self.uptime_label.pack(pady=10)

        # Battery
        self.battery_label = ttk.Label(frame, text="Battery Status: ...")
        self.battery_label.pack(pady=5)

        ttk.Separator(frame, orient='horizontal').pack(fill='x', pady=20)

        # Scheduled Shutdown
        ttk.Label(frame, text="Schedule Shutdown (Minutes):").pack()
        shutdown_frame = ttk.Frame(frame)
        shutdown_frame.pack(pady=5)
        
        self.shutdown_entry = ttk.Entry(shutdown_frame, width=10)
        self.shutdown_entry.pack(side="left", padx=5)
        
        ttk.Button(shutdown_frame, text="Set Timer", command=self.schedule_shutdown).pack(side="left", padx=5)
        ttk.Button(shutdown_frame, text="Cancel Shutdown", command=self.cancel_shutdown).pack(side="left", padx=5)

    def build_network_tab(self):
        """Network Speed, Adapter Info, and Ping Test."""
        frame = ttk.LabelFrame(self.tab_net_info, text="Network Diagnostics", padding=20)
        frame.pack(fill="both", expand=True, padx=10, pady=10)

        # Live Speed
        speed_frame = ttk.LabelFrame(frame, text="Live Speed (KB/s)", padding=10)
        speed_frame.pack(fill="x", pady=5)
        self.net_sent_label = ttk.Label(speed_frame, text="Upload: ...", font=("Helvetica", 11))
        self.net_sent_label.pack(side="left", padx=20)
        self.net_recv_label = ttk.Label(speed_frame, text="Download: ...", font=("Helvetica", 11))
        self.net_recv_label.pack(side="left", padx=20)

        # Adapter Info
        adapter_frame = ttk.LabelFrame(frame, text="Adapter Info", padding=10)
        adapter_frame.pack(fill="x", pady=10)
        self.adapter_info_text = scrolledtext.ScrolledText(adapter_frame, width=70, height=6, font=('Courier', 8))
        self.adapter_info_text.pack(fill="x")
        self.show_network_adapters() # Populate on load

        # Ping Test
        ping_frame = ttk.LabelFrame(frame, text="Quick Ping Test", padding=10)
        ping_frame.pack(fill="x", pady=10)
        
        ttk.Label(ping_frame, text="Target (e.g. 8.8.8.8):").pack(side="left", padx=5)
        self.ping_entry = ttk.Entry(ping_frame, width=15)
        self.ping_entry.insert(0, "google.com")
        self.ping_entry.pack(side="left", padx=5)
        ttk.Button(ping_frame, text="Ping", command=self.run_ping_test).pack(side="left", padx=5)
        self.ping_result_label = ttk.Label(ping_frame, text="")
        self.ping_result_label.pack(side="left", padx=10)

    def build_sys_info_tab(self):
        """OS, Hardware, and Environment Variables."""
        frame = ttk.LabelFrame(self.tab_sys_info, text="System Configuration", padding=20)
        frame.pack(fill="both", expand=True, padx=10, pady=10)

        # OS and Platform Info
        os_info = f"OS: {platform.system()} {platform.release()} ({platform.version()})"
        os_info += f"\nArchitecture: {platform.machine()}"
        os_info += f"\nUser: {os.getlogin()}"
        os_info += f"\nHostname: {socket.gethostname()}"
        ttk.Label(frame, text=os_info, justify=tk.LEFT, font=("Courier", 10)).pack(anchor="w", pady=5)

        ttk.Separator(frame, orient='horizontal').pack(fill='x', pady=10)

        # Environment Variables
        env_frame = ttk.LabelFrame(frame, text="Key Environment Variables", padding=10)
        env_frame.pack(fill="both", expand=True, pady=10)
        self.env_text = scrolledtext.ScrolledText(env_frame, width=70, height=8, font=('Courier', 8))
        self.env_text.pack(fill="both", expand=True)
        self.show_environment_vars() # Populate on load

    def build_file_utility_tab(self):
        """File/Folder Size Analyzer."""
        frame = ttk.LabelFrame(self.tab_file_util, text="File & Folder Analysis", padding=20)
        frame.pack(fill="both", expand=True, padx=10, pady=10)

        ttk.Label(frame, text="Select Path to Analyze Size:").pack(pady=5)
        
        path_frame = ttk.Frame(frame)
        path_frame.pack(pady=5)
        
        self.path_entry = ttk.Entry(path_frame, width=40)
        self.path_entry.pack(side="left", padx=5)
        
        ttk.Button(path_frame, text="Browse", command=self.browse_path).pack(side="left", padx=5)
        
        ttk.Button(frame, text="Calculate Size", command=self.calculate_path_size).pack(pady=10)

        self.size_result_label = ttk.Label(frame, text="Result: ...", font=("Helvetica", 11, "bold"))
        self.size_result_label.pack(pady=10)

    def build_audio_tab(self):
        """Simple Audio Control and Test."""
        frame = ttk.LabelFrame(self.tab_audio, text="Audio Tools (Windows only)", padding=20)
        frame.pack(fill="both", expand=True, padx=10, pady=10)
        
        # Volume Control (using system command 'nircmd' or similar, highly platform dependent)
        ttk.Label(frame, text="Volume Control (Set to 0-100%):").pack(pady=5)
        self.volume_scale = ttk.Scale(frame, from_=0, to=100, orient='horizontal', length=300, command=self.set_volume_stub)
        self.volume_scale.set(50) # Default to 50%
        self.volume_scale.pack(pady=5)
        self.volume_label = ttk.Label(frame, text="Volume: 50%")
        self.volume_label.pack()

        # Simple Sound Test
        if winsound:
            ttk.Separator(frame, orient='horizontal').pack(fill='x', pady=15)
            ttk.Label(frame, text="Test System Notification:").pack(pady=5)
            ttk.Button(frame, text="Play Beep (440Hz, 500ms)", command=lambda: winsound.Beep(440, 500)).pack(pady=5)
        else:
            ttk.Label(frame, text="Note: Audio test requires the 'winsound' module (Windows).").pack(pady=10)
        
    # ==========================
    #      LOGIC FUNCTIONS
    # ==========================

    def update_metrics(self):
        """The heartbeat: updates stats every second."""
        
        # Hardware Tab Updates
        self.cpu_label.config(text=f"CPU Usage: {psutil.cpu_percent()}%")
        self.cpu_bar['value'] = psutil.cpu_percent()
        ram = psutil.virtual_memory()
        self.ram_label.config(text=f"RAM: {ram.percent}% Used ({round(ram.used/1024**3, 1)} GB)")
        self.ram_bar['value'] = ram.percent
        try:
            disk = psutil.disk_usage('C:\\')
            self.disk_label.config(text=f"C: Drive: {disk.percent}% Full")
            self.disk_bar['value'] = disk.percent
        except: pass

        # Power Tab Updates
        boot_time = psutil.boot_time()
        uptime_seconds = time.time() - boot_time
        uptime_string = str(datetime.timedelta(seconds=int(uptime_seconds)))
        self.uptime_label.config(text=f"System Uptime: {uptime_string}")
        battery = psutil.sensors_battery()
        if battery:
            status = "Plugged In" if battery.power_plugged else "Discharging"
            self.battery_label.config(text=f"Battery: {battery.percent}% ({status})")
        else:
            self.battery_label.config(text="Battery: No Battery Detected (Desktop)")

        # Network Tab Updates (Speed)
        current_net = psutil.net_io_counters()
        bytes_sent = current_net.bytes_sent - self.last_upload
        bytes_recv = current_net.bytes_recv - self.last_download
        
        # Convert bytes/sec to KB/s
        upload_speed = bytes_sent / 1024
        download_speed = bytes_recv / 1024
        
        self.net_sent_label.config(text=f"Upload: {upload_speed:.1f} KB/s")
        self.net_recv_label.config(text=f"Download: {download_speed:.1f} KB/s")
        
        self.last_upload = current_net.bytes_sent
        self.last_download = current_net.bytes_recv

        # Audio Tab Update (Label)
        self.volume_label.config(text=f"Volume: {int(self.volume_scale.get())}% (Actual control requires 3rd party tool)")


        # Run this function again in 1000ms (1 second)
        self.root.after(1000, self.update_metrics)

    # --- Process/OS Functions ---
    def kill_custom_process(self):
        proc_name = self.process_entry.get()
        if not proc_name: return
        try:
            subprocess.run(f"taskkill /F /IM {proc_name}", shell=True, check=True)
            messagebox.showinfo("Success", f"Killed {proc_name}")
        except subprocess.CalledProcessError:
            messagebox.showerror("Error", f"Could not find {proc_name}")

    def restart_explorer(self):
        if messagebox.askyesno("Confirm", "Restart Explorer? Screen will flicker."):
            subprocess.run("taskkill /F /IM explorer.exe", shell=True)
            subprocess.Popen("explorer.exe", shell=True)

    def refresh_task_list(self):
        """Populates the text box with running processes."""
        self.task_text.delete(1.0, tk.END)
        self.task_text.insert(tk.END, f"{'PID':<10} {'Name':<30} {'CPU %':<10} {'Status'}\n")
        self.task_text.insert(tk.END, "="*65 + "\n")
        
        for proc in psutil.process_iter(['pid', 'name', 'status', 'cpu_percent']):
            try:
                info = proc.info
                cpu_percent_formatted = f"{info['cpu_percent']:.1f}"
                line = f"{info['pid']:<10} {info['name'][:29]:<30} {cpu_percent_formatted:<10} {info['status']}\n"
                self.task_text.insert(tk.END, line)
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                pass
    
    # --- Hardware Info Functions ---
    def get_gpu_info(self):
        try:
            cmd = "wmic path win32_VideoController get name"
            process = subprocess.check_output(cmd, shell=True).decode().strip()
            lines = process.split('\n')
            return lines[1].strip() if len(lines) > 1 else "Unknown GPU"
        except:
            return "Info Unavailable"

    # --- Power Functions ---
    def schedule_shutdown(self):
        mins = self.shutdown_entry.get()
        if mins.isdigit():
            seconds = int(mins) * 60
            subprocess.run(f"shutdown /s /t {seconds}", shell=True)
            messagebox.showinfo("Timer Set", f"System will shutdown in {mins} minutes.")
        else:
            messagebox.showerror("Error", "Please enter a number.")

    def cancel_shutdown(self):
        subprocess.run("shutdown /a", shell=True)
        messagebox.showinfo("Cancelled", "Shutdown timer cancelled.")

    # --- Network Functions ---
    def show_network_adapters(self):
        """Populates adapter info text box."""
        self.adapter_info_text.delete(1.0, tk.END)
        
        for name, addrs in psutil.net_if_addrs().items():
            self.adapter_info_text.insert(tk.END, f"Adapter: {name}\n")
            for addr in addrs:
                if addr.family == socket.AF_INET:
                    self.adapter_info_text.insert(tk.END, f"  IPv4: {addr.address}\n")
                elif addr.family == psutil.AF_LINK: # MAC address
                    self.adapter_info_text.insert(tk.END, f"  MAC: {addr.address}\n")
            self.adapter_info_text.insert(tk.END, "-"*40 + "\n")

    def run_ping_test(self):
        target = self.ping_entry.get()
        if not target:
            self.ping_result_label.config(text="Enter a target.")
            return

        # Use a thread to prevent GUI freeze during ping
        threading.Thread(target=self._execute_ping, args=(target,)).start()

    def _execute_ping(self, target):
        try:
            # Use 'ping -n 1' for Windows, or 'ping -c 1' for Linux/Mac
            count_flag = '-n 1' if platform.system() == "Windows" else '-c 1'
            command = ["ping", count_flag, target]
            
            result = subprocess.run(command, capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                # Look for latency in the output
                latency_match = [line for line in result.stdout.split('\n') if 'time=' in line]
                latency = latency_match[0].split('time=')[-1].split(' ')[0] if latency_match else "Success"
                self.ping_result_label.config(text=f"Success! Latency: {latency}", foreground="green")
            else:
                self.ping_result_label.config(text="Failure: Host Unreachable/Timeout", foreground="red")
        except subprocess.TimeoutExpired:
            self.ping_result_label.config(text="Timeout", foreground="red")
        except Exception as e:
            self.ping_result_label.config(text=f"Error: {str(e)}", foreground="red")

    # --- System Info Functions ---
    def show_environment_vars(self):
        """Displays key system environment variables."""
        self.env_text.delete(1.0, tk.END)
        key_vars = ['PATH', 'HOMEPATH', 'USERNAME', 'COMPUTERNAME', 'TEMP', 'PROGRAMFILES']
        
        for var in key_vars:
            value = os.environ.get(var, 'N/A')
            self.env_text.insert(tk.END, f"{var:<15} = {value}\n")

    # --- File Utility Functions ---
    def browse_path(self):
        folder_path = filedialog.askdirectory()
        if folder_path:
            self.path_entry.delete(0, tk.END)
            self.path_entry.insert(0, folder_path)

    def calculate_path_size(self):
        path = self.path_entry.get()
        if not os.path.exists(path):
            self.size_result_label.config(text="Error: Path not found.", foreground="red")
            return
        
        # Use a thread to prevent GUI freeze during large folder calculation
        threading.Thread(target=self._execute_size_calculation, args=(path,)).start()
        self.size_result_label.config(text="Calculating... Please wait.", foreground="orange")

    def _execute_size_calculation(self, start_path='.'):
        """Calculates the total size of a directory/file."""
        total_size = 0
        try:
            if os.path.isfile(start_path):
                total_size = os.path.getsize(start_path)
            elif os.path.isdir(start_path):
                for dirpath, dirnames, filenames in os.walk(start_path):
                    for f in filenames:
                        fp = os.path.join(dirpath, f)
                        if not os.path.islink(fp):
                            total_size += os.path.getsize(fp)
            
            # Convert to human-readable format
            def format_size(size):
                for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
                    if size < 1024.0:
                        return f"{size:.2f} {unit}"
                    size /= 1024.0
                return f"{size:.2f} PB"

            formatted_size = format_size(total_size)
            self.size_result_label.config(text=f"Total Size: {formatted_size}", foreground="green")
        except Exception as e:
            self.size_result_label.config(text=f"Error calculating size: {str(e)}", foreground="red")

    # --- Audio Functions ---
    def set_volume_stub(self, value):
        """Stub function: Actual volume control is complex and platform-dependent.
        Requires external libraries (like pycaw for Windows) or system commands."""
        percent = int(float(value))
        self.volume_label.config(text=f"Volume: {percent}%")
        # To make this functional, a dedicated system volume library would be needed here.


if __name__ == "__main__":
    root = tk.Tk()
    app = SystemAdminTool(root)
    root.mainloop()