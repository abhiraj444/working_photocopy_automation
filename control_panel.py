#!/usr/bin/env python3
"""
WhatsApp Print Bot - Control Panel GUI

Simple GUI to start/stop the print bot and print server.
"""

import tkinter as tk
from tkinter import ttk, scrolledtext
import subprocess
import threading
import queue
import os
import sys
from pathlib import Path
import time

class ControlPanel:
    def __init__(self, root):
        self.root = root
        self.root.title("📱 WhatsApp Print Bot - Control Panel")
        self.root.geometry("800x600")
        self.root.resizable(True, True)
        
        # Processes
        self.print_server_process = None
        self.whatsapp_bot_process = None
        self.is_running = False
        
        # Log queue for thread-safe logging
        self.log_queue = queue.Queue()
        
        # Paths
        self.base_dir = Path(__file__).parent
        self.mvp_dir = self.base_dir / "mvp"
        
        # Setup UI
        self.setup_ui()
        
        # Start log monitor
        self.monitor_logs()
        
    def setup_ui(self):
        """Create the user interface"""
        
        # Title
        title_frame = ttk.Frame(self.root, padding="10")
        title_frame.pack(fill=tk.X)
        
        title_label = ttk.Label(
            title_frame, 
            text="📱 WhatsApp Print Bot Control Panel",
            font=('Arial', 16, 'bold')
        )
        title_label.pack()
        
        # Status
        status_frame = ttk.Frame(self.root, padding="10")
        status_frame.pack(fill=tk.X)
        
        self.status_label = ttk.Label(
            status_frame, 
            text="⚪ Status: Stopped",
            font=('Arial', 12),
            foreground='gray'
        )
        self.status_label.pack()
        
        # Control Buttons
        button_frame = ttk.Frame(self.root, padding="10")
        button_frame.pack(fill=tk.X)
        
        self.start_button = ttk.Button(
            button_frame,
            text="▶️ START SERVERS",
            command=self.start_servers,
            width=20
        )
        self.start_button.pack(side=tk.LEFT, padx=5)
        
        self.stop_button = ttk.Button(
            button_frame,
            text="⏹️ STOP SERVERS",
            command=self.stop_servers,
            state=tk.DISABLED,
            width=20
        )
        self.stop_button.pack(side=tk.LEFT, padx=5)
        
        self.clear_button = ttk.Button(
            button_frame,
            text="🗑️ Clear Logs",
            command=self.clear_logs,
            width=15
        )
        self.clear_button.pack(side=tk.LEFT, padx=5)
        
        # Separator
        ttk.Separator(self.root, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=10)
        
        # Log Area
        log_label = ttk.Label(self.root, text="📋 Logs:", font=('Arial', 10, 'bold'))
        log_label.pack(anchor=tk.W, padx=10)
        
        self.log_text = scrolledtext.ScrolledText(
            self.root,
            wrap=tk.WORD,
            width=80,
            height=25,
            font=('Consolas', 9),
            bg='#1e1e1e',
            fg='#d4d4d4',
            insertbackground='white'
        )
        self.log_text.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Bottom Info
        info_frame = ttk.Frame(self.root, padding="5")
        info_frame.pack(fill=tk.X)
        
        info_label = ttk.Label(
            info_frame,
            text="💡 Tip: Keep this window open while the bot is running",
            font=('Arial', 9),
            foreground='gray'
        )
        info_label.pack()
        
        # Initial log
        self.log("Welcome to WhatsApp Print Bot Control Panel")
        self.log(f"Base Directory: {self.base_dir}")
        self.log("Click 'START SERVERS' to begin")
        self.log("")
        
    def log(self, message):
        """Add message to log"""
        timestamp = time.strftime("[%H:%M:%S]")
        self.log_queue.put(f"{timestamp} {message}")
        
    def monitor_logs(self):
        """Monitor log queue and update UI"""
        try:
            while True:
                message = self.log_queue.get_nowait()
                self.log_text.insert(tk.END, message + "\n")
                self.log_text.see(tk.END)
        except queue.Empty:
            pass
        
        # Schedule next check
        self.root.after(100, self.monitor_logs)
        
    def clear_logs(self):
        """Clear the log area"""
        self.log_text.delete(1.0, tk.END)
        self.log("Logs cleared")
        
    def start_servers(self):
        """Start both print server and WhatsApp bot"""
        if self.is_running:
            self.log("⚠️ Servers already running!")
            return
        
        self.log("=" * 60)
        self.log("🚀 Starting servers...")
        self.log("=" * 60)
        
        # Update UI
        self.start_button.config(state=tk.DISABLED)
        self.stop_button.config(state=tk.NORMAL)
        self.status_label.config(text="🟡 Status: Starting...", foreground='orange')
        
        # Start in background thread
        threading.Thread(target=self._start_servers_thread, daemon=True).start()
        
    def _start_servers_thread(self):
        """Background thread to start servers"""
        try:
            # Pre-flight checks
            self.log("🔍 Running pre-flight checks...")
            
            # Check Python
            try:
                subprocess.run(["python", "--version"], capture_output=True, check=True)
                self.log("✅ Python: OK")
            except:
                self.log("❌ Python not found. Please install Python.")
                raise Exception("Python not found")
            
            # Check Node.js
            npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
            try:
                subprocess.run([npm_cmd, "--version"], capture_output=True, check=True, shell=True)
                self.log("✅ Node.js/npm: OK")
            except:
                self.log("❌ Node.js/npm not found. Please install Node.js.")
                raise Exception("Node.js not found")
            
            # Check if mvp/dist exists
            dist_dir = self.mvp_dir / "dist"
            if not dist_dir.exists():
                self.log("❌ TypeScript not compiled. Run: cd mvp && npm run build")
                raise Exception("TypeScript not compiled")
            self.log("✅ TypeScript build: OK")
            
            self.log("")
            
            # Start print server
            self.log("📡 Starting Python Print Server...")
            print_server_cmd = ["python", "print_server.py"]
            
            self.print_server_process = subprocess.Popen(
                print_server_cmd,
                cwd=str(self.base_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.PIPE,
                creationflags=subprocess.CREATE_NO_WINDOW,
                text=True,
                bufsize=1
            )
            
            # Wait for print server to start
            time.sleep(2)
            
            if self.print_server_process.poll() is None:
                self.log("✅ Print Server started successfully")
            else:
                self.log("❌ Print Server failed to start")
                return
            
            # Start WhatsApp bot
            self.log("📱 Starting WhatsApp Bot...")
            
            # On Windows, use npm.cmd instead of npm
            npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
            bot_cmd = [npm_cmd, "run", "start"]
            
            self.whatsapp_bot_process = subprocess.Popen(
                bot_cmd,
                cwd=str(self.mvp_dir),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.PIPE,
                creationflags=subprocess.CREATE_NO_WINDOW,
                text=True,
                bufsize=1
            )
            
            # Wait for bot to start
            time.sleep(3)
            
            if self.whatsapp_bot_process.poll() is None:
                self.log("✅ WhatsApp Bot started successfully")
            else:
                self.log("❌ WhatsApp Bot failed to start")
                return
            
            self.is_running = True
            self.status_label.config(text="🟢 Status: Running", foreground='green')
            
            self.log("")
            self.log("=" * 60)
            self.log("✅ All servers running successfully!")
            self.log("=" * 60)
            self.log("📱 Scan QR code on your WhatsApp to connect")
            self.log("🖨️ Print server listening on http://127.0.0.1:5000")
            self.log("")
            
            # Start log readers
            threading.Thread(target=self._read_print_server_logs, daemon=True).start()
            threading.Thread(target=self._read_bot_logs, daemon=True).start()
            
        except Exception as e:
            self.log(f"❌ Error starting servers: {e}")
            self.status_label.config(text="🔴 Status: Error", foreground='red')
            self.start_button.config(state=tk.NORMAL)
            self.stop_button.config(state=tk.DISABLED)
            
    def _read_print_server_logs(self):
        """Read and display print server logs"""
        if not self.print_server_process:
            return
        
        for line in iter(self.print_server_process.stdout.readline, ''):
            if not line:
                break
            self.log(f"[Print Server] {line.strip()}")
            
    def _read_bot_logs(self):
        """Read and display bot logs"""
        if not self.whatsapp_bot_process:
            return
        
        for line in iter(self.whatsapp_bot_process.stdout.readline, ''):
            if not line:
                break
            self.log(f"[WhatsApp Bot] {line.strip()}")
            
    def stop_servers(self):
        """Stop both servers"""
        if not self.is_running:
            self.log("⚠️ Servers not running!")
            return
        
        self.log("")
        self.log("=" * 60)
        self.log("🛑 Stopping servers...")
        self.log("=" * 60)
        
        # Stop print server
        if self.print_server_process:
            self.log("📡 Stopping Print Server...")
            try:
                self.print_server_process.terminate()
                self.print_server_process.wait(timeout=5)
                self.log("✅ Print Server stopped")
            except:
                self.print_server_process.kill()
                self.log("⚠️ Print Server force killed")
            self.print_server_process = None
        
        # Stop WhatsApp bot
        if self.whatsapp_bot_process:
            self.log("📱 Stopping WhatsApp Bot...")
            try:
                self.whatsapp_bot_process.terminate()
                self.whatsapp_bot_process.wait(timeout=5)
                self.log("✅ WhatsApp Bot stopped")
            except:
                self.whatsapp_bot_process.kill()
                self.log("⚠️ WhatsApp Bot force killed")
            self.whatsapp_bot_process = None
        
        self.is_running = False
        self.status_label.config(text="⚪ Status: Stopped", foreground='gray')
        self.start_button.config(state=tk.NORMAL)
        self.stop_button.config(state=tk.DISABLED)
        
        self.log("")
        self.log("=" * 60)
        self.log("✅ All servers stopped")
        self.log("=" * 60)
        self.log("")
        
    def on_closing(self):
        """Handle window close"""
        if self.is_running:
            self.log("Stopping servers before exit...")
            self.stop_servers()
            time.sleep(1)
        self.root.destroy()


def main():
    root = tk.Tk()
    app = ControlPanel(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()


if __name__ == "__main__":
    main()
