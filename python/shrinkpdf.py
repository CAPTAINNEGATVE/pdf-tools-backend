import sys
import os
import subprocess
import platform

def compress_with_ghostscript(input_path, output_path, quality):
    # Auto-detect Ghostscript command based on OS
    gs_command = "gswin64c" if platform.system() == "Windows" else "gs"

    command = [
        gs_command,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS=/{quality}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_path}",
        input_path
    ]

    result = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return result.returncode == 0

def get_file_size_kb(path):
    return os.path.getsize(path) // 1024

def compress_pdf_to_target(input_path, output_base, target_kb):
    qualities = ['screen', 'ebook', 'printer', 'prepress']
    results = []

    for q in qualities:
        temp_output = f"{output_base}_{q}.pdf"
        success = compress_with_ghostscript(input_path, temp_output, q)
        if success:
            size_kb = get_file_size_kb(temp_output)
            results.append((abs(target_kb - size_kb), size_kb, temp_output))

    if not results:
        print("Compression failed on all quality settings.")
        return False, None

    # Pick file with size closest to target
    _, final_size, best_file = min(results, key=lambda x: x[0])
    final_output = output_base + "-compressed.pdf"
    os.rename(best_file, final_output)

    # Delete other temp files
    for _, _, f in results:
        if os.path.exists(f) and f != final_output:
            os.remove(f)

    print(f"✅ Success: Final size = {final_size} KB")
    return True, final_size

# ---- ENTRY POINT ----
if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python shrinkpdf.py input.pdf output_base target_kb")
        sys.exit(1)

    input_path = sys.argv[1]
    output_base = sys.argv[2]
    target_kb = int(sys.argv[3])

    success, final_size = compress_pdf_to_target(input_path, output_base, target_kb)
    if not success:
        sys.exit(1)
