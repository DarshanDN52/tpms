# TPMS Flask Application

This project is a Tire Pressure Monitoring System (TPMS) web application built using Flask. It provides a user-friendly interface to monitor and manage tire pressure data.

## Project Structure

```
tpms-flask-app
├── app
│   ├── __init__.py
│   ├── routes.py
│   ├── static
│   │   ├── css
│   │   │   └── styles.css
│   │   └── js
│   │       └── scripts.js
│   └── templates
│       ├── base.html
│       └── index.html
├── requirements.txt
├── run.py
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd tpms-flask-app
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - On Windows:
     ```
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Usage

To run the application, execute the following command:
```
python run.py
```

The application will be accessible at `http://127.0.0.1:5000/`.

## Features

- Monitor tire pressure in real-time.
- User-friendly interface with responsive design.
- JavaScript enhancements for better user interaction.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or features you'd like to add.

## License

This project is licensed under the MIT License. See the LICENSE file for details.