# AI Coding Agent Instructions for TPMS Flask Application

## Project Overview
This project is a Tire Pressure Monitoring System (TPMS) web application built using Flask. It provides a user-friendly interface to monitor and manage tire pressure, temperature, and humidity data for multiple tires. The application includes a dashboard view with charts and live data.

### Key Components
- **Flask Application**:
  - `app/__init__.py`: Initializes the Flask app and registers blueprints.
   - `app/routes.py`: Defines routes for the dashboard (`/`) and configuration endpoints.
- **Templates**:
  - `app/templates/base.html`: Base template for consistent layout.
  - `app/templates/index.html`: Dashboard view for monitoring tire data.
   - `app/templates/3d.html`: 3D truck view (Three.js) — generates a rotatable truck using user input like `2,4,4`.
- **Static Files**:
  - `app/static/css/styles.css`: Styles for the dashboard.
    - `app/static/js/scripts.js`: JavaScript for dynamic updates in the dashboard.
   - Note: The 3D view uses Three.js from CDN and is implemented in `app/templates/3d.html` as an inline module script.

## Developer Workflows
### Running the Application
1. Navigate to the project directory:
   ```sh
   cd d:\internship\tpms
   ```
2. Create and activate a virtual environment:
   ```sh
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
4. Run the Flask application:
   ```sh
   python run.py
   ```
5. Access the application at `http://127.0.0.1:5000/`.

## Project-Specific Conventions
**Blueprints**: All routes are defined in `app/routes.py` and registered in `app/__init__.py`.
**Dynamic Updates**: JavaScript (`app/static/js/scripts.js`) dynamically updates tyre values and charts based on configuration.
**Styling**: Use `styles.css` for dashboard-specific styles.

## Integration Points
- **Chart.js**: Used for rendering graphs in the dashboard.
- **AJAX**: JavaScript fetches data dynamically for live updates.
- **Form Handling**: The `/config` endpoint processes configuration data submitted via forms.

## Examples
### Adding a New Route
1. Define the route in `app/routes.py`:
   ```python
   @bp.route('/new_route')
   def new_route():
       return render_template('new_template.html')
   ```
2. Create the corresponding template in `app/templates/new_template.html`.

### Updating the Dashboard View
- Modify `app/static/js/scripts.js` to adjust chart/datum logic.
- Update `app/templates/index.html` and `app/static/css/styles.css` for layout changes.

## Notes for AI Agents
- Follow the existing structure for routes, templates, and static files.
- Ensure compatibility with Flask's `url_for` function for linking static files and routes.
- Use the `base.html` template to maintain a consistent layout across pages.