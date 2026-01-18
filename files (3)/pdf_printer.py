#!/usr/bin/env python3
"""
PDF Printer with Working GDI Printing (Fixed Bitmap Issue)
"""

import os
import sys
import subprocess
from pathlib import Path
from queue import Queue, PriorityQueue
from threading import Thread, Event, Lock
import time
from typing import Optional
import tempfile

# Find Ghostscript
def find_ghostscript():
    """Find Ghostscript installation on Windows"""
    possible_paths = [
        r"C:\Program Files\gs",
        r"C:\Program Files (x86)\gs",
    ]
    
    for base_path in possible_paths:
        if os.path.exists(base_path):
            for item in os.listdir(base_path):
                gs_path = os.path.join(base_path, item, "bin", "gswin64c.exe")
                if os.path.exists(gs_path):
                    return gs_path
                gs_path = os.path.join(base_path, item, "bin", "gswin32c.exe")
                if os.path.exists(gs_path):
                    return gs_path
    
    try:
        result = subprocess.run(["gswin64c", "--version"], 
                              capture_output=True, text=True, timeout=2)
        if result.returncode == 0:
            return "gswin64c"
    except:
        pass
    
    return None

GHOSTSCRIPT_PATH = find_ghostscript()

if not GHOSTSCRIPT_PATH:
    print("ERROR: Ghostscript not found!")
    print("Install from: https://ghostscript.com/releases/gsdnld.html")
    sys.exit(1)

print(f"Found Ghostscript: {GHOSTSCRIPT_PATH}")

try:
    from pdf2image import convert_from_path
    from pdf2image.pdf2image import pdfinfo_from_path
    from PIL import Image, ImageWin
    import win32print
    import win32ui
    import win32con
except ImportError as e:
    print(f"ERROR: {e}")
    print("Install: pip install pdf2image pillow pywin32")
    sys.exit(1)


