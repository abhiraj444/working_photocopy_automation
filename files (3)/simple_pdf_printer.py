#!/usr/bin/env python3
"""
Simplified High-Performance PDF Printer
Better Windows integration and error handling
"""

import os
import sys
from pathlib import Path
from queue import Queue, PriorityQueue
from threading import Thread, Event, Lock
import time
from typing import Optional

try:
    from pdf2image import convert_from_path
    from pdf2image.pdf2image import pdfinfo_from_path
    from PIL import Image
    import win32print
    import win32api
except ImportError:
    print("ERROR: Missing required libraries!")
    print("\nPlease install:")
    print("  pip install pdf2image pillow pywin32")
    print("\nAnd install Ghostscript:")
    print("  https://ghostscript.com/releases/gsdnld.html")
    sys.exit(1)


class SimplePDFPrinter:
    """Simplified PDF printer focused on Windows compatibility"""
    
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
        
        # Stats
        self.converted = 0
        self.printed = 0
        self.total = 0
        
        print(f"PDF Printer Ready:")
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
                
                # Convert single page
                images = convert_from_path(
                    pdf_path,
                    dpi=self.dpi,
                    first_page=page_num,
                    last_page=page_num
                )
                
                if images:
                    # Add to print queue with priority (page number)
                    self.image_queue.put((page_num, images[0]))
                    
                    with self.stats_lock:
                        self.converted += 1
                        print(f"[Convert {worker_id}] Page {page_num}/{total} "
                              f"done in {time.time()-start:.1f}s "
                              f"({self.converted}/{total})")
                
            except Exception as e:
                print(f"[Convert {worker_id}] ERROR on page {page_num}: {e}")
            
            self.job_queue.task_done()
    
    def print_worker(self):
        """Print images in correct order"""
        next_page = 1
        buffer = {}  # Out-of-order page buffer
        
        while not self.stop_flag.is_set() or not self.image_queue.empty():
            try:
                page_num, image = self.image_queue.get(timeout=0.5)
            except:
                continue
            
            # Buffer the page
            buffer[page_num] = image
            
            # Print all ready consecutive pages
            while next_page in buffer:
                img = buffer.pop(next_page)
                
                try:
                    start = time.time()
                    self._send_to_printer(img, next_page)
                    
                    with self.stats_lock:
                        self.printed += 1
                        print(f"[Print] Page {next_page}/{self.total} "
                              f"sent in {time.time()-start:.1f}s "
                              f"({self.printed}/{self.total})")
                    
                except Exception as e:
                    print(f"[Print] ERROR on page {next_page}: {e}")
                
                next_page += 1
            
            self.image_queue.task_done()
    
    def _send_to_printer(self, image: Image.Image, page_num: int):
        """Send PIL image to Windows printer using simplified method"""
        # Convert to RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Save to temporary BMP (Windows handles this well)
        temp_file = f"temp_page_{page_num}.bmp"
        image.save(temp_file, "BMP")
        
        try:
            # Use win32api to print (simpler than GDI)
            win32api.ShellExecute(
                0,
                "print",
                temp_file,
                f'/d:"{self.printer_name}"',
                ".",
                0
            )
            
            # Small delay to ensure spooler picks it up
            time.sleep(0.2)
            
        finally:
            # Clean up temp file after a delay
            time.sleep(1)
            try:
                os.remove(temp_file)
            except:
                pass
    
    def print_pdf(self, pdf_path: str):
        """Print a PDF file"""
        pdf_path = str(Path(pdf_path).resolve())
        
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF not found: {pdf_path}")
        
        print(f"=" * 60)
        print(f"Processing: {Path(pdf_path).name}")
        print(f"=" * 60)
        
        # Get page count
        try:
            info = pdfinfo_from_path(pdf_path)
            self.total = info['Pages']
            print(f"Pages: {self.total}\n")
        except Exception as e:
            print(f"ERROR getting page count: {e}")
            return
        
        # Reset stats
        self.converted = 0
        self.printed = 0
        self.stop_flag.clear()
        
        # Start workers
        workers = []
        for i in range(self.threads):
            w = Thread(target=self.convert_worker, args=(i,), daemon=True)
            w.start()
            workers.append(w)
        
        printer = Thread(target=self.print_worker, daemon=True)
        printer.start()
        
        # Queue all pages
        start_time = time.time()
        for page in range(1, self.total + 1):
            self.job_queue.put((pdf_path, page, self.total))
        
        # Wait for completion
        self.job_queue.join()
        print("\n✓ All pages converted")
        
        self.image_queue.join()
        print("✓ All pages sent to printer")
        
        # Stop workers
        self.stop_flag.set()
        
        total_time = time.time() - start_time
        print(f"\n{'=' * 60}")
        print(f"COMPLETED: {self.printed}/{self.total} pages in {total_time:.1f}s")
        print(f"Average: {total_time/self.total:.1f}s per page")
        print(f"{'=' * 60}\n")
    
    def print_folder(self, folder_path: str):
        """Print all PDFs in a folder"""
        pdfs = sorted(Path(folder_path).glob("*.pdf"))
        
        if not pdfs:
            print(f"No PDFs found in {folder_path}")
            return
        
        print(f"\nFound {len(pdfs)} PDF files\n")
        
        for i, pdf in enumerate(pdfs, 1):
            print(f"\n[{i}/{len(pdfs)}] {pdf.name}")
            try:
                self.print_pdf(str(pdf))
            except Exception as e:
                print(f"ERROR: {e}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Fast PDF Printer with Pipeline Architecture"
    )
    parser.add_argument('path', help='PDF file or folder')
    parser.add_argument('--dpi', type=int, default=300, 
                       help='DPI for conversion (default: 300)')
    parser.add_argument('--printer', help='Printer name')
    parser.add_argument('--threads', type=int, default=4,
                       help='Conversion threads (default: 4)')
    parser.add_argument('--list', action='store_true',
                       help='List available printers')
    
    args = parser.parse_args()
    
    # List printers
    if args.list:
        print("\nAvailable Printers:")
        print("-" * 40)
        for i, p in enumerate(win32print.EnumPrinters(2), 1):
            name = p[2]
            default = " [DEFAULT]" if name == win32print.GetDefaultPrinter() else ""
            print(f"{i}. {name}{default}")
        print("-" * 40)
        return
    
    # Create printer
    try:
        printer = SimplePDFPrinter(
            printer_name=args.printer,
            dpi=args.dpi,
            threads=args.threads
        )
    except Exception as e:
        print(f"ERROR initializing printer: {e}")
        return
    
    # Process
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


if __name__ == "__main__":
    main()
