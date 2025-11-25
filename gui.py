import tkinter as tk
from tkinter import ttk

def main():
    root = tk.Tk()
    root.title("TPMS Control Panel")

    main_frame = ttk.Frame(root, padding="10")
    main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))

    start_button = ttk.Button(main_frame, text="Start TPMS")
    start_button.grid(row=0, column=0, sticky=tk.W)

    status_label = ttk.Label(main_frame, text="Status: Not Running")
    status_label.grid(row=1, column=0, sticky=tk.W)

    def start_tpms():
        status_label.config(text="Status: Running")
        # The Flask app is already running in a separate thread
        # This button is just for show for now
        start_button.config(state="disabled")

    start_button.config(command=start_tpms)

    root.mainloop()

if __name__ == '__main__':
    main()
