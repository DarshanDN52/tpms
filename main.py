from app import create_app
from gui import main as gui_main

app = create_app()

if __name__ == '__main__':
    # Running Flask app in a separate thread
    from threading import Thread
    flask_thread = Thread(target=lambda: app.run(debug=True, use_reloader=False))
    flask_thread.daemon = True
    flask_thread.start()

    # Running the Tkinter GUI
    gui_main()