class WorkingPDFPrinter:
    """PDF Printer with working GDI implementation"""
    
    def __init__(self, printer_name: Optional[str] = None, dpi: int = 300, threads: int = 4):
        self.printer_name = printer_name or win32print.GetDefaultPrinter()
        self.dpi = dpi
        self.threads = threads
        
        # Pipeline queues
        self.job_queue = Queue()
        self.image_queue = PriorityQueue()
        
        # Control
        self.stop_flag = Event()
        self.stats_lock = Lock()
        self.print_lock = Lock()  # Serialize printing to avoid GDI conflicts
        
        # Stats
        self.converted = 0
        self.printed = 0
        self.total = 0
        
        # Print job state
        self.printer_dc = None
        self.current_job = None
        
        print(f"\nWorking PDF Printer Ready:")
        print(f"  Printer: {self.printer_name}")
        print(f"  DPI: {self.dpi}")
        print(f"  Threads: {self.threads}\n")
    
    def convert_worker(self, worker_id: int):
        """Convert PDF pages to images"""
        while not self.stop_flag.is_set():
            try:
                job = self.job_queue.get(timeout=0.5)
            except:
                continue
            
            pdf_path, page_num, total = job
            
            try:
                start = time.time()
                
                images = convert_from_path(
                    pdf_path,
                    dpi=self.dpi,
                    first_page=page_num,
                    last_page=page_num
                )
                
                if images:
                    self.image_queue.put((page_num, images[0]))
                    
                    with self.stats_lock:
                        self.converted += 1
                        elapsed = time.time() - start
                        print(f"[Worker {worker_id}] Page {page_num}/{total} "
                              f"converted in {elapsed:.1f}s ({self.converted}/{total})")
                
            except Exception as e:
                print(f"[Worker {worker_id}] ERROR on page {page_num}: {e}")
            
            self.job_queue.task_done()
    
    def print_worker(self):
        """Print images in correct order"""
        next_page = 1
        buffer = {}
        
        while not self.stop_flag.is_set() or not self.image_queue.empty():
            try:
                page_num, image = self.image_queue.get(timeout=0.5)
            except:
                continue
            
            buffer[page_num] = image
            
            while next_page in buffer:
                img = buffer.pop(next_page)
                
                try:
                    start = time.time()
                    self._print_image_working(img, next_page)
                    
                    with self.stats_lock:
                        self.printed += 1
                        elapsed = time.time() - start
                        print(f"[Print] Page {next_page}/{self.total} "
                              f"sent in {elapsed:.1f}s ({self.printed}/{self.total})")
                    
                except Exception as e:
                    print(f"[Print] ERROR on page {next_page}: {e}")
                    import traceback
                    traceback.print_exc()
                
                next_page += 1
            
            self.image_queue.task_done()
    
    def _print_image_working(self, image: Image.Image, page_num: int):
        """Print image using PIL's ImageWin module - the working method!"""
        
        with self.print_lock:  # Serialize GDI calls
            # Convert to RGB
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Create/get printer DC
            if page_num == 1:
                self.printer_dc = win32ui.CreateDC()
                self.printer_dc.CreatePrinterDC(self.printer_name)
                self.printer_dc.StartDoc(f"PDF Print Job")
            
            try:
                # Start page
                self.printer_dc.StartPage()
                
                # Get printer dimensions (in pixels)
                printer_width = self.printer_dc.GetDeviceCaps(win32con.HORZRES)
                printer_height = self.printer_dc.GetDeviceCaps(win32con.VERTRES)
                
                # Get image dimensions
                img_width, img_height = image.size
                
                # Calculate scaling to fit page while maintaining aspect ratio
                scale = min(printer_width / img_width, printer_height / img_height)
                new_width = int(img_width * scale)
                new_height = int(img_height * scale)
                
                # Center on page
                x = (printer_width - new_width) // 2
                y = (printer_height - new_height) // 2
                
                # Use PIL's ImageWin module to create a DIB
                dib = ImageWin.Dib(image)
                
                # Draw the image - this is the correct way!
                dib.draw(self.printer_dc.GetHandleOutput(), (x, y, x + new_width, y + new_height))
                
                # End page
                self.printer_dc.EndPage()
                
                # Close job after last page
                if page_num == self.total:
                    self.printer_dc.EndDoc()
                    self.printer_dc.DeleteDC()
                    self.printer_dc = None
                
            except Exception as e:
                print(f"Print error: {e}")
                # Try to clean up on error
                try:
                    if self.printer_dc:
                        self.printer_dc.AbortDoc()
                        self.printer_dc.DeleteDC()
                        self.printer_dc = None
                except:
                    pass
                raise
    
    def print_pdf(self, pdf_path: str):
        """Print a PDF file"""
        pdf_path = str(Path(pdf_path).resolve())
        
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF not found: {pdf_path}")
        
        print(f"{'=' * 70}")
        print(f"Processing: {Path(pdf_path).name}")
        print(f"{'=' * 70}\n")
        
        # Get page count
        try:
            info = pdfinfo_from_path(pdf_path)
            self.total = info['Pages']
            print(f"Total pages: {self.total}\n")
        except Exception as e:
            print(f"ERROR getting page count: {e}")
            return
        
        # Reset stats
        self.converted = 0
        self.printed = 0
        self.stop_flag.clear()
        self.printer_dc = None
        
        # Start workers
        workers = []
        for i in range(self.threads):
            w = Thread(target=self.convert_worker, args=(i,), daemon=True)
            w.start()
            workers.append(w)
        
        printer_thread = Thread(target=self.print_worker, daemon=True)
        printer_thread.start()
        
        # Queue all pages
        start_time = time.time()
        for page in range(1, self.total + 1):
            self.job_queue.put((pdf_path, page, self.total))
        
        # Wait for completion
        self.job_queue.join()
        print("\n✓ All pages converted")
        
        self.image_queue.join()
        print("✓ All pages sent to printer")
        
        # Make sure print job is closed
        with self.print_lock:
            if self.printer_dc:
                try:
                    self.printer_dc.EndDoc()
                    self.printer_dc.DeleteDC()
                except:
                    pass
                self.printer_dc = None
        
        self.stop_flag.set()
        
        total_time = time.time() - start_time
        print(f"\n{'=' * 70}")
        print(f"COMPLETED: {self.printed}/{self.total} pages in {total_time:.1f}s")
        print(f"Average: {total_time/self.total:.2f}s per page")
        print(f"{'=' * 70}\n")
    
    def print_folder(self, folder_path: str):
        """Print all PDFs in folder"""
        pdfs = sorted(Path(folder_path).glob("*.pdf"))
        
        if not pdfs:
            print(f"No PDFs found in {folder_path}")
            return
        
        print(f"\nFound {len(pdfs)} PDF files\n")
        
        for i, pdf in enumerate(pdfs, 1):
            print(f"\n[{i}/{len(pdfs)}] Starting: {pdf.name}")
            try:
                self.print_pdf(str(pdf))
            except KeyboardInterrupt:
                raise
            except Exception as e:
                print(f"ERROR: {e}\n")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="Working GDI PDF Printer")
    parser.add_argument('path', help='PDF file or folder')
    parser.add_argument('--dpi', type=int, default=300, help='DPI (default: 300)')
    parser.add_argument('--printer', help='Printer name')
    parser.add_argument('--threads', type=int, default=4, help='Threads (default: 4)')
    parser.add_argument('--list', action='store_true', help='List printers')
    
    args = parser.parse_args()
    
    if args.list:
        print("\nAvailable Printers:")
        print("-" * 50)
        printers = [p[2] for p in win32print.EnumPrinters(2)]
        default = win32print.GetDefaultPrinter()
        for i, p in enumerate(printers, 1):
            mark = " [DEFAULT]" if p == default else ""
            print(f"{i}. {p}{mark}")
        print("-" * 50)
        return
    
    try:
        printer = WorkingPDFPrinter(
            printer_name=args.printer,
            dpi=args.dpi,
            threads=args.threads
        )
    except Exception as e:
        print(f"ERROR: {e}")
        return
    
    path = Path(args.path)
    try:
        if path.is_file():
            printer.print_pdf(str(path))
        elif path.is_dir():
            printer.print_folder(str(path))
        else:
            print(f"ERROR: Invalid path: {args.path}")
    except KeyboardInterrupt:
        print("\n\nStopped by user")
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()