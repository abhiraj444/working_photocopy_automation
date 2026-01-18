#!/usr/bin/env python3
"""
Print Server - HTTP API for PDF Printing

Wraps the working pdf_printer.py script and exposes it via HTTP
so the TypeScript WhatsApp bot can call it.

Usage:
    python print_server.py

API Endpoints:
    POST /print - Print a PDF file
        Body: {
            "file_path": "C:/path/to/file.pdf",
            "dpi": 150,
            "threads": 16,
            "printer": "best"
        }

    GET /health - Health check
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
from pathlib import Path
import threading
import time

# Import the working PDF printer
from pdf_printer import WorkingPDFPrinter

app = Flask(__name__)
CORS(app)  # Allow requests from TypeScript app

# Track print jobs
active_jobs = {}
job_lock = threading.Lock()


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'Print server is running'
    })


@app.route('/print', methods=['POST'])
def print_pdf():
    """
    Print a PDF file
    
    Request body:
    {
        "file_path": "C:/path/to/file.pdf",
        "dpi": 150,              // optional, default: 300
        "threads": 16,           // optional, default: 4
        "printer": "best"        // optional, default: system default
    }
    """
    try:
        data = request.get_json()
        
        # Validate request
        if not data or 'file_path' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing file_path in request body'
            }), 400
        
        file_path = data['file_path']
        
        # Check if file exists
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': f'File not found: {file_path}'
            }), 404
        
        # Get parameters
        dpi = data.get('dpi', 300)
        threads = data.get('threads', 4)
        printer = data.get('printer', None)
        margin_mm = data.get('margin_mm', 0)  # Margin in millimeters
        
        # Create printer instance
        pdf_printer = WorkingPDFPrinter(
            printer_name=printer,
            dpi=dpi,
            threads=threads,
            margin_mm=margin_mm
        )
        
        # Print the PDF (synchronously - will block until done)
        print(f"\n{'=' * 70}")
        print(f"Print request received from WhatsApp bot")
        print(f"File: {file_path}")
        print(f"DPI: {dpi}, Threads: {threads}, Printer: {printer or 'default'}")
        print(f"{'=' * 70}\n")
        
        pdf_printer.print_pdf(file_path)
        
        return jsonify({
            'success': True,
            'message': 'PDF printed successfully',
            'file': file_path
        })
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/print-async', methods=['POST'])
def print_pdf_async():
    """
    Print a PDF file asynchronously (non-blocking)
    Returns immediately with a job_id
    """
    try:
        data = request.get_json()
        
        if not data or 'file_path' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing file_path in request body'
            }), 400
        
        file_path = data['file_path']
        
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': f'File not found: {file_path}'
            }), 404
        
        dpi = data.get('dpi', 300)
        threads = data.get('threads', 4)
        printer = data.get('printer', None)
        
        # Generate job ID
        job_id = f"job_{int(time.time() * 1000)}"
        
        # Store job status
        with job_lock:
            active_jobs[job_id] = {
                'status': 'queued',
                'file_path': file_path,
                'started_at': time.time()
            }
        
        # Start print in background thread
        def print_worker():
            try:
                with job_lock:
                    active_jobs[job_id]['status'] = 'printing'
                
                pdf_printer = WorkingPDFPrinter(
                    printer_name=printer,
                    dpi=dpi,
                    threads=threads
                )
                
                pdf_printer.print_pdf(file_path)
                
                with job_lock:
                    active_jobs[job_id]['status'] = 'completed'
                    
            except Exception as e:
                with job_lock:
                    active_jobs[job_id]['status'] = 'failed'
                    active_jobs[job_id]['error'] = str(e)
                print(f"Print job {job_id} failed: {e}")
        
        thread = threading.Thread(target=print_worker, daemon=True)
        thread.start()
        
        return jsonify({
            'success': True,
            'job_id': job_id,
            'message': 'Print job queued'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/job/<job_id>', methods=['GET'])
def get_job_status(job_id):
    """Get status of a print job"""
    with job_lock:
        if job_id not in active_jobs:
            return jsonify({
                'success': False,
                'error': 'Job not found'
            }), 404
        
        return jsonify({
            'success': True,
            'job': active_jobs[job_id]
        })


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='PDF Print Server')
    parser.add_argument('--port', type=int, default=5000, help='Port to run on (default: 5000)')
    parser.add_argument('--host', default='127.0.0.1', help='Host to bind to (default: 127.0.0.1)')
    
    args = parser.parse_args()
    
    print("\n" + "=" * 70)
    print("PDF Print Server Starting")
    print("=" * 70)
    print(f"Host: {args.host}")
    print(f"Port: {args.port}")
    print(f"\nEndpoints:")
    print(f"  GET  http://{args.host}:{args.port}/health")
    print(f"  POST http://{args.host}:{args.port}/print")
    print(f"  POST http://{args.host}:{args.port}/print-async")
    print("=" * 70 + "\n")
    
    app.run(host=args.host, port=args.port, debug=False)


if __name__ == '__main__':
    main()
